import { NextResponse } from "next/server";
import { requireAdmin, noStoreHeaders } from "@/lib/admin-api";
import { deleteCustomScreen, listCustomScreens, saveCustomScreen } from "@/lib/mirror-store";
import { isScreenDefinition } from "@/lib/screen-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ screens: await listCustomScreens() }, { headers: noStoreHeaders });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: { action?: unknown; screen?: unknown; id?: unknown } = {};
  try { body = await request.json(); } catch {}

  if (body.action === "save") {
    if (!isScreenDefinition(body.screen)) {
      return NextResponse.json({ error: "Invalid screen definition." }, { status: 400, headers: noStoreHeaders });
    }
    try {
      const screen = await saveCustomScreen(body.screen);
      return NextResponse.json({ screen, screens: await listCustomScreens() }, { headers: noStoreHeaders });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save screen." }, { status: 500, headers: noStoreHeaders });
    }
  }

  if (body.action === "delete" && typeof body.id === "string") {
    await deleteCustomScreen(body.id);
    return NextResponse.json({ ok: true, screens: await listCustomScreens() }, { headers: noStoreHeaders });
  }

  return NextResponse.json({ error: "Unknown screen action." }, { status: 400, headers: noStoreHeaders });
}
