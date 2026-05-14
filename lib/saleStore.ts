// lib/saleStore.ts
// ✅ FULLY FIXED VERSION
// - Remove sale DB se permanently delete hoti hai (double-check ke saath)
// - Auto-apply nahi hoti jab tak admin click na kare
// - Page reload ke baad bhi removed state rehti hai

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

let currentSalePercent: number | null = null;
let currentBannerEnabled: boolean = false;
let hasFetchedOnce: boolean = false;

let listeners: ((data: {
  percent: number | null;
  bannerEnabled: boolean;
}) => void)[] = [];

// ─────────────────────────────────────────────
// Internal: clear sale cache (memory + storage)
// ─────────────────────────────────────────────
function clearSaleCache() {
  currentSalePercent = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("active_sale_percent");
    sessionStorage.removeItem("active_sale_percent");
    // Extra keys jo purane code mein store ho sakti theen
    localStorage.removeItem("sale_percent");
    sessionStorage.removeItem("sale_percent");
  }
}

// ─────────────────────────────────────────────
// fetchSaleFromDB — DB se current sale fetch karo
// ─────────────────────────────────────────────
export async function fetchSaleFromDB(): Promise<{
  percent: number | null;
  bannerEnabled: boolean;
}> {
  if (typeof window === "undefined")
    return { percent: currentSalePercent, bannerEnabled: currentBannerEnabled };

  try {
    const [saleRes, bannerRes] = await Promise.all([
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "active_sale_percent")
        .maybeSingle(),
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "sale_banner_enabled")
        .maybeSingle(),
    ]);

    // ── Sale Percent ──
    let percent: number | null = null;
    if (saleRes.data) {
      const p = saleRes.data.value;
      // ✅ Sirf valid values accept karo — null, 0, ya invalid value aaye toh clear karo
      if (p !== null && p !== 0 && [10, 20, 30].includes(Number(p))) {
        percent = Number(p);
        currentSalePercent = percent;
        localStorage.setItem("active_sale_percent", String(percent));
        sessionStorage.setItem("active_sale_percent", String(percent));
      } else {
        // Row hai lekin value invalid/null/0 — clear karo
        clearSaleCache();
      }
    } else {
      // Row hi nahi hai — clear karo
      clearSaleCache();
    }

    // ── Banner Enabled ──
    let bannerEnabled = false;
    if (bannerRes.data) {
      bannerEnabled = bannerRes.data.value === true;
      currentBannerEnabled = bannerEnabled;
      localStorage.setItem("sale_banner_enabled", String(bannerEnabled));
      sessionStorage.setItem("sale_banner_enabled", String(bannerEnabled));
    } else {
      currentBannerEnabled = false;
      localStorage.setItem("sale_banner_enabled", "false");
      sessionStorage.setItem("sale_banner_enabled", "false");
    }

    hasFetchedOnce = true;
    notifyListeners();
    return { percent, bannerEnabled };
  } catch (err) {
    console.warn("[saleStore] fetchSaleFromDB failed:", err);
    hasFetchedOnce = true;
    return { percent: null, bannerEnabled: false };
  }
}

// ─────────────────────────────────────────────
// getSalePercent — cached value return karo
// ─────────────────────────────────────────────
export function getSalePercent(): number | null {
  if (typeof window === "undefined") return currentSalePercent;
  if (!hasFetchedOnce) return null;
  return currentSalePercent;
}

// ─────────────────────────────────────────────
// isBannerEnabled
// ─────────────────────────────────────────────
export function isBannerEnabled(): boolean {
  if (typeof window === "undefined") return currentBannerEnabled;
  if (!hasFetchedOnce) return false;
  return currentBannerEnabled;
}

// ─────────────────────────────────────────────
// setSalePercent — DB mein save/delete karo
// ✅ FIX: null ke liye pehle upsert(0) phir delete — Supabase silent fail handle
// ✅ FIX: delete ke baad verify karo ke row actually gayi
// ─────────────────────────────────────────────
export async function setSalePercent(
  percent: 10 | 20 | 30 | null,
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const TIMEOUT_MS = 8000;
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), TIMEOUT_MS),
  );

  try {
    if (percent === null) {
      // ── REMOVE SALE ──
      // Step 1: Pehle localStorage/sessionStorage clear karo
      clearSaleCache();
      currentSalePercent = null;

      // Step 2: DB se delete karo
      const deleteOp = supabase
        .from("site_settings")
        .delete()
        .eq("key", "active_sale_percent");

      const { error: deleteError } = (await Promise.race([
        deleteOp,
        timeout,
      ])) as Awaited<typeof deleteOp>;

      if (deleteError) {
        console.error("[saleStore] Delete failed:", deleteError);
        throw deleteError;
      }

      // Step 3: ✅ Verify karo ke row actually delete hui
      const verifyTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Verify timeout")), 5000),
      );

      const verifyOp = supabase
        .from("site_settings")
        .select("value")
        .eq("key", "active_sale_percent")
        .maybeSingle();

      const verifyResult = (await Promise.race([
        verifyOp,
        verifyTimeout,
      ])) as Awaited<typeof verifyOp>;

      if (verifyResult.data !== null) {
        // Row abhi bhi hai — forcefully upsert null value
        console.warn(
          "[saleStore] Row still exists after delete, forcing upsert with null...",
        );
        const forceOp = supabase.from("site_settings").upsert(
          {
            key: "active_sale_percent",
            value: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" },
        );

        const forceTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Force timeout")), 5000),
        );

        const { error: forceError } = (await Promise.race([
          forceOp,
          forceTimeout,
        ])) as Awaited<typeof forceOp>;

        if (forceError) {
          console.error("[saleStore] Force upsert failed:", forceError);
          throw forceError;
        }

        // Ab phir delete try karo
        await supabase
          .from("site_settings")
          .delete()
          .eq("key", "active_sale_percent");
      }

      // Memory mein bhi clear karo
      clearSaleCache();
      currentSalePercent = null;
    } else {
      // ── APPLY SALE ──
      const dbOp = supabase.from("site_settings").upsert(
        {
          key: "active_sale_percent",
          value: percent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

      const { error } = (await Promise.race([dbOp, timeout])) as Awaited<
        typeof dbOp
      >;
      if (error) throw error;

      currentSalePercent = percent;
      localStorage.setItem("active_sale_percent", String(percent));
      sessionStorage.setItem("active_sale_percent", String(percent));
    }

    hasFetchedOnce = true;
    notifyListeners();
    return true;
  } catch (err) {
    console.error("[saleStore] setSalePercent failed:", err);
    return false;
  }
}

// ─────────────────────────────────────────────
// setBannerEnabled
// ─────────────────────────────────────────────
export async function setBannerEnabled(enabled: boolean): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), 8000),
  );

  try {
    const dbOp = supabase.from("site_settings").upsert(
      {
        key: "sale_banner_enabled",
        value: enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    const { error } = (await Promise.race([dbOp, timeout])) as Awaited<
      typeof dbOp
    >;
    if (error) throw error;

    currentBannerEnabled = enabled;
    localStorage.setItem("sale_banner_enabled", String(enabled));
    sessionStorage.setItem("sale_banner_enabled", String(enabled));

    notifyListeners();
    return true;
  } catch (err) {
    console.error("[saleStore] setBannerEnabled failed:", err);
    return false;
  }
}

// ─────────────────────────────────────────────
// applyDiscount
// ─────────────────────────────────────────────
export function applyDiscount(price: number, percent: number | null): number {
  if (!percent || percent <= 0) return price;
  return Math.round(price * (1 - percent / 100));
}

// ─────────────────────────────────────────────
// Internal: notify listeners
// ─────────────────────────────────────────────
function notifyListeners() {
  const payload = {
    percent: currentSalePercent,
    bannerEnabled: currentBannerEnabled,
  };
  listeners.forEach((l) => l(payload));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("saleDataChanged", { detail: payload }),
    );
  }
}

// ─────────────────────────────────────────────
// listenToSaleChanges
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
// initSaleStore — app start pe once call karo
// ─────────────────────────────────────────────
export async function initSaleStore() {
  await fetchSaleFromDB();
}

// ─────────────────────────────────────────────
// useSaleSync — React hook
// ─────────────────────────────────────────────
export function useSaleSync() {
  const [saleData, setSaleData] = useState<{
    percent: number | null;
    bannerEnabled: boolean;
  }>({
    percent: hasFetchedOnce ? currentSalePercent : null,
    bannerEnabled: hasFetchedOnce ? currentBannerEnabled : false,
  });
  const [loading, setLoading] = useState(!hasFetchedOnce);

  useEffect(() => {
    if (hasFetchedOnce) {
      setSaleData({
        percent: currentSalePercent,
        bannerEnabled: currentBannerEnabled,
      });
      setLoading(false);
    } else {
      fetchSaleFromDB().then((data) => {
        setSaleData(data);
        setLoading(false);
      });
    }

    const unsubscribe = listenToSaleChanges((data) => {
      setSaleData(data);
    });

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

// ─────────────────────────────────────────────
// useProductPrice
// ─────────────────────────────────────────────
export function useProductPrice(basePrice: number | null) {
  const { saleData, loading } = useSaleSync();

  const originalPrice = basePrice ?? 0;
  const salePrice =
    saleData.percent && originalPrice > 0
      ? applyDiscount(originalPrice, saleData.percent)
      : null;

  return {
    originalPrice,
    salePrice,
    salePercent: saleData.percent,
    loading,
  };
}
