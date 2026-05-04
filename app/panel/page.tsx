"use client";

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL PAGE — Module-level cache
// Back/forward pe Supabase call nahi hogi — data instantly dikhega
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase, Product } from "@/lib/supabase";
import "./panel.css";
import PanelNavbar from "../components/PanelNavbar";

// ─── MODULE-LEVEL CACHE ───────────────────────────────────────────────────────
// Yeh Next.js client-side navigation ke baad bhi survive karta hai
// Component unmount/remount hone par bhi data memory mein rehta hai
let _cachedProducts: Product[] | null = null;
let _cachedStats: { users: number; orders: number; contacts: number } | null =
  null;
let _fetchPromise: Promise<void> | null = null;
let _lastFetchTime = 0;
const CACHE_STALE_MS = 60 * 1000; // 1 minute — stale hone ke baad background refresh
// ─────────────────────────────────────────────────────────────────────────────

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
type Toast = {
  id: number;
  type: "success" | "error" | "info";
  title: string;
  msg: string;
  exiting?: boolean;
};

type CategoryGroup = {
  category: string;
  subcategories: {
    name: string;
    products: Product[];
  }[];
};

type CategoryStats = {
  category: string;
  totalProducts: number;
  subcategoryStats: {
    name: string;
    count: number;
  }[];
};

/* ═══════════════════════════════════════════
   TOAST CONTAINER
═══════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════
   DELETE CONFIRM MODAL
═══════════════════════════════════════════ */
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
          Are you sure you want to delete{" "}
          <strong>&quot;{productName}&quot;</strong>?
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

/* ═══════════════════════════════════════════
   CATEGORY STATS CARD
═══════════════════════════════════════════ */
function CategoryStatsCard({ stats }: { stats: CategoryStats[] }) {
  return (
    <div className="p-category-stats-grid">
      {stats.map((catStat) => (
        <div key={catStat.category} className="p-category-stats-card">
          <div className="p-category-stats-header">
            <h4 className="p-category-stats-title">{catStat.category}</h4>
            <span className="p-category-stats-total">
              {catStat.totalProducts} products
            </span>
          </div>
          <div className="p-category-stats-subcategories">
            {catStat.subcategoryStats.map((subStat) => (
              <div key={subStat.name} className="p-subcategory-stats-item">
                <span className="p-subcategory-stats-name">{subStat.name}</span>
                <span className="p-subcategory-stats-count">
                  {subStat.count} item{subStat.count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   CATEGORY SECTION
═══════════════════════════════════════════ */
function CategorySection({
  category,
  subcategories,
  onDelete,
}: {
  category: string;
  subcategories: { name: string; products: Product[] }[];
  onDelete: (id: string, name: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const totalProducts = subcategories.reduce(
    (sum, sub) => sum + sub.products.length,
    0
  );

  if (totalProducts === 0) return null;

  return (
    <div className="p-category-section">
      <div
        className="p-category-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-category-header-left">
          <span className="p-category-expand">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
          <h3 className="p-category-title">{category}</h3>
          <span className="p-category-count">{totalProducts} products</span>
        </div>
      </div>

      {isExpanded && (
        <div className="p-subcategories-container">
          {subcategories.map((sub) => (
            <div key={sub.name} className="p-subcategory-block">
              <div className="p-subcategory-header">
                <h4 className="p-subcategory-title">{sub.name}</h4>
                <span className="p-subcategory-count">
                  {sub.products.length} item
                  {sub.products.length !== 1 ? "s" : ""}
                </span>
              </div>
              {sub.products.length === 0 ? (
                <div className="p-subcategory-empty">
                  No products in this subcategory
                </div>
              ) : (
                <div className="p-subcategory-products">
                  {sub.products.map((product) => (
                    <div key={product.id} className="p-product-card">
                      <div className="p-product-info">
                        <div className="p-product-name">{product.name}</div>
                        {product.brand && (
                          <div className="p-product-brand">{product.brand}</div>
                        )}
                        <div className="p-product-meta">
                          <span
                            className={`p-product-status ${
                              !product.is_active ? "inactive" : ""
                            }`}
                          >
                            <span className="p-status-dot" />
                            {product.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="p-product-actions">
                        <button
                          className="p-product-edit"
                          title="Edit Product"
                          onClick={() =>
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
                          className="p-product-delete"
                          title="Delete Product"
                          onClick={() =>
                            product.id && onDelete(product.id, product.name)
                          }
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PANEL PAGE
═══════════════════════════════════════════ */
export default function Panel() {
  // ── Sync-init from cache — instant render agar already cached hai ──
  const [products, setProducts] = useState<Product[]>(
    () => _cachedProducts ?? []
  );
  const [productsLoading, setProductsLoading] = useState(
    () => _cachedProducts === null
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
  }>({ isOpen: false, productId: "", productName: "" });
  const [stats, setStats] = useState(
    () => _cachedStats ?? { users: 0, orders: 0, contacts: 0 }
  );
  const [searchTerm, setSearchTerm] = useState("");

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

  // ── Core fetch — products + stats ek hi baar mein ──
  const fetchData = useCallback(
    async (silent = false) => {
      // Agar pehle se fetch chal rahi hai toh ussi ka wait karo
      if (_fetchPromise) {
        await _fetchPromise;
        if (_cachedProducts) setProducts(_cachedProducts);
        if (_cachedStats) setStats(_cachedStats);
        setProductsLoading(false);
        return;
      }

      if (!silent) setProductsLoading(true);

      _fetchPromise = (async () => {
        try {
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

          if (productsRes.data && !productsRes.error) {
            const mapped = productsRes.data.map((p: any) => ({
              ...p,
              price: p.price ?? 0,
              stock: p.stock ?? 0,
              subcategory: p.subcategory ?? "Uncategorized",
              is_active: p.is_active ?? true,
            })) as Product[];

            _cachedProducts = mapped;
            _lastFetchTime = Date.now();
            setProducts(mapped);
          } else if (productsRes.error) {
            console.error("Products fetch error:", productsRes.error);
            if (!silent)
              addToast("error", "Load Failed", "Could not fetch products");
          }

          const newStats = {
            users: usersRes.count || 0,
            orders: ordersRes.count || 0,
            contacts: contactsRes.count || 0,
          };
          _cachedStats = newStats;
          setStats(newStats);
        } catch (err) {
          console.error("Fetch error:", err);
          if (!silent) addToast("error", "Load Failed", "Could not fetch data");
        } finally {
          _fetchPromise = null;
          setProductsLoading(false);
        }
      })();

      await _fetchPromise;
    },
    [addToast]
  );

  // ── Main fetch effect ──
  useEffect(() => {
    if (_cachedProducts !== null && _cachedStats !== null) {
      // Cache available — instantly set karo
      setProducts(_cachedProducts);
      setStats(_cachedStats);
      setProductsLoading(false);

      // Stale check — agar 1 minute se zyada purana hai toh background refresh
      const isStale = Date.now() - _lastFetchTime > CACHE_STALE_MS;
      if (isStale) {
        fetchData(true); // silent=true — loader nahi dikhega
      }
      return;
    }

    // Cache nahi — fresh fetch karo
    fetchData(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Realtime subscription — live updates ──
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

          setProducts((prev) => {
            const updated = [newProduct, ...prev];
            _cachedProducts = updated;
            return updated;
          });

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

          setProducts((prev) => {
            const newList = prev.map((p) =>
              p.id === updated.id ? updated : p
            );
            _cachedProducts = newList;
            return newList;
          });

          addToast("info", "Product Updated", `${updated.name} updated!`);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "products" },
        (payload) => {
          setProducts((prev) => {
            const newList = prev.filter((p) => p.id !== payload.old.id);
            _cachedProducts = newList;
            return newList;
          });

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

  // ── Delete handlers ──
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
      setProducts((p) => {
        const newList = p.filter((x) => x.id !== productId);
        _cachedProducts = newList;
        return newList;
      });
      addToast("success", "Deleted", `${productName} removed from store`);
    }
  };

  // ── Group products by category ──
  const groupProductsByCategory = useCallback((): CategoryGroup[] => {
    let filteredProducts = products;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredProducts = products.filter((p) => {
        const matchName = p.name?.toLowerCase().includes(term) || false;
        const matchBrand = p.brand?.toLowerCase().includes(term) || false;
        const matchCategory = p.category?.toLowerCase().includes(term) || false;
        const matchSubcategory =
          p.subcategory?.toLowerCase().includes(term) || false;
        return matchName || matchBrand || matchCategory || matchSubcategory;
      });
    }

    const groups: {
      [category: string]: { [subcategory: string]: Product[] };
    } = {};

    filteredProducts.forEach((product) => {
      const category = product.category || "Uncategorized";
      const subcategory = product.subcategory || "Uncategorized";
      if (!groups[category]) groups[category] = {};
      if (!groups[category][subcategory]) groups[category][subcategory] = [];
      groups[category][subcategory].push(product);
    });

    const result: CategoryGroup[] = Object.entries(groups).map(
      ([category, subcats]) => ({
        category,
        subcategories: Object.entries(subcats)
          .map(([name, products]) => ({ name, products }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      })
    );

    return result.sort((a, b) => a.category.localeCompare(b.category));
  }, [products, searchTerm]);

  // ── Category stats ──
  const getCategoryStats = useCallback((): CategoryStats[] => {
    const statsMap: {
      [category: string]: { [subcategory: string]: number };
    } = {};

    products.forEach((product) => {
      const category = product.category || "Uncategorized";
      const subcategory = product.subcategory || "Uncategorized";
      if (!statsMap[category]) statsMap[category] = {};
      if (!statsMap[category][subcategory]) statsMap[category][subcategory] = 0;
      statsMap[category][subcategory]++;
    });

    return Object.entries(statsMap)
      .map(([category, subcats]) => ({
        category,
        totalProducts: Object.values(subcats).reduce(
          (sum, count) => sum + count,
          0
        ),
        subcategoryStats: Object.entries(subcats)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [products]);

  const categoryGroups = groupProductsByCategory();
  const categoryStats = getCategoryStats();
  const totalProducts = products.length;
  const filteredCount = categoryGroups.reduce(
    (sum, group) =>
      sum + group.subcategories.reduce((s, sub) => s + sub.products.length, 0),
    0
  );

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
        {/* ── Page Header ── */}
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

        {/* ── Stats Grid ── */}
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

        {/* ── Category Stats ── */}
        {categoryStats.length > 0 && (
          <div className="p-category-stats-wrapper">
            <div className="p-section-header">
              <h2 className="p-section-title">
                <span className="p-section-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </span>
                Category & Subcategory Breakdown
              </h2>
              <p className="p-section-subtitle">
                Total products distributed across {categoryStats.length}{" "}
                categories
              </p>
            </div>
            <CategoryStatsCard stats={categoryStats} />
          </div>
        )}

        {/* ── Search ── */}
        <div className="p-search-section">
          <div className="p-search-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="p-search-icon"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="p-search-input"
              placeholder="Search by product name, brand, category, or subcategory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="p-search-clear"
                onClick={() => setSearchTerm("")}
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
          {searchTerm && (
            <div className="p-search-results-info">
              Found {filteredCount} product{filteredCount !== 1 ? "s" : ""}{" "}
              matching &quot;{searchTerm}&quot;
            </div>
          )}
        </div>

        {/* ── Add Product Button ── */}
        <div className="p-add-product-section">
          <Link href="/panel/add-product" className="p-add-product-btn">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v8M8 12h8" strokeLinecap="round" />
            </svg>
            Add New Product
          </Link>
        </div>

        {/* ── Products List Header ── */}
        <div className="p-products-list-header">
          <h2 className="p-section-title">
            <span className="p-section-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                <path d="M16 3H8l-2 4h12l-2-4z" />
              </svg>
            </span>
            Products by Category
          </h2>
          <p className="p-section-subtitle">
            Browse and manage products organized by category and subcategory
          </p>
        </div>

        {/* ── Products Content ── */}
        {productsLoading && products.length === 0 ? (
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
            <p className="p-empty-title">Loading products...</p>
          </div>
        ) : categoryGroups.length === 0 ? (
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
            <p className="p-empty-title">
              {searchTerm ? "No products found" : "No products yet"}
            </p>
            <p className="p-empty-sub">
              {searchTerm
                ? "Try a different search term"
                : "Add your first product to get started"}
            </p>
          </div>
        ) : (
          <div className="p-categories-container">
            {categoryGroups.map((group) => (
              <CategorySection
                key={group.category}
                category={group.category}
                subcategories={group.subcategories}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Delete Modal ── */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, productId: "", productName: "" })
        }
        onConfirm={handleDeleteConfirm}
        productName={deleteModal.productName}
      />

      {/* ── Toasts ── */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
