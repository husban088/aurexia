// app/panel/sale/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSalePercent,
  setSalePercent,
  fetchSaleFromDB,
} from "@/lib/saleStore";

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
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#daa520" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "#111",
          border: "1px solid #222",
          borderRadius: "16px",
          padding: "2.5rem",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        }}
      >
        <h1
          style={{
            color: "#daa520",
            fontFamily: "monospace",
            fontSize: "1.5rem",
            marginBottom: "0.5rem",
          }}
        >
          🏷️ Sale Banner Control
        </h1>
        <p
          style={{
            color: "#888",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            marginBottom: "2rem",
          }}
        >
          ✅ Click karo — discount apply hoga aur{" "}
          <strong style={{ color: "#daa520" }}>SAB USERS</strong> ko banner show
          hoga!
        </p>

        {/* Options */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => handleApply(opt)}
              disabled={loading}
              style={{
                flex: 1,
                padding: "1.2rem",
                borderRadius: "12px",
                border:
                  selected === opt ? "2px solid #daa520" : "2px solid #333",
                background:
                  selected === opt ? "rgba(218,165,32,0.15)" : "#1a1a1a",
                color: selected === opt ? "#daa520" : "#888",
                fontFamily: "monospace",
                fontSize: "1.4rem",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {opt}% OFF
            </button>
          ))}
        </div>

        {/* Current status */}
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid #1e1e1e",
            borderRadius: "8px",
            padding: "0.8rem 1rem",
            marginBottom: "1.5rem",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            color: "#555",
          }}
        >
          📢 Currently active:{" "}
          <span
            style={{ color: selected ? "#daa520" : "#444", fontWeight: 600 }}
          >
            {selected
              ? `${selected}% OFF — All customers worldwide will see this discount!`
              : "None (No active sale)"}
          </span>
        </div>

        {/* Remove button */}
        <button
          onClick={handleRemove}
          disabled={loading || !selected}
          style={{
            width: "100%",
            padding: "0.9rem",
            borderRadius: "10px",
            border: "1px solid #333",
            background: "transparent",
            color: "#e05555",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            cursor: loading || !selected ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: loading || !selected ? 0.5 : 1,
          }}
        >
          🗑️ Remove Discount
        </button>

        {saved && (
          <p
            style={{
              color: "#4caf50",
              fontFamily: "monospace",
              fontSize: "0.8rem",
              textAlign: "center",
              marginTop: "1rem",
              background: "rgba(76,175,80,0.1)",
              padding: "8px",
              borderRadius: "8px",
            }}
          >
            ✓ Saved! Home page pe redirect ho raha hai...
            <br />
            <span style={{ fontSize: "0.7rem", color: "#daa520" }}>
              All users worldwide will now see the {selected}% OFF banner and
              discounts!
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
