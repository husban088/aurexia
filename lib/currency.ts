// lib/currency.ts
// ✅ RATES UPDATED: 2 May 2026 — Pakistan Open Market
// Source: Daily Pakistan / forex.pk open market rates
// Base currency: PKR (1 PKR = X foreign)
// Formula: rate = 1 / (PKR per 1 foreign unit)
// Example: 1 USD = 279 PKR → rate = 1/279 = 0.003584

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // 1 PKR = this many units of foreign currency
  flag: string;
  phoneCode: string;
  countryCode: string;
}

// ✅ CORRECT LIVE RATES — 2 May 2026 Pakistan Open Market
// 1 USD = 279 PKR   → rate = 1/279  = 0.003584
// 1 GBP = 379 PKR   → rate = 1/379  = 0.002639
// 1 EUR = 328 PKR   → rate = 1/328  = 0.003049
// 1 AUD = 200 PKR   → rate = 1/200  = 0.005000
// 1 CAD = 205 PKR   → rate = 1/205  = 0.004878
// 1 AED = 76.45 PKR → rate = 1/76.45 = 0.013elegance
// 1 SAR = 74.87 PKR → rate = 1/74.87 = 0.013357
// 1 INR = 3.35 PKR  → rate = 1/3.35  = 0.298507
// 1 PKR = 1 PKR     → rate = 1

export const currencies: Currency[] = [
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    rate: 0.003584, // 1 USD = 279 PKR ✅
    flag: "🇺🇸",
    phoneCode: "+1",
    countryCode: "US",
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    rate: 0.002639, // 1 GBP = 379 PKR ✅
    flag: "🇬🇧",
    phoneCode: "+44",
    countryCode: "GB",
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    rate: 0.003049, // 1 EUR = 328 PKR ✅
    flag: "🇪🇺",
    phoneCode: "+352",
    countryCode: "EU",
  },
  {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    rate: 0.005, // 1 AUD = 200 PKR ✅
    flag: "🇦🇺",
    phoneCode: "+61",
    countryCode: "AU",
  },
  {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
    rate: 0.004878, // 1 CAD = 205 PKR ✅
    flag: "🇨🇦",
    phoneCode: "+1",
    countryCode: "CA",
  },
  {
    code: "AED",
    symbol: "د.إ",
    name: "UAE Dirham",
    rate: 0.013082, // 1 AED = 76.45 PKR ✅
    flag: "🇦🇪",
    phoneCode: "+971",
    countryCode: "AE",
  },
  {
    code: "SAR",
    symbol: "﷼",
    name: "Saudi Riyal",
    rate: 0.013357, // 1 SAR = 74.87 PKR ✅
    flag: "🇸🇦",
    phoneCode: "+966",
    countryCode: "SA",
  },
  {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    rate: 0.298507, // 1 INR = 3.35 PKR ✅
    flag: "🇮🇳",
    phoneCode: "+91",
    countryCode: "IN",
  },
  {
    code: "PKR",
    symbol: "₨",
    name: "Pakistani Rupee",
    rate: 1, // Base currency ✅
    flag: "🇵🇰",
    phoneCode: "+92",
    countryCode: "PK",
  },
];

export let defaultCurrency: Currency =
  currencies.find((c) => c.code === "PKR") || currencies[0];

// ✅ LIVE RATE FETCHER — exchangerate-api.com (free, no key needed for basic)
// Fallback chain: API → hardcoded rates
// Rates cache: 1 hour (don't fetch every page load)
let _ratesCacheTime = 0;
let _ratesLive: Record<string, number> | null = null;
const RATES_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function fetchLiveRates(): Promise<Record<string, number> | null> {
  // Return cached rates if fresh
  if (_ratesLive && Date.now() - _ratesCacheTime < RATES_CACHE_TTL) {
    return _ratesLive;
  }

  // ✅ Free API — no key required, returns rates relative to base currency
  // We fetch PKR as base → gives us "1 PKR = X foreign"
  const apis = [
    "https://open.er-api.com/v6/latest/PKR",
    "https://api.frankfurter.app/latest?from=PKR",
  ];

  for (const url of apis) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = await res.json();

      // open.er-api.com format: { rates: { USD: 0.00358, ... } }
      // frankfurter.app format: { rates: { USD: 0.00358, ... } }
      const rates: Record<string, number> =
        data.rates || data.conversion_rates || {};

      if (rates.USD) {
        _ratesLive = rates;
        _ratesCacheTime = Date.now();
        console.log("✅ Live rates fetched from:", url);
        return rates;
      }
    } catch {
      continue;
    }
  }

  console.warn("⚠️ Live rate fetch failed — using hardcoded rates");
  return null;
}

// ✅ Apply live rates to currencies array (call once on app init)
export function applyLiveRates(liveRates: Record<string, number>): Currency[] {
  return currencies.map((c) => {
    if (c.code === "PKR") return c;
    const liveRate = liveRates[c.code];
    if (liveRate && liveRate > 0) {
      return { ...c, rate: liveRate };
    }
    return c; // fallback to hardcoded rate
  });
}

// Country → Currency mapping
const countryToCurrency: Record<string, string> = {
  US: "USD",
  CA: "CAD",
  MX: "USD",
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
  SE: "USD",
  NO: "USD",
  DK: "USD",
  AU: "AUD",
  NZ: "AUD",
  JP: "USD",
  CN: "USD",
  HK: "USD",
  SG: "USD",
  IN: "INR",
  PK: "PKR",
  BD: "USD",
  LK: "USD",
  NP: "USD",
  AE: "AED",
  SA: "SAR",
  QA: "AED",
  KW: "AED",
  OM: "AED",
  BH: "AED",
  ZA: "USD",
  NG: "USD",
};

export function getCurrencyByCountry(countryCode: string): Currency {
  const currencyCode = countryToCurrency[countryCode] || "USD";
  return currencies.find((c) => c.code === currencyCode) || currencies[0];
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

// Country detection APIs
export async function detectUserCountry(): Promise<string> {
  const apis = [
    {
      url: "https://api.country.is/",
      parser: (data: any) => data.country,
    },
    {
      url: "https://worldtimeapi.org/api/ip",
      parser: (data: any) => data.client_country,
    },
  ];

  for (const api of apis) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(api.url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);
      if (!response.ok) continue;
      const data = await response.json();
      const countryCode = api.parser(data);
      if (countryCode?.length === 2) return countryCode;
    } catch {
      continue;
    }
  }

  // Browser language fallback
  if (typeof navigator !== "undefined") {
    const lang = navigator.language;
    const langMap: Record<string, string> = {
      "ur-PK": "PK",
      "ar-AE": "AE",
      "ar-SA": "SA",
      "hi-IN": "IN",
      "en-US": "US",
      "en-GB": "GB",
      "en-AU": "AU",
      "en-CA": "CA",
    };
    if (langMap[lang]) return langMap[lang];
    if (lang.startsWith("ur")) return "PK";
    if (lang.startsWith("ar")) return "AE";
    if (lang.startsWith("en-AU")) return "AU";
    if (lang.startsWith("en-CA")) return "CA";
    if (lang.startsWith("en-GB")) return "GB";
    if (lang.startsWith("en")) return "US";
  }

  return "PK";
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
