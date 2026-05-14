// lib/saleStore.ts

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

let currentSalePercent: number | null = null;
let currentBannerEnabled: boolean = false;
// Track whether we have fetched from DB at least once
let hasFetchedOnce: boolean = false;

let listeners: ((data: {
  percent: number | null;
  bannerEnabled: boolean;
}) => void)[] = [];

// ─────────────────────────────────────────────
// Internal helper: clear all sale cache
// ─────────────────────────────────────────────
function clearSaleCache() {
  currentSalePercent = null;
  localStorage.removeItem("active_sale_percent");
  sessionStorage.removeItem("active_sale_percent");
}

// ─────────────────────────────────────────────
// Get current active sale from DATABASE (source of truth)
// Always clears cache if DB says no sale
// ─────────────────────────────────────────────
export async function fetchSaleFromDB(): Promise<{
  percent: number | null;
  bannerEnabled: boolean;
}> {
  if (typeof window === "undefined")
    return { percent: currentSalePercent, bannerEnabled: currentBannerEnabled };

  try {
    // Fetch sale percent
    const { data: saleData, error: saleError } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "active_sale_percent")
      .single();

    // Fetch banner enabled setting
    const { data: bannerData, error: bannerError } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "sale_banner_enabled")
      .single();

    // ✅ FIX: Always reset percent first, then check if DB has a valid value
    // This ensures that if DB has no row (saleError), we clear stale cache
    let percent: number | null = null;

    if (!saleError && saleData) {
      const p = saleData.value;
      if ([10, 20, 30].includes(p)) {
        percent = p;
        currentSalePercent = percent;
        localStorage.setItem("active_sale_percent", String(percent));
        sessionStorage.setItem("active_sale_percent", String(percent));
      } else {
        // DB has a row but value is invalid — treat as no sale
        clearSaleCache();
      }
    } else {
      // ✅ FIX: DB has no row OR error — ALWAYS clear localStorage/cache
      // This was the main bug: previously localStorage was NOT cleared here
      clearSaleCache();
    }

    let bannerEnabled: boolean = false;
    if (!bannerError && bannerData) {
      bannerEnabled = bannerData.value === true;
      currentBannerEnabled = bannerEnabled;
      localStorage.setItem("sale_banner_enabled", String(bannerEnabled));
      sessionStorage.setItem("sale_banner_enabled", String(bannerEnabled));
    } else {
      // No banner setting in DB — treat as disabled and clear cache
      currentBannerEnabled = false;
      localStorage.setItem("sale_banner_enabled", "false");
      sessionStorage.setItem("sale_banner_enabled", "false");
    }

    hasFetchedOnce = true;
    return { percent, bannerEnabled };
  } catch (err) {
    console.warn("[saleStore] Failed to fetch from DB:", err);
    return { percent: null, bannerEnabled: false };
  }
}

// ─────────────────────────────────────────────
// Get sale percent (fast, from cache)
// NOTE: Always call fetchSaleFromDB() on page load first!
// getSalePercent() is only for after the first fetch has happened.
// ─────────────────────────────────────────────
export function getSalePercent(): number | null {
  if (typeof window === "undefined") return currentSalePercent;

  // ✅ FIX: If we haven't fetched from DB yet, do NOT trust localStorage.
  // Return null so components show no discount until DB fetch completes.
  if (!hasFetchedOnce) return null;

  // After DB fetch, currentSalePercent is the source of truth
  return currentSalePercent;
}

// ─────────────────────────────────────────────
// Get banner enabled status
// ─────────────────────────────────────────────
export function isBannerEnabled(): boolean {
  if (typeof window === "undefined") return currentBannerEnabled;

  // ✅ FIX: Same logic — don't trust localStorage before DB fetch
  if (!hasFetchedOnce) return false;

  return currentBannerEnabled;
}

// ─────────────────────────────────────────────
// Set sale percent — saves to DATABASE
// ─────────────────────────────────────────────
export async function setSalePercent(
  percent: 10 | 20 | 30 | null,
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    if (percent === null) {
      // ✅ Delete the row from DB
      const { error } = await supabase
        .from("site_settings")
        .delete()
        .eq("key", "active_sale_percent");

      if (error) throw error;

      // ✅ Clear ALL caches
      clearSaleCache();
    } else {
      // Upsert the setting
      const { error } = await supabase.from("site_settings").upsert(
        {
          key: "active_sale_percent",
          value: percent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

      if (error) throw error;

      currentSalePercent = percent;
      localStorage.setItem("active_sale_percent", String(percent));
      sessionStorage.setItem("active_sale_percent", String(percent));
    }

    // Notify all listeners
    notifyListeners();

    return true;
  } catch (err) {
    console.error("[saleStore] Failed to save sale:", err);
    return false;
  }
}

// ─────────────────────────────────────────────
// Set banner visibility — saves to DATABASE
// ─────────────────────────────────────────────
export async function setBannerEnabled(enabled: boolean): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "sale_banner_enabled",
        value: enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (error) throw error;

    currentBannerEnabled = enabled;
    localStorage.setItem("sale_banner_enabled", String(enabled));
    sessionStorage.setItem("sale_banner_enabled", String(enabled));

    // Notify all listeners
    notifyListeners();

    return true;
  } catch (err) {
    console.error("[saleStore] Failed to save banner setting:", err);
    return false;
  }
}

// ─────────────────────────────────────────────
// Internal: notify all listeners + dispatch cross-tab event
// ─────────────────────────────────────────────
function notifyListeners() {
  const payload = {
    percent: currentSalePercent,
    bannerEnabled: currentBannerEnabled,
  };

  listeners.forEach((listener) => listener(payload));

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("saleDataChanged", { detail: payload }),
    );
  }
}

// ─────────────────────────────────────────────
// Apply discount to a price
// ─────────────────────────────────────────────
export function applyDiscount(price: number, percent: number | null): number {
  if (!percent || percent <= 0) return price;
  return Math.round(price * (1 - percent / 100));
}

// ─────────────────────────────────────────────
// Listen for sale changes (returns unsubscribe fn)
// ─────────────────────────────────────────────
export function listenToSaleChanges(
  callback: (data: { percent: number | null; bannerEnabled: boolean }) => void,
) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

// ─────────────────────────────────────────────
// Initialize — call once on app start
// ─────────────────────────────────────────────
export async function initSaleStore() {
  await fetchSaleFromDB();
}

// ─────────────────────────────────────────────
// useSaleSync — React hook for components
// Always fetches from DB on mount (never trusts stale localStorage)
// ─────────────────────────────────────────────
export function useSaleSync() {
  const [saleData, setSaleData] = useState<{
    percent: number | null;
    bannerEnabled: boolean;
  }>({
    // ✅ FIX: Start with null/false — don't pre-load from localStorage
    // This prevents showing stale 10% discount before DB confirms
    percent: null,
    bannerEnabled: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always fetch fresh from DB on mount
    fetchSaleFromDB().then((data) => {
      setSaleData(data);
      setLoading(false);
    });

    // Listen for in-app changes (admin panel se)
    const unsubscribe = listenToSaleChanges(setSaleData);

    // Listen for cross-tab events
    const handleCustomEvent = (e: CustomEvent) => {
      setSaleData(e.detail);
    };
    window.addEventListener(
      "saleDataChanged",
      handleCustomEvent as EventListener,
    );

    return () => {
      unsubscribe();
      window.removeEventListener(
        "saleDataChanged",
        handleCustomEvent as EventListener,
      );
    };
  }, []);

  return { saleData, loading };
}
