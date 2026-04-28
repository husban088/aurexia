"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase, Product, ProductVariant } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import "@/app/styles/product-detail.css";
import { useCartStore } from "@/lib/cartStore";
import { useCurrency } from "@/app/context/CurrencyContext";
import ProductReviews from "@/app/components/ProductReviews";

/* ═══════════════════════════════════════════
   DATE UTILITIES FOR ESTIMATED DELIVERY
═══════════════════════════════════════════ */

function getEstimatedDates(): {
  readyFrom: Date;
  readyTo: Date;
  deliveryFrom: Date;
  deliveryTo: Date;
} {
  const today = new Date();
  const readyFrom = new Date(today);
  readyFrom.setDate(today.getDate() + 2);
  const readyTo = new Date(today);
  readyTo.setDate(today.getDate() + 3);
  const deliveryFrom = new Date(today);
  deliveryFrom.setDate(today.getDate() + 6);
  const deliveryTo = new Date(today);
  deliveryTo.setDate(today.getDate() + 11);
  return { readyFrom, readyTo, deliveryFrom, deliveryTo };
}

function formatDateRange(start: Date, end: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  if (start.getMonth() === end.getMonth()) {
    return `${months[start.getMonth()]} ${start.getDate()} - ${end.getDate()}`;
  }
  return `${months[start.getMonth()]} ${start.getDate()} - ${
    months[end.getMonth()]
  } ${end.getDate()}`;
}

function getDeliveryStatus(): {
  text: string;
  icon: React.ReactNode;
  color: string;
} {
  const hour = new Date().getHours();
  if (hour >= 22) {
    return {
      text: "Order within 2 hours for faster processing",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: "#f59e0b",
    };
  }
  return {
    text: "Express processing available",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M22 12h-4l-3 9-4-18-3 9H2" />
      </svg>
    ),
    color: "#22c55e",
  };
}

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

interface VariantImagesMap {
  [variantId: string]: string[];
}

interface BulkPricingTier {
  id?: string;
  variant_id: string;
  min_quantity: number;
  max_quantity: number;
  tier_price: number;
  discount_percentage: number | null;
  discount_price: number | null;
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
   STAR COMPONENT
═══════════════════════════════════════════ */
function StarIcon({
  filled,
  half = false,
  size = 14,
}: {
  filled: boolean;
  half?: boolean;
  size?: number;
}) {
  if (half) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="half-grad">
            <stop offset="50%" stopColor="#b8963e" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <polygon
          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          fill="url(#half-grad)"
          stroke="#b8963e"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={filled ? "#b8963e" : "none"}
        stroke="#b8963e"
        strokeWidth="1.5"
        opacity={filled ? 1 : 0.35}
      />
    </svg>
  );
}

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} filled={i <= Math.round(rating)} size={size} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   BULK PRICING COMPONENT
═══════════════════════════════════════════ */
function BulkPricingSelector({
  tiers,
  unitPrice,
  onSelect,
  selectedTier,
  formatPrice,
}: {
  tiers: BulkPricingTier[];
  unitPrice: number;
  onSelect: (tier: BulkPricingTier | null) => void;
  selectedTier: BulkPricingTier | null;
  formatPrice: (value: number) => string;
}) {
  if (tiers.length === 0) return null;

  const getTierLabel = (tier: BulkPricingTier): string => {
    if (tier.min_quantity === tier.max_quantity) {
      return `${tier.min_quantity} Piece${tier.min_quantity > 1 ? "s" : ""}`;
    }
    return `${tier.min_quantity} – ${tier.max_quantity} Pieces`;
  };

  return (
    <div className="pd-bulk-section">
      <div className="pd-bulk-header">
        <span className="pd-bulk-title">Quantity Discounts:</span>
        {selectedTier && (
          <button
            className="pd-bulk-clear"
            onClick={() => onSelect(null)}
            title="Remove bulk selection"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Clear
          </button>
        )}
      </div>
      <div className="pd-bulk-tiers">
        {tiers.map((tier, idx) => {
          const isSelected = selectedTier?.id === tier.id;
          const perPiece = tier.tier_price / tier.min_quantity;
          const saving = unitPrice - perPiece;
          const isBestValue = idx === tiers.length - 1 && tiers.length > 1;
          return (
            <button
              key={tier.id ?? idx}
              className={`pd-bulk-tier ${isSelected ? "active" : ""} ${
                isBestValue ? "best-value" : ""
              }`}
              onClick={() => onSelect(isSelected ? null : tier)}
            >
              <div className="pd-bulk-tier-qty">
                {getTierLabel(tier)}
                {isBestValue && (
                  <span className="pd-bulk-best">Best Value</span>
                )}
              </div>
              <div className="pd-bulk-tier-price">
                {formatPrice(tier.tier_price)}
              </div>
              <div className="pd-bulk-tier-perpiece">
                {formatPrice(perPiece)}/pc
              </div>
              {saving > 0 && (
                <div className="pd-bulk-tier-saving">
                  Save {formatPrice(saving)}/pc
                </div>
              )}
              {tier.discount_percentage && tier.discount_percentage > 0 && (
                <div className="pd-bulk-tier-discount">
                  {tier.discount_percentage}% OFF
                </div>
              )}
              {isSelected && (
                <div className="pd-bulk-check">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {selectedTier && (
        <div className="pd-bulk-selected">
          <span className="pd-bulk-selected-label">Selected:</span>
          <span className="pd-bulk-selected-value">
            {selectedTier.min_quantity} pieces
          </span>
          <span className="pd-bulk-selected-total">
            Total: {formatPrice(selectedTier.tier_price)}
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   CATEGORY → ROUTE MAP
═══════════════════════════════════════════ */
const categoryRoute: Record<string, string> = {
  Accessories: "/accessories",
  Watches: "/watches",
  Automotive: "/automotive",
  "Home Decor": "/home-decor",
};

const categoryLabel: Record<string, string> = {
  Accessories: "Mobile Accessories",
  Watches: "Watches",
  Automotive: "Automotive",
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
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantImagesMap, setVariantImagesMap] = useState<VariantImagesMap>(
    {}
  );
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [imgEntering, setImgEntering] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [qty, setQty] = useState(1);
  const [wishlist, setWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const [bulkTiers, setBulkTiers] = useState<BulkPricingTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<BulkPricingTier | null>(
    null
  );
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [liveRating, setLiveRating] = useState<number | null>(null);
  const [liveReviewCount, setLiveReviewCount] = useState<number | null>(null);
  const [estimatedDates, setEstimatedDates] = useState<{
    readyFrom: Date;
    readyTo: Date;
    deliveryFrom: Date;
    deliveryTo: Date;
  } | null>(null);

  const { toasts, show: showToast } = useToast();
  const { addToCart } = useCartStore();
  const { formatPrice, currency, loading: currencyLoading } = useCurrency();

  // Set estimated dates when product loads
  useEffect(() => {
    if (product) setEstimatedDates(getEstimatedDates());
  }, [product]);

  // Fetch bulk pricing tiers when variant changes
  useEffect(() => {
    async function fetchBulkTiers() {
      if (!selectedVariant?.id) {
        setBulkTiers([]);
        setSelectedTier(null);
        return;
      }
      setLoadingTiers(true);
      try {
        const { data, error } = await supabase
          .from("bulk_pricing_tiers")
          .select("*")
          .eq("variant_id", selectedVariant.id)
          .order("min_quantity", { ascending: true });
        if (!error && data) {
          setBulkTiers(data);
          setSelectedTier(null);
        } else {
          setBulkTiers([]);
          setSelectedTier(null);
        }
      } catch (err) {
        console.error("Error fetching bulk tiers:", err);
        setBulkTiers([]);
      } finally {
        setLoadingTiers(false);
      }
    }
    fetchBulkTiers();
  }, [selectedVariant]);

  /* ── Fetch product and variants ── */
  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);

      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (productError || !productData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProduct(productData);
      setLiveRating(productData.rating || null);
      setLiveReviewCount(productData.reviews_count || null);

      // Update browser title and URL meta
      document.title = `${productData.name} | Tech4U`;

      // Fetch variants
      const { data: variantsData, error: variantsError } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id)
        .eq("is_active", true);

      if (!variantsError && variantsData && variantsData.length > 0) {
        const sortedVariants = variantsData.sort((a, b) => {
          const order = {
            standard: 0,
            color: 1,
            size: 2,
            material: 3,
            capacity: 4,
          };
          return (
            (order[a.attribute_type as keyof typeof order] || 5) -
            (order[b.attribute_type as keyof typeof order] || 5)
          );
        });
        setVariants(sortedVariants);
        setSelectedVariant(sortedVariants[0]);

        const variantIds = sortedVariants.map((v) => v.id);
        const { data: imagesData } = await supabase
          .from("variant_images")
          .select("*")
          .in("variant_id", variantIds)
          .order("display_order", { ascending: true });

        if (imagesData) {
          const imagesByVariant: VariantImagesMap = {};
          imagesData.forEach((img: any) => {
            if (!imagesByVariant[img.variant_id])
              imagesByVariant[img.variant_id] = [];
            imagesByVariant[img.variant_id].push(img.image_url);
          });
          setVariantImagesMap(imagesByVariant);
        }
      } else {
        setSelectedVariant(null);
      }

      // Fetch related products
      const { data: rel } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("category", productData.category)
        .neq("id", id)
        .limit(4);

      setRelated(rel || []);
      setLoading(false);
    }

    load();
  }, [id]);

  /* ── Realtime rating updates ── */
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`product-rating-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "product_reviews",
          filter: `product_id=eq.${id}`,
        },
        async () => {
          const { data } = await supabase
            .from("products")
            .select("rating, reviews_count")
            .eq("id", id)
            .single();
          if (data) {
            setLiveRating(data.rating);
            setLiveReviewCount(data.reviews_count);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const currentImages =
    selectedVariant?.id && variantImagesMap[selectedVariant.id]
      ? variantImagesMap[selectedVariant.id]
      : product?.images || [];

  const getCurrentPrice = (): number => {
    if (selectedTier) return selectedTier.tier_price;
    return selectedVariant?.price || product?.price || 0;
  };

  const getPerPiecePrice = (): number => {
    if (selectedTier)
      return selectedTier.tier_price / selectedTier.min_quantity;
    return selectedVariant?.price || product?.price || 0;
  };

  const getQuantityToAdd = (): number => {
    return selectedTier ? selectedTier.min_quantity : qty;
  };

  const currentPrice = getCurrentPrice();
  const currentPerPiecePrice = getPerPiecePrice();
  const currentOriginalPrice =
    selectedVariant?.original_price || product?.original_price || 0;
  const currentStock = selectedVariant?.stock || product?.stock || 0;
  const discount =
    currentOriginalPrice > currentPerPiecePrice
      ? Math.round(
          ((currentOriginalPrice - currentPerPiecePrice) /
            currentOriginalPrice) *
            100
        )
      : 0;
  const savings =
    currentOriginalPrice > currentPerPiecePrice
      ? currentOriginalPrice - currentPerPiecePrice
      : 0;
  const stockClass =
    currentStock === 0 ? "out" : currentStock < 5 ? "low" : "in";
  const stockLabel =
    currentStock === 0
      ? "Out of Stock"
      : currentStock < 5
      ? `Only ${currentStock} Left`
      : "In Stock";

  const variantsByType: Record<string, ProductVariant[]> = {};
  variants.forEach((v) => {
    if (!variantsByType[v.attribute_type])
      variantsByType[v.attribute_type] = [];
    variantsByType[v.attribute_type].push(v);
  });

  const getVariantImage = (variantId: string): string | null => {
    const imgs = variantImagesMap[variantId];
    return imgs && imgs.length > 0 ? imgs[0] : null;
  };

  function handleVariantSelect(variant: ProductVariant) {
    setSelectedVariant(variant);
    setSelectedTier(null);
    setQty(1);
    setActiveImg(0);
  }

  function switchImg(idx: number) {
    if (idx === activeImg) return;
    setImgEntering(true);
    setTimeout(() => {
      setActiveImg(idx);
      setImgEntering(false);
    }, 80);
  }

  function handleAddToCart() {
    if (!product || currentStock === 0) return;
    const quantityToAdd = getQuantityToAdd();
    const productToAdd = {
      id: product.id,
      name: product.name,
      description: selectedVariant?.description || product.description || "",
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand || "",
      condition: product.condition,
      is_featured: product.is_featured,
      is_active: product.is_active,
      images: currentImages,
      price: currentPerPiecePrice,
      original_price: currentOriginalPrice,
      stock: currentStock,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addToCart(productToAdd, selectedVariant, quantityToAdd);
    if (selectedTier) {
      showToast(
        `${quantityToAdd} × ${product.name} (bulk) added to cart`,
        "success"
      );
    } else {
      showToast(`${quantityToAdd} × ${product.name} added to cart`, "success");
    }
  }

  function handleBuyNow() {
    if (!product || currentStock === 0) return;
    handleAddToCart();
    router.push("/checkout");
  }

  useEffect(() => {
    setActiveImg(0);
  }, [selectedVariant]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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

  // Show loading state
  if (loading || currencyLoading) {
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
            Tech4U Store
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
  const images =
    currentImages.length > 0 ? currentImages : product.images || [];
  const specs = (product as any).specs || {};
  const hasSpecs = Object.keys(specs).length > 0;

  return (
    <div className="pd-root">
      <div className="pd-ambient" aria-hidden="true" />
      <div className="pd-grain" aria-hidden="true" />
      <div className="pd-lines" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className="pd-content">
        <div className="pd-currency-indicator">
          <span className="pd-currency-flag">{currency.flag}</span>
          <span className="pd-currency-code">{currency.code}</span>
          <span className="pd-currency-rate">
            1 PKR = {currency.rate} {currency.code}
          </span>
        </div>

        {/* Breadcrumb with product name */}
        <nav className="pd-breadcrumb">
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

        <div className="pd-grid">
          {/* GALLERY */}
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
              {images.length > 1 && (
                <div className="pd-img-counter">
                  {activeImg + 1} / {images.length}
                </div>
              )}
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
            {images.length > 1 && (
              <div className="pd-thumbs">
                {images.map((src, idx) => (
                  <button
                    key={idx}
                    className={`pd-thumb${activeImg === idx ? " active" : ""}`}
                    onClick={() => switchImg(idx)}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFO */}
          <div className="pd-info">
            <p className="pd-eyebrow">
              <span className="pd-ey-line" />
              {product.subcategory || product.category}
              <span className="pd-ey-line" />
            </p>
            {product.brand && <p className="pd-brand">{product.brand}</p>}
            <h1 className="pd-title">{product.name}</h1>

            {liveRating !== null &&
              liveReviewCount !== null &&
              liveReviewCount > 0 && (
                <div className="pd-rating-display">
                  <div className="pd-rating-stars-sm">
                    <StarDisplay rating={liveRating} size={14} />
                  </div>
                  <span className="pd-rating-val">{liveRating.toFixed(1)}</span>
                  <span className="pd-rating-total">
                    ({liveReviewCount} review{liveReviewCount !== 1 ? "s" : ""})
                  </span>
                </div>
              )}

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

            <div className="pd-price-block">
              <div className="pd-price-row">
                <span className="pd-price">{formatPrice(currentPrice)}</span>
                {currentOriginalPrice > currentPerPiecePrice && (
                  <span className="pd-price-original">
                    {formatPrice(currentOriginalPrice)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="pd-discount-pill">−{discount}% OFF</span>
                )}
              </div>
              {selectedTier && (
                <p className="pd-per-piece-info">
                  Per piece: {formatPrice(currentPerPiecePrice)}
                </p>
              )}
              {savings > 0 && (
                <p className="pd-savings">✦ You save {formatPrice(savings)}</p>
              )}
              <p className="pd-price-base">
                Base price: PKR {currentPerPiecePrice.toLocaleString()} / piece
              </p>
            </div>

            {/* VARIANT SELECTORS */}
            {Object.entries(variantsByType).map(([type, typeVariants]) => (
              <div key={type} className="pd-attr">
                <span className="pd-attr-label">
                  {type.charAt(0).toUpperCase() + type.slice(1)}:
                </span>
                <div className="pd-attr-tags">
                  {typeVariants.map((variant) => (
                    <button
                      key={variant.id}
                      className={`pd-attr-tag ${
                        selectedVariant?.id === variant.id ? "active" : ""
                      }`}
                      onClick={() => handleVariantSelect(variant)}
                    >
                      {variant.id && getVariantImage(variant.id) && (
                        <img
                          src={getVariantImage(variant.id!)!}
                          alt={variant.attribute_value}
                          className="pd-attr-img"
                        />
                      )}
                      <span>{variant.attribute_value}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* BULK PRICING SELECTOR */}
            {bulkTiers.length > 0 && !loadingTiers && (
              <BulkPricingSelector
                tiers={bulkTiers}
                unitPrice={selectedVariant?.price || product.price || 0}
                onSelect={setSelectedTier}
                selectedTier={selectedTier}
                formatPrice={formatPrice}
              />
            )}

            <div className={`pd-stock ${stockClass}`}>
              <span className="pd-stock-dot" />
              {stockLabel}
            </div>
            {product.description && (
              <p className="pd-description">{product.description}</p>
            )}

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

            <div className="pd-actions">
              {!selectedTier && (
                <div className="pd-qty-row">
                  <span className="pd-qty-label">Qty</span>
                  <div className="pd-qty-ctrl">
                    <button
                      className="pd-qty-btn"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
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
                        setQty((q) => Math.min(currentStock, q + 1))
                      }
                      disabled={qty >= currentStock || currentStock === 0}
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
              )}
              {selectedTier && (
                <div className="pd-bulk-qty-display">
                  <span className="pd-bulk-qty-label">Quantity:</span>
                  <span className="pd-bulk-qty-value">
                    {selectedTier.min_quantity} pieces
                  </span>
                  <span className="pd-bulk-qty-total">
                    Total: {formatPrice(selectedTier.tier_price)}
                  </span>
                </div>
              )}
              <div className="pd-cta-row">
                <button
                  className="pd-add-cart"
                  disabled={currentStock === 0}
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
                  {currentStock === 0
                    ? "Out of Stock"
                    : selectedTier
                    ? `Add to Cart (${selectedTier.min_quantity} pcs)`
                    : `Add to Cart (${qty} pc${qty > 1 ? "s" : ""})`}
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
              {currentStock > 0 && (
                <button className="pd-buy-now" onClick={handleBuyNow}>
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

        {/* TABS SECTION */}
        <div className="pd-tabs-section pd-reveal">
          <div className="pd-tab-bar">
            {(
              [
                { key: "description", label: "Description" },
                { key: "specs", label: "Specifications" },
                { key: "shipping", label: "Shipping & Returns" },
              ] as const
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
          {activeTab === "description" && (
            <div className="pd-tab-panel">
              <p className="pd-desc-long">
                {product.description || "No detailed description available."}
              </p>
            </div>
          )}
          {activeTab === "specs" && (
            <div className="pd-tab-panel">
              {hasSpecs ? (
                <div className="pd-specs-grid">
                  {Object.entries(specs).map(([key, val]) => (
                    <div className="pd-spec-row" key={key}>
                      <div className="pd-spec-key">{key}</div>
                      <div className="pd-spec-val">{val as string}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pd-no-specs">No specifications available</p>
              )}
            </div>
          )}
          {activeTab === "shipping" && (
            <div className="pd-tab-panel">
              <p className="pd-desc-long">
                Free shipping on all orders over PKR 3,000. Standard delivery
                takes 3-5 business days. Easy returns within 30 days of
                delivery.
              </p>
            </div>
          )}
        </div>

        {/* ESTIMATED DELIVERY SECTION */}
        {estimatedDates && (
          <section className="pd-delivery-section pd-reveal">
            <div className="pd-delivery-header">
              <div className="pd-delivery-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div>
                <h3 className="pd-delivery-title">Estimated Delivery</h3>
                <p className="pd-delivery-sub">
                  Order processing & shipping timeline
                </p>
              </div>
            </div>
            <div className="pd-delivery-timeline">
              <div className="pd-timeline-node">
                <div className="pd-timeline-dot" />
                <span className="pd-timeline-label">Order</span>
                <span className="pd-timeline-date">Today</span>
              </div>
              <div className="pd-timeline-line" />
              <div className="pd-timeline-node">
                <div className="pd-timeline-dot" />
                <span className="pd-timeline-label">Ready</span>
                <span className="pd-timeline-date">
                  {formatDateRange(
                    estimatedDates.readyFrom,
                    estimatedDates.readyTo
                  )}
                </span>
              </div>
              <div className="pd-timeline-line" />
              <div className="pd-timeline-node">
                <div className="pd-timeline-dot" />
                <span className="pd-timeline-label">Deliver</span>
                <span className="pd-timeline-date">
                  {formatDateRange(
                    estimatedDates.deliveryFrom,
                    estimatedDates.deliveryTo
                  )}
                </span>
              </div>
            </div>
            <div className="pd-delivery-row">
              <span className="pd-delivery-row-label">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Processing Time
              </span>
              <span className="pd-delivery-row-value">2-3 business days</span>
            </div>
            <div className="pd-delivery-row">
              <span className="pd-delivery-row-label">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M22 12h-4l-3 9-4-18-3 9H2" />
                </svg>
                Shipping Time
              </span>
              <span className="pd-delivery-row-value">4-8 business days</span>
            </div>
            <div className="pd-delivery-status">
              <span className="pd-delivery-status-text">
                {getDeliveryStatus().icon}
                {getDeliveryStatus().text}
              </span>
              <span className="pd-delivery-urgency">
                Free Shipping over PKR 3,000
              </span>
            </div>
          </section>
        )}

        {/* TRUST BADGES SECTION */}
        <section className="pd-trust-section pd-reveal">
          <div className="pd-trust-grid">
            <div className="pd-trust-item">
              <div className="pd-trust-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <span className="pd-trust-label">Secure Payment</span>
              <span className="pd-trust-desc">256-bit SSL encryption</span>
            </div>
            <div className="pd-trust-item">
              <div className="pd-trust-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 12h-4V8" />
                </svg>
              </div>
              <span className="pd-trust-label">30-Day Returns</span>
              <span className="pd-trust-desc">Money back guarantee</span>
            </div>
            <div className="pd-trust-item">
              <div className="pd-trust-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <span className="pd-trust-label">100% Authentic</span>
              <span className="pd-trust-desc">Verified products only</span>
            </div>
            <div className="pd-trust-item">
              <div className="pd-trust-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                </svg>
              </div>
              <span className="pd-trust-label">24/7 Support</span>
              <span className="pd-trust-desc">Live chat & email</span>
            </div>
          </div>
        </section>

        {/* REVIEWS & RATINGS */}
        {product.id && <ProductReviews productId={product.id} />}

        {/* RELATED PRODUCTS */}
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
                const relPrice = rel.price || 0;
                const relDisc =
                  rel.original_price && rel.original_price > relPrice
                    ? Math.round(
                        ((rel.original_price - relPrice) / rel.original_price) *
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
                      {rel.rating && rel.reviews_count ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            marginBottom: "0.3rem",
                          }}
                        >
                          <StarDisplay rating={rel.rating} size={11} />
                          <span
                            style={{
                              fontFamily: "var(--pd-sans)",
                              fontSize: "0.58rem",
                              color: "rgba(245,240,232,0.45)",
                            }}
                          >
                            ({rel.reviews_count})
                          </span>
                        </div>
                      ) : null}
                      <p className="pd-rel-card-price">
                        {formatPrice(relPrice)}
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

      {lightbox && images[activeImg] && (
        <div className="pd-lightbox" onClick={() => setLightbox(false)}>
          <img
            src={images[activeImg]}
            alt={product.name}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="pd-lightbox-close"
            onClick={() => setLightbox(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <div className="pd-toast-wrap">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pd-toast pd-toast--${t.type}${
              t.exiting ? " exiting" : ""
            }`}
          >
            <div className="pd-toast-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
