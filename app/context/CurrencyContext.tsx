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
  detectUserCountry,
  getCurrencyByCountry,
  saveCurrencyPreference,
  loadCurrencyPreference,
  convertPrice,
  formatPrice,
  fetchLiveRates,
  applyLiveRates,
} from "@/lib/currency";

interface CurrencyContextType {
  currency: Currency;
  currencies: Currency[]; // ✅ Live-updated currencies array
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceInPKR: number) => number;
  formatPrice: (priceInPKR: number) => string;
  refreshCurrency: () => Promise<void>;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // ✅ Live currencies — start with static, update with live rates
  const [liveCurrencies, setLiveCurrencies] =
    useState<Currency[]>(staticCurrencies);

  // ✅ Start with PKR (instant, no flash)
  const pkrCurrency =
    staticCurrencies.find((c) => c.code === "PKR") || staticCurrencies[0];
  const [currency, setCurrencyState] = useState<Currency>(pkrCurrency);
  const [loading, setLoading] = useState(false);

  const initializedRef = useRef(false);
  const detectionRef = useRef(false);

  // ✅ Update currency object from live list when liveCurrencies updates
  const syncCurrencyFromLive = useCallback(
    (code: string, liveList: Currency[]) => {
      const updated = liveList.find((c) => c.code === code);
      if (updated) setCurrencyState(updated);
    },
    []
  );

  const setCurrency = useCallback(
    (newCurrency: Currency) => {
      // Find from live list (has updated rates)
      const liveVersion =
        liveCurrencies.find((c) => c.code === newCurrency.code) || newCurrency;
      setCurrencyState(liveVersion);
      saveCurrencyPreference(liveVersion.code);
    },
    [liveCurrencies]
  );

  const refreshCurrency = useCallback(async () => {
    if (detectionRef.current) return;
    detectionRef.current = true;

    try {
      // ✅ STEP 1: Fetch live exchange rates first (from free API)
      const liveRates = await fetchLiveRates();
      let updatedList = staticCurrencies;

      if (liveRates) {
        updatedList = applyLiveRates(liveRates);
        setLiveCurrencies(updatedList);
        // Sync current currency with new rate
        syncCurrencyFromLive(currency.code, updatedList);
      }

      // ✅ STEP 2: Detect country (server-side header check first)
      let countryCode = "PK";
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch("/api/detect-country", {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (data?.country) countryCode = data.country;
      } catch {
        // Fallback to client-side detection
        countryCode = await detectUserCountry();
      }

      // ✅ STEP 3: Set currency for detected country
      const detectedBase = getCurrencyByCountry(countryCode);
      const detectedLive =
        updatedList.find((c) => c.code === detectedBase.code) || detectedBase;

      setCurrencyState(detectedLive);
      saveCurrencyPreference(detectedLive.code);
      console.log(
        `✅ Currency set: ${countryCode} → ${detectedLive.code} (rate: ${detectedLive.rate})`
      );
    } catch (err) {
      console.error("Currency detection error:", err);
    }
  }, [currency.code, syncCurrencyFromLive]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // ✅ Check saved preference first (instant)
    const savedCode = loadCurrencyPreference();
    if (savedCode) {
      const saved = staticCurrencies.find((c) => c.code === savedCode);
      if (saved) {
        setCurrencyState(saved);
        // Still fetch live rates in background
        fetchLiveRates().then((liveRates) => {
          if (liveRates) {
            const updatedList = applyLiveRates(liveRates);
            setLiveCurrencies(updatedList);
            syncCurrencyFromLive(savedCode, updatedList);
          }
        });
        return;
      }
    }

    // No saved preference — detect country + fetch live rates
    refreshCurrency();
  }, [refreshCurrency, syncCurrencyFromLive]);

  const convert = useCallback(
    (priceInPKR: number) => convertPrice(priceInPKR, currency),
    [currency]
  );

  const format = useCallback(
    (priceInPKR: number) => formatPrice(priceInPKR, currency),
    [currency]
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
