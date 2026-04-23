"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isOwner } from "@/lib/checkOwner";
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
    href: "/gadgets",
    label: "Gadgets",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    href: "/home-decor",
    label: "Home Décor",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
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
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Check if current user is owner
  const showPanel = isOwner(userEmail);

  useEffect(() => {
    const getUser = async () => {
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
      }
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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
      }
    );

    return () => listener.subscription.unsubscribe();
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
    await supabase.auth.signOut();
    setUser(null);
    setUserEmail(null);
    setProfile(null);
    onClose();
    router.push("/signin");
  };

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
          <Link href="/" className="sidebar-logo" onClick={onClose}>
            <Image
              src="/logo.png"
              alt="Aurexia Logo"
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
              <span className="sidebar-logo-title">Aurexia</span>
              <span className="sidebar-logo-sub">Est. 2024</span>
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
            {navLinks.map((link) => (
              <li key={link.href} className="sidebar-nav-item">
                <Link
                  href={link.href}
                  className={`sidebar-nav-link${
                    isActive(link.href) ? " active" : ""
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

          {/* Account section — auth-aware */}
          <p className="sidebar-section-label" style={{ marginTop: "1rem" }}>
            Account
          </p>

          <ul className="sidebar-nav-list">
            {user ? (
              <>
                {/* Logged in: show welcome + profile link */}
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
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <>
                {/* Not logged in: show sign in / create account */}
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

          {/* Admin Section - Only visible to owner */}
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
                    href="/panel"
                    className={`sidebar-nav-link${
                      isActive("/panel") ? " active" : ""
                    }`}
                    onClick={onClose}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <path d="M14 17.5h7M17.5 14v7" strokeLinecap="round" />
                    </svg>
                    Admin Panel
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
    </>
  );
}
