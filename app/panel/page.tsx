"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, Product } from "@/lib/supabase";
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

function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  productName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="p-modal-overlay" onClick={onClose}>
      <div className="p-modal" onClick={(e) => e.stopPropagation()}>
        <button className="p-modal-close" onClick={onClose}>
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
        <div className="p-modal-icon">
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
        </div>
        <h3 className="p-modal-title">Delete Product</h3>
        <p className="p-modal-text">
          Are you sure you want to delete <strong>"{productName}"</strong>?
          <br />
          This action cannot be undone.
        </p>
        <div className="p-modal-actions">
          <button className="p-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="p-modal-confirm" onClick={onConfirm}>
            Delete Product
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <tr>
      <td className="p-td-name">{product.name || "Unnamed"}</td>
      <td>
        <span className="p-td-category">
          {product.subcategory || "Uncategorized"}
        </span>
      </td>
      <td>
        <span className="p-td-status">
          <span
            className={`p-td-status-dot p-td-status-dot--${
              product.is_active ? "active" : "inactive"
            }`}
          />
          {product.is_active ? "Active" : "Inactive"}
        </span>
      </td>
      <td>
        <div className="p-td-actions">
          <button
            className="p-td-btn"
            title="Edit"
            onClick={() =>
              product.id &&
              (window.location.href = `/panel/edit-product/${product.id}`)
            }
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
          </button>
          <button
            className="p-td-btn"
            title="Delete"
            onClick={() => product.id && onDelete(product.id, product.name)}
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
  );
}

export default function Panel() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
  }>({ isOpen: false, productId: "", productName: "" });
  const [stats, setStats] = useState({ users: 0, orders: 0, contacts: 0 });

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

  // Fetch data - layout already verified auth
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        console.log("📦 Panel - Fetching data...");

        const [productsRes, usersRes, ordersRes, contactsRes] =
          await Promise.all([
            supabase
              .from("products")
              .select("*")
              .order("created_at", { ascending: false }),
            supabase
              .from("profiles")
              .select("*", { count: "exact", head: true }),
            supabase
              .from("cart_items")
              .select("*", { count: "exact", head: true }),
            supabase
              .from("contacts")
              .select("*", { count: "exact", head: true }),
          ]);

        if (!isMounted) return;

        if (productsRes.data && !productsRes.error) {
          setProducts(
            productsRes.data.map((p: any) => ({
              ...p,
              price: p.price ?? 0,
              stock: p.stock ?? 0,
              subcategory: p.subcategory ?? "Uncategorized",
              is_active: p.is_active ?? true,
            }))
          );
        } else if (productsRes.error) {
          console.error("Products fetch error:", productsRes.error);
        }

        if (!usersRes.error)
          setStats((s) => ({ ...s, users: usersRes.count || 0 }));
        if (!ordersRes.error)
          setStats((s) => ({ ...s, orders: ordersRes.count || 0 }));
        if (!contactsRes.error)
          setStats((s) => ({ ...s, contacts: contactsRes.count || 0 }));

        console.log("✅ Panel - Data fetched successfully");
      } catch (err) {
        console.error("Panel fetch error:", err);
        if (isMounted) addToast("error", "Load Failed", "Could not fetch data");
      } finally {
        if (isMounted) setProductsLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [addToast]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("panel-products-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "products" },
        (payload) => {
          const newProduct = {
            ...payload.new,
            price: payload.new.price ?? 0,
            stock: payload.new.stock ?? 0,
            subcategory: payload.new.subcategory ?? "Uncategorized",
            is_active: payload.new.is_active ?? true,
          } as Product;
          setProducts((prev) => [newProduct, ...prev]);
          addToast(
            "success",
            "Product Added",
            `${newProduct.name} added to store!`
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (payload) => {
          const updated = {
            ...payload.new,
            price: payload.new.price ?? 0,
            stock: payload.new.stock ?? 0,
            subcategory: payload.new.subcategory ?? "Uncategorized",
            is_active: payload.new.is_active ?? true,
          } as Product;
          setProducts((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
          addToast("info", "Product Updated", `${updated.name} updated!`);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "products" },
        (payload) => {
          setProducts((prev) => prev.filter((p) => p.id !== payload.old.id));
          addToast(
            "info",
            "Product Deleted",
            "A product was removed from store"
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addToast]);

  const totalProducts = products.length;

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, productId: id, productName: name });
  };

  const handleDeleteConfirm = async () => {
    const { productId, productName } = deleteModal;
    setDeleteModal({ isOpen: false, productId: "", productName: "" });

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      addToast("error", "Delete Failed", error.message);
    } else {
      setProducts((p) => p.filter((x) => x.id !== productId));
      addToast("success", "Deleted", `${productName} removed from store`);
    }
  };

  return (
    <div className="p-root">
      <div className="p-ambient" aria-hidden="true" />
      <div className="p-grain" aria-hidden="true" />

      <PanelNavbar
        productCount={totalProducts}
        contactCount={stats.contacts}
        cartCount={stats.orders}
        signupCount={stats.users}
      />

      <div className="p-content">
        <div className="p-page-header">
          <p className="p-eyebrow">
            <span className="p-ey-line" />
            Admin Dashboard
            <span className="p-ey-line" />
          </p>
          <h1 className="p-page-title">
            Welcome to <em>TECH4U</em> Panel
          </h1>
          <p className="p-page-sub">Manage your store, products from here.</p>
        </div>

        <div className="p-stats-grid">
          <div className="p-stat-card">
            <div className="p-stat-icon">
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
            <div className="p-stat-value">{totalProducts}</div>
            <div className="p-stat-label">Total Products</div>
            <div className="p-stat-line" />
          </div>
        </div>

        <div className="p-table-wrap">
          <div className="p-table-header">
            <div className="p-table-header-left">
              <h3 className="p-table-title">Recent Products</h3>
              <p className="p-table-sub">
                Latest {totalProducts} items in your store
              </p>
            </div>
            <a
              href="/panel/add-product"
              className="p-table-action-btn"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/panel/add-product";
              }}
            >
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
            </a>
          </div>

          {productsLoading ? (
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
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    onEdit={() => {}}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, productId: "", productName: "" })
        }
        onConfirm={handleDeleteConfirm}
        productName={deleteModal.productName}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <style jsx>{`
        .p-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .p-modal {
          background: #ffffff;
          border-radius: 20px;
          width: 90%;
          max-width: 420px;
          padding: 2rem;
          position: relative;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.25s ease;
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .p-modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: transparent;
          border: 1px solid rgba(218, 165, 32, 0.2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          transition: all 0.2s ease;
        }
        .p-modal-close:hover {
          border-color: #daa520;
          color: #daa520;
          transform: rotate(90deg);
        }
        .p-modal-close svg {
          width: 14px;
          height: 14px;
        }
        .p-modal-icon {
          width: 56px;
          height: 56px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          color: #ef4444;
        }
        .p-modal-icon svg {
          width: 28px;
          height: 28px;
        }
        .p-modal-title {
          font-family: var(--p-serif);
          font-size: 1.4rem;
          font-weight: 500;
          text-align: center;
          color: #1a1a1a;
          margin: 0 0 0.5rem;
        }
        .p-modal-text {
          font-family: var(--p-sans);
          font-size: 0.75rem;
          color: #666;
          text-align: center;
          margin: 0 0 1.5rem;
          line-height: 1.6;
        }
        .p-modal-text strong {
          color: #1a1a1a;
        }
        .p-modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        .p-modal-cancel {
          padding: 0.6rem 1.5rem;
          background: transparent;
          border: 1px solid rgba(218, 165, 32, 0.3);
          border-radius: 40px;
          font-family: var(--p-sans);
          font-size: 0.6rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #666;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .p-modal-cancel:hover {
          border-color: #daa520;
          color: #8b6914;
        }
        .p-modal-confirm {
          padding: 0.6rem 1.5rem;
          background: #ef4444;
          border: none;
          border-radius: 40px;
          font-family: var(--p-sans);
          font-size: 0.6rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .p-modal-confirm:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
