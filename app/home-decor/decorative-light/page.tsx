"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import "@/app/styles/store.css";

/* ── Types ── */
interface LightProduct {
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
  type?: string;
  length?: string;
  color?: string;
  features?: string[];
  wattage?: number;
  brightness?: string;
  waterproof?: string;
  material?: string;
}

/* ── Decorative Lights Data ── */
const DECORATIVE_LIGHTS: LightProduct[] = [
  {
    id: "dl1",
    name: "LED Strip Lights 5m",
    brand: "Aurexia",
    price: 3499,
    originalPrice: 4999,
    rating: 5,
    reviews: 342,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 45,
    type: "LED Strip",
    length: "5m",
    color: "RGBIC",
    features: [
      "16M Colors",
      "Music Sync",
      "App Control",
      "Smart Home Compatible",
    ],
    wattage: 24,
    brightness: "2000lm",
  },
  {
    id: "dl2",
    name: "Smart Star Projector",
    brand: "Aurexia",
    price: 7999,
    originalPrice: 10999,
    rating: 5,
    reviews: 178,
    badge: "new",
    badgeLabel: "New",
    inStock: 28,
    type: "Projector",
    features: [
      "Galaxy Projection",
      "Bluetooth Speaker",
      "Timing Function",
      "Remote Control",
    ],
    color: "White/Silver",
    wattage: 15,
    brightness: "500lm",
  },
  {
    id: "dl3",
    name: "Fairy String Lights",
    brand: "Aurexia",
    price: 1299,
    originalPrice: 1999,
    rating: 4,
    reviews: 567,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 120,
    type: "String Lights",
    length: "10m",
    color: "Warm White",
    features: ["Waterproof IP65", "8 Modes", "Battery/USB Powered", "Timer"],
    waterproof: "IP65",
    wattage: 5,
  },
  {
    id: "dl4",
    name: "Neon LED Sign",
    brand: "NeonLux",
    price: 5499,
    originalPrice: 7499,
    rating: 4,
    reviews: 94,
    badge: "new",
    badgeLabel: "New",
    inStock: 32,
    type: "Neon Sign",
    color: "Pink",
    features: [
      "Customizable Text",
      "Dimmable",
      "Wall Mountable",
      "USB Powered",
    ],
    wattage: 12,
  },
  {
    id: "dl5",
    name: "Smart Bulb Kit",
    brand: "Aurexia",
    price: 2999,
    originalPrice: 3999,
    rating: 4,
    reviews: 234,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 78,
    type: "Smart Bulb",
    color: "RGB+Warm White",
    features: ["WiFi Control", "Schedule", "Voice Control", "Dimmable"],
    wattage: 9,
    brightness: "800lm",
  },
  {
    id: "dl6",
    name: "Lava Lamp Retro",
    brand: "RetroLux",
    price: 4499,
    originalPrice: 5999,
    rating: 5,
    reviews: 89,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 22,
    type: "Lava Lamp",
    color: "Blue/Green",
    features: ["Hypnotic Flow", "Retro Design", "Aluminum Base"],
    wattage: 40,
  },
  {
    id: "dl7",
    name: "Curtain String Lights",
    brand: "LightLux",
    price: 2499,
    originalPrice: 3499,
    rating: 4,
    reviews: 203,
    inStock: 55,
    type: "Curtain Lights",
    length: "3m x 3m",
    color: "Warm White",
    features: ["Waterproof", "8 Lighting Modes", "Timer", "Remote Control"],
    waterproof: "IP44",
    wattage: 8,
  },
  {
    id: "dl8",
    name: "LED Floor Lamp",
    brand: "Aurexia",
    price: 8999,
    originalPrice: 12999,
    rating: 5,
    reviews: 112,
    badge: "new",
    badgeLabel: "New",
    inStock: 18,
    type: "Floor Lamp",
    color: "Black/Gold",
    features: ["Dimmable", "Touch Control", "RGB Colors", "Modern Design"],
    wattage: 36,
    brightness: "1500lm",
    material: "Aluminum + Glass",
  },
  {
    id: "dl9",
    name: "Flameless Candles Set",
    brand: "CandleLux",
    price: 3499,
    originalPrice: 4999,
    rating: 4,
    reviews: 156,
    inStock: 62,
    type: "Flameless Candle",
    color: "Ivory",
    features: [
      "Remote Control",
      "Timer Function",
      "Flickering Effect",
      "Battery Operated",
    ],
    waterproof: "Water Resistant",
  },
  {
    id: "dl10",
    name: "Galaxy Night Light",
    brand: "NebulaLux",
    price: 2999,
    originalPrice: 3999,
    rating: 5,
    reviews: 345,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 88,
    type: "Night Light",
    color: "Multi-color",
    features: ["Touch Control", "16 Colors", "USB Rechargeable", "Portable"],
    wattage: 3,
    brightness: "100lm",
  },
  {
    id: "dl11",
    name: "Outdoor Solar Lights",
    brand: "SolarLux",
    price: 3999,
    originalPrice: 5999,
    rating: 4,
    reviews: 278,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 45,
    type: "Solar Lights",
    length: "4 Pack",
    color: "Warm White",
    features: [
      "Solar Powered",
      "Auto On/Off",
      "Waterproof IP67",
      "8-10 Hours Runtime",
    ],
    waterproof: "IP67",
  },
  {
    id: "dl12",
    name: "RGB Corner Lamp",
    brand: "Aurexia",
    price: 6499,
    originalPrice: 8499,
    rating: 4,
    reviews: 67,
    badge: "new",
    badgeLabel: "New",
    inStock: 25,
    type: "Corner Lamp",
    color: "RGB",
    features: ["App Control", "Music Sync", "Space-saving Design", "Dimmable"],
    wattage: 24,
    material: "Aluminum",
  },
  {
    id: "dl13",
    name: "Fireworks String Lights",
    brand: "PartyLux",
    price: 1899,
    originalPrice: 2699,
    rating: 4,
    reviews: 189,
    inStock: 92,
    type: "String Lights",
    length: "20m",
    color: "Multi-color",
    features: [
      "Waterproof",
      "8 Modes",
      "Remote Control",
      "Wedding/Party Decor",
    ],
    waterproof: "IP44",
  },
  {
    id: "dl14",
    name: "Smart LED Strip 10m",
    brand: "Aurexia",
    price: 6499,
    originalPrice: 8999,
    rating: 5,
    reviews: 234,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 38,
    type: "LED Strip",
    length: "10m",
    color: "RGBIC",
    features: [
      "Voice Control",
      "Music Sync",
      "Cuttable",
      "Smart Home Integration",
    ],
    wattage: 48,
    brightness: "4000lm",
  },
  {
    id: "dl15",
    name: "Crystal Chandelier Light",
    brand: "LuxuryLux",
    price: 24999,
    originalPrice: 34999,
    rating: 5,
    reviews: 45,
    badge: "new",
    badgeLabel: "New",
    inStock: 8,
    type: "Chandelier",
    color: "Gold/Crystal",
    features: [
      "Crystal Glass",
      "Dimmable",
      "Remote Controlled",
      "Energy Saving LED",
    ],
    wattage: 60,
    material: "K9 Crystal + Metal",
  },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const CAT_LINKS = [
  { href: "/home-decor", label: "All Décor" },
  {
    href: "/home-decor/decorative-lights",
    label: "Decorative Lights",
    active: true,
  },
  { href: "/home-decor/wall-items", label: "Wall Items" },
  { href: "/home-decor/home-accessories", label: "Home Accessories" },
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
function LightPlaceholder() {
  return (
    <div className="st-card-img-placeholder">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
      </svg>
    </div>
  );
}

/* ── Main Page ── */
export default function DecorativeLightsPage() {
  const { addToCart } = useCartStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({
    show: false,
    msg: "",
  });

  const filtered = useMemo(() => {
    let list = [...DECORATIVE_LIGHTS];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.type?.toLowerCase().includes(q) ||
          p.features?.some((f) => f.toLowerCase().includes(q))
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
      default:
        break;
    }
    return list;
  }, [search, sort]);

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2000);
  };

  const handleAddToCart = (product: LightProduct) => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: `${product.brand} ${product.type || "Decorative Light"}`,
      price: product.price,
      original_price: product.originalPrice,
      category: "Home Decor",
      subcategory: "Decorative Lights",
      images: [],
      stock: product.inStock,
      brand: product.brand,
      condition: "new",
      is_featured: false,
      is_active: true,
      specs: {},
    };
    addToCart(cartProduct);
    showToast(`${product.name} added to cart`);
  };

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

      {/* Toast Notification */}
      {toast.show && (
        <div className="st-toast">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline
              points="20 6 9 17 4 12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {toast.msg}
        </div>
      )}

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
                {cat.href.includes("decorative-lights") ? (
                  <>
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                  </>
                ) : cat.href.includes("wall-items") ? (
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                ) : (
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
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
          Home Décor
        </p>
        <h1 className="st-hero-title">
          Decorative <em>Lights</em>
        </h1>
        <p className="st-hero-sub">
          Illuminate your space with our stunning collection of decorative
          lighting — from LED strips and fairy lights to smart bulbs and elegant
          chandeliers.
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
              placeholder="Search lights by type, color, feature..."
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
            <em>{filtered.length}</em> Lights
          </span>
        </div>

        {/* Section Label */}
        <div className="st-section-label">
          <h2 className="st-section-title">
            Illuminate <em>Your Space</em>
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
            <h3 className="st-empty-title">No lights found</h3>
            <p className="st-empty-sub">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="st-grid">
            {filtered.map((product, index) => {
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
                <article
                  key={product.id}
                  className="st-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Image */}
                  <div className="st-card-img">
                    <LightPlaceholder />

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
                      {product.type && (
                        <span className="st-badge st-badge--cat">
                          {product.type}
                        </span>
                      )}
                      {product.waterproof && (
                        <span className="st-badge st-badge--water">
                          {product.waterproof}
                        </span>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="st-card-quick">
                      <button
                        className="st-quick-btn"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.inStock === 0}
                      >
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
                        {product.inStock === 0 ? "Out of Stock" : "Add to Cart"}
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

                    {/* Type & Color */}
                    <div className="st-card-specs-row">
                      {product.type && (
                        <span className="st-card-type">{product.type}</span>
                      )}
                      {product.color && (
                        <span className="st-card-color">
                          🎨 {product.color}
                        </span>
                      )}
                    </div>

                    {/* Length */}
                    {product.length && (
                      <div className="st-card-length">
                        <span>📏 Length: {product.length}</span>
                      </div>
                    )}

                    {/* Features */}
                    {product.features && (
                      <div className="st-card-features">
                        {product.features.slice(0, 3).map((feature) => (
                          <span key={feature} className="st-card-feature">
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Wattage & Brightness */}
                    <div className="st-card-power">
                      {product.wattage && (
                        <span className="st-card-wattage">
                          ⚡ {product.wattage}W
                        </span>
                      )}
                      {product.brightness && (
                        <span className="st-card-brightness">
                          💡 {product.brightness}
                        </span>
                      )}
                    </div>

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
                    <div className="st-card-rating">
                      <Stars rating={product.rating} />
                      <span className="st-card-reviews">
                        ({product.reviews} reviews)
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

      <style jsx>{`
        .st-card-specs-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.3rem 0;
          flex-wrap: wrap;
        }
        .st-card-type {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.55rem;
          font-weight: 400;
          letter-spacing: 0.05em;
          color: rgba(184, 150, 62, 0.8);
          background: rgba(184, 150, 62, 0.1);
          padding: 0.2rem 0.5rem;
          border-radius: 1px;
        }
        .st-card-color {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.55rem;
          font-weight: 300;
          letter-spacing: 0.05em;
          color: rgba(245, 240, 232, 0.5);
        }
        .st-card-length {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.55rem;
          font-weight: 400;
          letter-spacing: 0.05em;
          color: rgba(184, 150, 62, 0.7);
          margin: 0.3rem 0;
        }
        .st-card-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin: 0.3rem 0 0.5rem;
        }
        .st-card-feature {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.46rem;
          font-weight: 300;
          letter-spacing: 0.08em;
          color: rgba(245, 240, 232, 0.35);
          padding: 0.15rem 0.4rem;
          border: 1px solid rgba(184, 150, 62, 0.12);
          border-radius: 1px;
        }
        .st-card-power {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.3rem 0;
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.52rem;
          letter-spacing: 0.05em;
          flex-wrap: wrap;
        }
        .st-card-wattage {
          color: rgba(184, 150, 62, 0.7);
        }
        .st-card-brightness {
          color: rgba(245, 240, 232, 0.5);
        }
        .st-card-rating {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-top: 0.5rem;
        }
        .st-card-reviews {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.5rem;
          color: rgba(245, 240, 232, 0.3);
          letter-spacing: 0.08em;
        }
        .st-toast {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(184, 150, 62, 0.95);
          color: #0a0a0a;
          padding: 0.75rem 1.5rem;
          border-radius: 2px;
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          z-index: 1000;
          animation: slideUp 0.3s ease;
        }
        .st-toast svg {
          width: 16px;
          height: 16px;
        }
        .st-badge--water {
          background: rgba(80, 180, 200, 0.15);
          color: #50b4c8;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
