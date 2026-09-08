/**
 * Two jobs, both cheap enough to belong in one proxy.
 *
 * Next 16 renamed the `middleware` file convention to `proxy`; this file was
 * migrated with it. The docs are explicit that a proxy auth check is optimistic
 * only, so the team API routes re-check the cookie themselves in lib/team-auth.
 *
 * 1. Sets the flag that marks a visitor as James rather than a stranger, so the
 *    usage ledger can separate his own spend from real demand. Visit any page
 *    with `?internal=1` once; `?internal=0` clears it. Read back by
 *    `requestSource()` in lib/request-source.ts, which explains why a cookie is
 *    the right instrument here.
 *
 * 2. Gates the team reviewer behind one shared password. The public reviewer at
 *    `/` is untouched; only `/team`, `/t/*` and the team API need the cookie.
 */
import { NextResponse, type NextRequest } from "next/server";
import { INTERNAL_COOKIE } from "@/lib/request-source";
import { TEAM_COOKIE, teamCookieValue } from "@/lib/team-auth";

const YEAR = 60 * 60 * 24 * 365;

const GATED = [
  /^\/team(\/|$)/,
  /^\/t\//,
  /^\/api\/team-evaluate$/,
  /^\/api\/team-review$/,
];

function isGated(pathname: string): boolean {
  if (pathname === "/team/login") return false;
  return GATED.some((pattern) => pattern.test(pathname));
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isGated(pathname)) {
    const expected = teamCookieValue();
    const supplied = req.cookies.get(TEAM_COOKIE)?.value;
    if (!expected || supplied !== expected) {
      // The API answers with a status the client can act on; pages get the form.
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Session expired. Reload the page and sign in again." },
          { status: 401 }
        );
      }
      const login = req.nextUrl.clone();
      login.pathname = "/team/login";
      login.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(login);
    }
  }

  const res = NextResponse.next();
  const flag = req.nextUrl.searchParams.get("internal");
  if (flag === "1") {
    res.cookies.set(INTERNAL_COOKIE, "1", { maxAge: YEAR, path: "/", sameSite: "lax" });
  } else if (flag === "0") {
    res.cookies.delete(INTERNAL_COOKIE);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
