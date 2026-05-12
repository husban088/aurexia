// app/track-order/page.tsx
// ✅ Customer apna order number + email se track kar sakta hai
// ✅ Complete order details (checkout form + cart items) show hote hain
// ✅ Live tracking timeline (shipped_at + estimated_days se build hoti hai)
// ✅ Direct courier website ka link bhi milta hai
// ✅ Fake tracking number test karne ke liye console mein bhi log hoga

"use client";

import { useState, useEffect } from "react";

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

interface TrackingCheckpoint {
  date: string;
  location: string;
  status: string;
  message: string;
  tag: string;
}

interface Order {
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
  // Shipping fields
  courier_name?: string;
  courier_country?: string;
  tracking_number?: string;
  courier_tracking_url?: string;
  estimated_days?: string;
  shipped_at?: string;
  // Live tracking cache
  live_tracking_data?: {
    checkpoints?: TrackingCheckpoint[];
    delivered?: boolean;
    tracking_url?: string;
  };
}

interface LiveTracking {
  tracking_number: string;
  courier: string;
  delivered: boolean;
  estimated_delivery: string;
  last_updated: string;
  status_message: string;
  checkpoints: TrackingCheckpoint[];
  tracking_url: string;
  used_api: boolean;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  pending: {
    label: "Pending",
    color: "#d97706",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
    icon: "⏳",
  },
  processing: {
    label: "Processing",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.1)",
    border: "rgba(37,99,235,0.25)",
    icon: "⚙️",
  },
  confirmed: {
    label: "Confirmed",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.1)",
    border: "rgba(124,58,237,0.25)",
    icon: "✅",
  },
  shipped: {
    label: "Shipped",
    color: "#0891b2",
    bg: "rgba(8,145,178,0.1)",
    border: "rgba(8,145,178,0.25)",
    icon: "🚚",
  },
  delivered: {
    label: "Delivered",
    color: "#16a34a",
    bg: "rgba(22,163,74,0.1)",
    border: "rgba(22,163,74,0.25)",
    icon: "📦",
  },
  cancelled: {
    label: "Cancelled",
    color: "#dc2626",
    bg: "rgba(220,38,38,0.1)",
    border: "rgba(220,38,38,0.25)",
    icon: "❌",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPKR(amount: number) {
  return "PKR " + Number(amount).toLocaleString("en-PK");
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [liveTracking, setLiveTracking] = useState<LiveTracking | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // ── Track Order ──
  async function handleTrack() {
    const num = orderNumber.trim().toUpperCase();
    const em = email.trim().toLowerCase();

    if (!num || !em) {
      setError("Please enter both order number and email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);
    setLiveTracking(null);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/track-order?order_number=${encodeURIComponent(num)}&email=${encodeURIComponent(em)}`,
      );
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }

      console.log("[TrackOrder] API Response:", json);

      if (!json.order) {
        setError(
          "No order found with this order number and email. Please check your details and try again.",
        );
        return;
      }

      setOrder(json.order);

      // Agar order shipped hai aur tracking number hai — live tracking fetch karo
      if (json.order.tracking_number && json.order.courier_name) {
        fetchLiveTracking(
          json.order.tracking_number,
          json.order.courier_name,
          json.order.id,
        );
      }
    } catch (err: any) {
      setError("Network error. Please check your connection and try again.");
      console.error("[TrackOrder] Error:", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Live Tracking Fetch ──
  async function fetchLiveTracking(
    trackingNum: string,
    courierName: string,
    orderId: string,
  ) {
    setTrackingLoading(true);
    try {
      const res = await fetch(
        `/api/track-live?tracking=${encodeURIComponent(trackingNum)}&courier=${encodeURIComponent(courierName)}&orderId=${encodeURIComponent(orderId)}`,
      );
      const json = await res.json();

      console.log("[TrackOrder] Live Tracking Response:", json);

      if (res.ok && json.checkpoints) {
        setLiveTracking(json);
      }
    } catch (err) {
      console.error("[TrackOrder] Live tracking error:", err);
    } finally {
      setTrackingLoading(false);
    }
  }

  // Enter key support
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleTrack();
  }

  const statusCfg = order
    ? STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
    : null;

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              width="28"
              height="28"
            >
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path d="M16 3H8l-2 4h12l-2-4z" />
            </svg>
          </div>
          <div>
            <h1 style={styles.headerTitle}>Track Your Order</h1>
            <p style={styles.headerSub}>
              Enter your order number and email to see real-time updates
            </p>
          </div>
        </div>
      </div>

      <div style={styles.container}>
        {/* ── Search Form ── */}
        <div style={styles.searchCard}>
          <div style={styles.searchGrid}>
            <div style={styles.fieldWrap}>
              <label style={styles.label}>Order Number</label>
              <input
                type="text"
                placeholder="e.g. ORD-ABC123"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={handleKeyDown}
                style={styles.input}
              />
            </div>
            <div style={styles.fieldWrap}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="e.g. you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                style={styles.input}
              />
            </div>
            <button
              onClick={handleTrack}
              disabled={loading}
              style={{
                ...styles.trackBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <span style={styles.spinner} />
                  Searching…
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="16"
                    height="16"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                  </svg>
                  Track Order
                </>
              )}
            </button>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="16"
                height="16"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* How to find order number tip */}
          {!searched && (
            <p style={styles.tip}>
              💡 Your order number is in your confirmation email — it looks like{" "}
              <strong>ORD-XXXX</strong>
            </p>
          )}
        </div>

        {/* ── Order Results ── */}
        {order && statusCfg && (
          <div style={styles.resultsWrap}>
            {/* Status Badge + Order Number */}
            <div style={styles.orderHeader}>
              <div style={styles.orderNumWrap}>
                <span style={styles.orderNumLabel}>Order</span>
                <span style={styles.orderNum}>#{order.order_number}</span>
              </div>
              <div
                style={{
                  ...styles.statusBadge,
                  color: statusCfg.color,
                  background: statusCfg.bg,
                  border: `1px solid ${statusCfg.border}`,
                }}
              >
                {statusCfg.icon} {statusCfg.label}
              </div>
            </div>

            <div style={styles.twoCol}>
              {/* ── LEFT COLUMN ── */}
              <div style={styles.leftCol}>
                {/* Order Summary */}
                <Section title="📋 Order Summary">
                  <Row label="Order Number" value={`#${order.order_number}`} />
                  <Row label="Placed On" value={formatDate(order.created_at)} />
                  <Row
                    label="Payment Method"
                    value={order.payment_method || "N/A"}
                  />
                  <Row
                    label="Order Status"
                    value={
                      <span style={{ color: statusCfg.color, fontWeight: 700 }}>
                        {statusCfg.icon} {statusCfg.label}
                      </span>
                    }
                  />
                </Section>

                {/* Customer Details */}
                <Section title="👤 Customer Details">
                  <Row
                    label="Name"
                    value={`${order.first_name} ${order.last_name}`}
                  />
                  <Row label="Email" value={order.email} />
                  <Row label="Phone" value={order.phone} />
                </Section>

                {/* Shipping Address */}
                <Section title="📍 Shipping Address">
                  <Row label="Address" value={order.address} />
                  {order.apartment && (
                    <Row label="Apt / Suite" value={order.apartment} />
                  )}
                  <Row label="City" value={order.city} />
                  <Row label="ZIP / Postal" value={order.zip} />
                  <Row label="Country" value={order.country} />
                </Section>

                {/* Courier Info (if shipped) */}
                {order.courier_name && (
                  <Section title="🚚 Shipping Details">
                    <Row label="Courier" value={order.courier_name} />
                    {order.courier_country && (
                      <Row label="Ship To" value={order.courier_country} />
                    )}
                    {order.tracking_number && (
                      <Row
                        label="Tracking #"
                        value={
                          <span
                            style={{ fontFamily: "monospace", fontWeight: 700 }}
                          >
                            {order.tracking_number}
                          </span>
                        }
                      />
                    )}
                    {order.estimated_days && (
                      <Row label="Est. Delivery" value={order.estimated_days} />
                    )}
                    {order.shipped_at && (
                      <Row
                        label="Shipped At"
                        value={formatDate(order.shipped_at)}
                      />
                    )}
                    {order.courier_tracking_url && order.tracking_number && (
                      <div style={{ marginTop: "10px" }}>
                        <a
                          href={order.courier_tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.courierLink}
                        >
                          🔗 Track on {order.courier_name} website →
                        </a>
                      </div>
                    )}
                  </Section>
                )}
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div style={styles.rightCol}>
                {/* Cart Items */}
                <Section title="🛒 Your Items">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          ...styles.itemRow,
                          borderBottom:
                            i < order.items.length - 1
                              ? "1px solid rgba(255,255,255,0.06)"
                              : "none",
                        }}
                      >
                        {item.variant_image && (
                          <img
                            src={item.variant_image}
                            alt={item.product_name || "Product"}
                            style={styles.itemImg}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                        <div style={styles.itemInfo}>
                          <div style={styles.itemName}>
                            {item.product_name || "Product"}
                          </div>
                          {item.variant_name && (
                            <div style={styles.itemVariant}>
                              {item.variant_name}
                            </div>
                          )}
                          {item.pieces_per_unit && item.pieces_per_unit > 1 && (
                            <div style={styles.itemVariant}>
                              {item.pieces_per_unit} pieces/unit
                            </div>
                          )}
                          <div style={styles.itemMeta}>
                            <span>Qty: {item.quantity}</span>
                            <span style={styles.itemPrice}>
                              {formatPKR(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#888", fontSize: "0.8rem" }}>
                      No items found.
                    </p>
                  )}

                  {/* Price Breakdown */}
                  <div style={styles.priceBreakdown}>
                    <PriceRow
                      label="Subtotal"
                      value={formatPKR(order.subtotal)}
                    />
                    <PriceRow
                      label="Shipping"
                      value={
                        order.shipping_cost > 0
                          ? formatPKR(order.shipping_cost)
                          : "Free"
                      }
                    />
                    <div style={styles.totalRow}>
                      <span>Total</span>
                      <span style={{ color: "#daa520", fontWeight: 800 }}>
                        {formatPKR(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </Section>

                {/* Live Tracking Timeline */}
                {(order.status === "shipped" || order.status === "delivered") &&
                  order.tracking_number && (
                    <Section title="📡 Live Tracking Timeline">
                      {trackingLoading ? (
                        <div style={styles.trackingLoading}>
                          <span style={styles.spinner} />
                          <span style={{ color: "#888", fontSize: "0.8rem" }}>
                            Fetching live tracking…
                          </span>
                        </div>
                      ) : liveTracking ? (
                        <LiveTrackingView tracking={liveTracking} />
                      ) : (
                        <div style={{ color: "#888", fontSize: "0.8rem" }}>
                          Tracking information not available yet. Please check
                          back soon.
                        </div>
                      )}
                    </Section>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* ── Empty State (searched but no result, handled by error) ── */}
      </div>
    </div>
  );
}

// ─── Live Tracking View ───────────────────────────────────────────────────────

function LiveTrackingView({ tracking }: { tracking: LiveTracking }) {
  return (
    <div>
      {/* Status + ETA */}
      <div style={styles.trackingStatus}>
        <div style={styles.trackingStatusLeft}>
          <div style={styles.trackingStatusLabel}>Current Status</div>
          <div
            style={{
              ...styles.trackingStatusValue,
              color: tracking.delivered ? "#16a34a" : "#0891b2",
            }}
          >
            {tracking.delivered
              ? "📦 Delivered"
              : `🚚 ${tracking.status_message}`}
          </div>
        </div>
        <div style={styles.trackingStatusRight}>
          <div style={styles.trackingStatusLabel}>Est. Delivery</div>
          <div style={styles.trackingStatusDate}>
            {formatDateShort(tracking.estimated_delivery)}
          </div>
        </div>
      </div>

      {/* Courier tracking link */}
      {tracking.tracking_url && (
        <a
          href={tracking.tracking_url}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.liveTrackBtn}
        >
          🔗 Open Live Tracking on {tracking.courier} →
        </a>
      )}

      {/* Timeline Checkpoints */}
      <div style={styles.timeline}>
        {tracking.checkpoints.map((cp, i) => {
          const isFirst = i === 0;
          const isDelivered = cp.tag === "Delivered";
          const dotColor = isDelivered
            ? "#16a34a"
            : isFirst
              ? "#0891b2"
              : "#555";

          return (
            <div key={i} style={styles.timelineItem}>
              {/* Line */}
              {i < tracking.checkpoints.length - 1 && (
                <div style={styles.timelineLine} />
              )}

              {/* Dot */}
              <div
                style={{
                  ...styles.timelineDot,
                  background: dotColor,
                  boxShadow: isFirst ? `0 0 0 4px ${dotColor}22` : "none",
                  transform: isFirst ? "scale(1.2)" : "scale(1)",
                }}
              />

              {/* Content */}
              <div style={styles.timelineContent}>
                <div
                  style={{
                    ...styles.timelineStatus,
                    color: isFirst ? "#fff" : "#ccc",
                  }}
                >
                  {cp.status}
                </div>
                <div style={styles.timelineMsg}>{cp.message}</div>
                <div style={styles.timelineDate}>
                  📍 {cp.location} · {formatDate(cp.date)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p style={styles.lastUpdated}>
        Last updated: {formatDate(tracking.last_updated)}
      </p>
    </div>
  );
}

// ─── Reusable Components ──────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={styles.rowValue}>{value}</span>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.priceRow}>
      <span style={styles.priceLabel}>{label}</span>
      <span style={styles.priceValue}>{value}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#111",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#e0e0e0",
  },
  header: {
    background: "linear-gradient(135deg, #1a1a1a 0%, #222 100%)",
    borderBottom: "1px solid rgba(218,165,32,0.2)",
    padding: "24px 20px",
    paddingTop: "80px",
  },
  headerInner: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  logo: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "rgba(218,165,32,0.15)",
    border: "1px solid rgba(218,165,32,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#daa520",
    flexShrink: 0,
  },
  headerTitle: {
    margin: 0,
    fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
    fontWeight: 700,
    color: "#daa520",
    letterSpacing: "-0.02em",
  },
  headerSub: {
    margin: "4px 0 0",
    fontSize: "0.8rem",
    color: "#888",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "32px 20px",
  },
  searchCard: {
    background: "#1a1a1a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "28px",
    marginBottom: "32px",
  },
  searchGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "12px",
    alignItems: "end",
  } as React.CSSProperties,
  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#888",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  },
  input: {
    padding: "11px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: "0.88rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  trackBtn: {
    padding: "11px 24px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #daa520, #b8860b)",
    color: "#1a1a1a",
    fontSize: "0.88rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap" as const,
    transition: "all 0.2s",
  },
  spinner: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    border: "2px solid rgba(26,26,26,0.3)",
    borderTop: "2px solid #1a1a1a",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  errorBox: {
    marginTop: "16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px 16px",
    background: "rgba(220,38,38,0.08)",
    border: "1px solid rgba(220,38,38,0.2)",
    borderRadius: "12px",
    color: "#ef4444",
    fontSize: "0.83rem",
    lineHeight: 1.5,
  },
  tip: {
    marginTop: "14px",
    fontSize: "0.75rem",
    color: "#666",
    textAlign: "center" as const,
  },

  // Results
  resultsWrap: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "24px",
  },
  orderHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "12px",
    padding: "20px 24px",
    background: "#1a1a1a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
  },
  orderNumWrap: {
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
  },
  orderNumLabel: {
    fontSize: "0.75rem",
    color: "#666",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  },
  orderNum: {
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.02em",
  },
  statusBadge: {
    padding: "8px 18px",
    borderRadius: "40px",
    fontSize: "0.83rem",
    fontWeight: 700,
  },

  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    alignItems: "start",
  } as React.CSSProperties,
  leftCol: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  rightCol: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },

  // Section
  section: {
    background: "#1a1a1a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    overflow: "hidden",
  },
  sectionTitle: {
    margin: 0,
    padding: "14px 20px",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#daa520",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  sectionBody: {
    padding: "16px 20px",
  },

  // Row
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    padding: "6px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    fontSize: "0.82rem",
  },
  rowLabel: {
    color: "#888",
    flexShrink: 0,
    minWidth: "90px",
  },
  rowValue: {
    color: "#e0e0e0",
    fontWeight: 500,
    textAlign: "right" as const,
    wordBreak: "break-word" as const,
  },

  // Cart items
  itemRow: {
    display: "flex",
    gap: "12px",
    padding: "10px 0",
  },
  itemImg: {
    width: "52px",
    height: "52px",
    borderRadius: "10px",
    objectFit: "cover" as const,
    border: "1px solid rgba(255,255,255,0.1)",
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#e0e0e0",
    marginBottom: "2px",
  },
  itemVariant: {
    fontSize: "0.72rem",
    color: "#888",
    marginBottom: "4px",
  },
  itemMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.75rem",
    color: "#aaa",
  },
  itemPrice: {
    color: "#daa520",
    fontWeight: 700,
  },

  // Price breakdown
  priceBreakdown: {
    marginTop: "14px",
    paddingTop: "14px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.8rem",
    color: "#888",
    padding: "4px 0",
  },
  priceLabel: {},
  priceValue: {
    color: "#ccc",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#fff",
    padding: "10px 0 0",
    marginTop: "6px",
    borderTop: "1px solid rgba(218,165,32,0.2)",
  },

  // Courier link
  courierLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "8px 14px",
    background: "rgba(8,145,178,0.1)",
    border: "1px solid rgba(8,145,178,0.25)",
    borderRadius: "8px",
    color: "#22d3ee",
    fontSize: "0.78rem",
    textDecoration: "none",
    fontWeight: 600,
    transition: "all 0.15s",
  },

  // Live tracking
  trackingLoading: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 0",
  },
  trackingStatus: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "12px",
    marginBottom: "12px",
    flexWrap: "wrap" as const,
  },
  trackingStatusLeft: {},
  trackingStatusRight: {
    textAlign: "right" as const,
  },
  trackingStatusLabel: {
    fontSize: "0.65rem",
    color: "#666",
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    marginBottom: "3px",
  },
  trackingStatusValue: {
    fontSize: "0.9rem",
    fontWeight: 700,
  },
  trackingStatusDate: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#ccc",
  },
  liveTrackBtn: {
    display: "block",
    padding: "9px 14px",
    background: "rgba(8,145,178,0.1)",
    border: "1px solid rgba(8,145,178,0.25)",
    borderRadius: "10px",
    color: "#22d3ee",
    fontSize: "0.78rem",
    textDecoration: "none",
    fontWeight: 600,
    marginBottom: "16px",
    textAlign: "center" as const,
  },

  // Timeline
  timeline: {
    position: "relative" as const,
    paddingLeft: "24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0",
  },
  timelineItem: {
    position: "relative" as const,
    paddingBottom: "20px",
    paddingLeft: "16px",
  },
  timelineLine: {
    position: "absolute" as const,
    left: "-1px",
    top: "10px",
    bottom: "-10px",
    width: "2px",
    background: "rgba(255,255,255,0.08)",
  },
  timelineDot: {
    position: "absolute" as const,
    left: "-5px",
    top: "4px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    transition: "all 0.2s",
  },
  timelineContent: {
    paddingLeft: "4px",
  },
  timelineStatus: {
    fontSize: "0.83rem",
    fontWeight: 700,
    marginBottom: "2px",
  },
  timelineMsg: {
    fontSize: "0.75rem",
    color: "#aaa",
    marginBottom: "3px",
    lineHeight: 1.4,
  },
  timelineDate: {
    fontSize: "0.68rem",
    color: "#666",
  },
  lastUpdated: {
    fontSize: "0.65rem",
    color: "#555",
    marginTop: "8px",
    textAlign: "right" as const,
  },
};

// ─── Keyframes (global) ───────────────────────────────────────────────────────
// Add this in your global CSS or layout:
// @keyframes spin { to { transform: rotate(360deg); } }
// Ya neeche wala style tag HTML mein inject karo:

if (typeof document !== "undefined") {
  const id = "track-order-keyframes";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (max-width: 700px) {
        .toc-grid { grid-template-columns: 1fr !important; }
        .toc-search-grid { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.appendChild(s);
  }
}
