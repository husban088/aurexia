"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase, Product } from "@/lib/supabase";
import { useCartStore } from "@/lib/cartStore";

interface ProductGridProps {
  category: string; // e.g. "Accessories"
  subcategory?: string; // e.g. "Chargers" — if empty, shows all in category
  title?: string; // override section title
}

function SkeletonGrid() {
  return (
    <div className="st-skeleton-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="st-skeleton-card">
          <div className="st-skeleton-img" />
          <div className="st-skeleton-body">
            <div className="st-skeleton-line" style={{ width: "40%" }} />
            <div className="st-skeleton-line" style={{ width: "80%" }} />
            <div className="st-skeleton-line" style={{ width: "55%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductGrid({
  category,
  subcategory,
  title,
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    async function load() {
      setLoading(true);
      let q = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("category", category);

      if (subcategory) q = q.eq("subcategory", subcategory);

      const { data } = await q;
      setProducts(data || []);
      setLoading(false);
    }
    load();
  }, [category, subcategory]);

  const filtered = useMemo(() => {
    let list = [...products];

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.brand && p.brand.toLowerCase().includes(s)) ||
          p.subcategory.toLowerCase().includes(s)
      );
    }

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "featured":
        list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        break;
      default:
        // newest — already ordered by created_at from supabase
        break;
    }

    return list;
  }, [products, search, sort]);

  const discount = (p: Product) =>
    p.original_price && p.original_price > p.price
      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
      : 0;

  const { addToCart } = useCartStore();

  return (
    <>
      {/* Toolbar */}
      <div className="st-toolbar">
        <div className="st-search-wrap">
          <svg
            className="st-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="st-search"
            placeholder={`Search ${subcategory || category}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="st-sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="featured">Featured First</option>
        </select>

        <span className="st-count">
          <em>{filtered.length}</em> {filtered.length === 1 ? "item" : "items"}{" "}
          found
        </span>
      </div>

      {/* Section label */}
      {title && (
        <div className="st-section-label">
          <h2
            className="st-section-title"
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <div className="st-section-line" />
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <div className="st-empty">
          <div className="st-empty-icon">
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
          <p className="st-empty-title">No products found</p>
          <p className="st-empty-sub">
            {search
              ? `No results for "${search}" — try a different term`
              : "Check back soon for new arrivals"}
          </p>
        </div>
      ) : (
        <div className="st-grid">
          {filtered.map((p) => {
            const disc = discount(p);
            return (
              <Link key={p.id} href={`/product/${p.id}`} className="st-card">
                {/* Image */}
                <div className="st-card-img">
                  {p.images?.[0] ? (
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 260px"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div className="st-card-img-placeholder">
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

                  {/* Badges */}
                  <div className="st-card-badges">
                    <span className="st-badge st-badge--cat">
                      {p.subcategory}
                    </span>
                    {p.is_featured && (
                      <span className="st-badge st-badge--feat">Featured</span>
                    )}
                    {disc > 0 && (
                      <span className="st-badge st-badge--sale">-{disc}%</span>
                    )}
                    {p.condition === "new" && !disc && (
                      <span className="st-badge st-badge--new">New</span>
                    )}
                  </div>

                  {/* Quick actions */}
                  <div
                    className="st-card-quick"
                    onClick={(e) => e.preventDefault()}
                  >
                    <button
                      className="st-quick-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart(p);
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                      </svg>
                      Add to Cart
                    </button>
                    <button className="st-quick-btn st-quick-btn--ghost">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="st-card-body">
                  {p.brand && <p className="st-card-brand">{p.brand}</p>}
                  <h3 className="st-card-name">{p.name}</h3>
                  <div className="st-card-price-row">
                    <span className="st-card-price">
                      PKR {p.price.toLocaleString()}
                    </span>
                    {p.original_price && p.original_price > p.price && (
                      <span className="st-card-orig">
                        PKR {p.original_price.toLocaleString()}
                      </span>
                    )}
                    {disc > 0 && (
                      <span className="st-card-discount">-{disc}% OFF</span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="st-card-foot">
                  <span
                    className={`st-card-stock${
                      p.stock === 0 ? " out" : p.stock < 5 ? " low" : ""
                    }`}
                  >
                    {p.stock === 0
                      ? "Out of stock"
                      : p.stock < 5
                      ? `Only ${p.stock} left`
                      : `${p.stock} in stock`}
                  </span>
                </div>

                <div className="st-card-line" />
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
