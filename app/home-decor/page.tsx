"use client";

import Link from "next/link";
import "@/styles/product-grid.css";
import ProductGrid from "../components/ProductGrid";

const SUBCATEGORIES = [
  {
    name: "Wall Decor",
    href: "/home-decor/wall-decor",
    description: "Art, mirrors, and wall installations",
  },
  {
    name: "Lighting",
    href: "/home-decor/lighting",
    description: "Ambient, task, and decorative lighting",
  },
  {
    name: "Kitchen Essentials",
    href: "/home-decor/kitchen-essentials",
    description: "Premium cookware and tools",
  },
  {
    name: "Storage & Organizers",
    href: "/home-decor/storage-organizers",
    description: "Elegant storage solutions",
  },
];

export default function HomeDecor() {
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
            <span className="sub-breadcrumb-current">Home Decor</span>
          </div>
          <h1 className="sub-title">
            Elegant <em>Home Decor</em>
          </h1>
          <p className="sub-description">
            Transform your living space with our curated collection of premium
            home accessories
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
            <h2 className="cat-section-title">All Home Decor</h2>
            <div className="cat-section-line" />
          </div>
          <ProductGrid category="Home Decor" />
        </div>
      </div>
    </div>
  );
}
