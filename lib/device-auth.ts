import { timingSafeEqual } from "node:crypto";

export function deviceTokenConfigured() {
  return Boolean(process.env.MIRROR_DEVICE_TOKEN?.trim());
}

export function verifyDeviceToken(request: Request) {
  const configured = process.env.MIRROR_DEVICE_TOKEN?.trim() || "";
  if (!configured) return process.env.NODE_ENV !== "production";
  const supplied = request.headers.get("x-gocreate-device-token")?.trim() || "";
  if (!supplied) return false;
  const a = Buffer.from(configured);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
