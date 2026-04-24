"use client";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, A11y } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import "@/app/styles/featured-products.css";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/cartStore";

/* ── Supabase Product Type (matches actual DB response) ── */
interface FeaturedProduct {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  original_price: number | null;
  category: string;
  subcategory: string;
  images: string[];
  stock: number;
  condition: string;
  is_featured: boolean;
  is_active: boolean;
  description: string | null; // ← Fixed: can be null
  specs: Record<string, string>;
  created_at: string;
}

/* ── Tabs — key must exactly match Supabase `category` column ── */
const TABS = [
  {
    key: "Accessories",
    label: "Mobile Accessories",
    href: "/accessories",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12" y2="18.01" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "Gadgets",
    label: "Gadgets",
    href: "/gadgets",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
    ),
  },
  {
    key: "Home Decor",
    label: "Home Decor",
    href: "/home-decor",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

/* ── Product Card ── */
function ProductCard({ product }: { product: FeaturedProduct }) {
  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) *
            100
        )
      : null;

  const { addToCart } = useCartStore();

  // Convert FeaturedProduct to Product type for cart
  const handleAddToCart = () => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.price,
      original_price: product.original_price || undefined,
      category: product.category,
      subcategory: product.subcategory,
      images: product.images,
      stock: product.stock,
      brand: product.brand || "",
      condition: product.condition,
      is_featured: product.is_featured,
      is_active: product.is_active,
      specs: product.specs,
      created_at: product.created_at,
    };
    addToCart(cartProduct);
  };

  return (
    <Link href={`/product/${product.id}`} className="fp-card">
      {/* Image */}
      <div className="fp-card-img">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              (
                e.currentTarget.parentElement?.querySelector(
                  ".fp-card-placeholder"
                ) as HTMLElement | null
              )?.style.setProperty("display", "flex");
            }}
          />
        ) : null}

        {/* Placeholder — shown when no image or image fails */}
        <div
          className="fp-card-placeholder"
          style={{ display: product.images?.[0] ? "none" : "flex" }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>

        {/* Badges */}
        <div className="fp-card-badges">
          {product.is_featured && (
            <span className="fp-badge fp-badge--feat">Featured</span>
          )}
          {discount && discount > 0 && (
            <span className="fp-badge fp-badge--sale">-{discount}%</span>
          )}
          {product.condition === "new" && !discount && (
            <span className="fp-badge fp-badge--new">New</span>
          )}
        </div>

        {/* Quick Add Overlay */}
        <div className="fp-card-overlay">
          <button
            className="fp-overlay-btn"
            onClick={(e) => {
              e.preventDefault();
              handleAddToCart();
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6" />
            </svg>
            Add to Cart
          </button>
          <button
            className="fp-overlay-btn fp-overlay-btn--wish"
            onClick={(e) => {
              e.preventDefault();
              // Add your wishlist logic here
            }}
          >
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
      <div className="fp-card-body">
        {product.brand && <p className="fp-card-brand">{product.brand}</p>}
        <h3 className="fp-card-name">{product.name}</h3>
        {product.description && (
          <p className="fp-card-desc">{product.description}</p>
        )}
        <div className="fp-card-price-row">
          <span className="fp-card-price">
            PKR {product.price.toLocaleString()}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="fp-card-orig">
              PKR {product.original_price.toLocaleString()}
            </span>
          )}
          {discount && discount > 0 && (
            <span className="fp-card-discount">-{discount}%</span>
          )}
        </div>
      </div>

      {/* Footer — stock status */}
      <div className="fp-card-foot">
        <div className="fp-card-rating">
          <span
            className={`fp-stock-badge${
              product.stock === 0 ? " out" : product.stock < 5 ? " low" : " in"
            }`}
          >
            {product.stock === 0
              ? "Out of stock"
              : product.stock < 5
              ? `Only ${product.stock} left`
              : "In stock"}
          </span>
        </div>
      </div>

      {/* Bottom line */}
      <div className="fp-card-line" />
    </Link>
  );
}

/* ── Skeleton loader ── */
function SkeletonCards() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="fp-card fp-card--skeleton">
          <div className="fp-card-img fp-skel-img" />
          <div className="fp-card-body">
            <div className="fp-skel-line" style={{ width: "40%" }} />
            <div
              className="fp-skel-line"
              style={{ width: "80%", height: "1.1rem" }}
            />
            <div className="fp-skel-line" style={{ width: "60%" }} />
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Main Component ── */
export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState("Accessories");
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [animKey, setAnimKey] = useState(0);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  /* ── Fetch featured products from Supabase on tab change ── */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .eq("category", activeTab)
        .order("created_at", { ascending: false })
        .limit(12);

      if (!cancelled) {
        if (error) {
          console.error("FeaturedProducts fetch error:", error.message);
          setProducts([]);
        } else {
          setProducts(data || []);
        }
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  /* ── Update Swiper when products change ── */
  useEffect(() => {
    if (swiperRef.current) {
      swiperRef.current.update();
    }
  }, [products]);

  function handleTabChange(key: string) {
    setActiveTab(key);
    setAnimKey((k) => k + 1);
  }

  const activeTabData = TABS.find((t) => t.key === activeTab);

  return (
    <section className="fp-section">
      {/* ── Header ── */}
      <div className="fp-header">
        <p className="fp-eyebrow">
          <span className="fp-ey-line" />
          Curated Selection
          <span className="fp-ey-line" />
        </p>
        <h2 className="fp-title">
          Featured <em>Products</em>
        </h2>
        <p className="fp-subtitle">
          Handpicked luxury essentials across our finest categories — crafted
          for those who demand the extraordinary.
        </p>

        {/* Decorative separator */}
        <div className="fp-deco-sep">
          <span className="fp-deco-line" />
          <span className="fp-deco-diamond" />
          <span className="fp-deco-line" />
        </div>

        {/* Tabs */}
        <div className="fp-tabs" style={{ marginTop: "2rem" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`fp-tab${
                activeTab === tab.key ? " fp-tab--active" : ""
              }`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Products Swiper ── */}
      <div className="fp-container">
        {/* Nav arrows */}
        <div className="fp-nav">
          <button ref={prevRef} className="fp-nav-btn" aria-label="Previous">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button ref={nextRef} className="fp-nav-btn" aria-label="Next">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div key={animKey} className="fp-panel">
          {loading ? (
            /* Skeleton while loading */
            <div
              className="fp-swiper"
              style={{ display: "flex", gap: "1px", overflow: "hidden" }}
            >
              <SkeletonCards />
            </div>
          ) : products.length === 0 ? (
            /* Empty state - NO ICON, just simple text */
            <div className="fp-empty">
              <p>No products in this category</p>
            </div>
          ) : (
            <Swiper
              modules={[Pagination, Navigation, A11y]}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                if (
                  swiper.params.navigation &&
                  typeof swiper.params.navigation !== "boolean"
                ) {
                  swiper.params.navigation.prevEl = prevRef.current;
                  swiper.params.navigation.nextEl = nextRef.current;
                  swiper.navigation.init();
                  swiper.navigation.update();
                }
              }}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              pagination={{ clickable: true }}
              spaceBetween={1}
              slidesPerView={1}
              breakpoints={{
                480: { slidesPerView: 2, spaceBetween: 1 },
                768: { slidesPerView: 3, spaceBetween: 1 },
                1024: { slidesPerView: 4, spaceBetween: 1 },
              }}
              className="fp-swiper"
            >
              {products.map((product) => (
                <SwiperSlide key={product.id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        {/* View All Button */}
        <div className="fp-view-all-wrap">
          <Link href={activeTabData?.href || "/"} className="fp-view-all">
            <span>View All {activeTabData?.label}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
