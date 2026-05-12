// lib/saleStore.ts

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

let currentSalePercent: number | null = null;
let currentBannerEnabled: boolean = false;
let listeners: ((data: {
  percent: number | null;
  bannerEnabled: boolean;
}) => void)[] = [];

// Get current active sale from database
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

    let percent: number | null = null;
    if (!saleError && saleData) {
      const p = saleData.value;
      if ([10, 20, 30].includes(p)) {
        percent = p;
        currentSalePercent = percent;
        localStorage.setItem("active_sale_percent", String(percent));
      }
    }

    let bannerEnabled: boolean = false;
    if (!bannerError && bannerData) {
      bannerEnabled = bannerData.value === true;
      currentBannerEnabled = bannerEnabled;
      localStorage.setItem("sale_banner_enabled", String(bannerEnabled));
    }

    return { percent, bannerEnabled };
  } catch (err) {
    console.warn("[saleStore] Failed to fetch from DB:", err);
    return { percent: null, bannerEnabled: false };
  }
}

// Get current active sale (fast, from cache)
export function getSalePercent(): number | null {
  if (typeof window === "undefined") return currentSalePercent;

  if (currentSalePercent !== null) return currentSalePercent;

  const cached = localStorage.getItem("active_sale_percent");
  if (cached) {
    const num = parseInt(cached, 10);
    if ([10, 20, 30].includes(num)) {
      currentSalePercent = num;
      return num;
    }
  }

  return null;
}

// Get banner enabled status
export function isBannerEnabled(): boolean {
  if (typeof window === "undefined") return currentBannerEnabled;

  if (currentBannerEnabled !== null) return currentBannerEnabled;

  const cached = localStorage.getItem("sale_banner_enabled");
  if (cached) {
    const enabled = cached === "true";
    currentBannerEnabled = enabled;
    return enabled;
  }

  return false;
}

// Set sale (admin panel se call hoga) - saves to DATABASE
export async function setSalePercent(
  percent: 10 | 20 | 30 | null,
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    if (percent === null) {
      // Delete the setting
      await supabase
        .from("site_settings")
        .delete()
        .eq("key", "active_sale_percent");

      currentSalePercent = null;
      localStorage.removeItem("active_sale_percent");
      sessionStorage.removeItem("active_sale_percent");
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

    // Notify all listeners with current banner state
    listeners.forEach((listener) =>
      listener({
        percent: currentSalePercent,
        bannerEnabled: currentBannerEnabled,
      }),
    );

    // Dispatch event for cross-tab communication
    window.dispatchEvent(
      new CustomEvent("saleDataChanged", {
        detail: {
          percent: currentSalePercent,
          bannerEnabled: currentBannerEnabled,
        },
      }),
    );

    return true;
  } catch (err) {
    console.error("[saleStore] Failed to save sale:", err);
    return false;
  }
}

// Set banner visibility (admin panel se call hoga)
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
    listeners.forEach((listener) =>
      listener({
        percent: currentSalePercent,
        bannerEnabled: currentBannerEnabled,
      }),
    );

    // Dispatch event for cross-tab communication
    window.dispatchEvent(
      new CustomEvent("saleDataChanged", {
        detail: {
          percent: currentSalePercent,
          bannerEnabled: currentBannerEnabled,
        },
      }),
    );

    return true;
  } catch (err) {
    console.error("[saleStore] Failed to save banner setting:", err);
    return false;
  }
}

// Price pe discount apply karne ka helper
export function applyDiscount(price: number, percent: number | null): number {
  if (!percent || percent <= 0) return price;
  return Math.round(price * (1 - percent / 100));
}

// Listen for sale changes
export function listenToSaleChanges(
  callback: (data: { percent: number | null; bannerEnabled: boolean }) => void,
) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

// Initialize - fetch from DB on app start
export async function initSaleStore() {
  await fetchSaleFromDB();
}

// For components that need to sync with DB
export function useSaleSync() {
  const [saleData, setSaleData] = useState<{
    percent: number | null;
    bannerEnabled: boolean;
  }>(() => ({
    percent: getSalePercent(),
    bannerEnabled: isBannerEnabled(),
  }));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from DB on mount
    fetchSaleFromDB().then((data) => {
      setSaleData(data);
      setLoading(false);
    });

    // Listen for changes
    const unsubscribe = listenToSaleChanges(setSaleData);

    // Listen for custom event
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
