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

export default function ProductGrid({
  category,
  subcategory,
  limit,
  featured = false,
  onQuickView,
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const { formatPrice } = useCurrency();
  const { addToCart } = useCartStore();

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);

      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("category", category);

      if (subcategory) {
        query = query.eq("subcategory", subcategory);
      }

      if (featured) {
        query = query.eq("is_featured", true);
      }

      query = query.order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (!cancelled) {
        if (error) {
          console.error("ProductGrid error:", error);
          setProducts([]);
          setLoading(false);
          return;
        }

        const productIds = (data || []).map((item: any) => item.id);

        if (productIds.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        const { data: variantsData } = await supabase
          .from("product_variants")
          .select("*")
          .in("product_id", productIds)
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        const variantMap: Record<string, any> = {};
        if (variantsData) {
          const typePriority: Record<string, number> = {
            standard: 0,
            color: 1,
            size: 2,
            material: 3,
            capacity: 4,
          };
          variantsData.forEach((variant: any) => {
            const existing = variantMap[variant.product_id];
            if (!existing) {
              variantMap[variant.product_id] = variant;
            } else {
              const existingPriority =
                typePriority[existing.attribute_type] ?? 9;
              const newPriority = typePriority[variant.attribute_type] ?? 9;
              if (newPriority < existingPriority) {
                variantMap[variant.product_id] = variant;
              }
            }
          });
        }

        const variantIds = Object.values(variantMap).map((v: any) => v.id);
        const variantImagesMap: Record<string, string[]> = {};

        if (variantIds.length > 0) {
          const { data: imagesData } = await supabase
            .from("variant_images")
            .select("variant_id, image_url, display_order")
            .in("variant_id", variantIds)
            .order("display_order", { ascending: true });

          if (imagesData) {
            imagesData.forEach((img: any) => {
              if (!variantImagesMap[img.variant_id]) {
                variantImagesMap[img.variant_id] = [];
              }
              variantImagesMap[img.variant_id].push(img.image_url);
            });
          }
        }

        const formattedData: Product[] = (data || []).map((item: any) => {
          const variant = variantMap[item.id];
          const stock = variant?.stock ?? item.stock ?? 0;
          const lowStockThreshold =
            variant?.low_stock_threshold ?? item.low_stock_threshold ?? null;
          const stockStatus = getStockStatus(stock, lowStockThreshold);

          const variantImages =
            variant && variantImagesMap[variant.id]
              ? variantImagesMap[variant.id]
              : [];
          const productImages = item.images || [];
          const images =
            variantImages.length > 0 ? variantImages : productImages;

          return {
            id: item.id,
            name: item.name,
            description: item.description || "",
            price: variant?.price ?? item.price ?? 0,
            original_price:
              variant?.original_price ?? item.original_price ?? undefined,
            category: item.category,
            subcategory: item.subcategory,
            images,
            stock,
            brand: item.brand || undefined,
            condition: item.condition || "new",
            is_featured: item.is_featured || false,
            is_active: item.is_active ?? true,
            specs: item.specs || {},
            created_at: item.created_at || new Date().toISOString(),
            low_stock_threshold: lowStockThreshold,
            stockStatus,
            variantId: variant?.id,
          };
        });

        if (!cancelled) {
          setProducts(formattedData);
          setLoading(false);
        }
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
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
    if (onQuickView) {
      onQuickView(productId);
    }
  };

  const handleAddToCartClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    const stockStatus =
      product.stockStatus ||
      getStockStatus(product.stock, product.low_stock_threshold);

    if (stockStatus === "out_of_stock") {
      return;
    }

    const qtyToAdd = 1;

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

    addToCart(
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
      qtyToAdd,
      1
    );
  };

  if (loading) {
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
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="pg-card"
            >
              <div className="pg-card-img">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 280px"
                    style={{ objectFit: "cover" }}
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
                    disabled={isOutOfStock}
                    aria-label="Add to Cart"
                  >
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
            </Link>
          );
        })}
      </div>
    </>
  );
}
