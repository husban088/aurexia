"use client";

import Link from "next/link";
import ProductGrid from "./ProductGrid";
import "../styles/product-grid.css";

interface SubcategoryPageProps {
  category: string;
  subcategory: string;
  title: string;
  description: string;
  breadcrumb: {
    parent: string;
    parentHref: string;
  };
}

export default function Subcategory({
  category,
  subcategory,
  title,
  description,
  breadcrumb,
}: SubcategoryPageProps) {
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
            <Link href={breadcrumb.parentHref} className="sub-breadcrumb-link">
              {breadcrumb.parent}
            </Link>
            <span className="sub-breadcrumb-sep">/</span>
            <span className="sub-breadcrumb-current">{subcategory}</span>
          </div>

          <h1
            className="sub-title"
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <p className="sub-description">{description}</p>

          <div className="sub-deco">
            <div className="sub-deco-line" />
            <div className="sub-deco-diamond" />
            <div className="sub-deco-line" />
          </div>
        </div>
      </div>

      <div className="sub-main">
        <ProductGrid category={category} subcategory={subcategory} />
      </div>
    </div>
  );
}
