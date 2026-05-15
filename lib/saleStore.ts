// lib/saleStore.ts
// ✅ FIXED VERSION
// - Sale completely optional hai — sirf admin ke Apply click karne pe lagti hai
// - Bulk pricing original_price (e.g. 2000) se calculate hoti hai, sale price se nahi
// - 2 piece = 2 × original_price, 3 piece = 3 × original_price (koi bulk tier nahi ho toh)
// - Sale percent apply karo BAAD mein (optional)

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
      if (p !== null && p !== 0 && [10, 20, 30].includes(Number(p))) {
        percent = Number(p);
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
      clearSaleCache();
      currentSalePercent = null;

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

      // Verify deletion
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
        console.warn(
          "[saleStore] Row still exists after delete, forcing null...",
        );
        const forceOp = supabase
          .from("site_settings")
          .upsert(
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
        if (forceError) throw forceError;
        await supabase
          .from("site_settings")
          .delete()
          .eq("key", "active_sale_percent");
      }

      clearSaleCache();
      currentSalePercent = null;
    } else {
      // ── APPLY SALE ──
      const dbOp = supabase
        .from("site_settings")
        .upsert(
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
    const dbOp = supabase
      .from("site_settings")
      .upsert(
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
// applyDiscount — simple percent discount
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

    const unsubscribe = listenToSaleChanges((data) => setSaleData(data));
    const handleCustomEvent = (e: CustomEvent) => setSaleData(e.detail);
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
// useProductPrice — single price hook
// ✅ Sale optional hai — sirf tab apply hogi jab salePercent valid ho
// ─────────────────────────────────────────────
export function useProductPrice(basePrice: number | null) {
  const { saleData, loading } = useSaleSync();
  const originalPrice = basePrice ?? 0;

  const salePrice =
    saleData.percent && saleData.percent > 0 && originalPrice > 0
      ? applyDiscount(originalPrice, saleData.percent)
      : null;

  const finalPrice = salePrice ?? originalPrice;

  return {
    originalPrice,
    salePrice,
    finalPrice,
    salePercent: saleData.percent,
    loading,
  };
}

// ─────────────────────────────────────────────
// applyBulkDiscount — FIXED
//
// ✅ RULE: Har quantity ke liye base HAMESHA original_price hogi
//    (woh price jo admin ne "Original Price" field mein daali — e.g. 2000)
//
// ✅ Agar koi bulk tier set nahi ki toh:
//    total = quantity × original_price
//    e.g. 2 piece × ₨2000 = ₨4000
//         3 piece × ₨2000 = ₨6000
//
// ✅ Agar bulk tier set ki hai (e.g. 5+ pieces = ₨1800/pc):
//    total = quantity × tier_price
//    saving = quantity × (original_price - tier_price)
//
// ✅ Sale optional — sirf tab apply hogi jab salePercent pass ho
//    (admin ke Apply button se)
//
// Parameters:
//   originalPrice  — variant ka original_price field (e.g. 2000) ← BASE
//   salePrice      — variant ka price field (e.g. 1500, sale price) — sirf reference ke liye
//   quantity       — kitne pieces
//   bulkTiers      — admin ki set ki hui bulk tiers (optional)
//   salePercent    — active sale % (null = sale off, optional)
// ─────────────────────────────────────────────
export function applyBulkDiscount(
  originalPrice: number, // ✅ original_price — always the base (e.g. 2000)
  quantity: number,
  bulkTiers: { min_qty: number; price_per_unit: number }[],
  salePercent: number | null = null, // ✅ optional, default null (no sale)
): {
  pricePerUnit: number; // final per-unit price shown to customer
  originalPerUnit: number; // original_price (strikethrough ke liye)
  totalPrice: number; // pricePerUnit × quantity
  totalOriginalPrice: number; // originalPerUnit × quantity (strikethrough total)
  saving: number; // total saving per quantity
  savingPerUnit: number; // saving per piece
  discountPercent: number; // effective discount %
  bulkTierApplied: boolean; // kya bulk tier matched
} {
  // Step 1: Bulk tier dhundo
  const sortedTiers = [...bulkTiers].sort((a, b) => b.min_qty - a.min_qty);
  const matchedTier = sortedTiers.find((t) => quantity >= t.min_qty);

  let pricePerUnit: number;
  let bulkTierApplied = false;

  if (matchedTier) {
    // Bulk tier matched — us tier ki price use karo
    pricePerUnit = matchedTier.price_per_unit;
    bulkTierApplied = true;
  } else {
    // Koi bulk tier nahi — original_price hi use karo per piece
    // ✅ 2 pieces = 2 × 2000 = 4000 (NOT 2 × 1500)
    pricePerUnit = originalPrice;
  }

  // Step 2: Sale percent apply karo (OPTIONAL — sirf tab jab pass ho)
  if (salePercent && salePercent > 0) {
    pricePerUnit = applyDiscount(pricePerUnit, salePercent);
  }

  const roundedPricePerUnit = Math.round(pricePerUnit);
  const totalPrice = Math.round(roundedPricePerUnit * quantity);
  const totalOriginalPrice = Math.round(originalPrice * quantity);
  const saving = totalOriginalPrice - totalPrice;
  const savingPerUnit = Math.round(originalPrice - roundedPricePerUnit);
  const discountPercent =
    originalPrice > 0
      ? Math.round(
          ((originalPrice - roundedPricePerUnit) / originalPrice) * 100,
        )
      : 0;

  return {
    pricePerUnit: roundedPricePerUnit,
    originalPerUnit: Math.round(originalPrice), // ✅ always original_price
    totalPrice,
    totalOriginalPrice,
    saving,
    savingPerUnit,
    discountPercent,
    bulkTierApplied,
  };
}

// ─────────────────────────────────────────────
// generateBulkPricingTable — 2 to 100 pieces table
//
// ✅ Sirf bulk tiers wali rows pe discount dikhao
// ✅ Baki rows mein original_price × quantity dikhao (no forced discount)
// ✅ Sale sirf apply button se lagti hai (salePercent optional)
// ─────────────────────────────────────────────
export function generateBulkPricingTable(
  originalPrice: number, // original_price field (e.g. 2000)
  bulkTiers: { min_qty: number; price_per_unit: number }[],
  salePercent: number | null = null, // optional
  maxQty: number = 100,
): Array<{
  quantity: number;
  pricePerUnit: number;
  originalPerUnit: number;
  totalPrice: number;
  totalOriginalPrice: number;
  saving: number;
  savingPerUnit: number;
  discountPercent: number;
  bulkTierApplied: boolean;
}> {
  const rows = [];
  for (let qty = 1; qty <= maxQty; qty++) {
    const result = applyBulkDiscount(
      originalPrice,
      qty,
      bulkTiers,
      salePercent,
    );
    rows.push({ quantity: qty, ...result });
  }
  return rows;
}
