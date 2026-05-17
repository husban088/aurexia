// lib/get-initial-currency.ts
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { currencies, getCurrencyByCountry, defaultCurrency } from "./currency";

export async function getInitialCurrency() {
  try {
    const cookieStore = await cookies();
    const savedCurrencyCode = cookieStore.get("preferredCurrency")?.value;

    // ── 1. Saved preference from cookie (user manually selected) ─────────
    if (savedCurrencyCode) {
      const savedCurrency = currencies.find(
        (c) => c.code === savedCurrencyCode,
      );
      if (savedCurrency) {
        console.log("📀 Cookie currency:", savedCurrency.code);
        return savedCurrency;
      }
    }

    // ── 2. Server headers — Cloudflare / Vercel / CloudFront ─────────────
    const headersList = await headers();

    const headersToCheck = [
      "cf-ipcountry", // Cloudflare (most reliable)
      "x-vercel-ip-country", // Vercel
      "cloudfront-viewer-country", // AWS CloudFront
      "x-country",
      "x-geo-country",
      "x-real-country",
    ];

    for (const header of headersToCheck) {
      const value = headersList.get(header);
      if (value && value.length === 2 && value !== "XX" && value !== "T1") {
        // XX = unknown, T1 = Tor — skip these
        const detectedCurrency = getCurrencyByCountry(value.toUpperCase());
        console.log(
          `🌍 Header [${header}]: ${value} → ${detectedCurrency.code}`,
        );
        return detectedCurrency;
      }
    }

    // ── 3. Accept-Language header fallback ────────────────────────────────
    const acceptLang = headersList.get("accept-language") || "";
    const primaryLang =
      acceptLang.split(",")[0]?.trim().split(";")[0]?.trim() || "";

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

    if (primaryLang && langToCountry[primaryLang]) {
      const langCountry = langToCountry[primaryLang];
      const langCurrency = getCurrencyByCountry(langCountry);
      console.log(
        `🗣️ Accept-Language [${primaryLang}]: ${langCountry} → ${langCurrency.code}`,
      );
      return langCurrency;
    }

    // ── 4. Default — PKR (app is Pakistan-based) ─────────────────────────
    const pkr = currencies.find((c) => c.code === "PKR") || defaultCurrency;
    console.log("🌎 Default currency: PKR");
    return pkr;
  } catch (error) {
    console.error("❌ getInitialCurrency error:", error);
    return currencies.find((c) => c.code === "PKR") || defaultCurrency;
  }
}
