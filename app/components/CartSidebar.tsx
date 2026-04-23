"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/cartStore";
import "./cartsidebar.css";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const FREE_SHIPPING_THRESHOLD = 3000; // PKR

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const {
    items,
    loading,
    fetchCart,
    updateQuantity,
    removeFromCart,
    getSubtotal,
  } = useCartStore();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen, fetchCart]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const subtotal = getSubtotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 250;
  const total = subtotal + shipping;
  const shippingProgress = Math.min(
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100,
    100
  );

  const handleSidebarClick = (e: React.MouseEvent) => e.stopPropagation();

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
      >
        {/* Deco */}
        <div className="cs-deco" aria-hidden="true">
          <div className="cs-deco-ring" />
          <div className="cs-deco-ring cs-deco-ring--2" />
        </div>

        {/* Header */}
        <div className="cs-header">
          <div className="cs-header-left">
            <p className="cs-eyebrow">
              <span className="cs-ey-line" />
              Your Cart
              <span className="cs-ey-line" />
            </p>
            <h2 className="cs-title">
              {items.length === 0 ? (
                "Empty"
              ) : (
                <>
                  <em>{items.reduce((a, b) => a + b.quantity, 0)}</em>{" "}
                  {items.reduce((a, b) => a + b.quantity, 0) === 1
                    ? "Item"
                    : "Items"}
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

        {/* Free Shipping Bar */}
        {items.length > 0 && (
          <div
            className={`cs-shipping-bar${
              shipping === 0 ? " cs-shipping-bar--achieved" : ""
            }`}
          >
            {shipping === 0 ? (
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
                Free shipping unlocked!
              </p>
            ) : (
              <>
                <p className="cs-shipping-text">
                  Add{" "}
                  <strong>
                    PKR {(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString()}
                  </strong>{" "}
                  more for free shipping
                </p>
                <div className="cs-shipping-track">
                  <div
                    className="cs-shipping-fill"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Items */}
        <div className="cs-items">
          {loading ? (
            <div className="cs-empty">
              <div className="cs-spinner" />
              <p className="cs-empty-title">Loading cart...</p>
            </div>
          ) : items.length === 0 ? (
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
              <p className="cs-empty-title">Your cart is empty</p>
              <p className="cs-empty-sub">Discover our luxury collections</p>
              <Link href="/watches" className="cs-empty-cta" onClick={onClose}>
                Shop Now
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
            <ul className="cs-item-list">
              {items.map((item, i) => {
                const product = item.product;
                const itemTotal = product.price * item.quantity;

                return (
                  <li
                    key={item.id}
                    className="cs-item"
                    style={{
                      animationDelay: isOpen ? `${0.15 + i * 0.08}s` : "0s",
                    }}
                  >
                    {/* Image */}
                    <div className="cs-item-img-wrap">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={68}
                          height={68}
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                          }}
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

                    {/* Info */}
                    <div className="cs-item-info">
                      {product.brand && (
                        <p className="cs-item-brand">{product.brand}</p>
                      )}
                      <p className="cs-item-name">{product.name}</p>
                      <p className="cs-item-variant">{product.subcategory}</p>

                      <div className="cs-item-bottom">
                        {/* Qty */}
                        <div className="cs-qty">
                          <button
                            className="cs-qty-btn"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
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
                          <span className="cs-qty-num">{item.quantity}</span>
                          <button
                            className="cs-qty-btn"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            disabled={item.quantity >= product.stock}
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
                          PKR {itemTotal.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      className="cs-item-remove"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${product.name}`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Summary & Checkout */}
        {items.length > 0 && !loading && (
          <div className="cs-footer">
            <div className="cs-summary">
              <div className="cs-summary-row">
                <span>Subtotal</span>
                <span>PKR {subtotal.toLocaleString()}</span>
              </div>
              <div className="cs-summary-row">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? "Free" : `PKR ${shipping.toLocaleString()}`}
                </span>
              </div>
              <div className="cs-summary-divider" />
              <div className="cs-summary-row cs-summary-total">
                <span>Total</span>
                <span>PKR {total.toLocaleString()}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="cs-checkout-btn"
              onClick={onClose}
            >
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
            </Link>

            <Link href="/cart" className="cs-view-cart-btn" onClick={onClose}>
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
            </Link>

            <button className="cs-continue-btn" onClick={onClose}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
