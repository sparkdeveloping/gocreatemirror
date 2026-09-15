import { NextResponse } from "next/server";
import { verifyDeviceToken } from "@/lib/device-auth";
import { answerText, answerWithVision } from "@/lib/assistant-engine";
import { readSystemSettings, writeAssistantState } from "@/lib/device-store";
import { noStoreHeaders } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!verifyDeviceToken(request)) return NextResponse.json({ error: "Unauthorized device." }, { status: 401, headers: noStoreHeaders });
  const body = await request.json().catch(() => null) as null | { text?: string; imageBase64?: string; mimeType?: string; interactionId?: string; localTts?: boolean };
  const text = String(body?.text || "").trim().slice(0, 3000);
  if (!text) return NextResponse.json({ error: "Question text is required." }, { status: 400, headers: noStoreHeaders });

  const settings = await readSystemSettings();
  if (!settings.assistantEnabled) return NextResponse.json({ error: "Assistant is disabled." }, { status: 409, headers: noStoreHeaders });

  await writeAssistantState({ phase: "thinking", transcript: text, reply: "", interactionId: body?.interactionId, speak: false });
  try {
    const image = String(body?.imageBase64 || "");
    const result = image ? await answerWithVision(text, image, body?.mimeType || "image/jpeg") : await answerText(text);
    const state = await writeAssistantState({
      phase: "speaking",
      transcript: settings.showTranscript ? text : "",
      reply: result.reply,
      visualPrompt: result.visualUsed ? "CAMERA USED ON REQUEST" : "",
      interactionId: body?.interactionId,
      speak: settings.speakResponses && !body?.localTts,
    });
    return NextResponse.json({ ...result, state }, { headers: noStoreHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assistant request failed.";
    await writeAssistantState({ phase: "error", transcript: text, reply: message, interactionId: body?.interactionId, speak: true });
    return NextResponse.json({ error: message }, { status: 502, headers: noStoreHeaders });
  }
}
