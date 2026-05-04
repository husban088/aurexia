"use client";

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT DETAILS PAGE — Module-level cache
// Har baar back/forward pe Supabase call nahi hogi — data instantly dikhega
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase, Product, ProductVariant } from "@/lib/supabase";
import "@/app/styles/product-detail.css";
import { useCartStore } from "@/lib/cartStore";
import { useCurrency } from "@/app/context/CurrencyContext";
import ProductReviews from "@/app/components/ProductReviews";
import EstimatedDelivery from "@/app/components/EstimatedDelivery";
import TrustBadges from "@/app/components/TrustBadges";
import ProductGallery from "@/app/components/ProductGallery";
import RelatedProducts from "@/app/components/RelatedProducts";
import DescriptionModal from "@/app/components/DescriptionModal";

// ─── MODULE-LEVEL CACHE ───────────────────────────────────────────────────────
// productId → product data — survives Next.js client-side navigation
// Back/forward karne pe Supabase call nahi hogi, data instantly milega
const _productCache = new Map<string, any>();
const _inFlight = new Map<string, Promise<any>>();
// ─────────────────────────────────────────────────────────────────────────────

async function fetchProductCached(id: string): Promise<any | null> {
  // 1. Cached — return instantly
  if (_productCache.has(id)) return _productCache.get(id)!;

  // 2. In-flight — wait for same promise (duplicate calls prevent karta hai)
  if (_inFlight.has(id)) return _inFlight.get(id)!;

  // 3. Fresh fetch
  const promise = (async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_variants(*, variant_images(*))")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    _inFlight.delete(id);

    if (error || !data) return null;

    // Process variants — images sort karke attach karo
    const variants = (data.product_variants || []).map((variant: any) => {
      const variantImages = (variant.variant_images || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((img: any) => img.image_url);
      return {
        ...variant,
        images: variantImages,
        description_images: variant.description_images || [],
        description_rich: variant.description_rich || variant.description || "",
        variant_images: variant.variant_images || [],
      };
    });

    const result = { ...data, product_variants: variants };
    _productCache.set(id, result);
    return result;
  })();

  _inFlight.set(id, promise);
  return promise;
}

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
type TabKey = "description" | "shipping";

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

interface VariantWithDetails extends ProductVariant {
  description_images?: string[];
  description_rich?: string;
  variant_images?: { image_url: string; display_order: number }[];
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

// Helper function to render HTML content safely
const createMarkup = (html: string) => {
  return { __html: html };
};

/* ═══════════════════════════════════════════
   TRUNCATE PRODUCT NAME
═══════════════════════════════════════════ */
const truncateProductName = (name: string, maxLength: number = 60): string => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength).trim() + "...";
};

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

  // ── Sync-init from cache — instant render if already cached ──
  const [product, setProduct] = useState<Product | null>(() =>
    id ? _productCache.get(id) ?? null : null
  );
  const [variants, setVariants] = useState<VariantWithDetails[]>([]);
  const [variantImagesMap, setVariantImagesMap] = useState<VariantImagesMap>(
    {}
  );
  const [selectedVariant, setSelectedVariant] =
    useState<VariantWithDetails | null>(null);
  const [loading, setLoading] = useState(() =>
    id ? !_productCache.has(id) : true
  );
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
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [currentDescription, setCurrentDescription] = useState<string>("");
  const [currentDescriptionImages, setCurrentDescriptionImages] = useState<
    string[]
  >([]);

  const { toasts, show: showToast } = useToast();
  const { addToCart } = useCartStore();
  const { formatPrice, currency } = useCurrency();

  // ── If cache already had the product, hydrate variants too ──
  useEffect(() => {
    if (!id) return;
    const cached = _productCache.get(id);
    if (cached && !loading) {
      hydrateFromData(cached);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helper: hydrate all state from a product data object ──
  function hydrateFromData(productData: any) {
    setProduct(productData);
    setLiveRating(productData.rating || null);
    setLiveReviewCount(productData.reviews_count || null);
    setCurrentDescription(productData.description || "");
    setCurrentDescriptionImages(productData.description_images || []);
    document.title = `${productData.name} | Tech4U`;

    const variantsData: VariantWithDetails[] =
      productData.product_variants || [];

    if (variantsData.length > 0) {
      const sortedVariants = [...variantsData].sort((a: any, b: any) => {
        const order: Record<string, number> = {
          standard: 0,
          color: 1,
          size: 2,
          material: 3,
          capacity: 4,
        };
        return (order[a.attribute_type] ?? 5) - (order[b.attribute_type] ?? 5);
      });
      setVariants(sortedVariants);
      setSelectedVariant(sortedVariants[0]);

      const imagesByVariant: VariantImagesMap = {};
      variantsData.forEach((v: any) => {
        const imgs = (v.variant_images || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((img: any) => img.image_url);
        if (imgs.length > 0) imagesByVariant[v.id] = imgs;
      });
      setVariantImagesMap(imagesByVariant);
    } else {
      setVariants([]);
      setSelectedVariant(null);
    }
  }

  // ── Main fetch effect ──
  useEffect(() => {
    if (!id) return;

    // Already cached? Hydrate instantly without fetch
    if (_productCache.has(id)) {
      hydrateFromData(_productCache.get(id));
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetchProductCached(id).then((data) => {
      if (!active) return;
      if (data) {
        hydrateFromData(data);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update description/images when variant changes ──
  useEffect(() => {
    if (selectedVariant) {
      if (selectedVariant.attribute_type !== "standard") {
        setCurrentDescription(
          selectedVariant.description_rich ||
            (selectedVariant as any).description ||
            ""
        );
        setCurrentDescriptionImages(selectedVariant.description_images || []);
      } else {
        setCurrentDescription(product?.description || "");
        setCurrentDescriptionImages((product as any)?.description_images || []);
      }
    } else if (product) {
      setCurrentDescription(product.description || "");
      setCurrentDescriptionImages((product as any).description_images || []);
    }
  }, [selectedVariant, product]);

  // ── Fetch bulk pricing tiers when variant changes ──
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

  // ── Realtime rating updates ──
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

  // ── IntersectionObserver for reveal animations ──
  useEffect(() => {
    const els = document.querySelectorAll(".pd-reveal, .rp-reveal");
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

  // ── Derived values ──
  const currentImages =
    selectedVariant?.id && variantImagesMap[selectedVariant.id]
      ? variantImagesMap[selectedVariant.id]
      : (product as any)?.images || [];

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
    (selectedVariant as any)?.original_price ||
    (product as any)?.original_price ||
    0;
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

  const variantsByType: Record<string, VariantWithDetails[]> = {};
  variants.forEach((v) => {
    if (!variantsByType[v.attribute_type])
      variantsByType[v.attribute_type] = [];
    variantsByType[v.attribute_type].push(v);
  });

  const getVariantImage = (variantId: string): string | null => {
    const imgs = variantImagesMap[variantId];
    return imgs && imgs.length > 0 ? imgs[0] : null;
  };

  function handleVariantSelect(variant: VariantWithDetails) {
    setSelectedVariant(variant);
    setSelectedTier(null);
    setQty(1);
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
      brand: (product as any).brand || "",
      condition: (product as any).condition,
      is_featured: (product as any).is_featured,
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

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            animation: "skeleton-pulse 1.4s ease-in-out infinite",
          }}
        >
          {/* Image skeleton */}
          <div
            style={{
              aspectRatio: "1",
              background: "rgba(255,255,255,0.06)",
              borderRadius: 12,
            }}
          />
          {/* Details skeleton */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[80, 55, 40, 30, 60, 100].map((w, i) => (
              <div
                key={i}
                style={{
                  height: i === 0 ? 28 : i === 4 ? 20 : 16,
                  width: `${w}%`,
                  background:
                    i === 4 ? "rgba(218,165,32,0.2)" : "rgba(255,255,255,0.06)",
                  borderRadius: 6,
                }}
              />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes skeleton-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h2>Product not found</h2>
        <a href="/watches" style={{ color: "#daa520" }}>
          ← Continue Shopping
        </a>
      </div>
    );
  }

  const catHref = categoryRoute[(product as any).category] || "/";
  const catLabel =
    categoryLabel[(product as any).category] || (product as any).category;
  const images =
    currentImages.length > 0 ? currentImages : (product as any).images || [];
  const hasDescription = currentDescription && currentDescription.length > 0;
  const truncatedProductName = truncateProductName(product.name);

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
        {/* ── Breadcrumb ── */}
        <nav className="pd-breadcrumb">
          <Link href="/">Home</Link>
          <span className="pd-breadcrumb-sep">›</span>
          <Link href={catHref}>{catLabel}</Link>
          <span className="pd-breadcrumb-sep">›</span>
          {(product as any).subcategory && (
            <>
              <Link
                href={`${catHref}/${(product as any).subcategory
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {(product as any).subcategory}
              </Link>
            </>
          )}
        </nav>

        <div className="pd-grid">
          {/* ── GALLERY ── */}
          <ProductGallery images={images} productName={product.name} />

          {/* ── PRODUCT INFO ── */}
          <div className="pd-info">
            {(product as any).brand && (
              <p className="pd-brand">{(product as any).brand}</p>
            )}
            <h5 className="pd-title" title={product.name}>
              {truncatedProductName}
            </h5>

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

            {/* ── Price Block ── */}
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

            {/* ── Variant Selectors ── */}
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
                      {variant.id && getVariantImage(variant.id!) && (
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

            {/* ── Bulk Pricing Selector ── */}
            {bulkTiers.length > 0 && !loadingTiers && (
              <BulkPricingSelector
                tiers={bulkTiers}
                unitPrice={
                  selectedVariant?.price || (product as any).price || 0
                }
                onSelect={setSelectedTier}
                selectedTier={selectedTier}
                formatPrice={formatPrice}
              />
            )}

            {/* ── Stock Status ── */}
            <div className={`pd-stock ${stockClass}`}>
              <span className="pd-stock-dot" />
              {stockLabel}
            </div>

            {/* ── Actions ── */}
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
          </div>
        </div>

        {/* ── TABS SECTION ── */}
        <div className="pd-tabs-section pd-reveal">
          <div className="pd-tab-bar">
            {[
              { key: "description", label: "Description" },
              { key: "shipping", label: "Shipping & Returns" },
            ].map(({ key, label }) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeTab === key}
                className={`pd-tab-btn${activeTab === key ? " active" : ""}`}
                onClick={() => setActiveTab(key as TabKey)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Description Tab */}
          {activeTab === "description" && (
            <div className="pd-tab-panel">
              <div className="pd-description-full">
                {hasDescription ? (
                  <div
                    className="pd-description-rich"
                    dangerouslySetInnerHTML={createMarkup(currentDescription)}
                  />
                ) : (
                  <p className="pd-no-description">
                    No detailed description available for this product.
                  </p>
                )}
              </div>

              {/* Description Images Gallery */}
              {currentDescriptionImages &&
                currentDescriptionImages.length > 0 && (
                  <div className="pd-desc-images-section">
                    <div className="pd-desc-images-header">
                      <span className="pd-desc-images-line" />
                      <span className="pd-desc-images-label">
                        Product Visuals
                      </span>
                      <span className="pd-desc-images-line" />
                    </div>
                    <div
                      className={`pd-desc-images-grid pd-desc-images-grid--${Math.min(
                        currentDescriptionImages.length,
                        3
                      )}`}
                    >
                      {currentDescriptionImages.map((imgUrl, idx) => (
                        <div key={idx} className="pd-desc-img-card">
                          <div className="pd-desc-img-inner">
                            <img
                              src={imgUrl}
                              alt={`${product.name} detail ${idx + 1}`}
                              className="pd-desc-img"
                              loading="lazy"
                            />
                            <div className="pd-desc-img-overlay">
                              <span className="pd-desc-img-num">
                                0{idx + 1}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Shipping & Returns Tab */}
          {activeTab === "shipping" && (
            <div className="pd-tab-panel">
              <div className="pd-shipping-content">
                <div className="pd-shipping-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>
                <p className="pd-desc-long">
                  Free shipping on all orders over PKR 3,000. Standard delivery
                  takes 3-5 business days. Easy returns within 30 days of
                  delivery. For international shipping, please contact our
                  customer support team for rates and delivery estimates.
                </p>
                <div className="pd-shipping-features">
                  <div className="pd-ship-feature">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Free Delivery on Orders over PKR 3,000</span>
                  </div>
                  <div className="pd-ship-feature">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>30-Day Easy Returns</span>
                  </div>
                  <div className="pd-ship-feature">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Secure Packaging & Insurance</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Estimated Delivery ── */}
        <EstimatedDelivery />

        {/* ── Trust Badges ── */}
        <TrustBadges />

        {/* ── Reviews & Ratings ── */}
        {product.id && <ProductReviews productId={product.id} />}

        {/* ── Related Products ── */}
        {product.id && (
          <RelatedProducts
            productId={product.id}
            category={(product as any).category}
            currentProductName={product.name}
            limit={4}
          />
        )}
      </div>

      {/* ── Description Modal ── */}
      <DescriptionModal
        isOpen={isDescModalOpen}
        onClose={() => setIsDescModalOpen(false)}
        description={
          currentDescription ||
          "No detailed description available for this product."
        }
        images={currentDescriptionImages}
        productName={
          product.name +
          (selectedVariant && selectedVariant.attribute_type !== "standard"
            ? ` (${selectedVariant.attribute_value})`
            : "")
        }
      />

      {/* ── Toast Notifications ── */}
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
