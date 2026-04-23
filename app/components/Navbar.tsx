"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isOwner } from "@/lib/checkOwner";
import { useCartStore } from "@/lib/cartStore";
import "./navbar.css";

interface NavbarProps {
  onMenuOpen: () => void;
  onSearchOpen: () => void;
  onCartOpen: () => void;
  cartCount?: number; // kept for compatibility but store se live count milega
}

const navLinks = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        width="14"
        height="14"
      >
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    href: "/accessories",
    label: "Mobile Accessories",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        width="14"
        height="14"
      >
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    href: "/gadgets",
    label: "Gadgets",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        width="14"
        height="14"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    href: "/home-decor",
    label: "Home Décor",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        width="14"
        height="14"
      >
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    href: "/about",
    label: "About",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        width="14"
        height="14"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/contact",
    label: "Contact",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        width="14"
        height="14"
      >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
];

const PanelLink = ({ isActive }: { isActive: boolean }) => (
  <li>
    <Link href="/panel" className={isActive ? "active" : ""}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        width="14"
        height="14"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
      Panel
    </Link>
  </li>
);

export default function Navbar({
  onMenuOpen,
  onSearchOpen,
  onCartOpen,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pathname = usePathname();

  // ✅ Cart count directly from store — always real-time
  const cartCount = useCartStore((state) => state.getCartCount());

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setUserEmail(currentUser?.email ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setUserEmail(currentUser?.email ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const showPanel = isOwner(userEmail);

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <Image
            src="/mainlogo.jfif"
            alt="Aurexia Logo"
            width={80}
            height={80}
            className="navbar-logo-image dark:invert"
            priority
          />
        </Link>

        {/* Nav Links */}
        <ul className="navbar-links">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={isActive(link.href) ? "active" : ""}
              >
                {link.icon}
                {link.label}
              </Link>
            </li>
          ))}
          {showPanel && <PanelLink isActive={isActive("/panel")} />}
        </ul>

        {/* Right Icons */}
        <div className="navbar-icons">
          <button
            className={`navbar-icon-btn${
              pathname === "/search" ? " icon-active" : ""
            }`}
            aria-label="Search"
            onClick={onSearchOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          {/* ✅ Cart button — live count from store */}
          <button
            className={`navbar-icon-btn${
              pathname === "/cart" ? " icon-active" : ""
            }`}
            aria-label="Cart"
            onClick={onCartOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {cartCount > 0 && (
              <span className="badge" aria-label={`${cartCount} items in cart`}>
                {cartCount}
              </span>
            )}
          </button>

          <Link
            href={user ? "/profile" : "/signin"}
            className={`navbar-icon-btn${
              pathname === "/signin" ||
              pathname === "/signup" ||
              pathname === "/profile"
                ? " icon-active"
                : ""
            }`}
            aria-label={user ? "My Profile" : "Sign In"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {user && <span className="navbar-user-dot" aria-hidden="true" />}
          </Link>

          <div className="navbar-divider" aria-hidden="true" />

          <button
            className="navbar-menu-btn"
            onClick={onMenuOpen}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </nav>
  );
}
