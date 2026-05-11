"use client";

// app/track-order/page.tsx
// ✅ Order tracking page — Australia, UK, USA, Pakistan
// ✅ Shipping details (courier, ETA, rider) sirf tab show hoti hain jab admin add kare
// ✅ Hardcoded courier info remove — actual DB data use hoti hai

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import "./track-order.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  product_id?: string;
  product_name?: string;
  variant_id?: string;
  variant_name?: string;
  variant_image?: string;
  quantity: number;
  price: number;
  pieces_per_unit?: number;
}

interface TrackedOrder {
  id: string;
  order_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  zip: string;
  country: string;
  subtotal: number;
  shipping_cost: number;
  total_amount: number;
  payment_method?: string;
  status: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  // ✅ Naye shipping fields — admin jab add kare tab aate hain
  courier_name?: string | null;
  courier_country?: string | null;
  estimated_days?: string | null;
  rider_number?: string | null;
  shipped_at?: string | null;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_STEPS = [
  {
    key: "pending",
    label: "Order Placed",
    icon: "📋",
    desc: "We received your order",
  },
  {
    key: "processing",
    label: "Processing",
    icon: "⚙️",
    desc: "Preparing your items",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    icon: "✅",
    desc: "Order confirmed & packed",
  },
  { key: "shipped", label: "Shipped", icon: "🚚", desc: "On its way to you" },
  {
    key: "delivered",
    label: "Delivered",
    icon: "🎉",
    desc: "Successfully delivered",
  },
];

const STEP_ORDER = [
  "pending",
  "processing",
  "confirmed",
  "shipped",
  "delivered",
];

function getStepIndex(status: string): number {
  const idx = STEP_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

// ─── Country Flag Helper ───────────────────────────────────────────────────────
// Sirf flag aur name ke liye — courier info ab DB se aayegi

const COUNTRY_FLAGS: Record<string, { flag: string; name: string }> = {
  AU: { flag: "🇦🇺", name: "Australia" },
  GB: { flag: "🇬🇧", name: "United Kingdom" },
  US: { flag: "🇺🇸", name: "United States" },
  PK: { flag: "🇵🇰", name: "Pakistan" },
};

function detectCountryCode(countryStr: string): string {
  const s = (countryStr || "").toLowerCase();
  if (s.includes("australia") || s === "au") return "AU";
  if (s.includes("united kingdom") || s.includes("uk") || s === "gb")
    return "GB";
  if (s.includes("united states") || s.includes("usa") || s === "us")
    return "US";
  if (s.includes("pakistan") || s === "pk") return "PK";
  return "";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: number) {
  return "PKR " + Number(amount).toLocaleString("en-PK");
}

// ─── Tracking API Route ───────────────────────────────────────────────────────

async function fetchOrderByNumber(
  orderNumber: string,
  email: string,
): Promise<TrackedOrder | null> {
  const res = await fetch(
    `/api/track-order?order_number=${encodeURIComponent(orderNumber.trim().toUpperCase())}&email=${encodeURIComponent(email.trim().toLowerCase())}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.order ?? null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const on = params.get("order");
    const em = params.get("email");
    if (on) setOrderNumber(on);
    if (em) setEmail(em);
    if (on && em) {
      setTimeout(() => handleSearch(on, em), 300);
    }
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (on?: string, em?: string) => {
    const num = (on ?? orderNumber).trim();
    const mail = (em ?? email).trim();

    if (!num) {
      setError("Please enter your order number");
      return;
    }
    if (!mail) {
      setError("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);
    setSearched(false);

    try {
      const found = await fetchOrderByNumber(num, mail);
      setSearched(true);
      if (found) {
        setOrder(found);
      } else {
        setError(
          "No order found with this order number and email. Please check and try again.",
        );
      }
    } catch (err: any) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepIdx = order ? getStepIndex(order.status) : -1;
  const isCancelled = order?.status === "cancelled";

  // Country detect karo order ke country field se
  const countryCode = order ? detectCountryCode(order.country) : "";
  const countryMeta = countryCode ? COUNTRY_FLAGS[countryCode] : null;

  const items: OrderItem[] =
    order && Array.isArray(order.items) ? order.items : [];

  // ✅ Shipping details — sirf tab show hongi jab DB mein ho
  const hasShippingDetails =
    order &&
    (order.courier_name ||
      order.courier_country ||
      order.estimated_days ||
      order.rider_number);

  return (
    <div className="trk-root">
      {/* Background */}
      <div className="trk-bg-grain" />
      <div className="trk-bg-glow" />

      {/* Back to store */}
      <div className="trk-topbar">
        <Link href="/" className="trk-back-link">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              d="M19 12H5M12 5l-7 7 7 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Store
        </Link>
        <div className="trk-brand">TECH4U</div>
      </div>

      <div className="trk-container">
        {/* ── Header ── */}
        <div className="trk-header">
          <div className="trk-header-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="trk-title">Track Your Order</h1>
          <p className="trk-subtitle">
            Enter your order number and email to see real-time status.
            <br />
            We ship to 🇦🇺 Australia &nbsp;·&nbsp; 🇬🇧 United Kingdom
            &nbsp;·&nbsp; 🇺🇸 USA &nbsp;·&nbsp; 🇵🇰 Pakistan
          </p>
        </div>

        {/* ── Search Box ── */}
        <div className="trk-search-card">
          <div className="trk-search-grid">
            <div className="trk-field">
              <label className="trk-label">Order Number</label>
              <div className="trk-input-wrap">
                <svg
                  className="trk-input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  className="trk-input"
                  placeholder="e.g. ORD-20260511-XXXX"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="trk-field">
              <label className="trk-label">Email Address</label>
              <div className="trk-input-wrap">
                <svg
                  className="trk-input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 8l10 6 10-6" />
                </svg>
                <input
                  type="email"
                  className="trk-input"
                  placeholder="Email used when ordering"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  autoComplete="email"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="trk-error">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button
            className={`trk-btn${loading ? " loading" : ""}`}
            onClick={() => handleSearch()}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="trk-btn-spinner" />
                Searching...
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
                Track My Order
              </>
            )}
          </button>
        </div>

        {/* ── Order Result ── */}
        {order && (
          <div className="trk-result" key={order.id}>
            {/* Order Header */}
            <div className="trk-result-header">
              <div className="trk-result-left">
                <span className="trk-result-label">Order</span>
                <h2 className="trk-result-num">#{order.order_number}</h2>
                <span className="trk-result-date">
                  Placed {formatDate(order.created_at)}
                </span>
              </div>
              <div className="trk-result-right">
                <div className={`trk-status-badge ${order.status}`}>
                  {order.status === "cancelled"
                    ? "❌"
                    : order.status === "delivered"
                      ? "🎉"
                      : order.status === "shipped"
                        ? "🚚"
                        : order.status === "confirmed"
                          ? "✅"
                          : order.status === "processing"
                            ? "⚙️"
                            : "📋"}
                  <span>
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                </div>
                {/* Country flag — sirf tab show ho jab detect ho */}
                {countryMeta && (
                  <div className="trk-country-badge">
                    <span>{countryMeta.flag}</span>
                    <span>{countryMeta.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Progress Tracker ── */}
            {!isCancelled ? (
              <div className="trk-progress-section">
                <h3 className="trk-section-title">Shipment Progress</h3>
                <div className="trk-timeline">
                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = idx <= stepIdx;
                    const isCurrent = idx === stepIdx;
                    return (
                      <div
                        key={step.key}
                        className={`trk-timeline-step${isDone ? " done" : ""}${isCurrent ? " current" : ""}`}
                      >
                        <div className="trk-step-connector">
                          <div className="trk-step-dot">
                            {isDone && !isCurrent ? (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <span>{step.icon}</span>
                            )}
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div
                              className={`trk-step-line${idx < stepIdx ? " done" : ""}`}
                            />
                          )}
                        </div>
                        <div className="trk-step-info">
                          <div className="trk-step-label">{step.label}</div>
                          <div className="trk-step-desc">{step.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="trk-cancelled-banner">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <div>
                  <strong>This order has been cancelled.</strong>
                  <span>
                    For questions, contact us at{" "}
                    <a href="mailto:info@tech4ru.com">info@tech4ru.com</a>
                  </span>
                </div>
              </div>
            )}

            {/* ── Info Grid ── */}
            <div className="trk-info-grid">

              {/* ✅ Delivery Details — SIRF TAB SHOW HO JAB ADMIN NE ADD KIYA HO */}
              {hasShippingDetails ? (
                <div className="trk-info-card">
                  <h4 className="trk-info-title">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-5 9l2 2 4-4" />
                      <rect x="9" y="11" width="14" height="10" rx="2" />
                    </svg>
                    Delivery Details
                  </h4>

                  {order.courier_name && (
                    <div className="trk-info-row">
                      <span>Courier</span>
                      <span>{order.courier_name}</span>
                    </div>
                  )}

                  {order.courier_country && (
                    <div className="trk-info-row">
                      <span>Shipping Country</span>
                      <span>{order.courier_country}</span>
                    </div>
                  )}

                  {order.estimated_days && (
                    <div className="trk-info-row">
                      <span>Est. Delivery</span>
                      <span>{order.estimated_days}</span>
                    </div>
                  )}

                  {order.rider_number && (
                    <div className="trk-info-row">
                      <span>Rider Contact</span>
                      <span>
                        <a
                          href={`tel:${order.rider_number}`}
                          style={{ color: "inherit", textDecoration: "underline" }}
                        >
                          {order.rider_number}
                        </a>
                      </span>
                    </div>
                  )}

                  {order.shipped_at && (
                    <div className="trk-info-row">
                      <span>Shipped On</span>
                      <span>{formatDate(order.shipped_at)}</span>
                    </div>
                  )}

                  <div className="trk-info-row">
                    <span>Shipping to</span>
                    <span>
                      {order.city}, {order.country}
                    </span>
                  </div>
                </div>
              ) : (
                /* Shipping details abhi available nahi — pending/processing state */
                <div className="trk-info-card">
                  <h4 className="trk-info-title">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-5 9l2 2 4-4" />
                      <rect x="9" y="11" width="14" height="10" rx="2" />
                    </svg>
                    Delivery Details
                  </h4>
                  <div className="trk-info-row">
                    <span>Shipping to</span>
                    <span>
                      {order.city}, {order.country}
                    </span>
                  </div>
                  <p
                    className="trk-tracking-note"
                    style={{ marginTop: "0.75rem" }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      width="12"
                      height="12"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    Courier &amp; delivery details will appear here once your
                    order is shipped.
                  </p>
                </div>
              )}

              {/* Shipping Address */}
              <div className="trk-info-card">
                <h4 className="trk-info-title">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Shipping Address
                </h4>
                <address className="trk-address">
                  <strong>
                    {order.first_name} {order.last_name}
                  </strong>
                  <span>
                    {order.address}
                    {order.apartment ? `, ${order.apartment}` : ""}
                  </span>
                  <span>
                    {order.city}, {order.zip}
                  </span>
                  <span>{order.country}</span>
                </address>
              </div>

              {/* Payment Summary */}
              <div className="trk-info-card">
                <h4 className="trk-info-title">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  Payment Summary
                </h4>
                <div className="trk-info-row">
                  <span>Subtotal</span>
                  <span>{formatAmount(order.subtotal)}</span>
                </div>
                <div className="trk-info-row">
                  <span>Shipping</span>
                  <span>
                    {order.shipping_cost === 0
                      ? "Free"
                      : formatAmount(order.shipping_cost)}
                  </span>
                </div>
                <div className="trk-info-divider" />
                <div className="trk-info-row trk-info-total">
                  <span>Total Paid</span>
                  <span>{formatAmount(order.total_amount)}</span>
                </div>
                {order.payment_method && (
                  <div className="trk-info-row">
                    <span>Paid via</span>
                    <span className="trk-payment-badge">
                      {order.payment_method === "card"
                        ? "💳 Card"
                        : order.payment_method === "paypal"
                          ? "🅿️ PayPal"
                          : order.payment_method}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Items ── */}
            <div className="trk-items-section">
              <h3 className="trk-section-title">
                Items Ordered ({items.length})
              </h3>
              <div className="trk-items-list">
                {items.map((item, idx) => {
                  const ppu = item.pieces_per_unit ?? 1;
                  const total = item.price * ppu * item.quantity;
                  return (
                    <div key={idx} className="trk-item">
                      <div className="trk-item-image">
                        {item.variant_image ? (
                          <img
                            src={item.variant_image}
                            alt={item.product_name || "Product"}
                          />
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.2"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        )}
                      </div>
                      <div className="trk-item-info">
                        <div className="trk-item-name">
                          {item.product_name || "Product"}
                        </div>
                        {item.variant_name &&
                          item.variant_name !== "Standard" && (
                            <div className="trk-item-variant">
                              {item.variant_name}
                            </div>
                          )}
                        <div className="trk-item-qty">
                          Qty: {item.quantity}
                          {ppu > 1 && (
                            <span className="trk-item-ppu">
                              {" "}
                              ({ppu} pcs/unit)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="trk-item-price">
                        {formatAmount(total)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Contact ── */}
            <div className="trk-contact-bar">
              <span>Need help with your order?</span>
              <div className="trk-contact-links">
                <a href="mailto:info@tech4ru.com" className="trk-contact-link">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 8l10 6 10-6" />
                  </svg>
                  info@tech4ru.com
                </a>
                <a
                  href={`https://wa.me/${order.phone.replace(/\D/g, "")}?text=Hi%20Tech4U%2C%20I%20need%20help%20with%20order%20%23${order.order_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="trk-contact-link trk-contact-wa"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="14"
                    height="14"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a10.56 10.56 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.845L0 24l6.335-1.502A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.37l-.36-.213-3.727.883.936-3.618-.234-.372A9.818 9.818 0 112 12c0 5.42 4.398 9.818 9.818 9.818H12z" />
                  </svg>
                  WhatsApp Support
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Empty state after search */}
        {searched && !order && !loading && (
          <div className="trk-not-found">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <h3>Order Not Found</h3>
            <p>
              We couldn't find an order matching those details.
              <br />
              Please check your order number and email, or{" "}
              <a href="mailto:info@tech4ru.com">contact support</a>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}