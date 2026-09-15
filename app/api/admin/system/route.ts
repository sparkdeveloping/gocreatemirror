import { NextResponse } from "next/server";
import { requireAdmin, noStoreHeaders } from "@/lib/admin-api";
import { readAssistantState, readDeviceStatus, readSystemSettings, writeSystemSettings } from "@/lib/device-store";
import { deviceTokenConfigured } from "@/lib/device-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const [settings, device, assistant] = await Promise.all([readSystemSettings(), readDeviceStatus(), readAssistantState()]);
  return NextResponse.json({
    settings,
    device,
    assistant,
    deviceTokenConfigured: deviceTokenConfigured(),
    groqConfigured: Boolean(process.env.GROQ_API_KEY?.trim()),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    aiProvider: process.env.AI_PROVIDER || "groq",
  }, { headers: noStoreHeaders });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const settings = await writeSystemSettings(body && typeof body === "object" ? body : {});
  return NextResponse.json({ settings }, { headers: noStoreHeaders });
}
