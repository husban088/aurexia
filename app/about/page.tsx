"use client";

import Link from "next/link";
import "./about.css";

/* ═══════════════════════════════════════════
   STATIC DATA — defined at module level so
   they are never re-created on re-renders
═══════════════════════════════════════════ */
const values = [
  {
    num: "01",
    title: "Craftsmanship",
    desc: "Every piece is born from hours of meticulous handwork, blending old-world artisan skill with modern precision engineering.",
  },
  {
    num: "02",
    title: "Exclusivity",
    desc: "Our collections are strictly limited. When you wear Tech4U, you wear something few in the world ever will.",
  },
  {
    num: "03",
    title: "Legacy",
    desc: "We design heirlooms — objects meant to outlast trends, seasons, and generations.",
  },
  {
    num: "04",
    title: "Integrity",
    desc: "Transparent sourcing, ethical production, and honest pricing. Luxury without compromise.",
  },
];

const stats = [
  { value: "2024", label: "Founded" },
  { value: "48+", label: "Timepieces" },
  { value: "12K+", label: "Members" },
  { value: "99%", label: "Satisfaction" },
];

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function About() {
  return (
    <div className="ab-root">
      {/* Ambient bg */}
      <div className="ab-ambient" aria-hidden="true" />
      <div className="ab-grain" aria-hidden="true" />

      {/* Vertical lines */}
      <div className="ab-lines" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <span key={i} />
        ))}
      </div>

      {/* Corner marks */}
      <div className="ab-corner ab-corner--tl" aria-hidden="true" />
      <div className="ab-corner ab-corner--tr" aria-hidden="true" />

      {/* ══ HERO ══ */}
      <section className="ab-hero">
        <div className="ab-hero-inner">
          <p className="ab-eyebrow">
            <span className="ab-ey-line" />
            Our Story
            <span className="ab-ey-line" />
          </p>
          <h1 className="ab-hero-title">
            Born from a <em>Passion</em>
            <br />
            for timeless <em>Elegance.</em>
          </h1>
          <p className="ab-hero-sub">
            Tech4U was founded on a single belief — that luxury should feel
            personal, not distant. From our first timepiece to our latest mobile
            accessory, every object carries that promise.
          </p>

          {/* Stat strip */}
          <div className="ab-stats">
            {stats.map((s) => (
              <div key={s.label} className="ab-stat">
                <span className="ab-stat-value">{s.value}</span>
                <span className="ab-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative watch ring */}
        <div className="ab-hero-ring" aria-hidden="true">
          <div className="ab-ring-1" />
          <div className="ab-ring-2" />
          <div className="ab-ring-dot" />
        </div>
      </section>

      {/* ══ BRAND STATEMENT ══ */}
      <section className="ab-statement">
        <div className="ab-statement-inner">
          <div className="ab-statement-num" aria-hidden="true">
            ✦
          </div>
          <blockquote className="ab-statement-quote">
            "We do not simply sell watches. We offer you a relationship with
            time — intimate, deliberate, and yours alone."
          </blockquote>
        </div>
      </section>

      {/* ══ VALUES ══ */}
      <section className="ab-values">
        <div className="ab-section-header">
          <p className="ab-eyebrow">
            <span className="ab-ey-line" />
            What We Stand For
            <span className="ab-ey-line" />
          </p>
          <h2 className="ab-section-title">
            Our <em>Values</em>
          </h2>
        </div>

        <div className="ab-values-grid">
          {values.map((v) => (
            <div key={v.num} className="ab-value-card">
              <span className="ab-value-num" aria-hidden="true">
                {v.num}
              </span>
              <h3 className="ab-value-title">{v.title}</h3>
              <p className="ab-value-desc">{v.desc}</p>
              <div className="ab-value-line" aria-hidden="true" />
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="ab-cta">
        <div className="ab-cta-inner">
          <p className="ab-eyebrow">
            <span className="ab-ey-line" />
            Begin Your Journey
            <span className="ab-ey-line" />
          </p>
          <h2 className="ab-cta-title">
            Ready to wear <em>Tech4U?</em>
          </h2>
          <div className="ab-cta-btns">
            <Link href="/watches" className="ab-cta-btn ab-cta-btn--primary">
              <span>Explore Collections</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="14"
                height="14"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link href="/contact" className="ab-cta-btn ab-cta-btn--ghost">
              <span>Contact Us</span>
            </Link>
          </div>
        </div>

        {/* Deco rings */}
        <div className="ab-cta-ring ab-cta-ring--1" aria-hidden="true" />
        <div className="ab-cta-ring ab-cta-ring--2" aria-hidden="true" />
      </section>
    </div>
  );
}
