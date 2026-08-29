/**
 * usage-logger — canonical source.
 *
 * Copy this file verbatim into every app that calls Claude (Q, Profiler,
 * Mettle, Spar, Signal, Wordcross). It records one row per Claude call to the
 * central `claude-usage` Turso DB, tagged with { app, feature }, so spend can
 * be attributed to the exact thing that caused it.
 *
 * Cost is computed locally from the price table below — this module NEVER
 * calls a paid API. If USAGE_DB_URL is unset it silently no-ops, so a missing
 * env var degrades to "no tracking", never an error.
 *
 * Zero dependencies: writes go over Turso's HTTP pipeline with `fetch`, so the
 * same file drops into a Next route, an edge runtime or a plain node script
 * without pulling in @libsql/client.
 *
 * Env:
 *   USAGE_DB_URL    libsql://claude-usage-<org>.turso.io
 *   USAGE_DB_TOKEN  Turso auth token
 */

// ---- price table ($ per 1M tokens). cacheRead = in*0.1, 5m cacheWrite = in*1.25
const PRICES: Record<string, { in: number; out: number }> = {
  "claude-fable-5": { in: 10, out: 50 },
  "claude-opus-5": { in: 5, out: 25 },
  "claude-sonnet-5": { in: 2, out: 10 },
  "claude-opus-4-8": { in: 5, out: 25 },
  "claude-opus-4-7": { in: 5, out: 25 },
  "claude-opus-4-6": { in: 5, out: 25 },
  "claude-sonnet-4": { in: 3, out: 15 }, // matches sonnet-4, -4-5, -4-6, -4-20250514
  "claude-haiku-4-5": { in: 1, out: 5 },
};

type Usage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
};
type MessageLike = {
  usage?: Usage;
  model?: string;
  id?: string;
  _request_id?: string | null;
};

function priceFor(model: string): { in: number; out: number } {
  let best = { in: 3, out: 15 }; // sane default if model unrecognized
  let bestLen = -1;
  for (const [prefix, p] of Object.entries(PRICES)) {
    if (model.startsWith(prefix) && prefix.length > bestLen) {
      best = p;
      bestLen = prefix.length;
    }
  }
  return best;
}

function costUsd(model: string, u: Usage): number {
  const p = priceFor(model);
  const inTok = u.input_tokens ?? 0;
  const outTok = u.output_tokens ?? 0;
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const cacheWrite = u.cache_creation_input_tokens ?? 0;
  return (
    (inTok * p.in +
      outTok * p.out +
      cacheRead * p.in * 0.1 +
      cacheWrite * p.in * 1.25) /
    1_000_000
  );
}

type SqlArg = number | string | null;
function toArg(v: SqlArg) {
  if (v === null) return { type: "null", value: null };
  if (typeof v === "number") {
    return Number.isInteger(v)
      ? { type: "integer", value: String(v) }
      : { type: "float", value: v };
  }
  return { type: "text", value: v };
}

const INSERT = `INSERT INTO usage_events
  (ts, app, feature, model, input_tokens, output_tokens,
   cache_read_tokens, cache_write_tokens, cost_usd, latency_ms,
   request_id, source)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;

async function record(
  app: string,
  feature: string,
  msg: MessageLike,
  latencyMs: number,
  source?: string,
): Promise<void> {
  const url = process.env.USAGE_DB_URL;
  if (!url) return; // unconfigured -> no-op (never throws)
  const u = msg.usage ?? {};
  const model = msg.model ?? "unknown";
  const args: SqlArg[] = [
    Date.now(),
    app,
    feature,
    model,
    u.input_tokens ?? 0,
    u.output_tokens ?? 0,
    u.cache_read_input_tokens ?? 0,
    u.cache_creation_input_tokens ?? 0,
    costUsd(model, u),
    latencyMs,
    msg._request_id ?? msg.id ?? null,
    source ?? null,
  ];
  try {
    await fetch(`${url.replace(/^libsql:/, "https:").replace(/\/$/, "")}/v2/pipeline`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.USAGE_DB_TOKEN ?? ""}`,
      },
      body: JSON.stringify({
        requests: [
          { type: "execute", stmt: { sql: INSERT, args: args.map(toArg) } },
          { type: "close" },
        ],
      }),
    });
  } catch {
    // A logging system must never break the app. Swallow.
  }
}

const pending = new Set<Promise<void>>();

// `after` keeps a Vercel function alive until the write lands. Resolved once at
// module load rather than per call: registering it has to be synchronous, or the
// function can freeze before the write is handed over. Stays undefined outside
// Next (plain node scripts), where flushUsage() is what waits.
let afterFn: ((work: Promise<unknown>) => void) | undefined;
void import("next/server")
  .then((m) => {
    afterFn = m.after;
  })
  .catch(() => {});

/** Run the write without blocking the response; survive function freeze on Vercel. */
function schedule(work: Promise<void>): void {
  const tracked = work.catch(() => {});
  pending.add(tracked);
  void tracked.finally(() => pending.delete(tracked));
  try {
    afterFn?.(tracked);
  } catch {
    // Called outside a request scope — the write is already in flight.
  }
}

/**
 * Await any in-flight usage writes. Call before a short-lived process exits
 * (CLI scripts, one-shot crons); Next request handlers don't need it.
 */
export async function flushUsage(): Promise<void> {
  await Promise.all([...pending]);
}

/**
 * Wrap a non-streaming `messages.create()` / `messages.parse()` call.
 *   const msg = await trackCreate("q", "email-draft", anthropic.messages.create({...}));
 */
export async function trackCreate<T extends MessageLike>(
  app: string,
  feature: string,
  call: Promise<T>,
  opts?: { source?: string },
): Promise<T> {
  const start = Date.now();
  const msg = await call;
  schedule(record(app, feature, msg, Date.now() - start, opts?.source));
  return msg;
}

/**
 * Wrap a streaming `messages.stream()`. Returns the stream untouched; logging
 * hangs off finalMessage() and never disturbs the caller's own iteration or
 * finalMessage() call (the SDK caches it).
 *   const stream = trackStream("mettle", "coach-response", anthropic.messages.stream({...}));
 */
export function trackStream<S extends { finalMessage(): Promise<MessageLike> }>(
  app: string,
  feature: string,
  stream: S,
  opts?: { source?: string },
): S {
  const start = Date.now();
  stream
    .finalMessage()
    .then((msg) => schedule(record(app, feature, msg, Date.now() - start, opts?.source)))
    .catch(() => {});
  return stream;
}
