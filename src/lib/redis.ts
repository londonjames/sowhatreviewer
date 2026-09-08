import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

export async function saveReview(
  id: string,
  data: Record<string, unknown>
): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    await r.set(`sowhat:${id}`, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export async function getReview(
  id: string
): Promise<Record<string, unknown> | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const data = await r.get<string>(`sowhat:${id}`);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

/**
 * The team reviewer's own store. A separate prefix from `sowhat:` so a team
 * review and a public review can never collide on a generated id.
 */
export async function saveTeamReview(
  id: string,
  data: Record<string, unknown>
): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    await r.set(`teamreview:${id}`, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export async function getTeamReview(
  id: string
): Promise<Record<string, unknown> | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const data = await r.get<string>(`teamreview:${id}`);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

/**
 * Daily submission cap.
 *
 * The team share one password, so there is no per-person quota to enforce and
 * nothing stopping a loop from running up an Opus bill overnight. The counter
 * expires with the day it counts, so it needs no cleanup.
 *
 * Returns the count after incrementing. A Redis outage returns 0, which lets the
 * review through: losing the cap is a better failure than blocking the product.
 */
export async function countTeamReviewToday(limit: number): Promise<{
  count: number;
  allowed: boolean;
}> {
  const r = getRedis();
  if (!r) return { count: 0, allowed: true };
  const key = `teamreview:count:${new Date().toISOString().slice(0, 10)}`;
  try {
    const count = await r.incr(key);
    // Set the expiry on first use only; re-setting it each time would slide the
    // window and let a busy day never reset.
    if (count === 1) await r.expire(key, 60 * 60 * 36);
    return { count, allowed: count <= limit };
  } catch {
    return { count: 0, allowed: true };
  }
}

/**
 * Login attempt limiting, per IP per hour.
 *
 * One shared password is guessable given enough tries, and the login endpoint is
 * the only place those tries can be made. The window is an hour so a fat-fingered
 * teammate is never locked out for long, and the counter expires with it.
 *
 * A Redis outage returns allowed, matching the daily cap: losing the limiter is a
 * better failure than locking the team out of their own tool.
 */
export async function countLoginAttempt(
  ip: string,
  limit: number
): Promise<boolean> {
  const r = getRedis();
  if (!r) return true;
  const hour = new Date().toISOString().slice(0, 13);
  try {
    const count = await r.incr(`teamlogin:${hour}:${ip}`);
    if (count === 1) await r.expire(`teamlogin:${hour}:${ip}`, 60 * 60);
    return count <= limit;
  } catch {
    return true;
  }
}
