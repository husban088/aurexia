// lib/saleStore.ts

import { supabase } from "./supabase";

let currentSalePercent: number | null = null;
let listeners: ((percent: number | null) => void)[] = [];

// Get current active sale from database
export async function fetchSaleFromDB(): Promise<number | null> {
  if (typeof window === "undefined") return currentSalePercent;

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "active_sale_percent")
      .single();

    if (error || !data) {
      // If no record exists, return null
      return null;
    }

    const percent = data.value;
    if ([10, 20, 30].includes(percent)) {
      currentSalePercent = percent;
      // Cache in localStorage for faster access
      localStorage.setItem("active_sale_percent", String(percent));
      return percent;
    }
    return null;
  } catch (err) {
    console.warn("[saleStore] Failed to fetch from DB:", err);
    return null;
  }
}

// Get current active sale (fast, from cache)
export function getSalePercent(): number | null {
  if (typeof window === "undefined") return currentSalePercent;

  // First check memory
  if (currentSalePercent !== null) return currentSalePercent;

  // Then check localStorage cache
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

    // Notify all listeners
    listeners.forEach((listener) => listener(currentSalePercent));

    // Dispatch event for cross-tab communication
    window.dispatchEvent(
      new CustomEvent("salePercentChanged", { detail: currentSalePercent }),
    );

    return true;
  } catch (err) {
    console.error("[saleStore] Failed to save sale:", err);
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
  callback: (percent: number | null) => void,
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
  const [salePercent, setSalePercentState] = useState<number | null>(() =>
    getSalePercent(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from DB on mount
    fetchSaleFromDB().then((percent) => {
      setSalePercentState(percent);
      setLoading(false);
    });

    // Listen for changes
    const unsubscribe = listenToSaleChanges(setSalePercentState);
    return unsubscribe;
  }, []);

  return { salePercent, loading };
}
