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
  description_rich?: string;
  description_images?: string[];
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
  description_rich?: string;
  description_images?: string[];
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

// Helper to render HTML content safely
const createMarkup = (html: string) => {
  return { __html: html };
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

// ── Description Modal Component for QuickView ─────────────────────────────────

function QVDescriptionModal({
  isOpen,
  onClose,
  description,
  images,
  productName,
}: {
  isOpen: boolean;
  onClose: () => void;
  description: string;
  images: string[];
  productName: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="qv-desc-modal-overlay" onClick={onClose}>
      <div className="qv-desc-modal" onClick={(e) => e.stopPropagation()}>
        <button className="qv-desc-modal-close" onClick={onClose}>
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

        <div className="qv-desc-modal-header">
          <div className="qv-desc-modal-eyebrow">
            <span className="qv-desc-ey-line" />
            Product Description
            <span className="qv-desc-ey-line" />
          </div>
          <h3 className="qv-desc-modal-title">{productName}</h3>
        </div>

        <div className="qv-desc-modal-body">
          {/* Description Images */}
          {images && images.length > 0 && (
            <div className="qv-desc-modal-images">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${productName} description ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Rich Text Description */}
          {description && (
            <div
              className="qv-desc-modal-content"
              dangerouslySetInnerHTML={createMarkup(description)}
            />
          )}
        </div>
      </div>
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

  // ── Description Modal State ──────────────────────────────────────────────────
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);

  // Get current description (from variant or product)
  const getCurrentDescription = (): string => {
    if (selectedVariant?.description_rich) {
      return selectedVariant.description_rich;
    }
    if (selectedVariant?.description) {
      return selectedVariant.description;
    }
    if (product?.description_rich) {
      return product.description_rich;
    }
    if (product?.description) {
      return product.description;
    }
    return "";
  };

  const getCurrentDescriptionImages = (): string[] => {
    if (
      selectedVariant?.description_images &&
      selectedVariant.description_images.length > 0
    ) {
      return selectedVariant.description_images;
    }
    if (product?.description_images && product.description_images.length > 0) {
      return product.description_images;
    }
    return [];
  };

  const currentDescription = getCurrentDescription();
  const currentDescriptionImages = getCurrentDescriptionImages();

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

    const piecesToAdd = selectedTier ? selectedTier.min_quantity : 1;

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

    let perPiecePrice: number;
    let piecesPerUnit: number;

    if (selectedTier) {
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

  const hasDescription = currentDescription && currentDescription.length > 0;

  return (
    <>
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
                {currentOriginalPrice &&
                  currentOriginalPrice > currentPrice && (
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
                            className={`qv-attr-tag${
                              isActive ? " active" : ""
                            }${isDisabled ? " disabled-variant" : ""}`}
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
                        const unitPrice =
                          selectedVariant?.price ?? product.price;
                        const saving = unitPrice - perPiece;
                        const isBestValue =
                          index === bulkTiers.length - 1 &&
                          bulkTiers.length > 1;

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

              {/* ✅ DESCRIPTION SECTION - Click to open modal with full rich text */}
              {/* <div className="qv-desc-section">
                <div
                  className="qv-desc-header"
                  onClick={() => hasDescription && setIsDescModalOpen(true)}
                  style={{ cursor: hasDescription ? "pointer" : "default" }}
                >
                  <div className="qv-desc-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M4 6h16M4 12h16M4 18h16" />
                      <path d="M8 6v12" />
                      <path d="M16 6v12" />
                    </svg>
                  </div>
                  <div className="qv-desc-label">
                    Product Description
                    {hasDescription && (
                      <span>Click to view full details →</span>
                    )}
                  </div>
                  {hasDescription && (
                    <div className="qv-desc-toggle">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  )}
                </div>

                {hasDescription && (
                  <div className="qv-desc-preview">
                    {currentDescription.length > 120
                      ? currentDescription
                          .replace(/<[^>]*>/g, "")
                          .substring(0, 120) + "..."
                      : currentDescription.replace(/<[^>]*>/g, "")}
                  </div>
                )}
              </div> */}

              <div className="qv-stock">
                <span className={`qv-stock-dot ${stockClass}`} />
                {stockLabel}
              </div>

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
      </div>

      {/* Description Modal */}
      <QVDescriptionModal
        isOpen={isDescModalOpen}
        onClose={() => setIsDescModalOpen(false)}
        description={currentDescription}
        images={currentDescriptionImages}
        productName={
          product.name +
          (selectedVariant && selectedVariant.attribute_type !== "standard"
            ? ` (${selectedVariant.attribute_value})`
            : "")
        }
      />

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

        /* Description Section Styles */
        .qv-desc-section {
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          border-top: 1px solid rgba(218, 165, 32, 0.15);
          padding-top: 0.75rem;
        }
        .qv-desc-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 0;
          transition: all 0.2s ease;
        }
        .qv-desc-header:hover {
          gap: 0.8rem;
        }
        .qv-desc-icon {
          width: 28px;
          height: 28px;
          background: rgba(218, 165, 32, 0.08);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .qv-desc-icon svg {
          width: 14px;
          height: 14px;
          color: #daa520;
        }
        .qv-desc-label {
          flex: 1;
          font-family: "Josefin Sans", sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #1a1a1a;
        }
        .qv-desc-label span {
          display: block;
          font-size: 0.55rem;
          font-weight: 400;
          letter-spacing: 0.05em;
          text-transform: none;
          color: #daa520;
          margin-top: 0.15rem;
        }
        .qv-desc-toggle svg {
          width: 14px;
          height: 14px;
          color: #daa520;
        }
        .qv-desc-preview {
          font-family: "Josefin Sans", sans-serif;
          font-size: 0.7rem;
          line-height: 1.5;
          color: #666;
          margin-top: 0.25rem;
          padding-left: 2.5rem;
          border-left: 2px solid rgba(218, 165, 32, 0.3);
        }

        /* Description Modal Styles */
        .qv-desc-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(8px);
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: qvDescFadeIn 0.3s ease;
        }
        @keyframes qvDescFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .qv-desc-modal {
          position: relative;
          width: 90%;
          max-width: 800px;
          max-height: 85vh;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          animation: qvDescSlideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes qvDescSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .qv-desc-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.3s ease;
        }
        .qv-desc-modal-close svg {
          width: 20px;
          height: 20px;
          color: #666;
        }
        .qv-desc-modal-close:hover {
          background: rgba(218, 165, 32, 0.15);
          transform: rotate(90deg);
        }
        .qv-desc-modal-close:hover svg {
          color: #daa520;
        }
        .qv-desc-modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(218, 165, 32, 0.15);
          background: #faf8f5;
        }
        .qv-desc-modal-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: "Josefin Sans", sans-serif;
          font-size: 0.55rem;
          font-weight: 600;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #daa520;
          margin-bottom: 0.5rem;
        }
        .qv-desc-ey-line {
          width: 30px;
          height: 1px;
          background: #daa520;
        }
        .qv-desc-modal-title {
          font-family: "Cormorant Garamond", serif;
          font-size: 1.8rem;
          font-weight: 500;
          color: #1a1a1a;
          margin: 0;
        }
        .qv-desc-modal-body {
          padding: 2rem;
          overflow-y: auto;
          max-height: calc(85vh - 120px);
        }
        .qv-desc-modal-images {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .qv-desc-modal-images img {
          max-width: 100%;
          max-height: 200px;
          border-radius: 12px;
          border: 1px solid rgba(218, 165, 32, 0.2);
        }
        .qv-desc-modal-content {
          font-family: "Josefin Sans", sans-serif;
          font-size: 0.85rem;
          line-height: 1.7;
          color: #444;
        }
        .qv-desc-modal-content p {
          margin-bottom: 1rem;
        }
        .qv-desc-modal-content img {
          max-width: 100%;
          border-radius: 12px;
          margin: 1rem 0;
        }
        .qv-desc-modal-content ul,
        .qv-desc-modal-content ol {
          margin: 0.5rem 0 1rem 1.5rem;
        }
        .qv-desc-modal-content li {
          margin-bottom: 0.25rem;
        }
        .qv-desc-modal-content h1,
        .qv-desc-modal-content h2,
        .qv-desc-modal-content h3 {
          font-family: "Cormorant Garamond", serif;
          margin: 1rem 0 0.5rem;
          color: #1a1a1a;
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
          .qv-desc-modal-title {
            font-size: 1.3rem;
          }
          .qv-desc-modal-body {
            padding: 1.2rem;
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
    </>
  );
}
