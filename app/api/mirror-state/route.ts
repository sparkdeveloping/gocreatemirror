import { NextResponse } from "next/server";
import { isLayoutId } from "@/lib/layouts";
import { hasPersistentMirrorStore, readMirrorState, writeMirrorState } from "@/lib/mirror-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export async function GET() {
  const state = await readMirrorState();
  return NextResponse.json(
    {
      ...state,
      persistent: hasPersistentMirrorStore(),
      store: "firebase-realtime-database",
      realtime: true,
    },
    { headers: noStoreHeaders },
  );
}

export async function POST(request: Request) {
  let body: { layout?: unknown; pin?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400, headers: noStoreHeaders });
  }

  const configuredPin = process.env.ADMIN_PIN?.trim();
  const submittedPin = request.headers.get("x-admin-pin") || (typeof body.pin === "string" ? body.pin : "");
  if (configuredPin && submittedPin !== configuredPin) {
    return NextResponse.json({ error: "Incorrect admin PIN." }, { status: 401, headers: noStoreHeaders });
  }

  if (!isLayoutId(body.layout)) {
    return NextResponse.json({ error: "Unknown layout." }, { status: 400, headers: noStoreHeaders });
  }

  try {
    const state = await writeMirrorState(body.layout);
    return NextResponse.json(
      {
        ...state,
        persistent: true,
        store: "firebase-realtime-database",
        realtime: true,
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          "Could not save mirror state. Add Firebase Admin credentials in Vercel, then redeploy.",
      },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
