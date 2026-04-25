"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(currencies[0]);
  const [loading, setLoading] = useState(true);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    saveCurrencyPreference(newCurrency.code);
  }, []);

  useEffect(() => {
    const initCurrency = async () => {
      // Check for saved preference
      const savedCode = loadCurrencyPreference();
      if (savedCode) {
        const savedCurrency = currencies.find((c) => c.code === savedCode);
        if (savedCurrency) {
          setCurrencyState(savedCurrency);
          setLoading(false);
          return;
        }
      }

      // Auto-detect from IP
      try {
        const countryCode = await detectUserCountry();
        const detectedCurrency = getCurrencyByCountry(countryCode);
        setCurrencyState(detectedCurrency);
      } catch (error) {
        console.error("Currency detection failed:", error);
        setCurrencyState(currencies[0]);
      }
      setLoading(false);
    };

    initCurrency();
  }, []);

  const convert = useCallback(
    (priceInPKR: number) => {
      return convertPrice(priceInPKR, currency);
    },
    [currency]
  );

  const format = useCallback(
    (priceInPKR: number) => {
      return formatPrice(priceInPKR, currency);
    },
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
