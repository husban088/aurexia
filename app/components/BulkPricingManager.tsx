// app/panel/add-product/BulkPricingManager.tsx
"use client";

import { useState } from "react";

export type BulkPricingTier = {
  id?: string;
  variant_id: string;
  min_quantity: number;
  max_quantity: number;
  tier_price: number;
  discount_percentage: number | null;
  discount_price: number | null;
  created_at?: string;
  updated_at?: string;
};

type BulkPricingManagerProps = {
  variantId?: string;
  unitPrice: number;
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTierMin, setNewTierMin] = useState(2);
  const [newTierMax, setNewTierMax] = useState(2);
  const [newTierPrice, setNewTierPrice] = useState(unitPrice * 2);
  const [newDiscountPercent, setNewDiscountPercent] = useState(0);

  const calculatePriceFromDiscount = (qty: number, discountPercent: number) => {
    const originalTotal = unitPrice * qty;
    const discountedTotal = originalTotal * (1 - discountPercent / 100);
    return Math.round(discountedTotal);
  };

  const handleDiscountChange = (percent: number) => {
    setNewDiscountPercent(percent);
    const qty = newTierMin;
    const newPrice = calculatePriceFromDiscount(qty, percent);
    setNewTierPrice(newPrice);
  };

  const handleMinChange = (min: number) => {
    setNewTierMin(min);
    if (min > newTierMax) setNewTierMax(min);
    const newPrice = calculatePriceFromDiscount(min, newDiscountPercent);
    setNewTierPrice(newPrice);
  };

  const addTier = () => {
    // Validate
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

    // Check for overlapping
    const overlapping = tiers.some(
      (t) =>
        !(newTierMax < t.min_quantity || newTierMin > t.max_quantity)
    );

    if (overlapping) {
      onError("Quantity range overlaps with existing tier");
      return;
    }

    const discountPercent = newDiscountPercent;
    const discountPrice = newTierPrice;
    const perPiecePrice = newTierPrice / newTierMin;
    const savingPerPiece = unitPrice - perPiecePrice;

    const newTier: BulkPricingTier = {
      variant_id: "",
      min_quantity: newTierMin,
      max_quantity: newTierMax,
      tier_price: newTierPrice,
      discount_percentage: discountPercent,
      discount_price: discountPrice,
    };

    // Add new tier and sort by min_quantity
    const updatedTiers = [...tiers, newTier].sort((a, b) => a.min_quantity - b.min_quantity);
    onTiersChange(updatedTiers);

    // Reset form
    setNewTierMin(2);
    setNewTierMax(2);
    setNewTierPrice(unitPrice * 2);
    setNewDiscountPercent(0);
    setShowAddForm(false);
  };

  const removeTier = (index: number) => {
    onTiersChange(tiers.filter((_, i) => i !== index));
  };

  const editTier = (index: number, newPrice: number, newDiscount: number) => {
    const updatedTiers = [...tiers];
    const qty = updatedTiers[index].min_quantity;
    const originalTotal = unitPrice * qty;
    const discountedTotal = originalTotal * (1 - newDiscount / 100);
    const roundedPrice = Math.round(discountedTotal);
    
    updatedTiers[index] = {
      ...updatedTiers[index],
      tier_price: newDiscount > 0 ? roundedPrice : newPrice,
      discount_percentage: newDiscount,
      discount_price: newDiscount > 0 ? roundedPrice : newPrice,
    };
    onTiersChange(updatedTiers);
  };

  const getAvailableRanges = () => {
    const usedRanges = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity);
    const available: { min: number; max: number }[] = [];
    let lastMax = 1;
    
    for (const range of usedRanges) {
      if (range.min_quantity > lastMax + 1) {
        available.push({ min: lastMax + 1, max: range.min_quantity - 1 });
      }
      lastMax = Math.max(lastMax, range.max_quantity);
    }
    
    if (lastMax < MAX_QUANTITY) {
      available.push({ min: lastMax + 1, max: MAX_QUANTITY });
    }
    
    return available;
  };

  // Quick add multiple tiers at once
  const addMultipleTiers = () => {
    const newTiers: BulkPricingTier[] = [];
    
    // Default tiers: 2,3,4,5,6-10,11-20,21-50,51-100
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
    
    for (const preset of defaultTiers) {
      const originalTotal = unitPrice * preset.min;
      const discountedTotal = originalTotal * (1 - preset.discount / 100);
      newTiers.push({
        variant_id: "",
        min_quantity: preset.min,
        max_quantity: preset.max,
        tier_price: Math.round(discountedTotal),
        discount_percentage: preset.discount,
        discount_price: Math.round(discountedTotal),
      });
    }
    
    onTiersChange(newTiers);
  };

  return (
    <div className="ap-bulk-pricing-section">
      <div className="ap-bulk-pricing-header">
        <div className="ap-bulk-pricing-header-left">
          <div className="ap-bulk-pricing-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <h3 className="ap-bulk-pricing-title">Bulk Pricing</h3>
            <p className="ap-bulk-pricing-desc">Set quantity-based discounts (2 to 100 pieces)</p>
          </div>
        </div>
        <div className="ap-bulk-pricing-header-right">
          <button type="button" className="ap-bulk-add-all-btn" onClick={addMultipleTiers}>
            + Add All Tiers (2-100)
          </button>
        </div>
      </div>
      
      <div className="ap-bulk-pricing-body">
        {/* Existing Tiers Table */}
        {tiers.length > 0 && (
          <div className="ap-bulk-tiers-table-wrap">
            <table className="ap-bulk-tiers-table">
              <thead>
                <tr>
                  <th>Quantity</th>
                  <th>Total Price</th>
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
                  const perPiece = tier.tier_price / tier.min_quantity;
                  const saving = (unitPrice - perPiece).toFixed(0);
                  const discount = ((unitPrice - perPiece) / unitPrice * 100).toFixed(1);
                  
                  return (
                    <tr key={idx}>
                      <td className="ap-bulk-tier-qty">{qtyText}</td>
                      <td className="ap-bulk-tier-total-price">
                        <span className="ap-bulk-cut-price">₨ {(unitPrice * tier.min_quantity).toLocaleString()}</span>
                        <span className="ap-bulk-sale-price">₨ {tier.tier_price.toLocaleString()}</span>
                      </td>
                      <td className="ap-bulk-tier-per-piece">₨ {perPiece.toFixed(0)}</td>
                      <td className="ap-bulk-tier-saving">Save ₨ {parseFloat(saving).toLocaleString()}</td>
                      <td className="ap-bulk-tier-discount">
                        <span className="ap-bulk-discount-badge">{discount}% OFF</span>
                        <input
                          type="number"
                          className="ap-bulk-discount-input"
                          value={tier.discount_percentage || 0}
                          onChange={(e) => editTier(idx, tier.tier_price, parseFloat(e.target.value) || 0)}
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
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

        {/* Add New Tier Form - Small Plus Button */}
        {!showAddForm ? (
          <button
            type="button"
            className="ap-bulk-add-tier-btn"
            onClick={() => setShowAddForm(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  onChange={(e) => handleMinChange(parseInt(e.target.value) || 2)}
                />
              </div>
              <div className="ap-bulk-form-field">
                <label>Max Qty</label>
                <input
                  type="number"
                  min={newTierMin}
                  max="100"
                  value={newTierMax}
                  onChange={(e) => setNewTierMax(parseInt(e.target.value) || newTierMin)}
                />
              </div>
              <div className="ap-bulk-form-field">
                <label>Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  step="1"
                  value={newDiscountPercent}
                  onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="ap-bulk-form-field">
                <label>Total Price</label>
                <input
                  type="number"
                  value={newTierPrice}
                  onChange={(e) => setNewTierPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
              <button type="button" className="ap-bulk-add-confirm" onClick={addTier}>
                Add
              </button>
              <button type="button" className="ap-bulk-add-cancel" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
            </div>
            <div className="ap-bulk-form-preview">
              <span>Unit price: ₨ {unitPrice}</span>
              <span>→</span>
              <span className="ap-bulk-preview-price">Per piece: ₨ {(newTierPrice / newTierMin).toFixed(0)}</span>
              <span className="ap-bulk-preview-saving">Save: ₨ {(unitPrice - (newTierPrice / newTierMin)).toFixed(0)}/pc</span>
            </div>
          </div>
        )}

        {/* Quick Presets - Small chips */}
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
          ].map((preset, idx) => {
            const originalTotal = unitPrice * preset.qty;
            const discountedTotal = originalTotal * (1 - preset.discount / 100);
            return (
              <button
                key={idx}
                type="button"
                className="ap-bulk-preset-chip"
                onClick={() => {
                  const newTier: BulkPricingTier = {
                    variant_id: "",
                    min_quantity: preset.qty,
                    max_quantity: preset.maxQty,
                    tier_price: Math.round(discountedTotal),
                    discount_percentage: preset.discount,
                    discount_price: Math.round(discountedTotal),
                  };
                  // Check if tier already exists
                  const exists = tiers.some(t => 
                    (t.min_quantity <= preset.qty && t.max_quantity >= preset.qty) ||
                    (t.min_quantity <= preset.maxQty && t.max_quantity >= preset.maxQty)
                  );
                  if (!exists) {
                    const updatedTiers = [...tiers, newTier].sort((a, b) => a.min_quantity - b.min_quantity);
                    onTiersChange(updatedTiers);
                  } else {
                    onError("Tier already exists for this quantity range");
                  }
                }}
              >
                {preset.label}
                <span>{preset.discount}%</span>
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .ap-bulk-pricing-section {
          margin-top: 1rem;
          background: #ffffff;
          border: 1px solid rgba(218, 165, 32, 0.12);
          border-radius: 12px;
          overflow: hidden;
        }
        .ap-bulk-pricing-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1rem;
          background: rgba(218, 165, 32, 0.04);
          border-bottom: 1px solid rgba(218, 165, 32, 0.1);
        }
        .ap-bulk-pricing-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .ap-bulk-pricing-icon {
          width: 32px;
          height: 32px;
          border: 1px solid rgba(218, 165, 32, 0.15);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b6914;
          background: rgba(218, 165, 32, 0.06);
        }
        .ap-bulk-pricing-icon svg {
          width: 14px;
          height: 14px;
        }
        .ap-bulk-pricing-title {
          font-family: var(--ap-serif);
          font-size: 0.85rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }
        .ap-bulk-pricing-desc {
          font-family: var(--ap-sans);
          font-size: 0.5rem;
          color: #666666;
          margin: 0;
        }
        .ap-bulk-add-all-btn {
          padding: 0.4rem 0.8rem;
          background: rgba(218, 165, 32, 0.1);
          border: 1px solid rgba(218, 165, 32, 0.2);
          border-radius: 20px;
          font-family: var(--ap-sans);
          font-size: 0.5rem;
          font-weight: 600;
          color: #8b6914;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ap-bulk-add-all-btn:hover {
          background: rgba(218, 165, 32, 0.2);
          border-color: #daa520;
        }
        .ap-bulk-pricing-body {
          padding: 1rem;
        }
        .ap-bulk-tiers-table-wrap {
          overflow-x: auto;
          margin-bottom: 1rem;
        }
        .ap-bulk-tiers-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.6rem;
        }
        .ap-bulk-tiers-table th {
          text-align: left;
          padding: 0.5rem 0.25rem;
          font-family: var(--ap-sans);
          font-size: 0.5rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8b6914;
          border-bottom: 1px solid rgba(218, 165, 32, 0.15);
        }
        .ap-bulk-tiers-table td {
          padding: 0.6rem 0.25rem;
          font-family: var(--ap-sans);
          border-bottom: 1px solid rgba(218, 165, 32, 0.08);
          vertical-align: middle;
        }
        .ap-bulk-tier-qty {
          font-weight: 600;
          color: #1a1a1a;
        }
        .ap-bulk-tier-total-price {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .ap-bulk-cut-price {
          font-size: 0.5rem;
          color: #999999;
          text-decoration: line-through;
        }
        .ap-bulk-sale-price {
          font-size: 0.7rem;
          font-weight: 600;
          color: #8b6914;
        }
        .ap-bulk-tier-per-piece {
          color: #444444;
        }
        .ap-bulk-tier-saving {
          color: #22c55e;
          font-weight: 600;
        }
        .ap-bulk-tier-discount {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .ap-bulk-discount-badge {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          padding: 0.2rem 0.4rem;
          border-radius: 12px;
          font-size: 0.5rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .ap-bulk-discount-input {
          width: 50px;
          padding: 0.2rem 0.3rem;
          background: #f9f5f0;
          border: 1px solid rgba(218, 165, 32, 0.2);
          border-radius: 6px;
          font-family: var(--ap-sans);
          font-size: 0.5rem;
          text-align: center;
        }
        .ap-bulk-tier-remove {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 6px;
          cursor: pointer;
          color: rgba(239, 68, 68, 0.5);
          transition: all 0.2s;
        }
        .ap-bulk-tier-remove:hover {
          border-color: #ef4444;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }
        .ap-bulk-tier-remove svg {
          width: 10px;
          height: 10px;
        }
        .ap-bulk-add-tier-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          width: 100%;
          padding: 0.5rem;
          background: transparent;
          border: 1px dashed rgba(218, 165, 32, 0.4);
          border-radius: 8px;
          cursor: pointer;
          color: #8b6914;
          font-family: var(--ap-sans);
          font-size: 0.55rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .ap-bulk-add-tier-btn svg {
          width: 12px;
          height: 12px;
        }
        .ap-bulk-add-tier-btn:hover {
          border-color: #daa520;
          background: rgba(218, 165, 32, 0.08);
        }
        .ap-bulk-add-tier-form {
          padding: 0.75rem;
          background: rgba(218, 165, 32, 0.04);
          border-radius: 10px;
          margin-bottom: 0.75rem;
        }
        .ap-bulk-form-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }
        .ap-bulk-form-field {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .ap-bulk-form-field label {
          font-family: var(--ap-sans);
          font-size: 0.45rem;
          font-weight: 600;
          color: #8b6914;
        }
        .ap-bulk-form-field input {
          width: 70px;
          padding: 0.35rem;
          background: #ffffff;
          border: 1px solid rgba(218, 165, 32, 0.2);
          border-radius: 6px;
          font-family: var(--ap-sans);
          font-size: 0.55rem;
        }
        .ap-bulk-add-confirm, .ap-bulk-add-cancel {
          padding: 0.35rem 0.7rem;
          border-radius: 20px;
          font-family: var(--ap-sans);
          font-size: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 1.2rem;
        }
        .ap-bulk-add-confirm {
          background: #daa520;
          border: none;
          color: #1a1a1a;
        }
        .ap-bulk-add-confirm:hover {
          background: #f0c040;
        }
        .ap-bulk-add-cancel {
          background: transparent;
          border: 1px solid rgba(218, 165, 32, 0.3);
          color: #666666;
        }
        .ap-bulk-add-cancel:hover {
          border-color: #daa520;
          color: #8b6914;
        }
        .ap-bulk-form-preview {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.6rem;
          padding-top: 0.6rem;
          border-top: 1px solid rgba(218, 165, 32, 0.1);
          font-family: var(--ap-sans);
          font-size: 0.5rem;
          color: #666666;
        }
        .ap-bulk-preview-price {
          color: #8b6914;
          font-weight: 600;
        }
        .ap-bulk-preview-saving {
          color: #22c55e;
          font-weight: 600;
        }
        .ap-bulk-presets-small {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(218, 165, 32, 0.1);
        }
        .ap-bulk-presets-label {
          font-family: var(--ap-sans);
          font-size: 0.5rem;
          color: #999999;
        }
        .ap-bulk-preset-chip {
          padding: 0.25rem 0.6rem;
          background: rgba(218, 165, 32, 0.06);
          border: 1px solid rgba(218, 165, 32, 0.15);
          border-radius: 16px;
          font-family: var(--ap-sans);
          font-size: 0.5rem;
          font-weight: 600;
          color: #8b6914;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .ap-bulk-preset-chip span {
          font-size: 0.4rem;
          background: #22c55e;
          color: white;
          padding: 0.1rem 0.25rem;
          border-radius: 10px;
        }
        .ap-bulk-preset-chip:hover {
          background: rgba(218, 165, 32, 0.15);
          border-color: #daa520;
        }
      `}</style>
    </div>
  );
}