/**
 * Is this call James, or somebody else?
 *
 * Spend on a public app is only worth acting on once you know whose it is.
 * $6 of Profiler is fine if strangers are rating their LinkedIn profiles and a
 * waste if it is James doing something `/profiler` would have done for free —
 * and the usage ledger cannot tell those apart without being told.
 *
 * There is no login here, so the signal is a cookie James sets once by visiting
 * any page with `?internal=1` (and clears with `?internal=0`). Anyone could set
 * it, which is fine: this is cost attribution, not access control, and nobody
 * else has a reason to.
 *
 * Anything unrecognised counts as external. Undercounting his own usage is the
 * safe direction — it leaves spend looking like real demand, which prompts a
 * question, rather than hiding it.
 */
import { cookies } from "next/headers";

export const INTERNAL_COOKIE = "jr_internal";

export type RequestSource = "internal" | "external";

export async function requestSource(): Promise<RequestSource> {
  try {
    const jar = await cookies();
    return jar.get(INTERNAL_COOKIE)?.value === "1" ? "internal" : "external";
  } catch {
    // Called outside a request scope (a script, a build). Not a browser, so
    // not an external visitor either — but "external" would be a lie, and
    // "internal" is the truthful answer for anything James runs himself.
    return "internal";
  }
}
