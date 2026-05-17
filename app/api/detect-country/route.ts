// app/api/detect-country/route.ts
// ✅ Same-origin API — no CORS issues ever
// Production: Cloudflare/Vercel CDN geo headers
// Localhost: Accept-Language header fallback

import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const headersList = await headers();

    // ── Production: CDN geo headers (Cloudflare, Vercel, CloudFront) ─────
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
      if (value && value.length === 2 && value !== "XX" && value !== "T1") {
        return NextResponse.json(
          { country: value.toUpperCase(), source: header },
          {
            headers: {
              "Cache-Control": "no-store, no-cache",
              Pragma: "no-cache",
            },
          },
        );
      }
    }

    // ── Localhost + any env: Accept-Language header ───────────────────────
    // Browser sends this on every request — very reliable for language/region
    const acceptLang = headersList.get("accept-language") || "";
    const langs = acceptLang
      .split(",")
      .map((l) => l.split(";")[0].trim())
      .filter(Boolean);

    const langToCountry: Record<string, string> = {
      "ur-PK": "PK",
      ur: "PK",
      "ar-AE": "AE",
      "ar-SA": "SA",
      "ar-QA": "QA",
      "ar-KW": "KW",
      "ar-BH": "BH",
      "ar-OM": "OM",
      "hi-IN": "IN",
      hi: "IN",
      "en-GB": "GB",
      "en-AU": "AU",
      "en-CA": "CA",
      "en-NZ": "AU",
      "de-DE": "DE",
      de: "DE",
      "fr-FR": "FR",
      fr: "FR",
      "bn-BD": "BD",
    };

    for (const lang of langs) {
      // Exact match
      if (langToCountry[lang]) {
        return NextResponse.json(
          { country: langToCountry[lang], source: "accept-language" },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
      // Prefix match e.g. "ur-PK" matches "ur"
      for (const [key, country] of Object.entries(langToCountry)) {
        if (lang.startsWith(key + "-") || lang === key) {
          return NextResponse.json(
            { country, source: "accept-language-prefix" },
            { headers: { "Cache-Control": "no-store" } },
          );
        }
      }
    }

    // ── No detection possible — return null, client will use PKR default ──
    return NextResponse.json(
      { country: null, source: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { country: null, source: "error" },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
