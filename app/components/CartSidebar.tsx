"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { useCouponStore } from "@/lib/couponStore";
import "./cartsidebar.css";
import { useCurrency } from "../context/CurrencyContext";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const [mounted, setMounted] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState<{
    text: string;
    success: boolean;
  } | null>(null);
  const [isClient, setIsClient] = useState(false);

  const items = useCartStore((state) => state.items);
  const loading = useCartStore((state) => state.loading);
  const initialized = useCartStore((state) => state.initialized);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  const subtotalPKR = useCartStore((state) =>
    state.items.reduce((t, i) => {
      const price = i.variant_price ?? i.product?.price ?? 0;
      const ppu = i.pieces_per_unit ?? 1;
      return t + price * ppu * i.quantity;
    }, 0),
  );

  const cartUnitCount = useCartStore((state) =>
    state.items.reduce((t, i) => t + i.quantity, 0),
  );

  const totalPieces = useCartStore((state) =>
    state.items.reduce((t, i) => t + (i.pieces_per_unit ?? 1) * i.quantity, 0),
  );

  const { formatPrice, currency } = useCurrency();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  // Coupon store
  const {
    appliedCode,
    discountPercent,
    discountLabel,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    getFinalTotal,
    fetchCouponSettings, // ✅ Added fetchCouponSettings
  } = useCouponStore();

  // Coupon calculations
  const discountAmountPKR = getDiscountAmount(subtotalPKR);
  const shippingPKR = 0;
  const totalPKR = getFinalTotal(subtotalPKR) + shippingPKR;

  // Handle coupon apply
  const handleApplyCoupon = () => {
    if (!couponInput.trim()) {
      setCouponMessage({ text: "Please enter a coupon code.", success: false });
      return;
    }
    const result = applyCoupon(couponInput);
    setCouponMessage({ text: result.message, success: result.success });
    if (result.success) {
      setCouponInput("");
    }
  };

  // Handle coupon remove
  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponMessage(null);
    setCouponInput("");
  };

  // Handle Enter key
  const handleCouponKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApplyCoupon();
    }
  };

  // Mark client-side after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Set mounted after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch cart when sidebar opens and not initialized
  useEffect(() => {
    if (isOpen && !initialized && mounted) {
      fetchCart();
    }
  }, [isOpen, initialized, fetchCart, mounted]);

  // ✅ Refresh coupon settings when sidebar opens
  useEffect(() => {
    if (isOpen && mounted) {
      fetchCouponSettings();
    }
  }, [isOpen, mounted, fetchCouponSettings]);

  // Handle body scroll lock
  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, mounted]);

  // Handle escape key
  useEffect(() => {
    if (!mounted) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, mounted]);

  // Auto remove out of stock items
  useEffect(() => {
    if (!items.length || !mounted) return;
    items.forEach((item) => {
      const stockStatus = item.variantStockStatus ?? "in_stock";
      const variantStock = item.variantStock ?? 999999;
      if (
        (stockStatus === "out_of_stock" || variantStock === 0) &&
        !removingItems.has(item.id)
      ) {
        setRemovingItems((prev) => new Set(prev).add(item.id));
        removeFromCart(item.id).then(() => {
          setRemovingItems((prev) => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
        });
      }
    });
  }, [items, removeFromCart, removingItems, mounted]);

  const handleSidebarClick = (e: React.MouseEvent) => e.stopPropagation();

  const handleCheckoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    setTimeout(() => {
      window.location.href = "/checkout";
    }, 150);
  };

  const handleViewCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    setTimeout(() => {
      window.location.href = "/cart";
    }, 150);
  };

  const showSpinner = loading && items.length === 0;

  // Don't render anything on server to prevent hydration mismatch
  if (!isClient) {
    return null;
  }

  return (
    <>
      <div
        className={`cs-overlay${isOpen ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={sidebarRef}
        className={`cs-sidebar${isOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        onClick={handleSidebarClick}
        suppressHydrationWarning
      >
        <div className="cs-deco" aria-hidden="true">
          <div className="cs-deco-ring" />
          <div className="cs-deco-ring cs-deco-ring--2" />
        </div>

        <div className="cs-header">
          <div className="cs-header-left">
            <p className="cs-eyebrow">
              <span className="cs-ey-line" />
              Your Cart
              <span className="cs-ey-line" />
            </p>
            <h2 className="cs-title">
              {cartUnitCount === 0 ? (
                showSpinner ? (
                  "..."
                ) : (
                  "Empty"
                )
              ) : (
                <>
                  <em>{cartUnitCount}</em>{" "}
                  {cartUnitCount === 1 ? "Item" : "Items"}
                </>
              )}
            </h2>
          </div>
          <button
            className="cs-close-btn"
            onClick={onClose}
            aria-label="Close cart"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* FREE SHIPPING BANNER */}
        {cartUnitCount > 0 && (
          <div className="cs-shipping-bar cs-shipping-bar--achieved">
            <p className="cs-shipping-text">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="13"
                height="13"
              >
                <polyline
                  points="20 6 9 17 4 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Free Shipping
            </p>
          </div>
        )}

        <div className="cs-items">
          {showSpinner ? (
            <div className="cs-empty">
              <div className="cs-spinner" />
              <p className="cs-empty-title">Loading cart...</p>
            </div>
          ) : cartUnitCount === 0 ? (
            <div className="cs-empty">
              <div className="cs-empty-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                >
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
              </div>
              <h3 className="cs-empty-title">Your cart is empty</h3>
              <p className="cs-empty-sub">
                Explore our luxury collections to begin.
              </p>
              <button className="cs-empty-cta" onClick={onClose}>
                <Link href="/watches" prefetch={false}>
                  Discover Collections
                </Link>
              </button>
            </div>
          ) : (
            <ul className="cs-item-list">
              {items.map((item) => {
                const ppu = item.pieces_per_unit ?? 1;
                const pricePerPiecePKR =
                  item.variant_price ?? item.product?.price ?? 0;
                const itemTotalPKR = pricePerPiecePKR * ppu * item.quantity;
                const rowPhysicalPieces = ppu * item.quantity;

                const productName =
                  item.product?.name ?? item.variant_name ?? "Product";
                const productBrand = item.product?.brand ?? null;
                const productSubcategory = item.product?.subcategory ?? null;

                const tierLabel = ppu > 1 ? ` (${ppu}-Piece)` : "";
                const variantSuffix =
                  item.variant_name && item.variant_name !== "Standard"
                    ? ` — ${item.variant_name}`
                    : "";
                const displayName = `${productName}${tierLabel}${variantSuffix}`;

                const displayImage =
                  item.variant_image ?? item.product?.images?.[0] ?? null;

                const rawStock = item.variantStock ?? 999999;
                const stockStatus = item.variantStockStatus ?? "in_stock";
                const isOutOfStock =
                  stockStatus === "out_of_stock" || rawStock === 0;
                const isLowStock = stockStatus === "low_stock";
                const isBeingRemoved = removingItems.has(item.id);

                const stockLabel = isOutOfStock
                  ? "Out of Stock"
                  : isLowStock
                    ? `Low Stock (${rawStock} left)`
                    : "In Stock";

                const canDecrement = item.quantity > 1 && !isOutOfStock;
                const canIncrement =
                  !isOutOfStock &&
                  (rawStock >= 999999 || item.quantity * ppu < rawStock);

                const handleQuantityUpdate = async (newQty: number) => {
                  if (newQty <= 0) {
                    await removeFromCart(item.id);
                  } else {
                    await updateQuantity(item.id, newQty);
                  }
                };

                const handleRemoveClick = async () => {
                  setRemovingItems((prev) => new Set(prev).add(item.id));
                  await removeFromCart(item.id);
                  setRemovingItems((prev) => {
                    const s = new Set(prev);
                    s.delete(item.id);
                    return s;
                  });
                };

                return (
                  <li
                    key={item.id}
                    className={`cs-item${isBeingRemoved ? " cs-item--removing" : ""}`}
                  >
                    <div className="cs-item-img-wrap" aria-hidden="true">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={productName}
                          className="cs-item-img"
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                          }}
                          suppressHydrationWarning
                        />
                      ) : (
                        <div
                          className="cs-item-img-placeholder"
                          aria-hidden="true"
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
                    </div>

                    <div className="cs-item-info">
                      {productBrand && (
                        <p className="cs-item-brand">{productBrand}</p>
                      )}

                      <p className="cs-item-name">{displayName}</p>

                      {productSubcategory && (
                        <p className="cs-item-variant">{productSubcategory}</p>
                      )}

                      <p className="cs-item-breakdown">
                        {formatPrice(pricePerPiecePKR)} × {ppu} pcs ×{" "}
                        {item.quantity} unit
                        {item.quantity !== 1 ? "s" : ""} = {rowPhysicalPieces}{" "}
                        pcs total
                      </p>

                      <div className="cs-item-stock">
                        <span
                          className={`cs-stock-badge ${
                            isOutOfStock ? "out" : isLowStock ? "low" : "in"
                          }`}
                        >
                          {stockLabel}
                        </span>
                      </div>

                      <div className="cs-item-bottom">
                        <div className="cs-qty">
                          <button
                            className="cs-qty-btn"
                            onClick={() =>
                              handleQuantityUpdate(item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            disabled={
                              !canDecrement || isOutOfStock || isBeingRemoved
                            }
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M5 12h14" strokeLinecap="round" />
                            </svg>
                          </button>

                          <span className="cs-qty-num">
                            {item.quantity}
                            {ppu > 1 && (
                              <span className="cs-qty-ppu">×{ppu}</span>
                            )}
                          </span>

                          <button
                            className="cs-qty-btn"
                            onClick={() =>
                              handleQuantityUpdate(item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            disabled={
                              !canIncrement || isOutOfStock || isBeingRemoved
                            }
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                d="M12 5v14M5 12h14"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>

                        <p className="cs-item-price">
                          {formatPrice(itemTotalPKR)}
                        </p>
                      </div>
                    </div>

                    <button
                      className="cs-item-remove"
                      onClick={handleRemoveClick}
                      aria-label={`Remove ${productName}`}
                      disabled={isBeingRemoved}
                    >
                      {isBeingRemoved ? (
                        <div className="cs-remove-spinner" />
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path
                            d="M6 18L18 6M6 6l12 12"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer with Totals */}
        {cartUnitCount > 0 && (
          <div className="cs-footer">
            {/* Summary totals */}
            <div className="cs-summary">
              <div className="cs-summary-row">
                <span>
                  Subtotal ({totalPieces}{" "}
                  {totalPieces === 1 ? "piece" : "pieces"})
                </span>
                <span>{formatPrice(subtotalPKR)}</span>
              </div>

              {/* Discount row - only when coupon applied */}
              {appliedCode && discountAmountPKR > 0 && (
                <div className="cs-summary-row cs-summary-row--discount">
                  <span>
                    Discount ({discountPercent}% — {appliedCode})
                  </span>
                  <span className="cs-discount-value">
                    − {formatPrice(discountAmountPKR)}
                  </span>
                </div>
              )}

              <div className="cs-summary-row">
                <span>Shipping</span>
                <span className="free-shipping-text">Free</span>
              </div>

              <div className="cs-summary-divider" />

              <div className="cs-summary-row cs-summary-total">
                <span>Total</span>
                <span>{formatPrice(totalPKR)}</span>
              </div>
            </div>

            <button className="cs-checkout-btn" onClick={handleCheckoutClick}>
              <span>Proceed to Checkout</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button className="cs-view-cart-btn" onClick={handleViewCartClick}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="13"
                height="13"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              View Full Cart
            </button>
          </div>
        )}

        <style jsx>{`
          .cs-item-breakdown {
            font-size: 0.65rem;
            color: #888;
            margin: 0.1rem 0 0.2rem;
            line-height: 1.4;
          }
          .cs-qty-ppu {
            font-size: 0.6rem;
            opacity: 0.65;
            margin-left: 2px;
          }
          .cs-item--removing {
            opacity: 0.5;
            pointer-events: none;
            transition: opacity 0.2s ease;
          }
          .cs-remove-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(218, 165, 32, 0.2);
            border-top-color: #daa520;
            border-radius: 50%;
            animation: cs-spin 0.6s linear infinite;
          }
          @keyframes cs-spin {
            to {
              transform: rotate(360deg);
            }
          }
          .cs-item-remove:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .free-shipping-text {
            color: #2e7d32;
            font-weight: 500;
          }
          .cs-summary-row--discount {
            color: #2e7d32;
          }
          .cs-discount-value {
            color: #2e7d32;
            font-weight: 600;
          }
        `}</style>
      </div>
    </>
  );
}
