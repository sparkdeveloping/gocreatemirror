import { NextResponse } from "next/server";
import { verifyDeviceToken } from "@/lib/device-auth";
import { writeAssistantState } from "@/lib/device-store";
import { noStoreHeaders } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!verifyDeviceToken(request)) return NextResponse.json({ error: "Unauthorized device." }, { status: 401, headers: noStoreHeaders });
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: "GROQ_API_KEY is not configured." }, { status: 503, headers: noStoreHeaders });

  const form = await request.formData();
  const input = form.get("file");
  if (!(input instanceof File)) return NextResponse.json({ error: "Audio file is required." }, { status: 400, headers: noStoreHeaders });
  if (input.size > 12 * 1024 * 1024) return NextResponse.json({ error: "Audio file is too large." }, { status: 413, headers: noStoreHeaders });

  await writeAssistantState({ phase: "thinking", transcript: "", reply: "", speak: false });

  const upstream = new FormData();
  upstream.append("file", input, input.name || "question.wav");
  upstream.append("model", process.env.GROQ_STT_MODEL?.trim() || "whisper-large-v3-turbo");
  upstream.append("response_format", "json");
  upstream.append("language", "en");
  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: upstream,
  });
  const payload = await response.json().catch(() => ({})) as { text?: string; error?: { message?: string } };
  if (!response.ok) {
    const message = payload.error?.message || `Transcription failed (${response.status}).`;
    await writeAssistantState({ phase: "error", reply: message, speak: true });
    return NextResponse.json({ error: message }, { status: 502, headers: noStoreHeaders });
  }
  const text = String(payload.text || "").trim();
  await writeAssistantState({ phase: "thinking", transcript: text, reply: "", speak: false });
  return NextResponse.json({ text }, { headers: noStoreHeaders });
}
