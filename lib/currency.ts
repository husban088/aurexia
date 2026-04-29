// lib/currency.ts

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;
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
    rate: 0.0132,
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
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    rate: 0.3,
    flag: "🇮🇳",
    phoneCode: "+91",
    countryCode: "IN",
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

// NO DEFAULT - Force detection
export let defaultCurrency: Currency = currencies[0]; // Temporary, will be overridden

// Comprehensive country to currency mapping
const countryToCurrency: Record<string, string> = {
  // Americas
  US: "USD",
  CA: "CAD",
  MX: "USD",
  // Europe
  GB: "GBP",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  PT: "EUR",
  IE: "EUR",
  AT: "EUR",
  CH: "EUR",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  // Asia Pacific
  AU: "AUD",
  NZ: "AUD",
  JP: "JPY",
  CN: "CNY",
  HK: "HKD",
  SG: "SGD",
  IN: "INR",
  PK: "PKR",
  BD: "BDT",
  LK: "LKR",
  NP: "NPR",
  // Middle East
  AE: "AED",
  SA: "SAR",
  QA: "AED",
  KW: "AED",
  OM: "AED",
  BH: "AED",
  // Africa
  ZA: "ZAR",
  NG: "NGN",
};

export function getCurrencyByCountry(countryCode: string): Currency {
  const currencyCode = countryToCurrency[countryCode] || "USD";
  const currency = currencies.find((c) => c.code === currencyCode);
  return currency || currencies[0];
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

// MULTIPLE IP APIs for reliable detection
export async function detectUserCountry(): Promise<string> {
  // Primary APIs in order of reliability
  const apis = [
    { url: "https://ipapi.co/json/", parser: (data: any) => data.country_code },
    {
      url: "https://ip-api.com/json/",
      parser: (data: any) => data.countryCode,
    },
    { url: "https://api.country.is/", parser: (data: any) => data.country },
    {
      url: "https://worldtimeapi.org/api/ip",
      parser: (data: any) => data.client_country,
    },
    { url: "https://ipwho.is/", parser: (data: any) => data.country_code },
    {
      url: "https://freeipapi.com/api/json/",
      parser: (data: any) => data.countryCode,
    },
  ];

  for (const api of apis) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(api.url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      let countryCode = api.parser(data);

      if (countryCode && countryCode.length === 2) {
        console.log(`✅ Country detected from ${api.url}:`, countryCode);
        return countryCode;
      }
    } catch (error) {
      console.log(`❌ API failed: ${api.url}`);
      continue;
    }
  }

  // Try browser language as fallback
  if (typeof navigator !== "undefined") {
    const lang = navigator.language;
    const langMap: Record<string, string> = {
      "en-US": "US",
      "en-GB": "GB",
      "en-AU": "AU",
      "en-CA": "CA",
      "ur-PK": "PK",
      "ar-AE": "AE",
      "ar-SA": "SA",
      "hi-IN": "IN",
      "de-DE": "DE",
      "fr-FR": "FR",
      "es-ES": "ES",
      "it-IT": "IT",
    };
    if (langMap[lang]) return langMap[lang];
    if (lang.includes("PK")) return "PK";
    if (lang.includes("US")) return "US";
    if (lang.includes("GB")) return "GB";
  }

  console.log("⚠️ No country detected, defaulting to US");
  return "US";
}

export function saveCurrencyPreference(currencyCode: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("preferredCurrency", currencyCode);
    document.cookie = `preferredCurrency=${currencyCode}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

export function loadCurrencyPreference(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("preferredCurrency");
  }
  return null;
}

export function clearCurrencyPreference(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("preferredCurrency");
    document.cookie =
      "preferredCurrency=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}
