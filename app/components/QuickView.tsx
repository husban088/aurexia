"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import "./QuickView.css";
import { useCurrency } from "../context/CurrencyContext";

interface QuickViewProduct {
  id: string;
  name: string;
  brand?: string;
  price: number;
  original_price?: number;
  category: string;
  subcategory: string;
  images: string[];
  stock: number;
  description?: string;
  condition?: string;
  is_featured?: boolean;
  is_active?: boolean;
}

interface QuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  product: QuickViewProduct | null;
}

export default function QuickView({
  isOpen,
  onClose,
  product,
}: QuickViewProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCartStore();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen || !product) return null;

  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) *
            100
        )
      : 0;

  const images: string[] = product.images || [];

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.price,
      original_price: product.original_price,
      category: product.category,
      subcategory: product.subcategory,
      images: product.images,
      stock: product.stock,
      brand: product.brand || "",
      condition: product.condition || "new",
      is_featured: product.is_featured || false,
      is_active: product.is_active || true,
      specs: {},
      created_at: new Date().toISOString(),
    });
    onClose();
  };

  const handleBuyNow = () => {
    addToCart({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.price,
      original_price: product.original_price,
      category: product.category,
      subcategory: product.subcategory,
      images: product.images,
      stock: product.stock,
      brand: product.brand || "",
      condition: product.condition || "new",
      is_featured: product.is_featured || false,
      is_active: product.is_active || true,
      specs: {},
      created_at: new Date().toISOString(),
    });
    window.location.href = "/checkout";
  };

  return (
    <div className="qv-overlay" onClick={handleOutsideClick}>
      <div className="qv-modal" ref={modalRef}>
        {/* Close Button */}
        <button className="qv-close" onClick={onClose} aria-label="Close">
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

        {/* Decorative Corners */}
        <div className="qv-corner qv-corner-tl" />
        <div className="qv-corner qv-corner-tr" />
        <div className="qv-corner qv-corner-bl" />
        <div className="qv-corner qv-corner-br" />

        <div className="qv-grid">
          {/* Left: Image Gallery */}
          <div className="qv-gallery">
            <div className="qv-main-img">
              {images[0] ? (
                <img src={images[0]} alt={product.name} />
              ) : (
                <div className="qv-img-placeholder">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
              {discount > 0 && (
                <div className="qv-discount-badge">-{discount}%</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="qv-thumbs">
                {images.slice(0, 4).map((img: string, idx: number) => (
                  <button key={idx} className="qv-thumb">
                    <img src={img} alt={`${product.name} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="qv-info">
            <div className="qv-eyebrow">
              <span className="qv-ey-line" />
              {product.subcategory || product.category}
              <span className="qv-ey-line" />
            </div>

            {product.brand && <p className="qv-brand">{product.brand}</p>}

            <h2 className="qv-title">{product.name}</h2>

            <div className="qv-price-row">
              <span className="qv-price">{formatPrice(product.price)}</span>
              {product.original_price &&
                product.original_price > product.price && (
                  <span className="qv-orig">
                    {formatPrice(product.original_price)}
                  </span>
                )}
            </div>

            {product.description && (
              <p className="qv-desc">{product.description}</p>
            )}

            <div className="qv-stock">
              <span
                className={`qv-stock-dot ${
                  product.stock === 0 ? "out" : product.stock < 5 ? "low" : "in"
                }`}
              />
              {product.stock === 0
                ? "Out of Stock"
                : product.stock < 5
                ? `Only ${product.stock} left`
                : "In Stock"}
            </div>

            {/* Features */}
            <div className="qv-features">
              <div className="qv-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Authentic
              </div>
              <div className="qv-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Free Delivery
              </div>
              <div className="qv-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                </svg>
                Easy Returns
              </div>
              <div className="qv-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                </svg>
                COD Available
              </div>
            </div>

            {/* Buttons */}
            <div className="qv-actions">
              <button
                className="qv-add-cart"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                Add to Cart
              </button>
              <button
                className="qv-buy-now"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                Buy Now
              </button>
            </div>

            <Link
              href={`/product/${product.id}`}
              className="qv-view-details"
              onClick={onClose}
            >
              View Full Details
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
