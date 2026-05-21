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

function saveUserPref(code: string) {
  try {
    localStorage.setItem("preferredCurrency", code);
    localStorage.setItem("currencyUserSelected", "true");
    document.cookie = `preferredCurrency=${code}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `currencyUserSelected=true; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

// ─── Server-side country detection (most reliable) ───────────────────
async function detectCountryViaServer(): Promise<string | null> {
  try {
    const controller = new AbortController();
    // ✅ Reduced timeout: 3s instead of 5s — faster fallback
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch("/api/detect-country", {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.country) return data.country as string;
    return null;
  } catch {
    return null;
  }
}

// ─── Client-side IP fallback ─────────────────────────────────────────
async function detectCountryClientSide(): Promise<string> {
  // ✅ Run all APIs in parallel — first one to succeed wins (race)
  const apis = [
    { url: "https://api.country.is/", parser: (d: any) => d.country },
    { url: "https://ipapi.co/json/", parser: (d: any) => d.country_code },
    {
      url: "https://freeipapi.com/api/json/",
      parser: (d: any) => d.countryCode,
    },
    { url: "https://ipwho.is/", parser: (d: any) => d.country_code },
  ];

  const racePromise = new Promise<string>((resolve) => {
    let settled = false;
    let pending = apis.length;

    apis.forEach(({ url, parser }) => {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 3000);
      fetch(url, { signal: controller.signal })
        .then((r) => r.json())
        .then((d) => {
          clearTimeout(tid);
          const code = parser(d);
          if (!settled && code && code.length === 2 && code !== "XX") {
            settled = true;
            resolve(code.toUpperCase());
          }
        })
        .catch(() => {
          clearTimeout(tid);
        })
        .finally(() => {
          pending--;
          // All failed — default to PK
          if (!settled && pending === 0) resolve("PK");
        });
    });
  });

  return racePromise;
}

// ─────────────────────────────────────────────────────────────────────
export function CurrencyProvider({
  children,
  initialCurrencyCode,
}: {
  children: React.ReactNode;
  initialCurrencyCode?: string;
}) {
  // ✅ KEY FIX: Start with server-detected currency immediately (no PKR flash)
  // initialCurrencyCode comes from layout.tsx via getInitialCurrency() — server-side
  const getInitialCurrency = (): Currency => {
    // Priority 1: User manual preference in localStorage
    if (typeof window !== "undefined") {
      try {
        const userSelected = localStorage.getItem("currencyUserSelected");
        if (userSelected === "true") {
          const code = localStorage.getItem("preferredCurrency");
          if (code) {
            const found = staticCurrencies.find((c) => c.code === code);
            if (found) return found;
          }
        }
      } catch {}
    }
    // Priority 2: Server-detected from Cloudflare/Vercel headers
    if (initialCurrencyCode) {
      const found = staticCurrencies.find(
        (c) => c.code === initialCurrencyCode,
      );
      if (found) return found;
    }
    return PKR;
  };

  const [liveCurrencies, setLiveCurrencies] =
    useState<Currency[]>(staticCurrencies);
  // ✅ Start with correct currency immediately — no loading flash
  const [currency, setCurrencyState] = useState<Currency>(getInitialCurrency);
  // ✅ loading = false by default since we already have a currency
  // Only set true if we need to do client-side detection (no server currency)
  const [loading, setLoading] = useState(false);
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

  // ✅ Apply live rates in background — never blocks UI
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

  useEffect(() => {
    if (detectionDone.current) return;
    detectionDone.current = true;

    const currentCode = currency.code;

    // ✅ Always fetch live rates in background for accurate prices
    applyRates(currentCode);

    // ✅ If server already gave us ANY currency (including PKR), skip client detection
    // Server headers (Cloudflare/Vercel) are the most reliable source
    if (initialCurrencyCode) {
      // Server already detected the country correctly — no client API calls needed
      return;
    }

    // ✅ User manually selected — respect their choice, skip detection
    if (typeof window !== "undefined") {
      try {
        if (localStorage.getItem("currencyUserSelected") === "true") return;
      } catch {}
    }

    // ✅ Need client-side detection — server didn't detect (no CDN headers)
    const detect = async () => {
      // Try server first (3s timeout), then race all client APIs in parallel
      let country = await detectCountryViaServer();
      if (!country) {
        country = await detectCountryClientSide();
      }

      const detected = getCurrencyByCountry(country);
      setCurrencyState(detected);
      applyRates(detected.code);

      try {
        localStorage.setItem("preferredCurrency", detected.code);
        document.cookie = `preferredCurrency=${detected.code}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {}
    };

    detect();
  }, []);

  const refreshCurrency = useCallback(async () => {
    detectionDone.current = false;
    try {
      if (
        typeof window !== "undefined" &&
        localStorage.getItem("currencyUserSelected") !== "true"
      ) {
        localStorage.removeItem("preferredCurrency");
        document.cookie =
          "preferredCurrency=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    } catch {}

    detectionDone.current = false;
    let country = await detectCountryViaServer();
    if (!country) country = await detectCountryClientSide();
    const detected = getCurrencyByCountry(country);
    setCurrencyState(detected);
    applyRates(detected.code);
  }, [applyRates]);

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
