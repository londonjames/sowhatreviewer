import { NextRequest, NextResponse } from "next/server";
import { TEAM_COOKIE, checkPassword, teamCookieValue } from "@/lib/team-auth";

const YEAR = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  const expected = teamCookieValue();
  if (!expected) {
    return NextResponse.json(
      { error: "The reviewer has no password configured yet. Ask James." },
      { status: 503 }
    );
  }

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
