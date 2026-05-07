"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/cartStore";
import { useCurrency } from "@/app/context/CurrencyContext";
import "./RelatedProducts.css";

/* ─────────────────────────────────────────────
   INTERFACES
───────────────────────────────────────────── */
interface ProductVariant {
  id: string;
  product_id: string;
  attribute_type: "color" | "size" | "material" | "capacity" | "standard";
  attribute_value: string;
  price: number;
  original_price?: number;
  description?: string;
  stock: number;
  low_stock_threshold?: number;
  images: string[];
  stockStatus?: "in_stock" | "out_of_stock" | "low_stock";
}

interface VariantImagesMap {
  [variantId: string]: string[];
}

interface ExtendedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  subcategory: string;
  images: string[];
  stock: number;
  brand?: string;
  condition: string;
  is_featured: boolean;
  is_active: boolean;
  rating?: number;
  reviews_count?: number;
  low_stock_threshold?: number | null;
  stockStatus?: "in_stock" | "out_of_stock" | "low_stock";
  variants: ProductVariant[];
  variantImagesMap: VariantImagesMap;
}

interface RelatedProductsProps {
  productId: string;
  category: string;
  currentProductName?: string;
  limit?: number;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const truncateProductName = (name: string, maxLength = 45): string => {
  if (!name) return "";
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength).trim() + "...";
};

const getStockStatus = (
  stock: number,
  threshold?: number | null,
): "in_stock" | "out_of_stock" | "low_stock" => {
  if (stock === 0) return "out_of_stock";
  if (stock >= 999999) return "in_stock";
  if (threshold && threshold > 0 && stock <= threshold) return "low_stock";
  return "in_stock";
};

const typePriority: Record<string, number> = {
  standard: 0,
  color: 1,
  size: 2,
  material: 3,
  capacity: 4,
};

/* ─────────────────────────────────────────────
   STAR COMPONENTS
───────────────────────────────────────────── */
function StarIcon({ filled, size = 11 }: { filled: boolean; size?: number }) {
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

function StarDisplay({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} filled={i <= Math.round(rating)} size={size} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOADING SPINNER
───────────────────────────────────────────── */
function LoadingSpinner({ size = 18 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: "2px solid rgba(218,165,32,0.2)",
        borderTopColor: "#daa520",
        borderRadius: "50%",
        animation: "rp-spin 0.8s linear infinite",
        display: "inline-block",
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   VARIANT THUMBNAILS COMPONENT
───────────────────────────────────────────── */
function VariantThumbnails({
  variants,
  type,
  onSelect,
  currentValue,
  variantImagesMap,
}: {
  variants: ProductVariant[];
  type: string;
  onSelect: (variant: ProductVariant) => void;
  currentValue: string;
  variantImagesMap: VariantImagesMap;
}) {
  if (!variants || variants.length === 0) return null;

  const getIcon = () => {
    switch (type) {
      case "color":
        return "🎨";
      case "size":
        return "📏";
      case "material":
        return "🔧";
      case "capacity":
        return "⚡";
      default:
        return "•";
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "color":
        return "Colors";
      case "size":
        return "Sizes";
      case "material":
        return "Materials";
      case "capacity":
        return "Capacities";
      default:
        return type;
    }
  };

  const displayVariants = variants.slice(0, 4);
  const hasMore = variants.length > 4;

  const getVariantImage = (variantId: string): string | null => {
    const images = variantImagesMap[variantId];
    return images && images.length > 0 ? images[0] : null;
  };

  return (
    <div className="rp-card-variants">
      <span className="rp-variant-label">
        {getIcon()} {getTypeLabel()}:
      </span>
      <div className="rp-variant-thumbnails">
        {displayVariants.map((variant) => {
          const variantImage = getVariantImage(variant.id);
          const isActive = currentValue === variant.attribute_value;
          return (
            <button
              key={variant.id}
              className={`rp-variant-thumb ${isActive ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(variant);
              }}
              title={variant.attribute_value}
            >
              {variantImage ? (
                <img src={variantImage} alt={variant.attribute_value} />
              ) : (
                <span className="rp-variant-text">
                  {variant.attribute_value.charAt(0)}
                </span>
              )}
              <span className="rp-variant-label-text">
                {variant.attribute_value.length > 10
                  ? variant.attribute_value.slice(0, 8) + "..."
                  : variant.attribute_value}
              </span>
            </button>
          );
        })}
        {hasMore && (
          <span className="rp-variant-more">+{variants.length - 4}</span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FETCH RELATED PRODUCTS
───────────────────────────────────────────── */
async function fetchRelatedProducts(
  productId: string,
  category: string,
  limit = 4,
): Promise<ExtendedProduct[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_variants(*, variant_images(*))")
      .eq("is_active", true)
      .eq("category", category)
      .neq("id", productId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error("RelatedProducts fetch error:", error);
      return [];
    }

    if (data.length === 0) {
      return [];
    }

    return data.map((item: any) => {
      // Build variants array
      const variants: ProductVariant[] = (item.product_variants || []).map(
        (variant: any) => {
          const variantImages = (variant.variant_images || [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((img: any) => img.image_url);

          return {
            id: variant.id,
            product_id: variant.product_id,
            attribute_type: variant.attribute_type,
            attribute_value: variant.attribute_value,
            price: variant.price,
            original_price: variant.original_price,
            description: variant.description,
            stock: variant.stock,
            low_stock_threshold: variant.low_stock_threshold,
            images: variantImages,
            stockStatus: getStockStatus(
              variant.stock,
              variant.low_stock_threshold,
            ),
          };
        },
      );

      // Sort variants by priority
      const sortedVariants = [...variants].sort(
        (a, b) =>
          (typePriority[a.attribute_type] ?? 5) -
          (typePriority[b.attribute_type] ?? 5),
      );

      // Build variant images map
      const variantImagesMap: VariantImagesMap = {};
      variants.forEach((v) => {
        if (v.images && v.images.length > 0) {
          variantImagesMap[v.id] = v.images;
        }
      });

      // Get best variant (first in priority)
      const bestVariant = sortedVariants[0];

      // Get images - prefer variant images, fallback to product images
      const images =
        bestVariant?.images?.length > 0
          ? bestVariant.images
          : item.images || [];

      const stock = bestVariant?.stock ?? item.stock ?? 0;
      const lowStockThreshold =
        bestVariant?.low_stock_threshold ?? item.low_stock_threshold ?? null;

      return {
        id: item.id,
        name: item.name || "",
        description: item.description || "",
        price: bestVariant?.price ?? item.price ?? 0,
        original_price:
          bestVariant?.original_price ?? item.original_price ?? undefined,
        category: item.category,
        subcategory: item.subcategory,
        images,
        stock,
        brand: item.brand || undefined,
        condition: item.condition || "new",
        is_featured: item.is_featured || false,
        is_active: item.is_active ?? true,
        rating: item.rating,
        reviews_count: item.reviews_count,
        low_stock_threshold: lowStockThreshold,
        stockStatus: getStockStatus(stock, lowStockThreshold),
        variants: sortedVariants,
        variantImagesMap,
      };
    });
  } catch (err) {
    console.error("RelatedProducts unexpected error:", err);
    return [];
  }
}

/* ─────────────────────────────────────────────
   RELATED PRODUCT CARD - Like FeaturedProducts Card
───────────────────────────────────────────── */
function RelatedProductCard({
  product,
  formatPrice,
  addToCart,
}: {
  product: ExtendedProduct;
  formatPrice: (value: number) => string;
  addToCart: (
    product: any,
    variant: any,
    quantity: number,
    maxStock?: number,
  ) => Promise<void>;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.length > 0 ? product.variants[0] : null,
  );
  const [currentImages, setCurrentImages] = useState<string[]>(() => {
    if (
      product.variants.length > 0 &&
      product.variantImagesMap[product.variants[0].id]
    ) {
      return product.variantImagesMap[product.variants[0].id];
    }
    return product.images || [];
  });
  const [addToCartLoading, setAddToCartLoading] = useState(false);

  /* ── Live rating state ── */
  const [liveRating, setLiveRating] = useState<number | null>(
    product.rating != null && product.rating > 0 ? product.rating : null,
  );
  const [liveReviewCount, setLiveReviewCount] = useState<number | null>(
    product.reviews_count != null && product.reviews_count > 0
      ? product.reviews_count
      : null,
  );

  /* ── Realtime subscription for new reviews ── */
  useEffect(() => {
    const channel = supabase
      .channel(`rp-live-${product.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "product_reviews",
          filter: `product_id=eq.${product.id}`,
        },
        async () => {
          const { data } = await supabase
            .from("products")
            .select("rating, reviews_count")
            .eq("id", product.id)
            .single();
          if (data) {
            if (data.rating != null && data.rating > 0) {
              setLiveRating(data.rating);
            }
            if (data.reviews_count != null && data.reviews_count > 0) {
              setLiveReviewCount(data.reviews_count);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [product.id]);

  // Filter variants by type
  const colorVariants = product.variants.filter(
    (v) => v.attribute_type === "color",
  );
  const sizeVariants = product.variants.filter(
    (v) => v.attribute_type === "size",
  );
  const materialVariants = product.variants.filter(
    (v) => v.attribute_type === "material",
  );
  const capacityVariants = product.variants.filter(
    (v) => v.attribute_type === "capacity",
  );

  const getVariantImages = useCallback(
    (variantId: string): string[] => product.variantImagesMap[variantId] || [],
    [product.variantImagesMap],
  );

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    const newImages = getVariantImages(variant.id);
    setCurrentImages(newImages);
    setCurrentImageIndex(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (currentImages.length > 1) setCurrentImageIndex(1);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCurrentImageIndex(0);
  };

  const getDisplayImage = () => {
    if (currentImages.length === 0) return null;
    if (isHovered && currentImages.length > 1) return currentImages[1];
    return currentImages[currentImageIndex];
  };

  const displayImage = getDisplayImage();

  const currentPrice = selectedVariant?.price ?? product.price;
  const currentOriginalPrice =
    selectedVariant?.original_price ?? product.original_price;
  const currentStock = selectedVariant?.stock ?? product.stock;
  const stockStatus = getStockStatus(currentStock, product.low_stock_threshold);
  const isLowStock = stockStatus === "low_stock";
  const isOutOfStock = stockStatus === "out_of_stock";

  const discount =
    currentOriginalPrice && currentOriginalPrice > currentPrice
      ? Math.round(
          ((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100,
        )
      : 0;

  const getStockLabel = () => {
    if (isOutOfStock) return "Out of Stock";
    if (isLowStock) return `Only ${currentStock} left`;
    return "In Stock";
  };

  const getStockClass = () => {
    if (isOutOfStock) return "out";
    if (isLowStock) return "low";
    return "in";
  };

  const truncatedName = truncateProductName(product.name, 45);

  const handleAddToCartClick = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      alert("This product is out of stock");
      return;
    }
    if (addToCartLoading) return;
    setAddToCartLoading(true);
    try {
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
        images: currentImages.length > 0 ? currentImages : product.images,
        price: currentPrice,
        original_price: currentOriginalPrice,
        stock: currentStock,
        low_stock_threshold: product.low_stock_threshold,
        stockStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await addToCart(productToAdd, selectedVariant, 1, 1);
    } finally {
      setAddToCartLoading(false);
    }
  };

  return (
    <div
      onClick={() => {
        window.location.href = `/product/${product.id}`;
      }}
      className="rp-card"
      style={{ cursor: "pointer" }}
    >
      <div
        className="rp-card-img"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {displayImage ? (
          <img src={displayImage} alt={product.name} loading="lazy" />
        ) : (
          <div className="rp-img-placeholder">
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

        {/* Badges */}
        <div className="rp-card-badges">
          {product.is_featured && (
            <span className="rp-badge rp-badge--feat">Featured</span>
          )}
          {discount > 0 && (
            <span className="rp-badge rp-badge--sale">-{discount}%</span>
          )}
          {product.condition === "new" && !discount && (
            <span className="rp-badge rp-badge--new">New</span>
          )}
          {isLowStock && (
            <span className="rp-badge rp-badge--low">Low Stock</span>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="rp-icon-buttons">
          <button
            className="rp-icon-btn rp-icon-btn--cart"
            onClick={handleAddToCartClick}
            aria-label="Add to Cart"
            disabled={isOutOfStock || addToCartLoading}
          >
            {addToCartLoading ? (
              <LoadingSpinner size={18} />
            ) : (
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
            )}
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="rp-card-body">
        {product.brand && <p className="rp-card-brand">{product.brand}</p>}
        <h3 className="rp-card-name" title={product.name}>
          {truncatedName}
        </h3>

        <div className="rp-card-price-row">
          <span className="rp-card-price">{formatPrice(currentPrice)}</span>
          {currentOriginalPrice && currentOriginalPrice > currentPrice && (
            <span className="rp-card-orig">
              {formatPrice(currentOriginalPrice)}
            </span>
          )}
          {discount > 0 && (
            <span className="rp-card-discount">-{discount}%</span>
          )}
        </div>

        {/* Rating */}
        {liveRating !== null &&
          liveReviewCount !== null &&
          liveReviewCount > 0 && (
            <div className="rp-rating">
              <StarDisplay rating={liveRating} size={11} />
              <span className="rp-rating-count">({liveReviewCount})</span>
            </div>
          )}

        {/* Variant Thumbnails - Like FeaturedProducts */}
        {colorVariants.length > 0 && (
          <VariantThumbnails
            variants={colorVariants}
            type="color"
            onSelect={handleVariantSelect}
            currentValue={selectedVariant?.attribute_value || ""}
            variantImagesMap={product.variantImagesMap}
          />
        )}
        {sizeVariants.length > 0 && (
          <VariantThumbnails
            variants={sizeVariants}
            type="size"
            onSelect={handleVariantSelect}
            currentValue={selectedVariant?.attribute_value || ""}
            variantImagesMap={product.variantImagesMap}
          />
        )}
        {materialVariants.length > 0 && (
          <VariantThumbnails
            variants={materialVariants}
            type="material"
            onSelect={handleVariantSelect}
            currentValue={selectedVariant?.attribute_value || ""}
            variantImagesMap={product.variantImagesMap}
          />
        )}
        {capacityVariants.length > 0 && (
          <VariantThumbnails
            variants={capacityVariants}
            type="capacity"
            onSelect={handleVariantSelect}
            currentValue={selectedVariant?.attribute_value || ""}
            variantImagesMap={product.variantImagesMap}
          />
        )}

        {/* Stock Status */}
        <div className={`rp-card-stock ${getStockClass()}`}>
          {getStockLabel()}
        </div>
      </div>

      <div className="rp-card-line" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
export default function RelatedProducts({
  productId,
  category,
  limit = 4,
}: RelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const { formatPrice } = useCurrency();
  const { addToCart } = useCartStore();

  /* ── Load products ── */
  useEffect(() => {
    if (!productId || !category) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchRelatedProducts(productId, category, limit).then((data) => {
      if (!cancelled) {
        setRelatedProducts(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [productId, category, limit]);

  /* ── IntersectionObserver for scroll-reveal ── */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [relatedProducts]);

  const getCategoryLabel = (cat: string): string => {
    const labels: Record<string, string> = {
      Accessories: "Mobile Accessories",
      Watches: "Watches",
      Automotive: "Automotive",
      "Home Decor": "Home Décor",
    };
    return labels[cat] || cat;
  };

  /* ── Skeleton while loading ── */
  if (loading) {
    return (
      <section className="rp-section">
        <div className="rp-header">
          <p className="rp-eyebrow">
            <span className="rp-eye-line" />
            More from this collection
            <span className="rp-eye-line" />
          </p>
          <h2 className="rp-title">
            You May Also <em>Like</em>
          </h2>
        </div>
        <div className="rp-grid">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="rp-skeleton-card">
              <div className="rp-skeleton-img" />
              <div className="rp-skeleton-body">
                <div className="rp-skeleton-line" style={{ width: "60%" }} />
                <div className="rp-skeleton-line" style={{ width: "80%" }} />
                <div className="rp-skeleton-line" style={{ width: "50%" }} />
                <div className="rp-skeleton-line" style={{ width: "70%" }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (relatedProducts.length === 0) return null;

  const catLabel = getCategoryLabel(category);

  return (
    <section className="rp-section rp-reveal" ref={sectionRef}>
      <div className="rp-header">
        <p className="rp-eyebrow">
          <span className="rp-eye-line" />
          More from {catLabel}
          <span className="rp-eye-line" />
        </p>
        <h2 className="rp-title">
          You May Also <em>Like</em>
        </h2>
      </div>
      <div className="rp-grid">
        {relatedProducts.map((product) => (
          <RelatedProductCard
            key={product.id}
            product={product}
            formatPrice={formatPrice}
            addToCart={addToCart}
          />
        ))}
      </div>

      <style>{`
        @keyframes rp-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
