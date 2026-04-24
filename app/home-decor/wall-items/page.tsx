"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import "@/app/styles/store.css";

/* ── Types ── */
interface WallItemProduct {
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
  dimensions?: string;
  material?: string;
  color?: string;
  features?: string[];
  mounting?: string;
  weight?: string;
}

/* ── Wall Items Data ── */
const WALL_ITEMS: WallItemProduct[] = [
  {
    id: "wi1",
    name: "Abstract Canvas Art Set",
    brand: "Aurexia",
    price: 12999,
    originalPrice: 17999,
    rating: 5,
    reviews: 342,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 18,
    type: "Canvas Art",
    dimensions: "24x36 inches",
    material: "Canvas + Wood Frame",
    color: "Gold/Black/White",
    features: [
      "Hand-painted",
      "Gallery Wrapped",
      "Ready to Hang",
      "Certificate Included",
    ],
    mounting: "Sawtooth hanger included",
    weight: "1.8kg",
  },
  {
    id: "wi2",
    name: "Geometric Wall Mirror",
    brand: "Aurexia",
    price: 8999,
    originalPrice: 12999,
    rating: 5,
    reviews: 178,
    badge: "new",
    badgeLabel: "New",
    inStock: 25,
    type: "Mirror",
    dimensions: "20x20 inches",
    material: "Glass + Metal Frame",
    color: "Gold",
    features: [
      "Geometric Design",
      "Beveled Edge",
      "Wall Mounted",
      "Modern Look",
    ],
    mounting: "Wall hooks included",
    weight: "2.2kg",
  },
  {
    id: "wi3",
    name: "Wooden Wall Clock",
    brand: "TimeLux",
    price: 6499,
    originalPrice: 8999,
    rating: 4,
    reviews: 567,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 42,
    type: "Wall Clock",
    dimensions: "12 inches diameter",
    material: "Wood + Metal",
    color: "Walnut",
    features: [
      "Silent Movement",
      "Battery Operated",
      "Modern Design",
      "Easy Install",
    ],
    mounting: "Keyhole mount",
    weight: "850g",
  },
  {
    id: "wi4",
    name: "Metal Wall Sculpture",
    brand: "ArtLux",
    price: 15999,
    originalPrice: 21999,
    rating: 4,
    reviews: 94,
    badge: "new",
    badgeLabel: "New",
    inStock: 12,
    type: "Sculpture",
    dimensions: "30x15x5 inches",
    material: "Iron + Gold Finish",
    color: "Black/Gold",
    features: ["Handcrafted", "3D Effect", "Indoor/Outdoor", "Unique Design"],
    mounting: "Screws and anchors included",
    weight: "3.2kg",
  },
  {
    id: "wi5",
    name: "Tapestry Mandala",
    brand: "BohoLux",
    price: 4499,
    originalPrice: 6499,
    rating: 4,
    reviews: 234,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 38,
    type: "Tapestry",
    dimensions: "50x60 inches",
    material: "Cotton",
    color: "Multi-color",
    features: ["Boho Design", "Lightweight", "Washable", "Versatile Use"],
    mounting: "Rod pocket + clips included",
    weight: "320g",
  },
  {
    id: "wi6",
    name: "Floating Shelves Set",
    brand: "Aurexia",
    price: 7999,
    originalPrice: 10999,
    rating: 5,
    reviews: 89,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 32,
    type: "Shelves",
    dimensions: "24x6x2 inches (set of 3)",
    material: "Wood + Metal Brackets",
    color: "Walnut/Black",
    features: [
      "Floating Design",
      "Hidden Brackets",
      "Heavy Duty",
      "Easy Install",
    ],
    mounting: "Screws and anchors included",
    weight: "2.5kg set",
  },
  {
    id: "wi7",
    name: "Framed Botanical Prints",
    brand: "Aurexia",
    price: 5499,
    originalPrice: 7499,
    rating: 4,
    reviews: 203,
    inStock: 45,
    type: "Framed Art",
    dimensions: "11x14 inches (set of 4)",
    material: "Paper + Glass + Wood Frame",
    color: "Green/Gold",
    features: ["Set of 4", "Matte Finish", "Ready to Hang", "Botanical Theme"],
    mounting: "Sawtooth hangers included",
    weight: "1.2kg set",
  },
  {
    id: "wi8",
    name: "Macrame Wall Hanging",
    brand: "BohoChic",
    price: 3999,
    originalPrice: 5499,
    rating: 5,
    reviews: 112,
    badge: "new",
    badgeLabel: "New",
    inStock: 28,
    type: "Macrame",
    dimensions: "20x40 inches",
    material: "Cotton Rope + Wood Dowel",
    color: "Natural White",
    features: ["Handmade", "Boho Style", "Unique Pattern", "Lightweight"],
    mounting: "Wood dowel + hanging rope",
    weight: "450g",
  },
  {
    id: "wi9",
    name: "Wall Decal Quote",
    brand: "DecalLux",
    price: 1499,
    originalPrice: 2499,
    rating: 4,
    reviews: 456,
    inStock: 120,
    type: "Wall Decal",
    dimensions: "24x12 inches",
    material: "Vinyl",
    color: "Gold",
    features: ["Removable", "Repositionable", "Bubble-Free", "5 year warranty"],
    mounting: "Peel and stick application",
    weight: "50g",
  },
  {
    id: "wi10",
    name: "Battery Operated Wall Lamp",
    brand: "LightLux",
    price: 3499,
    originalPrice: 4999,
    rating: 5,
    reviews: 345,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 55,
    type: "Wall Lamp",
    dimensions: "8x8x4 inches",
    material: "Metal + Glass",
    color: "Antique Brass",
    features: ["Wireless", "Remote Control", "Dimmable", "Timer Function"],
    mounting: "Screws and anchors included",
    weight: "680g",
  },
  {
    id: "wi11",
    name: "Vinyl Record Frame",
    brand: "FrameLux",
    price: 2999,
    originalPrice: 3999,
    rating: 4,
    reviews: 278,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 62,
    type: "Record Frame",
    dimensions: "13x13 inches",
    material: "Wood + Glass",
    color: "Black",
    features: [
      "Holds 1 Album",
      "UV Protection",
      "Wall or Table",
      "Easy Open Back",
    ],
    mounting: "Sawtooth hanger included",
    weight: "380g",
  },
  {
    id: "wi12",
    name: "3D Wall Panels",
    brand: "DesignLux",
    price: 12999,
    originalPrice: 17999,
    rating: 4,
    reviews: 67,
    badge: "new",
    badgeLabel: "New",
    inStock: 22,
    type: "Wall Panels",
    dimensions: "20x20 inches (set of 6)",
    material: "PVC",
    color: "White",
    features: [
      "DIY Installation",
      "Sound Absorbing",
      "Paintable",
      "Modern Texture",
    ],
    mounting: "Adhesive included",
    weight: "2.8kg set",
  },
  {
    id: "wi13",
    name: "Key Holder Wall Organizer",
    brand: "OrganizeLux",
    price: 2499,
    originalPrice: 3499,
    rating: 4,
    reviews: 189,
    inStock: 48,
    type: "Organizer",
    dimensions: "12x4x1 inches",
    material: "Wood + Metal Hooks",
    color: "Brown",
    features: ["4 Hooks", "Mail Slot", "Small Shelf", "Mounting Hardware"],
    mounting: "Screws and anchors included",
    weight: "420g",
  },
  {
    id: "wi14",
    name: "Felt Letter Board",
    brand: "LetterLux",
    price: 1999,
    originalPrice: 2999,
    rating: 5,
    reviews: 234,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 85,
    type: "Message Board",
    dimensions: "12x16 inches",
    material: "Felt + Plastic Frame",
    color: "Black/White",
    features: ["Includes Letters", "Stand or Wall", "Customizable", "Gift Box"],
    mounting: "Sawtooth hanger + stand",
    weight: "350g",
  },
  {
    id: "wi15",
    name: "Ceramic Wall Art",
    brand: "ArtisanLux",
    price: 8999,
    originalPrice: 12999,
    rating: 5,
    reviews: 45,
    badge: "new",
    badgeLabel: "New",
    inStock: 15,
    type: "Ceramic Art",
    dimensions: "10x10 inches (set of 3)",
    material: "Ceramic",
    color: "Blue/White",
    features: ["Handcrafted", "Glossy Finish", "Unique Pattern", "Gift Boxed"],
    mounting: "Keyhole mounts on back",
    weight: "1.5kg set",
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
  { href: "/home-decor/decorative-lights", label: "Decorative Lights" },
  { href: "/home-decor/wall-items", label: "Wall Items", active: true },
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
function WallItemPlaceholder() {
  return (
    <div className="st-card-img-placeholder">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    </div>
  );
}

/* ── Main Page ── */
export default function WallItemsPage() {
  const { addToCart } = useCartStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({
    show: false,
    msg: "",
  });

  const filtered = useMemo(() => {
    let list = [...WALL_ITEMS];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.type?.toLowerCase().includes(q) ||
          p.material?.toLowerCase().includes(q) ||
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

  const handleAddToCart = (product: WallItemProduct) => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: `${product.brand} ${product.type || "Wall Item"} - ${
        product.dimensions || ""
      }`,
      price: product.price,
      original_price: product.originalPrice,
      category: "Home Decor",
      subcategory: "Wall Items",
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
          Wall <em>Items</em>
        </h1>
        <p className="st-hero-sub">
          Transform your walls into a gallery with our curated collection of
          art, mirrors, clocks, and decorative accents — every wall tells a
          story.
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
              placeholder="Search wall items by type, material, color..."
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
            <em>{filtered.length}</em> Wall Items
          </span>
        </div>

        {/* Section Label */}
        <div className="st-section-label">
          <h2 className="st-section-title">
            Art on <em>Your Walls</em>
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
            <h3 className="st-empty-title">No wall items found</h3>
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
                    <WallItemPlaceholder />

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

                    {/* Type & Material */}
                    <div className="st-card-specs-row">
                      {product.type && (
                        <span className="st-card-type">{product.type}</span>
                      )}
                      {product.material && (
                        <span className="st-card-material">
                          🪵 {product.material}
                        </span>
                      )}
                    </div>

                    {/* Dimensions & Color */}
                    <div className="st-card-details">
                      {product.dimensions && (
                        <span className="st-card-dimensions">
                          📏 {product.dimensions}
                        </span>
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

                    {/* Mounting Info */}
                    {product.mounting && (
                      <div className="st-card-mounting">
                        <span>🔨 {product.mounting}</span>
                      </div>
                    )}

                    {/* Weight */}
                    {product.weight && (
                      <div className="st-card-weight">
                        <span>⚖️ {product.weight}</span>
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
        .st-card-material {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.55rem;
          font-weight: 300;
          letter-spacing: 0.05em;
          color: rgba(245, 240, 232, 0.5);
        }
        .st-card-details {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.3rem 0;
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.52rem;
          letter-spacing: 0.05em;
          flex-wrap: wrap;
        }
        .st-card-dimensions {
          color: rgba(184, 150, 62, 0.7);
        }
        .st-card-color {
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
        .st-card-mounting {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.52rem;
          letter-spacing: 0.05em;
          color: rgba(184, 150, 62, 0.7);
          margin: 0.3rem 0;
        }
        .st-card-weight {
          font-family: var(--st-sans, "Josefin Sans", sans-serif);
          font-size: 0.52rem;
          letter-spacing: 0.05em;
          color: rgba(245, 240, 232, 0.5);
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
