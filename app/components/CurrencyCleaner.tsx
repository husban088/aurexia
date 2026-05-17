// app/components/CurrencyCleaner.tsx
// ✅ Yeh component sirf ek kaam karta hai:
// Agar user ne KHUD currency select nahi ki (auto-detect se USD save hua tha)
// toh woh galat localStorage entry delete kar deta hai
// Iske baad fresh IP-based detection hoti hai
"use client";

import { useEffect } from "react";

export function CurrencyCleaner() {
  useEffect(() => {
    try {
      const userSelected = localStorage.getItem("currencyUserSelected");

      // Agar user ne manually select NAHI kiya — purani auto-saved entry hatao
      if (userSelected !== "true") {
        const hadOldEntry = localStorage.getItem("preferredCurrency");
        if (hadOldEntry) {
          console.log(
            "🧹 Clearing auto-saved currency:",
            hadOldEntry,
            "(was not user-selected)",
          );
          localStorage.removeItem("preferredCurrency");
          // Cookie bhi clear karo
          document.cookie =
            "preferredCurrency=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      }
    } catch {}
  }, []);

  return null; // Koi UI nahi render karta
}
