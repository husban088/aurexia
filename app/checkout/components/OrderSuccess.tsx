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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  zip: string;
  country?: string;
  orderNumber: string;
  paymentMethod: "card" | "paypal";
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  cartCount: number;
  notifStatus: { email: boolean | null; whatsapp: boolean | null };
  fullPhone: string;
  shippingAddress: string;
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

  // ✅ Notification status display helper
  const renderNotifStatus = (
    sent: boolean | null,
    type: "email" | "whatsapp"
  ) => {
    if (sent === null) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            color: "#888",
            fontSize: "13px",
          }}
        >
          <span
            style={{
              width: "12px",
              height: "12px",
              border: "2px solid #daa520",
              borderTopColor: "transparent",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.8s linear infinite",
            }}
          />
          Sending...
        </span>
      );
    }
    if (sent === true) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            color: "#22c55e",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          ✅ Sent Successfully
        </span>
      );
    }
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          color: "#f59e0b",
          fontSize: "13px",
        }}
      >
        ⚠️ Not delivered
      </span>
    );
  };

  return (
    <div className={`os-root ${visible ? "os-root--visible" : ""}`}>
      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Confetti canvas */}
      <canvas
        ref={confettiRef}
        className="os-confetti-canvas"
        aria-hidden="true"
      />

      <div className="os-ambient" aria-hidden="true" />
      <div className="os-grain" aria-hidden="true" />
      <div className="os-lines" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className="os-corner os-corner--tl" aria-hidden="true" />
      <div className="os-corner os-corner--tr" aria-hidden="true" />
      <div className="os-corner os-corner--bl" aria-hidden="true" />
      <div className="os-corner os-corner--br" aria-hidden="true" />

      <div className="os-wrap">
        {/* LEFT COLUMN */}
        <div className="os-left">
          {/* Check mark */}
          <div
            className={`os-check-ring ${
              checkAnim ? "os-check-ring--burst" : ""
            }`}
          >
            <div className="os-check-inner">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="40"
                height="40"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <h1 className="os-title">Order Confirmed!</h1>
          <p className="os-sub">
            Thank you <strong>{firstName}</strong>! Your order has been placed
            successfully.
          </p>

          {/* ✅ Notification Status */}
          <div
            style={{
              background: "#f9f9f9",
              border: "1px solid #eee",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontWeight: 600,
                fontSize: "14px",
                color: "#333",
              }}
            >
              📬 Notifications Sent To:
            </p>

            {/* Email status */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "13px", color: "#555" }}>
                📧 Email: <strong>{email}</strong>
              </span>
              {renderNotifStatus(notifStatus.email, "email")}
            </div>

            {/* WhatsApp status */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "13px", color: "#555" }}>
                💬 WhatsApp: <strong>{fullPhone}</strong>
              </span>
              {renderNotifStatus(notifStatus.whatsapp, "whatsapp")}
            </div>
          </div>

          {/* Order details */}
          <div className="os-details-card">
            <div className="os-details-title">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="16"
                height="16"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              Order Details
            </div>

            <div className="os-detail-item">
              <span className="os-detail-label">Order Number</span>
              <span
                className="os-detail-val"
                style={{ fontFamily: "monospace", color: "#daa520" }}
              >
                {orderNumber}
              </span>
            </div>
            <div className="os-detail-item">
              <span className="os-detail-label">Customer Name</span>
              <span className="os-detail-val">
                {firstName} {lastName}
              </span>
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

            <div className="os-details-divider" />

            <div className="os-details-title">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="16"
                height="16"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Shipping Address
            </div>
            <div className="os-detail-addr">
              <div className="os-detail-addr-line">
                {address}
                {apartment ? `, ${apartment}` : ""}
              </div>
              <div className="os-detail-addr-line">
                {city}
                {zip ? ` — ${zip}` : ""}
              </div>
              {country && (
                <div className="os-detail-addr-line os-detail-addr-country">
                  {country}
                </div>
              )}
            </div>

            <div className="os-details-divider" />

            <div className="os-details-title">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="16"
                height="16"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 8h20" />
              </svg>
              Payment Method
            </div>
            <div className="os-payment-badge-row">
              <div className="os-payment-badge">
                {paymentMethod === "card" ? (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      width="18"
                      height="18"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M2 8h20M7 16h2M13 16h4" />
                    </svg>
                    Credit / Debit Card via Stripe
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      width="18"
                      height="18"
                    >
                      <path d="M7 8h10M7 12h6M7 16h4" />
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                    </svg>
                    PayPal
                  </>
                )}
              </div>
              <div className="os-payment-confirmed">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="13"
                  height="13"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Payment Confirmed
              </div>
            </div>
          </div>

          {/* Timeline */}
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

          <Link href="/" className="os-home-btn">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="16"
              height="16"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* RIGHT COLUMN — Complete Cart Summary */}
        <div className="os-right">
          <div className="os-summary-card">
            <div className="os-summary-header">
              <p className="os-summary-title">
                <span className="os-ey-line" />
                Order Summary
                <span className="os-ey-line" />
              </p>
              <span className="os-summary-date">{orderDate}</span>
            </div>

            {/* ✅ ALL items shown — no limit, with images + pieces info */}
            <ul className="os-items-list">
              {items.map((item) => {
                const product = item.product ?? {
                  name: item.variant_name || "Product",
                  images: item.variant_image ? [item.variant_image] : [],
                  price: item.variant_price ?? 0,
                };
                const ppu = item.pieces_per_unit ?? 1;
                const pricePerPiece =
                  item.variant_price ?? (product as any).price ?? 0;
                const itemTotal = pricePerPiece * ppu * item.quantity;
                const displayImage =
                  item.variant_image || (product as any).images?.[0] || null;
                const productName =
                  (product as any).name ?? item.variant_name ?? "Product";

                // ✅ Full display name with variant
                const displayName =
                  item.variant_name && item.variant_name !== "Standard"
                    ? `${productName} (${item.variant_name})`
                    : productName;

                const totalPieces = ppu * item.quantity;

                return (
                  <li key={item.id} className="os-item">
                    {/* ✅ Product image */}
                    <div className="os-item-img">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={productName}
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                            borderRadius: "8px",
                          }}
                        />
                      ) : (
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
                      )}
                    </div>

                    {/* ✅ Item info — name, qty, pieces */}
                    <div className="os-item-info">
                      <p className="os-item-name">{displayName}</p>
                      <p className="os-item-qty">
                        {ppu > 1 ? `${ppu} pieces × ` : ""}
                        {item.quantity} {item.quantity === 1 ? "unit" : "units"}
                        {ppu > 1 && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.7rem",
                              opacity: 0.65,
                              marginTop: "2px",
                            }}
                          >
                            ({totalPieces} total pieces)
                          </span>
                        )}
                      </p>
                    </div>

                    {/* ✅ Item total price */}
                    <span className="os-item-price">
                      {formatPrice(itemTotal)}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* ✅ Price breakdown */}
            <div className="os-breakdown">
              <div className="os-breakdown-row">
                <span>
                  Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})
                </span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="os-breakdown-row">
                <span>Shipping</span>
                <span className="os-free-ship">Free</span>
              </div>
              <div className="os-breakdown-divider" />
              <div className="os-breakdown-row os-breakdown-total">
                <span>Total Paid</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* ✅ Perks */}
            <div className="os-perks">
              <div className="os-perk">
                <span className="os-perk-icon">🔒</span>
                <span>Secure Checkout</span>
              </div>
              <div className="os-perk">
                <span className="os-perk-icon">🚚</span>
                <span>Free Shipping</span>
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

            <div className="os-summary-footer">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="15"
                height="15"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              SSL secured • Paid via{" "}
              {paymentMethod === "card" ? "Stripe" : "PayPal"}
            </div>
          </div>

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
