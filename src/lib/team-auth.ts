/**
 * One shared password for the team reviewer.
 *
 * The cookie holds a derivation of the password rather than the password itself,
 * so a copied cookie does not hand over the phrase people type. It is a fast
 * non-cryptographic hash, not a security boundary: the boundary here is the
 * password, and the whole scheme assumes the team can be trusted with it. The
 * gate exists to keep drafts off the open web, not to withstand an attacker.
 *
 * Synchronous by necessity: middleware compares the cookie on every gated request
 * and the edge runtime's crypto.subtle is async.
 */
export const TEAM_COOKIE = "sowhat_team";

export function teamPassword(): string {
  return (process.env.TEAM_PASSWORD || "").trim();
}

export function teamCookieValue(): string | null {
  const password = teamPassword();
  if (!password) return null;
  return hash(`sowhat-team:${password}`);
}

export function checkPassword(supplied: string): boolean {
  const expected = teamPassword();
  if (!expected) return false;
  return supplied.trim() === expected;
}

/** FNV-1a, 32-bit, hex. Deterministic and dependency-free. */
function hash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
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
  const expected = teamCookieValue();
  if (!expected) return false;
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  return jar.get(TEAM_COOKIE)?.value === expected;
}
