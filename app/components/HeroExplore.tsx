"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import "./hero-explore.css";

/* ──────────────────────────────────────────
   HERO EXPLORE SECTION
   Left: Heading + Para + CTA Button
   Right: 4 Images Grid (fully visible, no crop)
────────────────────────────────────────── */

const images = [
  {
    src: "/hero2.png",
    alt: "Luxury Men's Watch",
    label: "Timepieces",
  },
  {
    src: "/hero1.png",
    alt: "Tech Accessories",
    label: "Tech",
  },
  {
    src: "/hero4.png",
    alt: "Home Décor",
    label: "Décor",
  },
  {
    src: "/hero3.png",
    alt: "Women's Watch",
    label: "Elegance",
  },
];

export default function HeroExplore() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            section.classList.add("he-visible");
          }
        });
      },
      { threshold: 0.15 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="he-section"
      aria-label="Explore Aurexia"
    >
      {/* Background Decorations */}
      <div className="he-grain" aria-hidden="true" />
      <div className="he-ambient" aria-hidden="true" />
      <div className="he-orb-left" aria-hidden="true" />
      <div className="he-orb-right" aria-hidden="true" />
      <div className="he-bg-lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* Main Content */}
      <div className="he-container">
        {/* ── LEFT SIDE ── */}
        <div className="he-left">
          {/* Eyebrow */}
          <p className="he-eyebrow">
            <span className="he-eyebrow-dot" />
            Luxury Collections
          </p>

          {/* Heading */}
          <h2 className="he-heading">
            Luxury Tech
            <br />
            <em>&amp; Lifestyle</em>
            <br />
            <span className="he-heading-accent">Essentials</span>
          </h2>

          {/* Decorative line */}
          <div className="he-divider" aria-hidden="true">
            <span className="he-divider-line" />
            <span className="he-divider-diamond" />
            <span className="he-divider-line he-divider-line--short" />
          </div>

          {/* Paragraph */}
          <p className="he-para">
            Discover premium watches, automotive accessories, home décor, and
            modern tech essentials designed for style, performance, and everyday
            living.
          </p>

          {/* CTA Button */}
          <Link href="/accessories" className="he-btn" aria-label="Shop Now">
            <span className="he-btn-text">Shop Now</span>
            <span className="he-btn-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="he-btn-glow" aria-hidden="true" />
          </Link>

          {/* Stats Row */}
          <div className="he-stats">
            <div className="he-stat">
              <span className="he-stat-num">
                500<em>+</em>
              </span>
              <span className="he-stat-label">Products</span>
            </div>
            <div className="he-stat-divider" />
            <div className="he-stat">
              <span className="he-stat-num">
                50<em>k+</em>
              </span>
              <span className="he-stat-label">Customers</span>
            </div>
            <div className="he-stat-divider" />
            <div className="he-stat">
              <span className="he-stat-num">
                4<em>.9★</em>
              </span>
              <span className="he-stat-label">Rating</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDE — 4 Images Grid ── */}
        <div className="he-right">
          {/* Corner ornaments */}
          <div
            className="he-grid-corner he-grid-corner--tl"
            aria-hidden="true"
          />
          <div
            className="he-grid-corner he-grid-corner--br"
            aria-hidden="true"
          />

          <div className="he-grid">
            {images.map((img, i) => (
              <div
                key={i}
                className={`he-img-card he-img-card--${i + 1}`}
                style={{ "--delay": `${i * 0.12}s` } as React.CSSProperties}
              >
                {/* Shimmer */}
                <div className="he-img-shimmer" aria-hidden="true" />
                {/* Label */}
                <span className="he-img-label">{img.label}</span>
                {/* Image */}
                <div className="he-img-wrap">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="he-img"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    quality={85}
                    style={{ objectFit: "cover" }}
                  />
                </div>
                {/* Overlay */}
                <div className="he-img-overlay" aria-hidden="true" />
                {/* Bottom glow bar */}
                <div className="he-img-bar" aria-hidden="true" />
              </div>
            ))}
          </div>

          {/* Floating ring decoration */}
          <div className="he-ring" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
