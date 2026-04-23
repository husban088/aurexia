"use client";

import { useState } from "react";
import ProductGrid from "@/app/components/ProductGrid";
import "@/app/store.css";

const subCategories = [
  {
    id: "",
    label: "All Décor",
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
    id: "Decorative Lights",
    label: "Dec. Lights",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
      </svg>
    ),
  },
  {
    id: "Wall Items",
    label: "Wall Items",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    id: "Small Home Accessories",
    label: "Home Acc.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
];

export default function HomeDecor() {
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
          Home <em>Décor</em>
        </h1>
        <p className="st-hero-sub">
          Decorative lights, wall art and tasteful accessories to bring warmth
          and elegance to your living space.
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
          category="Home Decor"
          subcategory={activeSub || undefined}
          title={activeSub ? `<em>${active.label}</em>` : "Home <em>Décor</em>"}
        />
      </div>
    </div>
  );
}
