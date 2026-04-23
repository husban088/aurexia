"use client";

import { useState } from "react";
import Link from "next/link";
import "./cart.css";

interface CartItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  qty: number;
  variant?: string;
  category: "watch" | "accessory";
}

const initialItems: CartItem[] = [
  {
    id: 1,
    name: "Prestige Chronograph",
    brand: "Aurexia",
    price: 429,
    qty: 1,
    variant: "Rose Gold · 42mm",
    category: "watch",
  },
  {
    id: 2,
    name: "Elite Magsafe Wallet",
    brand: "Aurexia",
    price: 89,
    qty: 2,
    variant: "Midnight Black",
    category: "accessory",
  },
  {
    id: 3,
    name: "Noir Strap Collection",
    brand: "Aurexia",
    price: 65,
    qty: 1,
    variant: "Alligator · 20mm",
    category: "watch",
  },
];

const FREE_SHIPPING_THRESHOLD = 300;

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const updateQty = (id: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, qty: Math.max(0, item.qty + delta) }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : 25;
  const total = subtotal - discount + shipping;
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const handlePromo = () => {
    if (promoCode.trim().toLowerCase() === "aurexia10") {
      setPromoApplied(true);
    }
  };

  return (
    <div className="cart-root">
      {/* Bg */}
      <div className="cart-grain" aria-hidden="true" />
      <div className="cart-lines" aria-hidden="true">
        {[...Array(5)].map((_, i) => <span key={i} />)}
      </div>
      <div className="cart-ambient" aria-hidden="true" />

      {/* Corner marks */}
      <div className="cart-corner cart-corner--tl" aria-hidden="true" />
      <div className="cart-corner cart-corner--tr" aria-hidden="true" />

      <div className="cart-wrap">
        {/* ── Header ── */}
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
                <em>{items.length}</em>{" "}
                {items.length === 1 ? "Item" : "Items"} in Cart
              </>
            )}
          </h1>
        </div>

        {/* Shipping progress */}
        {items.length > 0 && (
          <div className={`cart-ship-bar${shipping === 0 ? " cart-ship-bar--done" : ""}`}>
            {shipping === 0 ? (
              <p className="cart-ship-text cart-ship-text--done">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Free shipping unlocked!
              </p>
            ) : (
              <>
                <p className="cart-ship-text">
                  Add <strong>${FREE_SHIPPING_THRESHOLD - subtotal + discount}</strong> more for free shipping
                </p>
                <div className="cart-ship-track">
                  <div className="cart-ship-fill" style={{ width: `${shippingProgress}%` }} />
                </div>
              </>
            )}
          </div>
        )}

        {items.length === 0 ? (
          /* ── Empty State ── */
          <div className="cart-empty">
            <div className="cart-empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.7">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <h2 className="cart-empty-title">Your cart is empty</h2>
            <p className="cart-empty-sub">Explore our luxury collections to begin.</p>
            <Link href="/watches" className="cart-empty-cta">
              <span>Discover Collections</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* ── Items Column ── */}
            <div className="cart-items-col">
              <ul className="cart-list">
                {items.map((item, i) => (
                  <li
                    key={item.id}
                    className="cart-item"
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    {/* Image placeholder */}
                    <div className="cart-item-img">
                      <div className="cart-item-img-inner" aria-hidden="true">
                        {item.category === "watch" ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                            <circle cx="12" cy="12" r="7" />
                            <path d="M12 9v3l2 2" />
                            <path d="M9.5 3.5l1 3M14.5 3.5l-1 3M9.5 20.5l1-3M14.5 20.5l-1-3" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                            <rect x="7" y="2" width="10" height="20" rx="2" />
                            <path d="M12 18h.01" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="cart-item-details">
                      <p className="cart-item-brand">{item.brand}</p>
                      <h3 className="cart-item-name">{item.name}</h3>
                      {item.variant && (
                        <p className="cart-item-variant">{item.variant}</p>
                      )}

                      <div className="cart-item-row">
                        {/* Qty */}
                        <div className="cart-qty">
                          <button
                            className="cart-qty-btn"
                            onClick={() => updateQty(item.id, -1)}
                            aria-label="Decrease quantity"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14" strokeLinecap="round" />
                            </svg>
                          </button>
                          <span className="cart-qty-num">{item.qty}</span>
                          <button
                            className="cart-qty-btn"
                            onClick={() => updateQty(item.id, 1)}
                            aria-label="Increase quantity"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>

                        <p className="cart-item-price">
                          ${(item.price * item.qty).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      className="cart-item-remove"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Continue */}
              <Link href="/watches" className="cart-continue-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Continue Shopping
              </Link>
            </div>

            {/* ── Summary Column ── */}
            <div className="cart-summary-col">
              <div className="cart-summary-card">
                <p className="cart-summary-heading">
                  <span className="cart-ey-line" />
                  Order Summary
                  <span className="cart-ey-line" />
                </p>

                {/* Promo */}
                <div className="cart-promo">
                  <div className={`cart-promo-wrap${promoApplied ? " cart-promo-wrap--done" : ""}`}>
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
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : "Apply"}
                    </button>
                  </div>
                  {promoApplied && (
                    <p className="cart-promo-success">Code AUREXIA10 applied — 10% off</p>
                  )}
                  {!promoApplied && (
                    <p className="cart-promo-hint">Try: AUREXIA10</p>
                  )}
                </div>

                {/* Breakdown */}
                <div className="cart-breakdown">
                  <div className="cart-breakdown-row">
                    <span>Subtotal ({items.reduce((a, b) => a + b.qty, 0)} items)</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  {promoApplied && (
                    <div className="cart-breakdown-row cart-breakdown-row--discount">
                      <span>Discount (10%)</span>
                      <span>−${discount}</span>
                    </div>
                  )}
                  <div className="cart-breakdown-row">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : `$${shipping}`}</span>
                  </div>
                  <div className="cart-breakdown-divider" />
                  <div className="cart-breakdown-row cart-breakdown-row--total">
                    <span>Total</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <Link href="/checkout" className="cart-checkout-btn">
                  <span>Proceed to Checkout</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>

                {/* Trust badges */}
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