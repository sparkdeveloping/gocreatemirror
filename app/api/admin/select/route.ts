import { NextResponse } from "next/server";
import { requireAdmin, noStoreHeaders } from "@/lib/admin-api";
import { publishCustomScreen, publishTemplate } from "@/lib/mirror-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: { kind?: unknown; id?: unknown } = {};
  try { body = await request.json(); } catch {}
  const kind = body.kind;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id || (kind !== "template" && kind !== "custom")) {
    return NextResponse.json({ error: "Select a valid template or custom screen." }, { status: 400, headers: noStoreHeaders });
  }
  try {
    const state = kind === "template" ? await publishTemplate(id) : await publishCustomScreen(id);
    return NextResponse.json({ state }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not publish screen." }, { status: 400, headers: noStoreHeaders });
  }
}
