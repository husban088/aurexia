// app/context/CurrencyContext.tsx
"use client";

// ✅ CORS errors FIX:
// - Koi bhi external IP API (ipapi.co, freeipapi, etc.) CLIENT side pe NAHI chalti
// - Sirf /api/detect-country use hota hai (same-origin, no CORS)
// - Website fast, no stuck loading, no console errors

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

const USER_SELECTED_KEY = "currencyUserSelected";
const PREF_KEY = "preferredCurrency";

// Sirf user-manually-selected currency read karo
function getUserSelectedCurrency(): Currency | null {
  if (typeof window === "undefined") return null;
  try {
    if (localStorage.getItem(USER_SELECTED_KEY) !== "true") return null;
    const code = localStorage.getItem(PREF_KEY);
    if (!code) return null;
    return staticCurrencies.find((c) => c.code === code) || null;
  } catch {
    return null;
  }
}

function saveUserSelectedCurrency(code: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREF_KEY, code);
    localStorage.setItem(USER_SELECTED_KEY, "true");
    document.cookie = `preferredCurrency=${code}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

function resolveCurrency(code: string): Currency {
  return (
    staticCurrencies.find((c) => c.code === code) ||
    staticCurrencies.find((c) => c.code === "PKR") ||
    staticCurrencies[0]
  );
}

// ✅ ONLY our own server route — same-origin, no CORS, reads CDN headers
// Works on localhost + production both
async function detectCountryFromServer(): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch("/api/detect-country", {
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data?.country === "string" && data.country.length === 2) {
      console.log("🖥️ Server detected:", data.country, "via", data.source);
      return data.country.toUpperCase();
    }
  } catch {}
  return null;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function CurrencyProvider({
  children,
  initialCurrencyCode,
}: {
  children: React.ReactNode;
  initialCurrencyCode?: string;
}) {
  const liveCurrRef = useRef<Currency[]>(staticCurrencies);
  const [liveCurrencies, _setLive] = useState<Currency[]>(staticCurrencies);

  const setLiveCurrencies = useCallback((arr: Currency[]) => {
    liveCurrRef.current = arr;
    _setLive(arr);
  }, []);

  // Initial currency — server prop sabse reliable
  const getInitial = (): Currency => {
    if (initialCurrencyCode) {
      const f = staticCurrencies.find((c) => c.code === initialCurrencyCode);
      if (f) return f;
    }
    const userPicked = getUserSelectedCurrency();
    if (userPicked) return userPicked;
    return resolveCurrency("PKR");
  };

  const [currency, _setCurr] = useState<Currency>(getInitial);

  const setCurrState = useCallback((c: Currency) => {
    _setCurr(c);
  }, []);

  const hasDetected = useRef(false);
  const isRunning = useRef(false);

  // User manually selects from dropdown
  const setCurrency = useCallback(
    (newCurrency: Currency) => {
      const live =
        liveCurrRef.current.find((c) => c.code === newCurrency.code) ||
        newCurrency;
      setCurrState(live);
      saveUserSelectedCurrency(live.code);
    },
    [setCurrState],
  );

  // Silently fetch live exchange rates in background
  const applyRatesForCode = useCallback(
    (code: string) => {
      fetchLiveRates()
        .then((rates) => {
          if (!rates) return;
          const updated = applyLiveRates(rates);
          setLiveCurrencies(updated);
          const updatedCurr = updated.find((c) => c.code === code);
          if (updatedCurr) {
            setCurrState(updatedCurr);
          }
        })
        .catch(() => {});
    },
    [setLiveCurrencies, setCurrState],
  );

  // Main detection — runs once, NO external IP APIs
  const detect = useCallback(async () => {
    if (isRunning.current || hasDetected.current) return;
    isRunning.current = true;

    try {
      // 1. User manually selected — always respect
      const userPicked = getUserSelectedCurrency();
      if (userPicked) {
        applyRatesForCode(userPicked.code);
        hasDetected.current = true;
        isRunning.current = false;
        return;
      }

      // 2. Server already passed reliable currency code
      if (initialCurrencyCode) {
        const serverCurr = staticCurrencies.find(
          (c) => c.code === initialCurrencyCode,
        );
        if (serverCurr) {
          setCurrState(serverCurr);
          applyRatesForCode(serverCurr.code);
          hasDetected.current = true;
          isRunning.current = false;
          return;
        }
      }

      // 3. Call our own /api/detect-country (same-origin, no CORS)
      const country = await detectCountryFromServer();
      const detected = getCurrencyByCountry(country || "PK");
      console.log(`✅ Currency: ${country || "PK"} → ${detected.code}`);

      setCurrState(detected);
      applyRatesForCode(detected.code);
      hasDetected.current = true;
    } catch (err) {
      console.error("Currency detect error:", err);
      setCurrState(resolveCurrency("PKR"));
      hasDetected.current = true;
    } finally {
      isRunning.current = false;
    }
  }, [initialCurrencyCode, applyRatesForCode, setCurrState]);

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
        loading: false,
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
