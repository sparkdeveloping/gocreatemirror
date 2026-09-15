import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, noStoreHeaders } from "@/lib/admin-api";
import { readTeamSchedule, resetTeamSchedule, saveTeamSchedule } from "@/lib/team-schedule-store";
import { isTeamSchedule } from "@/lib/team-schedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ schedule: await readTeamSchedule() }, { headers: noStoreHeaders });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json().catch(() => null) as { action?: string; schedule?: unknown } | null;
  if (body?.action === "reset") return NextResponse.json({ schedule: await resetTeamSchedule() }, { headers: noStoreHeaders });
  if (!body || !isTeamSchedule(body.schedule)) return NextResponse.json({ error: "Invalid team schedule." }, { status: 400, headers: noStoreHeaders });
  return NextResponse.json({ schedule: await saveTeamSchedule(body.schedule) }, { headers: noStoreHeaders });
}
