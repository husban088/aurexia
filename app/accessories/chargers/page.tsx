"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import "@/app/styles/store.css";

/* ── Types ── */
interface Product {
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
  specs?: string[];
  wattage?: number;
}

/* ── Chargers Data ── */
const CHARGERS: Product[] = [
  {
    id: "c1",
    name: "GaN Voyager 140W",
    brand: "Aurexia",
    price: 5499,
    originalPrice: 6299,
    rating: 5,
    reviews: 214,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 18,
    wattage: 140,
    specs: ["4 Ports", "GaN III", "Foldable Pins", "USB-C + USB-A"],
  },
  {
    id: "c2",
    name: "MagSafe Wireless Pad Pro",
    brand: "LuxCharge",
    price: 3999,
    rating: 4,
    reviews: 87,
    badge: "new",
    badgeLabel: "New",
    inStock: 34,
    wattage: 15,
    specs: ["Qi2 Certified", "15W MagSafe", "Glass Surface", "LED Indicator"],
  },
  {
    id: "c3",
    name: "Titanium Braided Cable 2m",
    brand: "Aurexia",
    price: 2499,
    originalPrice: 3299,
    rating: 5,
    reviews: 128,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 60,
    specs: ["USB-C to USB-C", "240W PD", "10Gbps Data", "Titanium Braid"],
  },
  {
    id: "c4",
    name: "DualCore 65W Desk Charger",
    brand: "PowerLux",
    price: 4299,
    rating: 4,
    reviews: 55,
    inStock: 22,
    wattage: 65,
    specs: ["2x USB-C", "65W Total", "Compact Design", "Smart IC"],
  },
  {
    id: "c5",
    name: "Solar Flex Charger 25W",
    brand: "EcoLux",
    price: 6799,
    originalPrice: 7999,
    rating: 4,
    reviews: 41,
    badge: "new",
    badgeLabel: "New",
    inStock: 9,
    wattage: 25,
    specs: ["Solar + USB-C", "25W PD", "Foldable", "IPX4 Water-Resist"],
  },
  {
    id: "c6",
    name: "Obsidian 30K Power Bank",
    brand: "Aurexia",
    price: 7999,
    originalPrice: 9499,
    rating: 5,
    reviews: 176,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 15,
    specs: ["30,000mAh", "140W PD", "Matte Obsidian", "USB-C × 2"],
  },
  {
    id: "c7",
    name: "Nano 20W Wall Adapter",
    brand: "Aurexia",
    price: 1299,
    rating: 5,
    reviews: 302,
    inStock: 120,
    wattage: 20,
    specs: [
      "20W USB-C PD",
      "Ultra Compact",
      "Universal Voltage",
      "White/Black",
    ],
  },
  {
    id: "c8",
    name: "Phantom 100W Car Charger",
    brand: "CarLux",
    price: 3499,
    originalPrice: 4199,
    rating: 4,
    reviews: 68,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 28,
    wattage: 100,
    specs: ["100W PD", "USB-C + USB-A", "OLED Watt Display", "12/24V"],
  },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const CAT_LINKS = [
  { href: "/mobile-accessories", label: "All Accessories", icon: "📱" },
  {
    href: "/mobile-accessories/chargers",
    label: "Chargers & Cables",
    icon: "⚡",
    active: true,
  },
  { href: "/mobile-accessories/cases", label: "Cases & Covers", icon: "🛡️" },
  { href: "/mobile-accessories/audio", label: "Audio", icon: "🎧" },
  { href: "/mobile-accessories/mounts", label: "Mounts & Stands", icon: "🔧" },
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

/* ── Card Placeholder SVG ── */
function ChargePlaceholder() {
  return (
    <div className="st-card-img-placeholder">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    </div>
  );
}

/* ── Main Page ── */
export default function ChargersPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");

  const filtered = useMemo(() => {
    let list = [...CHARGERS];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
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
                {cat.href.includes("chargers") ? (
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                ) : cat.href.includes("cases") ? (
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                ) : cat.href.includes("audio") ? (
                  <path d="M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
                ) : cat.href.includes("mounts") ? (
                  <circle cx="12" cy="12" r="10" />
                ) : (
                  <>
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <line
                      x1="12"
                      y1="18"
                      x2="12"
                      y2="18.01"
                      strokeLinecap="round"
                    />
                  </>
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
          Mobile Accessories
        </p>
        <h1 className="st-hero-title">
          Chargers <em>&amp; Cables</em>
        </h1>
        <p className="st-hero-sub">
          From ultra-compact GaN adapters to wireless charging pads — power your
          devices with precision and style.
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
              placeholder="Search chargers, cables, power banks..."
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
            <em>{filtered.length}</em> Products
          </span>
        </div>

        {/* Section Label */}
        <div className="st-section-label">
          <h2 className="st-section-title">
            Power <em>Essentials</em>
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
            <h3 className="st-empty-title">No products found</h3>
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
                    <ChargePlaceholder />

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
                      {product.wattage && (
                        <span className="st-badge st-badge--cat">
                          {product.wattage}W
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

                    {/* Specs */}
                    {product.specs && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.3rem",
                          marginTop: "0.4rem",
                        }}
                      >
                        {product.specs.map((spec) => (
                          <span
                            key={spec}
                            style={{
                              fontFamily: "var(--st-sans)",
                              fontSize: "0.48rem",
                              fontWeight: 300,
                              letterSpacing: "0.1em",
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
