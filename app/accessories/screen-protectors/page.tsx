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
  material: string;
  hardness?: string;
  thickness?: string;
  features?: string[];
  compatibility?: string[];
  privacy?: boolean;
  antiBlueLight?: boolean;
  matte?: boolean;
}

/* ── Screen Protectors Data ── */
const SCREEN_PROTECTORS: Product[] = [
  {
    id: "sp1",
    name: "Premium Tempered Glass 9H",
    brand: "Aurexia",
    price: 1299,
    originalPrice: 1999,
    rating: 5,
    reviews: 342,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 120,
    material: "Tempered Glass",
    hardness: "9H",
    thickness: "0.33mm",
    features: [
      "Case Friendly",
      "Oleophobic Coating",
      "Bubble-Free",
      "Edge-to-Edge",
    ],
    compatibility: [
      "iPhone 15 Pro",
      "iPhone 15 Pro Max",
      "iPhone 14 Pro",
      "Samsung S24 Ultra",
    ],
    privacy: false,
    antiBlueLight: false,
    matte: false,
  },
  {
    id: "sp2",
    name: "Privacy Screen Protector",
    brand: "Aurexia",
    price: 2499,
    originalPrice: 3499,
    rating: 5,
    reviews: 178,
    badge: "new",
    badgeLabel: "New",
    inStock: 45,
    material: "Tempered Glass",
    hardness: "9H",
    thickness: "0.33mm",
    features: ["30° Privacy", "Anti-Spy", "Case Friendly", "Easy Install"],
    compatibility: [
      "iPhone 15 Pro",
      "iPhone 15 Pro Max",
      "Samsung S24 Ultra",
      "Pixel 8 Pro",
    ],
    privacy: true,
    antiBlueLight: false,
    matte: false,
  },
  {
    id: "sp3",
    name: "Hydrogel Flexible Film",
    brand: "FlexGuard",
    price: 899,
    originalPrice: 1499,
    rating: 4,
    reviews: 267,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 200,
    material: "Hydrogel TPU",
    hardness: "3H",
    thickness: "0.15mm",
    features: [
      "Self-Healing",
      "Scratch Resistant",
      "Curved Edge Support",
      "Full Coverage",
    ],
    compatibility: [
      "All Curved Screen Phones",
      "Samsung S24 Ultra",
      "OnePlus 12",
      "Xiaomi 14",
    ],
    privacy: false,
    antiBlueLight: false,
    matte: false,
  },
  {
    id: "sp4",
    name: "Blue Light Blocking Shield",
    brand: "EyeLux",
    price: 1799,
    originalPrice: 2499,
    rating: 4,
    reviews: 94,
    badge: "new",
    badgeLabel: "New",
    inStock: 38,
    material: "Tempered Glass",
    hardness: "9H",
    thickness: "0.33mm",
    features: [
      "65% Blue Light Reduction",
      "Eye Protection",
      "Sleep Better",
      "Original Color",
    ],
    compatibility: ["iPhone 15 Series", "Samsung S24 Series", "Pixel 8 Series"],
    privacy: false,
    antiBlueLight: true,
    matte: false,
  },
  {
    id: "sp5",
    name: "Matte Anti-Glare Protector",
    brand: "MatteLux",
    price: 1499,
    originalPrice: 1999,
    rating: 4,
    reviews: 156,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 62,
    material: "Tempered Glass",
    hardness: "8H",
    thickness: "0.33mm",
    features: [
      "Anti-Glare",
      "Fingerprint Resistant",
      "Paper-like Feel",
      "Reduce Reflection",
    ],
    compatibility: ["iPad Pro 12.9", "iPad Air", "iPad 10th Gen"],
    privacy: false,
    antiBlueLight: false,
    matte: true,
  },
  {
    id: "sp6",
    name: "Ultra-Thin Clear Glass",
    brand: "Aurexia",
    price: 999,
    originalPrice: 1499,
    rating: 5,
    reviews: 89,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 85,
    material: "Tempered Glass",
    hardness: "9H",
    thickness: "0.2mm",
    features: [
      "Ultra-Thin",
      "99% Transparency",
      "High Touch Sensitivity",
      "Scratch Resistant",
    ],
    compatibility: ["iPhone 15", "iPhone 15 Plus", "Samsung S24", "Pixel 8"],
    privacy: false,
    antiBlueLight: false,
    matte: false,
  },
  {
    id: "sp7",
    name: "Camera Lens Protector",
    brand: "LensLux",
    price: 599,
    originalPrice: 899,
    rating: 4,
    reviews: 203,
    inStock: 150,
    material: "Tempered Glass",
    hardness: "9H",
    thickness: "0.2mm",
    features: [
      "Sapphire Coating",
      "No Camera Shadow",
      "Precise Cutouts",
      "Aluminum Ring",
    ],
    compatibility: [
      "iPhone 15 Pro Max",
      "iPhone 14 Pro Max",
      "Samsung S24 Ultra",
    ],
    privacy: false,
    antiBlueLight: false,
    matte: false,
  },
  {
    id: "sp8",
    name: "Full Body Screen Shield",
    brand: "ArmorLux",
    price: 2499,
    originalPrice: 3499,
    rating: 5,
    reviews: 112,
    badge: "new",
    badgeLabel: "New",
    inStock: 28,
    material: "Hybrid Glass",
    hardness: "9H",
    thickness: "0.33mm",
    features: [
      "Front + Back Protection",
      "Camera Protection",
      "Edge Coverage",
      "Lifetime Warranty",
    ],
    compatibility: ["iPhone 15 Pro Max", "Samsung S24 Ultra"],
    privacy: false,
    antiBlueLight: false,
    matte: false,
  },
  {
    id: "sp9",
    name: "Military Grade Shield",
    brand: "ArmorX",
    price: 2999,
    originalPrice: 3999,
    rating: 5,
    reviews: 76,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 22,
    material: "Tempered Glass",
    hardness: "9H",
    thickness: "0.5mm",
    features: [
      "Military Grade Drop Protection",
      "Shock Absorption",
      "Edge Reinforcement",
    ],
    compatibility: ["iPhone 15 Pro Max", "Samsung S24 Ultra", "Pixel 8 Pro"],
    privacy: false,
    antiBlueLight: false,
    matte: false,
  },
  {
    id: "sp10",
    name: "Eco-Friendly Bamboo Glass",
    brand: "EcoLux",
    price: 1899,
    originalPrice: 2599,
    rating: 4,
    reviews: 45,
    badge: "new",
    badgeLabel: "New",
    inStock: 32,
    material: "Tempered Glass",
    hardness: "9H",
    thickness: "0.3mm",
    features: [
      "Sustainable Materials",
      "Biodegradable Packaging",
      "99% Clarity",
    ],
    compatibility: ["iPhone 15 Series", "Samsung S24 Series"],
    privacy: false,
    antiBlueLight: false,
    matte: false,
  },
  {
    id: "sp11",
    name: "Privacy + Anti-Blue Light",
    brand: "SecureLux",
    price: 2999,
    originalPrice: 3999,
    rating: 4,
    reviews: 98,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 18,
    material: "Tempered Glass",
    hardness: "9H",
    thickness: "0.33mm",
    features: [
      "Privacy Filter",
      "Blue Light Blocking",
      "Anti-Spy",
      "2-in-1 Protection",
    ],
    compatibility: ["iPhone 15 Pro", "iPhone 15 Pro Max", "Samsung S24 Ultra"],
    privacy: true,
    antiBlueLight: true,
    matte: false,
  },
  {
    id: "sp12",
    name: "Liquid Glass Nano Coating",
    brand: "NanoLux",
    price: 3499,
    originalPrice: 4499,
    rating: 4,
    reviews: 67,
    inStock: 42,
    material: "Nano Liquid",
    hardness: "9H",
    thickness: "0.001mm",
    features: [
      "Invisible Protection",
      "Germ Resistant",
      "Scratch Resistant",
      "Easy Apply",
    ],
    compatibility: ["All Smartphones", "Watches", "Tablets"],
    privacy: false,
    antiBlueLight: false,
    matte: false,
  },
  {
    id: "sp13",
    name: "Foldable Screen Protector",
    brand: "FoldLux",
    price: 3999,
    originalPrice: 5499,
    rating: 4,
    reviews: 34,
    badge: "new",
    badgeLabel: "New",
    inStock: 15,
    material: "UTG + PET",
    hardness: "6H",
    thickness: "0.2mm",
    features: [
      "Foldable Phone Compatible",
      "Crease Resistance",
      "Full Coverage",
    ],
    compatibility: ["Samsung Z Fold 5", "Samsung Z Flip 5", "Pixel Fold"],
    privacy: false,
    antiBlueLight: false,
    matte: false,
  },
  {
    id: "sp14",
    name: "Anti-Fingerprint Clear Glass",
    brand: "Aurexia",
    price: 1199,
    originalPrice: 1699,
    rating: 4,
    reviews: 156,
    inStock: 95,
    material: "Tempered Glass",
    hardness: "9H",
    thickness: "0.3mm",
    features: [
      "Oleophobic Coating",
      "Anti-Fingerprint",
      "Bubble-Free",
      "Easy Install",
    ],
    compatibility: ["iPhone 15 Series", "Samsung S24 Series", "Pixel 8 Series"],
    privacy: false,
    antiBlueLight: false,
    matte: false,
  },
  {
    id: "sp15",
    name: "PaperTouch Screen Protector",
    brand: "ArtLux",
    price: 1699,
    originalPrice: 2299,
    rating: 4,
    reviews: 88,
    badge: "new",
    badgeLabel: "New",
    inStock: 45,
    material: "Matte PET",
    hardness: "4H",
    thickness: "0.15mm",
    features: [
      "Paper-Like Texture",
      "Smooth Drawing",
      "No Glare",
      "Apple Pencil Compatible",
    ],
    compatibility: ["iPad Pro", "iPad Air", "iPad Mini", "Samsung Tab"],
    privacy: false,
    antiBlueLight: false,
    matte: true,
  },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const MATERIAL_FILTERS = [
  { value: "", label: "All Materials" },
  { value: "Tempered Glass", label: "Tempered Glass" },
  { value: "Hydrogel TPU", label: "Hydrogel Film" },
  { value: "Nano Liquid", label: "Liquid Glass" },
  { value: "Hybrid Glass", label: "Hybrid Glass" },
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
    active: true,
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
function ScreenProtectorPlaceholder() {
  return (
    <div className="st-card-img-placeholder">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M12 5v14" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ── Main Page ── */
export default function ScreenProtectorsPage() {
  const { addToCart } = useCartStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [materialFilter, setMaterialFilter] = useState("");
  const [privacyFilter, setPrivacyFilter] = useState(false);
  const [blueLightFilter, setBlueLightFilter] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({
    show: false,
    msg: "",
  });

  const filtered = useMemo(() => {
    let list = [...SCREEN_PROTECTORS];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.material.toLowerCase().includes(q) ||
          p.features?.some((f) => f.toLowerCase().includes(q))
      );
    }

    if (materialFilter) {
      list = list.filter((p) => p.material === materialFilter);
    }

    if (privacyFilter) {
      list = list.filter((p) => p.privacy === true);
    }

    if (blueLightFilter) {
      list = list.filter((p) => p.antiBlueLight === true);
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
  }, [search, sort, materialFilter, privacyFilter, blueLightFilter]);

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2000);
  };

  const handleAddToCart = (product: Product) => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: `${product.brand} ${product.material} - ${
        product.hardness || "9H"
      } Hardness`,
      price: product.price,
      original_price: product.originalPrice,
      category: "Accessories",
      subcategory: "Screen Protectors",
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
          Screen <em>Protectors</em>
        </h1>
        <p className="st-hero-sub">
          Crystal clear protection for your device's most valuable asset. From
          military-grade tempered glass to privacy shields and blue light
          blockers.
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
              placeholder="Search screen protectors by brand, material, feature..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Row */}
          <div className="st-filter-row">
            <select
              className="st-filter-select"
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
            >
              {MATERIAL_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <button
              className={`st-filter-btn${privacyFilter ? " active" : ""}`}
              onClick={() => setPrivacyFilter(!privacyFilter)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="12"
                height="12"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Privacy
            </button>

            <button
              className={`st-filter-btn${blueLightFilter ? " active" : ""}`}
              onClick={() => setBlueLightFilter(!blueLightFilter)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="12"
                height="12"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
              Blue Light
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
            <em>{filtered.length}</em> Screen Protectors
          </span>
        </div>

        {/* Section Label */}
        <div className="st-section-label">
          <h2 className="st-section-title">
            Crystal Clear <em>Protection</em>
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
            <h3 className="st-empty-title">No screen protectors found</h3>
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
                    <ScreenProtectorPlaceholder />

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
                      <span className="st-badge st-badge--material">
                        {product.material}
                      </span>
                      {product.hardness && (
                        <span className="st-badge st-badge--hardness">
                          {product.hardness}
                        </span>
                      )}
                      {product.privacy && (
                        <span className="st-badge st-badge--privacy">
                          Privacy
                        </span>
                      )}
                      {product.antiBlueLight && (
                        <span className="st-badge st-badge--blue">
                          Blue Light
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

                    {/* Thickness & Hardness */}
                    <div className="st-card-specs-row">
                      {product.thickness && (
                        <span className="st-card-thickness">
                          📏 {product.thickness}
                        </span>
                      )}
                      {product.hardness && (
                        <span className="st-card-hardness">
                          💎 {product.hardness}
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

                    {/* Compatibility */}
                    {product.compatibility && (
                      <div className="st-card-compatibility">
                        <span className="st-comp-label">Compatible:</span>
                        <span className="st-comp-value">
                          {product.compatibility.slice(0, 2).join(", ")}
                          {product.compatibility.length > 2 && "..."}
                        </span>
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
        .st-card-specs-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.3rem 0;
        }
        .st-card-thickness,
        .st-card-hardness {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.55rem;
          font-weight: 400;
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
        .st-card-compatibility {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin: 0.3rem 0;
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.5rem;
          letter-spacing: 0.05em;
        }
        .st-comp-label {
          color: rgba(245, 240, 232, 0.3);
        }
        .st-comp-value {
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
        .st-badge--material {
          background: rgba(184, 150, 62, 0.15);
          color: #b8963e;
        }
        .st-badge--hardness {
          background: rgba(100, 150, 200, 0.15);
          color: #6496c8;
        }
        .st-badge--privacy {
          background: rgba(150, 100, 200, 0.15);
          color: #9664c8;
        }
        .st-badge--blue {
          background: rgba(80, 180, 200, 0.15);
          color: #50b4c8;
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
