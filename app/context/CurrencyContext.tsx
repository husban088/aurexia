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
  refreshCurrency: () => Promise<void>;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // Start with PKR as default — fastest for panel, no detection delay
  const [currency, setCurrencyState] = useState<Currency>(
    currencies.find((c) => c.code === "PKR") || currencies[0]
  );
  const [loading, setLoading] = useState(false);
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

    console.log("🔄 Detecting user country and currency (background)...");

    try {
      // Try server API first with 3s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      let serverData: any = { success: false };
      try {
        const serverResponse = await fetch("/api/detect-country", {
          signal: controller.signal,
        });
        serverData = await serverResponse.json();
      } catch {
        /* timeout or network error — continue */
      }
      clearTimeout(timeoutId);

      if (serverData.country && serverData.success !== false) {
        const detectedCurrency = getCurrencyByCountry(serverData.country);
        console.log(
          "📍 Server detected:",
          serverData.country,
          "→",
          detectedCurrency.code
        );
        setCurrency(detectedCurrency);
        return;
      }

      // Client-side detection (also runs in background)
      const countryCode = await detectUserCountry();
      const detectedCurrency = getCurrencyByCountry(countryCode);
      console.log(
        "📍 Client detected:",
        countryCode,
        "→",
        detectedCurrency.code
      );
      setCurrency(detectedCurrency);
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
      }
    }
  }, [setCurrency]);

  // Refresh on mount
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
        // Still refresh in background to keep updated
        refreshCurrency();
        return;
      }
    }

    // Detect in background — never blocks render
    refreshCurrency();
  }, [refreshCurrency]);

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
