// app/context/CurrencyContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  currencies as staticCurrencies,
  Currency,
  getCurrencyByCountry,
  saveCurrencyPreference,
  convertPrice,
  formatPrice,
  fetchLiveRates,
  applyLiveRates,
} from "@/lib/currency";

interface CurrencyContextType {
  currency: Currency;
  currencies: Currency[];
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceInPKR: number) => number;
  formatPrice: (priceInPKR: number) => string;
  refreshCurrency: () => Promise<void>;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

// ─── Fast parallel country detection ──────────────────────────────────────────
async function detectCountryFast(): Promise<string> {
  // 1. Try server-side header route first (fastest — uses Cloudflare/Vercel headers)
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch("/api/detect-country", {
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      if (data?.country?.length === 2) {
        console.log("🌍 Country from server header:", data.country);
        return data.country;
      }
    }
  } catch {
    // Server route failed or timed out — try client APIs
  }

  // 2. Race multiple free IP detection APIs in parallel (fastest wins)
  const apis: { url: string; parse: (d: any) => string }[] = [
    { url: "https://api.country.is/", parse: (d) => d.country },
    { url: "https://ipapi.co/json/", parse: (d) => d.country_code },
    { url: "https://freeipapi.com/api/json/", parse: (d) => d.countryCode },
  ];

  const promises = apis.map(async ({ url, parse }) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(t);
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      const code = parse(data);
      if (typeof code === "string" && code.length === 2) return code;
      throw new Error("invalid country code");
    } catch {
      clearTimeout(t);
      throw new Error("api failed");
    }
  });

  try {
    // Promise.any = first one to succeed wins
    const country = await Promise.any(promises);
    console.log("🌍 Country from client API:", country);
    return country;
  } catch {
    // All APIs failed — browser language fallback
    if (typeof navigator !== "undefined") {
      const lang = navigator.language || "";
      if (lang.startsWith("ur") || lang.includes("PK")) return "PK";
      if (lang.includes("AE") || lang.startsWith("ar-AE")) return "AE";
      if (lang.includes("SA") || lang.startsWith("ar-SA")) return "SA";
      if (lang.includes("IN") || lang.startsWith("hi")) return "IN";
      if (lang.startsWith("en-GB")) return "GB";
      if (lang.startsWith("en-AU")) return "AU";
      if (lang.startsWith("en-CA")) return "CA";
    }
    return "US";
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [liveCurrencies, setLiveCurrencies] =
    useState<Currency[]>(staticCurrencies);

  // Start null — will be set immediately after detection
  const [currency, setCurrencyState] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);
  const isDetecting = useRef(false);

  const setCurrency = useCallback(
    (newCurrency: Currency) => {
      const liveVersion =
        liveCurrencies.find((c) => c.code === newCurrency.code) || newCurrency;
      setCurrencyState(liveVersion);
      // Save manual selection so user's explicit choice persists this session
      saveCurrencyPreference(liveVersion.code);
    },
    [liveCurrencies]
  );

  // ─── Core detection logic ────────────────────────────────────────────────
  const detectAndSet = useCallback(async () => {
    if (isDetecting.current) return;
    isDetecting.current = true;
    setLoading(true);

    try {
      // Country detection + live rates fetch IN PARALLEL for speed
      const [countryCode, liveRates] = await Promise.all([
        detectCountryFast(),
        fetchLiveRates().catch(() => null),
      ]);

      // Apply live rates if fetched successfully
      let updatedList = staticCurrencies;
      if (liveRates) {
        updatedList = applyLiveRates(liveRates);
        setLiveCurrencies(updatedList);
      }

      // Match country → currency
      const baseCurrency = getCurrencyByCountry(countryCode);
      const liveCurrency =
        updatedList.find((c) => c.code === baseCurrency.code) || baseCurrency;

      setCurrencyState(liveCurrency);
      console.log(
        `✅ Currency set: ${countryCode} → ${liveCurrency.code} (rate: ${liveCurrency.rate})`
      );
    } catch (err) {
      console.error("Currency detection failed:", err);
      // Absolute fallback — USD
      const usd =
        staticCurrencies.find((c) => c.code === "USD") || staticCurrencies[0];
      setCurrencyState(usd);
    } finally {
      setLoading(false);
      isDetecting.current = false;
    }
  }, []);

  // refreshCurrency — called manually, forces re-detection
  const refreshCurrency = useCallback(async () => {
    isDetecting.current = false; // reset guard to allow re-run
    await detectAndSet();
  }, [detectAndSet]);

  useEffect(() => {
    detectAndSet();
  }, [detectAndSet]);

  // Placeholder while detecting (avoids null crashes)
  const activeCurrency =
    currency ||
    staticCurrencies.find((c) => c.code === "PKR") ||
    staticCurrencies[0];

  const convert = useCallback(
    (priceInPKR: number) => convertPrice(priceInPKR, activeCurrency),
    [activeCurrency]
  );

  const format = useCallback(
    (priceInPKR: number) => formatPrice(priceInPKR, activeCurrency),
    [activeCurrency]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency: activeCurrency,
        currencies: liveCurrencies,
        setCurrency,
        convertPrice: convert,
        formatPrice: format,
        refreshCurrency,
        loading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
