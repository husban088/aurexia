"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "./searchsidebar.css";
import { useCurrency } from "../context/CurrencyContext";

interface SearchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  brand?: string;
  category: string;
  subcategory: string;
  price: number;
  original_price?: number;
  images: string[];
  slug?: string;
}

const trendingSearches = [
  "Watches",
  "Accessories",
  "Chargers",
  "Phone Holders",
  "Smart Watches",
  "Luxury Watches",
];

const RECENT_SEARCHES_KEY = "tech4u_recent_searches";
const MAX_RECENT = 5;

export default function SearchSidebar({ isOpen, onClose }: SearchSidebarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { formatPrice } = useCurrency();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (s) => s.toLowerCase() !== searchTerm.toLowerCase()
      );
      const updated = [searchTerm, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  // Fetch trending products (featured products)
  useEffect(() => {
    async function fetchTrending() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, brand, category, subcategory, images")
          .eq("is_active", true)
          .eq("is_featured", true)
          .limit(4);

        if (error) {
          console.error("Error fetching trending products:", error);
          return;
        }

        if (data && data.length > 0) {
          const productIds = data.map((p) => p.id);
          const { data: variants } = await supabase
            .from("product_variants")
            .select("product_id, price, original_price, attribute_type")
            .in("product_id", productIds)
            .eq("is_active", true);

          const variantMap: Record<string, any> = {};
          variants?.forEach((v) => {
            if (!variantMap[v.product_id] || v.attribute_type === "standard") {
              variantMap[v.product_id] = v;
            }
          });

          const formatted: SearchResult[] = data.map((p) => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            category: p.category,
            subcategory: p.subcategory,
            price: variantMap[p.id]?.price || 0,
            original_price: variantMap[p.id]?.original_price,
            images: p.images || [],
          }));
          setTrendingProducts(formatted);
        }
      } catch (err) {
        console.error("Error fetching trending products:", err);
      }
    }
    fetchTrending();
  }, []);

  // Search products - FIXED: Better search with multiple fields
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setShowResults(true);

    try {
      const searchTerm = searchQuery.trim().toLowerCase();

      // Search in products table with multiple conditions
      const { data: products, error } = await supabase
        .from("products")
        .select("id, name, brand, category, subcategory, images, is_active")
        .eq("is_active", true)
        .or(
          `name.ilike.%${searchTerm}%,` +
            `brand.ilike.%${searchTerm}%,` +
            `category.ilike.%${searchTerm}%,` +
            `subcategory.ilike.%${searchTerm}%`
        )
        .limit(20);

      if (error) {
        console.error("Search error:", error);
        setResults([]);
        setLoading(false);
        return;
      }

      if (products && products.length > 0) {
        // Get variants for pricing
        const productIds = products.map((p) => p.id);
        const { data: variants } = await supabase
          .from("product_variants")
          .select("product_id, price, original_price, attribute_type")
          .in("product_id", productIds)
          .eq("is_active", true);

        const variantMap: Record<string, any> = {};
        variants?.forEach((v) => {
          if (!variantMap[v.product_id] || v.attribute_type === "standard") {
            variantMap[v.product_id] = v;
          }
        });

        const searchResults: SearchResult[] = products.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          subcategory: p.subcategory,
          price: variantMap[p.id]?.price || 0,
          original_price: variantMap[p.id]?.original_price,
          images: p.images || [],
        }));

        setResults(searchResults);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search - triggers as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const delayDebounce = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, performSearch]);

  // Handle search submit (Enter key or View All button)
  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    saveRecentSearch(query.trim());
    onClose();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }, [query, saveRecentSearch, onClose, router]);

  // Handle result click
  const handleResultClick = useCallback(
    (productId: string, productName: string) => {
      saveRecentSearch(productName);
      onClose();
      router.push(`/product/${productId}`);
    },
    [saveRecentSearch, onClose, router]
  );

  // Handle trending/quick link click
  const handleQuickSearch = useCallback(
    (term: string) => {
      setQuery(term);
      saveRecentSearch(term);
      performSearch(term);
      onClose();
      router.push(`/search?q=${encodeURIComponent(term)}`);
    },
    [saveRecentSearch, onClose, router, performSearch]
  );

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setQuery("");
      setShowResults(false);
      setResults([]);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
      if (e.key === "Enter" && isOpen && query) handleSearch();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, query, handleSearch]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSidebarClick = (e: React.MouseEvent) => e.stopPropagation();

  // Category links for quick access
  const categoryLinks = [
    { name: "Watches", href: "/watches", icon: "⌚" },
    { name: "Accessories", href: "/accessories", icon: "📱" },
    { name: "Automotive", href: "/automotive", icon: "🚗" },
    { name: "Home Decor", href: "/home-decor", icon: "🏠" },
  ];

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
        <div className="ss-deco-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

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

        <div className="ss-content">
          {showResults && query && (
            <div className="ss-results">
              {loading ? (
                <div className="ss-loading">
                  <div className="ss-loading-spinner" />
                  <p>Searching products...</p>
                </div>
              ) : results.length > 0 ? (
                <>
                  <p className="ss-results-label">
                    Found <em>{results.length}</em> result
                    {results.length !== 1 ? "s" : ""} for "{query}"
                  </p>
                  <div className="ss-results-list">
                    {results.map((product) => (
                      <button
                        key={product.id}
                        className="ss-result-item"
                        onClick={() =>
                          handleResultClick(product.id, product.name)
                        }
                      >
                        <div className="ss-result-img">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} />
                          ) : (
                            <div className="ss-result-placeholder">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                              >
                                <rect
                                  x="3"
                                  y="3"
                                  width="18"
                                  height="18"
                                  rx="2"
                                />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ss-result-info">
                          {product.brand && (
                            <span className="ss-result-brand">
                              {product.brand}
                            </span>
                          )}
                          <span className="ss-result-name">{product.name}</span>
                          <span className="ss-result-category">
                            {product.subcategory || product.category}
                          </span>
                          <span className="ss-result-price">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <span className="ss-result-arrow">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path d="M9 18l6-6-6-6" strokeLinecap="round" />
                          </svg>
                        </span>
                      </button>
                    ))}
                  </div>
                  <button className="ss-view-all" onClick={handleSearch}>
                    View all results for "{query}"
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="ss-no-results">
                  <div className="ss-no-results-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                  </div>
                  <p>No products found for "{query}"</p>
                  <p className="ss-no-results-sub">Try different keywords</p>
                </div>
              )}
            </div>
          )}

          {!showResults && (
            <>
              <div className="ss-section">
                <p className="ss-section-label">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    width="14"
                    height="14"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  Trending
                </p>
                <div className="ss-tags">
                  {trendingSearches.map((tag) => (
                    <button
                      key={tag}
                      className="ss-tag"
                      onClick={() => handleQuickSearch(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {recentSearches.length > 0 && (
                <div className="ss-section">
                  <div className="ss-section-header">
                    <p className="ss-section-label">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        width="14"
                        height="14"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Recent
                    </p>
                    <button
                      className="ss-clear-recent"
                      onClick={clearRecentSearches}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="ss-recent-list">
                    {recentSearches.map((item) => (
                      <button
                        key={item}
                        className="ss-recent-btn"
                        onClick={() => handleQuickSearch(item)}
                      >
                        <span className="ss-recent-icon">
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
                        <span className="ss-recent-arrow">
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
                    ))}
                  </div>
                </div>
              )}

              {trendingProducts.length > 0 && (
                <div className="ss-section">
                  <p className="ss-section-label">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      width="14"
                      height="14"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Featured Products
                  </p>
                  <div className="ss-featured-list">
                    {trendingProducts.map((product) => (
                      <button
                        key={product.id}
                        className="ss-featured-item"
                        onClick={() =>
                          handleResultClick(product.id, product.name)
                        }
                      >
                        <div className="ss-featured-img">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} />
                          ) : (
                            <div className="ss-featured-placeholder">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                              >
                                <rect
                                  x="3"
                                  y="3"
                                  width="18"
                                  height="18"
                                  rx="2"
                                />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ss-featured-info">
                          <span className="ss-featured-name">
                            {product.name}
                          </span>
                          <span className="ss-featured-price">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="ss-section">
                <p className="ss-section-label">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    width="14"
                    height="14"
                  >
                    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                  Categories
                </p>
                <div className="ss-quick-links">
                  {categoryLinks.map((cat) => (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      className="ss-quick-card"
                      onClick={onClose}
                    >
                      <span className="ss-quick-icon">{cat.icon}</span>
                      <span>{cat.name}</span>
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
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="ss-footer">
          <p>
            Press <kbd>ESC</kbd> to close · <kbd>↵</kbd> to search
          </p>
        </div>
      </div>
    </>
  );
}
