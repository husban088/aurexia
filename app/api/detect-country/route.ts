// app/api/detect-country/route.ts
// ✅ Server-side country detection — reads CDN/proxy headers
// Works with Cloudflare, Vercel, AWS CloudFront, and Accept-Language fallback

import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const headersList = await headers();

    // Priority: Cloudflare → Vercel → CloudFront → generic CDN headers
    const geoHeaders = [
      "cf-ipcountry",
      "x-vercel-ip-country",
      "cloudfront-viewer-country",
      "x-country",
      "x-geo-country",
      "x-real-country",
    ];

    for (const header of geoHeaders) {
      const value = headersList.get(header);
      if (
        value &&
        value.length === 2 &&
        value !== "XX" && // unknown
        value !== "T1" // Tor network
      ) {
        console.log(`📍 [${header}] → ${value}`);
        return NextResponse.json(
          { country: value.toUpperCase(), source: header },
          {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
              "CDN-Cache-Control": "no-store",
              Pragma: "no-cache",
            },
          },
        );
      }
    }

    // Accept-Language header fallback (when no geo headers present e.g. local dev)
    const acceptLang = headersList.get("accept-language") || "";
    const primaryLang =
      acceptLang.split(",")[0]?.trim().split(";")[0]?.trim() || "";

    const langToCountry: Record<string, string> = {
      "ur-PK": "PK",
      ur: "PK",
      "ar-AE": "AE",
      "ar-SA": "SA",
      "ar-QA": "QA",
      "hi-IN": "IN",
      hi: "IN",
      "en-GB": "GB",
      "en-AU": "AU",
      "en-CA": "CA",
      "de-DE": "DE",
      de: "DE",
      "fr-FR": "FR",
      fr: "FR",
    };

    if (primaryLang && langToCountry[primaryLang]) {
      const country = langToCountry[primaryLang];
      return NextResponse.json(
        { country, source: "accept-language" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    // No country detected — client will use IP APIs
    return NextResponse.json(
      { country: null, source: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("detect-country error:", error);
    return NextResponse.json(
      { country: null, source: null },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
