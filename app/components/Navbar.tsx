"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isOwner } from "@/lib/checkOwner";
import { useCartStore } from "@/lib/cartStore";
import { currencies } from "@/lib/currency";
import "./navbar.css";
import { useCurrency } from "../context/CurrencyContext";

interface NavbarProps {
  onMenuOpen: () => void;
  onSearchOpen: () => void;
  onCartOpen: () => void;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/accessories", label: "Accessories" },
  { href: "/watches", label: "Watches" },
  { href: "/automotive", label: "Automotive" },
  { href: "/home-decor", label: "Home Decor" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const categorySubcategories: Record<string, { name: string; href: string }[]> =
  {
    "/accessories": [
      { name: "Chargers", href: "/accessories/chargers" },
      { name: "Cables", href: "/accessories/cables" },
      { name: "Phone Holders", href: "/accessories/phone-holders" },
      { name: "Tech Gadgets", href: "/accessories/tech-gadgets" },
      { name: "Smart Accessories", href: "/accessories/smart-accessories" },
    ],
    "/watches": [
      { name: "Men Watches", href: "/watches/men-watches" },
      { name: "Women Watches", href: "/watches/women-watches" },
      { name: "Smart Watches", href: "/watches/smart-watches" },
      { name: "Luxury Watches", href: "/watches/luxury-watches" },
    ],
    "/automotive": [
      { name: "Car Accessories", href: "/automotive/car-accessories" },
      { name: "Car Cleaning Tools", href: "/automotive/car-cleaning-tools" },
      { name: "Phone Holders", href: "/automotive/phone-holders" },
      {
        name: "Interior Accessories",
        href: "/automotive/interior-accessories",
      },
    ],
    "/home-decor": [
      { name: "Wall Decor", href: "/home-decor/wall-decor" },
      { name: "Lighting", href: "/home-decor/lighting" },
      { name: "Kitchen Essentials", href: "/home-decor/kitchen-essentials" },
      { name: "Storage & Organizers", href: "/home-decor/storage-organizers" },
    ],
  };

export default function Navbar({
  onMenuOpen,
  onSearchOpen,
  onCartOpen,
}: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(undefined);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState("");
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  const { currency, setCurrency, loading: currencyLoading } = useCurrency();

  useEffect(() => {
    setMounted(true);
    setCurrentPath(window.location.pathname);

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setUserEmail(session.user.email ?? null);
      } else {
        setUser(null);
        setUserEmail(null);
      }
    };
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setUserEmail(null);
      } else if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        setUser(session.user);
        setUserEmail(session.user.email ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const showPanel = isOwner(userEmail);
  const authResolved = user !== undefined;
  const isSignedIn = authResolved && user !== null;

  const availableCurrencies = currencies.filter((c) => c.code !== "PKR");

  const handleDropdownEnter = (href: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setOpenDropdown(href);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  // Helper: safe navigation with page reload
  const navigateTo = (href: string) => {
    window.location.href = href;
  };

  // Don't render until mounted (SSR fix)
  if (!mounted || currencyLoading) {
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-center">
            <a href="/" className="navbar-logo">
              <span className="logo-tech">TECH</span>
              <span className="logo-four">4U</span>
            </a>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
      <div className="navbar-container">
        {/* LEFT SECTION */}
        <div className="navbar-left">
          <div className="currency-dropdown">
            <button
              className="currency-btn"
              onClick={() => setCurrencyOpen(!currencyOpen)}
              onBlur={() => setTimeout(() => setCurrencyOpen(false), 200)}
            >
              <span className="currency-flag">{currency.flag}</span>
              <span className="currency-symbol">{currency.symbol}</span>
              <span className="currency-code">{currency.code}</span>
              <svg
                className="currency-arrow"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {currencyOpen && (
              <div className="currency-menu">
                {availableCurrencies.map((cur) => (
                  <button
                    key={cur.code}
                    className={`currency-option${
                      currency.code === cur.code ? " active" : ""
                    }`}
                    onClick={() => {
                      setCurrency(cur);
                      setCurrencyOpen(false);
                    }}
                  >
                    <span className="currency-option-flag">{cur.flag}</span>
                    <span className="currency-option-symbol">{cur.symbol}</span>
                    <span className="currency-option-code">{cur.code}</span>
                    <span className="currency-option-name">{cur.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="nav-icon-btn search-btn"
            onClick={(e) => {
              e.preventDefault();
              onSearchOpen();
            }}
            aria-label="Search"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* CENTER SECTION */}
        <div className="navbar-center">
          <a
            href="/"
            className="navbar-logo"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("/");
            }}
          >
            <span className="logo-tech">TECH</span>
            <span className="logo-four">4U</span>
          </a>
        </div>

        {/* RIGHT SECTION */}
        <div className="navbar-right">
          <a
            href={isSignedIn ? "/profile" : "/signin"}
            className="nav-icon-btn user-btn"
            aria-label={isSignedIn ? "My Profile" : "Sign In"}
            onClick={(e) => {
              e.preventDefault();
              navigateTo(isSignedIn ? "/profile" : "/signin");
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {isSignedIn && <span className="user-active-dot" />}
          </a>

          <button
            className="nav-icon-btn cart-btn"
            onClick={(e) => {
              e.preventDefault();
              onCartOpen();
            }}
            aria-label="Cart"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          <button
            className="nav-icon-btn menu-btn"
            onClick={(e) => {
              e.preventDefault();
              onMenuOpen();
            }}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="navbar-bottom">
        <ul className="nav-links">
          {navLinks.map((link) => {
            const hasDropdown = categorySubcategories[link.href];
            const isLinkActive = currentPath === link.href;
            return (
              <li
                key={link.href}
                className={`nav-item${hasDropdown ? " has-dropdown" : ""}${
                  openDropdown === link.href ? " dropdown-active" : ""
                }`}
                onMouseEnter={() =>
                  hasDropdown && handleDropdownEnter(link.href)
                }
                onMouseLeave={handleDropdownLeave}
              >
                <a
                  href={link.href}
                  className={isLinkActive ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo(link.href);
                  }}
                >
                  {link.label}
                  {hasDropdown && (
                    <svg
                      className="dropdown-arrow"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </a>
                {hasDropdown && openDropdown === link.href && (
                  <div
                    className="dropdown-menu"
                    onMouseEnter={() => handleDropdownEnter(link.href)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    {categorySubcategories[link.href].map((sub) => (
                      <a
                        key={sub.href}
                        href={sub.href}
                        className={`dropdown-item${
                          currentPath === sub.href ? " active" : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigateTo(sub.href);
                        }}
                      >
                        {sub.name}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
          {showPanel && (
            <li className="nav-item">
              <a
                href="/panel"
                className={currentPath === "/panel" ? "active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("/panel");
                }}
              >
                Panel
              </a>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
