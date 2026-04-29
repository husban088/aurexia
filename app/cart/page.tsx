"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/cartStore";
import "./cart.css";
import { useCurrency } from "../context/CurrencyContext";

const FREE_SHIPPING_THRESHOLD = 3000; // Base PKR threshold

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
  const { formatPrice, convertPrice } = useCurrency();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  // CRITICAL FIX: fetchCart ko dependency array mein mat rakho
  // Zustand persist middleware ke saath function references change hote hain
  // har render pe, jo infinite fetch loop create karta hai.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchCart();
  }, []);

  const subtotal = getSubtotal();
  const cartCount = getCartCount();
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : 250;
  const total = subtotal - discount + shipping;
  const shippingProgress = Math.min(
    ((subtotal - discount) / FREE_SHIPPING_THRESHOLD) * 100,
    100
  );

  const remainingForFreeShipping = convertPrice(
    FREE_SHIPPING_THRESHOLD - (subtotal - discount)
  );
  const remainingForFreeShippingPositive =
    remainingForFreeShipping > 0 ? remainingForFreeShipping : 0;

  const handlePromo = () => {
    if (promoCode.trim().toLowerCase() === "tech4u10") {
      setPromoApplied(true);
    } else {
      alert("Invalid promo code. Try: TECH4U10");
    }
  };

  // Show spinner only when no items at all (not during background refresh)
  if (loading && items.length === 0) {
    return (
      <div className="cart-root">
        <div className="cart-grain" aria-hidden="true" />
        <div className="cart-lines" aria-hidden="true">
          {[...Array(5)].map((_, i) => (
            <span key={i} />
          ))}
        </div>
        <div className="cart-ambient" aria-hidden="true" />
        <div className="cart-wrap">
          <div className="cart-empty">
            <div className="cart-spinner" />
            <p className="cart-empty-title">Loading your cart...</p>
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

        {items.length > 0 && (
          <div
            className={`cart-ship-bar${
              shipping === 0 ? " cart-ship-bar--done" : ""
            }`}
          >
            {shipping === 0 ? (
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
                  Add{" "}
                  <strong>
                    {formatPrice(remainingForFreeShippingPositive)}
                  </strong>{" "}
                  more for free shipping
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

        {items.length === 0 ? (
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
        ) : (
          <div className="cart-layout">
            <div className="cart-items-col">
              <ul className="cart-list">
                {items.map((item, i) => {
                  // NEVER skip items — cartStore always builds a fallback product
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

                  // pieces_per_unit: physical pieces per cart "unit"
                  const ppu = item.pieces_per_unit ?? 1;

                  // price is per-piece; total = price × ppu × quantity
                  const itemPrice = item.variant_price ?? product.price ?? 0;
                  const itemTotal = itemPrice * ppu * item.quantity;

                  // total physical pieces for display
                  const totalPieces = ppu * item.quantity;

                  const displayImage =
                    item.variant_image || product.images?.[0] || null;

                  // name: "Product (2-Piece)" if bulk tier
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

                  // max units = floor(stock / ppu); in_stock = unlimited
                  const maxUnits =
                    stockStatus === "in_stock"
                      ? 999999
                      : Math.floor(variantStock / ppu);

                  const canIncrement =
                    !isOutOfStock && item.quantity < maxUnits;
                  const canDecrement = !isOutOfStock && item.quantity > 1;

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
                          <div
                            className="cart-item-img-inner"
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

                      <div className="cart-item-details">
                        {product.brand && (
                          <p className="cart-item-brand">{product.brand}</p>
                        )}
                        <h3 className="cart-item-name">{displayName}</h3>
                        <p className="cart-item-variant">
                          {product.subcategory}
                        </p>

                        {/* Per-piece breakdown for bulk tiers */}
                        {ppu > 1 && (
                          <p
                            style={{
                              fontSize: "0.68rem",
                              color: "#888",
                              margin: "0.15rem 0",
                            }}
                          >
                            {formatPrice(itemPrice)} × {ppu} pcs ×{" "}
                            {item.quantity} unit{item.quantity !== 1 ? "s" : ""}{" "}
                            = {totalPieces} pcs total
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
                            {formatPrice(itemPrice)} / pc
                          </p>
                        )}

                        {/* Stock Status */}
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
                            {formatPrice(itemTotal)}
                          </p>
                        </div>
                      </div>

                      <button
                        className="cart-item-remove"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${product.name}`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            strokeLinecap="round"
                          />
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

            <div className="cart-summary-col">
              <div className="cart-summary-card">
                <p className="cart-summary-heading">
                  <span className="cart-ey-line" />
                  Order Summary
                  <span className="cart-ey-line" />
                </p>

                <div className="cart-promo">
                  <div
                    className={`cart-promo-wrap${
                      promoApplied ? " cart-promo-wrap--done" : ""
                    }`}
                  >
                    <input
                      type="text"
                      className="cart-promo-input"
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied}
                    />
                    <button
                      className="cart-promo-btn"
                      onClick={handlePromo}
                      disabled={promoApplied}
                    >
                      {promoApplied ? (
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
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                  {promoApplied && (
                    <p className="cart-promo-success">
                      Code TECH4U10 applied — 10% off
                    </p>
                  )}
                  {!promoApplied && (
                    <p className="cart-promo-hint">Try: TECH4U10</p>
                  )}
                </div>

                <div className="cart-breakdown">
                  <div className="cart-breakdown-row">
                    <span>Subtotal ({cartCount} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {promoApplied && (
                    <div className="cart-breakdown-row cart-breakdown-row--discount">
                      <span>Discount (10%)</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="cart-breakdown-row">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="cart-breakdown-divider" />
                  <div className="cart-breakdown-row cart-breakdown-row--total">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
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
        )}
      </div>
    </div>
  );
}
