"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isOwner } from "@/lib/checkOwner";
import { useCurrency } from "@/app/context/CurrencyContext";
import "./panel-navbar.css";

interface PanelNavbarProps {
  signupCount?: number;
  signinCount?: number;
  contactCount?: number;
  cartCount?: number;
  productCount?: number;
}

const panelLinks = [
  {
    href: "/panel",
    label: "Dashboard",
    exact: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/panel/add-product",
    label: "Add Product",
    exact: true,
    add: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/panel/products",
    label: "Products",
    exact: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path d="M16 3H8l-2 4h12l-2-4z" />
        <line x1="3" y1="11" x2="21" y2="11" />
      </svg>
    ),
  },
  {
    href: "/panel/orders",
    label: "Orders",
    exact: false,
    icon: (
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
    ),
  },
];

function PanelLink({
  href,
  label,
  icon,
  add,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  add?: boolean;
  isActive: boolean;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = href;
  };

  return (
    <a
      href={href}
      className={`pn-link${add ? " pn-link--add" : ""}${
        isActive ? " active" : ""
      }`}
      onClick={handleClick}
    >
      {icon}
      {label}
    </a>
  );
}

// Currency Dropdown Component for Panel Navbar
function PanelCurrencyDropdown() {
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { currency, currencies, setCurrency } = useCurrency();

  const availableCurrencies = currencies.filter((c) => c.code !== "PKR");

  const handleMouseEnter = () => {
    if (currencyTimeoutRef.current) {
      clearTimeout(currencyTimeoutRef.current);
      currencyTimeoutRef.current = null;
    }
    setCurrencyOpen(true);
  };

  const handleMouseLeave = () => {
    currencyTimeoutRef.current = setTimeout(() => setCurrencyOpen(false), 200);
  };

  return (
    <div
      className="pn-currency-dropdown"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="pn-currency-btn">
        <span className="pn-currency-flag">{currency.flag}</span>
        <span className="pn-currency-symbol">{currency.symbol}</span>
        <span className="pn-currency-code">{currency.code}</span>
        <svg
          className={`pn-currency-arrow ${currencyOpen ? "open" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {currencyOpen && (
        <div className="pn-currency-menu">
          {availableCurrencies.map((cur) => (
            <button
              key={cur.code}
              className={`pn-currency-option${
                currency.code === cur.code ? " active" : ""
              }`}
              onClick={() => {
                setCurrency(cur);
                setCurrencyOpen(false);
              }}
            >
              <span className="pn-currency-option-flag">{cur.flag}</span>
              <span className="pn-currency-option-symbol">{cur.symbol}</span>
              <span className="pn-currency-option-code">{cur.code}</span>
              <span className="pn-currency-option-name">{cur.name}</span>
            </button>
          ))}
          {/* PKR option */}
          <button
            className={`pn-currency-option${
              currency.code === "PKR" ? " active" : ""
            }`}
            onClick={() => {
              const pkr = currencies.find((c) => c.code === "PKR");
              if (pkr) {
                setCurrency(pkr);
                setCurrencyOpen(false);
              }
            }}
          >
            <span className="pn-currency-option-flag">🇵🇰</span>
            <span className="pn-currency-option-symbol">₨</span>
            <span className="pn-currency-option-code">PKR</span>
            <span className="pn-currency-option-name">Pakistani Rupee</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function PanelNavbar({
  signupCount = 0,
  contactCount = 0,
  cartCount = 0,
  productCount = 0,
}: PanelNavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();

  // ✅ FIXED: Proper active state checking
  const isActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    // For non-exact routes like /panel/products, check if pathname starts with href
    // But make sure it doesn't accidentally match /panel/products when on /panel/add-product
    if (href === "/panel/products") {
      return (
        pathname === "/panel/products" ||
        pathname?.startsWith("/panel/products/")
      );
    }
    return pathname?.startsWith(href) && href !== "/panel/add-product";
  };

  // Check if user is authorized (owner)
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (error || !user) {
          setIsAuthorized(false);
          window.location.href = "/signin?redirectTo=/panel";
          return;
        }

        const userEmail = user.email;
        const isUserOwner = isOwner(userEmail);

        if (!isUserOwner) {
          setIsAuthorized(false);
          window.location.href = "/";
          return;
        }

        setIsAuthorized(true);
      } catch (err) {
        console.error("Auth check error in PanelNavbar:", err);
        setIsAuthorized(false);
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setIsAuthorized(false);
        window.location.href = "/signin?redirectTo=/panel";
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        checkAuth();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch (err) {
      console.error("Sign out error:", err);
      window.location.href = "/";
    }
  };

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isAuthorized && mounted) {
    return null;
  }

  if (!mounted) {
    return (
      <nav className="pn-nav">
        <div className="pn-inner">
          <div className="pn-logo">
            <div className="pn-logo-badge">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            </div>
            <div className="pn-logo-text">
              <span className="pn-logo-title">TECH4U</span>
              <span className="pn-logo-sub">Admin Panel</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`pn-nav${scrolled ? " scrolled" : ""}`}>
      <div className="pn-inner">
        <a
          href="/"
          className="pn-logo"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = "/";
          }}
        >
          <div className="pn-logo-badge">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          </div>
          <div className="pn-logo-text">
            <span className="pn-logo-title">TECH4U</span>
            <span className="pn-logo-sub">Admin Panel</span>
          </div>
        </a>

        <ul
          className="pn-links"
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          {panelLinks.map((link) => (
            <li key={link.href}>
              <PanelLink
                href={link.href}
                label={link.label}
                icon={link.icon}
                add={link.add}
                isActive={isActive(link.href, link.exact ?? false)}
              />
            </li>
          ))}
        </ul>

        <div className="pn-actions">
          {/* Currency Dropdown - Added to Panel Navbar */}
          <PanelCurrencyDropdown />

          <div className="pn-icon-btn" title="Total Products">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path d="M16 3H8l-2 4h12l-2-4z" />
            </svg>
            {productCount > 0 && (
              <span className="pn-badge">{productCount}</span>
            )}
          </div>

          <div className="pn-icon-btn" title="Cart Orders">
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
            {cartCount > 0 && <span className="pn-badge">{cartCount}</span>}
          </div>

          <div className="pn-icon-btn" title="Contacts">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            {contactCount > 0 && (
              <span className="pn-badge">{contactCount}</span>
            )}
          </div>

          <div className="pn-icon-btn" title="Users">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            {signupCount > 0 && <span className="pn-badge">{signupCount}</span>}
          </div>

          <div className="pn-divider" />

          <div className="pn-admin-badge">
            <span className="pn-admin-dot" />
            <span className="pn-admin-label">Admin</span>
          </div>

          {/* Sign Out Button */}
          <button
            className="pn-icon-btn pn-signout-btn"
            title="Sign Out"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {signingOut && <span className="pn-signout-spinner" />}
          </button>
        </div>
      </div>
    </nav>
  );
}
