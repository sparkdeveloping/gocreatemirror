import { NextResponse } from "next/server";
import { requireAdmin, noStoreHeaders } from "@/lib/admin-api";
import { publishLive } from "@/lib/mirror-store";
import { isScreenDefinition } from "@/lib/screen-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: { screen?: unknown } = {};
  try { body = await request.json(); } catch {}
  if (!isScreenDefinition(body.screen)) {
    return NextResponse.json({ error: "Invalid live screen." }, { status: 400, headers: noStoreHeaders });
  }
  try {
    const state = await publishLive(body.screen);
    return NextResponse.json({ state }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not publish live screen." }, { status: 500, headers: noStoreHeaders });
  }
}
