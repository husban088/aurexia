"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Lazy load live tracking (avoids SSR issues)
const LiveTracking = dynamic(() => import("@/app/components/LiveTracking"), {
  ssr: false,
  loading: () => (
    <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-500 animate-pulse">
      Loading live tracker…
    </div>
  ),
});

/* ─── Types ─── */
interface Order {
  id: string;
  order_number: string;
  email: string;
  status: string;
  created_at: string;
  updated_at?: string;
  // shipping
  courier_name?: string;
  courier_country?: string;
  tracking_number?: string;
  courier_tracking_url?: string;
  estimated_days?: string;
  shipped_at?: string;
  // customer
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  // items
  items?: any[];
  total?: number;
  currency?: string;
}

/* ─── Helpers ─── */
function statusColor(s: string) {
  const map: Record<string, string> = {
    pending: "#f59e0b",
    processing: "#6366f1",
    shipped: "#3b82f6",
    delivered: "#10b981",
    cancelled: "#ef4444",
  };
  return map[s?.toLowerCase()] ?? "#6b7280";
}

function statusBg(s: string) {
  const map: Record<string, string> = {
    pending: "#fffbeb",
    processing: "#eef2ff",
    shipped: "#eff6ff",
    delivered: "#ecfdf5",
    cancelled: "#fef2f2",
  };
  return map[s?.toLowerCase()] ?? "#f9fafb";
}

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ════════════════════════════════════════════
   PAGE
════════════════════════════════════════════ */
export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) return;

    setLoading(true);
    setError(null);
    setOrder(null);
    setSearched(false);

    try {
      const params = new URLSearchParams({
        order_number: orderNumber.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
      });
      const res = await fetch(`/api/track-order?${params}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Something went wrong");
      setOrder(json.order ?? null);
      setSearched(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const hasTracking = order?.tracking_number && order?.courier_name;

  return (
    <main style={pageStyles.main}>
      <div style={pageStyles.container}>
        {/* ── Hero ── */}
        <div style={pageStyles.hero}>
          <h1 style={pageStyles.title}>Track Your Order</h1>
          <p style={pageStyles.subtitle}>
            Enter your order number and email to get live delivery updates
          </p>
        </div>

        {/* ── Search form ── */}
        <form onSubmit={handleTrack} style={pageStyles.form}>
          <div style={pageStyles.inputGroup}>
            <label style={pageStyles.label}>Order Number</label>
            <input
              type="text"
              placeholder="e.g. ORD-12345"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              style={pageStyles.input}
              required
            />
          </div>
          <div style={pageStyles.inputGroup}>
            <label style={pageStyles.label}>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={pageStyles.input}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...pageStyles.trackBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "🔍 Searching…" : "🔍 Track Order"}
          </button>
        </form>

        {/* ── Error ── */}
        {error && <div style={pageStyles.errorBox}>⚠️ {error}</div>}

        {/* ── Not found ── */}
        {searched && !order && !error && (
          <div style={pageStyles.notFoundBox}>
            <p style={{ fontWeight: 700, color: "#374151" }}>Order Not Found</p>
            <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
              Please check your order number and email address.
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════
            ORDER FOUND
        ════════════════════════════════════════ */}
        {order && (
          <div style={pageStyles.resultWrap}>
            {/* ── Order summary card ── */}
            <div style={pageStyles.card}>
              <div style={pageStyles.cardHeader}>
                <div>
                  <p style={pageStyles.orderNumLabel}>Order Number</p>
                  <p style={pageStyles.orderNum}>{order.order_number}</p>
                </div>
                <span
                  style={{
                    ...pageStyles.statusBadge,
                    color: statusColor(order.status),
                    background: statusBg(order.status),
                    border: `1.5px solid ${statusColor(order.status)}30`,
                  }}
                >
                  {order.status?.toUpperCase()}
                </span>
              </div>

              <div style={pageStyles.infoGrid}>
                <InfoRow label="Order Date" value={fmt(order.created_at)} />
                <InfoRow label="Name" value={order.full_name || "—"} />
                {order.city && <InfoRow label="City" value={order.city} />}
                {order.total && (
                  <InfoRow
                    label="Total"
                    value={`${order.currency ?? "PKR"} ${order.total}`}
                  />
                )}
              </div>
            </div>

            {/* ════════════════════════════
                TRACKING NUMBER SECTION
                (Only show if tracking exists)
            ════════════════════════════ */}
            {hasTracking ? (
              <div style={pageStyles.card}>
                <h2 style={pageStyles.sectionTitle}>📦 Shipment Tracking</h2>

                {/* Tracking details row */}
                <div style={pageStyles.shippingDetailsGrid}>
                  <ShipDetail
                    icon="🚚"
                    label="Courier"
                    value={order.courier_name!}
                  />
                  <ShipDetail
                    icon="🔢"
                    label="Tracking Number"
                    value={order.tracking_number!}
                    mono
                  />
                  {order.courier_country && (
                    <ShipDetail
                      icon="🌍"
                      label="Country"
                      value={order.courier_country}
                    />
                  )}
                  {order.estimated_days && (
                    <ShipDetail
                      icon="📅"
                      label="Est. Delivery"
                      value={`${order.estimated_days} days`}
                    />
                  )}
                  {order.shipped_at && (
                    <ShipDetail
                      icon="📤"
                      label="Shipped On"
                      value={fmt(order.shipped_at)}
                    />
                  )}
                </div>

                {/* ── LIVE TRACKING COMPONENT ── */}
                <LiveTracking
                  trackingNumber={order.tracking_number!}
                  courierName={order.courier_name!}
                  orderId={order.id}
                  refreshInterval={60}
                />
              </div>
            ) : (
              /* No tracking yet */
              order.status !== "delivered" && (
                <div style={pageStyles.noTrackingBox}>
                  <span style={{ fontSize: 28 }}>📦</span>
                  <div>
                    <p style={{ fontWeight: 700, color: "#374151", margin: 0 }}>
                      Tracking Not Available Yet
                    </p>
                    <p
                      style={{
                        color: "#6b7280",
                        fontSize: 13,
                        margin: "4px 0 0",
                      }}
                    >
                      Your order is being prepared. Tracking details will appear
                      here once your order is shipped.
                    </p>
                  </div>
                </div>
              )
            )}

            {/* ── Items (if available) ── */}
            {order.items && order.items.length > 0 && (
              <div style={pageStyles.card}>
                <h2 style={pageStyles.sectionTitle}>🛍️ Items Ordered</h2>
                <div>
                  {order.items.map((item: any, i: number) => (
                    <div key={i} style={pageStyles.itemRow}>
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={pageStyles.itemImg}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={pageStyles.itemName}>{item.name}</p>
                        {item.variant && (
                          <p style={pageStyles.itemVariant}>{item.variant}</p>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={pageStyles.itemQty}>×{item.qty ?? 1}</p>
                        {item.price && (
                          <p style={pageStyles.itemPrice}>
                            {order.currency ?? "PKR"} {item.price}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        input:focus { outline: 2px solid #6366f1; outline-offset: 0; }
      `}</style>
    </main>
  );
}

/* ─── Sub-components ─── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600 }}>
        {label}
      </span>
      <p style={{ margin: 0, color: "#374151", fontSize: 14, fontWeight: 500 }}>
        {value}
      </p>
    </div>
  );
}

function ShipDetail({
  icon,
  label,
  value,
  mono,
}: {
  icon: string;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={pageStyles.shipDetailBox}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 10,
            color: "#9ca3af",
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          {label.toUpperCase()}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "#111827",
            fontWeight: 700,
            fontFamily: mono ? "monospace" : "inherit",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─── Page styles ─── */
const pageStyles: Record<string, any> = {
  main: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)",
    padding: "40px 16px 80px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  container: {
    maxWidth: 620,
    margin: "0 auto",
  },
  hero: {
    textAlign: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
    color: "#111827",
    margin: "0 0 8px",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 14,
    margin: 0,
  },
  form: {
    background: "#fff",
    borderRadius: 16,
    padding: "24px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
    marginBottom: 20,
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    letterSpacing: 0.3,
  },
  input: {
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 14,
    color: "#111827",
    transition: "border-color 0.2s",
  },
  trackBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 24px",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    letterSpacing: 0.3,
    boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
    transition: "opacity 0.2s",
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#dc2626",
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 13,
    marginBottom: 16,
  },
  notFoundBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "20px 24px",
    textAlign: "center" as const,
  },
  resultWrap: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: "20px 24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  orderNumLabel: {
    margin: 0,
    fontSize: 10,
    fontWeight: 700,
    color: "#9ca3af",
    letterSpacing: 1,
  },
  orderNum: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    color: "#111827",
  },
  statusBadge: {
    display: "inline-block",
    padding: "5px 14px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.5,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px 16px",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#111827",
    margin: "0 0 14px",
    letterSpacing: -0.2,
  },
  shippingDetailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 4,
  },
  shipDetailBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    background: "#f9fafb",
    borderRadius: 10,
    padding: "10px 12px",
    border: "1px solid #f3f4f6",
  },
  noTrackingBox: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 12,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    color: "#92400e",
  },
  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  itemImg: {
    width: 48,
    height: 48,
    borderRadius: 8,
    objectFit: "cover" as const,
    border: "1px solid #e5e7eb",
  },
  itemName: {
    margin: 0,
    fontWeight: 600,
    fontSize: 14,
    color: "#111827",
  },
  itemVariant: {
    margin: 0,
    fontSize: 12,
    color: "#6b7280",
  },
  itemQty: {
    margin: 0,
    fontSize: 13,
    color: "#6b7280",
    fontWeight: 600,
  },
  itemPrice: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    color: "#111827",
  },
};
