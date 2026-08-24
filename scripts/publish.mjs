#!/usr/bin/env node
/**
 * Terminal → web bridge for the So What reviewer.
 *
 * The review itself happens inside Claude Code, on the subscription, costing no API
 * tokens — the skill reads TASTE.md and the distilled prompt in src/lib/evaluate.ts and
 * applies the judgment directly. This script is the only part that touches the network:
 * it writes the finished review into the same `sowhat:<id>` key the web app reads, so it
 * is live and shareable at whatsthesowhat.jamesraybould.me/r/<id>.
 *
 * Usage:
 *   node publish.mjs --file <review.json>   → writes it, prints the URL
 *   node publish.mjs --show <id>            → print a stored review
 *   node publish.mjs --list                 → recent reviews
 */

import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const SITE = "https://whatsthesowhat.jamesraybould.me";

for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m) process.env[m[1]] ??= m[2];
}

const URL_ = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;
if (!URL_ || !TOKEN) {
  console.error("Missing KV_REST_API_URL / KV_REST_API_TOKEN in .env.local");
  process.exit(1);
}

async function redis(args) {
  const res = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.map(String)),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`redis ${res.status}: ${await res.text()}`);
  const { result, error } = await res.json();
  if (error) throw new Error(`redis: ${error}`);
  return result;
}

/** Mirrors calculateOverall + ratingName in src/lib/types.ts. */
const calculateOverall = (intent, delivery, narrative) =>
  Math.round((intent / 5) * 20 + (delivery / 5) * 50 + (narrative / 5) * 30);

function ratingName(score) {
  if (score >= 90) return "Crystal Clear";
  if (score >= 80) return "On Point";
  if (score >= 70) return "Getting There";
  if (score >= 60) return "Hazy";
  if (score >= 40) return "Muddled";
  if (score >= 20) return "Lost";
  return "Nope";
}

const args = process.argv.slice(2);

if (args[0] === "--show") {
  const raw = await redis(["GET", `sowhat:${args[1]}`]);
  if (!raw) {
    console.error("No review at that id.");
    process.exit(1);
  }
  console.log(JSON.stringify(typeof raw === "string" ? JSON.parse(raw) : raw, null, 2));
  process.exit(0);
}

if (args[0] === "--list") {
  const keys = (await redis(["KEYS", "sowhat:*"])) ?? [];
  console.log(`${keys.length} stored:`);
  for (const k of keys.slice(0, 40)) console.log(`  ${SITE}/r/${k.replace("sowhat:", "")}`);
  process.exit(0);
}

if (args[0] !== "--file" || !args[1]) {
  console.error("Usage: publish.mjs --file <review.json> | --show <id> | --list");
  process.exit(1);
}

let evaluation;
try {
  evaluation = JSON.parse(fs.readFileSync(args[1], "utf8"));
} catch (err) {
  console.error(`Could not read review JSON: ${err.message}`);
  process.exit(1);
}

// A review that reaches a shareable URL half-built is worse than one that failed loudly.
for (const field of ["mirror_lead", "verdict"]) {
  if (!evaluation[field]) {
    console.error(`Review must include ${field}.`);
    process.exit(1);
  }
}
const s = evaluation.scores;
if (!s || ["intent", "delivery", "narrative"].some((k) => typeof s[k] !== "number")) {
  console.error("Review must include scores: { intent, delivery, narrative } as numbers 0.5-5.0.");
  process.exit(1);
}
for (const [k, v] of Object.entries(s)) {
  if (v < 0.5 || v > 5 || Math.round(v * 2) !== v * 2) {
    console.error(`scores.${k} must be 0.5-5.0 in 0.5 increments (got ${v}).`);
    process.exit(1);
  }
}
if (!Array.isArray(evaluation.categories) || !evaluation.categories.length) {
  console.error("Review must include categories: [{ name, score, headline, feedback, actions }].");
  process.exit(1);
}
for (const c of evaluation.categories) {
  if (!c.name || typeof c.score !== "number" || !c.headline || !c.feedback) {
    console.error(`Category "${c.name ?? "?"}" is missing name, score, headline or feedback.`);
    process.exit(1);
  }
  c.actions ??= [];
  c.improvement ??= c.actions[0] ?? "";
}
evaluation.mirror_bullets ??= [];
evaluation.rewrites ??= [];
evaluation.red_team ??= [];

// Derived exactly as the web app derives them, so terminal and site never disagree.
evaluation.overall = calculateOverall(s.intent, s.delivery, s.narrative);
evaluation.rating_name = ratingName(evaluation.overall);

// Same id shape as src/app/api/evaluate/route.ts.
const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

await redis([
  "SET",
  `sowhat:${id}`,
  JSON.stringify({ evaluation, createdAt: new Date().toISOString() }),
]);

console.log(id);
console.log(`${SITE}/r/${id}`);
console.log(`${evaluation.overall}/100 — ${evaluation.rating_name}`);
