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
  type?: string;
  batteryLife?: string;
  noiseCancellation?: boolean;
  waterResistant?: string;
  features?: string[];
  color?: string[];
}

/* ── Earbuds Data ── */
const EARBUDS: Product[] = [
  {
    id: "eb1",
    name: "Aurexia Phantom Pro",
    brand: "Aurexia",
    price: 18999,
    originalPrice: 24999,
    rating: 5,
    reviews: 342,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 28,
    type: "True Wireless",
    batteryLife: "8h + 32h case",
    noiseCancellation: true,
    waterResistant: "IPX4",
    features: [
      "Active Noise Cancellation",
      "Transparency Mode",
      "LDAC Codec",
      "Wireless Charging",
    ],
    color: ["Black", "Silver", "Gold"],
  },
  {
    id: "eb2",
    name: "Aurexia Luxe Buds",
    brand: "Aurexia",
    price: 14999,
    originalPrice: 19999,
    rating: 5,
    reviews: 178,
    badge: "new",
    badgeLabel: "New",
    inStock: 42,
    type: "True Wireless",
    batteryLife: "6h + 24h case",
    noiseCancellation: true,
    waterResistant: "IPX5",
    features: [
      "Hybrid ANC",
      "Spatial Audio",
      "Multipoint Connection",
      "Fast Pair",
    ],
    color: ["White", "Black", "Rose Gold"],
  },
  {
    id: "eb3",
    name: "SoundMaster Elite",
    brand: "AudioLux",
    price: 12999,
    originalPrice: 16999,
    rating: 4,
    reviews: 267,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 35,
    type: "True Wireless",
    batteryLife: "7h + 28h case",
    noiseCancellation: true,
    waterResistant: "IPX4",
    features: ["Deep Bass", "EQ Presets", "Low Latency Mode", "App Support"],
    color: ["Dark Grey", "Navy Blue", "Copper"],
  },
  {
    id: "eb4",
    name: "EcoWave Buds Pro",
    brand: "EcoLux",
    price: 9999,
    rating: 4,
    reviews: 94,
    badge: "new",
    badgeLabel: "New",
    inStock: 55,
    type: "True Wireless",
    batteryLife: "5h + 20h case",
    noiseCancellation: false,
    waterResistant: "IPX4",
    features: [
      "Recycled Materials",
      "Eco Packaging",
      "Balanced Sound",
      "Touch Controls",
    ],
    color: ["Ocean Blue", "Forest Green", "Sand Beige"],
  },
  {
    id: "eb5",
    name: "Gaming Vortex X",
    brand: "GameLux",
    price: 7999,
    originalPrice: 11999,
    rating: 4,
    reviews: 156,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 48,
    type: "True Wireless",
    batteryLife: "4h + 16h case",
    noiseCancellation: false,
    waterResistant: "IPX3",
    features: ["Ultra Low Latency", "RGB Lights", "Dual Mic", "Gaming Mode"],
    color: ["Neon Green", "Cyberpunk Pink", "Stealth Black"],
  },
  {
    id: "eb6",
    name: "Pro Studio Monitors",
    brand: "StudioLux",
    price: 24999,
    originalPrice: 32999,
    rating: 5,
    reviews: 89,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 12,
    type: "Neckband",
    batteryLife: "15h",
    noiseCancellation: true,
    waterResistant: "IPX5",
    features: [
      "Studio Grade Sound",
      "Detachable Cable",
      "Hi-Res Audio",
      "Memory Foam Tips",
    ],
    color: ["Professional Black"],
  },
  {
    id: "eb7",
    name: "SportFlex Wireless",
    brand: "SportLux",
    price: 5999,
    originalPrice: 8999,
    rating: 4,
    reviews: 203,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 78,
    type: "Neckband",
    batteryLife: "12h",
    noiseCancellation: false,
    waterResistant: "IPX7",
    features: [
      "Sweat Resistant",
      "Magnetic Earbuds",
      "Quick Charge",
      "Secure Fit",
    ],
    color: ["Black/Red", "Blue/White", "Green/Yellow"],
  },
  {
    id: "eb8",
    name: "Aurexia Mini Buds",
    brand: "Aurexia",
    price: 6999,
    rating: 4,
    reviews: 312,
    inStock: 95,
    type: "True Wireless",
    batteryLife: "4h + 16h case",
    noiseCancellation: false,
    waterResistant: "IPX4",
    features: [
      "Compact Design",
      "Touch Controls",
      "Voice Assistant",
      "USB-C Charging",
    ],
    color: ["White", "Black", "Pink", "Blue"],
  },
  {
    id: "eb9",
    name: "Executive Business Headset",
    brand: "BusinessLux",
    price: 11999,
    originalPrice: 15999,
    rating: 5,
    reviews: 67,
    badge: "new",
    badgeLabel: "New",
    inStock: 22,
    type: "Over-Ear",
    batteryLife: "30h",
    noiseCancellation: true,
    waterResistant: "Not Rated",
    features: [
      "Dual Microphone",
      "Microsoft Teams Certified",
      "Comfort Earpads",
      "Foldable",
    ],
    color: ["Charcoal Grey", "Midnight Blue"],
  },
  {
    id: "eb10",
    name: "Kids Safe Buds",
    brand: "SafeSound",
    price: 3499,
    originalPrice: 4999,
    rating: 4,
    reviews: 145,
    badge: "new",
    badgeLabel: "New",
    inStock: 120,
    type: "True Wireless",
    batteryLife: "3h + 9h case",
    noiseCancellation: false,
    waterResistant: "IPX2",
    features: [
      "Volume Limiter",
      "Soft Silicone",
      "Fun Colors",
      "Parental Control App",
    ],
    color: ["Lemon Yellow", "Mint Green", "Coral Pink", "Lavender"],
  },
  {
    id: "eb11",
    name: "Retro Wired Earphones",
    brand: "RetroLux",
    price: 2499,
    rating: 4,
    reviews: 98,
    inStock: 85,
    type: "Wired",
    batteryLife: undefined,
    noiseCancellation: false,
    waterResistant: "Not Rated",
    features: ["3.5mm Jack", "Braided Cable", "Metal Housing", "In-line Mic"],
    color: ["Vintage Copper", "Classic Silver", "Matte Black"],
  },
  {
    id: "eb12",
    name: "ANC Elite Pro Max",
    brand: "NoiseLux",
    price: 21999,
    originalPrice: 28999,
    rating: 5,
    reviews: 112,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 18,
    type: "Over-Ear",
    batteryLife: "40h",
    noiseCancellation: true,
    waterResistant: "Not Rated",
    features: [
      "Adaptive ANC",
      "High-Res Audio",
      "Premium Leather",
      "Carry Case",
    ],
    color: ["Space Black", "Pearl White", "Burgundy"],
  },
  {
    id: "eb13",
    name: "Open Ear Sports Buds",
    brand: "OpenLux",
    price: 8999,
    originalPrice: 11999,
    rating: 4,
    reviews: 76,
    badge: "new",
    badgeLabel: "New",
    inStock: 32,
    type: "Open Ear",
    batteryLife: "6h + 18h case",
    noiseCancellation: false,
    waterResistant: "IPX6",
    features: [
      "Situational Awareness",
      "Hook Design",
      "Bone Conduction Tech",
      "Lightweight",
    ],
    color: ["Graphite", "Arctic White"],
  },
  {
    id: "eb14",
    name: "Virtual 7.1 Gaming Headset",
    brand: "GameLux",
    price: 15999,
    originalPrice: 19999,
    rating: 5,
    reviews: 234,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 45,
    type: "Over-Ear",
    batteryLife: "25h",
    noiseCancellation: false,
    waterResistant: "Not Rated",
    features: [
      "7.1 Surround Sound",
      "Retractable Mic",
      "RGB Lighting",
      "Multi-Platform",
    ],
    color: ["Black/Gold", "White/Red"],
  },
  {
    id: "eb15",
    name: "Crystal Clear Earphones",
    brand: "Aurexia",
    price: 1499,
    rating: 4,
    reviews: 456,
    inStock: 200,
    type: "Wired",
    batteryLife: undefined,
    noiseCancellation: false,
    waterResistant: "Not Rated",
    features: [
      "Transparent Design",
      "Tangle-Free Cable",
      "Built-in Mic",
      "Universal 3.5mm",
    ],
    color: ["Transparent", "Smoke Grey"],
  },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const TYPE_FILTERS = [
  { value: "", label: "All Types" },
  { value: "True Wireless", label: "True Wireless" },
  { value: "Neckband", label: "Neckband" },
  { value: "Over-Ear", label: "Over-Ear" },
  { value: "Wired", label: "Wired" },
  { value: "Open Ear", label: "Open Ear" },
];

const CAT_LINKS = [
  { href: "/accessories", label: "All Accessories", icon: "📱" },
  { href: "/accessories/chargers", label: "Chargers", icon: "⚡" },
  { href: "/accessories/cables", label: "Cables", icon: "🔌" },
  { href: "/accessories/covers", label: "Covers", icon: "🛡️" },
  {
    href: "/accessories/screen-protectors",
    label: "Screen Guards",
    icon: "🛡️",
  },
  {
    href: "/accessories/earbuds",
    label: "Earbuds & Audio",
    icon: "🎧",
    active: true,
  },
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
function EarbudPlaceholder() {
  return (
    <div className="st-card-img-placeholder">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <path d="M3 18v-6a9 9 0 0118 0v6" />
        <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z" />
        <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
        <circle cx="8" cy="14" r="1" fill="currentColor" />
        <circle cx="16" cy="14" r="1" fill="currentColor" />
      </svg>
    </div>
  );
}

/* ── Main Page ── */
export default function EarbudsPage() {
  const { addToCart } = useCartStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [typeFilter, setTypeFilter] = useState("");
  const [ancFilter, setAncFilter] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({
    show: false,
    msg: "",
  });

  const filtered = useMemo(() => {
    let list = [...EARBUDS];

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

    if (typeFilter) {
      list = list.filter((p) => p.type === typeFilter);
    }

    if (ancFilter) {
      list = list.filter((p) => p.noiseCancellation === true);
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
  }, [search, sort, typeFilter, ancFilter]);

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2000);
  };

  const handleAddToCart = (product: Product) => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: `${product.brand} ${product.type || "Earbuds"} - ${
        product.batteryLife || ""
      }`,
      price: product.price,
      original_price: product.originalPrice,
      category: "Accessories",
      subcategory: "Earbuds",
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
      <div className="st-ambient" />
      <div className="st-grain" />
      <div className="st-lines">
        {[...Array(5)].map((_, i) => (
          <span key={i} />
        ))}
      </div>

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

      <header className="st-hero">
        <p className="st-eyebrow">
          <span className="st-ey-line" />
          Mobile Accessories
        </p>
        <h1 className="st-hero-title">
          Earbuds <em>&amp; Audio</em>
        </h1>
        <p className="st-hero-sub">
          Experience premium sound with our curated collection of wireless
          earbuds, neckbands, and headphones. Crystal clear audio for every
          moment.
        </p>

        <div className="st-hero-ring">
          <div className="st-ring">
            <div className="st-ring-inner" />
            <div className="st-ring-dot" />
          </div>
        </div>
      </header>

      <main className="st-main">
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
              placeholder="Search earbuds by brand, type, feature..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="st-filter-row">
            <select
              className="st-type-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {TYPE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <button
              className={`st-anc-btn${ancFilter ? " active" : ""}`}
              onClick={() => setAncFilter(!ancFilter)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="12"
                height="12"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              ANC Only
            </button>

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
          </div>

          <span className="st-count">
            <em>{filtered.length}</em> Audio Devices
          </span>
        </div>

        <div className="st-section-label">
          <h2 className="st-section-title">
            Sound <em>Essentials</em>
          </h2>
          <div className="st-section-line" />
        </div>

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
            <h3 className="st-empty-title">No audio devices found</h3>
            <p className="st-empty-sub">Try adjusting your search or filters</p>
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
                  <div className="st-card-img">
                    <EarbudPlaceholder />

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
                      {product.noiseCancellation && (
                        <span className="st-badge st-badge--anc">ANC</span>
                      )}
                      {product.waterResistant &&
                        product.waterResistant !== "Not Rated" && (
                          <span className="st-badge st-badge--water">
                            {product.waterResistant}
                          </span>
                        )}
                    </div>

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

                  <div className="st-card-body">
                    <p className="st-card-brand">{product.brand}</p>
                    <h3 className="st-card-name">{product.name}</h3>

                    {product.batteryLife && (
                      <div className="st-card-battery">
                        <span>🔋 {product.batteryLife}</span>
                      </div>
                    )}

                    {product.features && (
                      <div className="st-card-features">
                        {product.features.slice(0, 3).map((feature) => (
                          <span key={feature} className="st-card-feature">
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}

                    {product.color && product.color.length > 0 && (
                      <div className="st-card-colors">
                        {product.color.slice(0, 4).map((color) => (
                          <span
                            key={color}
                            className="st-card-color-dot"
                            style={{
                              backgroundColor: getAudioColorCode(color),
                            }}
                            title={color}
                          />
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

                    <div className="st-card-rating">
                      <Stars rating={product.rating} />
                      <span className="st-card-reviews">
                        ({product.reviews} reviews)
                      </span>
                    </div>
                  </div>

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

                  <div className="st-card-line" />
                </article>
              );
            })}
          </div>
        )}
      </main>

      <style jsx>{`
        .st-filter-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .st-type-select {
          background: transparent;
          border: 1px solid rgba(184, 150, 62, 0.3);
          border-radius: 1px;
          padding: 0.45rem 0.75rem;
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.7rem;
          font-weight: 300;
          letter-spacing: 0.1em;
          color: rgba(245, 240, 232, 0.8);
          outline: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .st-type-select:hover,
        .st-type-select:focus {
          border-color: rgba(184, 150, 62, 0.7);
        }
        .st-anc-btn {
          background: transparent;
          border: 1px solid rgba(184, 150, 62, 0.3);
          border-radius: 1px;
          padding: 0.45rem 0.75rem;
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.7rem;
          font-weight: 300;
          letter-spacing: 0.1em;
          color: rgba(245, 240, 232, 0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.3s ease;
        }
        .st-anc-btn.active {
          border-color: #b8963e;
          background: rgba(184, 150, 62, 0.1);
          color: #b8963e;
        }
        .st-card-battery {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.55rem;
          font-weight: 400;
          letter-spacing: 0.05em;
          color: rgba(184, 150, 62, 0.8);
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
        .st-card-colors {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          margin: 0.3rem 0;
        }
        .st-card-color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.2s ease;
        }
        .st-card-color-dot:hover {
          transform: scale(1.3);
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
        .st-badge--anc {
          background: rgba(184, 150, 62, 0.15);
          color: #b8963e;
        }
        .st-badge--water {
          background: rgba(80, 180, 120, 0.15);
          color: #50b478;
        }
        .st-cat-icon {
          font-size: 0.9rem;
        }
        @media (max-width: 640px) {
          .st-filter-row {
            width: 100%;
            justify-content: space-between;
          }
          .st-type-select,
          .st-anc-btn {
            font-size: 0.6rem;
            padding: 0.35rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

function getAudioColorCode(color: string): string {
  const colorMap: Record<string, string> = {
    Black: "#1a1a1a",
    Silver: "#C0C0C0",
    Gold: "#FFD700",
    White: "#F5F5F5",
    "Rose Gold": "#B76E79",
    "Dark Grey": "#4A4A4A",
    "Navy Blue": "#191970",
    Copper: "#B87333",
    "Ocean Blue": "#0080FF",
    "Forest Green": "#228B22",
    "Sand Beige": "#F5DEB3",
    "Neon Green": "#39FF14",
    "Cyberpunk Pink": "#FF1493",
    "Stealth Black": "#0a0a0a",
    "Professional Black": "#1a1a1a",
    "Black/Red": "#1a1a1a",
    "Blue/White": "#0080FF",
    "Green/Yellow": "#32CD32",
    Pink: "#FF69B4",
    Blue: "#4169E1",
    "Charcoal Grey": "#36454F",
    "Midnight Blue": "#191970",
    "Lemon Yellow": "#FFF700",
    "Mint Green": "#98FB98",
    "Coral Pink": "#F88379",
    Lavender: "#E6E6FA",
    "Vintage Copper": "#B87333",
    "Classic Silver": "#C0C0C0",
    "Matte Black": "#2a2a2a",
    "Space Black": "#0a0a0a",
    "Pearl White": "#F5F5F0",
    Burgundy: "#800020",
    Graphite: "#4a4a4a",
    "Arctic White": "#FFFFFF",
    "Black/Gold": "#1a1a1a",
    "White/Red": "#F5F5F5",
    Transparent: "#E8E8E8",
    "Smoke Grey": "#808080",
  };
  return colorMap[color] || "#b8963e";
}
