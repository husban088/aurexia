// app/context/CurrencyContext.tsx
"use client";

// ✅ FIXES:
// 1. Website kabhi bhi loading pe stuck nahi hogi — currency detection page ko BLOCK nahi karti
// 2. Server-side header (Cloudflare/Vercel) se FORAN country milti hai — koi external API nahi
// 3. localStorage se saved preference instant load hoti hai
// 4. External IP APIs sirf background mein chalti hain — 3s timeout, page wait nahi karta
// 5. Pakistan mein PKR show, USA mein USD, UK mein GBP — sab automatic

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

// ── Step 1: Instant — localStorage se saved preference ───────────────────────
function getSavedCurrency(): Currency | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("preferredCurrency");
    if (saved) {
      const found = staticCurrencies.find((c) => c.code === saved);
      if (found) return found;
    }
  } catch {}
  return null;
}

// ── Step 2: Fast — server header se country (Cloudflare/Vercel) ──────────────
// Yeh API local hai — koi external call nahi, 50-100ms mein response
async function getCountryFromServer(): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000); // 2s max
    const res = await fetch("/api/detect-country", {
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.country?.length === 2) return data.country;
    return null;
  } catch {
    return null;
  }
}

// ── Step 3: Fallback — external IP APIs (background only, page wait nahi karta)
async function getCountryFromExternalAPIs(): Promise<string | null> {
  const apis = [
    { url: "https://api.country.is/", parse: (d: any) => d.country },
    { url: "https://ipapi.co/json/", parse: (d: any) => d.country_code },
    {
      url: "https://freeipapi.com/api/json/",
      parse: (d: any) => d.countryCode,
    },
  ];

  for (const { url, parse } of apis) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(t);
      if (!res.ok) continue;
      const data = await res.json();
      const code = parse(data);
      if (typeof code === "string" && code.length === 2) return code;
    } catch {
      continue;
    }
  }
  return null;
}

// ── Browser language fallback (instant, no network) ──────────────────────────
function getCountryFromBrowser(): string {
  if (typeof navigator === "undefined") return "US";
  const lang = navigator.language || "";
  const map: Record<string, string> = {
    "ur-PK": "PK",
    ur: "PK",
    "ar-AE": "AE",
    "ar-SA": "SA",
    "hi-IN": "IN",
    hi: "IN",
    "en-GB": "GB",
    "en-AU": "AU",
    "en-CA": "CA",
    "en-US": "US",
    de: "DE",
    "de-DE": "DE",
    fr: "FR",
    "fr-FR": "FR",
  };
  // Exact match
  if (map[lang]) return map[lang];
  // Prefix match
  for (const [key, val] of Object.entries(map)) {
    if (lang.startsWith(key)) return val;
  }
  return "US";
}

// ─────────────────────────────────────────────────────────────────────────────
export function CurrencyProvider({
  children,
  initialCurrencyCode,
}: {
  children: React.ReactNode;
  initialCurrencyCode?: string; // server se pass karo agar possible ho
}) {
  const [liveCurrencies, setLiveCurrencies] =
    useState<Currency[]>(staticCurrencies);

  // ── INSTANT initial currency ──────────────────────────────────────────────
  // Priority: 1. initialCurrencyCode (server) → 2. localStorage → 3. PKR default
  // Page KABHI bhi blank nahi hoga — foran kuch show hoga
  const getInitialCurrency = (): Currency => {
    // Server-passed currency code (fastest)
    if (initialCurrencyCode) {
      const found = staticCurrencies.find(
        (c) => c.code === initialCurrencyCode,
      );
      if (found) return found;
    }
    // localStorage saved preference
    const saved = getSavedCurrency();
    if (saved) return saved;
    // Default: PKR (changes silently in background after detection)
    return (
      staticCurrencies.find((c) => c.code === "PKR") || staticCurrencies[0]
    );
  };

  const [currency, setCurrencyState] = useState<Currency>(getInitialCurrency);
  const loading = false; // ✅ NEVER block — loading always false
  const isDetecting = useRef(false);
  const hasDetected = useRef(false);

  const setCurrency = useCallback(
    (newCurrency: Currency) => {
      const liveVersion =
        liveCurrencies.find((c) => c.code === newCurrency.code) || newCurrency;
      setCurrencyState(liveVersion);
      saveCurrencyPreference(liveVersion.code);
    },
    [liveCurrencies],
  );

  // ── Main detection — runs once on mount ──────────────────────────────────
  const detectAndSet = useCallback(async () => {
    if (isDetecting.current || hasDetected.current) return;
    isDetecting.current = true;

    try {
      // ── If user already has saved preference — respect it, don't override ──
      const saved = getSavedCurrency();
      if (saved) {
        // Still fetch live rates in background but keep their preference
        fetchLiveRates()
          .then((liveRates) => {
            if (liveRates) {
              const updated = applyLiveRates(liveRates);
              setLiveCurrencies(updated);
              // Update rate for current currency
              const updatedCurr = updated.find((c) => c.code === saved.code);
              if (updatedCurr) setCurrencyState(updatedCurr);
            }
          })
          .catch(() => {});
        hasDetected.current = true;
        return;
      }

      // ── No saved preference — detect country ─────────────────────────────
      // Try server header first (fast, local)
      let countryCode = await getCountryFromServer();

      if (!countryCode) {
        // Server header nahi mila — browser language se instant guess
        countryCode = getCountryFromBrowser();

        // External APIs background mein try karo (page wait nahi karega)
        getCountryFromExternalAPIs()
          .then((externalCode) => {
            if (externalCode && externalCode !== countryCode) {
              const baseCurr = getCurrencyByCountry(externalCode);
              const liveCurr =
                liveCurrencies.find((c) => c.code === baseCurr.code) ||
                baseCurr;
              setCurrencyState(liveCurr);
              console.log(
                `🌍 External API updated currency: ${externalCode} → ${liveCurr.code}`,
              );
            }
          })
          .catch(() => {});
      }

      // ── Set currency from detected country ────────────────────────────────
      const baseCurrency = getCurrencyByCountry(countryCode);

      // Fetch live rates in parallel (don't await — set currency immediately)
      fetchLiveRates()
        .then((liveRates) => {
          if (liveRates) {
            const updated = applyLiveRates(liveRates);
            setLiveCurrencies(updated);
            const updatedCurr =
              updated.find((c) => c.code === baseCurrency.code) || baseCurrency;
            setCurrencyState(updatedCurr);
            console.log(
              `💱 Live rates applied: ${updatedCurr.code} rate=${updatedCurr.rate}`,
            );
          }
        })
        .catch(() => {});

      // Set currency immediately with hardcoded rate (don't wait for live rates)
      setCurrencyState(baseCurrency);
      hasDetected.current = true;

      console.log(`✅ Currency: ${countryCode} → ${baseCurrency.code}`);
    } catch (err) {
      console.error("Currency detection error:", err);
      // Fallback: USD
      const usd =
        staticCurrencies.find((c) => c.code === "USD") || staticCurrencies[0];
      setCurrencyState(usd);
      hasDetected.current = true;
    } finally {
      isDetecting.current = false;
    }
  }, [liveCurrencies]);

  const refreshCurrency = useCallback(async () => {
    hasDetected.current = false;
    isDetecting.current = false;
    await detectAndSet();
  }, [detectAndSet]);

  useEffect(() => {
    detectAndSet();
  }, [detectAndSet]);

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
