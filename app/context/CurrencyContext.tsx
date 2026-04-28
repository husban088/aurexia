// context/CurrencyContext.tsx
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
  defaultCurrency,
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
  const [currency, setCurrencyState] = useState<Currency>(defaultCurrency);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const setCurrency = useCallback((newCurrency: Currency) => {
    console.log("💰 Setting currency to:", newCurrency.code);
    setCurrencyState(newCurrency);
    saveCurrencyPreference(newCurrency.code);
  }, []);

  const refreshCurrency = useCallback(async () => {
    console.log("🔄 Refreshing currency detection...");

    try {
      // Try server API first
      const serverResponse = await fetch("/api/detect-country");

      if (!serverResponse.ok) {
        throw new Error(`Server responded with ${serverResponse.status}`);
      }

      const serverData = await serverResponse.json();

      if (serverData.country && serverData.success !== false) {
        const detectedCurrency = getCurrencyByCountry(serverData.country);
        console.log(
          "📍 Server detected country:",
          serverData.country,
          "Currency:",
          detectedCurrency.code
        );
        setCurrency(detectedCurrency);
        return;
      }

      // Fallback to client-side IP detection
      const countryCode = await detectUserCountry();
      const detectedCurrency = getCurrencyByCountry(countryCode);
      console.log(
        "📍 Client detected country:",
        countryCode,
        "Currency:",
        detectedCurrency.code
      );
      setCurrency(detectedCurrency);
    } catch (error) {
      console.error("❌ Currency detection failed:", error);
      // Try to get from localStorage as last resort
      const savedCode = loadCurrencyPreference();
      if (savedCode) {
        const savedCurrency = currencies.find((c) => c.code === savedCode);
        if (savedCurrency) {
          console.log(
            "💾 Using saved currency from localStorage:",
            savedCurrency.code
          );
          setCurrency(savedCurrency);
        } else {
          // If saved currency not found, use default
          console.log("⚠️ Saved currency not found, using default");
          setCurrency(defaultCurrency);
        }
      } else {
        // Last resort: use default
        console.log("⚠️ No saved currency, using default");
        setCurrency(defaultCurrency);
      }
    } finally {
      setLoading(false);
    }
  }, [setCurrency]);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Check localStorage first
    const savedCode = loadCurrencyPreference();
    if (savedCode) {
      const savedCurrency = currencies.find((c) => c.code === savedCode);
      if (savedCurrency) {
        console.log(
          "💾 Using saved currency from localStorage:",
          savedCurrency.code
        );
        setCurrencyState(savedCurrency);
        setLoading(false);
        // Still refresh in background to update if country changed
        refreshCurrency();
        return;
      }
    }

    // Force fresh detection
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
