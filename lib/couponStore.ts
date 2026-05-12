// lib/couponStore.ts
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
  applyCoupon: (code: string) => { success: boolean; message: string };
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

      fetchCouponSettings: async () => {
        try {
          console.log("🔄 Fetching coupon settings from DB...");

          // Fetch coupon 10% setting
          const { data: data10, error: error10 } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "coupon_10_enabled")
            .maybeSingle();

          // Fetch coupon 20% setting
          const { data: data20, error: error20 } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "coupon_20_enabled")
            .maybeSingle();

          // Get values - if no record exists, default to false
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

          // Save to localStorage
          localStorage.setItem("coupon_10_enabled", String(coupon10Enabled));
          localStorage.setItem("coupon_20_enabled", String(coupon20Enabled));

          return;
        } catch (err) {
          console.error("[couponStore] Failed to fetch settings:", err);

          // Try localStorage fallback
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

      updateCouponSettings: async (
        coupon10Enabled: boolean,
        coupon20Enabled: boolean,
      ) => {
        try {
          console.log("🔄 Updating coupon settings:", {
            coupon10Enabled,
            coupon20Enabled,
          });

          // Update coupon 10% setting
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

          if (error10) {
            console.error("Error updating coupon 10:", error10);
            throw error10;
          }

          // Update coupon 20% setting
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

          if (error20) {
            console.error("Error updating coupon 20:", error20);
            throw error20;
          }

          // Update state
          set({
            coupon10Enabled,
            coupon20Enabled,
          });

          // Save to localStorage
          localStorage.setItem("coupon_10_enabled", String(coupon10Enabled));
          localStorage.setItem("coupon_20_enabled", String(coupon20Enabled));

          // Remove applied coupon if it's now disabled
          const { appliedCode, removeCoupon } = get();
          if (appliedCode === "DISC4U10" && !coupon10Enabled) {
            removeCoupon();
          }
          if (appliedCode === "DISC4U20" && !coupon20Enabled) {
            removeCoupon();
          }

          console.log("✅ Coupon settings updated successfully!");
          return true;
        } catch (err) {
          console.error("[couponStore] Failed to update coupon settings:", err);
          return false;
        }
      },

      applyCoupon: (code: string) => {
        const trimmed = code.trim().toUpperCase();

        console.log("🔍 Applying coupon:", trimmed);
        console.log("Current coupon settings:", {
          coupon10Enabled: get().coupon10Enabled,
          coupon20Enabled: get().coupon20Enabled,
        });

        if (!trimmed) {
          return { success: false, message: "Please enter a coupon code." };
        }

        const { coupon10Enabled, coupon20Enabled } = get();

        // Check for DISC4U10
        if (trimmed === "DISC4U10") {
          if (!coupon10Enabled) {
            return {
              success: false,
              message:
                "This coupon code is currently not active. Please try another code.",
            };
          }
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

        // Check for DISC4U20
        if (trimmed === "DISC4U20") {
          if (!coupon20Enabled) {
            return {
              success: false,
              message:
                "This coupon code is currently not active. Please try another code.",
            };
          }
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

        return {
          success: false,
          message: `"${trimmed}" is not a valid coupon code.`,
        };
      },

      removeCoupon: () => {
        set({
          appliedCode: null,
          discountPercent: 0,
          discountLabel: "",
        });
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
