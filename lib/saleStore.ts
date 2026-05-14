// lib/saleStore.ts
// ✅ FIXED VERSION
// - Sale sirf explicit apply karne pe lagti hai, auto-fetch nahi
// - Edit product button stuck nahi hoga
// - Prices immediately update hongi
// - hasFetchedOnce flag properly managed

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
// Internal: clear sale cache
// ─────────────────────────────────────────────
function clearSaleCache() {
  currentSalePercent = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("active_sale_percent");
    sessionStorage.removeItem("active_sale_percent");
  }
}

// ─────────────────────────────────────────────
// fetchSaleFromDB — DB se current sale fetch karo
// Admin panel pe "Apply" button click karne ke baad call ho
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
        .maybeSingle(), // ✅ .single() ki jagah .maybeSingle() — row na ho toh error nahi
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
      if ([10, 20, 30].includes(p)) {
        percent = p;
        currentSalePercent = percent;
        localStorage.setItem("active_sale_percent", String(percent));
        sessionStorage.setItem("active_sale_percent", String(percent));
      } else {
        clearSaleCache();
      }
    } else {
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
    hasFetchedOnce = true; // error pe bhi flag set karo — stuck na rahe
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
// setSalePercent — DB mein save karo + immediately notify
// ✅ FIX: Promise.race se timeout add kiya — button stuck nahi hoga
// ─────────────────────────────────────────────
export async function setSalePercent(
  percent: 10 | 20 | 30 | null,
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), 8000),
  );

  try {
    if (percent === null) {
      const dbOp = supabase
        .from("site_settings")
        .delete()
        .eq("key", "active_sale_percent");

      const { error } = (await Promise.race([dbOp, timeout])) as Awaited<
        typeof dbOp
      >;
      if (error) throw error;
      clearSaleCache();
    } else {
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
// ✅ FIX: Yeh hook ab DB se auto-fetch NAHI karta
//    Sirf in-memory state aur events listen karta hai
//    Agar aap chahte hain first load pe fetch ho — initSaleStore() call karo app layout mein
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
    // ✅ Agar pehle se fetch ho chuki hai — loading false karo
    if (hasFetchedOnce) {
      setSaleData({
        percent: currentSalePercent,
        bannerEnabled: currentBannerEnabled,
      });
      setLoading(false);
    } else {
      // ✅ Pehli baar — fetch karo
      fetchSaleFromDB().then((data) => {
        setSaleData(data);
        setLoading(false);
      });
    }

    // In-app changes listen karo
    const unsubscribe = listenToSaleChanges((data) => {
      setSaleData(data);
    });

    // Cross-tab events
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
// useProductPrice — Add/Edit product page ke liye
// ✅ Simple hook jo current sale ke saath prices calculate kare
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
