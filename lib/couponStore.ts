// lib/couponStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================================
// VALID COUPON CODES
// ============================================================
const VALID_COUPONS: Record<string, { discount: number; label: string }> = {
  DISC4U10: { discount: 10, label: "10% Off" },
  DISC4U20: { discount: 20, label: "20% Off" },
};

// ============================================================
// TYPES
// ============================================================
interface CouponStore {
  appliedCode: string | null; // e.g. "DISC4U10"
  discountPercent: number; // e.g. 10 or 20
  discountLabel: string; // e.g. "10% Off"

  // Actions
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

      applyCoupon: (code: string) => {
        const trimmed = code.trim().toUpperCase();

        if (!trimmed) {
          return { success: false, message: "Please enter a coupon code." };
        }

        const coupon = VALID_COUPONS[trimmed];

        if (!coupon) {
          return {
            success: false,
            message: `"${trimmed}" is not a valid coupon code. Please try again.`,
          };
        }

        set({
          appliedCode: trimmed,
          discountPercent: coupon.discount,
          discountLabel: coupon.label,
        });

        return {
          success: true,
          message: `🎉 Coupon applied! ${coupon.discount}% discount has been added to your order.`,
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
