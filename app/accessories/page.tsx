"use client";

import { useState } from "react";
import Link from "next/link";
import ProductGrid from "@/app/components/ProductGrid";
import "@/app/styles/store.css";

const subCategories = [
  {
    id: "",
    label: "All Accessories",
    href: "/accessories",
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
    id: "Chargers",
    label: "Chargers",
    href: "/accessories/chargers",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M5 18H3a2 2 0 01-2-2V8a2 2 0 012-2h16a2 2 0 012 2v8a2 2 0 01-2 2h-2" />
        <path d="M12 22V12l-4 4h8l-4-4" />
      </svg>
    ),
  },
  {
    id: "Cables",
    label: "Cables",
    href: "/accessories/cables",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M17 17H7a5 5 0 010-10h10" />
        <path d="M21 7l-4-4-4 4M17 3v14" />
      </svg>
    ),
  },
  {
    id: "Covers",
    label: "Covers",
    href: "/accessories/covers",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    id: "Screen Protectors",
    label: "Screen Guards",
    href: "/accessories/screen-protectors",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    id: "Earbuds",
    label: "Earbuds",
    href: "/accessories/earbuds",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M3 18v-6a9 9 0 0118 0v6" />
        <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z" />
        <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
      </svg>
    ),
  },
  {
    id: "Power Banks",
    label: "Power Banks",
    href: "/accessories/power-banks",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="7" width="18" height="11" rx="2" />
        <path d="M22 11v3" />
        <path d="M7 12h4l-2 4 4-4h-3" />
      </svg>
    ),
  },
];

export default function Accessories() {
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

      {/* Hero */}
      <div className="st-hero">
        <p className="st-eyebrow">
          <span className="st-ey-line" />
          Aurexia Store
          <span className="st-ey-line" />
        </p>
        <h1 className="st-hero-title">
          Mobile <em>Accessories</em>
        </h1>
        <p className="st-hero-sub">
          Premium chargers, cables, covers, earbuds and more — curated for the
          discerning mobile user.
        </p>

        {/* Deco ring */}
        <div className="st-hero-ring" aria-hidden="true">
          <div className="st-ring" />
          <div className="st-ring-inner" />
          <div className="st-ring-dot" />
        </div>
      </div>

      {/* Category tab bar */}
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

      {/* Products */}
      <div className="st-main">
        <ProductGrid
          category="Accessories"
          subcategory={activeSub || undefined}
          title={
            activeSub ? `<em>${active.label}</em>` : "All <em>Accessories</em>"
          }
        />
      </div>
    </div>
  );
}
