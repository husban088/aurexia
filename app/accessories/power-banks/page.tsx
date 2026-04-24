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
  capacity: string;
  powerDelivery?: boolean;
  fastCharge?: boolean;
  wireless?: boolean;
  ports?: string;
  features?: string[];
  color?: string[];
}

/* ── Power Banks Data ── */
const POWER_BANKS: Product[] = [
  {
    id: "pb1",
    name: "Obsidian 30K Power Bank",
    brand: "Aurexia",
    price: 7999,
    originalPrice: 9499,
    rating: 5,
    reviews: 342,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 18,
    capacity: "30,000mAh",
    powerDelivery: true,
    fastCharge: true,
    wireless: false,
    ports: "2x USB-C + 2x USB-A",
    features: [
      "140W Total Output",
      "Digital Display",
      "Aluminum Body",
      "Pass-Through Charging",
    ],
    color: ["Matte Black", "Space Gray"],
  },
  {
    id: "pb2",
    name: "MagSafe Power Bank Pro",
    brand: "Aurexia",
    price: 6499,
    originalPrice: 8499,
    rating: 5,
    reviews: 178,
    badge: "new",
    badgeLabel: "New",
    inStock: 32,
    capacity: "10,000mAh",
    powerDelivery: true,
    fastCharge: true,
    wireless: true,
    ports: "1x USB-C + 1x USB-A",
    features: [
      "15W MagSafe",
      "Snap-On Design",
      "LED Battery Indicator",
      "Ultra-Slim",
    ],
    color: ["White", "Black"],
  },
  {
    id: "pb3",
    name: "Ultra Compact 5K",
    brand: "Aurexia",
    price: 2999,
    originalPrice: 3999,
    rating: 4,
    reviews: 267,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 78,
    capacity: "5,000mAh",
    powerDelivery: true,
    fastCharge: false,
    wireless: false,
    ports: "1x USB-C + 1x USB-A",
    features: [
      "Keychain Design",
      "Built-in Cable",
      "Lipstick Size",
      "Quick Charge",
    ],
    color: ["Black", "White", "Rose Gold", "Midnight Blue"],
  },
  {
    id: "pb4",
    name: "Solar Power Bank 20K",
    brand: "EcoLux",
    price: 5499,
    originalPrice: 6999,
    rating: 4,
    reviews: 94,
    badge: "new",
    badgeLabel: "New",
    inStock: 25,
    capacity: "20,000mAh",
    powerDelivery: true,
    fastCharge: true,
    wireless: false,
    ports: "2x USB-C + 1x USB-A",
    features: [
      "Solar Charging",
      "IP67 Waterproof",
      "Compass",
      "Carabiner",
      "Emergency Light",
    ],
    color: ["Olive Green", "Black"],
  },
  {
    id: "pb5",
    name: "Gaming Beast 40K",
    brand: "GameLux",
    price: 9999,
    originalPrice: 12999,
    rating: 4,
    reviews: 156,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 15,
    capacity: "40,000mAh",
    powerDelivery: true,
    fastCharge: true,
    wireless: false,
    ports: "3x USB-C + 2x USB-A",
    features: [
      "RGB Lights",
      "100W PD",
      "Flashlight",
      "LCD Display",
      "Laptop Charging",
    ],
    color: ["Black/Gold", "Cyberpunk"],
  },
  {
    id: "pb6",
    name: "Aurexia Titan 25K",
    brand: "Aurexia",
    price: 6999,
    originalPrice: 8999,
    rating: 5,
    reviews: 89,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 22,
    capacity: "25,000mAh",
    powerDelivery: true,
    fastCharge: true,
    wireless: false,
    ports: "2x USB-C + 2x USB-A",
    features: [
      "65W Laptop Charging",
      "OLED Display",
      "Dual Charging",
      "Smart IC",
    ],
    color: ["Titanium Gray", "Midnight Black"],
  },
  {
    id: "pb7",
    name: "Wireless Charging Stand",
    brand: "LuxCharge",
    price: 4499,
    originalPrice: 5999,
    rating: 4,
    reviews: 203,
    badge: "new",
    badgeLabel: "New",
    inStock: 42,
    capacity: "10,000mAh",
    powerDelivery: true,
    fastCharge: true,
    wireless: true,
    ports: "1x USB-C",
    features: [
      "15W Fast Wireless",
      "Stand Design",
      "Phone Kickstand",
      "LED Indicator",
    ],
    color: ["White", "Black", "Silver"],
  },
  {
    id: "pb8",
    name: "Mini Emergency Power Bank",
    brand: "SafeLux",
    price: 1999,
    rating: 4,
    reviews: 312,
    inStock: 150,
    capacity: "2,600mAh",
    powerDelivery: false,
    fastCharge: false,
    wireless: false,
    ports: "1x USB-A",
    features: [
      "Tiny Size",
      "Built-in Flashlight",
      "Emergency Calls",
      "Keychain Attached",
    ],
    color: ["Red", "Yellow", "Black", "Blue"],
  },
  {
    id: "pb9",
    name: "Professional 65W Laptop Bank",
    brand: "ProLux",
    price: 11999,
    originalPrice: 15999,
    rating: 5,
    reviews: 67,
    badge: "new",
    badgeLabel: "New",
    inStock: 12,
    capacity: "27,000mAh",
    powerDelivery: true,
    fastCharge: true,
    wireless: false,
    ports: "2x USB-C + 1x USB-A",
    features: [
      "65W PD",
      "Charge MacBook Pro",
      "Airplane Friendly",
      "Digital Display",
    ],
    color: ["Professional Black", "Silver"],
  },
  {
    id: "pb10",
    name: "Smart Watch Power Bank",
    brand: "LuxCharge",
    price: 2499,
    originalPrice: 3499,
    rating: 4,
    reviews: 145,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 55,
    capacity: "3,000mAh",
    powerDelivery: false,
    fastCharge: false,
    wireless: true,
    ports: "1x USB-C",
    features: [
      "Magnetic Charging",
      "Apple Watch Compatible",
      "Ultra Compact",
      "Silent Mode",
    ],
    color: ["White", "Black", "Pink"],
  },
  {
    id: "pb11",
    name: "Dual USB-C Fast Bank",
    brand: "SpeedLux",
    price: 5499,
    rating: 4,
    reviews: 98,
    inStock: 38,
    capacity: "20,000mAh",
    powerDelivery: true,
    fastCharge: true,
    wireless: false,
    ports: "2x USB-C",
    features: [
      "Bi-Directional Charging",
      "LED Display",
      "GaN Technology",
      "Compact Design",
    ],
    color: ["Dark Grey", "Navy Blue"],
  },
  {
    id: "pb12",
    name: "Waterproof Rugged Bank",
    brand: "ArmorLux",
    price: 7999,
    originalPrice: 9999,
    rating: 5,
    reviews: 112,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 28,
    capacity: "20,000mAh",
    powerDelivery: true,
    fastCharge: true,
    wireless: false,
    ports: "1x USB-C + 2x USB-A",
    features: [
      "IP68 Waterproof",
      "Shockproof",
      "Dustproof",
      "Built-in Flashlight",
    ],
    color: ["Tactical Black", "Coyote Tan"],
  },
  {
    id: "pb13",
    name: "Slim Credit Card Bank",
    brand: "SlimLux",
    price: 3499,
    originalPrice: 4599,
    rating: 4,
    reviews: 234,
    badge: "new",
    badgeLabel: "New",
    inStock: 88,
    capacity: "5,000mAh",
    powerDelivery: true,
    fastCharge: false,
    wireless: false,
    ports: "1x USB-C + 1x USB-A",
    features: [
      "Credit Card Size",
      "Fits Wallet",
      "Built-in Cable",
      "Aluminum Finish",
    ],
    color: ["Silver", "Gold", "Space Gray"],
  },
  {
    id: "pb14",
    name: "Triple Port Power Bank",
    brand: "Aurexia",
    price: 4499,
    originalPrice: 5999,
    rating: 4,
    reviews: 176,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 62,
    capacity: "15,000mAh",
    powerDelivery: true,
    fastCharge: true,
    wireless: false,
    ports: "1x USB-C + 2x USB-A",
    features: [
      "Charge 3 Devices",
      "Lightning Port",
      "LED Lights",
      "Smart Power Management",
    ],
    color: ["Black", "White"],
  },
  {
    id: "pb15",
    name: "Travel 2-in-1 Wall + Bank",
    brand: "TravelLux",
    price: 8999,
    originalPrice: 11999,
    rating: 5,
    reviews: 56,
    badge: "new",
    badgeLabel: "New",
    inStock: 19,
    capacity: "10,000mAh",
    powerDelivery: true,
    fastCharge: true,
    wireless: false,
    ports: "2x USB-C + 1x USB-A",
    features: [
      "Built-in Plug",
      "International Adapter",
      "30W Charger",
      "TSA Friendly",
    ],
    color: ["Glacier White", "Carbon Black"],
  },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "capacity-asc", label: "Capacity: Low to High" },
  { value: "capacity-desc", label: "Capacity: High to Low" },
];

const CAPACITY_FILTERS = [
  { value: "", label: "All Capacities" },
  { value: "5000", label: "≤ 5,000mAh" },
  { value: "10000", label: "10,000mAh" },
  { value: "20000", label: "20,000mAh" },
  { value: "25000", label: "25,000mAh+" },
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
  { href: "/accessories/earbuds", label: "Earbuds", icon: "🎧" },
  {
    href: "/accessories/power-banks",
    label: "Power Banks",
    icon: "🔋",
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
function PowerBankPlaceholder() {
  return (
    <div className="st-card-img-placeholder">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <rect x="2" y="7" width="18" height="11" rx="2" />
        <path d="M22 11v3" />
        <path d="M7 12h4l-2 4 4-4h-3" />
      </svg>
    </div>
  );
}

/* ── Main Page ── */
export default function PowerBanksPage() {
  const { addToCart } = useCartStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [capacityFilter, setCapacityFilter] = useState("");
  const [wirelessFilter, setWirelessFilter] = useState(false);
  const [fastChargeFilter, setFastChargeFilter] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({
    show: false,
    msg: "",
  });

  const filtered = useMemo(() => {
    let list = [...POWER_BANKS];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.capacity.toLowerCase().includes(q) ||
          p.features?.some((f) => f.toLowerCase().includes(q))
      );
    }

    if (capacityFilter) {
      list = list.filter((p) => {
        const capacityValue = parseInt(p.capacity.replace(/,/g, ""));
        if (capacityFilter === "5000") return capacityValue <= 5000;
        if (capacityFilter === "10000")
          return capacityValue >= 10000 && capacityValue < 15000;
        if (capacityFilter === "20000")
          return capacityValue >= 20000 && capacityValue < 25000;
        if (capacityFilter === "25000") return capacityValue >= 25000;
        return true;
      });
    }

    if (wirelessFilter) {
      list = list.filter((p) => p.wireless === true);
    }

    if (fastChargeFilter) {
      list = list.filter((p) => p.fastCharge === true);
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
      case "capacity-asc":
        list.sort(
          (a, b) =>
            parseInt(a.capacity.replace(/,/g, "")) -
            parseInt(b.capacity.replace(/,/g, ""))
        );
        break;
      case "capacity-desc":
        list.sort(
          (a, b) =>
            parseInt(b.capacity.replace(/,/g, "")) -
            parseInt(a.capacity.replace(/,/g, ""))
        );
        break;
      default:
        break;
    }
    return list;
  }, [search, sort, capacityFilter, wirelessFilter, fastChargeFilter]);

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2000);
  };

  const handleAddToCart = (product: Product) => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: `${product.brand} ${product.capacity} Power Bank`,
      price: product.price,
      original_price: product.originalPrice,
      category: "Accessories",
      subcategory: "Power Banks",
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
          Power <em>Banks</em>
        </h1>
        <p className="st-hero-sub">
          Never run out of power with our premium portable chargers. From
          ultra-compact emergency banks to high-capacity laptop chargers.
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
              placeholder="Search power banks by brand, capacity, feature..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Row */}
          <div className="st-filter-row">
            <select
              className="st-filter-select"
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
            >
              {CAPACITY_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <button
              className={`st-filter-btn${wirelessFilter ? " active" : ""}`}
              onClick={() => setWirelessFilter(!wirelessFilter)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="12"
                height="12"
              >
                <path d="M18 12L21 9L18 6M6 6L3 9L6 12" />
                <path d="M18 18L21 15L18 12" />
              </svg>
              Wireless
            </button>

            <button
              className={`st-filter-btn${fastChargeFilter ? " active" : ""}`}
              onClick={() => setFastChargeFilter(!fastChargeFilter)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="12"
                height="12"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Fast Charge
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
            <em>{filtered.length}</em> Power Banks
          </span>
        </div>

        {/* Section Label */}
        <div className="st-section-label">
          <h2 className="st-section-title">
            Portable <em>Power</em>
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
            <h3 className="st-empty-title">No power banks found</h3>
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
                  {/* Image */}
                  <div className="st-card-img">
                    <PowerBankPlaceholder />

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
                      <span className="st-badge st-badge--capacity">
                        {product.capacity}
                      </span>
                      {product.wireless && (
                        <span className="st-badge st-badge--wireless">
                          Wireless
                        </span>
                      )}
                      {product.powerDelivery && (
                        <span className="st-badge st-badge--pd">PD</span>
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

                    {/* Ports Info */}
                    {product.ports && (
                      <div className="st-card-ports">
                        <span className="st-ports-icon">🔌</span>
                        <span className="st-ports-text">{product.ports}</span>
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

                    {/* Colors */}
                    {product.color && product.color.length > 0 && (
                      <div className="st-card-colors">
                        {product.color.slice(0, 4).map((color) => (
                          <span
                            key={color}
                            className="st-card-color-dot"
                            style={{
                              backgroundColor: getPowerBankColorCode(color),
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
        .st-filter-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .st-filter-select {
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
        .st-filter-select:hover,
        .st-filter-select:focus {
          border-color: rgba(184, 150, 62, 0.7);
        }
        .st-filter-btn {
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
        .st-filter-btn.active {
          border-color: #b8963e;
          background: rgba(184, 150, 62, 0.1);
          color: #b8963e;
        }
        .st-card-ports {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin: 0.3rem 0;
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.55rem;
          letter-spacing: 0.05em;
        }
        .st-ports-text {
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
        .st-badge--capacity {
          background: rgba(184, 150, 62, 0.15);
          color: #b8963e;
        }
        .st-badge--wireless {
          background: rgba(80, 180, 200, 0.15);
          color: #50b4c8;
        }
        .st-badge--pd {
          background: rgba(120, 180, 130, 0.15);
          color: #78b482;
        }
        .st-cat-icon {
          font-size: 0.9rem;
        }
        @media (max-width: 640px) {
          .st-filter-row {
            width: 100%;
            justify-content: space-between;
          }
          .st-filter-select,
          .st-filter-btn {
            font-size: 0.6rem;
            padding: 0.35rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

// Helper function for color dots
function getPowerBankColorCode(color: string): string {
  const colorMap: Record<string, string> = {
    "Matte Black": "#1a1a1a",
    "Space Gray": "#4a4a4a",
    White: "#F5F5F5",
    Black: "#1a1a1a",
    "Rose Gold": "#B76E79",
    "Midnight Blue": "#191970",
    "Olive Green": "#4B5320",
    "Titanium Gray": "#808080",
    "Midnight Black": "#0a0a0a",
    Silver: "#C0C0C0",
    Red: "#FF3B30",
    Yellow: "#FFD700",
    Blue: "#4169E1",
    "Professional Black": "#1a1a1a",
    Gold: "#FFD700",
    Pink: "#FF69B4",
    "Dark Grey": "#4A4A4A",
    "Navy Blue": "#191970",
    "Tactical Black": "#0a0a0a",
    "Coyote Tan": "#C2B280",
    "Black/Gold": "#1a1a1a",
    Cyberpunk: "#FF1493",
    "Glacier White": "#FFFFFF",
    "Carbon Black": "#1a1a1a",
  };
  return colorMap[color] || "#b8963e";
}
