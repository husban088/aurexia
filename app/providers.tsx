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
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Footer from "./components/Footer";
import SaleBannerPopup from "./components/SaleBannerPopup";
import { initSaleStore } from "@/lib/saleStore";

// ✅ PERF FIX: debounce stable ref — useCallback ke bahar rakho
// Pehle: har render pe naya debounce function banta tha = measure re-created = ResizeObserver re-connected = jank
function createDebounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number,
): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

function AppShell({
  children,
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

  // ✅ PERF FIX: measure function stable — module-level debounce, no re-creation
  // Pehle: useCallback(debounce(...)) = new debounce per render cycle = observer storm
  const measureRef = useRef<(() => void) | null>(null);
  if (!measureRef.current) {
    measureRef.current = createDebounce(() => {
      const el = wrapperRef.current;
      if (el) {
        const h = el.offsetHeight;
        if (h > 0) setStickyHeight(h);
      }
    }, 80);
  }
  const measure = measureRef.current;

  // Client mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ PERF FIX: initSaleStore + fetchCouponSettings — once on mount, no deps
  useEffect(() => {
    initSaleStore();
    useCouponStore.getState().fetchCouponSettings();
  }, []);

  // Sticky navbar height measurement
  useEffect(() => {
    if (!isClient) return;
    measure();

    observerRef.current?.disconnect();
    observerRef.current = new ResizeObserver(measure);
    if (wrapperRef.current) observerRef.current.observe(wrapperRef.current);

    window.addEventListener("resize", measure, { passive: true });
    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isClient, measure]);

  // ✅ PERF FIX: scroll-to-top + close panels on route change — single effect
  useEffect(() => {
    // rAF for smooth scroll — won't block paint
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
    setSidebarOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
  }, [pathname]);

  const isPanelPage = pathname?.startsWith("/panel") ?? false;
  const isHomePage = pathname === "/";

  // Cart init — once
  useEffect(() => {
    if (!isClient || cartInitialized.current) return;
    cartInitialized.current = true;
    setOnCartOpen(() => setCartOpen(true));
    if (!useCartStore.getState().initialized) fetchCart();
  }, [isClient, setOnCartOpen, fetchCart]);

  // ✅ PERF FIX: contentPaddingTop memoized — pehle har render pe naya object banta tha
  // Naya object = React thinks style changed = DOM update = unnecessary repaint
  const contentPaddingTop = useMemo(() => {
    if (isPanelPage) return undefined;
    return {
      paddingTop:
        stickyHeight > 0 ? stickyHeight : "var(--navbar-height, 64px)",
    } as React.CSSProperties;
  }, [isPanelPage, stickyHeight]);

  // ✅ PERF FIX: Stable handler refs — inline arrows per render = new function = child re-render
  const handleMenuOpen = useCallback(() => setSidebarOpen(true), []);
  const handleSearchOpen = useCallback(() => setSearchOpen(true), []);
  const handleCartOpen = useCallback(() => setCartOpen(true), []);
  const handleSidebarClose = useCallback(() => setSidebarOpen(false), []);
  const handleSearchClose = useCallback(() => setSearchOpen(false), []);
  const handleCartClose = useCallback(() => setCartOpen(false), []);

  return (
    <>
      {isClient && isHomePage && <SaleBannerPopup />}

      {!isPanelPage && (
        <div ref={wrapperRef} className="navbar-sticky-wrapper">
          <AnnouncementBar />
          <Navbar
            onMenuOpen={handleMenuOpen}
            onSearchOpen={handleSearchOpen}
            onCartOpen={handleCartOpen}
          />
        </div>
      )}

      {/* ✅ PERF FIX: Sidebars always rendered (closed state) — no mount/unmount on open/close
          Pehle: isClient && (...) = sidebars mount on first open = animation lag
          Ab: sidebars always in DOM (CSS transforms handle show/hide) = instant */}
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <SearchSidebar isOpen={searchOpen} onClose={handleSearchClose} />
      <CartSidebar isOpen={cartOpen} onClose={handleCartClose} />

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
  const [shellKey] = useState(0);

  useEffect(() => {
    let lastReloadTime = 0;
    const RELOAD_COOLDOWN = 5000;

    function handlePageShow(e: PageTransitionEvent) {
      if (!e.persisted) return;
      const now = Date.now();
      if (now - lastReloadTime < RELOAD_COOLDOWN) return;
      lastReloadTime = now;
      window.location.reload();
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return (
    <AppShell key={shellKey} shellKey={shellKey}>
      {children}
    </AppShell>
  );
}
