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
];

// Default currency (USD for international)
export const defaultCurrency = currencies[0];

// Get currency by country code
export function getCurrencyByCountry(countryCode: string): Currency {
  const currency = currencies.find((c) => c.countryCode === countryCode);
  return currency || defaultCurrency;
}

// Convert price from PKR to target currency
export function convertPrice(
  priceInPKR: number,
  targetCurrency: Currency
): number {
  return priceInPKR * targetCurrency.rate;
}

// Format price with currency symbol
export function formatPrice(priceInPKR: number, currency: Currency): string {
  const converted = convertPrice(priceInPKR, currency);
  return `${currency.symbol} ${converted.toFixed(2)}`;
}

// Get user's country from IP (using free API)
export async function detectUserCountry(): Promise<string> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    return data.country_code || "US";
  } catch (error) {
    console.error("Country detection failed:", error);
    return "US";
  }
}

// Save currency preference
export function saveCurrencyPreference(currencyCode: string): void {
  localStorage.setItem("preferredCurrency", currencyCode);
}

// Load currency preference
export function loadCurrencyPreference(): string | null {
  return localStorage.getItem("preferredCurrency");
}
