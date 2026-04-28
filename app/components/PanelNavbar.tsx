"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
    exact: false,
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
      </svg>
    ),
  },
  {
    href: "/panel/users",
    label: "Users",
    exact: false,
    icon: (
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
  {
    href: "/panel/contacts",
    label: "Contacts",
    exact: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: "/panel/settings",
    label: "Settings",
    exact: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function PanelNavbar({
  signupCount = 0,
  signinCount = 0,
  contactCount = 0,
  cartCount = 0,
  productCount = 0,
}: PanelNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`pn-nav${scrolled ? " scrolled" : ""}`}>
      <div className="pn-inner">
        {/* Logo */}
        <Link href="/panel" className="pn-logo">
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
        </Link>

        {/* Links */}
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
              <Link
                href={link.href}
                className={`pn-link${link.add ? " pn-link--add" : ""}${
                  isActive(link.href, link.exact ?? false) ? " active" : ""
                }`}
              >
                {link.icon}
                {link.label}
                {link.href === "/panel/users" && signupCount > 0 && (
                  <span
                    style={{
                      background: "#daa520",
                      color: "#1a1a1a",
                      borderRadius: "10px",
                      padding: "1px 6px",
                      fontSize: "0.48rem",
                      fontWeight: 600,
                      marginLeft: "6px",
                    }}
                  >
                    {signupCount}
                  </span>
                )}
                {link.href === "/panel/contacts" && contactCount > 0 && (
                  <span
                    style={{
                      background: "#daa520",
                      color: "#1a1a1a",
                      borderRadius: "10px",
                      padding: "1px 6px",
                      fontSize: "0.48rem",
                      fontWeight: 600,
                      marginLeft: "6px",
                    }}
                  >
                    {contactCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="pn-actions">
          {/* Products count */}
          <button className="pn-icon-btn" title="Total Products">
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
          </button>

          {/* Cart */}
          <button className="pn-icon-btn" title="Cart Orders">
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
          </button>

          <div className="pn-divider" />

          {/* Admin badge */}
          <div className="pn-admin-badge">
            <span className="pn-admin-dot" />
            <span className="pn-admin-label">Admin</span>
          </div>

          {/* Back to site */}
          <Link href="/" className="pn-icon-btn" title="Back to Site">
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
          </Link>
        </div>
      </div>
    </nav>
  );
}
