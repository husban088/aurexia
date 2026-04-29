"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import "./hero.css";

/* ──────────────────────────────────────────
   SLIDE DATA
   imageSrc: null  →  shows placeholder bg
   imageSrc: "/images/banner-watches.jpg"
   → shows your real image (object-fit:cover)

   HOW TO ADD REAL IMAGES:
   1. Create folder:  public/images/
   2. Put your jpg/png files there
   3. Replace null with the path string below
────────────────────────────────────────── */
const slides = [
  {
    id: 1,
    badge: "New Collection 2025",
    headingLine1: "Tech4U",
    headingItalic: " Watches",
    para: "Timepieces engineered for those who command attention. Each watch a statement — each second, a signature of precision.",
    cta: { label: "Explore Watches", href: "/watches" },
    ghost: { label: "View Lookbook", href: "/lookbook" },
    imageSrc: "/banner1.jpg",
    /* ↑ Replace with: "/images/banner-watches.jpg" */
    placeholderClass: "hero-ph-1",
  },
  {
    id: 2,
    badge: "Premium Tech Accessories",
    headingLine1: "Mobile",
    headingItalic: " Accessories",
    para: "Elevate every interaction. Precision-crafted cases, wireless charging, and accessories designed for the discerning.",
    cta: { label: "Shop Accessories", href: "/accessories" },
    ghost: { label: "Browse All", href: "/accessories" },
    imageSrc: "/banner2.webp",
    /* ↑ Replace with: "/images/banner-accessories.jpg" */
    placeholderClass: "hero-ph-2",
  },
  {
    id: 3,
    badge: "Curated Living",
    headingLine1: "Home",
    headingItalic: " Décor",
    para: "Transform your space into a sanctuary. Artisanal pieces that speak in silence — luxury defined by the spaces between.",
    cta: { label: "Discover Décor", href: "/home-decor" },
    ghost: { label: "View Catalogue", href: "/catalogue" },
    imageSrc: "/banner3.webp",
    /* ↑ Replace with: "/images/banner-decor.jpg" */
    placeholderClass: "hero-ph-3",
  },
];

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const swiperInstanceRef = useRef<any>(null);
  const [currentSlide, setCurrentSlide] = useState(1);

  /* ── Load Swiper from CDN once, then initialise ── */
  const initSwiper = useCallback(() => {
    if (!containerRef.current) return;
    if (swiperInstanceRef.current) {
      swiperInstanceRef.current.destroy(true, true);
    }

    swiperInstanceRef.current = new (window as any).Swiper(
      containerRef.current,
      {
        /* Fade effect */
        effect: "fade",
        fadeEffect: { crossFade: true },
        speed: 1300,

        /* Autoplay */
        autoplay: {
          delay: 6500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },

        /* Loop */
        loop: true,

        /* Touch / mouse drag — enabled by default in Swiper */
        grabCursor: true,
        touchRatio: 1,
        touchAngle: 45,
        simulateTouch: true,

        /* Pagination */
        pagination: {
          el: containerRef.current.querySelector(".hero-pagination"),
          clickable: true,
        },

        /* Navigation arrows */
        navigation: {
          nextEl:
            containerRef.current
              .closest(".hero-section")
              ?.querySelector(".hero-nav-next") ?? null,
          prevEl:
            containerRef.current
              .closest(".hero-section")
              ?.querySelector(".hero-nav-prev") ?? null,
        },

        on: {
          realIndexChange(swiper: any) {
            setCurrentSlide((swiper.realIndex ?? 0) + 1);
          },
        },
      }
    );
  }, []);

  useEffect(() => {
    const loadSwiperAndInit = async () => {
      /* 1 — Inject Swiper CSS */
      if (!document.querySelector("link[data-swiper-css]")) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css";
        link.setAttribute("data-swiper-css", "1");
        document.head.appendChild(link);
      }

      /* 2 — Inject Swiper JS (skip if already loaded) */
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

      /* 3 — Init */
      initSwiper();
    };

    loadSwiperAndInit().catch(console.error);

    return () => {
      if (swiperInstanceRef.current?.destroy) {
        swiperInstanceRef.current.destroy(true, true);
      }
    };
  }, [initSwiper]);

  /* ── Manual navigation handlers ── */
  const goPrev = () => swiperInstanceRef.current?.slidePrev();
  const goNext = () => swiperInstanceRef.current?.slideNext();

  return (
    <section className="hero-section" aria-label="Hero banner">
      {/* ── Decorative corner brackets ── */}
      <div className="hero-corner-tl" aria-hidden="true" />
      <div className="hero-corner-tr" aria-hidden="true" />
      <div className="hero-corner-bl" aria-hidden="true" />
      <div className="hero-corner-br" aria-hidden="true" />

      {/* ── Slide counter ── */}
      <div className="hero-counter" aria-hidden="true">
        <span className="hero-counter-num">0{currentSlide}</span>
        <span className="hero-counter-line" />
        <span>0{slides.length}</span>
      </div>

      {/* ── Scroll hint ── */}
      <div className="hero-scroll-hint" aria-hidden="true">
        <span>Scroll</span>
        <div className="hero-scroll-line" />
      </div>

      {/* ── Arrow buttons ── */}
      <button
        className="hero-nav-btn hero-nav-prev"
        onClick={goPrev}
        aria-label="Previous slide"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M15 18l-6-6 6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        className="hero-nav-btn hero-nav-next"
        onClick={goNext}
        aria-label="Next slide"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M9 18l6-6-6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* ── Swiper container ── */}
      <div ref={containerRef} className="hero-swiper swiper">
        <div className="swiper-wrapper">
          {slides.map((slide) => (
            <div key={slide.id} className="swiper-slide">
              {/* Background — real image OR placeholder */}
              {slide.imageSrc ? (
                <Image
                  src={slide.imageSrc}
                  alt={`${slide.headingLine1}${slide.headingItalic} banner`}
                  fill
                  className="hero-slide-img"
                  priority={slide.id === 1}
                  sizes="100vw"
                  quality={90}
                />
              ) : (
                <div
                  className={`hero-slide-placeholder ${slide.placeholderClass}`}
                  role="img"
                  aria-label={`${slide.headingLine1}${slide.headingItalic} background`}
                />
              )}

              {/* Overlay */}
              <div className="hero-slide-overlay" aria-hidden="true" />

              {/* ── CENTER CONTENT ── */}
              <div className="hero-slide-content">
                {/* Badge */}
                <p className="hero-badge">{slide.badge}</p>

                {/* Heading */}
                <h2 className="hero-heading">
                  {slide.headingLine1}
                  <em>{slide.headingItalic}</em>
                </h2>

                {/* Gold divider */}
                <div className="hero-divider" aria-hidden="true" />

                {/* Para */}
                <p className="hero-para">{slide.para}</p>

                {/* Buttons - CHANGED: a tags to Link for page reload navigation */}
                <div className="hero-btn-wrap">
                  <Link href={slide.cta.href} className="hero-btn-primary">
                    {slide.cta.label}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                  <Link href={slide.ghost.href} className="hero-btn-ghost">
                    {slide.ghost.label}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination (inside swiper div so Swiper finds it) */}
        <div className="hero-pagination swiper-pagination" />
      </div>
    </section>
  );
}
