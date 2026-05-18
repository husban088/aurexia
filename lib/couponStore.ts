// lib/couponStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "./supabase";

interface CouponStore {
  appliedCode: string | null;
  discountPercent: number;
  discountLabel: string;
  coupon10Enabled: boolean;
  coupon20Enabled: boolean;
  settingsLoading: boolean;
  applyingCoupon: boolean; // ✅ New: for button spinner
  fetchCouponSettings: () => Promise<void>;
  updateCouponSettings: (
    coupon10Enabled: boolean,
    coupon20Enabled: boolean,
  ) => Promise<boolean>;
  applyCoupon: (
    code: string,
    userEmail: string,
  ) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  getDiscountAmount: (subtotal: number) => number;
  getFinalTotal: (subtotal: number) => number;
}

export const useCouponStore = create<CouponStore>()(
  persist(
    (set, get) => ({
      appliedCode: null,
      discountPercent: 0,
      discountLabel: "",
      coupon10Enabled: false,
      coupon20Enabled: false,
      settingsLoading: true,
      applyingCoupon: false,

      fetchCouponSettings: async () => {
        try {
          console.log("🔄 Fetching coupon settings from DB...");
          set({ settingsLoading: true });

          const { data: data10, error: error10 } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "coupon_10_enabled")
            .maybeSingle();

          const { data: data20, error: error20 } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "coupon_20_enabled")
            .maybeSingle();

          if (error10 || error20) {
            console.error("DB error:", error10 || error20);
          }

          const coupon10Enabled = data10?.value === true;
          const coupon20Enabled = data20?.value === true;

          console.log("✅ Coupon settings loaded:", {
            coupon10Enabled,
            coupon20Enabled,
          });

          set({
            coupon10Enabled,
            coupon20Enabled,
            settingsLoading: false,
          });

          localStorage.setItem("coupon_10_enabled", String(coupon10Enabled));
          localStorage.setItem("coupon_20_enabled", String(coupon20Enabled));

          return;
        } catch (err) {
          console.error("[couponStore] Failed to fetch settings:", err);

          const cached10 = localStorage.getItem("coupon_10_enabled");
          const cached20 = localStorage.getItem("coupon_20_enabled");

          if (cached10 !== null && cached20 !== null) {
            set({
              coupon10Enabled: cached10 === "true",
              coupon20Enabled: cached20 === "true",
              settingsLoading: false,
            });
          } else {
            set({ settingsLoading: false });
          }
        }
      },

      updateCouponSettings: async (
        coupon10Enabled: boolean,
        coupon20Enabled: boolean,
      ) => {
        try {
          console.log("💾 Saving coupon settings:", {
            coupon10Enabled,
            coupon20Enabled,
          });

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

          console.log("✅ Coupon settings saved successfully!");
          return true;
        } catch (err) {
          console.error("[couponStore] Failed to update coupon settings:", err);
          return false;
        }
      },

      applyCoupon: async (code: string, userEmail: string) => {
        const trimmed = code.trim().toUpperCase();
        const emailLower = (userEmail || "").trim().toLowerCase();

        console.log("🔍 Applying coupon:", trimmed, "| Email:", emailLower);

        if (!trimmed) {
          return { success: false, message: "Please enter a coupon code." };
        }

        const { coupon10Enabled, coupon20Enabled } = get();

        const validCodes = ["DISC4U10", "DISC4U20"];
        if (!validCodes.includes(trimmed)) {
          return {
            success: false,
            message: `"${trimmed}" is not a valid coupon code.`,
          };
        }

        // ✅ Check if coupon is enabled
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

        // ✅ DISC4U10: Open for everyone — apply immediately, no eligibility check needed
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

        // ✅ DISC4U20: Owner-only — check eligibility via API
        set({ applyingCoupon: true });

        try {
          const res = await fetch("/api/check-coupon-eligibility", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailLower, couponCode: trimmed }),
          });

          const data = await res.json();

          if (!res.ok || !data.eligible) {
            set({ applyingCoupon: false });
            return {
              success: false,
              message:
                data.message ||
                "20% discount coupon is only available for store owner.",
            };
          }

          set({
            appliedCode: trimmed,
            discountPercent: 20,
            discountLabel: "20% Off",
            applyingCoupon: false,
          });
          return {
            success: true,
            message: "🎉 20% discount applied successfully!",
          };
        } catch (err) {
          console.error("[couponStore] Eligibility check failed:", err);
          set({ applyingCoupon: false });
          return {
            success: false,
            message:
              "Could not verify eligibility. Please try again in a moment.",
          };
        }
      },

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
