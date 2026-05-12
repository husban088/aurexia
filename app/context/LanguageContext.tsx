// app/context/LanguageContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  SupportedLanguage,
  Translation,
  getTranslation,
  isRTL,
  SHOW_LANGUAGE_DROPDOWN_COUNTRIES,
  UAE_DROPDOWN_LANGUAGES,
} from "@/lib/translations";

interface AvailableLanguage {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translation;
  isRTLMode: boolean;
  showLanguageDropdown: boolean;
  availableLanguages: AvailableLanguage[];
  detectedCountry: string | null;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "preferredLanguage";

// Detect country from server or client APIs
async function detectCountry(): Promise<string | null> {
  // 1. Try server route first (uses Cloudflare/Vercel headers — fastest)
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch("/api/detect-country", {
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.country?.length === 2) return data.country;
    }
  } catch {}

  // 2. Race multiple free IP APIs in parallel
  const apis: { url: string; parse: (d: any) => string }[] = [
    { url: "https://api.country.is/", parse: (d) => d.country },
    { url: "https://ipapi.co/json/", parse: (d) => d.country_code },
    { url: "https://freeipapi.com/api/json/", parse: (d) => d.countryCode },
  ];

  const promises = apis.map(async ({ url, parse }) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(t);
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      const code = parse(data);
      if (typeof code === "string" && code.length === 2) return code;
      throw new Error("invalid code");
    } catch {
      clearTimeout(t);
      throw new Error("failed");
    }
  });

  try {
    return await Promise.any(promises);
  } catch {}

  return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // ✅ Default to "en" immediately — no blank screen
  const [language, setLanguageState] = useState<SupportedLanguage>("en");
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableLangs, setAvailableLangs] = useState<AvailableLanguage[]>([]);

  const applyLanguageToDOM = useCallback((lang: SupportedLanguage) => {
    if (typeof document === "undefined") return;
    const rtl = isRTL(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
  }, []);

  const setLanguage = useCallback(
    (lang: SupportedLanguage) => {
      setLanguageState(lang);
      applyLanguageToDOM(lang);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {}
    },
    [applyLanguageToDOM],
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // ─── Step 1: Apply saved preference immediately (before network) ───
      let savedLang: SupportedLanguage | null = null;
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as SupportedLanguage;
        if (stored && ["en", "ar", "de"].includes(stored)) {
          savedLang = stored;
          // Apply saved language right away — no waiting for country detection
          setLanguageState(stored);
          applyLanguageToDOM(stored);
        }
      } catch {}

      // ─── Step 2: Detect country in background ─────────────────────────
      const countryCode = await detectCountry();
      if (cancelled) return;

      setDetectedCountry(countryCode);

      // ─── Step 3: Apply country-based language rules ────────────────────
      if (countryCode === "DE") {
        // Germany → auto German, no dropdown
        setShowDropdown(false);
        setAvailableLangs([]);
        // Only auto-apply German if user has no saved preference
        if (!savedLang || savedLang === "de") {
          setLanguageState("de");
          applyLanguageToDOM("de");
          try {
            localStorage.setItem(STORAGE_KEY, "de");
          } catch {}
        } else {
          // Respect saved English preference even in Germany
          setLanguageState(savedLang);
          applyLanguageToDOM(savedLang);
        }
      } else if (
        countryCode &&
        SHOW_LANGUAGE_DROPDOWN_COUNTRIES.includes(countryCode)
      ) {
        // UAE → show dropdown with English + Arabic
        setShowDropdown(true);
        setAvailableLangs(UAE_DROPDOWN_LANGUAGES);
        // If saved lang is valid for UAE (en or ar), use it; else default English
        if (savedLang && (savedLang === "en" || savedLang === "ar")) {
          setLanguageState(savedLang);
          applyLanguageToDOM(savedLang);
        } else {
          setLanguageState("en");
          applyLanguageToDOM("en");
        }
      } else {
        // All other countries → English only, no dropdown
        setShowDropdown(false);
        setAvailableLangs([]);
        setLanguageState("en");
        applyLanguageToDOM("en");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [applyLanguageToDOM]);

  // ✅ Listen for currency-triggered language/dropdown changes from Navbar
  useEffect(() => {
    const handler = (e: Event) => {
      const country = (e as CustomEvent).detail?.country as string;
      if (country === "AE") {
        // AED selected → show UAE language dropdown
        setShowDropdown(true);
        setAvailableLangs(UAE_DROPDOWN_LANGUAGES);
        setDetectedCountry("AE");
      } else if (country === "OTHER") {
        // Other currency selected → hide dropdown, go English
        setShowDropdown(false);
        setAvailableLangs([]);
      }
    };
    window.addEventListener("force-language-dropdown", handler);
    return () => window.removeEventListener("force-language-dropdown", handler);
  }, []);

  // ✅ No isInitialized guard — children always render immediately
  const value: LanguageContextValue = {
    language,
    setLanguage,
    t: getTranslation(language),
    isRTLMode: isRTL(language),
    showLanguageDropdown: showDropdown,
    availableLanguages: availableLangs,
    detectedCountry,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be inside <LanguageProvider>");
  return ctx;
}
