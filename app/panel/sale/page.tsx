// app/panel/sale/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSalePercent,
  setSalePercent,
  fetchSaleFromDB,
} from "@/lib/saleStore";
import "./sale-panel.css";

const OPTIONS = [10, 20, 30] as const;

export default function SalePanel() {
  const [selected, setSelected] = useState<10 | 20 | 30 | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch current sale from database
    fetchSaleFromDB().then((percent) => {
      setSelected(percent as 10 | 20 | 30 | null);
      setLoading(false);
    });
  }, []);

  async function handleApply(val: 10 | 20 | 30) {
    setLoading(true);
    // Save to database (will sync to all users)
    const success = await setSalePercent(val);
    if (success) {
      setSelected(val);
      setSaved(true);

      // Show success message briefly
      setTimeout(() => {
        router.push("/");
      }, 500);
    } else {
      alert("Failed to apply sale. Please try again.");
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    const success = await setSalePercent(null);
    if (success) {
      setSelected(null);
      setSaved(false);
      setTimeout(() => {
        router.push("/");
      }, 300);
    } else {
      alert("Failed to remove sale. Please try again.");
      setLoading(false);
    }
  }

  if (loading && selected === null) {
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
          <h1 className="sale-panel-title">
            🏷️ Sale Banner Control
          </h1>
          <p className="sale-panel-description">
            ✅ Click karo — discount apply hoga aur{" "}
            <strong className="highlight-text">SAB USERS</strong> ko banner show
            hoga!
          </p>
        </div>

        {/* Options */}
        <div className="options-grid">
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => handleApply(opt)}
              disabled={loading}
              className={`option-button ${selected === opt ? 'option-button-active' : ''}`}
              data-percent={opt}
            >
              {opt}% OFF
            </button>
          ))}
        </div>

        {/* Current status */}
        <div className="status-card">
          <div className="status-label">📢 Currently active:</div>
          <div className={`status-value ${selected ? 'status-value-active' : 'status-value-inactive'}`}>
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

        {saved && (
          <div className="success-message">
            <div className="success-message-main">
              ✓ Saved! Home page pe redirect ho raha hai...
            </div>
            <div className="success-message-sub">
              All users worldwide will now see the {selected}% OFF banner and discounts!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}