"use client";

import Link from "next/link";
import "@/app/styles/product-grid.css";
import ProductGrid from "../components/ProductGrid";

const SUBCATEGORIES = [
  {
    name: "Chargers",
    href: "/accessories/chargers",
    description: "Fast chargers for all devices",
  },
  {
    name: "Cables",
    href: "/accessories/cables",
    description: "Durable data and charging cables",
  },
  {
    name: "Phone Holders",
    href: "/accessories/phone-holders",
    description: "Secure mounts for your car and desk",
  },
  {
    name: "Tech Gadgets",
    href: "/accessories/tech-gadgets",
    description: "Innovative tech accessories",
  },
  {
    name: "Smart Accessories",
    href: "/accessories/smart-accessories",
    description: "Connected smart devices",
  },
];

export default function Accessories() {
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
            <span className="sub-breadcrumb-current">Accessories</span>
          </div>
          <h1 className="sub-title">
            Premium <em>Accessories</em>
          </h1>
          <p className="sub-description">
            Discover our curated collection of premium mobile and tech
            accessories
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
            <h2 className="cat-section-title">All Accessories</h2>
            <div className="cat-section-line" />
          </div>
          <ProductGrid category="Accessories" />
        </div>
      </div>
    </div>
  );
}
