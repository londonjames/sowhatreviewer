/**
 * One shared password for the team reviewer.
 *
 * The cookie holds a SHA-256 derivation of the password rather than the password
 * itself, so a copied cookie does not hand over the phrase people type, and the
 * value carries enough entropy that guessing it is not a route in. The boundary
 * is still the password: the scheme assumes the team can be trusted with it, and
 * exists to keep unpublished drafts off the open web.
 *
 * Async throughout because the proxy runs on the edge runtime, where the only
 * digest available is `crypto.subtle`.
 */
export const TEAM_COOKIE = "sowhat_team";

export function teamPassword(): string {
  return (process.env.TEAM_PASSWORD || "").trim();
}

/**
 * A fixed salt, so the cookie is not a bare hash of a guessable phrase that would
 * fall to a rainbow table. It is compiled in rather than configured: a second env
 * var that could go missing would silently invalidate every session.
 */
const SALT = "sowhat-team-v1";

export async function teamCookieValue(): Promise<string | null> {
  const password = teamPassword();
  if (!password) return null;
  return sha256Hex(`${SALT}:${password}`);
}

/** Constant-time, so a wrong password reveals nothing through response timing. */
export function checkPassword(supplied: string): boolean {
  const expected = teamPassword();
  if (!expected) return false;
  return timingSafeEqual(supplied.trim(), expected);
}

export function timingSafeEqual(a: string, b: string): boolean {
  // Comparing lengths first would leak the length, so compare over the longer of
  // the two and fold any length difference into the result.
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * The authoritative check, run inside the route handlers.
 *
 * The proxy redirects unauthenticated page requests, but the Next docs are
 * explicit that a proxy check is optimistic: it runs at a network boundary in
 * front of the app and is not a substitute for checking in the handler. The
 * expensive thing here is an Opus call, so the API verifies for itself.
 */
export async function hasTeamAccess(): Promise<boolean> {
  const expected = await teamCookieValue();
  if (!expected) return false;
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const supplied = jar.get(TEAM_COOKIE)?.value;
  return !!supplied && timingSafeEqual(supplied, expected);
}
