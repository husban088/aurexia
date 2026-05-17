// app/components/CurrencyCleaner.tsx
"use client";

/**
 * Sirf ek kaam: agar user ne khud select nahi kiya toh old auto-saved entry clear karo.
 * Detect karna CurrencyContext ka kaam hai — is component ka nahi.
 */

import { useEffect } from "react";

export function CurrencyCleaner() {
  useEffect(() => {
    try {
      if (localStorage.getItem("currencyUserSelected") !== "true") {
        localStorage.removeItem("preferredCurrency");
        document.cookie =
          "preferredCurrency=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    } catch {}
  }, []);
  return null;
}
