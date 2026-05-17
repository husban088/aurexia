// lib/get-initial-currency.ts
// Server-side currency detection — runs at page request time
// Reads CDN geo headers — no external API calls needed server-side

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { currencies, getCurrencyByCountry } from "./currency";

// This key marks that the user MANUALLY selected a currency
// We only respect cookie if user explicitly chose it
const CURRENCY_USER_SELECTED_COOKIE = "currencyUserSelected";
const CURRENCY_PREF_COOKIE = "preferredCurrency";

export async function getInitialCurrency() {
  try {
    const cookieStore = await cookies();
    const headersList = await headers();

    // ── 1. User manually selected currency — always respect ───────────────
    const userSelectedFlag = cookieStore.get(
      CURRENCY_USER_SELECTED_COOKIE,
    )?.value;
    if (userSelectedFlag === "true") {
      const savedCode = cookieStore.get(CURRENCY_PREF_COOKIE)?.value;
      if (savedCode) {
        const saved = currencies.find((c) => c.code === savedCode);
        if (saved) {
          console.log("📀 User-selected currency from cookie:", saved.code);
          return saved;
        }
      }
    }

    // ── 2. CDN geo headers — most accurate, zero latency ─────────────────
    const geoHeaders = [
      "cf-ipcountry", // Cloudflare — most reliable
      "x-vercel-ip-country", // Vercel Edge Network
      "cloudfront-viewer-country", // AWS CloudFront
      "x-country",
      "x-geo-country",
      "x-real-country",
    ];

    for (const header of geoHeaders) {
      const value = headersList.get(header);
      if (value && value.length === 2 && value !== "XX" && value !== "T1") {
        const country = value.toUpperCase();
        const detected = getCurrencyByCountry(country);
        console.log(`🌍 Server geo [${header}]: ${country} → ${detected.code}`);
        return detected;
      }
    }

    // ── 3. Accept-Language header — browser sends this on every request ───
    const acceptLang = headersList.get("accept-language") || "";
    // Example: "ur-PK,ur;q=0.9,en;q=0.8"
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
      "de-DE": "DE",
      de: "DE",
      "fr-FR": "FR",
      fr: "FR",
      "bn-BD": "BD",
    };

    for (const lang of langs) {
      // Exact match
      if (langToCountry[lang]) {
        const country = langToCountry[lang];
        const detected = getCurrencyByCountry(country);
        console.log(
          `🗣️ Accept-Language [${lang}]: ${country} → ${detected.code}`,
        );
        return detected;
      }
      // Prefix match (e.g. "ur-" matches "ur")
      for (const [key, country] of Object.entries(langToCountry)) {
        if (lang.startsWith(key + "-")) {
          const detected = getCurrencyByCountry(country);
          console.log(
            `🗣️ Accept-Language prefix [${lang}→${key}]: ${country} → ${detected.code}`,
          );
          return detected;
        }
      }
    }

    // ── 4. Default: PKR — app is Pakistan-based, client will detect precisely
    console.log("📌 Server fallback: PKR (client will detect)");
    return currencies.find((c) => c.code === "PKR") || currencies[0];
  } catch (error) {
    console.error("❌ getInitialCurrency error:", error);
    return currencies.find((c) => c.code === "PKR") || currencies[0];
  }
}
