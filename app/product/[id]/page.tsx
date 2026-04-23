"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { supabase, Product } from "@/lib/supabase";
import "@/app/styles/product-detail.css";
import { useCartStore } from "@/lib/cartStore";

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
type TabKey = "description" | "specs" | "shipping";

interface Toast {
  id: number;
  msg: string;
  type: "success" | "info";
  exiting?: boolean;
}

/* ═══════════════════════════════════════════
   TOAST HOOK
═══════════════════════════════════════════ */
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const show = useCallback((msg: string, type: Toast["type"] = "success") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        350
      );
    }, 2800);
  }, []);

  return { toasts, show };
}

/* ═══════════════════════════════════════════
   SKELETON
═══════════════════════════════════════════ */
function Skeleton() {
  return (
    <div className="pd-skeleton-root">
      <div className="pd-skel-grid">
        <div>
          <div className="pd-skel-img" />
          <div className="pd-skel-thumbs">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="pd-skel-thumb" />
            ))}
          </div>
        </div>
        <div style={{ paddingTop: "1rem" }}>
          {[70, 45, 100, 55, 80, 60, 90, 40].map((w, i) => (
            <div
              key={i}
              className="pd-skel-line"
              style={{ width: `${w}%`, height: i === 2 ? "2.5rem" : "1rem" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CATEGORY → ROUTE MAP
═══════════════════════════════════════════ */
const categoryRoute: Record<string, string> = {
  Accessories: "/accessories",
  Gadgets: "/gadgets",
  "Home Decor": "/home-decor",
};

const categoryLabel: Record<string, string> = {
  Accessories: "Mobile Accessories",
  Gadgets: "Gadgets",
  "Home Decor": "Home Décor",
};

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImg, setActiveImg] = useState(0);
  const [imgEntering, setImgEntering] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const [qty, setQty] = useState(1);
  const [wishlist, setWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("description");

  const { toasts, show: showToast } = useToast();

  /* ── Fetch product ── */
  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProduct(data);
      setLoading(false);

      /* Fetch related */
      const { data: rel } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("category", data.category)
        .neq("id", id)
        .limit(4);

      setRelated(rel || []);
    }

    load();
  }, [id]);

  /* ── Scroll reveal ── */
  useEffect(() => {
    const els = document.querySelectorAll(".pd-reveal");
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && e.target.classList.add("visible")
        ),
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [loading, product]);

  /* ── ESC closes lightbox ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── Image switch ── */
  function switchImg(idx: number) {
    if (idx === activeImg) return;
    setImgEntering(true);
    setTimeout(() => {
      setActiveImg(idx);
      setImgEntering(false);
    }, 80);
  }

  /* ── Helpers ── */
  const discount =
    product?.original_price && product.original_price > product.price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) *
            100
        )
      : 0;

  const savings =
    product?.original_price && product.original_price > product.price
      ? product.original_price - product.price
      : 0;

  const stockClass = !product
    ? ""
    : product.stock === 0
    ? "out"
    : product.stock < 5
    ? "low"
    : "in";

  const stockLabel = !product
    ? ""
    : product.stock === 0
    ? "Out of Stock"
    : product.stock < 5
    ? `Only ${product.stock} Left`
    : "In Stock";

  const { addToCart } = useCartStore();

  function handleAddToCart() {
    if (!product || product.stock === 0) return;
    addToCart(product, qty);
    showToast(`${qty} × ${product.name} added to cart`, "success");
  }

  /* ═══════════════════════════════════════════
     RENDER STATES
  ═══════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="pd-root">
        <div className="pd-ambient" aria-hidden="true" />
        <div className="pd-grain" aria-hidden="true" />
        <Skeleton />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="pd-root">
        <div className="pd-ambient" aria-hidden="true" />
        <div className="pd-grain" aria-hidden="true" />
        <div className="pd-notfound">
          <p className="pd-eyebrow">
            <span className="pd-ey-line" />
            Aurexia Store
            <span className="pd-ey-line" />
          </p>
          <h1 className="pd-notfound-title">Product Not Found</h1>
          <p className="pd-notfound-sub">
            This item may have been removed or is no longer available
          </p>
          <Link href="/" className="pd-back-link">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="19 12 5 12" />
              <polyline points="12 5 5 12 12 19" />
            </svg>
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  const catHref = categoryRoute[product.category] || "/";
  const catLabel = categoryLabel[product.category] || product.category;
  const images = product.images?.length ? product.images : [];
  const specs = product.specs || {};
  const hasSpecs = Object.keys(specs).length > 0;

  /* ═══════════════════════════════════════════
     FULL RENDER
  ═══════════════════════════════════════════ */
  return (
    <div className="pd-root">
      {/* Background effects */}
      <div className="pd-ambient" aria-hidden="true" />
      <div className="pd-grain" aria-hidden="true" />
      <div className="pd-lines" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className="pd-content">
        {/* Breadcrumb */}
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="pd-breadcrumb-sep">›</span>
          <Link href={catHref}>{catLabel}</Link>
          <span className="pd-breadcrumb-sep">›</span>
          {product.subcategory && (
            <>
              <Link
                href={`${catHref}/${product.subcategory
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {product.subcategory}
              </Link>
              <span className="pd-breadcrumb-sep">›</span>
            </>
          )}
          <span className="pd-breadcrumb-current">{product.name}</span>
        </nav>

        {/* ── Main grid ── */}
        <div className="pd-grid">
          {/* ════ IMAGE GALLERY ════ */}
          <div className="pd-gallery">
            <div
              className="pd-main-img-wrap"
              onClick={() => images.length > 0 && setLightbox(true)}
            >
              {images.length > 0 ? (
                <img
                  src={images[activeImg]}
                  alt={product.name}
                  className={imgEntering ? "pd-img-entering" : ""}
                />
              ) : (
                <div className="pd-img-placeholder">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.8"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}

              {/* Image counter */}
              {images.length > 1 && (
                <div className="pd-img-counter">
                  {activeImg + 1} / {images.length}
                </div>
              )}

              {/* Zoom hint */}
              {images.length > 0 && (
                <div className="pd-zoom-hint">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  Zoom
                </div>
              )}

              {/* Badges */}
              <div className="pd-img-badges">
                {product.is_featured && (
                  <span className="pd-badge pd-badge--feat">Featured</span>
                )}
                {discount > 0 && (
                  <span className="pd-badge pd-badge--sale">−{discount}%</span>
                )}
                {product.condition === "new" && !discount && (
                  <span className="pd-badge pd-badge--new">New</span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="pd-thumbs">
                {images.map((src, idx) => (
                  <button
                    key={idx}
                    className={`pd-thumb${activeImg === idx ? " active" : ""}`}
                    onClick={() => switchImg(idx)}
                    aria-label={`Image ${idx + 1}`}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ════ PRODUCT INFO ════ */}
          <div className="pd-info">
            <p className="pd-eyebrow">
              <span className="pd-ey-line" />
              {product.subcategory || product.category}
              <span className="pd-ey-line" />
            </p>

            {product.brand && <p className="pd-brand">{product.brand}</p>}

            <h1 className="pd-title">{product.name}</h1>

            <div className="pd-sep">
              <span className="pd-sep-line" />
              <span className="pd-sep-diamond" />
              <span
                className="pd-sep-line"
                style={{
                  background:
                    "linear-gradient(to left, var(--pd-gold), transparent)",
                }}
              />
            </div>

            {/* Price block */}
            <div className="pd-price-block">
              <div className="pd-price-row">
                <span className="pd-price">
                  PKR {product.price.toLocaleString()}
                </span>
                {product.original_price &&
                  product.original_price > product.price && (
                    <span className="pd-price-original">
                      PKR {product.original_price.toLocaleString()}
                    </span>
                  )}
                {discount > 0 && (
                  <span className="pd-discount-pill">−{discount}% OFF</span>
                )}
              </div>
              {savings > 0 && (
                <p className="pd-savings">
                  ✦ You save PKR {savings.toLocaleString()}
                </p>
              )}
            </div>

            {/* Stock status */}
            <div
              className={`pd-stock ${stockClass}`}
              style={{ marginTop: "1rem" }}
            >
              <span className="pd-stock-dot" />
              {stockLabel}
            </div>

            {/* Short description */}
            {product.description && (
              <p className="pd-description">{product.description}</p>
            )}

            {/* Feature pills */}
            <div className="pd-features">
              <div className="pd-feat-pill">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Authentic
              </div>
              <div className="pd-feat-pill">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Free Delivery
              </div>
              <div className="pd-feat-pill">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                Easy Returns
              </div>
              <div className="pd-feat-pill">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Cash on Delivery
              </div>
            </div>

            {/* Actions */}
            <div className="pd-actions">
              {/* Qty */}
              <div className="pd-qty-row">
                <span className="pd-qty-label">Qty</span>
                <div className="pd-qty-ctrl">
                  <button
                    className="pd-qty-btn"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <span className="pd-qty-val">{qty}</span>
                  <button
                    className="pd-qty-btn"
                    onClick={() =>
                      setQty((q) => Math.min(product.stock, q + 1))
                    }
                    disabled={qty >= product.stock || product.stock === 0}
                    aria-label="Increase quantity"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* CTA row */}
              <div className="pd-cta-row">
                <button
                  className="pd-add-cart"
                  disabled={product.stock === 0}
                  onClick={handleAddToCart}
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
                  {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </button>

                <button
                  className={`pd-wishlist${wishlist ? " active" : ""}`}
                  onClick={() => {
                    setWishlist((w) => !w);
                    showToast(
                      wishlist ? "Removed from wishlist" : "Added to wishlist",
                      "success"
                    );
                  }}
                  aria-label="Toggle wishlist"
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

              {/* Buy Now */}
              {product.stock > 0 && (
                <button
                  className="pd-buy-now"
                  onClick={() => showToast("Redirecting to checkout…", "info")}
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
                  Buy Now
                </button>
              )}
            </div>

            {/* Meta info */}
            <div className="pd-meta pd-reveal">
              <div className="pd-meta-item">
                <p className="pd-meta-label">Category</p>
                <p className="pd-meta-value">{catLabel}</p>
              </div>
              <div className="pd-meta-item">
                <p className="pd-meta-label">Subcategory</p>
                <p className="pd-meta-value">{product.subcategory}</p>
              </div>
              {product.brand && (
                <div className="pd-meta-item">
                  <p className="pd-meta-label">Brand</p>
                  <p className="pd-meta-value">{product.brand}</p>
                </div>
              )}
              <div className="pd-meta-item">
                <p className="pd-meta-label">Condition</p>
                <span className={`pd-condition-badge ${product.condition}`}>
                  {product.condition}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ════ TABS SECTION ════ */}
        <div className="pd-tabs-section pd-reveal">
          <div className="pd-tab-bar" role="tablist">
            {(
              [
                { key: "description", label: "Description" },
                { key: "specs", label: "Specifications" },
                { key: "shipping", label: "Shipping & Returns" },
              ] as { key: TabKey; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeTab === key}
                className={`pd-tab-btn${activeTab === key ? " active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Description panel */}
          {activeTab === "description" && (
            <div className="pd-tab-panel" role="tabpanel">
              <p className="pd-desc-long">
                {product.description ||
                  "No detailed description available for this product."}
              </p>
            </div>
          )}

          {/* Specs panel */}
          {activeTab === "specs" && (
            <div className="pd-tab-panel" role="tabpanel">
              {hasSpecs ? (
                <div className="pd-specs-grid">
                  {Object.entries(specs).map(([key, val]) => (
                    <div className="pd-spec-row" key={key}>
                      <div className="pd-spec-key">{key}</div>
                      <div className="pd-spec-val">{val}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pd-no-specs">No specifications available</p>
              )}
            </div>
          )}

          {/* Shipping panel */}
          {activeTab === "shipping" && (
            <div className="pd-tab-panel" role="tabpanel">
              <div className="pd-shipping-grid">
                <div className="pd-ship-card">
                  <div className="pd-ship-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="1" y="3" width="15" height="13" rx="1" />
                      <path d="M16 8h4l3 3v5h-7V8z" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                  <p className="pd-ship-title">Free Delivery</p>
                  <p className="pd-ship-desc">
                    Complimentary delivery across Pakistan on all orders.
                    Estimated 2–5 business days.
                  </p>
                </div>
                <div className="pd-ship-card">
                  <div className="pd-ship-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                  </div>
                  <p className="pd-ship-title">Easy Returns</p>
                  <p className="pd-ship-desc">
                    30-day hassle-free returns on all items. Contact support for
                    a smooth experience.
                  </p>
                </div>
                <div className="pd-ship-card">
                  <div className="pd-ship-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="1" y="4" width="22" height="16" rx="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  </div>
                  <p className="pd-ship-title">Cash on Delivery</p>
                  <p className="pd-ship-desc">
                    Pay at your door — no card needed. COD available across all
                    major cities.
                  </p>
                </div>
                <div className="pd-ship-card">
                  <div className="pd-ship-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <p className="pd-ship-title">Authentic Products</p>
                  <p className="pd-ship-desc">
                    Every product is verified for authenticity. 100% genuine or
                    full refund guaranteed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ════ RELATED PRODUCTS ════ */}
        {related.length > 0 && (
          <section className="pd-related pd-reveal">
            <div className="pd-related-header">
              <p className="pd-section-eyebrow">
                <span className="pd-section-eye-line" />
                More from {catLabel}
                <span className="pd-section-eye-line" />
              </p>
              <h2 className="pd-section-title">
                You May Also <em>Like</em>
              </h2>
            </div>

            <div className="pd-related-grid">
              {related.map((rel) => {
                const relDisc =
                  rel.original_price && rel.original_price > rel.price
                    ? Math.round(
                        ((rel.original_price - rel.price) /
                          rel.original_price) *
                          100
                      )
                    : 0;
                return (
                  <Link
                    key={rel.id}
                    href={`/product/${rel.id}`}
                    className="pd-rel-card"
                  >
                    <div className="pd-rel-card-img">
                      {rel.images?.[0] ? (
                        <img src={rel.images[0]} alt={rel.name} />
                      ) : (
                        <div
                          className="pd-img-placeholder"
                          style={{ height: "100%" }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.8"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                      {relDisc > 0 && (
                        <div className="pd-img-badges">
                          <span className="pd-badge pd-badge--sale">
                            −{relDisc}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="pd-rel-card-body">
                      {rel.brand && (
                        <p className="pd-rel-card-brand">{rel.brand}</p>
                      )}
                      <h3 className="pd-rel-card-name">{rel.name}</h3>
                      <p className="pd-rel-card-price">
                        PKR {rel.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="pd-rel-card-line" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* ════ LIGHTBOX ════ */}
      {lightbox && images[activeImg] && (
        <div
          className="pd-lightbox"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <img
            src={images[activeImg]}
            alt={product.name}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="pd-lightbox-close"
            onClick={() => setLightbox(false)}
            aria-label="Close lightbox"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ════ TOASTS ════ */}
      <div className="pd-toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pd-toast pd-toast--${t.type}${
              t.exiting ? " exiting" : ""
            }`}
          >
            <div className="pd-toast-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="pd-toast-msg">{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
