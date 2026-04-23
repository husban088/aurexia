"use client";

import { useState } from "react";
import ProductGrid from "@/app/components/ProductGrid";
import "@/app/styles/store.css";

const subCategories = [
  {
    id: "",
    label: "All Gadgets",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "Smart Watches",
    label: "Smart Watches",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="7" />
        <path d="M12 9v3l2 2" />
        <path d="M9.5 3.5l1 3M14.5 3.5l-1 3M9.5 20.5l1-3M14.5 20.5l-1-3" />
      </svg>
    ),
  },
  {
    id: "Small Electronics",
    label: "Electronics",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: "Portable Devices",
    label: "Portable Devices",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
];

export default function GadgetsPage() {
  const [activeSub, setActiveSub] = useState("");
  const active = subCategories.find((s) => s.id === activeSub)!;

  return (
    <div className="st-root">
      <div className="st-ambient" aria-hidden="true" />
      <div className="st-grain" aria-hidden="true" />
      <div className="st-lines" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className="st-hero">
        <p className="st-eyebrow">
          <span className="st-ey-line" />
          Aurexia Store
          <span className="st-ey-line" />
        </p>
        <h1 className="st-hero-title">
          Tech <em>Gadgets</em>
        </h1>
        <p className="st-hero-sub">
          Smart watches, compact electronics and portable devices — technology
          that fits your lifestyle.
        </p>
        <div className="st-hero-ring" aria-hidden="true">
          <div className="st-ring" />
          <div className="st-ring-inner" />
          <div className="st-ring-dot" />
        </div>
      </div>

      <div className="st-cat-bar">
        <div className="st-cat-inner">
          {subCategories.map((s) => (
            <button
              key={s.id}
              className={`st-cat-btn${activeSub === s.id ? " active" : ""}`}
              onClick={() => setActiveSub(s.id)}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="st-main">
        <ProductGrid
          category="Gadgets"
          subcategory={activeSub || undefined}
          title={
            activeSub ? `<em>${active.label}</em>` : "All <em>Gadgets</em>"
          }
        />
      </div>
    </div>
  );
}
