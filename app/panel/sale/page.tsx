// app/panel/sale/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  setSalePercent,
  fetchSaleFromDB,
  setBannerEnabled,
  isBannerEnabled,
} from "@/lib/saleStore";
import "./sale-panel.css";

const OPTIONS = [10, 20, 30] as const;

export default function SalePanel() {
  const [selected, setSelected] = useState<10 | 20 | 30 | null>(null);
  const [bannerEnabled, setBannerEnabledState] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch current sale and banner setting from database
    Promise.all([fetchSaleFromDB()]).then(([{ percent, bannerEnabled }]) => {
      setSelected(percent as 10 | 20 | 30 | null);
      setBannerEnabledState(bannerEnabled);
      setLoading(false);
    });
  }, []);

  async function handleApply(val: 10 | 20 | 30) {
    setLoading(true);
    const success = await setSalePercent(val);
    if (success) {
      setSelected(val);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } else {
      alert("Failed to apply sale. Please try again.");
    }
    setLoading(false);
  }

  async function handleRemove() {
    setLoading(true);
    const success = await setSalePercent(null);
    if (success) {
      setSelected(null);
      setTimeout(() => {
        setSaved(false);
      }, 1000);
    } else {
      alert("Failed to remove sale. Please try again.");
    }
    setLoading(false);
  }

  async function handleBannerToggle(enabled: boolean) {
    setLoading(true);
    const success = await setBannerEnabled(enabled);
    if (success) {
      setBannerEnabledState(enabled);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } else {
      alert("Failed to update banner setting. Please try again.");
    }
    setLoading(false);
  }

  if (loading && selected === null && bannerEnabled === null) {
    return (
      <div className="sale-panel-loader">
        <div className="loader-spinner"></div>
        <div className="loader-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className="sale-panel-container">
      <div className="sale-panel-card">
        <div className="sale-panel-header">
          <h1 className="sale-panel-title">🏷️ Sale Banner Control</h1>
          <p className="sale-panel-description">
            ✅ Click karo — discount apply hoga aur{" "}
            <strong className="highlight-text">SAB USERS</strong> ko discount
            milega!
          </p>
        </div>

        {/* Options */}
        <div className="options-grid">
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => handleApply(opt)}
              disabled={loading}
              className={`option-button ${selected === opt ? "option-button-active" : ""}`}
              data-percent={opt}
            >
              {opt}% OFF
            </button>
          ))}
        </div>

        {/* Current status */}
        <div className="status-card">
          <div className="status-label">📢 Currently active:</div>
          <div
            className={`status-value ${selected ? "status-value-active" : "status-value-inactive"}`}
          >
            {selected
              ? `${selected}% OFF — All customers worldwide will see this discount!`
              : "None (No active sale)"}
          </div>
        </div>

        {/* Remove button */}
        <button
          onClick={handleRemove}
          disabled={loading || !selected}
          className="remove-button"
        >
          🗑️ Remove Discount
        </button>

        {/* Banner Toggle Section */}
        <div className="banner-toggle-section">
          <div className="banner-toggle-header">
            <span className="banner-toggle-icon">🎯</span>
            <span className="banner-toggle-title">Sale Banner Control</span>
          </div>
          <div className="banner-toggle-description">
            <p>
              Toggle this switch to control whether the sale banner appears to
              customers or not.
            </p>
            <p className="banner-toggle-note">
              <strong>Note:</strong> Even if a sale is active (10%, 20%, or 30%
              OFF), you can choose to <strong>hide</strong> the banner from
              customers.
            </p>
          </div>

          <label className="banner-toggle-switch">
            <input
              type="checkbox"
              checked={bannerEnabled}
              onChange={(e) => handleBannerToggle(e.target.checked)}
              disabled={loading}
            />
            <span className="banner-toggle-slider"></span>
            <span className="banner-toggle-label">
              {bannerEnabled ? "✅ Banner is VISIBLE" : "❌ Banner is HIDDEN"}
            </span>
          </label>

          {selected && !bannerEnabled && (
            <div className="banner-warning">
              ⚠️ Sale is active ({selected}% OFF), but banner is hidden.
              Customers will still get the discount, but won't see the banner
              popup.
            </div>
          )}
        </div>

        {saved && (
          <div className="success-message">
            <div className="success-message-main">
              ✓ Saved! Settings updated successfully.
            </div>
            <div className="success-message-sub">
              {selected
                ? `${selected}% OFF sale is active. ${bannerEnabled ? "Banner is visible to customers." : "Banner is hidden from customers."}`
                : "Sale has been removed. No discounts active."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
