// app/api/detect-country/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const headersList = await headers();

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

    // Accept-Language fallback
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
      "hi-IN": "IN",
      hi: "IN",
      "en-GB": "GB",
      "en-AU": "AU",
      "en-CA": "CA",
      "de-DE": "DE",
      "fr-FR": "FR",
    };

    for (const lang of langs) {
      if (langToCountry[lang]) {
        return NextResponse.json(
          { country: langToCountry[lang], source: "accept-language" },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
      for (const [key, country] of Object.entries(langToCountry)) {
        if (lang.startsWith(key + "-")) {
          return NextResponse.json(
            { country, source: "accept-language-prefix" },
            { headers: { "Cache-Control": "no-store" } },
          );
        }
      }
    }

    return NextResponse.json(
      { country: null, source: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ country: null }, { status: 200 });
  }
}
