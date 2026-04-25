"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isOwner } from "@/lib/checkOwner";
import "./sidebar.css";
import { signOutUser } from "@/lib/auth";

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
    href: "/accessories",
    label: "Accessories",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
    subcategories: [
      "Chargers",
      "Cables",
      "Phone Holders",
      "Tech Gadgets",
      "Smart Accessories",
    ],
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
    subcategories: [
      "Men Watches",
      "Women Watches",
      "Smart Watches",
      "Luxury Watches",
    ],
  },
  {
    href: "/automotive",
    label: "Automotive",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M5 8h14M5 8a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2M5 8L7 4h10l2 4" />
        <circle cx="7" cy="16" r="2" />
        <circle cx="17" cy="16" r="2" />
      </svg>
    ),
    subcategories: [
      "Car Accessories",
      "Car Cleaning Tools",
      "Phone Holders",
      "Interior Accessories",
    ],
  },
  {
    href: "/home-decor",
    label: "Home Decor",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
    subcategories: [
      "Wall Decor",
      "Lighting",
      "Kitchen Essentials",
      "Storage & Organizers",
    ],
  },
  {
    href: "/about",
    label: "About",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
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
  const pathname = usePathname();
  const router = useRouter();

  // ✅ FIX: Start undefined so we don't flash signed-in state
  const [user, setUser] = useState<any>(undefined);
  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const toggleCategory = (href: string) => {
    setExpandedCategories((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        setUserEmail(session.user.email ?? null);
        // Fetch profile
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single();
        if (data) setProfile(data);
      } else {
        setUser(null);
        setUserEmail(null);
        setProfile(null);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Sidebar] Auth event:", event);

      if (event === "SIGNED_OUT" || !session) {
        // ✅ Immediately clear all state
        setUser(null);
        setUserEmail(null);
        setProfile(null);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session.user);
        setUserEmail(session.user.email ?? null);
        // Fetch profile
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single();
        if (data) setProfile(data);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);

    try {
      // ✅ FIX: Immediately clear UI state FIRST before async operations
      setUser(null);
      setUserEmail(null);
      setProfile(null);
      onClose();

      // Then do the actual signout (includes storage/cookie clearing)
      await signOutUser();

      // Navigate to home
      router.push("/");
      // Force a hard refresh to clear any cached auth state
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
      router.push("/");
    } finally {
      setSigningOut(false);
    }
  };

  const showPanel = isOwner(userEmail);
  const isSignedIn = user !== undefined && user !== null;

  return (
    <>
      <div
        className={`sidebar-overlay${isOpen ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={sidebarRef}
        className={`sidebar${isOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {/* Header */}
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo" onClick={onClose}>
            <span className="sidebar-logo-text">
              <span className="sidebar-logo-tech">TECH</span>
              <span className="sidebar-logo-four">4U</span>
            </span>
          </Link>

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
            {navLinks.map((link) => {
              const hasSubcategories =
                link.subcategories && link.subcategories.length > 0;
              const isExpanded = expandedCategories[link.href];

              return (
                <li key={link.href}>
                  <div className="sidebar-nav-item-wrapper">
                    <Link
                      href={link.href}
                      className={`sidebar-nav-link${
                        isActive(link.href) ? " active" : ""
                      }`}
                      onClick={
                        hasSubcategories
                          ? (e) => {
                              e.preventDefault();
                              toggleCategory(link.href);
                            }
                          : onClose
                      }
                    >
                      {link.icon}
                      {link.label}
                      {hasSubcategories && (
                        <svg
                          className={`sidebar-nav-arrow${
                            isExpanded ? " expanded" : ""
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      )}
                    </Link>
                  </div>

                  {hasSubcategories && isExpanded && (
                    <ul className="sidebar-subnav-list">
                      {link.subcategories!.map((sub) => {
                        const subHref = `${link.href}/${sub
                          .toLowerCase()
                          .replace(/ &/g, "")
                          .replace(/ /g, "-")}`;
                        return (
                          <li key={sub}>
                            <Link
                              href={subHref}
                              className={`sidebar-subnav-link${
                                pathname === subHref ? " active" : ""
                              }`}
                              onClick={onClose}
                            >
                              {sub}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          <hr className="sidebar-hr" />

          {/* Account section */}
          <p className="sidebar-section-label" style={{ marginTop: "1rem" }}>
            Account
          </p>

          <ul className="sidebar-nav-list">
            {isSignedIn ? (
              <>
                <li className="sidebar-nav-item">
                  <Link
                    href="/profile"
                    className={`sidebar-nav-link sidebar-nav-link--welcome${
                      isActive("/profile") ? " active" : ""
                    }`}
                    onClick={onClose}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="sidebar-welcome-text">
                      <span className="sidebar-welcome-label">Welcome,</span>
                      <span className="sidebar-welcome-name">
                        {profile?.username || "Member"}
                      </span>
                    </span>
                    <span className="sidebar-welcome-dot" aria-hidden="true" />
                  </Link>
                </li>
                <li className="sidebar-nav-item">
                  <Link
                    href="/profile"
                    className={`sidebar-nav-link${
                      isActive("/profile") ? " active" : ""
                    }`}
                    onClick={onClose}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                    </svg>
                    Profile Settings
                  </Link>
                </li>
                <li className="sidebar-nav-item">
                  <button
                    className="sidebar-nav-link sidebar-nav-link--signout"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    {signingOut ? "Signing Out…" : "Sign Out"}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="sidebar-nav-item">
                  <Link
                    href="/signin"
                    className={`sidebar-nav-link${
                      isActive("/signin") ? " active" : ""
                    }`}
                    onClick={onClose}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Sign In
                  </Link>
                </li>
                <li className="sidebar-nav-item">
                  <Link
                    href="/signup"
                    className={`sidebar-nav-link${
                      isActive("/signup") ? " active" : ""
                    }`}
                    onClick={onClose}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    Create Account
                  </Link>
                </li>
              </>
            )}

            <li className="sidebar-nav-item">
              <Link
                href="/cart"
                className={`sidebar-nav-link${
                  isActive("/cart") ? " active" : ""
                }`}
                onClick={onClose}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                Cart
              </Link>
            </li>
          </ul>

          {/* Admin Section */}
          {showPanel && (
            <>
              <hr className="sidebar-hr" />
              <p
                className="sidebar-section-label"
                style={{ marginTop: "1rem" }}
              >
                Admin
              </p>
              <ul className="sidebar-nav-list">
                <li className="sidebar-nav-item">
                  <Link
                    href="/panel/add-product"
                    className={`sidebar-nav-link${
                      isActive("/panel/add-product") ? " active" : ""
                    }`}
                    onClick={onClose}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    Add Product
                  </Link>
                </li>
                <li className="sidebar-nav-item">
                  <Link
                    href="/panel/products"
                    className={`sidebar-nav-link${
                      isActive("/panel/products") ? " active" : ""
                    }`}
                    onClick={onClose}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    Manage Products
                  </Link>
                </li>
              </ul>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <p className="sidebar-footer-text">
            © 2024 Aurexia — All Rights Reserved
          </p>
        </div>
      </div>

      <style jsx>{`
        .sidebar-nav-item-wrapper {
          position: relative;
        }
        .sidebar-nav-arrow {
          width: 12px;
          height: 12px;
          margin-left: auto;
          transition: transform 0.2s ease;
        }
        .sidebar-nav-arrow.expanded {
          transform: rotate(180deg);
        }
        .sidebar-subnav-list {
          list-style: none;
          padding-left: 2.5rem;
          margin: 0.25rem 0 0.5rem;
        }
        .sidebar-subnav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          font-family: var(--font-sans);
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(245, 240, 232, 0.45);
          text-decoration: none;
          transition: all 0.2s ease;
          border-radius: 2px;
        }
        .sidebar-subnav-link:hover {
          color: var(--gold);
          background: rgba(184, 150, 62, 0.05);
        }
        .sidebar-subnav-link.active {
          color: var(--gold);
        }
        .sidebar-nav-link--signout:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
