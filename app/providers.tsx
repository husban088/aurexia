// providers.tsx
"use client";

import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import SearchSidebar from "./components/SearchSidebar";
import CartSidebar from "./components/CartSidebar";
import WhatsAppWidget from "./components/WhatsAppWidget";
import { useEffect, useRef, useState } from "react";
import Footer from "./components/Footer";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const pathname = usePathname();
  const isPanelPage = pathname?.startsWith("/panel") ?? false;

  const { fetchCart, setOnCartOpen } = useCartStore();
  const cartInitialized = useRef(false);

  // Cart initialization — sirf ek baar
  useEffect(() => {
    setOnCartOpen(() => setCartOpen(true));
    if (!cartInitialized.current) {
      cartInitialized.current = true;
      const { initialized } = useCartStore.getState();
      if (!initialized) fetchCart();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
