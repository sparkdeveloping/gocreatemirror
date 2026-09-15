import { NextResponse } from "next/server";
import { requireAdmin, noStoreHeaders } from "@/lib/admin-api";
import { answerText } from "@/lib/assistant-engine";
import { readSystemSettings, writeAssistantState } from "@/lib/device-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json().catch(() => ({})) as { text?: string };
  const text = String(body.text || "").trim().slice(0, 3000);
  if (!text) return NextResponse.json({ error: "Question is required." }, { status: 400, headers: noStoreHeaders });
  const settings = await readSystemSettings();
  await writeAssistantState({ phase: "thinking", transcript: settings.showTranscript ? text : "", reply: "", speak: false, interactionId: `admin-${Date.now()}` });
  try {
    const result = await answerText(text);
    const state = await writeAssistantState({ phase: "speaking", transcript: settings.showTranscript ? text : "", reply: result.reply, speak: settings.speakResponses, interactionId: `admin-${Date.now()}` });
    return NextResponse.json({ ...result, state }, { headers: noStoreHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assistant request failed.";
    await writeAssistantState({ phase: "error", transcript: text, reply: message, speak: true });
    return NextResponse.json({ error: message }, { status: 502, headers: noStoreHeaders });
  }
}
