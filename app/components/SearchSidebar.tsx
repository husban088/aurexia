"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./searchsidebar.css";

interface SearchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const trendingSearches = [
  "Luxury Watches",
  "Leather Straps",
  "Phone Cases",
  "Wireless Chargers",
  "Watch Winders",
  "Screen Protectors",
];

const recentSearches = ["Rolex Datejust", "Magsafe Wallet", "Apple Watch Band"];

export default function SearchSidebar({ isOpen, onClose }: SearchSidebarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSidebarClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <div
        className={`ss-overlay${isOpen ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={sidebarRef}
        className={`ss-sidebar${isOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onClick={handleSidebarClick}
      >
        {/* Decorative lines */}
        <div className="ss-deco-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        {/* Header */}
        <div className="ss-header">
          <div className="ss-header-top">
            <div className="ss-header-label">
              <span className="ss-label-line" />
              <span className="ss-label-text">Search</span>
              <span className="ss-label-line" />
            </div>
            <button
              className="ss-close-btn"
              onClick={onClose}
              aria-label="Close search"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <h2 className="ss-title">
            Discover <em>Luxury</em>
          </h2>
        </div>

        {/* Search Input */}
        <div
          className={`ss-input-wrap${focused ? " focused" : ""}${
            query ? " filled" : ""
          }`}
        >
          <span className="ss-input-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            className="ss-input"
            placeholder="Search watches, accessories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-label="Search products"
          />
          {query && (
            <button
              className="ss-clear-btn"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <div className="ss-input-line" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="ss-content">
          {!query ? (
            <>
              {/* Trending */}
              <div className="ss-section">
                <p className="ss-section-label">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    width="12"
                    height="12"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  Trending
                </p>
                <ul className="ss-tags">
                  {trendingSearches.map((tag) => (
                    <li key={tag}>
                      <button className="ss-tag" onClick={() => setQuery(tag)}>
                        {tag}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recent */}
              <div className="ss-section">
                <p className="ss-section-label">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    width="12"
                    height="12"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Recent
                </p>
                <ul className="ss-recent-list">
                  {recentSearches.map((item) => (
                    <li key={item} className="ss-recent-item">
                      <button
                        className="ss-recent-btn"
                        onClick={() => setQuery(item)}
                      >
                        <span className="ss-recent-icon" aria-hidden="true">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <circle cx="11" cy="11" r="7" />
                            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                          </svg>
                        </span>
                        <span>{item}</span>
                        <span className="ss-recent-arrow" aria-hidden="true">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              d="M7 17L17 7M7 7h10v10"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Links */}
              <div className="ss-section">
                <p className="ss-section-label">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    width="12"
                    height="12"
                  >
                    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                  Collections
                </p>
                <div className="ss-quick-links">
                  <Link
                    href="/watches"
                    className="ss-quick-card"
                    onClick={onClose}
                  >
                    <span className="ss-quick-icon" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      >
                        <circle cx="12" cy="12" r="7" />
                        <path d="M12 9v3l2 2" />
                        <path d="M9.5 3.5l1 3M14.5 3.5l-1 3" />
                      </svg>
                    </span>
                    <span>Watches</span>
                    <svg
                      className="ss-quick-arrow"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" />
                    </svg>
                  </Link>
                  <Link
                    href="/accessories"
                    className="ss-quick-card"
                    onClick={onClose}
                  >
                    <span className="ss-quick-icon" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      >
                        <rect x="7" y="2" width="10" height="20" rx="2" />
                        <path d="M12 18h.01" />
                      </svg>
                    </span>
                    <span>Accessories</span>
                    <svg
                      className="ss-quick-arrow"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            /* Search Results Placeholder */
            <div className="ss-results">
              <p className="ss-results-label">
                Results for <em>"{query}"</em>
              </p>
              <div className="ss-no-results">
                <div className="ss-no-results-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <p>Searching across all collections…</p>
                <p className="ss-no-results-sub">
                  Connect your product catalog to see live results
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ss-footer">
          <p>
            Press <kbd>ESC</kbd> to close · <kbd>↵</kbd> to search
          </p>
        </div>
      </div>
    </>
  );
}
