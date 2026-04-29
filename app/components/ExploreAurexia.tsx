"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "./explore-aurexia.css";

/* ──────────────────────────────────────────
   CATEGORY DATA
   imageSrc: apni real images daalo public/ folder mein
────────────────────────────────────────── */
const categories = [
  {
    id: 1,
    label: "Men's",
    title: "Gentleman's",
    titleItalic: " Timepieces",
    sub: "Precision. Power. Legacy.",
    para: "Crafted for the man who moves the world. Surgical steel, sapphire crystal — worn on the wrist of ambition.",
    cta: { label: "Explore Men's Watches", href: "/watches/men" },
    imageSrc: "/menwatch.jpg",
    placeholderClass: "ea-ph-men",
    tag: "Watches",
    accentColor: "#b8963e",
  },
  {
    id: 2,
    label: "Women's",
    title: "Feminine",
    titleItalic: " Elegance",
    sub: "Grace. Radiance. Statement.",
    para: "Where luxury meets femininity. Diamond-set dials and rose gold bracelet — time, reimagined as jewellery.",
    cta: { label: "Explore Women's Watches", href: "/watches/women" },
    imageSrc: "/womenwatch.jpg",
    placeholderClass: "ea-ph-women",
    tag: "Watches",
    accentColor: "#c9a96e",
  },
  {
    id: 3,
    label: "Mobile",
    title: "Tech",
    titleItalic: " Accessories",
    sub: "Minimal. Smart. Refined.",
    para: "Precision-engineered accessories for the connected generation — cases, chargers and earbuds that elevate every touchpoint.",
    cta: { label: "Shop Accessories", href: "/accessories" },
    imageSrc: "/mobacc.webp",
    placeholderClass: "ea-ph-mobile",
    tag: "Accessories",
    accentColor: "#8fa3b1",
  },
  {
    id: 4,
    label: "Home",
    title: "Living",
    titleItalic: " Décor",
    sub: "Atmosphere. Artistry. Space.",
    para: "Curated pieces that transform four walls into a sanctuary. Artisanal objects that speak in the language of silence.",
    cta: { label: "Discover Décor", href: "/home-decor" },
    imageSrc: "/homedecor.jpg",
    placeholderClass: "ea-ph-decor",
    tag: "Décor",
    accentColor: "#a07850",
  },
];

export default function ExploreAurexia() {
  const [mounted, setMounted] = useState(false);

  /* ── Refs ─────────────────────────────────────── */
  const swiperRef = useRef<HTMLDivElement>(null);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const swiperInstRef = useRef<any>(null);

  /* ── Mount check ──────────────────────────────── */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ── Init Swiper ──────────────────────────────── */
  const initSwiper = useCallback(() => {
    // Only run on client side and if all refs exist
    if (typeof window === "undefined") return;
    if (
      !swiperRef.current ||
      !prevBtnRef.current ||
      !nextBtnRef.current ||
      !paginationRef.current
    )
      return;

    /* Destroy previous instance cleanly */
    if (swiperInstRef.current) {
      swiperInstRef.current.destroy(true, true);
      swiperInstRef.current = null;
    }

    swiperInstRef.current = new (window as any).Swiper(swiperRef.current, {
      /* Layout — centeredSlides OFF to prevent clipping */
      slidesPerView: 1,
      spaceBetween: 20,
      centeredSlides: false,

      breakpoints: {
        480: { slidesPerView: 1.3, spaceBetween: 20 },
        640: { slidesPerView: 1.6, spaceBetween: 24 },
        900: { slidesPerView: 2.2, spaceBetween: 28 },
        1200: { slidesPerView: 3, spaceBetween: 32 },
        1440: { slidesPerView: 3, spaceBetween: 36 },
      },

      /* Drag / touch */
      grabCursor: true,
      touchRatio: 1,
      touchAngle: 45,
      simulateTouch: true,
      touchStartPreventDefault: false,

      /* Loop */
      loop: true,

      /* Autoplay */
      autoplay: {
        delay: 3800,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },

      speed: 900,

      /* Pass DOM refs directly — avoids global selector conflicts */
      navigation: {
        nextEl: nextBtnRef.current,
        prevEl: prevBtnRef.current,
      },

      pagination: {
        el: paginationRef.current,
        clickable: true,
        dynamicBullets: true,
      },

      /* Re-calc on resize / DOM changes */
      observer: true,
      observeParents: true,
      resizeObserver: true,
    });
  }, []);

  /* ── Load CDN → Init ──────────────────────────── */
  useEffect(() => {
    if (!mounted) return;

    const load = async () => {
      // Only run on client side
      if (typeof window === "undefined") return;

      if (!document.querySelector("link[data-swiper-css]")) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css";
        link.setAttribute("data-swiper-css", "1");
        document.head.appendChild(link);
      }

      if (!(window as any).Swiper) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";
          script.setAttribute("data-swiper-js", "1");
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Swiper CDN failed"));
          document.head.appendChild(script);
        });
      }

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initSwiper();
      }, 100);
    };

    load().catch(console.error);

    return () => {
      if (swiperInstRef.current) {
        swiperInstRef.current.destroy?.(true, true);
        swiperInstRef.current = null;
      }
    };
  }, [mounted, initSwiper]);

  const goPrev = () => {
    if (swiperInstRef.current) {
      swiperInstRef.current.slidePrev();
    }
  };

  const goNext = () => {
    if (swiperInstRef.current) {
      swiperInstRef.current.slideNext();
    }
  };

  // Server-side fallback - show loading state
  if (!mounted) {
    return (
      <section className="ea-section" aria-label="Explore Aurexia Categories">
        <div className="ea-header">
          <p className="ea-header-eyebrow">
            <span className="ea-eyebrow-line" />
            Curated Collections
            <span className="ea-eyebrow-line" />
          </p>
          <h2 className="ea-header-title">
            Explore <em>Tech4U</em>
          </h2>
          <p className="ea-header-sub">
            Four worlds of luxury. One destination. Yours to discover.
          </p>
        </div>
        <div className="ea-slider-wrap">
          <div className="ea-loading">
            <div className="ea-loading-spinner"></div>
            <p>Loading categories...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="ea-section" aria-label="Explore Aurexia Categories">
      {/* Grain */}
      <div className="ea-grain" aria-hidden="true" />

      {/* Bg lines */}
      <div className="ea-bg-lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* Header */}
      <div className="ea-header">
        <p className="ea-header-eyebrow">
          <span className="ea-eyebrow-line" />
          Curated Collections
          <span className="ea-eyebrow-line" />
        </p>
        <h2 className="ea-header-title">
          Explore <em>Tech4U</em>
        </h2>
        <p className="ea-header-sub">
          Four worlds of luxury. One destination. Yours to discover.
        </p>
      </div>

      {/* Slider */}
      <div className="ea-slider-wrap">
        <button
          ref={prevBtnRef}
          className="ea-nav-btn ea-nav-prev"
          onClick={goPrev}
          aria-label="Previous category"
          type="button"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              d="M15 18l-6-6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          ref={nextBtnRef}
          className="ea-nav-btn ea-nav-next"
          onClick={goNext}
          aria-label="Next category"
          type="button"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              d="M9 18l6-6-6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div ref={swiperRef} className="ea-swiper swiper">
          <div className="swiper-wrapper">
            {categories.map((cat) => (
              <div key={cat.id} className="swiper-slide ea-slide">
                <article
                  className="ea-card"
                  style={
                    { "--ea-accent": cat.accentColor } as React.CSSProperties
                  }
                >
                  <div className="ea-card-img-wrap">
                    {cat.imageSrc ? (
                      <Image
                        src={cat.imageSrc}
                        alt={`${cat.title}${cat.titleItalic}`}
                        fill
                        className="ea-card-img"
                        sizes="(max-width: 640px) 92vw, (max-width: 1200px) 46vw, 33vw"
                        quality={90}
                      />
                    ) : (
                      <div
                        className={`ea-card-placeholder ${cat.placeholderClass}`}
                        role="img"
                        aria-label={`${cat.title}${cat.titleItalic}`}
                      />
                    )}
                    <div className="ea-card-overlay-base" aria-hidden="true" />
                    <div className="ea-card-overlay-hover" aria-hidden="true" />
                    <span className="ea-card-tag">{cat.tag}</span>
                    <span className="ea-card-label" aria-hidden="true">
                      {cat.label}
                    </span>
                  </div>

                  <div className="ea-card-body">
                    <p className="ea-card-sub">{cat.sub}</p>
                    <h3 className="ea-card-title">
                      {cat.title}
                      <em>{cat.titleItalic}</em>
                    </h3>
                    <div className="ea-card-divider" aria-hidden="true" />
                    <p className="ea-card-para">{cat.para}</p>
                    <Link href={cat.cta.href} className="ea-card-cta">
                      <span>{cat.cta.label}</span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M5 12h14M12 5l7 7-7 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </div>

                  <div
                    className="ea-card-corner ea-card-corner--tl"
                    aria-hidden="true"
                  />
                  <div
                    className="ea-card-corner ea-card-corner--br"
                    aria-hidden="true"
                  />
                </article>
              </div>
            ))}
          </div>

          <div
            ref={paginationRef}
            className="ea-pagination swiper-pagination"
          />
        </div>
      </div>

      {/* Footer ornament */}
      <div className="ea-footer-ornament" aria-hidden="true">
        <span className="ea-orn-line" />
        <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
          <polygon points="10,1 12.9,7 19.5,8.1 14.7,12.7 16,19.5 10,16.2 4,19.5 5.3,12.7 0.5,8.1 7.1,7" />
        </svg>
        <span className="ea-orn-line" />
      </div>
    </section>
  );
}
