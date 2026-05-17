// app/api/detect-country/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const h = await headers();
    const NO_CACHE = {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    };

    for (const header of [
      "cf-ipcountry",
      "x-vercel-ip-country",
      "cloudfront-viewer-country",
      "x-country",
      "x-geo-country",
      "x-real-country",
    ]) {
      const val = h.get(header);
      if (val && val.length === 2 && val !== "XX" && val !== "T1") {
        return NextResponse.json(
          { country: val.toUpperCase(), source: header, success: true },
          {
            headers: { ...NO_CACHE, Vary: "cf-ipcountry, x-vercel-ip-country" },
          },
        );
      }
    }

    return NextResponse.json(
      { country: null, success: false },
      { headers: NO_CACHE },
    );
  } catch {
    return NextResponse.json(
      { country: null, success: false },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
