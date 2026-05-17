// app/components/CurrencyCleaner.tsx
"use client";

import { useEffect } from "react";

export function CurrencyCleaner() {
  useEffect(() => {
    try {
      // ✅ SIRF tab clear karo agar user ne MANUALLY select nahi kiya
      const userSelected = localStorage.getItem("currencyUserSelected");

      if (userSelected !== "true") {
        // Clean old auto-detected data only
        const currentPref = localStorage.getItem("preferredCurrency");

        // Agar PKR hai toh clear karo (auto-detected hoga)
        if (currentPref === "PKR") {
          localStorage.removeItem("preferredCurrency");
          document.cookie =
            "preferredCurrency=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }

        // NEVER clear currencyUserSelected flag here
      }
    } catch (e) {
      console.error("CurrencyCleaner error:", e);
    }
  }, []);

  return null;
}
