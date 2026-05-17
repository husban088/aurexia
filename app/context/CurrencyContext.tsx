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

// Version — jab bhi change karo, purana saved preference ignore ho jata hai
// Agar user ne manually select kiya ho tabhi saved preference use ho
const CURRENCY_USER_SELECTED_KEY = "currencyUserSelected"; // "true" only if user manually picked
const CURRENCY_PREF_KEY = "preferredCurrency";

// Sirf tab saved currency use karo jab user ne KHUD manually select ki ho
function getUserSelectedCurrency(): Currency | null {
  if (typeof window === "undefined") return null;
  try {
    const userSelected = localStorage.getItem(CURRENCY_USER_SELECTED_KEY);
    if (userSelected !== "true") return null; // Auto-detected was saved — ignore it

    const code = localStorage.getItem(CURRENCY_PREF_KEY);
    if (!code) return null;
    const found = staticCurrencies.find((c) => c.code === code);
    return found || null;
  } catch {
    return null;
  }
}

function saveUserSelectedCurrency(code: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CURRENCY_PREF_KEY, code);
    localStorage.setItem(CURRENCY_USER_SELECTED_KEY, "true");
    document.cookie = `preferredCurrency=${code}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

// IP detection — multiple APIs, first success wins
async function detectCountryByIP(): Promise<string | null> {
  const apis = [
    { url: "https://ipapi.co/json/", parse: (d: any) => d?.country_code },
    { url: "https://api.country.is/", parse: (d: any) => d?.country },
    {
      url: "https://freeipapi.com/api/json/",
      parse: (d: any) => d?.countryCode,
    },
    { url: "https://ipwho.is/", parse: (d: any) => d?.country_code },
    { url: "https://ip-api.com/json/", parse: (d: any) => d?.countryCode },
  ];

  // Run all in parallel, take first successful result
  const results = await Promise.allSettled(
    apis.map(async ({ url, parse }) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      try {
        const res = await fetch(url, {
          signal: ctrl.signal,
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        clearTimeout(t);
        if (!res.ok) throw new Error("not ok");
        const data = await res.json();
        const code = parse(data);
        if (
          typeof code === "string" &&
          code.length === 2 &&
          code !== "XX" &&
          code !== "T1"
        ) {
          return code.toUpperCase();
        }
        throw new Error("invalid code");
      } catch {
        clearTimeout(t);
        throw new Error("failed");
      }
    }),
  );

  for (const r of results) {
    if (r.status === "fulfilled") {
      console.log("🌍 IP detected country:", r.value);
      return r.value;
    }
  }
  return null;
}

// Server route — reads Cloudflare/Vercel CDN headers
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
      console.log(
        "🖥️ Server detected country:",
        data.country,
        "(source:",
        data.source + ")",
      );
      return data.country.toUpperCase();
    }
  } catch {}
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
  initialCurrencyCode, // from server (getInitialCurrency)
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

  // ── Initial state ──────────────────────────────────────────────────────────
  // Priority: server-detected code → user manually selected → PKR
  // DO NOT use auto-saved localStorage — causes wrong country on revisit
  const getInitial = (): Currency => {
    // 1. Server passed a code (most reliable — from CDN geo headers)
    if (initialCurrencyCode) {
      const f = staticCurrencies.find((c) => c.code === initialCurrencyCode);
      if (f) {
        console.log("🚀 Initial from server:", f.code);
        return f;
      }
    }
    // 2. User manually selected — always respect this
    const userPicked = getUserSelectedCurrency();
    if (userPicked) {
      console.log("📀 User previously selected:", userPicked.code);
      return userPicked;
    }
    // 3. PKR as neutral default — detection will update it
    return resolveCurrency("PKR");
  };

  const [currency, _setCurrState] = useState<Currency>(getInitial);
  const setCurrState = useCallback((c: Currency) => {
    _setCurrState(c);
  }, []);

  const hasDetected = useRef(false);
  const isRunning = useRef(false);

  // Public: user manually picks a currency from dropdown
  const setCurrency = useCallback(
    (newCurrency: Currency) => {
      const live =
        liveCurrRef.current.find((c) => c.code === newCurrency.code) ||
        newCurrency;
      setCurrState(live);
      saveUserSelectedCurrency(live.code); // Mark as user-selected
    },
    [setCurrState],
  );

  // Silently apply live exchange rates
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
            console.log(`💱 Live rate: ${code} = ${updatedCurr.rate} per PKR`);
          }
        })
        .catch(() => {});
    },
    [setLiveCurrencies, setCurrState],
  );

  // ── Main detection — runs once on mount ───────────────────────────────────
  const detect = useCallback(async () => {
    if (isRunning.current || hasDetected.current) return;
    isRunning.current = true;

    try {
      // If user MANUALLY selected a currency — always respect it
      const userPicked = getUserSelectedCurrency();
      if (userPicked) {
        console.log("📀 Keeping user selection:", userPicked.code);
        applyRatesForCode(userPicked.code);
        hasDetected.current = true;
        isRunning.current = false;
        return;
      }

      // If server already gave us a reliable country code — use it
      if (initialCurrencyCode) {
        const serverCurr = staticCurrencies.find(
          (c) => c.code === initialCurrencyCode,
        );
        if (serverCurr) {
          console.log("✅ Using server currency:", serverCurr.code);
          setCurrState(serverCurr);
          applyRatesForCode(serverCurr.code);
          hasDetected.current = true;
          isRunning.current = false;
          return;
        }
      }

      // No reliable data — detect via IP APIs + server route in parallel
      console.log("🔍 Detecting country...");

      const [serverCountry, ipCountry] = await Promise.all([
        detectCountryFromServer(),
        detectCountryByIP(),
      ]);

      const country = serverCountry || ipCountry || "PK";
      console.log(
        `✅ Detected: server=${serverCountry} ip=${ipCountry} → using: ${country}`,
      );

      const detected = getCurrencyByCountry(country);
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
