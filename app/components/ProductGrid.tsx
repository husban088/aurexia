"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/cartStore";
import { useCurrency } from "@/context/CurrencyContext";
import "@/app/styles/product-grid.css";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: string;
  subcategory: string;
  images: string[];
  stock: number;
  brand: string | null;
  condition: string;
  is_featured: boolean;
  is_active: boolean;
  specs: Record<string, string>;
  created_at: string;
  rating?: number;
  reviews_count?: number;
}

interface ProductGridProps {
  category: string;
  subcategory?: string;
  limit?: number;
  featured?: boolean;
}

export default function ProductGrid({
  category,
  subcategory,
  limit,
  featured = false,
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
        } else {
          setProducts(data || []);
        }
        setLoading(false);
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

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock > 0) {
      addToCart(product);
    }
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
                </div>

                {/* Icon Buttons - Always Visible */}
                <div className="pg-icon-buttons">
                  <button
                    className="pg-icon-btn pg-icon-btn--view"
                    aria-label="Quick View"
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
                    onClick={(e) => handleAddToCart(e, product)}
                    disabled={product.stock === 0}
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
                <span
                  className={`pg-card-stock${
                    product.stock === 0
                      ? " out"
                      : product.stock < 5
                      ? " low"
                      : ""
                  }`}
                >
                  {product.stock === 0
                    ? "Out of stock"
                    : product.stock < 5
                    ? `Only ${product.stock} left`
                    : "In stock"}
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
