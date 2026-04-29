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
  currencies,
  Currency,
  detectUserCountry,
  getCurrencyByCountry,
  saveCurrencyPreference,
  loadCurrencyPreference,
  convertPrice,
  formatPrice,
} from "@/lib/currency";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceInPKR: number) => number;
  formatPrice: (priceInPKR: number) => string;
  loading: boolean;
  refreshCurrency: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // ✅ ALL HOOKS MUST BE AT TOP LEVEL - NO CONDITIONS BEFORE HOOKS
  const [currency, setCurrencyState] = useState<Currency>(currencies[0]); // Initialize with USD
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const detectionAttemptedRef = useRef(false);

  const setCurrency = useCallback((newCurrency: Currency) => {
    console.log("💰 Setting currency to:", newCurrency.code, newCurrency.flag);
    setCurrencyState(newCurrency);
    saveCurrencyPreference(newCurrency.code);
  }, []);

  const refreshCurrency = useCallback(async () => {
    if (detectionAttemptedRef.current) return;
    detectionAttemptedRef.current = true;

    console.log("🔄 Detecting user country and currency...");

    try {
      // Try server API first
      const serverResponse = await fetch("/api/detect-country");
      const serverData = await serverResponse.json();

      if (serverData.country && serverData.success !== false) {
        const detectedCurrency = getCurrencyByCountry(serverData.country);
        console.log(
          "📍 Server detected:",
          serverData.country,
          "→ Currency:",
          detectedCurrency.code
        );
        setCurrency(detectedCurrency);
        setLoading(false);
        return;
      }

      // Client-side detection
      const countryCode = await detectUserCountry();
      const detectedCurrency = getCurrencyByCountry(countryCode);
      console.log(
        "📍 Client detected:",
        countryCode,
        "→ Currency:",
        detectedCurrency.code
      );
      setCurrency(detectedCurrency);
      setLoading(false);
    } catch (error) {
      console.error("❌ Currency detection failed:", error);
      // Fallback - use browser language
      if (typeof navigator !== "undefined") {
        const lang = navigator.language;
        if (lang.includes("PK")) setCurrency(getCurrencyByCountry("PK"));
        else if (lang.includes("GB")) setCurrency(getCurrencyByCountry("GB"));
        else if (lang.includes("AE")) setCurrency(getCurrencyByCountry("AE"));
        else if (lang.includes("SA")) setCurrency(getCurrencyByCountry("SA"));
        else if (lang.includes("AU")) setCurrency(getCurrencyByCountry("AU"));
        else if (lang.includes("CA")) setCurrency(getCurrencyByCountry("CA"));
        else if (lang.includes("IN")) setCurrency(getCurrencyByCountry("IN"));
        else setCurrency(getCurrencyByCountry("US"));
      } else {
        setCurrency(getCurrencyByCountry("US"));
      }
      setLoading(false);
    }
  }, [setCurrency]);

  // Refresh on mount - but keep hooks at top level
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Check for saved preference first
    const savedCode = loadCurrencyPreference();
    if (savedCode) {
      const savedCurrency = currencies.find((c) => c.code === savedCode);
      if (savedCurrency) {
        console.log("📀 Found saved currency:", savedCurrency.code);
        setCurrencyState(savedCurrency);
        setLoading(false);
        // Still refresh in background
        refreshCurrency();
        return;
      }
    }

    refreshCurrency();
  }, [refreshCurrency]);

  // ✅ HOOKS ARE ALWAYS CALLED - NO CONDITIONAL RETURNS BEFORE HOOKS
  const convert = useCallback(
    (priceInPKR: number) => convertPrice(priceInPKR, currency),
    [currency]
  );

  const format = useCallback(
    (priceInPKR: number) => formatPrice(priceInPKR, currency),
    [currency]
  );

  // ✅ Return JSX after all hooks
  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        convertPrice: convert,
        formatPrice: format,
        loading,
        refreshCurrency,
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
