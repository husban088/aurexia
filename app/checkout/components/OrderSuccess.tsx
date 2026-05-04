"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./OrderSuccess.css";

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  variant_name?: string;
  variant_price?: number;
  variant_image?: string;
  quantity: number;
  pieces_per_unit?: number;
  product?: {
    id?: string;
    name?: string;
    description?: string;
    category?: string;
    subcategory?: string;
    condition?: string;
    is_featured?: boolean;
    is_active?: boolean;
    price?: number;
    original_price?: number;
    images?: string[];
    stock?: number;
  } | null;
}

interface OrderSuccessProps {
  // Customer info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  zip: string;
  country?: string;

  // Order info
  orderNumber: string;
  paymentMethod: "card" | "paypal";

  // Cart info
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  cartCount: number;

  // Notification status
  notifStatus: { email: boolean | null; whatsapp: boolean | null };
  fullPhone: string;
  shippingAddress: string;

  // Formatting
  formatPrice: (price: number) => string;
}

export default function OrderSuccess({
  firstName,
  lastName,
  email,
  phone,
  address,
  apartment,
  city,
  zip,
  country,
  orderNumber,
  paymentMethod,
  items,
  subtotal,
  shipping,
  total,
  cartCount,
  notifStatus,
  fullPhone,
  shippingAddress,
  formatPrice,
}: OrderSuccessProps) {
  const [visible, setVisible] = useState(false);
  const [checkAnim, setCheckAnim] = useState(false);
  const confettiRef = useRef<HTMLCanvasElement>(null);

  const orderDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Trigger entrance animations
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 80);
    const t2 = setTimeout(() => setCheckAnim(true), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Gold confetti burst
  useEffect(() => {
    const canvas = confettiRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = [
      "#daa520",
      "#f5c842",
      "#fff8e1",
      "#b8860b",
      "#ffe082",
      "#c8a415",
      "#ffd54f",
    ];

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rot: number;
      rotV: number;
      shape: "rect" | "circle";
      opacity: number;
    }[] = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.35,
        vx: (Math.random() - 0.5) * 14,
        vy: -(Math.random() * 12 + 4),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.2,
        shape: Math.random() > 0.5 ? "rect" : "circle",
        opacity: 1,
      });
    }

    let frame: number;
    let tick = 0;

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      let alive = false;
      for (const p of particles) {
        if (p.opacity <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28;
        p.vx *= 0.99;
        p.rot += p.rotV;
        if (tick > 60) p.opacity -= 0.012;
        ctx!.save();
        ctx!.globalAlpha = Math.max(0, p.opacity);
        ctx!.fillStyle = p.color;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rot);
        if (p.shape === "rect") {
          ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.restore();
      }
      tick++;
      if (alive) frame = requestAnimationFrame(draw);
    }

    const startDelay = setTimeout(() => {
      frame = requestAnimationFrame(draw);
    }, 350);

    return () => {
      clearTimeout(startDelay);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={`os-root ${visible ? "os-root--visible" : ""}`}>
      {/* Confetti canvas */}
      <canvas
        ref={confettiRef}
        className="os-confetti-canvas"
        aria-hidden="true"
      />

      {/* Ambient background effects */}
      <div className="os-ambient" aria-hidden="true" />
      <div className="os-grain" aria-hidden="true" />
      <div className="os-lines" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <span key={i} />
        ))}
      </div>

      {/* Gold corner ornaments */}
      <div className="os-corner os-corner--tl" aria-hidden="true" />
      <div className="os-corner os-corner--tr" aria-hidden="true" />
      <div className="os-corner os-corner--bl" aria-hidden="true" />
      <div className="os-corner os-corner--br" aria-hidden="true" />

      <div className="os-wrap">
        {/* ══════════════════════════════════ */}
        {/* LEFT COLUMN — Thank You + Details */}
        {/* ══════════════════════════════════ */}
        <div className="os-left">
          {/* Check mark burst */}
          <div className={`os-check-ring ${checkAnim ? "os-check-ring--burst" : ""}`}>
            <div className="os-check-inner">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="os-check-icon"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="os-ring os-ring--1" />
            <div className="os-ring os-ring--2" />
            <div className="os-ring os-ring--3" />
          </div>

          {/* Heading */}
          <div className="os-eyebrow">
            <span className="os-ey-line" />
            Order Confirmed
            <span className="os-ey-line" />
          </div>
          <h1 className="os-headline">
            Thank You,<br />
            <em>{firstName} {lastName}</em>
          </h1>
          <p className="os-sub">
            Your order has been placed successfully and is being prepared with utmost care.
          </p>

          {/* Order Number badge */}
          <div className="os-order-badge">
            <span className="os-order-label">Your Order Number</span>
            <div className="os-order-num-wrap">
              <span className="os-order-num">{orderNumber}</span>
              <button
                className="os-copy-btn"
                title="Copy order number"
                onClick={() => navigator.clipboard?.writeText(orderNumber)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Notification Status ── */}
          <div className="os-notif-row">
            <div className={`os-notif-pill ${notifStatus.email ? "os-notif-pill--ok" : "os-notif-pill--warn"}`}>
              <span className="os-notif-dot" />
              <div>
                <div className="os-notif-label">Email Confirmation</div>
                <div className="os-notif-val">{email}</div>
              </div>
              <span className="os-notif-status">{notifStatus.email ? "Sent ✓" : "Pending"}</span>
            </div>
            <div className={`os-notif-pill ${notifStatus.whatsapp ? "os-notif-pill--ok" : "os-notif-pill--warn"}`}>
              <span className="os-notif-dot" />
              <div>
                <div className="os-notif-label">WhatsApp Updates</div>
                <div className="os-notif-val">{fullPhone}</div>
              </div>
              <span className="os-notif-status">{notifStatus.whatsapp ? "Sent ✓" : "Pending"}</span>
            </div>
          </div>

          {/* ── Customer Details Section ── */}
          <div className="os-details-card">
            <div className="os-details-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Customer Information
            </div>
            <div className="os-details-grid">
              <div className="os-detail-item">
                <span className="os-detail-label">Full Name</span>
                <span className="os-detail-val">{firstName} {lastName}</span>
              </div>
              <div className="os-detail-item">
                <span className="os-detail-label">Email Address</span>
                <span className="os-detail-val">{email}</span>
              </div>
              <div className="os-detail-item">
                <span className="os-detail-label">Phone Number</span>
                <span className="os-detail-val">{fullPhone}</span>
              </div>
              <div className="os-detail-item">
                <span className="os-detail-label">Order Date</span>
                <span className="os-detail-val">{orderDate}</span>
              </div>
            </div>

            <div className="os-details-divider" />

            <div className="os-details-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Shipping Address
            </div>
            <div className="os-detail-addr">
              <div className="os-detail-addr-line">{address}{apartment ? `, ${apartment}` : ""}</div>
              <div className="os-detail-addr-line">{city}{zip ? ` — ${zip}` : ""}</div>
              {country && <div className="os-detail-addr-line os-detail-addr-country">{country}</div>}
            </div>

            <div className="os-details-divider" />

            <div className="os-details-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 8h20" />
              </svg>
              Payment Method
            </div>
            <div className="os-payment-badge-row">
              <div className="os-payment-badge">
                {paymentMethod === "card" ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M2 8h20M7 16h2M13 16h4" />
                    </svg>
                    Credit / Debit Card via Stripe
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                      <path d="M7 8h10M7 12h6M7 16h4" />
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                    </svg>
                    PayPal
                  </>
                )}
              </div>
              <div className="os-payment-confirmed">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Payment Confirmed
              </div>
            </div>
          </div>

          {/* ── Timeline ── */}
          <div className="os-timeline">
            <div className="os-timeline-item os-timeline-item--done">
              <div className="os-tl-dot" />
              <div className="os-tl-text">
                <strong>Order Placed</strong>
                <span>Confirmed &amp; payment received</span>
              </div>
            </div>
            <div className="os-timeline-item">
              <div className="os-tl-dot os-tl-dot--pulse" />
              <div className="os-tl-text">
                <strong>Processing</strong>
                <span>Your items are being prepared</span>
              </div>
            </div>
            <div className="os-timeline-item os-timeline-item--muted">
              <div className="os-tl-dot os-tl-dot--empty" />
              <div className="os-tl-text">
                <strong>Shipped</strong>
                <span>You'll receive tracking info via WhatsApp</span>
              </div>
            </div>
            <div className="os-timeline-item os-timeline-item--muted">
              <div className="os-tl-dot os-tl-dot--empty" />
              <div className="os-tl-text">
                <strong>Delivered</strong>
                <span>Enjoy your luxury purchase</span>
              </div>
            </div>
          </div>

          {/* CTA button */}
          <Link href="/" className="os-home-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* ═══════════════════════════ */}
        {/* RIGHT COLUMN — Cart Summary */}
        {/* ═══════════════════════════ */}
        <div className="os-right">
          <div className="os-summary-card">
            {/* Header */}
            <div className="os-summary-header">
              <p className="os-summary-title">
                <span className="os-ey-line" />
                Order Summary
                <span className="os-ey-line" />
              </p>
              <span className="os-summary-date">{orderDate}</span>
            </div>

            {/* Items list */}
            <ul className="os-items-list">
              {items.map((item) => {
                const product = item.product ?? {
                  name: item.variant_name || "Product",
                  images: item.variant_image ? [item.variant_image] : [],
                  price: item.variant_price ?? 0,
                };
                const ppu = item.pieces_per_unit ?? 1;
                const pricePerPiece = item.variant_price ?? (product as any).price ?? 0;
                const itemTotal = pricePerPiece * ppu * item.quantity;
                const displayImage = item.variant_image || (product as any).images?.[0] || null;
                const productName = (product as any).name ?? item.variant_name ?? "Product";
                const displayName =
                  item.variant_name && item.variant_name !== "Standard"
                    ? `${productName} (${item.variant_name})`
                    : productName;

                return (
                  <li key={item.id} className="os-item">
                    <div className="os-item-img">
                      {displayImage ? (
                        <img src={displayImage} alt={productName} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      )}
                    </div>
                    <div className="os-item-info">
                      <p className="os-item-name">{displayName}</p>
                      <p className="os-item-qty">
                        {ppu > 1 ? `${ppu}-Piece × ` : ""}
                        {item.quantity} {item.quantity === 1 ? "unit" : "units"}
                      </p>
                    </div>
                    <span className="os-item-price">{formatPrice(itemTotal)}</span>
                  </li>
                );
              })}
            </ul>

            {/* Pricing breakdown */}
            <div className="os-breakdown">
              <div className="os-breakdown-row">
                <span>Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="os-breakdown-row">
                <span>Shipping</span>
                <span className={shipping === 0 ? "os-free-ship" : ""}>
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>
              <div className="os-breakdown-divider" />
              <div className="os-breakdown-row os-breakdown-total">
                <span>Total Paid</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Perks */}
            <div className="os-perks">
              <div className="os-perk">
                <span className="os-perk-icon">🔒</span>
                <span>Secure Checkout</span>
              </div>
              <div className="os-perk">
                <span className="os-perk-icon">↩</span>
                <span>30-Day Returns</span>
              </div>
              <div className="os-perk">
                <span className="os-perk-icon">✦</span>
                <span>Luxury Packaging</span>
              </div>
            </div>

            {/* Payment confirmed footer */}
            <div className="os-summary-footer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              SSL secured • Paid via {paymentMethod === "card" ? "Stripe" : "PayPal"}
            </div>
          </div>

          {/* Floating luxury stamp */}
          <div className="os-stamp">
            <div className="os-stamp-inner">
              <div className="os-stamp-icon">✦</div>
              <div className="os-stamp-text">VERIFIED</div>
              <div className="os-stamp-sub">LUXURY ORDER</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}