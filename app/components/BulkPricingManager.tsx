// app/panel/components/BulkPricingManager.tsx
"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/app/context/CurrencyContext";

export type BulkPricingTier = {
  id?: string;
  variant_id: string;
  min_quantity: number;
  max_quantity: number;
  tier_price: number; // This is ALWAYS in PKR in database
  discount_percentage: number | null;
  discount_price: number | null;
  created_at?: string;
  updated_at?: string;
  // Display fields (not saved to DB)
  display_price?: number;
  display_currency?: string;
};

type BulkPricingManagerProps = {
  variantId?: string;
  unitPrice: number; // Unit price in CURRENT CURRENCY
  tiers: BulkPricingTier[];
  onTiersChange: (tiers: BulkPricingTier[]) => void;
  onError: (msg: string) => void;
};

const MAX_QUANTITY = 100;

export function BulkPricingManager({
  unitPrice,
  tiers,
  onTiersChange,
  onError,
}: BulkPricingManagerProps) {
  const { currency } = useCurrency();
  const symbol = currency.symbol;
  const currencyCode = currency.code;
  const currencyRate = currency.rate;

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTierMin, setNewTierMin] = useState(2);
  const [newTierMax, setNewTierMax] = useState(2);
  const [newTierDiscount, setNewTierDiscount] = useState(0);

  // Helper: Convert display price (current currency) to PKR for storage
  const convertToPKR = (priceInDisplay: number): number => {
    if (currencyCode === "PKR") return priceInDisplay;
    return Number((priceInDisplay / currencyRate).toFixed(2));
  };

  // Helper: Convert PKR to display currency
  const convertFromPKR = (priceInPKR: number): number => {
    if (currencyCode === "PKR") return priceInPKR;
    return Number((priceInPKR * currencyRate).toFixed(2));
  };

  // Calculate total price in CURRENT CURRENCY based on discount percentage
  const calculateTotalPrice = (
    qty: number,
    discountPercent: number
  ): number => {
    const originalTotal = unitPrice * qty;
    const discountedTotal = originalTotal * (1 - discountPercent / 100);
    return Number(discountedTotal.toFixed(2));
  };

  // Get display price for a tier (converted from PKR stored value)
  const getDisplayPrice = (tier: BulkPricingTier): number => {
    if (tier.display_price) return tier.display_price;
    return convertFromPKR(tier.tier_price);
  };

  const addTier = () => {
    if (newTierMin < 2) {
      onError("Minimum quantity must be at least 2");
      return;
    }
    if (newTierMax > MAX_QUANTITY) {
      onError(`Maximum quantity cannot exceed ${MAX_QUANTITY}`);
      return;
    }
    if (newTierMin > newTierMax) {
      onError("Minimum quantity cannot be greater than maximum quantity");
      return;
    }

    // Check for overlapping ranges
    const overlapping = tiers.some(
      (t) => !(newTierMax < t.min_quantity || newTierMin > t.max_quantity)
    );

    if (overlapping) {
      onError("Quantity range overlaps with existing tier");
      return;
    }

    // Calculate total price in CURRENT CURRENCY
    const totalPriceInDisplay = calculateTotalPrice(
      newTierMin,
      newTierDiscount
    );

    // Convert to PKR for storage
    const totalPriceInPKR = convertToPKR(totalPriceInDisplay);

    const newTier: BulkPricingTier = {
      variant_id: "",
      min_quantity: newTierMin,
      max_quantity: newTierMax,
      tier_price: totalPriceInPKR,
      discount_percentage: newTierDiscount,
      discount_price: totalPriceInPKR,
      display_price: totalPriceInDisplay,
      display_currency: currencyCode,
    };

    const updatedTiers = [...tiers, newTier].sort(
      (a, b) => a.min_quantity - b.min_quantity
    );
    onTiersChange(updatedTiers);

    // Reset form
    setNewTierMin(2);
    setNewTierMax(2);
    setNewTierDiscount(0);
    setShowAddForm(false);
  };

  const removeTier = (index: number) => {
    onTiersChange(tiers.filter((_, i) => i !== index));
  };

  const updateTierDiscount = (index: number, discountPercent: number) => {
    const tier = tiers[index];
    const qty = tier.min_quantity;

    // Calculate new total price in CURRENT CURRENCY
    const newTotalDisplay = calculateTotalPrice(qty, discountPercent);
    const newTotalPKR = convertToPKR(newTotalDisplay);

    const updatedTiers = [...tiers];
    updatedTiers[index] = {
      ...updatedTiers[index],
      tier_price: newTotalPKR,
      discount_percentage: discountPercent,
      discount_price: newTotalPKR,
      display_price: newTotalDisplay,
    };
    onTiersChange(updatedTiers);
  };

  const addMultipleTiers = () => {
    const defaultTiers = [
      { min: 2, max: 2, discount: 5 },
      { min: 3, max: 3, discount: 8 },
      { min: 4, max: 4, discount: 10 },
      { min: 5, max: 5, discount: 12 },
      { min: 6, max: 10, discount: 15 },
      { min: 11, max: 20, discount: 20 },
      { min: 21, max: 50, discount: 25 },
      { min: 51, max: 100, discount: 30 },
    ];

    const newTiers: BulkPricingTier[] = [];
    for (const preset of defaultTiers) {
      const totalDisplay = calculateTotalPrice(preset.min, preset.discount);
      const totalPKR = convertToPKR(totalDisplay);

      // Check if tier already exists
      const exists = tiers.some(
        (t) => !(preset.max < t.min_quantity || preset.min > t.max_quantity)
      );

      if (!exists) {
        newTiers.push({
          variant_id: "",
          min_quantity: preset.min,
          max_quantity: preset.max,
          tier_price: totalPKR,
          discount_percentage: preset.discount,
          discount_price: totalPKR,
          display_price: totalDisplay,
          display_currency: currencyCode,
        });
      }
    }

    const updatedTiers = [...tiers, ...newTiers].sort(
      (a, b) => a.min_quantity - b.min_quantity
    );
    onTiersChange(updatedTiers);
  };

  // Helper to format price for display
  const formatPrice = (priceInPKR: number): string => {
    const displayPrice = convertFromPKR(priceInPKR);
    return `${symbol}${displayPrice.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatSmallPrice = (price: number): string => {
    return `${symbol}${price.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <div className="ap-bulk-pricing-section">
      <div className="ap-bulk-pricing-header">
        <div className="ap-bulk-pricing-header-left">
          <div className="ap-bulk-pricing-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <h3 className="ap-bulk-pricing-title">
              Bulk Pricing ({currency.code})
            </h3>
            <p className="ap-bulk-pricing-desc">
              Set quantity-based discounts - prices in {currency.code}
            </p>
          </div>
        </div>
        <div className="ap-bulk-pricing-header-right">
          <button
            type="button"
            className="ap-bulk-add-all-btn"
            onClick={addMultipleTiers}
          >
            + Add All Tiers
          </button>
        </div>
      </div>

      <div className="ap-bulk-pricing-body">
        {tiers.length > 0 && (
          <div className="ap-bulk-tiers-table-wrap">
            <table className="ap-bulk-tiers-table">
              <thead>
                <tr>
                  <th>Quantity</th>
                  <th>Total Price ({currency.code})</th>
                  <th>Per Piece</th>
                  <th>You Save</th>
                  <th>Discount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier, idx) => {
                  const isRange = tier.min_quantity !== tier.max_quantity;
                  const qtyText = isRange
                    ? `${tier.min_quantity} - ${tier.max_quantity} pcs`
                    : `${tier.min_quantity} pc`;

                  const totalDisplay = getDisplayPrice(tier);
                  const perPiece = totalDisplay / tier.min_quantity;
                  const unitDisplay = unitPrice;
                  const savingPerPiece = unitDisplay - perPiece;
                  const discount = (
                    (savingPerPiece / unitDisplay) *
                    100
                  ).toFixed(1);

                  return (
                    <tr key={idx}>
                      <td className="ap-bulk-tier-qty">{qtyText}</td>
                      <td className="ap-bulk-tier-total-price">
                        <span className="ap-bulk-cut-price">
                          {formatSmallPrice(unitDisplay * tier.min_quantity)}
                        </span>
                        <span className="ap-bulk-sale-price">
                          {formatSmallPrice(totalDisplay)}
                        </span>
                      </td>
                      <td className="ap-bulk-tier-per-piece">
                        {formatSmallPrice(perPiece)}
                      </td>
                      <td className="ap-bulk-tier-saving">
                        Save {formatSmallPrice(savingPerPiece)}/pc
                      </td>
                      <td className="ap-bulk-tier-discount">
                        <span className="ap-bulk-discount-badge">
                          {discount}% OFF
                        </span>
                        <input
                          type="number"
                          className="ap-bulk-discount-input"
                          value={tier.discount_percentage || 0}
                          onChange={(e) =>
                            updateTierDiscount(
                              idx,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min="0"
                          max="90"
                          step="1"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ap-bulk-tier-remove"
                          onClick={() => removeTier(idx)}
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!showAddForm ? (
          <button
            type="button"
            className="ap-bulk-add-tier-btn"
            onClick={() => setShowAddForm(true)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Tier
          </button>
        ) : (
          <div className="ap-bulk-add-tier-form">
            <div className="ap-bulk-form-row">
              <div className="ap-bulk-form-field">
                <label>Min Qty</label>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={newTierMin}
                  onChange={(e) => setNewTierMin(parseInt(e.target.value) || 2)}
                />
              </div>
              <div className="ap-bulk-form-field">
                <label>Max Qty</label>
                <input
                  type="number"
                  min={newTierMin}
                  max="100"
                  value={newTierMax}
                  onChange={(e) =>
                    setNewTierMax(parseInt(e.target.value) || newTierMin)
                  }
                />
              </div>
              <div className="ap-bulk-form-field">
                <label>Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  step="1"
                  value={newTierDiscount}
                  onChange={(e) =>
                    setNewTierDiscount(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <button
                type="button"
                className="ap-bulk-add-confirm"
                onClick={addTier}
              >
                Add
              </button>
              <button
                type="button"
                className="ap-bulk-add-cancel"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
            <div className="ap-bulk-form-preview">
              <span>Unit price: {formatSmallPrice(unitPrice)}</span>
              <span>→</span>
              <span className="ap-bulk-preview-price">
                Total:{" "}
                {formatSmallPrice(
                  calculateTotalPrice(newTierMin, newTierDiscount)
                )}
              </span>
              <span className="ap-bulk-preview-saving">
                Per piece:{" "}
                {formatSmallPrice(
                  calculateTotalPrice(newTierMin, newTierDiscount) / newTierMin
                )}
              </span>
            </div>
          </div>
        )}

        <div className="ap-bulk-presets-small">
          <span className="ap-bulk-presets-label">Quick add:</span>
          {[
            { label: "2pc", qty: 2, maxQty: 2, discount: 5 },
            { label: "3pc", qty: 3, maxQty: 3, discount: 8 },
            { label: "4pc", qty: 4, maxQty: 4, discount: 10 },
            { label: "5pc", qty: 5, maxQty: 5, discount: 12 },
            { label: "6-10", qty: 6, maxQty: 10, discount: 15 },
            { label: "11-20", qty: 11, maxQty: 20, discount: 20 },
            { label: "21-50", qty: 21, maxQty: 50, discount: 25 },
            { label: "51-100", qty: 51, maxQty: 100, discount: 30 },
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="ap-bulk-preset-chip"
              onClick={() => {
                const totalDisplay = calculateTotalPrice(
                  preset.qty,
                  preset.discount
                );
                const totalPKR = convertToPKR(totalDisplay);

                const exists = tiers.some(
                  (t) =>
                    (t.min_quantity <= preset.qty &&
                      t.max_quantity >= preset.qty) ||
                    (t.min_quantity <= preset.maxQty &&
                      t.max_quantity >= preset.maxQty)
                );

                if (!exists) {
                  const newTier: BulkPricingTier = {
                    variant_id: "",
                    min_quantity: preset.qty,
                    max_quantity: preset.maxQty,
                    tier_price: totalPKR,
                    discount_percentage: preset.discount,
                    discount_price: totalPKR,
                    display_price: totalDisplay,
                    display_currency: currencyCode,
                  };
                  const updatedTiers = [...tiers, newTier].sort(
                    (a, b) => a.min_quantity - b.min_quantity
                  );
                  onTiersChange(updatedTiers);
                } else {
                  onError("Tier already exists for this quantity range");
                }
              }}
            >
              {preset.label}
              <span>{preset.discount}%</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
