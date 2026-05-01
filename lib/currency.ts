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
    rate: 0.0036, // ✅ SAHI - 1 USD = 278 PKR
    flag: "🇺🇸",
    phoneCode: "+1",
    countryCode: "US",
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    rate: 0.0045, // ✅ UPDATED (pehle 0.0028 tha - GALAT)
    flag: "🇬🇧", // 1 GBP = 222 PKR
    phoneCode: "+44",
    countryCode: "GB",
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    rate: 0.0039, // ✅ UPDATED (pehle 0.0033 tha - GALAT)
    flag: "🇪🇺", // 1 EUR = 256 PKR
    phoneCode: "+352",
    countryCode: "EU",
  },
  {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    rate: 0.0024, // ✅ UPDATED (pehle 0.0055 tha - BILKUL ULTA!)
    flag: "🇦🇺", // 1 AUD = 417 PKR
    phoneCode: "+61",
    countryCode: "AU",
  },
  {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
    rate: 0.0026, // ✅ UPDATED (pehle 0.0049 tha - GALAT)
    flag: "🇨🇦", // 1 CAD = 385 PKR
    phoneCode: "+1",
    countryCode: "CA",
  },
  {
    code: "AED",
    symbol: "د.إ",
    name: "UAE Dirham",
    rate: 0.0759, // ✅ UPDATED (pehle 0.0132 tha - BILKUL ULTA!)
    flag: "🇦🇪", // 1 AED = 13.2 PKR
    phoneCode: "+971",
    countryCode: "AE",
  },
  {
    code: "SAR",
    symbol: "﷼",
    name: "Saudi Riyal",
    rate: 0.0741, // ✅ UPDATED (pehle 0.0135 tha - BILKUL ULTA!)
    flag: "🇸🇦", // 1 SAR = 13.5 PKR
    phoneCode: "+966",
    countryCode: "SA",
  },
  {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    rate: 0.297, // ✅ UPDATED (pehle 0.3 tha - half sahi tha)
    flag: "🇮🇳", // 1 INR = 3.37 PKR
    phoneCode: "+91",
    countryCode: "IN",
  },
  {
    code: "PKR",
    symbol: "₨",
    name: "Pakistani Rupee",
    rate: 1, // ✅ BASE - theek ہے
    flag: "🇵🇰",
    phoneCode: "+92",
    countryCode: "PK",
  },
];

// NO DEFAULT - Force detection
export let defaultCurrency: Currency = currencies[0];

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
  // Reliable APIs جو CORS allow کرتے ہیں
  const apis = [
    {
      url: "https://api.country.is/",
      parser: (data: any) => data.country,
      name: "country.is",
    },
    {
      url: "https://worldtimeapi.org/api/ip",
      parser: (data: any) => data.client_country,
      name: "worldtimeapi",
    },
  ];

  for (const api of apis) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const response = await fetch(api.url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      let countryCode = api.parser(data);

      if (countryCode && countryCode.length === 2) {
        console.log(`✅ Country detected from ${api.name}:`, countryCode);
        return countryCode;
      }
    } catch (error) {
      console.log(`⏭️ Skipping ${api.name} (timeout/error)`);
      continue;
    }
  }

  // Browser language fallback (FASTEST!)
  if (typeof navigator !== "undefined") {
    const lang = navigator.language;
    const langMap: Record<string, string> = {
      "ur-PK": "PK",
      "ar-AE": "AE",
      "ar-SA": "SA",
      "hi-IN": "IN",
      "en-US": "US",
      "en-GB": "GB",
    };
    if (langMap[lang]) return langMap[lang];
    if (lang.startsWith("ur")) return "PK";
    if (lang.startsWith("ar")) return "AE";
    if (lang.startsWith("en")) return "US";
  }

  console.log("⚠️ Defaulting to PK");
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
