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
  length?: string;
  specs?: string[];
  type?: string;
}

/* ── Cables Data ── */
const CABLES: Product[] = [
  {
    id: "cable1",
    name: "Titanium Braided USB-C Cable",
    brand: "Aurexia",
    price: 2499,
    originalPrice: 3299,
    rating: 5,
    reviews: 342,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 120,
    length: "2m",
    type: "USB-C to USB-C",
    specs: ["240W PD", "10Gbps Data", "Titanium Braid", "LED Indicator"],
  },
  {
    id: "cable2",
    name: "Nylon Magnetic USB-C Cable",
    brand: "Aurexia",
    price: 1899,
    originalPrice: 2499,
    rating: 4,
    reviews: 128,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 85,
    length: "1.5m",
    type: "USB-C to USB-C",
    specs: ["Magnetic Tips", "100W PD", "Nylon Braided", "LED Charge Light"],
  },
  {
    id: "cable3",
    name: "Ultra-Flex Lightning Cable",
    brand: "LuxCharge",
    price: 1599,
    rating: 4,
    reviews: 67,
    badge: "new",
    badgeLabel: "New",
    inStock: 45,
    length: "1m",
    type: "Lightning",
    specs: ["MFi Certified", "Flexible Silicone", "2.4A Fast Charging"],
  },
  {
    id: "cable4",
    name: "Kevalar Armor USB-C 3m",
    brand: "ArmorLink",
    price: 2999,
    originalPrice: 3999,
    rating: 5,
    reviews: 94,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 32,
    length: "3m",
    type: "USB-C to USB-C",
    specs: ["Kevalar Fiber", "20Gbps Data", "240W PD", "Lifetime Warranty"],
  },
  {
    id: "cable5",
    name: "Retractable USB-C Cable",
    brand: "TravelLux",
    price: 1299,
    rating: 4,
    reviews: 56,
    badge: "new",
    badgeLabel: "New",
    inStock: 78,
    length: "1.2m",
    type: "USB-C to USB-C",
    specs: ["Retractable", "60W PD", "Compact Design", "Travel Case"],
  },
  {
    id: "cable6",
    name: "Premium USB-A to USB-C",
    brand: "Aurexia",
    price: 999,
    originalPrice: 1499,
    rating: 4,
    reviews: 203,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 200,
    length: "1m",
    type: "USB-A to USB-C",
    specs: ["3A Fast Charge", "Dual Braided", "Aluminum Shell"],
  },
  {
    id: "cable7",
    name: "HDMI to USB-C 8K Cable",
    brand: "VisionLux",
    price: 3999,
    originalPrice: 4999,
    rating: 5,
    reviews: 42,
    badge: "new",
    badgeLabel: "New",
    inStock: 18,
    length: "1.8m",
    type: "HDMI to USB-C",
    specs: ["8K@60Hz", "HDR10+", "Dolby Vision", "48Gbps"],
  },
  {
    id: "cable8",
    name: "Silicone Pink Cable",
    brand: "Aurexia",
    price: 1399,
    rating: 4,
    reviews: 88,
    inStock: 62,
    length: "1.2m",
    type: "USB-C to USB-C",
    specs: ["Silicone Material", "60W PD", "Tangle-Free", "Pastel Colors"],
  },
  {
    id: "cable9",
    name: "Braided Micro-USB Cable",
    brand: "TechLux",
    price: 799,
    originalPrice: 1299,
    rating: 4,
    reviews: 156,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 150,
    length: "1m",
    type: "Micro-USB",
    specs: ["Nylon Braided", "2.4A Fast Charge", "Durable Connector"],
  },
  {
    id: "cable10",
    name: "MagSafe 3 Charging Cable",
    brand: "Aurexia",
    price: 4499,
    rating: 5,
    reviews: 67,
    badge: "new",
    badgeLabel: "New",
    inStock: 24,
    length: "2m",
    type: "MagSafe 3",
    specs: [
      "140W PD",
      "Braided Design",
      "Magnetic Alignment",
      "Apple Certified",
    ],
  },
  {
    id: "cable11",
    name: "Flat Ribbon USB-C Cable",
    brand: "SlimLux",
    price: 1199,
    rating: 3,
    reviews: 34,
    inStock: 55,
    length: "1.5m",
    type: "USB-C to USB-C",
    specs: ["Flat Design", "60W PD", "Tangle-Free", "Soft Touch"],
  },
  {
    id: "cable12",
    name: "Armored Steel Cable",
    brand: "ArmorLux",
    price: 3499,
    originalPrice: 4499,
    rating: 5,
    reviews: 112,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 28,
    length: "2m",
    type: "USB-C to USB-C",
    specs: ["Steel Armor", "240W PD", "Military Grade", "10 Year Warranty"],
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
  { href: "/accessories/cables", label: "Cables", icon: "🔌", active: true },
  { href: "/accessories/covers", label: "Covers", icon: "🛡️" },
  {
    href: "/accessories/screen-protectors",
    label: "Screen Guards",
    icon: "🛡️",
  },
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
function CablePlaceholder() {
  return (
    <div className="st-card-img-placeholder">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <path d="M20 12L4 12" strokeLinecap="round" />
        <path
          d="M18 8L20 12L18 16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M6 8L4 12L6 16" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="8" r="2" />
        <circle cx="6" cy="16" r="2" />
      </svg>
    </div>
  );
}

/* ── Main Page ── */
export default function CablesPage() {
  const { addToCart } = useCartStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({
    show: false,
    msg: "",
  });

  const filtered = useMemo(() => {
    let list = [...CABLES];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.type?.toLowerCase().includes(q) ||
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
      default:
        // featured - keep original order
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
      description: `${product.brand} ${product.type || "Cable"} - ${
        product.length || ""
      }`,
      price: product.price,
      original_price: product.originalPrice,
      category: "Accessories",
      subcategory: "Cables",
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
          Premium <em>Cables</em>
        </h1>
        <p className="st-hero-sub">
          High-quality, durable cables for every device — USB-C, Lightning, HDMI
          and more. Fast charging and high-speed data transfer.
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
              placeholder="Search cables by brand, type, length..."
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
            <em>{filtered.length}</em> Cables
          </span>
        </div>

        {/* Section Label */}
        <div className="st-section-label">
          <h2 className="st-section-title">
            Connection <em>Essentials</em>
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
            <h3 className="st-empty-title">No cables found</h3>
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
                    <CablePlaceholder />

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
                      {product.length && (
                        <span className="st-badge st-badge--cat">
                          {product.length}
                        </span>
                      )}
                      {product.type && (
                        <span className="st-badge st-badge--type">
                          {product.type}
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

                    {/* Type and Length */}
                    <div className="st-card-meta">
                      {product.type && (
                        <span className="st-card-type">{product.type}</span>
                      )}
                      {product.length && (
                        <span className="st-card-length">
                          📏 {product.length}
                        </span>
                      )}
                    </div>

                    {/* Specs */}
                    {product.specs && (
                      <div className="st-card-specs">
                        {product.specs.slice(0, 3).map((spec) => (
                          <span key={spec} className="st-card-spec">
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
          gap: 0.5rem;
          margin: 0.3rem 0 0.5rem;
        }
        .st-card-type {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.55rem;
          font-weight: 400;
          letter-spacing: 0.05em;
          color: var(--st-gold, #b8963e);
          background: rgba(184, 150, 62, 0.1);
          padding: 0.2rem 0.5rem;
          border-radius: 1px;
        }
        .st-card-length {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.55rem;
          font-weight: 300;
          letter-spacing: 0.05em;
          color: rgba(245, 240, 232, 0.5);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.2rem 0.5rem;
          border-radius: 1px;
        }
        .st-card-specs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .st-card-spec {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.46rem;
          font-weight: 300;
          letter-spacing: 0.08em;
          color: rgba(245, 240, 232, 0.35);
          padding: 0.15rem 0.4rem;
          border: 1px solid rgba(184, 150, 62, 0.12);
          border-radius: 1px;
        }
        .st-card-rating {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-top: 0.3rem;
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
        .st-badge--type {
          background: rgba(184, 150, 62, 0.15);
          color: #b8963e;
        }
        .st-cat-icon {
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
