import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions, adminPinConfigured, createAdminSession, verifyAdminPin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!adminPinConfigured()) {
    return NextResponse.json({ error: "ADMIN_PIN is not configured in Vercel." }, { status: 503 });
  }

  let body: { pin?: unknown } = {};
  try { body = await request.json(); } catch {}
  const pin = typeof body.pin === "string" ? body.pin : "";
  if (!verifyAdminPin(pin)) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminSession(), adminCookieOptions());
  return response;
}
