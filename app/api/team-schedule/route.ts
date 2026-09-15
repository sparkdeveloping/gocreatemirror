import { NextResponse } from "next/server";
import { readTeamSchedule } from "@/lib/team-schedule-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const schedule = await readTeamSchedule();
  return NextResponse.json({ schedule }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate", "CDN-Cache-Control": "no-store" },
  });
}
