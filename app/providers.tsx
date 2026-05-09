// app/providers.tsx
"use client";

import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
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
  const [hydrated, setHydrated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const { fetchCart, setOnCartOpen } = useCartStore();

  // Mark client-side after hydration
  useEffect(() => {
    setIsClient(true);
    setHydrated(true);
  }, []);

  // Initialize sale store on app start (for ALL users)
  useEffect(() => {
    initSaleStore();
  }, []);

  // Derive panel state - safe after client mount
  const isPanelPage = isClient && (pathname?.startsWith("/panel") ?? false);

  // Check if on home page
  const isHomePage = isClient && pathname === "/";

  // Cart init — run once on client mount
  const cartInitialized = useRef(false);
  useEffect(() => {
    if (!isClient) return;
    if (cartInitialized.current) return;
    cartInitialized.current = true;
    setOnCartOpen(() => setCartOpen(true));
    const { initialized } = useCartStore.getState();
    if (!initialized) {
      fetchCart();
    }
  }, [isClient, setOnCartOpen, fetchCart]);

  // During SSR, render minimal structure to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="flex flex-col flex-1" style={{ paddingTop: "0px" }}>
        {children}
      </div>
    );
  }

  return (
    <>
      {/* ✅ Sale Banner - Only on home page, visible to ALL users */}
      {isHomePage && <SaleBannerPopup />}

      {!isPanelPage && (
        <Navbar
          onMenuOpen={() => setSidebarOpen(true)}
          onSearchOpen={() => setSearchOpen(true)}
          onCartOpen={() => setCartOpen(true)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <SearchSidebar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <div
        style={{ paddingTop: isPanelPage ? "0px" : "76px" }}
        className="flex flex-col flex-1"
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
