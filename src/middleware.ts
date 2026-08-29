/**
 * Sets the flag that marks a visitor as James rather than a stranger, so the
 * usage ledger can separate his own spend from real demand.
 *
 * Visit any page with `?internal=1` once; `?internal=0` clears it. Read back
 * by `requestSource()` in lib/request-source.ts, which explains why a cookie
 * is the right instrument here.
 */
import { NextResponse, type NextRequest } from "next/server";
import { INTERNAL_COOKIE } from "@/lib/request-source";

const YEAR = 60 * 60 * 24 * 365;

export function middleware(req: NextRequest) {
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
