// app/admin/orders/page.tsx (ya jahan bhi aapka admin orders page hai)
"use client";

import { useState, useEffect, useCallback } from "react";
import PanelNavbar from "@/app/components/PanelNavbar";
import "./orders.css";

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface Order {
  id: string;
  order_number: string;
  user_id?: string;
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
}

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  msg: string;
  exiting?: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPKR(amount: number) {
  return "PKR " + Number(amount).toLocaleString("en-PK");
}

const STATUS_OPTIONS = [
  "pending",
  "processing",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

// ─── Toast ───────────────────────────────────────────────────────────────────

function ToastBar({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: number) => void;
}) {
  return (
    <div className="ords-toast-wrap">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`ords-toast ords-toast--${t.type}${t.exiting ? " exiting" : ""}`}
        >
          <div className="ords-toast-icon">
            {t.type === "success" && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {t.type === "error" && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
            {t.type === "info" && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
              </svg>
            )}
          </div>
          <div className="ords-toast-body">
            <p className="ords-toast-msg">{t.msg}</p>
          </div>
          <button className="ords-toast-close" onClick={() => onRemove(t.id)}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderModal({
  order,
  onClose,
  onStatusChange,
  updatingStatus,
}: {
  order: Order;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  updatingStatus: boolean;
}) {
  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="ords-modal-overlay" onClick={onClose}>
      <div className="ords-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ords-modal-close" onClick={onClose}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="ords-modal-header">
          <div className="ords-modal-badge">Order Details</div>
          <h2 className="ords-modal-title">#{order.order_number}</h2>
          <p className="ords-modal-date">{formatDate(order.created_at)}</p>
        </div>

        {/* Status Update */}
        <div className="ords-modal-status-section">
          <p
            style={{
              fontFamily: "var(--ords-sans)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ords-text-muted)",
              marginBottom: "0.75rem",
              textAlign: "center",
            }}
          >
            Update Order Status
          </p>
          <div className="ords-status-buttons">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                className={`ords-status-btn${order.status === s ? ` active ${s}` : ""}`}
                onClick={() => onStatusChange(order.id, s)}
                disabled={updatingStatus || order.status === s}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Info Grid */}
        <div className="ords-modal-grid">
          {/* Customer Info */}
          <div className="ords-modal-card">
            <h3>Customer</h3>
            <div className="ords-modal-info-row">
              <span className="label">Name</span>
              <span className="value">
                {order.first_name} {order.last_name}
              </span>
            </div>
            <div className="ords-modal-info-row">
              <span className="label">Email</span>
              <span className="value" style={{ wordBreak: "break-all" }}>
                {order.email}
              </span>
            </div>
            <div className="ords-modal-info-row">
              <span className="label">Phone</span>
              <span className="value">{order.phone}</span>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="ords-modal-card">
            <h3>Shipping Address</h3>
            <p className="ords-modal-address">
              {order.address}
              {order.apartment && (
                <>
                  <br />
                  {order.apartment}
                </>
              )}
              <br />
              {order.city}, {order.zip}
              <br />
              {order.country}
            </p>
          </div>

          {/* Payment Info */}
          <div className="ords-modal-card">
            <h3>Payment</h3>
            <div className="ords-modal-info-row">
              <span className="label">Subtotal</span>
              <span className="value">{formatPKR(order.subtotal)}</span>
            </div>
            <div className="ords-modal-info-row">
              <span className="label">Shipping</span>
              <span className="value">
                {order.shipping_cost === 0
                  ? "Free"
                  : formatPKR(order.shipping_cost)}
              </span>
            </div>
            <div className="ords-modal-info-row">
              <span className="label">Total</span>
              <span
                className="value payment-paid"
                style={{ fontWeight: 700, fontSize: "0.95rem" }}
              >
                {formatPKR(order.total_amount)}
              </span>
            </div>
            <div className="ords-modal-info-row">
              <span className="label">Status</span>
              <span className={`ords-card-status ${order.status}`}>
                {order.status}
              </span>
            </div>
            {order.payment_method && (
              <div className="ords-modal-info-row">
                <span className="label">Payment via</span>
                <span className="value" style={{ textTransform: "capitalize" }}>
                  {order.payment_method === "card"
                    ? "💳 Credit/Debit Card (Stripe)"
                    : order.payment_method === "paypal"
                      ? "🅿️ PayPal"
                      : order.payment_method}
                </span>
              </div>
            )}
            {/* WhatsApp quick contact */}
            <a
              href={`https://wa.me/${order.phone.replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(order.first_name)}%2C%20regarding%20your%20order%20%23${order.order_number}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                marginTop: "0.75rem",
                padding: "0.4rem 0.8rem",
                background: "rgba(37,211,102,0.12)",
                border: "1px solid rgba(37,211,102,0.3)",
                borderRadius: "40px",
                color: "#16a34a",
                fontFamily: "var(--ords-sans)",
                fontSize: "0.65rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.845L0 24l6.335-1.502A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.37l-.36-.213-3.727.883.936-3.618-.234-.372A9.818 9.818 0 112 12c0 5.42 4.398 9.818 9.818 9.818H12z" />
              </svg>
              WhatsApp Customer
            </a>
          </div>
        </div>

        {/* Items Table - Responsive with data-label attributes */}
        <div className="ords-modal-items">
          <h3
            style={{
              fontFamily: "var(--ords-serif)",
              fontSize: "1rem",
              fontWeight: 600,
              marginBottom: "1rem",
              color: "var(--ords-text-primary)",
            }}
          >
            Ordered Items ({items.length})
          </h3>
          {items.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--ords-sans)",
                fontSize: "0.75rem",
                color: "var(--ords-text-muted)",
              }}
            >
              No item data available
            </p>
          ) : (
            <table className="ords-modal-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const ppu = item.pieces_per_unit ?? 1;
                  const itemTotal = item.price * ppu * item.quantity;
                  return (
                    <tr key={idx}>
                      <td data-label="Product">
                        <div className="ords-product-cell">
                          {item.variant_image && (
                            <img
                              src={item.variant_image}
                              alt=""
                              className="ords-product-thumb"
                            />
                          )}
                          <div>
                            <div className="ords-product-name">
                              {item.product_name || "Product"}
                            </div>
                            {item.variant_name &&
                              item.variant_name !== "Standard" && (
                                <div className="ords-product-variant">
                                  {item.variant_name}
                                </div>
                              )}
                            {ppu > 1 && (
                              <div className="ords-product-pieces">
                                {ppu} pieces/unit
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-label="Qty">{item.quantity}</td>
                      <td data-label="Price">{formatPKR(item.price)}</td>
                      <td
                        data-label="Total"
                        style={{
                          fontWeight: 600,
                          color: "var(--ords-gold-deep)",
                        }}
                      >
                        {formatPKR(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary */}
        <div className="ords-modal-summary">
          <div className="ords-summary-row">
            <span>Subtotal</span>
            <span>{formatPKR(order.subtotal)}</span>
          </div>
          <div className="ords-summary-row">
            <span>Shipping</span>
            <span>
              {order.shipping_cost === 0
                ? "Free"
                : formatPKR(order.shipping_cost)}
            </span>
          </div>
          <div className="ords-summary-divider" />
          <div className="ords-summary-row ords-summary-total">
            <span>Total</span>
            <span>{formatPKR(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
  const previewItems = items.slice(0, 3);
  const remaining = items.length - previewItems.length;

  return (
    <div className="ords-card" onClick={onClick}>
      <div className="ords-card-header">
        <div className="ords-card-number">
          <span className="ords-card-label">Order Number</span>
          <span className="ords-card-value">#{order.order_number}</span>
        </div>
        <span className={`ords-card-status ${order.status}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="ords-card-body">
        {/* Customer */}
        <div className="ords-card-customer">
          <div className="ords-customer-name">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <strong>
              {order.first_name} {order.last_name}
            </strong>
          </div>
          <div className="ords-customer-email">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 8l10 6 10-6" />
            </svg>
            {order.email}
          </div>
          <div className="ords-customer-phone">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 011 1.18 2 2 0 012.96 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
            </svg>
            {order.phone}
          </div>
        </div>

        {/* Items Preview */}
        <div className="ords-card-items">
          <div className="ords-items-count">
            {items.length} ITEM{items.length !== 1 ? "S" : ""}
          </div>
          <div className="ords-items-preview">
            {previewItems.map((item, i) => (
              <span key={i} className="ords-item-preview">
                {item.product_name || "Product"}
                {item.variant_name && item.variant_name !== "Standard"
                  ? ` (${item.variant_name})`
                  : ""}{" "}
                ×{item.quantity}
              </span>
            ))}
            {remaining > 0 && (
              <span className="ords-item-more">+{remaining} more</span>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="ords-card-total">
          <span className="ords-total-label">Total Amount</span>
          <span className="ords-total-value">
            {formatPKR(order.total_amount)}
          </span>
        </div>

        {/* Footer */}
        <div className="ords-card-footer">
          <span className="ords-card-date">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(order.created_at)}
          </span>
          <span
            className="ords-card-payment paid"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              textTransform: "capitalize",
            }}
          >
            {order.payment_method === "paypal"
              ? "🅿️ PayPal"
              : order.payment_method === "card"
                ? "💳 Card"
                : "✅ Paid"}
          </span>
        </div>
      </div>

      <div className="ords-card-actions">
        <button
          className="ords-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          View Full Details →
        </button>
        <a
          href={`https://wa.me/${order.phone.replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(order.first_name)}%2C%20regarding%20your%20order%20%23${order.order_number}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
            marginTop: "0.5rem",
            padding: "0.5rem",
            background: "rgba(37,211,102,0.08)",
            border: "1px solid rgba(37,211,102,0.25)",
            borderRadius: "40px",
            color: "#16a34a",
            fontFamily: "var(--ords-sans)",
            fontSize: "0.65rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.845L0 24l6.335-1.502A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.37l-.36-.213-3.727.883.936-3.618-.234-.372A9.818 9.818 0 112 12c0 5.42 4.398 9.818 9.818 9.818H12z" />
          </svg>
          WhatsApp
        </a>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string>("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast["type"], msg: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, msg }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      );
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        350,
      );
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 350);
  };

  // ✅ Fetch from API route (uses service_role key — RLS bypass — saari orders milti hain)
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || json.error) {
        const errMsg = json.error || `HTTP ${res.status}`;
        console.error("[Orders] API error:", errMsg);
        setFetchError(errMsg);
        addToast("error", `Failed to load orders: ${errMsg}`);
      } else {
        setOrders(json.orders || []);
        console.log(`[Orders] Loaded ${json.orders?.length ?? 0} orders`);
      }
    } catch (err: any) {
      console.error("[Orders] Fetch exception:", err);
      setFetchError(err.message);
      addToast("error", "Network error loading orders");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ✅ Real-time polling every 30s (service_role ke saath real-time bhi possible)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ── Status Update ──
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        addToast("error", `Status update failed: ${json.error}`);
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, status: newStatus } : null,
          );
        }
        addToast("success", `Order status updated to "${newStatus}"`);
      }
    } catch (err) {
      addToast("error", "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ── Filter ──
  const filtered = orders.filter((order) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      order.order_number.toLowerCase().includes(searchLower) ||
      order.first_name.toLowerCase().includes(searchLower) ||
      order.last_name.toLowerCase().includes(searchLower) ||
      order.email.toLowerCase().includes(searchLower) ||
      order.phone.includes(search) ||
      order.city.toLowerCase().includes(searchLower);

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesDate = !dateFilter || order.created_at.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  // ── Stats ──
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  return (
    <div className="ords-root">
      <div className="ords-ambient" />
      <div className="ords-grain" />

      <PanelNavbar />

      <div className="ords-content">
        {/* Header */}
        <div className="ords-page-header">
          <p className="ords-eyebrow">
            <span className="ords-ey-line" />
            Admin Panel
            <span className="ords-ey-line" />
          </p>
          <h1 className="ords-page-title">
            Customer <em>Orders</em>
          </h1>
          <p className="ords-page-sub">
            All orders placed by customers — manage, track, and update status
          </p>
        </div>

        {/* Stats */}
        <div className="ords-stats-grid">
          <div className="ords-stat-card">
            <div className="ords-stat-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                <path d="M16 3H8l-2 4h12l-2-4z" />
              </svg>
            </div>
            <div className="ords-stat-value">{totalOrders}</div>
            <div className="ords-stat-label">Total Orders</div>
          </div>
          <div className="ords-stat-card">
            <div className="ords-stat-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <div
              className="ords-stat-value"
              style={{ fontSize: "clamp(1rem, 4vw, 1.4rem)" }}
            >
              {formatPKR(totalRevenue)}
            </div>
            <div className="ords-stat-label">Total Revenue</div>
          </div>
          <div className="ords-stat-card">
            <div
              className="ords-stat-icon"
              style={{ background: "rgba(245,158,11,0.1)", color: "#d97706" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="ords-stat-value">{pendingCount}</div>
            <div className="ords-stat-label">Pending Orders</div>
          </div>
          <div className="ords-stat-card">
            <div
              className="ords-stat-icon"
              style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="ords-stat-value">{deliveredCount}</div>
            <div className="ords-stat-label">Delivered</div>
          </div>
        </div>

        {/* ✅ Error banner — agar API mein koi problem aye toh clearly dikhaye */}
        {fetchError && (
          <div className="ords-error-banner">
            <strong>⚠️ Error loading orders:</strong> {fetchError}
            <br />
            <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              Make sure <code>SUPABASE_SERVICE_ROLE_KEY</code> is set in your{" "}
              <code>.env.local</code> and the API route exists at{" "}
              <code>app/api/admin/orders/route.ts</code>
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="ords-filters-section">
          <div className="ords-search-bar">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, phone, order number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="ords-clear-search"
                onClick={() => setSearch("")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <div className="ords-filter-buttons">
            {["all", ...STATUS_OPTIONS].map((s) => (
              <button
                key={s}
                className={`ords-filter-btn${statusFilter === s ? " active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="ords-date-filter">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            {dateFilter && (
              <button
                className="ords-clear-date"
                onClick={() => setDateFilter("")}
              >
                Clear
              </button>
            )}
          </div>

          <button
            className="ords-filter-btn"
            onClick={fetchOrders}
            title="Refresh orders"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              width="14"
              height="14"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
        </div>

        {(search || statusFilter !== "all" || dateFilter) && (
          <p
            style={{
              fontFamily: "var(--ords-sans)",
              fontSize: "0.75rem",
              color: "var(--ords-text-muted)",
              marginBottom: "1.5rem",
            }}
          >
            Showing <strong>{filtered.length}</strong> of {totalOrders} orders
          </p>
        )}

        {/* Orders Grid */}
        {loading ? (
          <div className="ords-loading">
            <div className="ords-spinner" />
            <p
              style={{
                fontFamily: "var(--ords-sans)",
                fontSize: "0.8rem",
                color: "var(--ords-text-muted)",
                marginTop: "1rem",
              }}
            >
              Loading all orders…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="ords-empty">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path d="M16 3H8l-2 4h12l-2-4z" />
            </svg>
            <h3>
              {orders.length === 0 ? "No Orders Yet" : "No Matching Orders"}
            </h3>
            <p>
              {orders.length === 0
                ? "When customers place orders, they will appear here."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : (
          <div className="ords-grid">
            {filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          updatingStatus={updatingStatus}
        />
      )}

      <ToastBar toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
