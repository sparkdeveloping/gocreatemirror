import { NextResponse } from "next/server";
import { noStoreHeaders } from "@/lib/admin-api";
import { hasPersistentMirrorStore, readMirrorState } from "@/lib/mirror-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const state = await readMirrorState();
  return NextResponse.json({
    ...state,
    persistent: hasPersistentMirrorStore(),
    store: "firebase-realtime-database",
    realtime: true,
  }, { headers: noStoreHeaders });
}
