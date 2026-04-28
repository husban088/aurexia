"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { supabase } from "@/lib/supabase";
import "./QuickView.css";
import { useCurrency } from "../context/CurrencyContext";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  stockStatus?: "in_stock" | "out_of_stock" | "low_stock";
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

interface QuickViewProduct {
  id: string;
  name: string;
  brand?: string;
  price: number;
  original_price?: number;
  category: string;
  subcategory: string;
  images: string[];
  stock: number;
  description?: string;
  condition?: string;
  is_featured?: boolean;
  is_active?: boolean;
  rating?: number;
  reviews_count?: number;
  stockStatus?: "in_stock" | "out_of_stock" | "low_stock";
  lowStockThreshold?: number | null;
}

interface QuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  product: QuickViewProduct | null;
  variants?: ProductVariant[];
  selectedVariant?: ProductVariant | null;
  variantImagesMap?: Record<string, string[]>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const getStockStatus = (
  stock: number,
  threshold?: number | null
): "in_stock" | "out_of_stock" | "low_stock" => {
  if (stock === 0) return "out_of_stock";
  if (stock >= 999999) return "in_stock";
  if (threshold && threshold > 0 && stock <= threshold) return "low_stock";
  return "in_stock";
};

const getStockLabel = (
  status: "in_stock" | "out_of_stock" | "low_stock",
  stock: number
) => {
  if (status === "out_of_stock") return "Out of Stock";
  if (status === "low_stock") return `Only ${stock} left`;
  return "In Stock";
};

const getStockClass = (status: "in_stock" | "out_of_stock" | "low_stock") => {
  if (status === "out_of_stock") return "out";
  if (status === "low_stock") return "low";
  return "in";
};

// ── Star Rating Component ─────────────────────────────────────────────────────

function QVStarDisplay({
  rating,
  size = 13,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={i <= Math.round(rating) ? "#daa520" : "none"}
            stroke="#daa520"
            strokeWidth="1.5"
            opacity={i <= Math.round(rating) ? 1 : 0.3}
          />
        </svg>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function QuickView({
  isOpen,
  onClose,
  product,
  variants = [],
  selectedVariant: propSelectedVariant,
  variantImagesMap = {},
}: QuickViewProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCartStore();
  const { formatPrice } = useCurrency();

  // ── Local state ──────────────────────────────────────────────────────────────
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bulkTiers, setBulkTiers] = useState<BulkPricingTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<BulkPricingTier | null>(
    null
  );
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [liveRating, setLiveRating] = useState<number | undefined>(
    product?.rating
  );
  const [liveReviewCount, setLiveReviewCount] = useState<number | undefined>(
    product?.reviews_count
  );

  // ── Set initial variant when product/variants change ─────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (propSelectedVariant) {
      setSelectedVariant(propSelectedVariant);
    } else if (variants.length > 0) {
      setSelectedVariant(variants[0]);
    } else {
      setSelectedVariant(null);
    }
    setSelectedTier(null);
    setCurrentImageIndex(0);
  }, [isOpen, product?.id, propSelectedVariant, variants]);

  // ── Update images when selected variant changes ───────────────────────────────
  useEffect(() => {
    if (selectedVariant && variantImagesMap[selectedVariant.id]?.length > 0) {
      setCurrentImages(variantImagesMap[selectedVariant.id]);
      setCurrentImageIndex(0);
    } else if (product?.images?.length) {
      setCurrentImages(product.images);
      setCurrentImageIndex(0);
    } else {
      setCurrentImages([]);
      setCurrentImageIndex(0);
    }
  }, [selectedVariant, variantImagesMap, product?.images]);

  // ── Fetch bulk pricing tiers when variant changes ─────────────────────────────
  useEffect(() => {
    let cancelled = false;

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

        if (cancelled) return;

        if (!error && data && data.length > 0) {
          setBulkTiers(data);
        } else {
          setBulkTiers([]);
        }
        setSelectedTier(null);
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching bulk tiers:", err);
          setBulkTiers([]);
          setSelectedTier(null);
        }
      } finally {
        if (!cancelled) setLoadingTiers(false);
      }
    }

    fetchBulkTiers();
    return () => {
      cancelled = true;
    };
  }, [selectedVariant?.id]);

  // ── Sync live rating ──────────────────────────────────────────────────────────
  useEffect(() => {
    setLiveRating(product?.rating);
    setLiveReviewCount(product?.reviews_count);
  }, [product?.rating, product?.reviews_count]);

  useEffect(() => {
    if (!isOpen || !product?.id) return;
    supabase
      .from("products")
      .select("rating, reviews_count")
      .eq("id", product.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setLiveRating(data.rating);
          setLiveReviewCount(data.reviews_count);
        }
      });
  }, [isOpen, product?.id]);

  // ── Body scroll lock ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ── Escape key ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // ── Outside click ─────────────────────────────────────────────────────────────
  const handleOutsideClick = useCallback(
    (e: React.MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node))
        onClose();
    },
    [onClose]
  );

  // ── Helper: get variant thumbnail image ───────────────────────────────────────
  const getVariantImage = useCallback(
    (variantId: string): string | null => {
      const images = variantImagesMap[variantId];
      return images && images.length > 0 ? images[0] : null;
    },
    [variantImagesMap]
  );

  // ── Tier label ────────────────────────────────────────────────────────────────
  const getTierLabel = (tier: BulkPricingTier): string => {
    if (tier.min_quantity === tier.max_quantity) {
      return `${tier.min_quantity} Piece${tier.min_quantity > 1 ? "s" : ""}`;
    }
    return `${tier.min_quantity} – ${tier.max_quantity} Pieces`;
  };

  // ── Savings per piece vs single unit price ────────────────────────────────────
  const getTierSavingsPerPc = (tier: BulkPricingTier): number => {
    const unitPrice = selectedVariant?.price ?? product?.price ?? 0;
    const perPiece = tier.tier_price / tier.min_quantity;
    return Math.max(0, unitPrice - perPiece);
  };

  if (!isOpen || !product) return null;

  // ── Price calculations ────────────────────────────────────────────────────────

  const getCurrentPrice = (): number => {
    if (selectedTier) return selectedTier.tier_price;
    return selectedVariant?.price ?? product.price;
  };

  const getPerPiecePrice = (): number => {
    if (selectedTier)
      return selectedTier.tier_price / selectedTier.min_quantity;
    return selectedVariant?.price ?? product.price;
  };

  const getDiscountPercentage = (): number => {
    if (selectedTier) {
      if (selectedTier.discount_percentage)
        return selectedTier.discount_percentage;
      const unitPrice = selectedVariant?.price ?? product.price;
      const perPiece = getPerPiecePrice();
      if (unitPrice > perPiece)
        return Math.round(((unitPrice - perPiece) / unitPrice) * 100);
    } else {
      const base = selectedVariant?.price ?? product.price;
      const orig = selectedVariant?.original_price ?? product.original_price;
      if (orig && orig > base) return Math.round(((orig - base) / orig) * 100);
    }
    return 0;
  };

  const getOriginalPriceDisplay = (): number | null => {
    if (selectedTier) {
      const unitPrice = selectedVariant?.price ?? product.price;
      const totalOriginal = unitPrice * selectedTier.min_quantity;
      if (totalOriginal > selectedTier.tier_price) return totalOriginal;
      return null;
    }
    return selectedVariant?.original_price ?? product.original_price ?? null;
  };

  const discount = getDiscountPercentage();
  const currentPrice = getCurrentPrice();
  const currentOriginalPrice = getOriginalPriceDisplay();
  const currentStock = selectedVariant?.stock ?? product.stock;
  const currentLowStockThreshold =
    selectedVariant?.low_stock_threshold ?? product?.lowStockThreshold ?? null;

  const stockStatus = getStockStatus(currentStock, currentLowStockThreshold);
  const stockLabel = getStockLabel(stockStatus, currentStock);
  const stockClass = getStockClass(stockStatus);

  // Group variants by attribute_type
  const variantsByType: Record<string, ProductVariant[]> = {};
  variants.forEach((v) => {
    if (!variantsByType[v.attribute_type])
      variantsByType[v.attribute_type] = [];
    variantsByType[v.attribute_type].push(v);
  });

  // ── Add to Cart handler ───────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!product) return;

    if (stockStatus === "out_of_stock") {
      alert("This product is out of stock");
      return;
    }

    // FIX: Physical pieces jo add karne hain
    // Tier selected hai toh min_quantity pieces, otherwise 1 piece
    const piecesToAdd = selectedTier ? selectedTier.min_quantity : 1;

    // Low stock check
    if (stockStatus === "low_stock") {
      if (currentStock <= 0) {
        alert("This product is out of stock");
        return;
      }
      if (piecesToAdd > currentStock) {
        alert(
          `Only ${currentStock} item${currentStock > 1 ? "s" : ""} in stock.`
        );
        return;
      }
    }

    // FIX: variant_price hamesha PER PIECE price
    let perPiecePrice: number;
    let piecesPerUnit: number;

    if (selectedTier) {
      // Tier_price total hai, per piece price = total / quantity
      perPiecePrice = selectedTier.tier_price / selectedTier.min_quantity;
      piecesPerUnit = selectedTier.min_quantity;
    } else {
      perPiecePrice = selectedVariant?.price ?? product.price;
      piecesPerUnit = 1;
    }

    const productToAdd = {
      id: product.id,
      name: product.name,
      description: selectedVariant?.description || product.description || "",
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand || "",
      condition: product.condition || "new",
      is_featured: product.is_featured || false,
      is_active: product.is_active ?? true,
      images: currentImages,
      price: perPiecePrice,
      original_price: selectedVariant?.original_price ?? product.original_price,
      stock: currentStock,
      low_stock_threshold: currentLowStockThreshold,
      stockStatus: stockStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addToCart(productToAdd, selectedVariant ?? null, 1, piecesPerUnit);
    onClose();
  };

  const handleBuyNow = () => {
    handleAddToCart();
    window.location.href = "/checkout";
  };

  const getCartButtonLabel = () => {
    if (selectedTier) {
      return `Add to Cart (${selectedTier.min_quantity} pcs)`;
    }
    return "Add to Cart (1 pc)";
  };

  return (
    <div className="qv-overlay" onClick={handleOutsideClick}>
      <div className="qv-modal" ref={modalRef}>
        <button className="qv-close" onClick={onClose} aria-label="Close">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="qv-corner qv-corner-tl" />
        <div className="qv-corner qv-corner-tr" />
        <div className="qv-corner qv-corner-bl" />
        <div className="qv-corner qv-corner-br" />

        <div className="qv-grid">
          {/* Gallery */}
          <div className="qv-gallery">
            <div className="qv-main-img">
              {currentImages[currentImageIndex] ? (
                <img
                  src={currentImages[currentImageIndex]}
                  alt={product.name}
                />
              ) : (
                <div className="qv-img-placeholder">
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
              {discount > 0 && (
                <div className="qv-discount-badge">-{discount}%</div>
              )}
            </div>

            {currentImages.length > 1 && (
              <div className="qv-thumbs">
                {currentImages.slice(0, 4).map((img, idx) => (
                  <button
                    key={idx}
                    className={`qv-thumb${
                      currentImageIndex === idx ? " active" : ""
                    }`}
                    onClick={() => setCurrentImageIndex(idx)}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="qv-info" ref={infoRef}>
            <div className="qv-eyebrow">
              <span className="qv-ey-line" />
              {product.subcategory || product.category}
              <span className="qv-ey-line" />
            </div>

            {product.brand && <p className="qv-brand">{product.brand}</p>}

            <h2 className="qv-title">{product.name}</h2>

            {liveRating != null && liveReviewCount && liveReviewCount > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "-0.25rem",
                  marginBottom: "0.25rem",
                }}
              >
                <QVStarDisplay rating={liveRating} size={13} />
                <span
                  style={{
                    fontFamily: "var(--fp-sans, 'Josefin Sans', sans-serif)",
                    fontSize: "0.65rem",
                    fontWeight: 500,
                    color: "#daa520",
                  }}
                >
                  {liveRating.toFixed(1)}
                </span>
                <span
                  style={{
                    fontFamily: "var(--fp-sans, 'Josefin Sans', sans-serif)",
                    fontSize: "0.6rem",
                    color: "#888",
                  }}
                >
                  ({liveReviewCount})
                </span>
              </div>
            )}

            <div className="qv-price-row">
              <span className="qv-price">{formatPrice(currentPrice)}</span>
              {currentOriginalPrice && currentOriginalPrice > currentPrice && (
                <span className="qv-orig">
                  {formatPrice(currentOriginalPrice)}
                </span>
              )}
            </div>

            {selectedTier && (
              <div className="qv-per-piece-info">
                <span className="qv-per-piece-label">
                  Per piece: {formatPrice(getPerPiecePrice())}
                </span>
                {getTierSavingsPerPc(selectedTier) > 0 && (
                  <span className="qv-per-piece-saving">
                    Save {formatPrice(getTierSavingsPerPc(selectedTier))}/pc
                  </span>
                )}
              </div>
            )}

            {/* Variant Selectors */}
            {Object.entries(variantsByType).map(([type, typeVariants]) => {
              // Sort: standard first, then others
              const sorted = [...typeVariants].sort((a, b) => {
                if (a.attribute_type === "standard") return -1;
                if (b.attribute_type === "standard") return 1;
                return a.attribute_value.localeCompare(b.attribute_value);
              });

              return (
                <div key={type} className="qv-attr">
                  <span className="qv-attr-label">
                    {type.charAt(0).toUpperCase() + type.slice(1)}:
                  </span>
                  <div className="qv-attr-tags">
                    {sorted.map((variant) => {
                      const thumbImg = getVariantImage(variant.id);
                      const vStock = getStockStatus(
                        variant.stock,
                        variant.low_stock_threshold
                      );
                      const isDisabled = vStock === "out_of_stock";
                      const isActive = selectedVariant?.id === variant.id;

                      return (
                        <button
                          key={variant.id}
                          className={`qv-attr-tag${isActive ? " active" : ""}${
                            isDisabled ? " disabled-variant" : ""
                          }`}
                          onClick={() => {
                            if (isDisabled) return;
                            setSelectedVariant(variant);
                            setSelectedTier(null);
                          }}
                          disabled={isDisabled}
                          title={
                            isDisabled
                              ? `${variant.attribute_value} — Out of Stock`
                              : variant.attribute_value
                          }
                        >
                          {thumbImg && (
                            <img
                              src={thumbImg}
                              alt={variant.attribute_value}
                              className="qv-attr-img"
                            />
                          )}
                          <span>{variant.attribute_value}</span>
                          {isDisabled && (
                            <span className="qv-variant-oos">OOS</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Bulk Pricing Tiers */}
            {bulkTiers.length > 0 && (
              <div className="qv-bulk-section">
                <div className="qv-bulk-header">
                  <span className="qv-attr-label">Quantity Discounts:</span>
                  {selectedTier && (
                    <button
                      className="qv-tier-clear"
                      onClick={() => setSelectedTier(null)}
                      title="Back to single piece"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Clear
                    </button>
                  )}
                </div>

                {loadingTiers ? (
                  <div className="qv-tiers-loading">
                    <div className="qv-tiers-spinner" />
                  </div>
                ) : (
                  <div className="qv-bulk-tiers">
                    {bulkTiers.map((tier, index) => {
                      const isSelected =
                        selectedTier?.id === tier.id &&
                        selectedTier?.min_quantity === tier.min_quantity;
                      const perPiece = tier.tier_price / tier.min_quantity;
                      const unitPrice = selectedVariant?.price ?? product.price;
                      const saving = unitPrice - perPiece;
                      const isBestValue =
                        index === bulkTiers.length - 1 && bulkTiers.length > 1;

                      return (
                        <button
                          key={tier.id ?? `tier-${index}`}
                          className={`qv-bulk-tier${
                            isSelected ? " active" : ""
                          }${isBestValue ? " best-value" : ""}`}
                          onClick={() => {
                            setSelectedTier(isSelected ? null : tier);
                          }}
                        >
                          <div className="qv-bulk-tier-qty">
                            {getTierLabel(tier)}
                            {isBestValue && (
                              <span className="qv-bulk-best">Best Value</span>
                            )}
                          </div>
                          <div className="qv-bulk-tier-price">
                            {formatPrice(tier.tier_price)}
                          </div>
                          <div className="qv-bulk-tier-perpiece">
                            {formatPrice(perPiece)}/pc
                          </div>
                          {saving > 0 && (
                            <div className="qv-bulk-tier-saving">
                              Save {formatPrice(saving)}/pc
                            </div>
                          )}
                          {tier.discount_percentage != null &&
                            tier.discount_percentage > 0 && (
                              <div className="qv-bulk-tier-discount">
                                {tier.discount_percentage}% OFF
                              </div>
                            )}
                          {isSelected && (
                            <div className="qv-tier-check">
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
                )}
              </div>
            )}

            {/* Selected Tier Summary */}
            {selectedTier && (
              <div className="qv-selected-qty">
                <span className="qv-qty-label">Selected:</span>
                <span className="qv-qty-value">
                  {selectedTier.min_quantity} pieces
                </span>
                <span className="qv-qty-total">
                  Total: {formatPrice(selectedTier.tier_price)}
                </span>
                <button
                  className="qv-qty-clear"
                  onClick={() => setSelectedTier(null)}
                  title="Back to single piece"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    width="12"
                    height="12"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            {/* Description */}
            {(selectedVariant?.description || product.description) && (
              <p className="qv-desc">
                {selectedVariant?.description || product.description}
              </p>
            )}

            {/* Stock Status */}
            <div className="qv-stock">
              <span className={`qv-stock-dot ${stockClass}`} />
              {stockLabel}
            </div>

            {/* Feature Pills */}
            <div className="qv-features">
              <div className="qv-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Authentic
              </div>
              <div className="qv-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Free Delivery
              </div>
              <div className="qv-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                </svg>
                Easy Returns
              </div>
              <div className="qv-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                </svg>
                COD Available
              </div>
            </div>

            {/* Action Buttons */}
            <div className="qv-actions">
              <button
                className="qv-add-cart"
                onClick={handleAddToCart}
                disabled={stockStatus === "out_of_stock"}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                {getCartButtonLabel()}
              </button>
              <button
                className="qv-buy-now"
                onClick={handleBuyNow}
                disabled={stockStatus === "out_of_stock"}
              >
                Buy Now
              </button>
            </div>

            <Link
              href={`/product/${product.id}`}
              className="qv-view-details"
              onClick={onClose}
            >
              View Full Details
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .qv-modal {
          overflow: hidden;
        }
        .qv-grid {
          height: 85vh;
          max-height: 85vh;
          overflow: hidden;
        }
        .qv-gallery {
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(218, 165, 32, 0.3) transparent;
        }
        .qv-gallery::-webkit-scrollbar {
          width: 4px;
        }
        .qv-gallery::-webkit-scrollbar-thumb {
          background: rgba(218, 165, 32, 0.3);
          border-radius: 4px;
        }
        .qv-thumb.active {
          border-color: #daa520;
        }
        .qv-info {
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(218, 165, 32, 0.3) transparent;
        }
        .qv-info::-webkit-scrollbar {
          width: 4px;
        }
        .qv-info::-webkit-scrollbar-thumb {
          background: rgba(218, 165, 32, 0.3);
          border-radius: 4px;
        }
        .qv-attr-tag.disabled-variant {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .qv-variant-oos {
          font-size: 0.5rem;
          font-weight: 700;
          color: #dc2626;
          background: rgba(220, 38, 38, 0.08);
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
          margin-left: 2px;
        }
        .qv-bulk-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .qv-tier-clear {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.25rem 0.65rem;
          background: rgba(220, 38, 38, 0.06);
          border: 1px solid rgba(220, 38, 38, 0.25);
          border-radius: 20px;
          color: #dc2626;
          font-family: "Josefin Sans", sans-serif;
          font-size: 0.6rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .qv-tier-clear svg {
          width: 10px;
          height: 10px;
        }
        .qv-tier-clear:hover {
          background: rgba(220, 38, 38, 0.12);
          border-color: #dc2626;
        }
        .qv-tiers-loading {
          display: flex;
          justify-content: center;
          padding: 1rem 0;
        }
        .qv-tiers-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(218, 165, 32, 0.2);
          border-top-color: #daa520;
          border-radius: 50%;
          animation: qvSpin 0.7s linear infinite;
        }
        @keyframes qvSpin {
          to {
            transform: rotate(360deg);
          }
        }
        .qv-tier-check {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: #daa520;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .qv-tier-check svg {
          width: 12px;
          height: 12px;
          color: white;
        }
        .qv-selected-qty {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.8rem;
          background: rgba(218, 165, 32, 0.08);
          border-radius: 10px;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }
        .qv-qty-label {
          font-family: "Josefin Sans", sans-serif;
          font-size: 0.6rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8b6914;
        }
        .qv-qty-value {
          font-family: "Josefin Sans", sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          color: #1a1a1a;
          background: #ffffff;
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          border: 1px solid rgba(218, 165, 32, 0.2);
        }
        .qv-qty-total {
          font-family: "Cormorant Garamond", serif;
          font-size: 0.85rem;
          font-weight: 700;
          color: #8b6914;
          margin-left: auto;
        }
        .qv-qty-clear {
          background: transparent;
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #dc2626;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .qv-qty-clear:hover {
          background: rgba(220, 38, 38, 0.1);
          border-color: #dc2626;
        }
        .qv-bulk-tiers {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
          max-height: 280px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(218, 165, 32, 0.3) transparent;
          padding-right: 2px;
        }
        .qv-bulk-tiers::-webkit-scrollbar {
          width: 4px;
        }
        .qv-bulk-tiers::-webkit-scrollbar-track {
          background: rgba(218, 165, 32, 0.05);
          border-radius: 4px;
        }
        .qv-bulk-tiers::-webkit-scrollbar-thumb {
          background: rgba(218, 165, 32, 0.35);
          border-radius: 4px;
        }
        .qv-per-piece-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: -0.25rem;
          margin-bottom: 0.5rem;
          padding: 0.25rem 0;
        }
        .qv-per-piece-label {
          font-family: "Josefin Sans", sans-serif;
          font-size: 0.65rem;
          color: #666666;
        }
        .qv-per-piece-saving {
          font-family: "Josefin Sans", sans-serif;
          font-size: 0.6rem;
          font-weight: 600;
          color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
        }
        .qv-bulk-tier {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(218, 165, 32, 0.04);
          border: 1px solid rgba(218, 165, 32, 0.15);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
        }
        .qv-bulk-tier:hover {
          background: rgba(218, 165, 32, 0.08);
          border-color: #daa520;
          transform: translateX(4px);
        }
        .qv-bulk-tier.active {
          background: rgba(218, 165, 32, 0.12);
          border-color: #daa520;
          border-width: 2px;
        }
        .qv-bulk-tier.best-value {
          position: relative;
          overflow: hidden;
        }
        .qv-bulk-tier.best-value::before {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 30px 30px 0;
          border-color: transparent #daa520 transparent transparent;
        }
        .qv-bulk-best {
          font-size: 0.55rem;
          font-weight: 700;
          background: #daa520;
          color: white;
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          margin-left: 0.5rem;
        }
        .qv-bulk-tier-qty {
          font-family: "Josefin Sans", sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .qv-bulk-tier-price {
          font-family: "Cormorant Garamond", serif;
          font-size: 1rem;
          font-weight: 700;
          color: #8b6914;
        }
        .qv-bulk-tier-perpiece {
          font-family: "Josefin Sans", sans-serif;
          font-size: 0.6rem;
          color: #666666;
        }
        .qv-bulk-tier-saving {
          font-family: "Josefin Sans", sans-serif;
          font-size: 0.55rem;
          font-weight: 600;
          color: #22c55e;
        }
        .qv-bulk-tier-discount {
          font-family: "Josefin Sans", sans-serif;
          font-size: 0.55rem;
          font-weight: 700;
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
        }
        @media (max-width: 768px) {
          .qv-grid {
            height: auto;
            max-height: 90vh;
            overflow-y: auto;
            grid-template-columns: 1fr;
          }
          .qv-gallery,
          .qv-info {
            overflow: visible;
          }
        }
        @media (max-width: 500px) {
          .qv-bulk-tier {
            flex-direction: column;
            align-items: flex-start;
          }
          .qv-bulk-tier-price {
            align-self: flex-end;
          }
          .qv-selected-qty {
            flex-direction: column;
            align-items: flex-start;
          }
          .qv-qty-total {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}
