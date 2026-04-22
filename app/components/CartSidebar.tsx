"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "./cartsidebar.css";

interface CartItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  qty: number;
  image: string;
  variant?: string;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Demo cart items — replace with real cart state/context
const initialItems: CartItem[] = [
  {
    id: 1,
    name: "Prestige Chronograph",
    brand: "Aurexia",
    price: 429,
    qty: 1,
    image: "/watches/watch1.jpg",
    variant: "Rose Gold · 42mm",
  },
  {
    id: 2,
    name: "Elite Magsafe Wallet",
    brand: "Aurexia",
    price: 89,
    qty: 2,
    image: "/accessories/wallet1.jpg",
    variant: "Midnight Black",
  },
];

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const sidebarRef = useRef<HTMLDivElement>(null);

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
  const shipping = subtotal > 300 ? 0 : 25;
  const total = subtotal + shipping;

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
                  <em>{items.length}</em>{" "}
                  {items.length === 1 ? "Item" : "Items"}
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
        {items.length > 0 && subtotal < 300 && (
          <div className="cs-shipping-bar">
            <p className="cs-shipping-text">
              Add <strong>${300 - subtotal}</strong> more for free shipping
            </p>
            <div className="cs-shipping-track">
              <div
                className="cs-shipping-fill"
                style={{ width: `${(subtotal / 300) * 100}%` }}
              />
            </div>
          </div>
        )}

        {subtotal >= 300 && items.length > 0 && (
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
              Free shipping unlocked!
            </p>
          </div>
        )}

        {/* Items */}
        <div className="cs-items">
          {items.length === 0 ? (
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
              {items.map((item, i) => (
                <li
                  key={item.id}
                  className="cs-item"
                  style={{
                    animationDelay: isOpen ? `${0.15 + i * 0.08}s` : "0s",
                  }}
                >
                  {/* Image */}
                  <div className="cs-item-img-wrap">
                    <div className="cs-item-img-placeholder" aria-hidden="true">
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
                  </div>

                  {/* Info */}
                  <div className="cs-item-info">
                    <p className="cs-item-brand">{item.brand}</p>
                    <p className="cs-item-name">{item.name}</p>
                    {item.variant && (
                      <p className="cs-item-variant">{item.variant}</p>
                    )}

                    <div className="cs-item-bottom">
                      {/* Qty */}
                      <div className="cs-qty">
                        <button
                          className="cs-qty-btn"
                          onClick={() => updateQty(item.id, -1)}
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
                        <span className="cs-qty-num">{item.qty}</span>
                        <button
                          className="cs-qty-btn"
                          onClick={() => updateQty(item.id, 1)}
                          aria-label="Increase quantity"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>

                      <p className="cs-item-price">
                        ${(item.price * item.qty).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    className="cs-item-remove"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name}`}
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
              ))}
            </ul>
          )}
        </div>

        {/* Summary & Checkout */}
        {items.length > 0 && (
          <div className="cs-footer">
            <div className="cs-summary">
              <div className="cs-summary-row">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="cs-summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : `$${shipping}`}</span>
              </div>
              <div className="cs-summary-divider" />
              <div className="cs-summary-row cs-summary-total">
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
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

            <button className="cs-continue-btn" onClick={onClose}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
