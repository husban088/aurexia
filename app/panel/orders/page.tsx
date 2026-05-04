// app/panel/orders/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "./orders.css";

// Types
interface OrderItem {
  name: string;
  variant: string | null;
  quantity: number;
  piecesPerUnit: number;
  price: number;
  image: string | null;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_method: string;
  currency: string;
  status: "pending" | "processing" | "confirmed" | "delivered" | "cancelled";
  payment_status: "pending" | "paid" | "failed";
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  title: string;
  msg: string;
  exiting?: boolean;
};

type FilterType = "all" | "delivered" | "pending";

// Format currency
const formatCurrency = (amount: number, currency: string = "PKR") => {
  const symbols: Record<string, string> = {
    PKR: "₨",
    USD: "$",
    GBP: "£",
    EUR: "€",
    AUD: "A$",
    CAD: "C$",
  };
  const symbol = symbols[currency] || "₨";
  return `${symbol} ${amount.toLocaleString()}`;
};

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    full: date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    dateOnly: date.toISOString().split("T")[0],
  };
};

// Toast Component
function ToastContainer({
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
          className={`ords-toast ords-toast--${t.type}${
            t.exiting ? " exiting" : ""
          }`}
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
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
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
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            )}
          </div>
          <div className="ords-toast-body">
            <p className="ords-toast-title">{t.title}</p>
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

// Order Detail Modal
function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (
    orderId: string,
    newStatus: Order["status"]
  ) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !order) return null;

  const handleStatusChange = async (newStatus: Order["status"]) => {
    setUpdating(true);
    await onStatusUpdate(order.id, newStatus);
    setUpdating(false);
  };

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

        <div className="ords-modal-header">
          <div className="ords-modal-badge">Order Details</div>
          <h2 className="ords-modal-title">Order #{order.order_number}</h2>
          <p className="ords-modal-date">
            {formatDate(order.created_at).full} at{" "}
            {formatDate(order.created_at).time}
          </p>
        </div>

        <div className="ords-modal-status-section">
          <div className="ords-status-buttons">
            <button
              className={`ords-status-btn ${
                order.status === "pending" ? "active pending" : ""
              }`}
              onClick={() => handleStatusChange("pending")}
              disabled={updating}
            >
              Pending
            </button>
            <button
              className={`ords-status-btn ${
                order.status === "processing" ? "active processing" : ""
              }`}
              onClick={() => handleStatusChange("processing")}
              disabled={updating}
            >
              Processing
            </button>
            <button
              className={`ords-status-btn ${
                order.status === "confirmed" ? "active confirmed" : ""
              }`}
              onClick={() => handleStatusChange("confirmed")}
              disabled={updating}
            >
              Confirmed
            </button>
            <button
              className={`ords-status-btn ${
                order.status === "delivered" ? "active delivered" : ""
              }`}
              onClick={() => handleStatusChange("delivered")}
              disabled={updating}
            >
              Delivered
            </button>
            <button
              className={`ords-status-btn ${
                order.status === "cancelled" ? "active cancelled" : ""
              }`}
              onClick={() => handleStatusChange("cancelled")}
              disabled={updating}
            >
              Cancelled
            </button>
          </div>
        </div>

        <div className="ords-modal-grid">
          <div className="ords-modal-card">
            <h3>Customer Information</h3>
            <div className="ords-modal-info-row">
              <span className="label">Name:</span>
              <span className="value">{order.customer_name}</span>
            </div>
            <div className="ords-modal-info-row">
              <span className="label">Email:</span>
              <span className="value">{order.customer_email}</span>
            </div>
            <div className="ords-modal-info-row">
              <span className="label">Phone:</span>
              <span className="value">{order.customer_phone}</span>
            </div>
          </div>

          <div className="ords-modal-card">
            <h3>Shipping Address</h3>
            <div className="ords-modal-address">{order.shipping_address}</div>
          </div>

          <div className="ords-modal-card">
            <h3>Payment Information</h3>
            <div className="ords-modal-info-row">
              <span className="label">Method:</span>
              <span className="value">{order.payment_method}</span>
            </div>
            <div className="ords-modal-info-row">
              <span className="label">Status:</span>
              <span className={`value payment-${order.payment_status}`}>
                {order.payment_status}
              </span>
            </div>
            {order.payment_id && (
              <div className="ords-modal-info-row">
                <span className="label">Transaction ID:</span>
                <span className="value small">
                  {order.payment_id.slice(0, 20)}...
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="ords-modal-card">
          <h3>Order Items</h3>
          <div className="ords-modal-items">
            <table className="ords-modal-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => {
                  const itemTotal = item.price;
                  const unitPrice =
                    order.currency === "PKR"
                      ? item.price / (item.quantity * (item.piecesPerUnit || 1))
                      : (item.price /
                          (item.quantity * (item.piecesPerUnit || 1))) *
                        0.0036;
                  return (
                    <tr key={idx}>
                      <td className="ords-product-cell">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="ords-product-thumb"
                          />
                        )}
                        <div>
                          <div className="ords-product-name">{item.name}</div>
                          {item.variant && (
                            <div className="ords-product-variant">
                              {item.variant}
                            </div>
                          )}
                          {item.piecesPerUnit > 1 && (
                            <div className="ords-product-pieces">
                              {item.piecesPerUnit}-piece set
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {item.quantity} × {item.piecesPerUnit || 1} pcs
                      </td>
                      <td>{formatCurrency(unitPrice, order.currency)}</td>
                      <td>{formatCurrency(item.price, order.currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ords-modal-summary">
          <div className="ords-summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal, order.currency)}</span>
          </div>
          <div className="ords-summary-row">
            <span>Shipping</span>
            <span>
              {order.shipping_cost === 0
                ? "Free"
                : formatCurrency(order.shipping_cost, order.currency)}
            </span>
          </div>
          <div className="ords-summary-divider" />
          <div className="ords-summary-row ords-summary-total">
            <span>Total</span>
            <span>{formatCurrency(order.total, order.currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Order Card Component
function OrderCard({
  order,
  onClick,
  onStatusUpdate,
}: {
  order: Order;
  onClick: () => void;
  onStatusUpdate: (
    orderId: string,
    newStatus: Order["status"]
  ) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);

  const handleQuickStatusChange = async (
    e: React.MouseEvent,
    newStatus: Order["status"]
  ) => {
    e.stopPropagation();
    setUpdating(true);
    await onStatusUpdate(order.id, newStatus);
    setUpdating(false);
  };

  const getStatusClass = (status: Order["status"]) => {
    switch (status) {
      case "delivered":
        return "delivered";
      case "cancelled":
        return "cancelled";
      case "pending":
        return "pending";
      case "processing":
        return "processing";
      case "confirmed":
        return "confirmed";
      default:
        return "pending";
    }
  };

  const getPaymentStatusClass = (status: string) => {
    return status === "paid" ? "paid" : "pending";
  };

  return (
    <div className="ords-card" onClick={onClick}>
      <div className="ords-card-header">
        <div className="ords-card-number">
          <span className="ords-card-label">Order</span>
          <span className="ords-card-value">{order.order_number}</span>
        </div>
        <div className={`ords-card-status ${getStatusClass(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </div>
      </div>

      <div className="ords-card-body">
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
            {order.customer_name}
          </div>
          <div className="ords-customer-email">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            {order.customer_email}
          </div>
          <div className="ords-customer-phone">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            {order.customer_phone}
          </div>
        </div>

        <div className="ords-card-items">
          <div className="ords-items-count">
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </div>
          <div className="ords-items-preview">
            {order.items.slice(0, 2).map((item, idx) => (
              <span key={idx} className="ords-item-preview">
                {item.name}
                {item.variant ? ` (${item.variant})` : ""}
              </span>
            ))}
            {order.items.length > 2 && (
              <span className="ords-item-more">
                +{order.items.length - 2} more
              </span>
            )}
          </div>
        </div>

        <div className="ords-card-total">
          <span className="ords-total-label">Total Amount</span>
          <span className="ords-total-value">
            {formatCurrency(order.total, order.currency)}
          </span>
        </div>

        <div className="ords-card-footer">
          <div className="ords-card-date">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(order.created_at).dateOnly}
          </div>
          <div
            className={`ords-card-payment ${getPaymentStatusClass(
              order.payment_status
            )}`}
          >
            {order.payment_method} • {order.payment_status}
          </div>
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
          View Details →
        </button>
      </div>
    </div>
  );
}

// Main Orders Page Component
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [stats, setStats] = useState({ delivered: 0, pending: 0, total: 0 });

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (dateFilter) {
        const startDate = new Date(dateFilter);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateFilter);
        endDate.setHours(23, 59, 59, 999);
        query = query
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const ordersData = (data || []) as Order[];
      setOrders(ordersData);

      // Calculate stats
      const deliveredCount = ordersData.filter(
        (o) => o.status === "delivered"
      ).length;
      const pendingCount = ordersData.filter(
        (o) => o.status !== "delivered" && o.status !== "cancelled"
      ).length;
      setStats({
        delivered: deliveredCount,
        pending: pendingCount,
        total: ordersData.length,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      addToast("error", "Failed to load orders", "Please refresh the page");
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const addToast = useCallback(
    (type: Toast["type"], title: string, msg: string) => {
      const id = Date.now();
      setToasts((p) => [...p, { id, type, title, msg }]);
      setTimeout(() => {
        setToasts((p) =>
          p.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        );
        setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 350);
      }, 3500);
    },
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts((p) => p.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 350);
  }, []);

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      addToast(
        "success",
        "Status Updated",
        `Order status changed to ${newStatus}`
      );
      fetchOrders();

      // Update modal if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      addToast("error", "Update Failed", "Could not update order status");
    }
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Filter by status
    if (filterType === "delivered") {
      filtered = filtered.filter((o) => o.status === "delivered");
    } else if (filterType === "pending") {
      filtered = filtered.filter(
        (o) => o.status !== "delivered" && o.status !== "cancelled"
      );
    }

    // Search by name, email, or order number
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.customer_name.toLowerCase().includes(query) ||
          o.customer_email.toLowerCase().includes(query) ||
          o.order_number.toLowerCase().includes(query) ||
          o.customer_phone.includes(query)
      );
    }

    return filtered;
  }, [orders, filterType, searchQuery]);

  const deliveredOrders = filteredOrders.filter(
    (o) => o.status === "delivered"
  );
  const pendingOrders = filteredOrders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled"
  );

  return (
    <div className="ords-root">
      <div className="ords-ambient" aria-hidden="true" />
      <div className="ords-grain" aria-hidden="true" />

      <div className="ords-content">
        <div className="ords-page-header">
          <p className="ords-eyebrow">
            <span className="ords-ey-line" />
            Order Management
            <span className="ords-ey-line" />
          </p>
          <h1 className="ords-page-title">
            Customer <em>Orders</em>
          </h1>
          <p className="ords-page-sub">
            Track and manage all customer orders from one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="ords-stats-grid">
          <div className="ords-stat-card ords-stat-card--total">
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
            <div className="ords-stat-value">{stats.total}</div>
            <div className="ords-stat-label">Total Orders</div>
          </div>

          <div className="ords-stat-card ords-stat-card--pending">
            <div className="ords-stat-icon">
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
            <div className="ords-stat-value">{stats.pending}</div>
            <div className="ords-stat-label">Pending Orders</div>
          </div>

          <div className="ords-stat-card ords-stat-card--delivered">
            <div className="ords-stat-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <polyline points="20 6 9 17 4 12" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div className="ords-stat-value">{stats.delivered}</div>
            <div className="ords-stat-label">Delivered Orders</div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="ords-filters-section">
          <div className="ords-search-bar">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, order number, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="ords-clear-search"
                onClick={() => setSearchQuery("")}
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
            <button
              className={`ords-filter-btn ${
                filterType === "all" ? "active" : ""
              }`}
              onClick={() => setFilterType("all")}
            >
              All Orders
            </button>
            <button
              className={`ords-filter-btn ${
                filterType === "pending" ? "active" : ""
              }`}
              onClick={() => setFilterType("pending")}
            >
              Pending
            </button>
            <button
              className={`ords-filter-btn ${
                filterType === "delivered" ? "active" : ""
              }`}
              onClick={() => setFilterType("delivered")}
            >
              Delivered
            </button>
          </div>

          <div className="ords-date-filter">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="16" y1="2" x2="16" y2="6" />
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
        </div>

        {/* Loading State */}
        {loading && orders.length === 0 ? (
          <div className="ords-loading">
            <div className="ords-spinner" />
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
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
            <h3>No orders found</h3>
            <p>
              {searchQuery
                ? "Try a different search term"
                : "Orders will appear here once customers place them"}
            </p>
          </div>
        ) : (
          <>
            {/* Pending Orders Section */}
            {filterType !== "delivered" && pendingOrders.length > 0 && (
              <div className="ords-section">
                <div className="ords-section-header">
                  <h2>Pending Orders</h2>
                  <span className="ords-section-count">
                    {pendingOrders.length}
                  </span>
                </div>
                <div className="ords-grid">
                  {pendingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onClick={() => {
                        setSelectedOrder(order);
                        setModalOpen(true);
                      }}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Delivered Orders Section */}
            {filterType !== "pending" && deliveredOrders.length > 0 && (
              <div className="ords-section">
                <div className="ords-section-header">
                  <h2>Delivered Orders</h2>
                  <span className="ords-section-count">
                    {deliveredOrders.length}
                  </span>
                </div>
                <div className="ords-grid">
                  {deliveredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onClick={() => {
                        setSelectedOrder(order);
                        setModalOpen(true);
                      }}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
