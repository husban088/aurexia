// app/checkout/components/CartSummary.tsx
"use client";

import React from "react";
import { useCurrency } from "@/app/context/CurrencyContext";
import "./CartSummary.css";

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  variant_name?: string;
  variant_price?: number;
  variant_image?: string;
  quantity: number;
  pieces_per_unit?: number;
  product?: {
    id?: string;
    name?: string;
    description?: string;
    category?: string;
    subcategory?: string;
    condition?: string;
    is_featured?: boolean;
    is_active?: boolean;
    price?: number;
    original_price?: number;
    images?: string[];
    stock?: number;
  } | null;
}

interface CartSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  cartCount: number;
  // formatPrice ab optional hai - agar nahi diya toh useCurrency se le lega
  formatPrice?: (price: number) => string;
}

export default function CartSummary({
  items,
  subtotal,
  shipping,
  total,
  cartCount,
  formatPrice: propFormatPrice,
}: CartSummaryProps) {
  // ✅ Agar formatPrice prop mein nahi aaya toh context se le lo
  const {
    formatPrice: contextFormatPrice,
    currency,
    loading: currencyLoading,
  } = useCurrency();

  // ✅ Use prop formatPrice if provided, otherwise use context
  const formatPrice = propFormatPrice || contextFormatPrice;

  // ✅ Show currency info for debugging
  const currencyCode = currency?.code || "PKR";
  const currencySymbol = currency?.symbol || "₨";

  return (
    <div className="cs-summary-card">
      <p className="cs-summary-title">
        <span className="cs-ey-line" />
        Order Summary{" "}
        {!currencyLoading && (
          <span style={{ fontSize: "0.7rem", marginLeft: "0.5rem" }}>
            ({currencyCode})
          </span>
        )}
        <span className="cs-ey-line" />
      </p>

      <ul className="cs-summary-items">
        {items.slice(0, 3).map((item) => {
          const product = item.product ?? {
            id: item.product_id,
            name: item.variant_name || "Product",
            description: "",
            category: "",
            subcategory: "",
            condition: "new",
            is_featured: false,
            is_active: true,
            price: item.variant_price ?? 0,
            images: item.variant_image ? [item.variant_image] : [],
          };
          const ppu = item.pieces_per_unit ?? 1;
          const pricePerPiece = item.variant_price ?? product.price ?? 0;
          const itemTotal = pricePerPiece * ppu * item.quantity;
          const displayImage =
            item.variant_image || product.images?.[0] || null;
          const productName = product.name ?? item.variant_name ?? "Product";
          const displayName =
            item.variant_name && item.variant_name !== "Standard"
              ? `${productName} (${item.variant_name})`
              : productName;

          return (
            <li key={item.id} className="cs-summary-item">
              <div className="cs-summary-item-img">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={productName}
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                ) : (
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
                )}
              </div>
              <div className="cs-summary-item-info">
                <p className="cs-summary-item-name">{displayName}</p>
                <p className="cs-summary-item-variant">
                  {ppu > 1 ? `${ppu}-Piece × ` : ""}
                  {item.quantity} {item.quantity === 1 ? "unit" : "units"}
                </p>
              </div>
              <span className="cs-summary-item-price">
                {formatPrice(itemTotal)}
              </span>
            </li>
          );
        })}
      </ul>

      {items.length > 3 && (
        <div className="cs-summary-more">
          +{items.length - 3} more item
          {items.length - 3 > 1 ? "s" : ""}
        </div>
      )}

      <div className="cs-summary-breakdown">
        <div className="cs-summary-row">
          <span>
            Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})
          </span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="cs-summary-row">
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
        </div>
        <div className="cs-summary-divider" />
        <div className="cs-summary-row cs-summary-total">
          <span>Total ({currencyCode})</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <div className="cs-perks">
        <div className="cs-perk">
          <span className="cs-perk-icon">🔒</span>
          <span className="cs-perk-text">Secure Checkout</span>
        </div>
        <div className="cs-perk">
          <span className="cs-perk-icon">↩</span>
          <span className="cs-perk-text">30-Day Easy Returns</span>
        </div>
        <div className="cs-perk">
          <span className="cs-perk-icon">✦</span>
          <span className="cs-perk-text">Luxury Packaging</span>
        </div>
      </div>
    </div>
  );
}
