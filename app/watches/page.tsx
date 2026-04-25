"use client";

import Link from "next/link";
import "@/app/styles/product-grid.css";
import ProductGrid from "../components/ProductGrid";

const SUBCATEGORIES = [
  {
    name: "Men Watches",
    href: "/watches/men-watches",
    description: "Classic and modern timepieces for men",
  },
  {
    name: "Women Watches",
    href: "/watches/women-watches",
    description: "Elegant designs for every occasion",
  },
  {
    name: "Smart Watches",
    href: "/watches/smart-watches",
    description: "Feature-packed fitness and smartwatches",
  },
  {
    name: "Luxury Watches",
    href: "/watches/luxury-watches",
    description: "Premium craftsmanship and luxury brands",
  },
];

export default function Watches() {
  return (
    <div className="sub-root">
      <div className="sub-ambient" aria-hidden="true" />
      <div className="sub-grain" aria-hidden="true" />
      <div className="sub-lines" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className="sub-hero">
        <div className="sub-hero-inner">
          <div className="sub-breadcrumb">
            <Link href="/" className="sub-breadcrumb-link">
              Home
            </Link>
            <span className="sub-breadcrumb-sep">/</span>
            <span className="sub-breadcrumb-current">Watches</span>
          </div>
          <h1 className="sub-title">
            Timeless <em>Watches</em>
          </h1>
          <p className="sub-description">
            Discover our collection of exquisite timepieces for every style
          </p>
          <div className="sub-deco">
            <div className="sub-deco-line" />
            <div className="sub-deco-diamond" />
            <div className="sub-deco-line" />
          </div>
        </div>
      </div>

      <div className="sub-main">
        <div className="cat-subnav">
          {SUBCATEGORIES.map((cat) => (
            <Link key={cat.name} href={cat.href} className="cat-subnav-item">
              <span className="cat-subnav-name">{cat.name}</span>
              <span className="cat-subnav-desc">{cat.description}</span>
            </Link>
          ))}
        </div>

        <div className="cat-section">
          <div className="cat-section-header">
            <h2 className="cat-section-title">All Watches</h2>
            <div className="cat-section-line" />
          </div>
          <ProductGrid category="Watches" />
        </div>
      </div>
    </div>
  );
}
