"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import "./sidebar.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navLinks = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    href: "/watches",
    label: "Watches",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="7" />
        <path d="M12 9v3l2 2" />
        <path d="M9.5 3.5l1 3M14.5 3.5l-1 3M9.5 20.5l1-3M14.5 20.5l-1-3" />
      </svg>
    ),
  },
  {
    href: "/accessories",
    label: "Mobile Accessories",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    href: "/contact",
    label: "Contact",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  /* ── Lock / unlock body scroll when sidebar opens/closes ── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* ── Close on Escape key ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  /* ── Click INSIDE sidebar should NOT close it ── */
  const handleSidebarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* ── Overlay — click outside to close ── */}
      <div
        className={`sidebar-overlay${isOpen ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Sidebar Panel ── */}
      <div
        ref={sidebarRef}
        className={`sidebar${isOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onClick={handleSidebarClick}
      >
        {/* Header */}
        <div className="sidebar-header">
          {/* Logo */}
          <Link href="/" className="sidebar-logo" onClick={onClose}>
            <Image
              src="/next.svg"
              alt="LuxeTime Logo"
              width={34}
              height={34}
              className="sidebar-logo-image dark:invert"
            />
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: 1,
              }}
            >
              <span className="sidebar-logo-title">LuxeTime</span>
              <span className="sidebar-logo-sub">Est. 2024</span>
            </span>
          </Link>

          {/* Cross / Close button */}
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Navigation</p>

          <ul className="sidebar-nav-list">
            {navLinks.map((link, i) => (
              <li key={link.href} className="sidebar-nav-item">
                <Link
                  href={link.href}
                  className={`sidebar-nav-link${
                    link.href === "/" ? " active" : ""
                  }`}
                  onClick={onClose}
                >
                  {link.icon}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <hr className="sidebar-hr" />

          <p className="sidebar-section-label" style={{ marginTop: "1rem" }}>
            Account
          </p>

          <ul className="sidebar-nav-list">
            <li className="sidebar-nav-item">
              <Link
                href="/account"
                className="sidebar-nav-link"
                onClick={onClose}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                My Account
              </Link>
            </li>
            <li className="sidebar-nav-item">
              <Link href="/cart" className="sidebar-nav-link" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                Cart
              </Link>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <p className="sidebar-footer-text">
            © 2024 LuxeTime — All Rights Reserved
          </p>
        </div>
      </div>
    </>
  );
}
