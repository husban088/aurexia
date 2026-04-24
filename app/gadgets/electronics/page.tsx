"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import "@/app/styles/store.css";

/* ── Types ── */
interface ElectronicsProduct {
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
  power?: string;
  features?: string[];
  color?: string;
  connectivity?: string[];
  wattage?: number;
  weight?: string;
}

/* ── Electronics Data ── */
const ELECTRONICS: ElectronicsProduct[] = [
  {
    id: "ele1",
    name: "Smart Digital Alarm Clock",
    brand: "Aurexia",
    price: 4999,
    originalPrice: 6999,
    rating: 5,
    reviews: 342,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 28,
    type: "Smart Clock",
    power: "USB-C",
    features: [
      "WiFi + Bluetooth",
      "Voice Control",
      "RGB Lighting",
      "Night Light",
    ],
    color: "Midnight Black",
    connectivity: ["Alexa", "Google Assistant", "Apple HomeKit"],
    wattage: 10,
    weight: "320g",
  },
  {
    id: "ele2",
    name: "Mini Projector 4K",
    brand: "VisionLux",
    price: 34999,
    originalPrice: 44999,
    rating: 5,
    reviews: 178,
    badge: "new",
    badgeLabel: "New",
    inStock: 12,
    type: "Projector",
    power: "DC 19V",
    features: [
      "Native 4K",
      "500 ANSI Lumens",
      "Auto Focus",
      "Keystone Correction",
    ],
    color: "Space Gray",
    connectivity: ["HDMI", "USB-C", "WiFi", "Bluetooth"],
    wattage: 65,
    weight: "1.2kg",
  },
  {
    id: "ele3",
    name: "Smart Plug Mini",
    brand: "SmartLux",
    price: 1499,
    originalPrice: 2499,
    rating: 4,
    reviews: 567,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 120,
    type: "Smart Home",
    power: "AC 110-240V",
    features: [
      "Energy Monitoring",
      "Voice Control",
      "Schedule Timer",
      "Away Mode",
    ],
    color: "White",
    connectivity: ["WiFi", "Alexa", "Google Home"],
    wattage: 1800,
    weight: "45g",
  },
  {
    id: "ele4",
    name: "Wireless Charging Station",
    brand: "Aurexia",
    price: 7999,
    originalPrice: 9999,
    rating: 4,
    reviews: 94,
    badge: "new",
    badgeLabel: "New",
    inStock: 35,
    type: "Charger",
    power: "USB-C",
    features: [
      "3-in-1 Charging",
      "15W Fast Charging",
      "Overheat Protection",
      "Night Mode",
    ],
    color: "Silver",
    connectivity: ["Qi Wireless", "MagSafe Compatible"],
    wattage: 45,
    weight: "180g",
  },
  {
    id: "ele5",
    name: "Digital Voice Recorder",
    brand: "AudioLux",
    price: 8999,
    originalPrice: 11999,
    rating: 4,
    reviews: 156,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 22,
    type: "Audio Device",
    power: "Built-in Battery",
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
    id: "ele6",
    name: "Smart LED Strip Lights",
    brand: "LightLux",
    price: 2999,
    originalPrice: 3999,
    rating: 5,
    reviews: 89,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 78,
    type: "Lighting",
    power: "USB-A",
    features: ["16M Colors", "Music Sync", "App Control", "Voice Control"],
    color: "Multi-color",
    connectivity: ["WiFi", "Bluetooth", "Alexa", "Google"],
    wattage: 24,
    weight: "200g",
  },
  {
    id: "ele7",
    name: "USB Desk Fan",
    brand: "CoolLux",
    price: 1299,
    originalPrice: 1999,
    rating: 4,
    reviews: 203,
    inStock: 150,
    type: "Cooling",
    power: "USB-C",
    features: [
      "3 Speed Settings",
      "Quiet Motor",
      "360° Rotation",
      "Rechargeable",
    ],
    color: "White",
    connectivity: ["USB Only"],
    wattage: 5,
    weight: "120g",
  },
  {
    id: "ele8",
    name: "Smart Scale Body Analyzer",
    brand: "HealthLux",
    price: 6499,
    originalPrice: 8499,
    rating: 5,
    reviews: 112,
    badge: "new",
    badgeLabel: "New",
    inStock: 42,
    type: "Health Gadget",
    power: "4x AAA Batteries",
    features: ["14 Body Metrics", "BMI Analysis", "App Sync", "Multi-User"],
    color: "Satin Silver",
    connectivity: ["Bluetooth", "WiFi", "Health App"],
    weight: "1.5kg",
  },
  {
    id: "ele9",
    name: "Laser Projection Keyboard",
    brand: "TechLux",
    price: 12999,
    originalPrice: 16999,
    rating: 4,
    reviews: 67,
    badge: "new",
    badgeLabel: "New",
    inStock: 18,
    type: "Input Device",
    power: "USB-C",
    features: ["Bluetooth 5.0", "Multi-device", "Gesture Control", "Portable"],
    color: "Black",
    connectivity: ["Bluetooth", "USB-C"],
    weight: "85g",
  },
  {
    id: "ele10",
    name: "Digital Microscope",
    brand: "SciLux",
    price: 15999,
    originalPrice: 19999,
    rating: 5,
    reviews: 45,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 15,
    type: "Educational",
    power: "USB-C",
    features: ["1000x Zoom", "8MP Camera", "Software Included", "Record Video"],
    color: "White/Silver",
    connectivity: ["USB", "HDMI", "WiFi"],
    weight: "450g",
  },
  {
    id: "ele11",
    name: "Smart Air Quality Monitor",
    brand: "EcoLux",
    price: 7999,
    originalPrice: 9999,
    rating: 4,
    reviews: 89,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 32,
    type: "Environmental",
    power: "USB-C",
    features: [
      "CO2 Detection",
      "PM2.5",
      "Temperature",
      "Humidity",
      "App Alerts",
    ],
    color: "White",
    connectivity: ["WiFi", "Bluetooth"],
    wattage: 5,
    weight: "180g",
  },
  {
    id: "ele12",
    name: "Smart Rope Jump Rope",
    brand: "FitLux",
    price: 3499,
    originalPrice: 4999,
    rating: 4,
    reviews: 156,
    inStock: 55,
    type: "Fitness",
    power: "Built-in Battery",
    features: [
      "LED Counter",
      "Calorie Tracker",
      "Bluetooth App",
      "Adjustable Length",
    ],
    color: "Black/Red",
    connectivity: ["Bluetooth", "Fitness App"],
    weight: "220g",
  },
  {
    id: "ele13",
    name: "Mini Thermal Printer",
    brand: "PrintLux",
    price: 6999,
    originalPrice: 8999,
    rating: 4,
    reviews: 234,
    badge: "new",
    badgeLabel: "New",
    inStock: 48,
    type: "Printer",
    power: "USB-C",
    features: ["Thermal Printing", "App Control", "Sticker Paper", "Portable"],
    color: "Pink/White",
    connectivity: ["Bluetooth", "App"],
    weight: "160g",
  },
  {
    id: "ele14",
    name: "Smart Plant Sensor",
    brand: "GardenLux",
    price: 2499,
    originalPrice: 3499,
    rating: 4,
    reviews: 78,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 62,
    type: "Smart Garden",
    power: "Battery",
    features: [
      "Soil Moisture",
      "Light Sensor",
      "Temperature",
      "Fertilizer Alert",
    ],
    color: "Green",
    connectivity: ["Bluetooth", "Plant App"],
    weight: "45g",
  },
  {
    id: "ele15",
    name: "Portable SSD 1TB",
    brand: "Aurexia",
    price: 18999,
    originalPrice: 24999,
    rating: 5,
    reviews: 567,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 38,
    type: "Storage",
    power: "USB-C",
    features: [
      "NVMe SSD",
      "2000MB/s Transfer",
      "Durable Aluminum",
      "Password Protection",
    ],
    color: "Space Gray",
    connectivity: ["USB-C 3.2", "USB-A"],
    weight: "28g",
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
  { href: "/gadgets/electronics", label: "Electronics", active: true },
  { href: "/gadgets/portable-devices", label: "Portable Devices" },
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
function ElectronicsPlaceholder() {
  return (
    <div className="st-card-img-placeholder">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        <circle cx="12" cy="12" r="1.5" />
      </svg>
    </div>
  );
}

/* ── Main Page ── */
export default function ElectronicsPage() {
  const { addToCart } = useCartStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({
    show: false,
    msg: "",
  });

  const filtered = useMemo(() => {
    let list = [...ELECTRONICS];
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

  const handleAddToCart = (product: ElectronicsProduct) => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: `${product.brand} ${product.type || "Electronics"}`,
      price: product.price,
      original_price: product.originalPrice,
      category: "Gadgets",
      subcategory: "Electronics",
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
          Small <em>Electronics</em>
        </h1>
        <p className="st-hero-sub">
          Innovative electronic devices that simplify your daily routine — from
          smart home gadgets to portable tech essentials.
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
              placeholder="Search electronics by brand, type, feature..."
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
            <em>{filtered.length}</em> Electronics
          </span>
        </div>

        {/* Section Label */}
        <div className="st-section-label">
          <h2 className="st-section-title">
            Smart <em>Innovation</em>
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
            <h3 className="st-empty-title">No electronics found</h3>
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
                    <ElectronicsPlaceholder />

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

                    {/* Power/Wattage */}
                    {(product.power || product.wattage) && (
                      <div className="st-card-power">
                        <span>⚡ {product.power || `${product.wattage}W`}</span>
                        {product.weight && (
                          <span className="st-card-weight">
                            📦 {product.weight}
                          </span>
                        )}
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
        }
        .st-conn-icon {
          font-size: 0.65rem;
        }
        .st-conn-text {
          color: rgba(245, 240, 232, 0.5);
        }
        .st-card-power {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.3rem 0;
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.52rem;
          letter-spacing: 0.05em;
          color: rgba(184, 150, 62, 0.7);
          flex-wrap: wrap;
        }
        .st-card-weight {
          color: rgba(245, 240, 232, 0.4);
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
      `}</style>
    </div>
  );
}
