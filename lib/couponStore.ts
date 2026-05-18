// lib/couponStore.ts
// ✅ Coupon ONLY for: (1) customers who received "delivered" status
//                    (2) owner (OWNER_EMAIL env — checked via API)
// ✅ applyCoupon is now async — checks Supabase before allowing
// ✅ Owner can always use both coupons regardless of delivered status

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "./supabase";

// ============================================================
// TYPES
// ============================================================
interface CouponStore {
  appliedCode: string | null;
  discountPercent: number;
  discountLabel: string;

  // Coupon settings (from DB)
  coupon10Enabled: boolean;
  coupon20Enabled: boolean;
  settingsLoading: boolean;

  // Actions
  fetchCouponSettings: () => Promise<void>;
  updateCouponSettings: (
    coupon10Enabled: boolean,
    coupon20Enabled: boolean,
  ) => Promise<boolean>;
  // ✅ Now async — validates against DB
  applyCoupon: (
    code: string,
    userEmail: string,
  ) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  getDiscountAmount: (subtotal: number) => number;
  getFinalTotal: (subtotal: number) => number;
}

// ============================================================
// STORE
// ============================================================
export const useCouponStore = create<CouponStore>()(
  persist(
    (set, get) => ({
      appliedCode: null,
      discountPercent: 0,
      discountLabel: "",
      coupon10Enabled: false,
      coupon20Enabled: false,
      settingsLoading: true,

      // ── Fetch coupon on/off settings ────────────────────────
      fetchCouponSettings: async () => {
        try {
          console.log("🔄 Fetching coupon settings from DB...");

          const { data: data10 } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "coupon_10_enabled")
            .maybeSingle();

          const { data: data20 } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "coupon_20_enabled")
            .maybeSingle();

          const coupon10Enabled = data10?.value === true;
          const coupon20Enabled = data20?.value === true;

          console.log("✅ Coupon settings loaded:", {
            coupon10Enabled,
            coupon20Enabled,
          });

          set({ coupon10Enabled, coupon20Enabled, settingsLoading: false });

          localStorage.setItem("coupon_10_enabled", String(coupon10Enabled));
          localStorage.setItem("coupon_20_enabled", String(coupon20Enabled));
        } catch (err) {
          console.error("[couponStore] Failed to fetch settings:", err);

          const cached10 = localStorage.getItem("coupon_10_enabled");
          const cached20 = localStorage.getItem("coupon_20_enabled");

          if (cached10 !== null && cached20 !== null) {
            set({
              coupon10Enabled: cached10 === "true",
              coupon20Enabled: cached20 === "true",
            });
          }

          set({ settingsLoading: false });
        }
      },

      // ── Update coupon settings (admin panel) ────────────────
      updateCouponSettings: async (
        coupon10Enabled: boolean,
        coupon20Enabled: boolean,
      ) => {
        try {
          const { error: error10 } = await supabase
            .from("site_settings")
            .upsert(
              {
                key: "coupon_10_enabled",
                value: coupon10Enabled,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "key" },
            );

          if (error10) throw error10;

          const { error: error20 } = await supabase
            .from("site_settings")
            .upsert(
              {
                key: "coupon_20_enabled",
                value: coupon20Enabled,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "key" },
            );

          if (error20) throw error20;

          set({ coupon10Enabled, coupon20Enabled });

          localStorage.setItem("coupon_10_enabled", String(coupon10Enabled));
          localStorage.setItem("coupon_20_enabled", String(coupon20Enabled));

          const { appliedCode, removeCoupon } = get();
          if (appliedCode === "DISC4U10" && !coupon10Enabled) removeCoupon();
          if (appliedCode === "DISC4U20" && !coupon20Enabled) removeCoupon();

          console.log("✅ Coupon settings updated successfully!");
          return true;
        } catch (err) {
          console.error("[couponStore] Failed to update coupon settings:", err);
          return false;
        }
      },

      // ── Apply coupon — ASYNC with DB eligibility check ──────
      applyCoupon: async (code: string, userEmail: string) => {
        const trimmed = code.trim().toUpperCase();
        const emailLower = (userEmail || "").trim().toLowerCase();

        console.log("🔍 Applying coupon:", trimmed, "| Email:", emailLower);

        if (!trimmed) {
          return { success: false, message: "Please enter a coupon code." };
        }

        if (!emailLower) {
          return {
            success: false,
            message: "Please log in to use a coupon code.",
          };
        }

        const { coupon10Enabled, coupon20Enabled } = get();

        // ── Valid codes ──────────────────────────────────────
        const validCodes = ["DISC4U10", "DISC4U20"];
        if (!validCodes.includes(trimmed)) {
          return {
            success: false,
            message: `"${trimmed}" is not a valid coupon code.`,
          };
        }

        // ── Check if code is enabled ─────────────────────────
        if (trimmed === "DISC4U10" && !coupon10Enabled) {
          return {
            success: false,
            message:
              "This coupon code is currently not active. Please try another code.",
          };
        }
        if (trimmed === "DISC4U20" && !coupon20Enabled) {
          return {
            success: false,
            message:
              "This coupon code is currently not active. Please try another code.",
          };
        }

        // ── Check eligibility via API ────────────────────────
        // API checks: is owner? OR has a delivered order?
        try {
          const res = await fetch("/api/check-coupon-eligibility", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailLower }),
          });

          const data = await res.json();

          if (!res.ok || !data.eligible) {
            return {
              success: false,
              message:
                data.message ||
                "This coupon is only available for customers whose order has been delivered.",
            };
          }
        } catch (err) {
          console.error("[couponStore] Eligibility check failed:", err);
          return {
            success: false,
            message:
              "Could not verify eligibility. Please try again in a moment.",
          };
        }

        // ── Apply ────────────────────────────────────────────
        if (trimmed === "DISC4U10") {
          set({
            appliedCode: trimmed,
            discountPercent: 10,
            discountLabel: "10% Off",
          });
          return {
            success: true,
            message: "🎉 10% discount applied successfully!",
          };
        }

        if (trimmed === "DISC4U20") {
          set({
            appliedCode: trimmed,
            discountPercent: 20,
            discountLabel: "20% Off",
          });
          return {
            success: true,
            message: "🎉 20% discount applied successfully!",
          };
        }

        return { success: false, message: "Invalid coupon code." };
      },

      // ── Remove coupon ────────────────────────────────────────
      removeCoupon: () => {
        set({ appliedCode: null, discountPercent: 0, discountLabel: "" });
      },

      getDiscountAmount: (subtotal: number) => {
        const { discountPercent } = get();
        if (!discountPercent) return 0;
        return (subtotal * discountPercent) / 100;
      },

      getFinalTotal: (subtotal: number) => {
        const discountAmount = get().getDiscountAmount(subtotal);
        return subtotal - discountAmount;
      },
    }),
    {
      name: "coupon-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        appliedCode: state.appliedCode,
        discountPercent: state.discountPercent,
        discountLabel: state.discountLabel,
      }),
    },
  ),
);
