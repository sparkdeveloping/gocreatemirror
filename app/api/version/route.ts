import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_URL ||
    process.env.NEXT_PUBLIC_BUILD_VERSION ||
    "local";

  return NextResponse.json(
    {
      version,
      short: version === "local" ? "local" : version.slice(0, 12),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    },
  );
}
