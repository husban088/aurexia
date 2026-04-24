"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import "@/app/styles/store.css";

/* ── Types ── */
interface PortableProduct {
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
  features?: string[];
  color?: string;
  connectivity?: string[];
  weight?: string;
  waterproof?: string;
}

/* ── Portable Devices Data ── */
const PORTABLE_DEVICES: PortableProduct[] = [
  {
    id: "pd1",
    name: "Aurexia Go Mini PC",
    brand: "Aurexia",
    price: 54999,
    originalPrice: 69999,
    rating: 5,
    reviews: 342,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 18,
    type: "Mini Computer",
    batteryLife: "N/A",
    features: ["Intel i7", "16GB RAM", "512GB SSD", "Windows 11", "4K Output"],
    color: "Space Gray",
    connectivity: ["WiFi 6", "Bluetooth 5.2", "HDMI", "USB-C", "Ethernet"],
    weight: "450g",
  },
  {
    id: "pd2",
    name: "Handheld Gaming Console",
    brand: "GameLux",
    price: 39999,
    originalPrice: 49999,
    rating: 5,
    reviews: 178,
    badge: "new",
    badgeLabel: "New",
    inStock: 12,
    type: "Gaming",
    batteryLife: "6-8 Hours",
    features: [
      "7 AMOLED",
      "128GB Storage",
      "Android 13",
      "Cloud Gaming",
      "Expandable Storage",
    ],
    color: "Black/Red",
    connectivity: ["WiFi 6", "Bluetooth 5.0", "USB-C", "3.5mm Jack"],
    weight: "380g",
  },
  {
    id: "pd3",
    name: "Portable Monitor Touch",
    brand: "ViewLux",
    price: 34999,
    originalPrice: 44999,
    rating: 4,
    reviews: 267,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 28,
    type: "External Display",
    batteryLife: "N/A",
    features: [
      "15.6 4K OLED",
      "Touch Screen",
      "USB-C Connection",
      "Built-in Speakers",
    ],
    color: "Silver",
    connectivity: ["USB-C", "HDMI", "Mini HDMI"],
    weight: "850g",
  },
  {
    id: "pd4",
    name: "Ultra-thin Power Bank 20K",
    brand: "Aurexia",
    price: 6499,
    originalPrice: 8499,
    rating: 4,
    reviews: 94,
    badge: "new",
    badgeLabel: "New",
    inStock: 45,
    type: "Power Bank",
    batteryLife: "3-4 Charges",
    features: ["20000mAh", "65W PD", "Digital Display", "Ultra-thin 12mm"],
    color: "Matte Black",
    connectivity: ["USB-C", "USB-A"],
    weight: "320g",
  },
  {
    id: "pd5",
    name: "Portable SSD 2TB",
    brand: "Aurexia",
    price: 24999,
    originalPrice: 32999,
    rating: 5,
    reviews: 156,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 32,
    type: "Storage",
    batteryLife: "N/A",
    features: [
      "NVMe SSD",
      "2000MB/s Read/Write",
      "IP67 Waterproof",
      "Drop Resistant",
    ],
    color: "Titanium Gray",
    connectivity: ["USB-C 3.2", "USB-A"],
    weight: "45g",
    waterproof: "IP67",
  },
  {
    id: "pd6",
    name: "Portable Bluetooth Speaker",
    brand: "AudioLux",
    price: 12999,
    originalPrice: 17999,
    rating: 5,
    reviews: 89,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 38,
    type: "Speaker",
    batteryLife: "20 Hours",
    features: [
      "360° Sound",
      "Waterproof IPX7",
      "Stereo Pairing",
      "Built-in Mic",
    ],
    color: "Black/Red",
    connectivity: ["Bluetooth 5.3", "AUX", "USB-C"],
    weight: "620g",
    waterproof: "IPX7",
  },
  {
    id: "pd7",
    name: "E-Reader Paper White",
    brand: "ReadLux",
    price: 28999,
    originalPrice: 35999,
    rating: 4,
    reviews: 203,
    inStock: 25,
    type: "E-Reader",
    batteryLife: "6 Weeks",
    features: ["6.8 E-Ink", "Warm Light", "Waterproof", "32GB Storage"],
    color: "Black",
    connectivity: ["WiFi", "Bluetooth", "USB-C"],
    weight: "210g",
    waterproof: "IPX8",
  },
  {
    id: "pd8",
    name: "Digital Voice Recorder",
    brand: "AudioLux",
    price: 8999,
    originalPrice: 11999,
    rating: 4,
    reviews: 112,
    badge: "new",
    badgeLabel: "New",
    inStock: 42,
    type: "Audio Recorder",
    batteryLife: "30 Hours",
    features: [
      "32GB Storage",
      "Noise Cancellation",
      "Voice Activation",
      "USB Transfer",
    ],
    color: "Matte Black",
    connectivity: ["USB-C", "Bluetooth"],
    weight: "65g",
  },
  {
    id: "pd9",
    name: "Travel Router",
    brand: "NetLux",
    price: 7999,
    originalPrice: 10999,
    rating: 4,
    reviews: 67,
    badge: "new",
    badgeLabel: "New",
    inStock: 55,
    type: "Networking",
    batteryLife: "N/A",
    features: ["WiFi 6", "VPN Support", "USB Tethering", "5 Ports"],
    color: "White",
    connectivity: ["WiFi 6", "Ethernet", "USB-C"],
    weight: "120g",
  },
  {
    id: "pd10",
    name: "Portable DAC Amp",
    brand: "AudioLux",
    price: 18999,
    originalPrice: 24999,
    rating: 5,
    reviews: 45,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 18,
    type: "Audio",
    batteryLife: "12 Hours",
    features: ["Dual DAC", "4.4mm Balanced", "MQA Support", "Hi-Res Audio"],
    color: "Silver",
    connectivity: ["USB-C", "3.5mm", "4.4mm Balanced"],
    weight: "180g",
  },
  {
    id: "pd11",
    name: "Foldable Bluetooth Keyboard",
    brand: "TypeLux",
    price: 7999,
    originalPrice: 10999,
    rating: 4,
    reviews: 156,
    inStock: 68,
    type: "Keyboard",
    batteryLife: "3 Months",
    features: [
      "Foldable Design",
      "Multi-device",
      "Aluminum Body",
      "Backlit Keys",
    ],
    color: "Space Gray",
    connectivity: ["Bluetooth 5.0", "USB-C"],
    weight: "280g",
  },
  {
    id: "pd12",
    name: "Portable Webcam",
    brand: "CamLux",
    price: 9999,
    originalPrice: 13999,
    rating: 4,
    reviews: 89,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 35,
    type: "Webcam",
    batteryLife: "N/A",
    features: ["4K Ultra HD", "Auto Focus", "Privacy Cover", "Built-in Mic"],
    color: "Black",
    connectivity: ["USB-C", "USB-A"],
    weight: "95g",
  },
  {
    id: "pd13",
    name: "GPS Tracker Keychain",
    brand: "TrackLux",
    price: 3499,
    originalPrice: 4999,
    rating: 4,
    reviews: 234,
    badge: "new",
    badgeLabel: "New",
    inStock: 120,
    type: "Tracker",
    batteryLife: "1 Year",
    features: ["Global GPS", "App Control", "Find My Phone", "Water Resistant"],
    color: "Black/White",
    connectivity: ["Bluetooth", "GPS", "4G"],
    weight: "15g",
    waterproof: "IP66",
  },
  {
    id: "pd14",
    name: "Portable Photo Printer",
    brand: "PrintLux",
    price: 15999,
    originalPrice: 19999,
    rating: 4,
    reviews: 78,
    badge: "new",
    badgeLabel: "New",
    inStock: 22,
    type: "Printer",
    batteryLife: "20 Prints",
    features: ["ZINK Technology", "Bluetooth", "App Control", "Sticker Paper"],
    color: "White/Pink",
    connectivity: ["Bluetooth", "USB-C"],
    weight: "280g",
  },
  {
    id: "pd15",
    name: "Portable Air Purifier",
    brand: "AirLux",
    price: 19999,
    originalPrice: 26999,
    rating: 5,
    reviews: 56,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 15,
    type: "Air Purifier",
    batteryLife: "8 Hours",
    features: ["HEPA Filter", "Negative Ion", "USB-C Charging", "Silent Mode"],
    color: "White",
    connectivity: ["USB-C"],
    weight: "350g",
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
  { href: "/gadgets/smart-watches", label: "Smart Watches" },
  { href: "/gadgets/electronics", label: "Electronics" },
  {
    href: "/gadgets/portable-devices",
    label: "Portable Devices",
    active: true,
  },
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
function PortablePlaceholder() {
  return (
    <div className="st-card-img-placeholder">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <circle cx="12" cy="9" r="1.5" />
      </svg>
    </div>
  );
}

/* ── Main Page ── */
export default function PortableDevicesPage() {
  const { addToCart } = useCartStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({
    show: false,
    msg: "",
  });

  const filtered = useMemo(() => {
    let list = [...PORTABLE_DEVICES];
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

  const handleAddToCart = (product: PortableProduct) => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: `${product.brand} ${product.type || "Portable Device"}`,
      price: product.price,
      original_price: product.originalPrice,
      category: "Gadgets",
      subcategory: "Portable Devices",
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
                {cat.href.includes("smart-watches") ? (
                  <>
                    <rect x="5" y="7" width="14" height="13" rx="3" />
                    <circle cx="12" cy="13.5" r="2" />
                  </>
                ) : cat.href.includes("electronics") ? (
                  <>
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    <circle cx="12" cy="12" r="2" />
                  </>
                ) : cat.href.includes("portable") ? (
                  <rect x="2" y="3" width="20" height="14" rx="2" />
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
          Portable <em>Devices</em>
        </h1>
        <p className="st-hero-sub">
          Take technology with you wherever you go — powerful computing in
          compact forms, perfect for travel and everyday carry.
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
              placeholder="Search portable devices by brand, type, feature..."
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
            <em>{filtered.length}</em> Portable Devices
          </span>
        </div>

        {/* Section Label */}
        <div className="st-section-label">
          <h2 className="st-section-title">
            Carry <em>Solutions</em>
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
            <h3 className="st-empty-title">No portable devices found</h3>
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
                    <PortablePlaceholder />

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

                    {/* Battery Life */}
                    {product.batteryLife && (
                      <div className="st-card-battery">
                        <span>🔋 {product.batteryLife}</span>
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

                    {/* Connectivity */}
                    {product.connectivity && (
                      <div className="st-card-connectivity">
                        <span className="st-conn-icon">🔗</span>
                        <span className="st-conn-text">
                          {product.connectivity.slice(0, 3).join(", ")}
                        </span>
                      </div>
                    )}

                    {/* Weight */}
                    {product.weight && (
                      <div className="st-card-weight">
                        <span>📦 Weight: {product.weight}</span>
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
        .st-card-connectivity {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin: 0.3rem 0;
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.52rem;
          letter-spacing: 0.05em;
          flex-wrap: wrap;
        }
        .st-conn-icon {
          font-size: 0.65rem;
        }
        .st-conn-text {
          color: rgba(245, 240, 232, 0.5);
        }
        .st-card-weight {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.52rem;
          letter-spacing: 0.05em;
          color: rgba(184, 150, 62, 0.7);
          margin: 0.3rem 0;
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
