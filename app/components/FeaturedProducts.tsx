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
import { useCurrency } from "../context/CurrencyContext";
import QuickView from "./QuickView";

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
  description: string | null;
}

const TABS = [
  { key: "Accessories", label: "Accessories", href: "/accessories" },
  { key: "Watches", label: "Watches", href: "/watches" },
  { key: "Automotive", label: "Automotive", href: "/automotive" },
  { key: "Home Decor", label: "Home Decor", href: "/home-decor" },
];

function ProductCard({
  product,
  onQuickView,
}: {
  product: FeaturedProduct;
  onQuickView: (product: FeaturedProduct) => void;
}) {
  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) *
            100
        )
      : null;

  const { addToCart } = useCartStore();
  const { formatPrice } = useCurrency();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      ...product,
      description: product.description || "",
      brand: product.brand || "",
      specs: {},
      created_at: new Date().toISOString(),
      rating: 0,
      reviews_count: 0,
    });
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView(product);
  };

  return (
    <Link href={`/product/${product.id}`} className="fp-card">
      <div className="fp-card-img">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} />
        ) : (
          <div className="fp-card-placeholder">
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
        )}

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

        {/* Always Visible Icon Buttons */}
        <div className="fp-icon-buttons">
          <button
            className="fp-icon-btn fp-icon-btn--view"
            onClick={handleQuickViewClick}
            aria-label="Quick View"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z" />
            </svg>
          </button>
          <button
            className="fp-icon-btn fp-icon-btn--cart"
            onClick={handleAddToCart}
            aria-label="Add to Cart"
            disabled={product.stock === 0}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </button>
        </div>
      </div>

      <div className="fp-card-body">
        {product.brand && <p className="fp-card-brand">{product.brand}</p>}
        <h3 className="fp-card-name">{product.name}</h3>
        <div className="fp-card-price-row">
          <span className="fp-card-price">{formatPrice(product.price)}</span>
          {product.original_price && product.original_price > product.price && (
            <span className="fp-card-orig">
              {formatPrice(product.original_price)}
            </span>
          )}
          {discount && discount > 0 && (
            <span className="fp-card-discount">-{discount}%</span>
          )}
        </div>
        <div
          className={`fp-card-stock ${
            product.stock === 0 ? "out" : product.stock < 5 ? "low" : ""
          }`}
        >
          {product.stock === 0
            ? "Out of Stock"
            : product.stock < 5
            ? `Only ${product.stock} left`
            : "In Stock"}
        </div>
      </div>

      <div className="fp-card-line" />
    </Link>
  );
}

export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState("Accessories");
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] =
    useState<FeaturedProduct | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const swiperRef = useRef<SwiperType | null>(null);

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
        if (error) setProducts([]);
        else setProducts(data || []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (swiperRef.current) swiperRef.current.update();
  }, [products]);

  const handleQuickView = (product: FeaturedProduct) => {
    setQuickViewProduct(product);
    setQuickViewOpen(true);
  };

  const activeTabData = TABS.find((t) => t.key === activeTab);

  return (
    <>
      <section className="fp-section">
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
            Handpicked luxury essentials across our finest categories
          </p>

          <div className="fp-tabs" style={{ marginTop: "2rem" }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`fp-tab${
                  activeTab === tab.key ? " fp-tab--active" : ""
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="fp-container">
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

          {loading ? (
            <div className="fp-swiper" style={{ display: "flex", gap: "1px" }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="fp-card fp-card--skeleton">
                  <div className="fp-card-img fp-skel-img" />
                  <div className="fp-card-body">
                    <div className="fp-skel-line" style={{ width: "40%" }} />
                    <div
                      className="fp-skel-line"
                      style={{ width: "80%", height: "1.1rem" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="fp-empty">
              <p>No featured products in this category</p>
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
              navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
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
                  <ProductCard
                    product={product}
                    onQuickView={handleQuickView}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          )}

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

      {/* Quick View Modal */}
      <QuickView
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        product={quickViewProduct}
      />
    </>
  );
}
