"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
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
  compatibility?: string[];
  material?: string;
  colors?: string[];
  protection?: string;
}

/* ── Covers & Cases Data ── */
const COVERS: Product[] = [
  {
    id: "cover1",
    name: "Luxury Leather Flip Case",
    brand: "Aurexia",
    price: 3499,
    originalPrice: 4999,
    rating: 5,
    reviews: 342,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 45,
    material: "Genuine Leather",
    compatibility: ["iPhone 15 Pro", "iPhone 15 Pro Max", "Samsung S24 Ultra"],
    colors: ["Black", "Brown", "Tan", "Burgundy"],
    protection: "Full body protection with card slots",
  },
  {
    id: "cover2",
    name: "Carbon Fiber Armor Case",
    brand: "Aurexia",
    price: 2899,
    originalPrice: 3999,
    rating: 5,
    reviews: 178,
    badge: "new",
    badgeLabel: "New",
    inStock: 28,
    material: "Carbon Fiber + TPU",
    compatibility: ["iPhone 15 Pro", "iPhone 15 Pro Max", "Samsung S24 Ultra", "Google Pixel 8 Pro"],
    colors: ["Matte Black", "Forge Grey"],
    protection: "Military grade drop protection (MIL-STD-810G)",
  },
  {
    id: "cover3",
    name: "Clear MagSafe Case",
    brand: "LuxGuard",
    price: 1999,
    originalPrice: 2799,
    rating: 4,
    reviews: 267,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 89,
    material: "Polycarbonate + TPU",
    compatibility: ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max"],
    colors: ["Crystal Clear", "Matte Clear"],
    protection: "UV resistant, Anti-yellowing technology",
  },
  {
    id: "cover4",
    name: "Vegan Leather Wallet Case",
    brand: "EcoLux",
    price: 2499,
    rating: 4,
    reviews: 94,
    badge: "new",
    badgeLabel: "New",
    inStock: 52,
    material: "Vegan Leather (Cactus-based)",
    compatibility: ["iPhone 14", "iPhone 14 Pro", "iPhone 15", "iPhone 15 Pro"],
    colors: ["Forest Green", "Sand Beige", "Charcoal", "Terracotta"],
    protection: "3 card slots + detachable wrist strap",
  },
  {
    id: "cover5",
    name: "Ultra-Thin Aramid Case",
    brand: "Aurexia",
    price: 3999,
    originalPrice: 5499,
    rating: 5,
    reviews: 86,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 18,
    material: "Aramid Fiber (Kevlar)",
    compatibility: ["iPhone 15 Pro Max", "Samsung S24 Ultra", "Pixel 8 Pro"],
    colors: ["Black/Gold weave"],
    protection: "0.6mm thickness, 3x stronger than steel",
  },
  {
    id: "cover6",
    name: "Kiddie Defender Case",
    brand: "SafeGuard",
    price: 1499,
    originalPrice: 1999,
    rating: 4,
    reviews: 203,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 112,
    material: "Silicone + EVA foam",
    compatibility: ["iPhone 12-15 Series", "Samsung A Series", "Pixel 7/8"],
    colors: ["Blue/Cyan", "Pink/Purple", "Neon Green", "Black"],
    protection: "Shockproof, Drop-proof up to 8ft",
  },
  {
    id: "cover7",
    name: "Marble Luxury Case",
    brand: "LuxArt",
    price: 2299,
    rating: 4,
    reviews: 67,
    inStock: 34,
    material: "Hard PC + Soft TPU",
    compatibility: ["iPhone 15 Pro", "iPhone 15 Pro Max", "iPhone 14 Pro"],
    colors: ["White Marble", "Black Marble", "Rose Gold Marble", "Green Marble"],
    protection: "Premium engraved finish",
  },
  {
    id: "cover8",
    name: "Rugged Adventure Case",
    brand: "ArmorX",
    price: 3499,
    originalPrice: 4499,
    rating: 5,
    reviews: 156,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 42,
    material: "Polycarbonate + Rubber",
    compatibility: ["iPhone 15 Pro Max", "Samsung S24 Ultra", "Pixel 8 Pro"],
    colors: ["Od Green", "Desert Tan", "Black", "Coyote Brown"],
    protection: "IP68 rated, Built-in kickstand",
  },
  {
    id: "cover9",
    name: "Slim Silicone Case",
    brand: "Aurexia",
    price: 1299,
    rating: 4,
    reviews: 312,
    inStock: 156,
    material: "Liquid Silicone",
    compatibility: ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max"],
    colors: ["Midnight", "Starlight", "Product Red", "Deep Purple", "Pacific Blue"],
    protection: "Microfiber lining, Soft-touch finish",
  },
  {
    id: "cover10",
    name: "Wooden Eco Case",
    brand: "EarthLux",
    price: 2999,
    originalPrice: 3999,
    rating: 5,
    reviews: 45,
    badge: "new",
    badgeLabel: "New",
    inStock: 22,
    material: "Bamboo + Recycled Plastic",
    compatibility: ["iPhone 15 Pro", "iPhone 15 Pro Max", "Samsung S24 Ultra"],
    colors: ["Natural Bamboo", "Dark Walnut", "Cherry Wood"],
    protection: "Biodegradable, Carbon negative",
  },
  {
    id: "cover11",
    name: "Glitter Sparkle Case",
    brand: "GlamLux",
    price: 1699,
    rating: 4,
    reviews: 98,
    inStock: 67,
    material: "Hard PC with glitter encapsulation",
    compatibility: ["iPhone 14", "iPhone 14 Pro", "iPhone 15", "iPhone 15 Pro"],
    colors: ["Galaxy Sparkle", "Rose Gold Glitter", "Midnight Stars", "Rainbow"],
    protection: "Scratch-resistant, Raised camera bezel",
  },
  {
    id: "cover12",
    name: "Premium Aluminum Bumper",
    brand: "Aurexia",
    price: 4499,
    originalPrice: 5999,
    rating: 5,
    reviews: 112,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 15,
    material: "Aerospace Aluminum + TPU",
    compatibility: ["iPhone 15 Pro Max", "Samsung S24 Ultra"],
    colors: ["Space Gray", "Silver", "Gold", "Midnight Blue"],
    protection: "Precision CNC machined, Screwless assembly",
  },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const CAT_LINKS = [
  { href: "/accessories", label: "All Accessories", icon: "📱" },
  { href: "/accessories/chargers", label: "Chargers", icon: "⚡" },
  { href: "/accessories/cables", label: "Cables", icon: "🔌" },
  { href: "/accessories/covers", label: "Covers & Cases", icon: "🛡️", active: true },
  { href: "/accessories/screen-protectors", label: "Screen Guards", icon: "🛡️" },
  { href: "/accessories/earbuds", label: "Earbuds", icon: "🎧" },
  { href: "/accessories/power-banks", label: "Power Banks", icon: "🔋" },
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
function CoverPlaceholder() {
  return (
    <div className="st-card-img-placeholder">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" strokeLinecap="round" />
        <rect x="8" y="5" width="8" height="10" rx="1" />
      </svg>
    </div>
  );
}

/* ── Main Page ── */
export default function CoversPage() {
  const { addToCart } = useCartStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  const filtered = useMemo(() => {
    let list = [...COVERS];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.material?.toLowerCase().includes(q) ||
          p.compatibility?.some((c) => c.toLowerCase().includes(q)) ||
          p.colors?.some((c) => c.toLowerCase().includes(q))
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

  const handleAddToCart = (product: Product) => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: `${product.brand} ${product.material || "Case"} - Compatible with ${product.compatibility?.[0] || "Multiple Devices"}`,
      price: product.price,
      original_price: product.originalPrice,
      category: "Accessories",
      subcategory: "Covers",
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
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
              <span className="st-cat-icon">{cat.icon}</span>
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
          Phone <em>Covers & Cases</em>
        </h1>
        <p className="st-hero-sub">
          Premium protection for your device — from ultra-slim silicone to rugged armor cases.
          Discover style and durability in perfect harmony.
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
              placeholder="Search cases by brand, material, phone model..."
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
            <em>{filtered.length}</em> Cases
          </span>
        </div>

        {/* Section Label */}
        <div className="st-section-label">
          <h2 className="st-section-title">
            Protection <em>Essentials</em>
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
            <h3 className="st-empty-title">No cases found</h3>
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
                    <CoverPlaceholder />

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
                      {product.material && (
                        <span className="st-badge st-badge--cat">
                          {product.material}
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

                    {/* Material and Colors */}
                    <div className="st-card-meta">
                      {product.material && (
                        <span className="st-card-material">{product.material}</span>
                      )}
                      {product.colors && product.colors.length > 0 && (
                        <div className="st-card-colors">
                          {product.colors.slice(0, 3).map((color) => (
                            <span
                              key={color}
                              className="st-card-color-dot"
                              style={{ backgroundColor: getColorCode(color) }}
                              title={color}
                            />
                          ))}
                          {product.colors.length > 3 && (
                            <span className="st-card-color-more">
                              +{product.colors.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Compatibility */}
                    {product.compatibility && (
                      <div className="st-card-compatibility">
                        <span className="st-card-comp-label">Compatible:</span>
                        <span className="st-card-comp-value">
                          {product.compatibility.slice(0, 2).join(", ")}
                          {product.compatibility.length > 2 && "..."}
                        </span>
                      </div>
                    )}

                    {/* Protection */}
                    {product.protection && (
                      <div className="st-card-protection">
                        <span>{product.protection}</span>
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
        .st-card-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
          margin: 0.3rem 0 0.5rem;
        }
        .st-card-material {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.55rem;
          font-weight: 400;
          letter-spacing: 0.05em;
          color: var(--st-gold, #b8963e);
          background: rgba(184, 150, 62, 0.1);
          padding: 0.2rem 0.5rem;
          border-radius: 1px;
        }
        .st-card-colors {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .st-card-color-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.2s ease;
        }
        .st-card-color-dot:hover {
          transform: scale(1.2);
        }
        .st-card-color-more {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.55rem;
          color: rgba(245, 240, 232, 0.4);
        }
        .st-card-compatibility {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin: 0.3rem 0;
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.52rem;
          letter-spacing: 0.05em;
        }
        .st-card-comp-label {
          color: rgba(245, 240, 232, 0.3);
        }
        .st-card-comp-value {
          color: rgba(245, 240, 232, 0.5);
        }
        .st-card-protection {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.52rem;
          letter-spacing: 0.05em;
          color: rgba(184, 150, 62, 0.7);
          margin: 0.3rem 0;
          padding: 0.2rem 0;
          border-top: 1px solid rgba(184, 150, 62, 0.1);
          border-bottom: 1px solid rgba(184, 150, 62, 0.1);
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
        .st-cat-icon {
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

// Helper function for color dots
function getColorCode(color: string): string {
  const colorMap: Record<string, string> = {
    "Black": "#1a1a1a",
    "Brown": "#8B4513",
    "Tan": "#D2B48C",
    "Burgundy": "#800020",
    "Matte Black": "#2a2a2a",
    "Forge Grey": "#696969",
    "Crystal Clear": "#E8E8E8",
    "Matte Clear": "#D0D0D0",
    "Forest Green": "#228B22",
    "Sand Beige": "#F5DEB3",
    "Charcoal": "#36454F",
    "Terracotta": "#E2725B",
    "Black/Gold weave": "#1a1a1a",
    "Blue/Cyan": "#0080FF",
    "Pink/Purple": "#FF69B4",
    "Neon Green": "#39FF14",
    "White Marble": "#F5F5F5",
    "Black Marble": "#2a2a2a",
    "Rose Gold Marble": "#B76E79",
    "Green Marble": "#4CAF50",
    "Od Green": "#4B5320",
    "Desert Tan": "#C2B280",
    "Coyote Brown": "#81613C",
    "Midnight": "#0a0a2a",
    "Starlight": "#F5F5DC",
    "Product Red": "#FF3B30",
    "Deep Purple": "#4B0082",
    "Pacific Blue": "#005C8A",
    "Natural Bamboo": "#E6C280",
    "Dark Walnut": "#5C4033",
    "Cherry Wood": "#DEB887",
    "Galaxy Sparkle": "#2a2a3a",
    "Rose Gold Glitter": "#B76E79",
    "Midnight Stars": "#0a0a3a",
    "Rainbow": "linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)",
    "Space Gray": "#4A4A4A",
    "Silver": "#C0C0C0",
    "Gold": "#FFD700",
    "Midnight Blue": "#191970",
  };
  return colorMap[color] || "#b8963e";
}