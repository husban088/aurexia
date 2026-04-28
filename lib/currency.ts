// lib/currency.ts

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Conversion rate from PKR
  flag: string;
  phoneCode: string;
  countryCode: string;
}

export const currencies: Currency[] = [
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    rate: 0.0036,
    flag: "🇺🇸",
    phoneCode: "+1",
    countryCode: "US",
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    rate: 0.0028,
    flag: "🇬🇧",
    phoneCode: "+44",
    countryCode: "GB",
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    rate: 0.0033,
    flag: "🇪🇺",
    phoneCode: "+352",
    countryCode: "EU",
  },
  {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    rate: 0.0055,
    flag: "🇦🇺",
    phoneCode: "+61",
    countryCode: "AU",
  },
  {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
    rate: 0.0049,
    flag: "🇨🇦",
    phoneCode: "+1",
    countryCode: "CA",
  },
  {
    code: "AED",
    symbol: "د.إ",
    name: "UAE Dirham",
    rate: 0.013,
    flag: "🇦🇪",
    phoneCode: "+971",
    countryCode: "AE",
  },
  {
    code: "SAR",
    symbol: "﷼",
    name: "Saudi Riyal",
    rate: 0.0135,
    flag: "🇸🇦",
    phoneCode: "+966",
    countryCode: "SA",
  },
  {
    code: "PKR",
    symbol: "₨",
    name: "Pakistani Rupee",
    rate: 1,
    flag: "🇵🇰",
    phoneCode: "+92",
    countryCode: "PK",
  },
];

export const defaultCurrency = currencies[0];

export function getCurrencyByCountry(countryCode: string): Currency {
  const currency = currencies.find((c) => c.countryCode === countryCode);
  return currency || defaultCurrency;
}

export function convertPrice(
  priceInPKR: number,
  targetCurrency: Currency
): number {
  return priceInPKR * targetCurrency.rate;
}

export function formatPrice(priceInPKR: number, currency: Currency): string {
  const converted = convertPrice(priceInPKR, currency);
  const formatted = converted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency.symbol}${formatted}`;
}

// STRONG CLIENT-SIDE IP DETECTION
export async function detectUserCountry(): Promise<string> {
  // Try multiple free IP geolocation APIs
  const apis = [
    "https://ipapi.co/json/",
    "https://ip-api.com/json/",
    "https://api.country.is/",
    "https://worldtimeapi.org/api/ip",
  ];

  for (const api of apis) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(api, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      let countryCode = null;

      // Parse different API response formats
      if (api.includes("ipapi.co")) {
        countryCode = data.country_code;
      } else if (api.includes("ip-api.com")) {
        countryCode = data.countryCode;
      } else if (api.includes("country.is")) {
        countryCode = data.country;
      } else if (api.includes("worldtimeapi")) {
        countryCode = data.client_country;
      }

      if (countryCode && countryCode.length === 2) {
        console.log(`✅ Country detected from ${api}:`, countryCode);
        return countryCode;
      }
    } catch (error) {
      console.log(`❌ API failed: ${api}`, error);
      continue;
    }
  }

  // Last resort: Use browser language
  if (typeof navigator !== "undefined") {
    const lang = navigator.language;
    if (lang.includes("AU") || lang === "en-AU") return "AU";
    if (lang.includes("GB") || lang === "en-GB") return "GB";
    if (lang.includes("CA")) return "CA";
    if (lang.includes("PK")) return "PK";
    if (lang.includes("AE") || lang.includes("AR")) return "AE";
    if (lang.includes("SA")) return "SA";
    if (lang.includes("DE")) return "DE";
    if (lang.includes("FR")) return "FR";
    if (lang.includes("ES")) return "ES";
    if (lang.includes("IT")) return "IT";
  }

  console.log("⚠️ No country detected, defaulting to US");
  return "US";
}

export function saveCurrencyPreference(currencyCode: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("preferredCurrency", currencyCode);
    document.cookie = `preferredCurrency=${currencyCode}; path=/; max-age=31536000`;
  }
}

export function loadCurrencyPreference(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("preferredCurrency");
  }
  return null;
}

// Server-side detection (for production)
export function getCountryFromHeaders(headers: Headers): string | null {
  const headersToCheck = [
    "cf-ipcountry",
    "x-vercel-ip-country",
    "cloudfront-viewer-country",
    "x-country",
    "x-geo-country",
  ];

  for (const header of headersToCheck) {
    const value = headers.get(header);
    if (value && value.length === 2) {
      console.log(`✅ Country from header ${header}:`, value);
      return value;
    }
  }

  return null;
}
