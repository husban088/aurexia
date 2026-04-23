"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, Product } from "@/lib/supabase";
import { isOwner } from "@/lib/checkOwner"; // ✅ isOwner import fix
import "./panel.css";
import PanelNavbar from "../components/PanelNavbar";

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  title: string;
  msg: string;
  exiting?: boolean;
};

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: number) => void;
}) {
  return (
    <div className="p-toast-wrap">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`p-toast p-toast--${t.type}${t.exiting ? " exiting" : ""}`}
        >
          <div className="p-toast-icon">
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
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <div className="p-toast-body">
            <p className="p-toast-title">{t.title}</p>
            <p className="p-toast-msg">{t.msg}</p>
          </div>
          <button className="p-toast-close" onClick={() => onRemove(t.id)}>
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

const quickActions = [
  {
    href: "/panel/add-product",
    name: "Add Product",
    desc: "Add new item to store",
    primary: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/panel/products",
    name: "All Products",
    desc: "View & manage inventory",
    primary: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path d="M16 3H8l-2 4h12l-2-4z" />
      </svg>
    ),
  },
  {
    href: "/panel/users",
    name: "Users",
    desc: "Signups & accounts",
    primary: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: "/panel/orders",
    name: "Cart Orders",
    desc: "View pending orders",
    primary: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    href: "/panel/contacts",
    name: "Contacts",
    desc: "Messages from visitors",
    primary: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: "/panel/settings",
    name: "Settings",
    desc: "Store configuration",
    primary: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function Panel() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [stats, setStats] = useState({
    products: 0,
    users: 0,
    orders: 0,
    contacts: 0,
  });

  const addToast = (type: Toast["type"], title: string, msg: string) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, title, msg }]);
    setTimeout(() => {
      setToasts((p) =>
        p.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 350);
    }, 3500);
  };

  const removeToast = (id: number) => {
    setToasts((p) => p.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 350);
  };

  // ✅ AUTH CHECK — getUser() use karo, getSession() nahi
  // getSession() localStorage se padhta hai — SSR/cookie-based setup mein fail hota hai
  // getUser() Supabase server se directly verify karta hai — reliable hai
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/signin");
        return;
      }

      if (!isOwner(user.email)) {
        router.push("/");
        return;
      }

      setAuthorized(true);
      setChecking(false);
    };

    checkAuth();
  }, [router]);

  // ✅ Data load — auth check ke baad hi chale
  useEffect(() => {
    if (!authorized) return;

    async function loadData() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;
        setProducts(data || []);
        setStats((s) => ({ ...s, products: data?.length || 0 }));
        addToast(
          "success",
          "Panel Loaded",
          "Dashboard data fetched successfully"
        );
      } catch {
        addToast(
          "error",
          "Load Failed",
          "Could not fetch products from database"
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authorized]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      addToast("error", "Delete Failed", error.message);
    } else {
      setProducts((p) => p.filter((x) => x.id !== id));
      addToast("success", "Deleted", "Product removed from store");
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-300 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="p-root">
      <div className="p-ambient" aria-hidden="true" />
      <div className="p-grain" aria-hidden="true" />

      <PanelNavbar
        productCount={stats.products}
        contactCount={stats.contacts}
      />

      <div className="p-content">
        {/* Header */}
        <div className="p-page-header">
          <p className="p-eyebrow">
            <span className="p-ey-line" />
            Admin Dashboard
            <span className="p-ey-line" />
          </p>
          <h1 className="p-page-title">
            Welcome to <em>Aurexia</em> Panel
          </h1>
          <p className="p-page-sub">
            Manage your store, products, users and orders from here.
          </p>
        </div>

        {/* Stats */}
        <div className="p-stats-grid">
          {[
            {
              label: "Total Products",
              value: stats.products,
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                  <path d="M16 3H8l-2 4h12l-2-4z" />
                </svg>
              ),
            },
            {
              label: "Members",
              value: stats.users,
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              ),
            },
            {
              label: "Cart Orders",
              value: stats.orders,
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
              ),
            },
            {
              label: "Contacts",
              value: stats.contacts,
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              ),
            },
          ].map((s) => (
            <div key={s.label} className="p-stat-card">
              <div className="p-stat-icon">{s.icon}</div>
              <div className="p-stat-value">{s.value}</div>
              <div className="p-stat-label">{s.label}</div>
              <div className="p-stat-line" />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <p className="p-section-title">
          Quick <em>Actions</em>
        </p>
        <div className="p-actions-grid">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`p-action-card${
                a.primary ? " p-action-card--primary" : ""
              }`}
            >
              <div className="p-action-icon">{a.icon}</div>
              <div className="p-action-info">
                <p className="p-action-name">{a.name}</p>
                <p className="p-action-desc">{a.desc}</p>
              </div>
              <div className="p-action-arrow">
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
              </div>
            </Link>
          ))}
        </div>

        {/* Recent products table */}
        <div className="p-table-wrap">
          <div className="p-table-header">
            <div className="p-table-header-left">
              <h3 className="p-table-title">Recent Products</h3>
              <p className="p-table-sub">
                Latest {products.length} items in your store
              </p>
            </div>
            <Link href="/panel/add-product" className="p-table-action-btn">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v8M8 12h8" strokeLinecap="round" />
              </svg>
              Add New
            </Link>
          </div>

          {loading ? (
            <div className="p-empty">
              <div className="p-empty-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                </svg>
              </div>
              <p className="p-empty-title">Loading products…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-empty">
              <div className="p-empty-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                  <path d="M16 3H8l-2 4h12l-2-4z" />
                </svg>
              </div>
              <p className="p-empty-title">No products yet</p>
              <p className="p-empty-sub">
                Add your first product to get started
              </p>
            </div>
          ) : (
            <table className="p-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-td-name">{p.name}</td>
                    <td>
                      <span className="p-td-category">{p.subcategory}</span>
                    </td>
                    <td className="p-td-price">
                      PKR {p.price.toLocaleString()}
                    </td>
                    <td>{p.stock}</td>
                    <td>
                      <span className="p-td-status">
                        <span
                          className={`p-td-status-dot p-td-status-dot--${
                            p.is_active ? "active" : "inactive"
                          }`}
                        />
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="p-td-actions">
                        <Link
                          href={`/panel/edit-product/${p.id}`}
                          className="p-td-btn"
                          title="Edit"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Link>
                        <button
                          className="p-td-btn"
                          title="Delete"
                          onClick={() => p.id && handleDelete(p.id)}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
