"use client";

import { useEffect, useRef, useState } from "react";
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
      { name: "Chargers", href: "/accessories/chargers" },
      { name: "Cables", href: "/accessories/cables" },
      { name: "Phone Holders", href: "/accessories/phone-holders" },
      { name: "Tech Gadgets", href: "/accessories/tech-gadgets" },
      { name: "Smart Accessories", href: "/accessories/smart-accessories" },
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
      { name: "Men Watches", href: "/watches/men-watches" },
      { name: "Women Watches", href: "/watches/women-watches" },
      { name: "Smart Watches", href: "/watches/smart-watches" },
      { name: "Luxury Watches", href: "/watches/luxury-watches" },
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
      { name: "Car Accessories", href: "/automotive/car-accessories" },
      { name: "Car Cleaning Tools", href: "/automotive/car-cleaning-tools" },
      { name: "Phone Holders", href: "/automotive/phone-holders" },
      {
        name: "Interior Accessories",
        href: "/automotive/interior-accessories",
      },
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
      { name: "Wall Decor", href: "/home-decor/wall-decor" },
      { name: "Lighting", href: "/home-decor/lighting" },
      { name: "Kitchen Essentials", href: "/home-decor/kitchen-essentials" },
      { name: "Storage & Organizers", href: "/home-decor/storage-organizers" },
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

  const [user, setUser] = useState<any>(undefined);
  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [signingOut, setSigningOut] = useState(false);

  // Helper function to handle navigation with page reload
  const handleNavigation = (href: string) => {
    onClose(); // Close sidebar first
    setTimeout(() => {
      window.location.href = href;
    }, 150);
  };

  // Toggle category dropdown - only for the icon/arrow area
  const toggleCategory = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategories((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  // Handle category link click - goes to the page with reload
  const handleCategoryClick = (href: string) => {
    handleNavigation(href);
  };

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        setUserEmail(session.user.email ?? null);
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
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setUserEmail(null);
        setProfile(null);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session.user);
        setUserEmail(session.user.email ?? null);
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
      setUser(null);
      setUserEmail(null);
      setProfile(null);
      onClose();
      await signOutUser();
      window.location.href = "/";
    } catch (err) {
      console.error("Sign out error:", err);
      window.location.href = "/";
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
        <div className="sidebar-header">
          {/* Logo - Page reload on click */}
          <a
            href="/"
            className="sidebar-logo"
            onClick={(e) => {
              e.preventDefault();
              onClose();
              setTimeout(() => {
                window.location.href = "/";
              }, 150);
            }}
          >
            <span className="sidebar-logo-text">
              <span className="sidebar-logo-tech">TECH</span>
              <span className="sidebar-logo-four">4U</span>
            </span>
          </a>

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
                <li key={link.href} className="sidebar-nav-item-wrapper">
                  <div className="sidebar-nav-link-container">
                    {/* Category Link - goes to page with reload when clicked on text */}
                    <div
                      className={`sidebar-nav-link${
                        window.location.pathname === link.href ? " active" : ""
                      }`}
                    >
                      <span className="sidebar-link-icon">{link.icon}</span>
                      <span
                        className="sidebar-link-text"
                        onClick={() => handleCategoryClick(link.href)}
                      >
                        {link.label}
                      </span>

                      {hasSubcategories && (
                        <button
                          className="sidebar-arrow-btn"
                          onClick={(e) => toggleCategory(link.href, e)}
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
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
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subcategories Dropdown */}
                  {hasSubcategories && isExpanded && (
                    <ul className="sidebar-subnav-list">
                      {link.subcategories!.map((sub, index) => (
                        <li key={sub.href} className="sidebar-subnav-item">
                          <a
                            href={sub.href}
                            className={`sidebar-subnav-link${
                              window.location.pathname === sub.href
                                ? " active"
                                : ""
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              onClose();
                              setTimeout(() => {
                                window.location.href = sub.href;
                              }, 150);
                            }}
                            style={{ animationDelay: `${index * 0.03}s` }}
                          >
                            <span className="sidebar-subnav-dot" />
                            {sub.name}
                          </a>
                        </li>
                      ))}
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
                  <a
                    href="/profile"
                    className={`sidebar-nav-link${
                      window.location.pathname === "/profile" ? " active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      setTimeout(() => {
                        window.location.href = "/profile";
                      }, 150);
                    }}
                  >
                    <span className="sidebar-link-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <span className="sidebar-welcome-text">
                      <span className="sidebar-welcome-label">Welcome,</span>
                      <span className="sidebar-welcome-name">
                        {profile?.username || "Member"}
                      </span>
                    </span>
                    <span className="sidebar-welcome-dot" aria-hidden="true" />
                  </a>
                </li>
                <li className="sidebar-nav-item">
                  <a
                    href="/profile"
                    className={`sidebar-nav-link${
                      window.location.pathname === "/profile" ? " active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      setTimeout(() => {
                        window.location.href = "/profile";
                      }, 150);
                    }}
                  >
                    <span className="sidebar-link-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                      </svg>
                    </span>
                    Profile Settings
                  </a>
                </li>
                <li className="sidebar-nav-item">
                  <button
                    className="sidebar-nav-link sidebar-nav-link--signout"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    <span className="sidebar-link-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </span>
                    {signingOut ? "Signing Out…" : "Sign Out"}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="sidebar-nav-item">
                  <a
                    href="/signin"
                    className={`sidebar-nav-link${
                      window.location.pathname === "/signin" ? " active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      setTimeout(() => {
                        window.location.href = "/signin";
                      }, 150);
                    }}
                  >
                    <span className="sidebar-link-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    Sign In
                  </a>
                </li>
                <li className="sidebar-nav-item">
                  <a
                    href="/signup"
                    className={`sidebar-nav-link${
                      window.location.pathname === "/signup" ? " active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      setTimeout(() => {
                        window.location.href = "/signup";
                      }, 150);
                    }}
                  >
                    <span className="sidebar-link-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                    </span>
                    Create Account
                  </a>
                </li>
              </>
            )}

            <li className="sidebar-nav-item">
              <a
                href="/cart"
                className={`sidebar-nav-link${
                  window.location.pathname === "/cart" ? " active" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  setTimeout(() => {
                    window.location.href = "/cart";
                  }, 150);
                }}
              >
                <span className="sidebar-link-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </span>
                Cart
              </a>
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
                  <a
                    href="/panel/add-product"
                    className={`sidebar-nav-link${
                      window.location.pathname === "/panel/add-product"
                        ? " active"
                        : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      setTimeout(() => {
                        window.location.href = "/panel/add-product";
                      }, 150);
                    }}
                  >
                    <span className="sidebar-link-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                    </span>
                    Add Product
                  </a>
                </li>
                <li className="sidebar-nav-item">
                  <a
                    href="/panel/products"
                    className={`sidebar-nav-link${
                      window.location.pathname === "/panel/products"
                        ? " active"
                        : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      setTimeout(() => {
                        window.location.href = "/panel/products";
                      }, 150);
                    }}
                  >
                    <span className="sidebar-link-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                    </span>
                    Manage Products
                  </a>
                </li>
              </ul>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <p className="sidebar-footer-text">
            © 2026 Tech4U — All Rights Reserved
          </p>
        </div>
      </div>
    </>
  );
}
