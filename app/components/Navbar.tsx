"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isOwner } from "@/lib/checkOwner";
import { useCartStore } from "@/lib/cartStore";
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
  const router = useRouter();
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(undefined);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
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
      } catch {
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
      } else {
        setUser(session.user);
        setUserEmail(session.user.email ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const showPanel = isOwner(userEmail);
  const authResolved = user !== undefined;
  const isSignedIn = authResolved && user !== null;

  const handleDropdownEnter = (href: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setOpenDropdown(href);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
      <div className="navbar-container">
        {/* LEFT — Search only (currency removed) */}
        <div className="navbar-left">
          <button
            className="nav-icon-btn search-btn"
            onClick={onSearchOpen}
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
            <span className="nav-icon-tooltip">Search</span>
          </button>
        </div>

        {/* CENTER — Logo */}
        <div className="navbar-center">
          <Link href="/" className="navbar-logo" prefetch={true}>
            <span className="logo-tech">TECH</span>
            <span className="logo-four">4U</span>
          </Link>
        </div>

        {/* RIGHT — User & Cart */}
        <div className="navbar-right">
          <div className="nav-desktop-only">
            <Link
              href={isSignedIn ? "/profile" : "/signin"}
              className="nav-icon-btn user-btn"
              aria-label={isSignedIn ? "My Profile" : "Sign In"}
              prefetch={true}
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
              <span className="nav-icon-tooltip">
                {isSignedIn ? "Profile" : "Sign In"}
              </span>
            </Link>
          </div>

          <button
            className="nav-icon-btn cart-btn"
            onClick={onCartOpen}
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
            <span className="nav-icon-tooltip">Cart</span>
          </button>

          <button
            className="nav-icon-btn menu-btn mobile-only"
            onClick={onMenuOpen}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
            <span className="nav-icon-tooltip">Menu</span>
          </button>
        </div>
      </div>

      {/* BOTTOM NAV — Desktop */}
      <div className="navbar-bottom desktop-only">
        <ul className="nav-links">
          {navLinks.map((link) => {
            const hasDropdown = categorySubcategories[link.href];
            const isActive = pathname === link.href;
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
                <Link
                  href={link.href}
                  className={isActive ? "active" : ""}
                  prefetch={true}
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
                </Link>
                {hasDropdown && openDropdown === link.href && (
                  <div
                    className="dropdown-menu"
                    onMouseEnter={() => handleDropdownEnter(link.href)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    {categorySubcategories[link.href].map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`dropdown-item${
                          pathname === sub.href ? " active" : ""
                        }`}
                        prefetch={true}
                        onClick={() => setOpenDropdown(null)}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}

          {showPanel && (
            <li className="nav-item">
              <Link
                href="/panel"
                className={pathname === "/panel" ? "active" : ""}
                prefetch={true}
              >
                Panel
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
