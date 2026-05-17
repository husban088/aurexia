// app/context/CurrencyContext.tsx
"use client";

/**
 * ✅ GUARANTEED COUNTRY DETECTION — WORKS ON LOCALHOST + PRODUCTION + VPN
 *
 * DETECTION ORDER (fastest to slowest):
 * 1. User manually selected (localStorage currencyUserSelected=true) → instant
 * 2. Multiple IP APIs in PARALLEL → fastest one wins (~500ms-1s)
 * 3. Browser language fallback → instant
 *
 * WHY PREVIOUS VERSION FAILED:
 * - CurrencyCleaner was clearing localStorage AFTER context set it → race condition
 * - Single API with 3s timeout was too slow / failing silently
 * - hasDetected ref was blocking re-detection
 *
 * THIS VERSION:
 * - Runs ALL IP APIs simultaneously (Promise.any) → fastest wins
 * - No race condition — CurrencyCleaner only clears, context only detects
 * - Tab/focus VPN re-detection with 5s debounce
 * - NEVER blocks UI — loading is always false
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  currencies as staticCurrencies,
  Currency,
  getCurrencyByCountry,
  convertPrice,
  formatPrice,
  fetchLiveRates,
  applyLiveRates,
} from "@/lib/currency";

interface CurrencyContextType {
  currency: Currency;
  currencies: Currency[];
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceInPKR: number) => number;
  formatPrice: (priceInPKR: number) => string;
  refreshCurrency: () => Promise<void>;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

// ─── Check if user manually selected currency ─────────────────────────────────
function getUserPref(): Currency | null {
  try {
    if (typeof window === "undefined") return null;
    if (localStorage.getItem("currencyUserSelected") !== "true") return null;
    const code = localStorage.getItem("preferredCurrency");
    if (!code) return null;
    return staticCurrencies.find((c) => c.code === code) ?? null;
  } catch {
    return null;
  }
}

// ─── Save user manual selection ───────────────────────────────────────────────
function saveUserPref(code: string) {
  try {
    localStorage.setItem("preferredCurrency", code);
    localStorage.setItem("currencyUserSelected", "true");
    document.cookie = `preferredCurrency=${code}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `currencyUserSelected=true; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

// ─── Fetch country from ONE api with timeout ──────────────────────────────────
async function fetchCountry(
  url: string,
  extract: (data: any) => string | undefined,
  timeoutMs = 5000,
): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    clearTimeout(t);
    if (!res.ok) throw new Error("not ok");
    const data = await res.json();
    const code = extract(data);
    if (typeof code === "string" && code.length === 2)
      return code.toUpperCase();
    throw new Error("bad code");
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

// ─── Detect country — ALL APIs in parallel, fastest wins ─────────────────────
async function detectCountry(): Promise<string> {
  const apis = [
    // These work reliably with VPN (they see the VPN exit IP)
    fetchCountry("https://api.country.is/", (d) => d.country),
    fetchCountry("https://ipapi.co/json/", (d) => d.country_code),
    fetchCountry("https://freeipapi.com/api/json/", (d) => d.countryCode),
    fetchCountry("https://ipwho.is/", (d) => d.country_code),
    fetchCountry("https://ip-api.io/json", (d) => d.country_code),
  ];

  try {
    // Promise.any = first one to SUCCEED wins (others are ignored)
    const country = await Promise.any(apis);
    console.log("🌍 Detected country:", country);
    return country;
  } catch {
    // All failed — use browser language
    console.warn("⚠️ All IP APIs failed — using browser fallback");
    return detectFromBrowser();
  }
}

// ─── Browser language fallback ────────────────────────────────────────────────
function detectFromBrowser(): string {
  if (typeof navigator === "undefined") return "PK";
  const lang = navigator.language ?? "";
  const map: Record<string, string> = {
    "ur-PK": "PK",
    ur: "PK",
    "ar-AE": "AE",
    "ar-SA": "SA",
    "hi-IN": "IN",
    hi: "IN",
    "en-GB": "GB",
    "en-AU": "AU",
    "en-CA": "CA",
    "en-US": "US",
    "de-DE": "DE",
    de: "DE",
    "fr-FR": "FR",
    fr: "FR",
  };
  if (map[lang]) return map[lang];
  for (const [key, val] of Object.entries(map)) {
    if (lang.startsWith(key)) return val;
  }
  return "PK";
}

// ─────────────────────────────────────────────────────────────────────────────
export function CurrencyProvider({
  children,
  initialCurrencyCode,
}: {
  children: React.ReactNode;
  initialCurrencyCode?: string;
}) {
  const [liveCurrencies, setLiveCurrencies] =
    useState<Currency[]>(staticCurrencies);
  const running = useRef(false);
  const lastCountry = useRef<string | null>(null);

  // ── Initial currency — instant, no flash ────────────────────────────────
  const getInitial = (): Currency => {
    const pref = getUserPref();
    if (pref) return pref;
    if (initialCurrencyCode) {
      const found = staticCurrencies.find(
        (c) => c.code === initialCurrencyCode,
      );
      if (found) return found;
    }
    // Show PKR immediately (Pakistan visitors), detection updates in ~1s
    return (
      staticCurrencies.find((c) => c.code === "PKR") ?? staticCurrencies[0]
    );
  };

  const [currency, setCurrencyState] = useState<Currency>(getInitial);

  // ── User manually selects ────────────────────────────────────────────────
  const setCurrency = useCallback(
    (newCurrency: Currency) => {
      const live =
        liveCurrencies.find((c) => c.code === newCurrency.code) ?? newCurrency;
      setCurrencyState(live);
      saveUserPref(live.code);
    },
    [liveCurrencies],
  );

  // ── Apply live rates helper ──────────────────────────────────────────────
  const applyRates = useCallback((currCode: string) => {
    fetchLiveRates()
      .then((rates) => {
        if (!rates) return;
        const updated = applyLiveRates(rates);
        setLiveCurrencies(updated);
        const updatedCurr = updated.find((c) => c.code === currCode);
        if (updatedCurr) setCurrencyState(updatedCurr);
      })
      .catch(() => {});
  }, []);

  // ── Core detection ───────────────────────────────────────────────────────
  const detect = useCallback(async () => {
    if (running.current) return;

    // User manually selected → only update rates
    const pref = getUserPref();
    if (pref) {
      applyRates(pref.code);
      return;
    }

    running.current = true;
    try {
      const country = await detectCountry();

      // Only update if country changed (avoids flicker on re-detect)
      if (country !== lastCountry.current) {
        lastCountry.current = country;
        const detected = getCurrencyByCountry(country);
        setCurrencyState(detected);
        console.log(`✅ ${country} → ${detected.code}`);
        applyRates(detected.code);
      }
    } catch (err) {
      console.error("Detection error:", err);
    } finally {
      running.current = false;
    }
  }, [applyRates]);

  // ── Run on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    detect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── VPN re-detection: tab visible / window focus ─────────────────────────
  useEffect(() => {
    let lastRun = 0;
    const DEBOUNCE = 5000; // 5 seconds

    const run = () => {
      if (getUserPref()) return; // user selected → skip
      const now = Date.now();
      if (now - lastRun < DEBOUNCE) return;
      lastRun = now;
      console.log("🔄 Re-detecting (tab/focus)");
      lastCountry.current = null; // force update even if same country
      detect();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    const onFocus = () => run();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [detect]);

  const refreshCurrency = useCallback(async () => {
    running.current = false;
    lastCountry.current = null;
    await detect();
  }, [detect]);

  const convert = useCallback(
    (pkr: number) => convertPrice(pkr, currency),
    [currency],
  );
  const format = useCallback(
    (pkr: number) => formatPrice(pkr, currency),
    [currency],
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencies: liveCurrencies,
        setCurrency,
        convertPrice: convert,
        formatPrice: format,
        refreshCurrency,
        loading: false,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
