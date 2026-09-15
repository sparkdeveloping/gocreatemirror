import { NextResponse } from "next/server";
import { verifyDeviceToken } from "@/lib/device-auth";
import { readAssistantState, writeAssistantState } from "@/lib/device-store";
import { noStoreHeaders } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await readAssistantState(), { headers: noStoreHeaders });
}

export async function POST(request: Request) {
  if (!verifyDeviceToken(request)) return NextResponse.json({ error: "Unauthorized device." }, { status: 401, headers: noStoreHeaders });
  const body = await request.json().catch(() => ({}));
  return NextResponse.json(await writeAssistantState(body && typeof body === "object" ? body : {}), { headers: noStoreHeaders });
}
