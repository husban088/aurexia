// app/cart/page.tsx - WITH COUPON CODE SYSTEM
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { useCouponStore } from "@/lib/couponStore"; // ✅ Coupon store import
import "./cart.css";
import { useCurrency } from "../context/CurrencyContext";

export default function Cart() {
  const {
    items,
    loading,
    initialized,
    fetchCart,
    updateQuantity,
    removeFromCart,
    getSubtotal,
    getCartCount,
  } = useCartStore();

  const { formatPrice, currency, loading: currencyLoading } = useCurrency();

  // ✅ Coupon store
  const {
    appliedCode,
    discountPercent,
    discountLabel,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    getFinalTotal,
  } = useCouponStore();

  // ✅ Coupon UI state
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState<{
    text: string;
    success: boolean;
  } | null>(null);

  // Track hydration to prevent flash
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Wait for component to mount on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle hydration and fetch cart only once
  useEffect(() => {
    if (!isMounted) return;

    setIsHydrated(true);

    if (!initialized || items.length === 0) {
      console.log("🛒 Fetching cart on mount...");
      fetchCart();
    }
  }, [isMounted, initialized, items.length, fetchCart]);

  const subtotalPKR = getSubtotal();
  const cartCount = getCartCount();

  // ✅ Coupon calculations
  const discountAmountPKR = getDiscountAmount(subtotalPKR);
  const shippingPKR = 0; // FREE SHIPPING ALWAYS
  const totalPKR = getFinalTotal(subtotalPKR) + shippingPKR;

  // ✅ Handle coupon apply
  const handleApplyCoupon = () => {
    if (!couponInput.trim()) {
      setCouponMessage({ text: "Please enter a coupon code.", success: false });
      return;
    }
    const result = applyCoupon(couponInput);
    setCouponMessage({ text: result.message, success: result.success });
    if (result.success) {
      setCouponInput(""); // Clear input after successful apply
    }
  };

  // ✅ Handle coupon remove
  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponMessage(null);
    setCouponInput("");
  };

  // ✅ Handle Enter key in coupon input
  const handleCouponKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApplyCoupon();
    }
  };

  // Show loading until mounted and initialized
  if (!isMounted || !isHydrated || (!initialized && loading)) {
    return (
      <div className="cart-root">
        <div className="cart-grain" aria-hidden="true" />
        <div className="cart-wrap">
          <div className="cart-empty">
            <div className="cart-spinner" />
            <p className="cart-empty-title">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty cart state
  if (items.length === 0 && initialized) {
    return (
      <div className="cart-root">
        <div className="cart-grain" aria-hidden="true" />
        <div className="cart-lines" aria-hidden="true">
          {[...Array(5)].map((_, i) => (
            <span key={i} />
          ))}
        </div>
        <div className="cart-ambient" aria-hidden="true" />
        <div className="cart-corner cart-corner--tl" aria-hidden="true" />
        <div className="cart-corner cart-corner--tr" aria-hidden="true" />

        <div className="cart-wrap">
          <div className="cart-page-header">
            <p className="cart-eyebrow">
              <span className="cart-ey-line" />
              Your Selection
              <span className="cart-ey-line" />
            </p>
            <h1 className="cart-page-title">Your Cart</h1>
          </div>
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <h2 className="cart-empty-title">Your cart is empty</h2>
            <p className="cart-empty-sub">
              Explore our luxury collections to begin.
            </p>
            <Link href="/watches" className="cart-empty-cta">
              <span>Discover Collections</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="14"
                height="14"
              >
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-root">
      <div className="cart-grain" aria-hidden="true" />
      <div className="cart-lines" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className="cart-ambient" aria-hidden="true" />
      <div className="cart-corner cart-corner--tl" aria-hidden="true" />
      <div className="cart-corner cart-corner--tr" aria-hidden="true" />

      <div className="cart-wrap">
        <div className="cart-page-header">
          <p className="cart-eyebrow">
            <span className="cart-ey-line" />
            Your Selection
            <span className="cart-ey-line" />
          </p>
          <h1 className="cart-page-title">
            {items.length === 0 ? (
              "Your Cart"
            ) : (
              <>
                <em>{cartCount}</em> {cartCount === 1 ? "Item" : "Items"} in
                Cart
              </>
            )}
          </h1>
        </div>

        {/* ✅ FREE SHIPPING BANNER */}
        {items.length > 0 && (
          <div className="cart-ship-bar cart-ship-bar--done">
            <p className="cart-ship-text cart-ship-text--done">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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

        <div className="cart-layout">
          <div className="cart-items-col">
            <ul className="cart-list">
              {items.map((item, i) => {
                const product = item.product ?? {
                  id: item.product_id,
                  name: item.variant_name || "Product",
                  description: "",
                  category: "",
                  subcategory: "",
                  condition: "new",
                  is_featured: false,
                  is_active: true,
                  price: item.variant_price ?? 0,
                  original_price: item.variant_original_price ?? undefined,
                  images: item.variant_image ? [item.variant_image] : [],
                  stock: item.variantStock ?? 0,
                };

                const ppu = item.pieces_per_unit ?? 1;
                const itemPricePKR = item.variant_price ?? product.price ?? 0;
                const itemTotalPKR = itemPricePKR * ppu * item.quantity;
                const totalPieces = ppu * item.quantity;

                const displayImage =
                  item.variant_image || product.images?.[0] || null;

                const tierLabel = ppu > 1 ? ` (${ppu}-Piece)` : "";
                const variantSuffix =
                  item.variant_name && item.variant_name !== "Standard"
                    ? ` — ${item.variant_name}`
                    : "";
                const displayName = `${product.name}${tierLabel}${variantSuffix}`;

                const rawStock = item.variantStock ?? 999999;
                const stockStatus = item.variantStockStatus ?? "in_stock";
                const isOutOfStock =
                  stockStatus === "out_of_stock" || rawStock === 0;
                const isLowStock = stockStatus === "low_stock";

                const canDecrement = item.quantity > 1 && !isOutOfStock;
                const canIncrement =
                  !isOutOfStock &&
                  (rawStock >= 999999 || item.quantity * ppu < rawStock);

                const getStockLabel = () => {
                  if (isOutOfStock) return "Out of Stock";
                  if (isLowStock) return `Low Stock (${rawStock} left)`;
                  return "In Stock";
                };

                const handleRemoveClick = async () => {
                  await removeFromCart(item.id);
                };

                return (
                  <li
                    key={item.id}
                    className={`cart-item${i > 0 ? " cart-item--sep" : ""}`}
                  >
                    <div className="cart-item-img-wrap">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={product.name ?? "Product"}
                          className="cart-item-img"
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      ) : (
                        <div className="cart-item-img-placeholder">
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

                    <div className="cart-item-details">
                      {product.brand && (
                        <p className="cart-item-brand">{product.brand}</p>
                      )}
                      <h3 className="cart-item-name">{displayName}</h3>
                      <p className="cart-item-variant">{product.subcategory}</p>

                      {ppu > 1 && (
                        <p
                          style={{
                            fontSize: "0.68rem",
                            color: "#888",
                            margin: "0.15rem 0",
                          }}
                        >
                          {formatPrice(itemPricePKR)} × {ppu} pcs ×{" "}
                          {item.quantity} unit{item.quantity !== 1 ? "s" : ""} ={" "}
                          {totalPieces} pcs total
                        </p>
                      )}
                      {ppu === 1 && item.quantity > 1 && (
                        <p
                          style={{
                            fontSize: "0.68rem",
                            color: "#888",
                            margin: "0.15rem 0",
                          }}
                        >
                          {formatPrice(itemPricePKR)} / pc
                        </p>
                      )}

                      <p
                        className={`cart-item-stock ${
                          isOutOfStock ? "out" : isLowStock ? "low" : "in"
                        }`}
                      >
                        {getStockLabel()}
                      </p>

                      <div className="cart-item-row">
                        <div className="cart-qty">
                          <button
                            className="cart-qty-btn"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            disabled={!canDecrement}
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
                          <span className="cart-qty-num">
                            {item.quantity}
                            {ppu > 1 && (
                              <span
                                style={{
                                  fontSize: "0.58rem",
                                  opacity: 0.65,
                                  marginLeft: 2,
                                }}
                              >
                                ×{ppu}
                              </span>
                            )}
                          </span>
                          <button
                            className="cart-qty-btn"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            disabled={!canIncrement}
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
                        <p className="cart-item-price">
                          {formatPrice(itemTotalPKR)}
                        </p>
                      </div>
                    </div>

                    <button
                      className="cart-item-remove"
                      onClick={handleRemoveClick}
                      aria-label={`Remove ${product.name}`}
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
                  </li>
                );
              })}
            </ul>

            <Link href="/watches" className="cart-continue-link">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="14"
                height="14"
              >
                <path
                  d="M19 12H5M12 19l-7-7 7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Continue Shopping
            </Link>
          </div>

          {/* ✅ Order Summary with Coupon Code */}
          <div className="cart-summary-col">
            <div className="cart-summary-card">
              <p className="cart-summary-heading">
                <span className="cart-ey-line" />
                Order Summary
                <span className="cart-ey-line" />
              </p>

              {/* ✅ COUPON CODE SECTION */}
              <div className="cart-coupon-section">
                <p className="cart-coupon-label">Have a coupon code?</p>

                {!appliedCode ? (
                  // Show input when no coupon is applied
                  <div className="cart-coupon-row">
                    <input
                      type="text"
                      className="cart-coupon-input"
                      placeholder="Enter code"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponMessage(null); // Clear message on type
                      }}
                      onKeyDown={handleCouponKeyDown}
                      maxLength={20}
                    />
                    <button
                      className="cart-coupon-btn"
                      onClick={handleApplyCoupon}
                      disabled={!couponInput.trim()}
                    >
                      Apply
                    </button>
                  </div>
                ) : (
                  // Show applied coupon badge
                  <div className="cart-coupon-applied">
                    <div className="cart-coupon-badge">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        width="14"
                        height="14"
                      >
                        <polyline
                          points="20 6 9 17 4 12"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>
                        <strong>{appliedCode}</strong> — {discountLabel}
                      </span>
                    </div>
                    <button
                      className="cart-coupon-remove"
                      onClick={handleRemoveCoupon}
                      aria-label="Remove coupon"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* ✅ Success / Error Message */}
                {couponMessage && (
                  <p
                    className={
                      couponMessage.success
                        ? "cart-coupon-success"
                        : "cart-coupon-error"
                    }
                  >
                    {couponMessage.text}
                  </p>
                )}
              </div>

              {/* ✅ Price Breakdown */}
              <div className="cart-breakdown">
                <div className="cart-breakdown-row">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>{formatPrice(subtotalPKR)}</span>
                </div>

                {/* ✅ Discount Row - Only when coupon applied */}
                {appliedCode && discountAmountPKR > 0 && (
                  <div className="cart-breakdown-row cart-breakdown-row--discount">
                    <span>
                      Discount ({discountPercent}% off — {appliedCode})
                    </span>
                    <span className="cart-discount-value">
                      − {formatPrice(discountAmountPKR)}
                    </span>
                  </div>
                )}

                {/* ✅ Shipping Row - Always Free */}
                <div className="cart-breakdown-row">
                  <span>Shipping</span>
                  <span className="free-shipping-text">Free</span>
                </div>

                <div className="cart-breakdown-divider" />

                {/* ✅ Total Row */}
                <div className="cart-breakdown-row cart-breakdown-row--total">
                  <span>Total</span>
                  <span>{formatPrice(totalPKR)}</span>
                </div>
              </div>

              <Link href="/checkout" className="cart-checkout-btn">
                <span>Proceed to Checkout</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  width="14"
                  height="14"
                >
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              <div className="cart-trust">
                {[
                  { icon: "🔒", label: "Secure Checkout" },
                  { icon: "↩", label: "30-Day Returns" },
                  { icon: "✦", label: "Luxury Packaging" },
                  { icon: "🚚", label: "Free Shipping" },
                ].map((b) => (
                  <div key={b.label} className="cart-trust-badge">
                    <span className="cart-trust-icon">{b.icon}</span>
                    <span className="cart-trust-label">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Coupon CSS Styles */}
      <style jsx>{`
        /* === COUPON SECTION === */
        .cart-coupon-section {
          margin-bottom: 1.25rem;
          padding: 1rem;
          border: 1px solid rgba(218, 165, 32, 0.2);
          border-radius: 8px;
          background: rgba(218, 165, 32, 0.03);
        }

        .cart-coupon-label {
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #888;
          margin: 0 0 0.6rem;
        }

        .cart-coupon-row {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .cart-coupon-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(218, 165, 32, 0.3);
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          color: inherit;
          font-size: 0.82rem;
          font-family: monospace;
          letter-spacing: 0.05em;
          outline: none;
          transition: border-color 0.2s;
        }

        .cart-coupon-input:focus {
          border-color: rgba(218, 165, 32, 0.7);
        }

        .cart-coupon-input::placeholder {
          color: #555;
          font-size: 0.75rem;
          letter-spacing: 0.02em;
        }

        .cart-coupon-btn {
          padding: 0.5rem 1rem;
          background: rgba(218, 165, 32, 0.15);
          border: 1px solid rgba(218, 165, 32, 0.4);
          border-radius: 6px;
          color: #daa520;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .cart-coupon-btn:hover:not(:disabled) {
          background: rgba(218, 165, 32, 0.25);
          border-color: rgba(218, 165, 32, 0.7);
        }

        .cart-coupon-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Applied coupon badge */
        .cart-coupon-applied {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .cart-coupon-badge {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.75rem;
          background: rgba(46, 125, 50, 0.12);
          border: 1px solid rgba(46, 125, 50, 0.3);
          border-radius: 6px;
          color: #2e7d32;
          font-size: 0.8rem;
          flex: 1;
        }

        .cart-coupon-remove {
          background: none;
          border: 1px solid rgba(180, 0, 0, 0.25);
          border-radius: 6px;
          color: #c62828;
          font-size: 0.75rem;
          cursor: pointer;
          padding: 0.35rem 0.6rem;
          transition: all 0.2s;
          line-height: 1;
        }

        .cart-coupon-remove:hover {
          background: rgba(180, 0, 0, 0.08);
        }

        /* ✅ SUCCESS message - GREEN */
        .cart-coupon-success {
          margin: 0.6rem 0 0;
          padding: 0.5rem 0.75rem;
          background: rgba(46, 125, 50, 0.1);
          border: 1px solid rgba(46, 125, 50, 0.25);
          border-radius: 6px;
          color: #2e7d32;
          font-size: 0.78rem;
          line-height: 1.5;
        }

        /* ✅ ERROR message - RED */
        .cart-coupon-error {
          margin: 0.6rem 0 0;
          padding: 0.5rem 0.75rem;
          background: rgba(198, 40, 40, 0.08);
          border: 1px solid rgba(198, 40, 40, 0.2);
          border-radius: 6px;
          color: #c62828;
          font-size: 0.78rem;
          line-height: 1.5;
        }

        /* ✅ Discount row */
        .cart-breakdown-row--discount {
          color: #2e7d32;
        }

        .cart-discount-value {
          color: #2e7d32;
          font-weight: 600;
        }

        .free-shipping-text {
          color: #2e7d32;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
