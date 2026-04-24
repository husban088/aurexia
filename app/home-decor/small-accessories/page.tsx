"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import "@/app/styles/store.css";

/* ── Types ── */
interface HomeAccessoryProduct {
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
  material?: string;
  dimensions?: string;
  color?: string;
  features?: string[];
  careInstructions?: string;
  weight?: string;
}

/* ── Home Accessories Data ── */
const HOME_ACCESSORIES: HomeAccessoryProduct[] = [
  {
    id: "ha1",
    name: "Luxury Marble Coaster Set",
    brand: "Aurexia",
    price: 2499,
    originalPrice: 3499,
    rating: 5,
    reviews: 342,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 45,
    type: "Coasters",
    material: "Marble + Cork",
    dimensions: "4x4 inches",
    color: "White/Gold",
    features: [
      "Set of 6",
      "Gold Foil Edge",
      "Non-Slip Cork Base",
      "Luxury Gift Box",
    ],
    careInstructions: "Wipe clean with soft cloth",
    weight: "450g",
  },
  {
    id: "ha2",
    name: "Aromatic Candle Set",
    brand: "Aurexia",
    price: 3999,
    originalPrice: 5499,
    rating: 5,
    reviews: 178,
    badge: "new",
    badgeLabel: "New",
    inStock: 28,
    type: "Candles",
    material: "Soy Wax + Glass",
    dimensions: "3x3x4 inches",
    color: "Ivory",
    features: [
      "Lavender Scent",
      "40 Hours Burn Time",
      "Wooden Wick",
      "Hand-Poured",
    ],
    careInstructions: "Trim wick before each use",
    weight: "380g",
  },
  {
    id: "ha3",
    name: "Velvet Throw Pillow",
    brand: "Aurexia",
    price: 4499,
    originalPrice: 6499,
    rating: 4,
    reviews: 567,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 62,
    type: "Pillows",
    material: "Velvet + Polyester Fill",
    dimensions: "18x18 inches",
    color: "Emerald Green",
    features: [
      "Luxury Velvet",
      "Hidden Zipper",
      "Machine Washable",
      "Gold Trim",
    ],
    careInstructions: "Spot clean or dry clean",
    weight: "550g",
  },
  {
    id: "ha4",
    name: "Ceramic Vase Set",
    brand: "HomeLux",
    price: 5499,
    originalPrice: 7499,
    rating: 4,
    reviews: 94,
    badge: "new",
    badgeLabel: "New",
    inStock: 22,
    type: "Vases",
    material: "Ceramic",
    dimensions: "8, 10, 12 inches",
    color: "Matte White",
    features: ["Set of 3", "Handcrafted", "Organic Shape", "Modern Design"],
    careInstructions: "Hand wash only",
    weight: "1.2kg",
  },
  {
    id: "ha5",
    name: "Bamboo Storage Box",
    brand: "EcoLux",
    price: 3499,
    originalPrice: 4999,
    rating: 4,
    reviews: 234,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 38,
    type: "Storage",
    material: "Bamboo",
    dimensions: "12x8x4 inches",
    color: "Natural Bamboo",
    features: ["Eco-Friendly", "Airtight Lid", "Multi-Purpose", "Stackable"],
    careInstructions: "Wipe with damp cloth",
    weight: "800g",
  },
  {
    id: "ha6",
    name: "Gold Metal Bookends",
    brand: "Aurexia",
    price: 2999,
    originalPrice: 3999,
    rating: 5,
    reviews: 89,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 35,
    type: "Bookends",
    material: "Metal + Gold Finish",
    dimensions: "5x4x6 inches",
    color: "Gold",
    features: ["Heavy Duty", "Non-Skid Base", "Modern Design", "Gift Box"],
    careInstructions: "Dust with soft cloth",
    weight: "650g",
  },
  {
    id: "ha7",
    name: "Decorative Tray",
    brand: "Aurexia",
    price: 3999,
    originalPrice: 5999,
    rating: 4,
    reviews: 203,
    inStock: 42,
    type: "Trays",
    material: "Wood + Marble",
    dimensions: "14x8x2 inches",
    color: "Walnut/White",
    features: [
      "Serving Tray",
      "Handle Cutouts",
      "Multi-Purpose",
      "Luxury Gift",
    ],
    careInstructions: "Hand wash, dry immediately",
    weight: "950g",
  },
  {
    id: "ha8",
    name: "Faux Fur Throw Blanket",
    brand: "CozyLux",
    price: 9999,
    originalPrice: 14999,
    rating: 5,
    reviews: 112,
    badge: "new",
    badgeLabel: "New",
    inStock: 18,
    type: "Blankets",
    material: "Faux Fur + Sherpa",
    dimensions: "50x60 inches",
    color: "Cream White",
    features: ["Ultra Soft", "Luxury Texture", "Machine Washable", "Gift Box"],
    careInstructions: "Machine wash cold, tumble dry low",
    weight: "1.2kg",
  },
  {
    id: "ha9",
    name: "Wall Clock Modern",
    brand: "TimeLux",
    price: 5999,
    originalPrice: 8499,
    rating: 4,
    reviews: 156,
    inStock: 25,
    type: "Clocks",
    material: "Metal + Glass",
    dimensions: "12 inches diameter",
    color: "Black/Gold",
    features: [
      "Silent Movement",
      "Battery Operated",
      "Easy Install",
      "Modern Design",
    ],
    careInstructions: "Dust with soft cloth",
    weight: "550g",
  },
  {
    id: "ha10",
    name: "Silk Plant Artificial",
    brand: "GreenLux",
    price: 7999,
    originalPrice: 10999,
    rating: 5,
    reviews: 345,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 32,
    type: "Plants",
    material: "Silk + Plastic Pot",
    dimensions: "24 inches tall",
    color: "Green",
    features: [
      "Realistic Look",
      "No Maintenance",
      "UV Resistant",
      "Ceramic Pot",
    ],
    careInstructions: "Dust with feather duster",
    weight: "850g",
  },
  {
    id: "ha11",
    name: "Bath Mat Set",
    brand: "BathLux",
    price: 3499,
    originalPrice: 4999,
    rating: 4,
    reviews: 278,
    badge: "sale",
    badgeLabel: "Sale",
    inStock: 55,
    type: "Bathroom",
    material: "Cotton",
    dimensions: "20x30 + 17x24 inches",
    color: "Charcoal Gray",
    features: [
      "2-Piece Set",
      "Absorbent",
      "Machine Washable",
      "Non-Slip Backing",
    ],
    careInstructions: "Machine wash warm, tumble dry",
    weight: "750g",
  },
  {
    id: "ha12",
    name: "Kitchen Utensil Set",
    brand: "KitchenLux",
    price: 6499,
    originalPrice: 8999,
    rating: 4,
    reviews: 67,
    badge: "new",
    badgeLabel: "New",
    inStock: 28,
    type: "Kitchenware",
    material: "Silicone + Wood",
    color: "Teal",
    features: [
      "8-Piece Set",
      "Heat Resistant",
      "Non-Scratch",
      "Utensil Holder",
    ],
    careInstructions: "Dishwasher safe",
    weight: "680g",
  },
  {
    id: "ha13",
    name: "Photo Frame Collage",
    brand: "FrameLux",
    price: 4999,
    originalPrice: 6999,
    rating: 4,
    reviews: 189,
    inStock: 38,
    type: "Frames",
    material: "Wood + Glass",
    dimensions: "20x16 inches",
    color: "Black",
    features: ["11 Openings", "Wall or Table", "Matte Finish", "Easy Mount"],
    careInstructions: "Glass cleaner for glass, dust frame",
    weight: "1.1kg",
  },
  {
    id: "ha14",
    name: "Aromatherapy Diffuser",
    brand: "AromaSphere",
    price: 8999,
    originalPrice: 12999,
    rating: 5,
    reviews: 234,
    badge: "featured",
    badgeLabel: "Featured",
    inStock: 22,
    type: "Diffusers",
    material: "Ceramic + Wood",
    dimensions: "5x5x6 inches",
    color: "White Ash",
    features: ["Ultrasonic", "LED Lights", "8 Hours Runtime", "Auto Shut-off"],
    careInstructions: "Clean weekly with water/vinegar",
    weight: "420g",
  },
  {
    id: "ha15",
    name: "Magazine Rack",
    brand: "Aurexia",
    price: 6999,
    originalPrice: 9999,
    rating: 5,
    reviews: 45,
    badge: "new",
    badgeLabel: "New",
    inStock: 15,
    type: "Storage",
    material: "Leather + Metal",
    dimensions: "14x10x12 inches",
    color: "Brown",
    features: [
      "Premium Leather",
      "Sturdy Frame",
      "Portable",
      "Multi-Compartment",
    ],
    careInstructions: "Wipe with leather cleaner",
    weight: "1.4kg",
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
  { href: "/home-decor/wall-items", label: "Wall Items" },
  {
    href: "/home-decor/home-accessories",
    label: "Home Accessories",
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
function AccessoryPlaceholder() {
  return (
    <div className="st-card-img-placeholder">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
      >
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    </div>
  );
}

/* ── Main Page ── */
export default function HomeAccessoriesPage() {
  const { addToCart } = useCartStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({
    show: false,
    msg: "",
  });

  const filtered = useMemo(() => {
    let list = [...HOME_ACCESSORIES];
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

  const handleAddToCart = (product: HomeAccessoryProduct) => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: `${product.brand} ${product.type || "Home Accessory"} - ${
        product.material || ""
      }`,
      price: product.price,
      original_price: product.originalPrice,
      category: "Home Decor",
      subcategory: "Home Accessories",
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
          Home <em>Accessories</em>
        </h1>
        <p className="st-hero-sub">
          Elegant accents and thoughtful details that transform your house into
          a home — from cozy throws and decorative vases to functional storage
          solutions.
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
              placeholder="Search accessories by name, type, material..."
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
            <em>{filtered.length}</em> Accessories
          </span>
        </div>

        {/* Section Label */}
        <div className="st-section-label">
          <h2 className="st-section-title">
            Elegant <em>Accents</em>
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
            <h3 className="st-empty-title">No accessories found</h3>
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
                    <AccessoryPlaceholder />

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

                    {/* Color & Dimensions */}
                    <div className="st-card-details">
                      {product.color && (
                        <span className="st-card-color">
                          🎨 {product.color}
                        </span>
                      )}
                      {product.dimensions && (
                        <span className="st-card-dimensions">
                          📏 {product.dimensions}
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

                    {/* Weight */}
                    {product.weight && (
                      <div className="st-card-weight">
                        <span>⚖️ Weight: {product.weight}</span>
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
        .st-card-color {
          color: rgba(245, 240, 232, 0.5);
        }
        .st-card-dimensions {
          color: rgba(184, 150, 62, 0.7);
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
