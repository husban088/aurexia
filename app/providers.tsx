// app/providers.tsx
"use client";

import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import SearchSidebar from "./components/SearchSidebar";
import CartSidebar from "./components/CartSidebar";
import WhatsAppWidget from "./components/WhatsAppWidget";
import { useEffect, useState } from "react";
import Footer from "./components/Footer";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isPanelPage, setIsPanelPage] = useState(false);
  const pathname = usePathname();
  const { fetchCart, setOnCartOpen } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && pathname) {
      setIsPanelPage(pathname?.startsWith("/panel") || false);
    }
  }, [pathname, mounted]);

  useEffect(() => {
    if (!mounted) return;

    setOnCartOpen(() => setCartOpen(true));

    const { initialized } = useCartStore.getState();
    if (!initialized) {
      fetchCart();
    }
  }, [mounted]);

  if (!mounted) {
    return (
      <div style={{ paddingTop: "0px" }} className="flex flex-col flex-1">
        {children}
      </div>
    );
  }

  return (
    <>
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
      >
        {children}
      </div>
      {!isPanelPage && <Footer />}
      {!isPanelPage && <WhatsAppWidget />}
    </>
  );
}
