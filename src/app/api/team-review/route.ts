import { NextRequest, NextResponse } from "next/server";
import { getTeamReview } from "@/lib/redis";
import { hasTeamAccess } from "@/lib/team-auth";

export async function GET(request: NextRequest) {
  if (!(await hasTeamAccess())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "No id provided" }, { status: 400 });
  }

  const data = await getTeamReview(id);
  if (!data) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
