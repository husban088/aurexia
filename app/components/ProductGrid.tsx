"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/cartStore";
import "@/app/styles/product-grid.css";
import { useCurrency } from "../context/CurrencyContext";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  subcategory: string;
  images: string[];
  stock: number;
  brand?: string;
  condition: string;
  is_featured: boolean;
  is_active: boolean;
  specs: Record<string, string>;
  created_at: string;
  low_stock_threshold?: number | null;
  stockStatus?: "in_stock" | "out_of_stock" | "low_stock";
  variantId?: string;
}

interface ProductGridProps {
  category: string;
  subcategory?: string;
  limit?: number;
  featured?: boolean;
  onQuickView?: (productId: string) => void;
}

const getStockStatus = (
  stock: number,
  threshold?: number | null
): "in_stock" | "out_of_stock" | "low_stock" => {
  if (stock === 0) return "out_of_stock";
  if (stock >= 999999) return "in_stock";
  if (threshold && threshold > 0 && stock <= threshold) return "low_stock";
  return "in_stock";
};

const getStockLabel = (
  status: "in_stock" | "out_of_stock" | "low_stock",
  stock: number
) => {
  if (status === "out_of_stock") return "Out of stock";
  if (status === "low_stock") return `Only ${stock} left`;
  return "In stock";
};

const getStockClass = (status: "in_stock" | "out_of_stock" | "low_stock") => {
  if (status === "out_of_stock") return "out";
  if (status === "low_stock") return "low";
  return "";
};

// FAST fetch function with join query for instant data
async function fetchProductsFast(
  category: string,
  subcategory?: string,
  limit?: number,
  featured?: boolean
) {
  let query = supabase
    .from("products")
    .select("*, product_variants(*, variant_images(*))")
    .eq("is_active", true)
    .eq("category", category);

  if (subcategory) query = query.eq("subcategory", subcategory);
  if (featured) query = query.eq("is_featured", true);
  query = query.order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error || !data) return [];

  const typePriority: Record<string, number> = {
    standard: 0,
    color: 1,
    size: 2,
    material: 3,
    capacity: 4,
  };

  return data.map((item: any) => {
    const variants = item.product_variants || [];
    const sortedVariants = [...variants].sort(
      (a, b) =>
        (typePriority[a.attribute_type] || 5) -
        (typePriority[b.attribute_type] || 5)
    );
    const bestVariant = sortedVariants[0];

    let variantImages: string[] = [];
    if (bestVariant?.variant_images) {
      variantImages = bestVariant.variant_images
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((img: any) => img.image_url);
    }

    const stock = bestVariant?.stock ?? item.stock ?? 0;
    const lowStockThreshold =
      bestVariant?.low_stock_threshold ?? item.low_stock_threshold ?? null;
    const stockStatus = getStockStatus(stock, lowStockThreshold);

    return {
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: bestVariant?.price ?? item.price ?? 0,
      original_price:
        bestVariant?.original_price ?? item.original_price ?? undefined,
      category: item.category,
      subcategory: item.subcategory,
      images: variantImages.length > 0 ? variantImages : item.images || [],
      stock,
      brand: item.brand || undefined,
      condition: item.condition || "new",
      is_featured: item.is_featured || false,
      is_active: item.is_active ?? true,
      specs: item.specs || {},
      created_at: item.created_at || new Date().toISOString(),
      low_stock_threshold: lowStockThreshold,
      stockStatus,
      variantId: bestVariant?.id,
    };
  });
}

export default function ProductGrid({
  category,
  subcategory,
  limit,
  featured = false,
  onQuickView,
}: ProductGridProps) {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  // Track which product button is loading — only that button spins
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const { formatPrice } = useCurrency();
  const { addToCart } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // LOAD DATA INSTANTLY - No skeleton delay
  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setLoading(true);
      const data = await fetchProductsFast(
        category,
        subcategory,
        limit,
        featured
      );
      if (isMounted) {
        setProducts(data);
        setLoading(false);
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [category, subcategory, limit, featured]);

  const filteredAndSorted = useMemo(() => {
    let filtered = [...products];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.brand && p.brand.toLowerCase().includes(s)) ||
          p.subcategory.toLowerCase().includes(s)
      );
    }
    switch (sort) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "featured":
        filtered.sort(
          (a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
        );
        break;
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return filtered;
  }, [products, search, sort]);

  const calculateDiscount = useCallback((product: Product) => {
    if (product.original_price && product.original_price > product.price) {
      return Math.round(
        ((product.original_price - product.price) / product.original_price) *
          100
      );
    }
    return 0;
  }, []);

  const handleQuickViewClick = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(productId);
  };

  // ✅ FIXED: Instant add to cart — no page reload, no stuck loading
  const handleAddToCartClick = async (
    e: React.MouseEvent<HTMLButtonElement>,
    product: Product
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Agar pehle se loading hai toh ignore karo
    if (loadingProductId) return;

    const stockStatus =
      product.stockStatus ||
      getStockStatus(product.stock, product.low_stock_threshold);
    if (stockStatus === "out_of_stock") {
      alert("This product is out of stock");
      return;
    }

    setLoadingProductId(product.id);

    const variantObj = product.variantId
      ? {
          id: product.variantId,
          product_id: product.id,
          attribute_type: "standard" as const,
          attribute_value: "Standard",
          price: product.price,
          original_price: product.original_price,
          stock: product.stock,
          low_stock_threshold: product.low_stock_threshold ?? undefined,
          is_active: true,
        }
      : null;

    try {
      await addToCart(
        {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          original_price: product.original_price,
          category: product.category,
          subcategory: product.subcategory,
          images: product.images,
          stock: product.stock,
          brand: product.brand,
          condition: product.condition,
          is_featured: product.is_featured,
          is_active: product.is_active,
          ...(product.low_stock_threshold != null && {
            low_stock_threshold: product.low_stock_threshold,
          }),
          created_at: product.created_at,
          updated_at: new Date().toISOString(),
        },
        variantObj,
        1,
        1
      );
    } finally {
      // Loading hamesha clear ho — chahe success ho ya error
      setLoadingProductId(null);
    }
  };

  // Show loading only on first load
  if (!mounted || (loading && products.length === 0)) {
    return (
      <div className="pg-skeleton-grid">
        {[...Array(limit || 8)].map((_, i) => (
          <div key={i} className="pg-skeleton-card">
            <div className="pg-skeleton-img" />
            <div className="pg-skeleton-body">
              <div className="pg-skeleton-line" style={{ width: "40%" }} />
              <div className="pg-skeleton-line" style={{ width: "80%" }} />
              <div className="pg-skeleton-line" style={{ width: "55%" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredAndSorted.length === 0) {
    return (
      <div className="pg-empty">
        <div className="pg-empty-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <p className="pg-empty-title">No products found</p>
        <p className="pg-empty-sub">
          {search
            ? `No results for "${search}"`
            : "Check back soon for new arrivals"}
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {!limit && (
        <div className="pg-toolbar">
          <div className="pg-search-wrap">
            <svg
              className="pg-search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="pg-search"
              placeholder={`Search ${subcategory || category}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="pg-sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="featured">Featured First</option>
          </select>
          <span className="pg-count">
            <em>{filteredAndSorted.length}</em>{" "}
            {filteredAndSorted.length === 1 ? "item" : "items"}
          </span>
        </div>
      )}
      <div className="pg-grid">
        {filteredAndSorted.map((product) => {
          const discount = calculateDiscount(product);
          const stockStatus =
            product.stockStatus ||
            getStockStatus(product.stock, product.low_stock_threshold);
          const stockLabel = getStockLabel(stockStatus, product.stock);
          const stockClass = getStockClass(stockStatus);
          const isOutOfStock = stockStatus === "out_of_stock";
          const isLowStock = stockStatus === "low_stock";

          return (
            <div
              key={product.id}
              onClick={() => {
                window.location.href = `/product/${product.id}`;
              }}
              className="pg-card"
              style={{ cursor: "pointer" }}
            >
              <div className="pg-card-img">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 280px"
                    style={{ objectFit: "cover" }}
                    priority
                  />
                ) : (
                  <div className="pg-card-placeholder">
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
                  </div>
                )}
                <div className="pg-card-badges">
                  <span className="pg-badge pg-badge--cat">
                    {product.subcategory}
                  </span>
                  {product.is_featured && (
                    <span className="pg-badge pg-badge--feat">Featured</span>
                  )}
                  {discount > 0 && (
                    <span className="pg-badge pg-badge--sale">
                      -{discount}%
                    </span>
                  )}
                  {product.condition === "new" && !discount && (
                    <span className="pg-badge pg-badge--new">New</span>
                  )}
                  {isLowStock && (
                    <span className="pg-badge pg-badge--low">Low Stock</span>
                  )}
                </div>
                <div className="pg-icon-buttons">
                  <button
                    className="pg-icon-btn pg-icon-btn--view"
                    aria-label="Quick View"
                    onClick={(e) => handleQuickViewClick(e, product.id)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z" />
                    </svg>
                  </button>
                  <button
                    className="pg-icon-btn pg-icon-btn--cart"
                    onClick={(e) => handleAddToCartClick(e, product)}
                    disabled={isOutOfStock || loadingProductId === product.id}
                    aria-label="Add to Cart"
                  >
                    {loadingProductId === product.id ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        style={{
                          animation: "spin 0.8s linear infinite",
                        }}
                      >
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    ) : (
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
                    )}
                  </button>
                </div>
              </div>
              <div className="pg-card-body">
                {product.brand && (
                  <p className="pg-card-brand">{product.brand}</p>
                )}
                <h3 className="pg-card-name">{product.name}</h3>
                <div className="pg-card-price-row">
                  <span className="pg-card-price">
                    {formatPrice(product.price)}
                  </span>
                  {product.original_price &&
                    product.original_price > product.price && (
                      <span className="pg-card-orig">
                        {formatPrice(product.original_price)}
                      </span>
                    )}
                  {discount > 0 && (
                    <span className="pg-card-discount">-{discount}% OFF</span>
                  )}
                </div>
              </div>
              <div className="pg-card-foot">
                <span className={`pg-card-stock ${stockClass}`}>
                  {stockLabel}
                </span>
              </div>
              <div className="pg-card-line" />
            </div>
          );
        })}
      </div>
    </>
  );
}
