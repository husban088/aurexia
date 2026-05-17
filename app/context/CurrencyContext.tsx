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
  undefined,
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSavedCurrency(): Currency | null {
  if (typeof window === "undefined") return null;
  try {
    const ls = localStorage.getItem("preferredCurrency");
    if (ls) {
      const found = staticCurrencies.find((c) => c.code === ls);
      if (found) return found;
    }
    const match = document.cookie.match(/preferredCurrency=([A-Z]{3})/);
    if (match?.[1]) {
      const found = staticCurrencies.find((c) => c.code === match[1]);
      if (found) return found;
    }
  } catch {}
  return null;
}

// Our own Next.js API route — reads Cloudflare/Vercel CDN headers server-side
async function getCountryFromServerRoute(): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch("/api/detect-country", {
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data?.country === "string" && data.country.length === 2) {
      return data.country.toUpperCase();
    }
  } catch {}
  return null;
}

// Multiple external IP APIs tried in order — first success wins
async function getCountryFromIP(): Promise<string | null> {
  const apis = [
    { url: "https://ipapi.co/json/", parse: (d: any) => d?.country_code },
    { url: "https://api.country.is/", parse: (d: any) => d?.country },
    {
      url: "https://freeipapi.com/api/json/",
      parse: (d: any) => d?.countryCode,
    },
    { url: "https://ipwho.is/", parse: (d: any) => d?.country_code },
  ];

  for (const { url, parse } of apis) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(url, {
        signal: ctrl.signal,
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      clearTimeout(t);
      if (!res.ok) continue;
      const data = await res.json();
      const code = parse(data);
      if (typeof code === "string" && code.length === 2 && code !== "XX") {
        console.log(`🌍 IP API success: ${url} → ${code}`);
        return code.toUpperCase();
      }
    } catch {
      continue;
    }
  }
  return null;
}

// Browser language → country — instant, zero network
function getCountryFromBrowserLang(): string | null {
  if (typeof navigator === "undefined") return null;
  const allLangs =
    typeof navigator.languages !== "undefined" && navigator.languages.length > 0
      ? [...navigator.languages]
      : [navigator.language || ""];

  const map: Record<string, string> = {
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
    "en-NZ": "AU",
    "de-DE": "DE",
    de: "DE",
    "fr-FR": "FR",
    fr: "FR",
    "bn-BD": "BD",
  };

  for (const l of allLangs) {
    if (map[l]) return map[l];
    for (const [key, val] of Object.entries(map)) {
      if (l.startsWith(key + "-") || l === key) return val;
    }
  }
  return null;
}

function resolveCurrency(code: string): Currency {
  return (
    staticCurrencies.find((c) => c.code === code) ||
    staticCurrencies.find((c) => c.code === "PKR") ||
    staticCurrencies[0]
  );
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function CurrencyProvider({
  children,
  initialCurrencyCode,
}: {
  children: React.ReactNode;
  initialCurrencyCode?: string;
}) {
  // Ref-backed live currencies — avoids stale closure issues completely
  const liveCurrRef = useRef<Currency[]>(staticCurrencies);
  const [liveCurrencies, _setLive] = useState<Currency[]>(staticCurrencies);
  const setLiveCurrencies = useCallback((arr: Currency[]) => {
    liveCurrRef.current = arr;
    _setLive(arr);
  }, []);

  // Compute initial currency once synchronously (no flash)
  // Priority: server prop → localStorage/cookie → PKR
  const getInitial = (): Currency => {
    if (initialCurrencyCode) {
      const f = staticCurrencies.find((c) => c.code === initialCurrencyCode);
      if (f) return f;
    }
    const saved = getSavedCurrency();
    if (saved) return saved;
    return resolveCurrency("PKR");
  };

  const [currency, _setCurrency] = useState<Currency>(getInitial);
  const currRef = useRef<Currency>(currency);
  const setCurrencyState = useCallback((c: Currency) => {
    currRef.current = c;
    _setCurrency(c);
  }, []);

  const hasDetected = useRef(false);
  const isRunning = useRef(false);

  // Public API — user manually picks a currency
  const setCurrency = useCallback(
    (newCurrency: Currency) => {
      const live =
        liveCurrRef.current.find((c) => c.code === newCurrency.code) ||
        newCurrency;
      setCurrencyState(live);
      saveCurrencyPreference(live.code);
    },
    [setCurrencyState],
  );

  // Silently fetch live rates and update state
  const applyRatesForCode = useCallback(
    (code: string) => {
      fetchLiveRates()
        .then((rates) => {
          if (!rates) return;
          const updated = applyLiveRates(rates);
          setLiveCurrencies(updated);
          const updatedCurr = updated.find((c) => c.code === code);
          if (updatedCurr) {
            setCurrencyState(updatedCurr);
            console.log(`💱 Live rate applied: ${code} = ${updatedCurr.rate}`);
          }
        })
        .catch(() => {});
    },
    [setLiveCurrencies, setCurrencyState],
  );

  // Main detection flow — runs once on mount
  const detect = useCallback(async () => {
    if (isRunning.current || hasDetected.current) return;
    isRunning.current = true;

    try {
      // If user already picked a currency — respect it, just update rates
      const saved = getSavedCurrency();
      if (saved) {
        console.log(`📀 Using saved: ${saved.code}`);
        applyRatesForCode(saved.code);
        hasDetected.current = true;
        isRunning.current = false;
        return;
      }

      // Detect country — try fastest sources first
      let country: string | null = null;

      // 1. Server API route — reads Cloudflare/Vercel CDN headers (fastest + most accurate)
      country = await getCountryFromServerRoute();
      if (country) console.log(`🖥️ Server route: ${country}`);

      // 2. External IP APIs — reliable, ~1-3s
      if (!country) {
        country = await getCountryFromIP();
      }

      // 3. Browser navigator.languages — instant, zero network
      if (!country) {
        country = getCountryFromBrowserLang();
        if (country) console.log(`🌐 Browser lang: ${country}`);
      }

      // 4. Last resort — PKR (app is Pakistan-based)
      if (!country) {
        country = "PK";
        console.log("📌 Final fallback: PK");
      }

      const detected = getCurrencyByCountry(country);
      console.log(`✅ Currency set: ${country} → ${detected.code}`);

      // Set immediately — UI shows correct currency right now
      setCurrencyState(detected);

      // Then silently fetch live rates
      applyRatesForCode(detected.code);

      hasDetected.current = true;
    } catch (err) {
      console.error("Currency detect error:", err);
      setCurrencyState(resolveCurrency("PKR"));
      hasDetected.current = true;
    } finally {
      isRunning.current = false;
    }
  }, [applyRatesForCode, setCurrencyState]);

  // Run exactly once on mount — empty array intentional
  useEffect(() => {
    detect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshCurrency = useCallback(async () => {
    hasDetected.current = false;
    isRunning.current = false;
    await detect();
  }, [detect]);

  const convert = useCallback(
    (priceInPKR: number) => convertPrice(priceInPKR, currency),
    [currency],
  );

  const format = useCallback(
    (priceInPKR: number) => formatPrice(priceInPKR, currency),
    [currency],
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencies: liveCurrencies,
        setCurrency,
        convertPrice: convert,
        formatPrice: format,
        refreshCurrency,
        loading: false, // Never block the UI
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
