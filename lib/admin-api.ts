import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "./admin-auth";

export const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Admin session expired." }, { status: 401, headers: noStoreHeaders });
  }
  return null;
}
