"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import "../../styles/store.css";

/* ── Types ── */
interface SmartWatch {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  badge?: "new" | "sale" | "featured";
  badgeLabel?: string;
  inStock: number;
  display?: string;
  battery?: string;
  specs?: string[];
  color?: string;
}

/* ── Smart Watches Data ── */
const SMART_WATCHES: SmartWatch[] = [
  {
    id: "sw1",
    name: "Nexus Pro Ultra",
    brand: "Aurexia",
    price: 24999,
    originalPrice: 29999,
    rating: 5,
    reviews: 342,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 12,
    display: '1.99" AMOLED',
    battery: "14 Days",
    color: "Midnight Black",
    specs: ["GPS + GLONASS", "Blood O₂", "ECG Monitor", "IP68 Water-Resist"],
  },
  {
    id: "sw2",
    name: "Aurexia Lumière S7",
    brand: "Aurexia",
    price: 34999,
    rating: 5,
    reviews: 178,
    badge: "new",
    badgeLabel: "New",
    inStock: 8,
    display: '2.01" LTPO OLED',
    battery: "7 Days",
    color: "Champagne Gold",
    specs: ["Sapphire Glass", "Titanium Case", "eSIM", "NFC Payments"],
  },
  {
    id: "sw3",
    name: "VitaTrack Pro 5",
    brand: "VitaLux",
    price: 15499,
    originalPrice: 18999,
    rating: 4,
    reviews: 94,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 25,
    display: '1.85" TFT',
    battery: "21 Days",
    color: "Graphite",
    specs: ["Stress Monitor", "Sleep Tracking", "SpO2", "100+ Sports"],
  },
  {
    id: "sw4",
    name: "Halo Ring Sport Watch",
    brand: "RingTech",
    price: 19999,
    rating: 4,
    reviews: 67,
    badge: "new",
    badgeLabel: "New",
    inStock: 19,
    display: '1.78" AMOLED',
    battery: "10 Days",
    color: "Rose Gold",
    specs: ["Always-On Display", "NFC", "Voice Assistant", "Dual Band GPS"],
  },
  {
    id: "sw5",
    name: "Phantom GT Racing Watch",
    brand: "SpeedLux",
    price: 28999,
    originalPrice: 32999,
    rating: 5,
    reviews: 51,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 6,
    display: '1.96" AMOLED',
    battery: "5 Days",
    color: "Carbon Black",
    specs: ["Route Navigation", "VO2 Max", "Lap Timer", "Carbon Bezel"],
  },
  {
    id: "sw6",
    name: "Classic Heritage Watch",
    brand: "Aurexia",
    price: 44999,
    rating: 5,
    reviews: 29,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 4,
    display: '1.63" AMOLED',
    battery: "8 Days",
    color: "Silver & Ivory",
    specs: ["Italian Leather Band", "Sapphire Crystal", "Health Suite", "eSIM"],
  },
  {
    id: "sw7",
    name: "Kids Guardian Watch",
    brand: "SafeWatch",
    price: 5999,
    originalPrice: 7499,
    rating: 4,
    reviews: 112,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 40,
    display: '1.4" IPS',
    battery: "3 Days",
    color: "Sky Blue / Pink",
    specs: ["GPS Tracker", "SOS Button", "Geo-Fence", "Kid-Safe"],
  },
  {
    id: "sw8",
    name: "EcoSport Solar Watch",
    brand: "EcoLux",
    price: 12499,
    rating: 4,
    reviews: 83,
    badge: "new",
    badgeLabel: "New",
    inStock: 17,
    display: '1.52" MIP',
    battery: "Unlimited (Solar)",
    color: "Forest Green",
    specs: ["Solar Charging", "Altimeter", "Barometer", "MIL-STD-810"],
  },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const CAT_LINKS = [
  { href: "/gadgets", label: "All Gadgets" },
  { href: "/gadgets/smart-watches", label: "Smart Watches", active: true },
  { href: "/gadgets/earbuds", label: "Earbuds & Headphones" },
  { href: "/gadgets/power-banks", label: "Power Banks" },
  { href: "/gadgets/smart-home", label: "Smart Home" },
];

/* ── Star Rating ── */
function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill={s <= rating ? "#b8963e" : "none"}
          stroke="#b8963e"
          strokeWidth="1.5"
          style={{ opacity: s <= rating ? 1 : 0.25 }}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

/* ── Watch Placeholder ── */
function WatchPlaceholder() {
  return (
    <div className="st-card-img-placeholder">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
      >
        <rect x="5" y="7" width="14" height="13" rx="3" />
        <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M9 20v2a1 1 0 001 1h4a1 1 0 001-1v-2" />
        <circle cx="12" cy="13.5" r="2.5" />
        <line x1="12" y1="11" x2="12" y2="13.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ── Main Page ── */
export default function SmartWatchesPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");

  const filtered = useMemo(() => {
    let list = [...SMART_WATCHES];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.color?.toLowerCase().includes(q) ||
          p.specs?.some((s) => s.toLowerCase().includes(q))
      );
    }
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
        break;
    }
    return list;
  }, [search, sort]);

  return (
    <div className="st-root">
      {/* Ambient + Grain + Lines */}
      <div className="st-ambient" />
      <div className="st-grain" />
      <div className="st-lines">
        {[...Array(5)].map((_, i) => (
          <span key={i} />
        ))}
      </div>

      {/* ── Category Nav Bar ── */}
      <nav className="st-cat-bar">
        <div className="st-cat-inner">
          {CAT_LINKS.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`st-cat-btn${cat.active ? " active" : ""}`}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                {cat.href.includes("smart-watches") ? (
                  <>
                    <rect x="5" y="7" width="14" height="13" rx="3" />
                    <circle cx="12" cy="13.5" r="2" />
                  </>
                ) : cat.href.includes("earbuds") ? (
                  <path d="M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
                ) : cat.href.includes("power") ? (
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                ) : (
                  <circle cx="12" cy="12" r="3" />
                )}
              </svg>
              {cat.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="st-hero">
        <p className="st-eyebrow">
          <span className="st-ey-line" />
          Gadgets
        </p>
        <h1 className="st-hero-title">
          Smart <em>Watches</em>
        </h1>
        <p className="st-hero-sub">
          Where precision engineering meets luxury design — wearables that
          elevate every moment of your day.
        </p>

        {/* Decorative ring */}
        <div className="st-hero-ring">
          <div className="st-ring">
            <div className="st-ring-inner" />
            <div className="st-ring-dot" />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="st-main">
        {/* Toolbar */}
        <div className="st-toolbar">
          <div className="st-search-wrap">
            <svg
              className="st-search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="st-search"
              type="text"
              placeholder="Search smart watches by brand, color, feature..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="st-sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="st-count">
            <em>{filtered.length}</em> Watches
          </span>
        </div>

        {/* Section Label */}
        <div className="st-section-label">
          <h2 className="st-section-title">
            Wearable <em>Intelligence</em>
          </h2>
          <div className="st-section-line" />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="st-empty">
            <div className="st-empty-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="st-empty-title">No watches found</h3>
            <p className="st-empty-sub">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="st-grid">
            {filtered.map((product) => {
              const discount = product.originalPrice
                ? Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
                  )
                : null;
              const stockStatus =
                product.inStock === 0
                  ? "out"
                  : product.inStock <= 10
                  ? "low"
                  : "ok";

              return (
                <article key={product.id} className="st-card">
                  {/* Image */}
                  <div className="st-card-img">
                    <WatchPlaceholder />

                    {/* Badges */}
                    <div className="st-card-badges">
                      {product.badge && (
                        <span
                          className={`st-badge st-badge--${
                            product.badge === "featured"
                              ? "feat"
                              : product.badge === "new"
                              ? "new"
                              : "sale"
                          }`}
                        >
                          {product.badgeLabel}
                        </span>
                      )}
                      {product.display && (
                        <span className="st-badge st-badge--cat">
                          {product.display}
                        </span>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="st-card-quick">
                      <button className="st-quick-btn">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39A2 2 0 009.66 16h9.72a2 2 0 001.98-1.61L23 6H6" />
                        </svg>
                        Add to Cart
                      </button>
                      <button className="st-quick-btn st-quick-btn--ghost">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="st-card-body">
                    <p className="st-card-brand">{product.brand}</p>
                    <h3 className="st-card-name">{product.name}</h3>

                    {/* Color */}
                    {product.color && (
                      <p
                        style={{
                          fontFamily: "var(--st-sans)",
                          fontSize: "0.52rem",
                          fontWeight: 200,
                          letterSpacing: "0.1em",
                          color: "rgba(245,240,232,0.3)",
                          margin: "0.1rem 0 0",
                        }}
                      >
                        {product.color}
                      </p>
                    )}

                    {/* Battery */}
                    {product.battery && (
                      <p
                        style={{
                          fontFamily: "var(--st-sans)",
                          fontSize: "0.5rem",
                          fontWeight: 300,
                          letterSpacing: "0.12em",
                          color: "rgba(184,150,62,0.7)",
                          margin: "0.15rem 0 0",
                        }}
                      >
                        🔋 {product.battery} Battery
                      </p>
                    )}

                    {/* Specs */}
                    {product.specs && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.3rem",
                          marginTop: "0.5rem",
                        }}
                      >
                        {product.specs.map((spec) => (
                          <span
                            key={spec}
                            style={{
                              fontFamily: "var(--st-sans)",
                              fontSize: "0.46rem",
                              fontWeight: 300,
                              letterSpacing: "0.08em",
                              color: "rgba(245,240,232,0.35)",
                              padding: "0.15rem 0.4rem",
                              border: "1px solid rgba(184,150,62,0.12)",
                              borderRadius: "1px",
                            }}
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="st-card-price-row">
                      <span className="st-card-price">
                        PKR {product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && (
                        <span className="st-card-orig">
                          PKR {product.originalPrice.toLocaleString()}
                        </span>
                      )}
                      {discount && (
                        <span className="st-card-discount">-{discount}%</span>
                      )}
                    </div>

                    {/* Rating */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        marginTop: "0.2rem",
                      }}
                    >
                      <Stars rating={product.rating} />
                      <span
                        style={{
                          fontFamily: "var(--st-sans)",
                          fontSize: "0.5rem",
                          color: "rgba(245,240,232,0.3)",
                          letterSpacing: "0.08em",
                        }}
                      >
                        ({product.reviews})
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="st-card-foot">
                    <span
                      className={`st-card-stock${
                        stockStatus === "low"
                          ? " low"
                          : stockStatus === "out"
                          ? " out"
                          : ""
                      }`}
                    >
                      {stockStatus === "out"
                        ? "Out of Stock"
                        : stockStatus === "low"
                        ? `Only ${product.inStock} left`
                        : `In Stock (${product.inStock})`}
                    </span>
                  </div>

                  {/* Bottom line */}
                  <div className="st-card-line" />
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
