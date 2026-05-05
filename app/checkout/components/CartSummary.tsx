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
  shipping?: number; // ✅ Made optional - will default to 0
  total: number;
  cartCount: number;
  // formatPrice ab optional hai - agar nahi diya toh useCurrency se le lega
  formatPrice?: (price: number) => string;
}

export default function CartSummary({
  items,
  subtotal,
  shipping = 0, // ✅ Default to 0 (free shipping)
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

  // ✅ Ensure shipping is always treated as free (0)
  const finalShipping = 0; // Force free shipping
  const finalTotal = subtotal; // Since shipping is 0, total = subtotal

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

          // ✅ Better display name with tier info
          const tierLabel = ppu > 1 ? ` (${ppu}-Piece)` : "";
          const variantSuffix =
            item.variant_name && item.variant_name !== "Standard"
              ? ` — ${item.variant_name}`
              : "";
          const displayName = `${productName}${tierLabel}${variantSuffix}`;

          const totalPieces = ppu * item.quantity;

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
                  {ppu > 1 ? `${ppu} pieces per unit × ` : ""}
                  {item.quantity} {item.quantity === 1 ? "unit" : "units"}
                  {ppu > 1 && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        opacity: 0.7,
                        marginLeft: "4px",
                      }}
                    >
                      ({totalPieces} total pieces)
                    </span>
                  )}
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

        {/* ✅ Shipping row - Always Free */}
        <div className="cs-summary-row">
          <span>Shipping</span>
          <span className="free-shipping-text">Free</span>
        </div>

        <div className="cs-summary-divider" />

        {/* ✅ Total row - Equal to subtotal */}
        <div className="cs-summary-row cs-summary-total">
          <span>Total ({currencyCode})</span>
          <span className="total-amount">{formatPrice(finalTotal)}</span>
        </div>
      </div>

      {/* ✅ Free Shipping Perks Message */}
      <div className="free-shipping-banner">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="16"
          height="16"
        >
          <polyline
            points="20 6 9 17 4 12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Free Shipping</span>
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
        <div className="cs-perk">
          <span className="cs-perk-icon">🚚</span>
          <span className="cs-perk-text">Free Shipping</span>
        </div>
      </div>
    </div>
  );
}
