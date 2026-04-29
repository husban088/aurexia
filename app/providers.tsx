// ClientProviders.tsx
"use client";

import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import SearchSidebar from "./components/SearchSidebar";
import CartSidebar from "./components/CartSidebar";
import { useEffect, useState } from "react";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Safely use pathname only on client side
  const [isPanelPage, setIsPanelPage] = useState(false);
  const pathname = usePathname();

  const { fetchCart, setOnCartOpen } = useCartStore();

  // Mount check - critical for SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update isPanelPage when pathname changes (only on client)
  useEffect(() => {
    if (mounted && pathname) {
      setIsPanelPage(pathname?.startsWith("/panel") || false);
    }
  }, [pathname, mounted]);

  // Cart initialization - only on client side
  useEffect(() => {
    if (!mounted) return;

    setOnCartOpen(() => setCartOpen(true));
    fetchCart();
  }, [setOnCartOpen, fetchCart, mounted]);

  // Don't render anything on server - prevent hydration mismatch
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
    </>
  );
}
