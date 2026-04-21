"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "./navbar.css";

interface NavbarProps {
  onMenuOpen: () => void;
}

export default function Navbar({ onMenuOpen }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
      <div className="navbar-inner">
        {/* ── Logo ── */}
        <Link href="/" className="navbar-logo">
          <Image
            src="/logo.png"
            alt="Aurexia Logo"
            width={38}
            height={38}
            className="navbar-logo-image dark:invert"
            priority
          />
          <span className="navbar-logo-text">
            <span className="navbar-logo-title">Aurexia</span>
          </span>
        </Link>

        {/* ── Navigation Links ── */}
        <ul className="navbar-links">
          <li>
            <Link href="/" className="active">
              {/* Home icon */}
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
              Home
            </Link>
          </li>
          <li>
            <Link href="/watches">
              {/* Watch icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                width="14"
                height="14"
              >
                <circle cx="12" cy="12" r="7" />
                <path d="M12 9v3l2 2" />
                <path d="M9.5 3.5l1 3M14.5 3.5l-1 3M9.5 20.5l1-3M14.5 20.5l-1-3" />
              </svg>
              Watches
            </Link>
          </li>
          <li>
            <Link href="/accessories">
              {/* Mobile accessories icon */}
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
              Mobile Accessories
            </Link>
          </li>
          <li>
            <Link href="/contact">
              {/* Contact icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                width="14"
                height="14"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Contact
            </Link>
          </li>
        </ul>

        {/* ── Right Icons ── */}
        <div className="navbar-icons">
          {/* Search */}
          <button className="navbar-icon-btn" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          {/* Cart */}
          <button className="navbar-icon-btn" aria-label="Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span className="badge" aria-hidden="true" />
          </button>

          {/* User */}
          <button className="navbar-icon-btn" aria-label="Account">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>

          {/* Divider — hidden on mobile via CSS */}
          <div className="navbar-divider" aria-hidden="true" />

          {/* Hamburger — visible only on mobile */}
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
