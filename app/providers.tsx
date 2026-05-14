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

export default function Providers({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  // Dynamic height of sticky wrapper (AnnouncementBar + Navbar)
  const [stickyHeight, setStickyHeight] = useState(0);
  const pathname = usePathname();
  const { fetchCart, setOnCartOpen } = useCartStore();
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  // ── Measure sticky wrapper height dynamically ────────────────────────────
  // AnnouncementBar hide/show hone pe height change hoti hai
  // ResizeObserver se track karo taake content kabhi overlap na ho
  useEffect(() => {
    if (!isClient) return;

    const measure = () => {
      if (wrapperRef.current) {
        setStickyHeight(wrapperRef.current.offsetHeight);
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    window.addEventListener("resize", measure, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isClient]);

  const isPanelPage = isClient && (pathname?.startsWith("/panel") ?? false);
  const isHomePage = isClient && pathname === "/";

  const cartInitialized = useRef(false);
  useEffect(() => {
    if (!isClient) return;
    if (cartInitialized.current) return;
    cartInitialized.current = true;
    setOnCartOpen(() => setCartOpen(true));
    const { initialized } = useCartStore.getState();
    if (!initialized) fetchCart();
  }, [isClient, setOnCartOpen, fetchCart]);

  if (!isClient) {
    return <div className="flex flex-col flex-1">{children}</div>;
  }

  return (
    <>
      {isHomePage && <SaleBannerPopup />}

      {!isPanelPage && (
        // ✅ Fixed sticky wrapper — AnnouncementBar oopar, Navbar neeche
        // AnnouncementBar scroll down pe slide-up ho jaata hai
        // Navbar hamesha visible rehta hai
        <div ref={wrapperRef} className="navbar-sticky-wrapper">
          <AnnouncementBar />
          <Navbar
            onMenuOpen={() => setSidebarOpen(true)}
            onSearchOpen={() => setSearchOpen(true)}
            onCartOpen={() => setCartOpen(true)}
          />
        </div>
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <SearchSidebar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ✅ paddingTop = sticky wrapper ki exact height — content kabhi overlap nahi hoga */}
      <div
        className="flex flex-col flex-1"
        style={{ paddingTop: isPanelPage ? 0 : stickyHeight }}
        suppressHydrationWarning
      >
        {children}
      </div>

      {!isPanelPage && (
        <>
          <Footer />
          <WhatsAppWidget />
        </>
      )}
    </>
  );
}
