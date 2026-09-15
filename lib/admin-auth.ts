import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "gocreate_admin";
const SESSION_DAYS = 7;

type SessionPayload = {
  exp: number;
  v: 1;
};

function configuredPin() {
  return process.env.ADMIN_PIN?.trim() || "";
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET?.trim() || `gocreatemirror:${configuredPin()}:session`;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function adminPinConfigured() {
  return Boolean(configuredPin());
}

export function verifyAdminPin(pin: string) {
  const expected = configuredPin();
  if (!expected || !pin) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(pin);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createAdminSession() {
  const payload: SessionPayload = {
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    v: 1,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminSessionValue(value?: string | null) {
  if (!value) return false;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return false;
  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    return payload.v === 1 && typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  return verifyAdminSessionValue(store.get(ADMIN_COOKIE)?.value);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}
