// lib/get-initial-currency.ts
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { currencies, getCurrencyByCountry, defaultCurrency } from "./currency";

export async function getInitialCurrency() {
  try {
    const cookieStore = await cookies();

    // Only use saved cookie if user manually selected
    if (
      cookieStore.get("currencyUserSelected")?.value === "true" &&
      cookieStore.get("preferredCurrency")?.value
    ) {
      const code = cookieStore.get("preferredCurrency")!.value;
      const saved = currencies.find((c) => c.code === code);
      if (saved) {
        console.log("📀 User-selected from cookie:", saved.code);
        return saved;
      }
    }

    // CDN/Edge headers (Cloudflare cf-ipcountry is VPN-aware)
    const h = await headers();
    for (const header of [
      "cf-ipcountry",
      "x-vercel-ip-country",
      "cloudfront-viewer-country",
      "x-country",
      "x-geo-country",
    ]) {
      const val = h.get(header);
      if (val && val.length === 2 && val !== "XX" && val !== "T1") {
        const detected = getCurrencyByCountry(val.toUpperCase());
        console.log(`🌍 [${header}] ${val} → ${detected.code}`);
        return detected;
      }
    }

    // No header — client will detect via IP APIs
    return currencies.find((c) => c.code === "PKR") ?? defaultCurrency;
  } catch {
    return defaultCurrency;
  }
}
