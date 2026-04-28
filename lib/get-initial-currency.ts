// lib/get-initial-currency.ts
import { cookies } from "next/headers";
import { headers } from "next/headers";
import {
  currencies,
  getCurrencyByCountry,
  getCountryFromHeaders,
  defaultCurrency,
} from "./currency";

export async function getInitialCurrency() {
  try {
    // First check saved preference from cookies
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

    // Then try to detect from headers (server-side)
    const headersList = await headers();
    const countryCode = getCountryFromHeaders(headersList);

    if (countryCode) {
      const detectedCurrency = getCurrencyByCountry(countryCode);
      console.log(
        "🌍 Detected currency from country header:",
        countryCode,
        detectedCurrency.code
      );
      return detectedCurrency;
    }

    // Default to USD
    console.log("🌎 Using default currency: USD");
    return defaultCurrency;
  } catch (error) {
    console.error("❌ Error getting initial currency:", error);
    return defaultCurrency;
  }
}
