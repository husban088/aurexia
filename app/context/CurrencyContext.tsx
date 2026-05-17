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

const PKR =
  staticCurrencies.find((c) => c.code === "PKR") ?? staticCurrencies[0];

// ─── Check if user manually selected ─────────────────────────────────
function getUserPref(): Currency | null {
  try {
    if (typeof window === "undefined") return null;
    const userSelected = localStorage.getItem("currencyUserSelected");
    if (userSelected !== "true") return null;
    const code = localStorage.getItem("preferredCurrency");
    if (!code) return null;
    return staticCurrencies.find((c) => c.code === code) ?? null;
  } catch {
    return null;
  }
}

// ─── Save user manual selection ─────────────────────────────────────
function saveUserPref(code: string) {
  try {
    localStorage.setItem("preferredCurrency", code);
    localStorage.setItem("currencyUserSelected", "true");
    document.cookie = `preferredCurrency=${code}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `currencyUserSelected=true; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

// ─── Detect country using server API (MOST RELIABLE) ─────────────────
async function detectCountryViaServer(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("/api/detect-country", {
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.country) {
      console.log("🌍 Server detected country:", data.country);
      return data.country;
    }
    return null;
  } catch (err) {
    console.error("Server country detection failed:", err);
    return null;
  }
}

// ─── Fallback: Client-side IP detection ─────────────────────────────
async function detectCountryClientSide(): Promise<string> {
  const apis = [
    { url: "https://api.country.is/", parser: (d: any) => d.country },
    { url: "https://ipapi.co/json/", parser: (d: any) => d.country_code },
    {
      url: "https://freeipapi.com/api/json/",
      parser: (d: any) => d.countryCode,
    },
    { url: "https://ipwho.is/", parser: (d: any) => d.country_code },
  ];

  for (const api of apis) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(api.url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const data = await res.json();
      const code = api.parser(data);
      if (code && code.length === 2 && code !== "XX") {
        return code.toUpperCase();
      }
    } catch (e) {
      continue;
    }
  }
  return "PK";
}

// ─────────────────────────────────────────────────────────────────────
export function CurrencyProvider({
  children,
  initialCurrencyCode,
}: {
  children: React.ReactNode;
  initialCurrencyCode?: string;
}) {
  const [liveCurrencies, setLiveCurrencies] =
    useState<Currency[]>(staticCurrencies);
  const [currency, setCurrencyState] = useState<Currency>(PKR);
  const [loading, setLoading] = useState(true);
  const detectionDone = useRef(false);

  const setCurrency = useCallback(
    (newCurrency: Currency) => {
      const live =
        liveCurrencies.find((c) => c.code === newCurrency.code) ?? newCurrency;
      setCurrencyState(live);
      saveUserPref(live.code);
    },
    [liveCurrencies],
  );

  const applyRates = useCallback((currCode: string) => {
    fetchLiveRates()
      .then((rates) => {
        if (!rates) return;
        const updated = applyLiveRates(rates);
        setLiveCurrencies(updated);
        const updatedCurr = updated.find((c) => c.code === currCode);
        if (updatedCurr) setCurrencyState(updatedCurr);
      })
      .catch(() => {});
  }, []);

  const detect = useCallback(async () => {
    if (detectionDone.current) return;
    detectionDone.current = true;
    setLoading(true);

    // 1. User manual selection?
    const pref = getUserPref();
    if (pref) {
      console.log("📀 Using user-selected currency:", pref.code);
      setCurrencyState(pref);
      applyRates(pref.code);
      setLoading(false);
      return;
    }

    // 2. Try server-side detection first (MOST RELIABLE)
    let country = await detectCountryViaServer();

    // 3. Fallback to client-side
    if (!country) {
      country = await detectCountryClientSide();
    }

    console.log("🌍 Final detected country:", country);
    const detected = getCurrencyByCountry(country);
    console.log(`✅ Setting currency to: ${detected.code} (${detected.name})`);

    setCurrencyState(detected);
    applyRates(detected.code);

    // Save detected but don't mark as user-selected
    localStorage.setItem("preferredCurrency", detected.code);
    document.cookie = `preferredCurrency=${detected.code}; path=/; max-age=3600; SameSite=Lax`;

    setLoading(false);
  }, [applyRates]);

  useEffect(() => {
    detect();
  }, []);

  const refreshCurrency = useCallback(async () => {
    detectionDone.current = false;
    if (localStorage.getItem("currencyUserSelected") !== "true") {
      localStorage.removeItem("preferredCurrency");
      document.cookie =
        "preferredCurrency=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    await detect();
  }, [detect]);

  const convert = useCallback(
    (pkr: number) => convertPrice(pkr, currency),
    [currency],
  );
  const format = useCallback(
    (pkr: number) => formatPrice(pkr, currency),
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
        loading,
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
