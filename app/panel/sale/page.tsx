// app/panel/sale/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSalePercent, setSalePercent } from "@/lib/saleStore";

const OPTIONS = [10, 20, 30] as const;

export default function SalePanel() {
  const [selected, setSelected] = useState<10 | 20 | 30 | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setSelected(getSalePercent() as 10 | 20 | 30 | null);
  }, []);

  function handleApply(val: 10 | 20 | 30) {
    // Save karo
    setSalePercent(val);
    setSelected(val);
    setSaved(true);

    // Foran home page pe redirect karo
    setTimeout(() => {
      router.push("/");
    }, 300);
  }

  function handleRemove() {
    setSalePercent(null);
    setSelected(null);
    setSaved(false);
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
          Sale Banner Control
        </h1>
        <p
          style={{
            color: "#888",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            marginBottom: "2rem",
          }}
        >
          Click karo — discount apply hoga aur home page pe banner show hoga.
        </p>

        {/* Options */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => handleApply(opt)}
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
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {opt}%
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
          Currently active:{" "}
          <span style={{ color: selected ? "#daa520" : "#444" }}>
            {selected
              ? `${selected}% OFF — Sab products pe laga hua hai`
              : "None (koi discount nahi)"}
          </span>
        </div>

        {/* Remove button */}
        <button
          onClick={handleRemove}
          style={{
            width: "100%",
            padding: "0.9rem",
            borderRadius: "10px",
            border: "1px solid #333",
            background: "transparent",
            color: "#e05555",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Remove Discount
        </button>

        {saved && (
          <p
            style={{
              color: "#4caf50",
              fontFamily: "monospace",
              fontSize: "0.8rem",
              textAlign: "center",
              marginTop: "1rem",
            }}
          >
            ✓ Saved! Home page pe redirect ho raha hai...
          </p>
        )}
      </div>
    </div>
  );
}
