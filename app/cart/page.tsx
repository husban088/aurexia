// app/cart/page.tsx - COMPLETE FIX
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import "./cart.css";
import { useCurrency } from "../context/CurrencyContext";

const FREE_SHIPPING_THRESHOLD_PKR = 3000;
const SHIPPING_COST_PKR = 250;

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

  // ✅ CRITICAL: Track hydration to prevent flash
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // ✅ Wait for component to mount on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ Handle hydration and fetch cart only once
  useEffect(() => {
    if (!isMounted) return;

    // Mark as hydrated after initial render
    setIsHydrated(true);

    // Only fetch if not initialized or items are empty
    if (!initialized || items.length === 0) {
      console.log("🛒 Fetching cart on mount...");
      fetchCart();
    }
  }, [isMounted, initialized, items.length, fetchCart]);

  const subtotalPKR = getSubtotal();
  const cartCount = getCartCount();
  const discountPKR = 0; // No promo for now
  const afterDiscountPKR = subtotalPKR - discountPKR;
  const shippingPKR =
    afterDiscountPKR >= FREE_SHIPPING_THRESHOLD_PKR ? 0 : SHIPPING_COST_PKR;
  const totalPKR = afterDiscountPKR + shippingPKR;
  const shippingProgress = Math.min(
    (afterDiscountPKR / FREE_SHIPPING_THRESHOLD_PKR) * 100,
    100
  );
  const remainingPKR = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_PKR - afterDiscountPKR
  );

  // ✅ Show loading until mounted and initialized
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

        {/* Shipping progress bar */}
        {items.length > 0 && (
          <div
            className={`cart-ship-bar${
              shippingPKR === 0 ? " cart-ship-bar--done" : ""
            }`}
          >
            {shippingPKR === 0 ? (
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
                Free shipping unlocked!
              </p>
            ) : (
              <>
                <p className="cart-ship-text">
                  Add <strong>{formatPrice(remainingPKR)}</strong> more for free
                  shipping
                </p>
                <div className="cart-ship-track">
                  <div
                    className="cart-ship-fill"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </>
            )}
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

                const stockStatus = item.variantStockStatus ?? "in_stock";
                const variantStock = item.variantStock ?? 999999;
                const isOutOfStock = stockStatus === "out_of_stock";
                const isLowStock = stockStatus === "low_stock";

                const getStockLabel = () => {
                  if (isOutOfStock) return "Out of Stock";
                  if (isLowStock) return `Only ${variantStock} left`;
                  return "In Stock";
                };

                const maxUnits =
                  stockStatus === "in_stock"
                    ? 999999
                    : Math.floor(variantStock / ppu);
                const canIncrement = !isOutOfStock && item.quantity < maxUnits;
                const canDecrement = !isOutOfStock && item.quantity > 1;

                const handleRemoveClick = async () => {
                  await removeFromCart(item.id);
                };

                return (
                  <li
                    key={item.id}
                    className="cart-item"
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <div className="cart-item-img">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={product.name}
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      ) : (
                        <div className="cart-item-img-inner" aria-hidden="true">
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

          {/* Order Summary */}
          <div className="cart-summary-col">
            <div className="cart-summary-card">
              <p className="cart-summary-heading">
                <span className="cart-ey-line" />
                Order Summary
                <span className="cart-ey-line" />
              </p>

              <div className="cart-breakdown">
                <div className="cart-breakdown-row">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>{formatPrice(subtotalPKR)}</span>
                </div>

                <div className="cart-breakdown-row">
                  <span>Shipping</span>
                  <span>
                    {shippingPKR === 0 ? "Free" : formatPrice(shippingPKR)}
                  </span>
                </div>

                <div className="cart-breakdown-divider" />

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
    </div>
  );
}
