"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cartStore";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import SearchSidebar from "./components/SearchSidebar";
import CartSidebar from "./components/CartSidebar";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const { fetchCart, setOnCartOpen } = useCartStore();

  // ✅ Store mein callback register karo
  // Jab bhi koi addToCart kare — cart sidebar automatically khul jaaye
  useEffect(() => {
    setOnCartOpen(() => setCartOpen(true));
  }, [setOnCartOpen]);

  // ✅ App load hote hi cart fetch karo — navbar count turant dikhega
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <>
      <Navbar
        onMenuOpen={() => setSidebarOpen(true)}
        onSearchOpen={() => setSearchOpen(true)}
        onCartOpen={() => setCartOpen(true)}
        // cartCount prop hataya — Navbar ab store se directly live count padhta hai
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <SearchSidebar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <div style={{ paddingTop: "76px" }} className="flex flex-col flex-1">
        {children}
      </div>
    </>
  );
}
