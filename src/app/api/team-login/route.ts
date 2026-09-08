import { NextRequest, NextResponse } from "next/server";
import { TEAM_COOKIE, checkPassword, teamCookieValue } from "@/lib/team-auth";
import { countLoginAttempt } from "@/lib/redis";

const YEAR = 60 * 60 * 24 * 365;
const ATTEMPTS_PER_HOUR = 10;

function clientIp(request: NextRequest): string {
  // Vercel sets x-forwarded-for; the first entry is the client. Falling back to a
  // shared bucket means a request with no IP is limited alongside every other
  // such request, which is the safe direction.
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  const expected = await teamCookieValue();
  if (!expected) {
    return NextResponse.json(
      { error: "The reviewer has no password configured yet. Ask James." },
      { status: 503 }
    );
  }

  if (!(await countLoginAttempt(clientIp(request), ATTEMPTS_PER_HOUR))) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in an hour." },
      { status: 429 }
    );
  }

  // Constant-time inside checkPassword, so a wrong password reveals nothing
  // through how long the response takes.
  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(TEAM_COOKIE, expected, {
    maxAge: YEAR,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
