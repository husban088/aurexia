// lib/saleStore.ts

const SALE_KEY = "active_sale_percent";

export function getSalePercent(): number | null {
  if (typeof window === "undefined") return null;
  const val = localStorage.getItem(SALE_KEY);
  if (!val) return null;
  const num = parseInt(val, 10);
  return [10, 20, 30].includes(num) ? num : null;
}

export function setSalePercent(percent: 10 | 20 | 30 | null) {
  if (typeof window === "undefined") return;
  if (percent === null) {
    localStorage.removeItem(SALE_KEY);
  } else {
    localStorage.setItem(SALE_KEY, String(percent));
  }
}

// Price pe discount apply karne ka helper
export function applyDiscount(price: number, percent: number | null): number {
  if (!percent) return price;
  return Math.round(price * (1 - percent / 100));
}
