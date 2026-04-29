// lib/get-initial-currency.ts
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { currencies, getCurrencyByCountry, defaultCurrency } from "./currency";

export async function getInitialCurrency() {
  try {
    // Check saved preference from cookies
    const cookieStore = await cookies();
    const savedCurrencyCode = cookieStore.get("preferredCurrency")?.value;

    if (savedCurrencyCode) {
      const savedCurrency = currencies.find(
        (c) => c.code === savedCurrencyCode
      );
      if (savedCurrency) {
        console.log("📀 Using saved currency from cookie:", savedCurrency.code);
        return savedCurrency;
      }
    }

    // Detect from Cloudflare/Vercel headers
    const headersList = await headers();

    const headersToCheck = [
      "cf-ipcountry",
      "x-vercel-ip-country",
      "cloudfront-viewer-country",
      "x-country",
      "x-geo-country",
    ];

    for (const header of headersToCheck) {
      const value = headersList.get(header);
      if (value && value.length === 2) {
        const detectedCurrency = getCurrencyByCountry(value);
        console.log(
          "🌍 Country header detected:",
          value,
          "→ Currency:",
          detectedCurrency.code
        );
        return detectedCurrency;
      }
    }

    // Default to USD for international visitors
    const defaultCurr =
      currencies.find((c) => c.code === "USD") || defaultCurrency;
    console.log("🌎 Using default currency: USD");
    return defaultCurr;
  } catch (error) {
    console.error("❌ Error getting initial currency:", error);
    return defaultCurrency;
  }
}
