import { NextResponse } from "next/server";
import { requireAdmin, noStoreHeaders } from "@/lib/admin-api";
import { readSystemSettings, writeAssistantState } from "@/lib/device-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json().catch(() => ({})) as { mode?: string; text?: string };
  const settings = await readSystemSettings();
  if (body.mode === "listen") {
    const state = await writeAssistantState({ phase: "listening", transcript: "", reply: "", speak: false, interactionId: `test-${Date.now()}` });
    return NextResponse.json({ state }, { headers: noStoreHeaders });
  }
  const text = String(body.text || "GoCreateMirror voice output is working.").slice(0, 500);
  const state = await writeAssistantState({ phase: "speaking", transcript: "", reply: text, speak: settings.speakResponses, interactionId: `test-${Date.now()}` });
  return NextResponse.json({ state }, { headers: noStoreHeaders });
}
