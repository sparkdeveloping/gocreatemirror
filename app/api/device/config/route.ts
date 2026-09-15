import { NextResponse } from "next/server";
import { verifyDeviceToken } from "@/lib/device-auth";
import { readSystemSettings } from "@/lib/device-store";
import { noStoreHeaders } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!verifyDeviceToken(request)) return NextResponse.json({ error: "Unauthorized device." }, { status: 401, headers: noStoreHeaders });
  return NextResponse.json(await readSystemSettings(), { headers: noStoreHeaders });
}
