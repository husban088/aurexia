// app/providers.tsx
"use client";

import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import { useCouponStore } from "@/lib/couponStore";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import AnnouncementBar from "./components/AnnouncementBar";
import SearchSidebar from "./components/SearchSidebar";
import CartSidebar from "./components/CartSidebar";
import WhatsAppWidget from "./components/WhatsAppWidget";
import { useEffect, useState, useRef, useCallback } from "react";
import Footer from "./components/Footer";
import SaleBannerPopup from "./components/SaleBannerPopup";
import { initSaleStore } from "@/lib/saleStore";

function AppShell({
  children,
  shellKey,
}: {
  children: React.ReactNode;
  shellKey: number;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [stickyHeight, setStickyHeight] = useState(0);
  const pathname = usePathname();
  const { fetchCart, setOnCartOpen } = useCartStore();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cartInitialized = useRef(false);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);
  useEffect(() => {
    initSaleStore();
  }, []);
  useEffect(() => {
    const { fetchCouponSettings } = useCouponStore.getState();
    fetchCouponSettings();
  }, []);

  const measure = useCallback(() => {
    if (wrapperRef.current) {
      const h = wrapperRef.current.offsetHeight;
      if (h > 0) setStickyHeight(h);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    measure();
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new ResizeObserver(measure);
    if (wrapperRef.current) observerRef.current.observe(wrapperRef.current);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isClient, measure]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  useEffect(() => {
    setSidebarOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
  }, [pathname]);

  const isPanelPage = pathname?.startsWith("/panel") ?? false;
  const isHomePage = pathname === "/";

  useEffect(() => {
    if (!isClient) return;
    if (cartInitialized.current) return;
    cartInitialized.current = true;
    setOnCartOpen(() => setCartOpen(true));
    const { initialized } = useCartStore.getState();
    if (!initialized) fetchCart();
  }, [isClient, setOnCartOpen, fetchCart]);

  const contentPaddingTop = isPanelPage
    ? undefined
    : {
        paddingTop:
          stickyHeight > 0 ? stickyHeight : "var(--navbar-height, 64px)",
      };

  return (
    <>
      {isClient && isHomePage && <SaleBannerPopup />}

      {!isPanelPage && (
        <div ref={wrapperRef} className="navbar-sticky-wrapper">
          <AnnouncementBar />
          <Navbar
            onMenuOpen={() => setSidebarOpen(true)}
            onSearchOpen={() => setSearchOpen(true)}
            onCartOpen={() => setCartOpen(true)}
          />
        </div>
      )}

      {isClient && (
        <>
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <SearchSidebar
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
          />
          <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        </>
      )}

      <div className="flex flex-col flex-1" style={contentPaddingTop}>
        {children}
      </div>

      {!isPanelPage && (
        <>
          <Footer />
          {isClient && <WhatsAppWidget />}
        </>
      )}
    </>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [shellKey, setShellKey] = useState(0);

  useEffect(() => {
    // ─────────────────────────────────────────────────────────────────
    // PROBLEM: Chrome back/forward arrow pe Supabase calls fail ho
    // jaati hain (ERR_CONNECTION_CLOSED) kyunki bfcache page ko freeze
    // karta hai aur sare network connections cut ho jaate hain.
    //
    // pageshow(persisted=true) localhost HTTP pe fire NAHI hota.
    // Isliye yeh approach kaam nahi karta.
    //
    // REAL FIX:
    // Jab page navigate ho kar wapas aaye (back/forward arrow),
    // Chrome history navigation use karta hai — page reload nahi hota,
    // balki cached/frozen state restore hota hai.
    //
    // Hum "navigation entry" timestamp track karte hain:
    // - Page load hone pe current time store karo (sessionStorage)
    // - Jab window focus ya visible ho, check karo ke kya timestamp
    //   change hua hai (matlab page wapas navigate hua)
    // - Agar same page pe wapas aaye aur content broken ho → reload
    //
    // YEH approach 100% kaam karta hai kyunki:
    // 1. visibilitychange aur focus hamesha fire hote hain
    // 2. performance.navigation.type === 2 = back/forward navigation
    // 3. performance.getEntriesByType("navigation")[0].type === "back_forward"
    // ─────────────────────────────────────────────────────────────────

    // Page load timestamp — is se detect karenge ke fresh load tha ya cached
    const PAGE_LOAD_TIME = Date.now();
    const RELOAD_COOLDOWN = 5000; // 5 seconds ke andar dobara reload nahi

    // Last reload time track karo (loop prevention)
    let lastReloadTime = 0;

    function shouldReload(): boolean {
      const now = Date.now();

      // Cooldown check — loop prevent karo
      if (now - lastReloadTime < RELOAD_COOLDOWN) {
        return false;
      }

      // Back/forward navigation detect karo
      // Method 1: Navigation API (modern browsers)
      if (typeof performance !== "undefined" && performance.getEntriesByType) {
        const navEntries = performance.getEntriesByType(
          "navigation",
        ) as PerformanceNavigationTiming[];
        if (navEntries.length > 0) {
          const navType = navEntries[0].type;
          if (navType === "back_forward") {
            return true;
          }
        }
      }

      // Method 2: Legacy navigation type
      if (
        typeof performance !== "undefined" &&
        performance.navigation &&
        performance.navigation.type === 2
      ) {
        return true;
      }

      return false;
    }

    function doReload() {
      lastReloadTime = Date.now();
      window.location.reload();
    }

    // ── Method 1: pageshow — HTTPS pe kaam karta hai ──
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        doReload();
      }
    }

    // ── Method 2: visibilitychange — tab switch ya back/forward ──
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        if (shouldReload()) {
          doReload();
        }
      }
    }

    // ── Method 3: focus — window focus hone pe ──
    function handleFocus() {
      if (shouldReload()) {
        doReload();
      }
    }

    // ── Method 4: popstate — history change detect ──
    // Navbar window.location.href use karta hai (full reload)
    // toh popstate fire hoga back/forward pe
    function handlePopState() {
      // popstate fire hua = back/forward arrow pressed
      // seedha reload karo — koi condition nahi
      const now = Date.now();
      if (now - lastReloadTime < RELOAD_COOLDOWN) return;

      // Thoda wait karo — page restore hone do
      setTimeout(() => {
        doReload();
      }, 50);
    }

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <AppShell key={shellKey} shellKey={shellKey}>
      {children}
    </AppShell>
  );
}
