import { NextResponse } from "next/server";
import { requireAdmin, noStoreHeaders } from "@/lib/admin-api";
import { hasPersistentMirrorStore, listCustomScreens, readMirrorState } from "@/lib/mirror-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const [state, screens] = await Promise.all([readMirrorState(), listCustomScreens()]);
  return NextResponse.json({
    state,
    screens,
    persistent: hasPersistentMirrorStore(),
    store: hasPersistentMirrorStore() ? "firebase-realtime-database" : "memory-fallback",
  }, { headers: noStoreHeaders });
}
