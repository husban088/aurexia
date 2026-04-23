"use client";

import Link from "next/link";
import ProductGrid from "@/app/components/ProductGrid";
import "@/app/store.css";

// ─── Chargers ─────────────────────────────────────────────────────────────────
export function ChargersPage() {
  return (
    <SubPage
      subcategory="Chargers"
      title="<em>Chargers</em>"
      sub="Fast, reliable chargers for every device"
      backHref="/accessories"
      backLabel="Mobile Accessories"
    />
  );
}

export function CablesPage() {
  return (
    <SubPage
      subcategory="Cables"
      title="<em>Cables</em>"
      sub="Durable, tangle-free cables — USB-C, Lightning, Micro-USB and more"
      backHref="/accessories"
      backLabel="Mobile Accessories"
    />
  );
}

export function CoversPage() {
  return (
    <SubPage
      subcategory="Covers"
      title="Phone <em>Covers</em>"
      sub="Protective and stylish covers for all major phone models"
      backHref="/accessories"
      backLabel="Mobile Accessories"
    />
  );
}

export function ScreenProtectorsPage() {
  return (
    <SubPage
      subcategory="Screen Protectors"
      title="Screen <em>Guards</em>"
      sub="Crystal-clear screen protectors — tempered glass and film"
      backHref="/accessories"
      backLabel="Mobile Accessories"
    />
  );
}

export function EarbudsPage() {
  return (
    <SubPage
      subcategory="Earbuds"
      title="<em>Earbuds</em>"
      sub="Wireless and wired earbuds with superior sound quality"
      backHref="/accessories"
      backLabel="Mobile Accessories"
    />
  );
}

export function PowerBanksPage() {
  return (
    <SubPage
      subcategory="Power Banks"
      title="Power <em>Banks</em>"
      sub="High-capacity portable power banks for on-the-go charging"
      backHref="/accessories"
      backLabel="Mobile Accessories"
    />
  );
}

// ─── Gadgets ──────────────────────────────────────────────────────────────────
export function SmartWatchesPage() {
  return (
    <SubPage
      subcategory="Smart Watches"
      title="Smart <em>Watches</em>"
      sub="Feature-packed smartwatches for fitness, health and connectivity"
      backHref="/gadgets"
      backLabel="Gadgets"
    />
  );
}

export function SmallElectronicsPage() {
  return (
    <SubPage
      subcategory="Small Electronics"
      title="Small <em>Electronics</em>"
      sub="Compact electronic devices for everyday convenience"
      backHref="/gadgets"
      backLabel="Gadgets"
    />
  );
}

export function PortableDevicesPage() {
  return (
    <SubPage
      subcategory="Portable Devices"
      title="Portable <em>Devices</em>"
      sub="Lightweight, carry-anywhere devices for work and play"
      backHref="/gadgets"
      backLabel="Gadgets"
    />
  );
}

// ─── Home Decor ───────────────────────────────────────────────────────────────
export function DecorativeLightsPage() {
  return (
    <SubPage
      subcategory="Decorative Lights"
      title="Decorative <em>Lights</em>"
      sub="Ambient lighting to transform your living space"
      backHref="/home-decor"
      backLabel="Home Décor"
    />
  );
}

export function WallItemsPage() {
  return (
    <SubPage
      subcategory="Wall Items"
      title="Wall <em>Items</em>"
      sub="Art, clocks, shelves and décor for your walls"
      backHref="/home-decor"
      backLabel="Home Décor"
    />
  );
}

export function SmallHomeAccessoriesPage() {
  return (
    <SubPage
      subcategory="Small Home Accessories"
      title="Home <em>Accessories</em>"
      sub="Elegant small accessories to elevate every room"
      backHref="/home-decor"
      backLabel="Home Décor"
    />
  );
}

// ─── Shared SubPage shell ─────────────────────────────────────────────────────
function SubPage({
  subcategory,
  title,
  sub,
  backHref,
  backLabel,
}: {
  subcategory: string;
  title: string;
  sub: string;
  backHref: string;
  backLabel: string;
}) {
  // Derive the category from backLabel
  const categoryMap: Record<string, string> = {
    "Mobile Accessories": "Accessories",
    Gadgets: "Gadgets",
    "Home Décor": "Home Decor",
  };
  const category = categoryMap[backLabel] || backLabel;

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
        {/* Breadcrumb */}
        <p className="st-eyebrow">
          <span className="st-ey-line" />
          <Link
            href={backHref}
            style={{
              color: "inherit",
              textDecoration: "none",
              transition: "color 0.3s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--st-gold-light)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.color = "")}
          >
            {backLabel}
          </Link>
          <span style={{ opacity: 0.4 }}>›</span>
          {subcategory}
          <span className="st-ey-line" />
        </p>
        <h1
          className="st-hero-title"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        <p className="st-hero-sub">{sub}</p>

        {/* Deco ring */}
        <div className="st-hero-ring" aria-hidden="true">
          <div className="st-ring" />
          <div className="st-ring-inner" />
          <div className="st-ring-dot" />
        </div>
      </div>

      {/* Products */}
      <div className="st-main">
        <ProductGrid
          category={category}
          subcategory={subcategory}
          title={title}
        />
      </div>
    </div>
  );
}
