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
import { useEffect, useState, useRef } from "react";
import Footer from "./components/Footer";
import SaleBannerPopup from "./components/SaleBannerPopup";
import { initSaleStore } from "@/lib/saleStore";
import { useBackForwardReload } from "@/lib/useBackForwardReload";

// ✅ Smooth scroll optimization — prevents jank
const smoothScrollBehavior = () => {
  if (typeof window === "undefined") return;

  // Optimize scroll performance
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        document.documentElement.style.scrollBehavior = "smooth";
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
};

export default function Providers({ children }: { children: React.ReactNode }) {
  // ✅ Add back/forward reload hook
  useBackForwardReload();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [stickyHeight, setStickyHeight] = useState(0);
  const pathname = usePathname();
  const { fetchCart, setOnCartOpen } = useCartStore();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cartInitialized = useRef(false);

  // Optimize scroll behavior
  useEffect(() => {
    const cleanup = smoothScrollBehavior();
    return cleanup;
  }, []);

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

  // Measure sticky navbar height — only AFTER client mounts
  useEffect(() => {
    if (!isClient) return;

    const measure = () => {
      if (wrapperRef.current) {
        setStickyHeight(wrapperRef.current.offsetHeight);
      }
    };

    measure();
    const raf = requestAnimationFrame(measure);

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    window.addEventListener("resize", measure, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isClient]);

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

      <div
        className="flex flex-col flex-1"
        style={
          isPanelPage
            ? undefined
            : {
                paddingTop:
                  stickyHeight > 0
                    ? stickyHeight
                    : "var(--navbar-height, 64px)",
              }
        }
      >
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
