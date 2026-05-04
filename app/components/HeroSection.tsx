"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import "./hero.css";

/* ──────────────────────────────────────────
   SLIDE DATA
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
    placeholderClass: "hero-ph-3",
  },
];

/* ── Single shared CDN loader — runs only once per tab session ── */
let swiperCDNLoaded = false;
let swiperCDNLoading: Promise<void> | null = null;

function loadSwiperCDN(): Promise<void> {
  // Already available
  if (typeof window !== "undefined" && (window as any).Swiper) {
    swiperCDNLoaded = true;
    return Promise.resolve();
  }
  // Already loaded/loading
  if (swiperCDNLoaded) return Promise.resolve();
  if (swiperCDNLoading) return swiperCDNLoading;

  swiperCDNLoading = new Promise<void>((resolve) => {
    // Inject CSS
    if (!document.querySelector("link[data-swiper-css]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css";
      link.setAttribute("data-swiper-css", "1");
      document.head.appendChild(link);
    }

    // Inject JS
    if (!document.querySelector("script[data-swiper-js]")) {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";
      script.setAttribute("data-swiper-js", "1");
      script.onload = () => {
        swiperCDNLoaded = true;
        resolve();
      };
      script.onerror = () => {
        // CDN failed — resolve anyway so UI doesn't hang
        swiperCDNLoading = null;
        resolve();
      };
      document.head.appendChild(script);
    } else {
      // Script tag exists, wait for Swiper to be available
      const poll = setInterval(() => {
        if ((window as any).Swiper) {
          clearInterval(poll);
          swiperCDNLoaded = true;
          resolve();
        }
      }, 50);
      // Give up after 5s
      setTimeout(() => {
        clearInterval(poll);
        resolve();
      }, 5000);
    }
  });

  return swiperCDNLoading;
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const swiperInstanceRef = useRef<any>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [ready, setReady] = useState(false);

  /* ── Init Swiper ── */
  const initSwiper = useCallback(() => {
    if (!containerRef.current || !(window as any).Swiper) return;

    // Destroy existing instance cleanly
    if (swiperInstanceRef.current?.destroy) {
      swiperInstanceRef.current.destroy(true, true);
      swiperInstanceRef.current = null;
    }

    const section = containerRef.current.closest(".hero-section");

    swiperInstanceRef.current = new (window as any).Swiper(
      containerRef.current,
      {
        effect: "fade",
        fadeEffect: { crossFade: true },
        speed: 1300,
        autoplay: {
          delay: 6500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },
        loop: true,
        grabCursor: true,
        touchRatio: 1,
        touchAngle: 45,
        simulateTouch: true,
        pagination: {
          el: containerRef.current.querySelector(".hero-pagination"),
          clickable: true,
        },
        navigation: {
          nextEl: section?.querySelector(".hero-nav-next") ?? null,
          prevEl: section?.querySelector(".hero-nav-prev") ?? null,
        },
        on: {
          realIndexChange(swiper: any) {
            setCurrentSlide((swiper.realIndex ?? 0) + 1);
          },
        },
      }
    );

    setReady(true);
  }, []);

  /* ── Load CDN once, then init ── */
  useEffect(() => {
    let cancelled = false;

    loadSwiperCDN().then(() => {
      if (!cancelled) initSwiper();
    });

    return () => {
      cancelled = true;
      if (swiperInstanceRef.current?.destroy) {
        swiperInstanceRef.current.destroy(true, true);
        swiperInstanceRef.current = null;
      }
    };
  }, [initSwiper]);

  const goPrev = () => swiperInstanceRef.current?.slidePrev();
  const goNext = () => swiperInstanceRef.current?.slideNext();

  return (
    <section className="hero-section" aria-label="Hero banner">
      {/* Decorative corners */}
      <div className="hero-corner-tl" aria-hidden="true" />
      <div className="hero-corner-tr" aria-hidden="true" />
      <div className="hero-corner-bl" aria-hidden="true" />
      <div className="hero-corner-br" aria-hidden="true" />

      {/* Slide counter */}
      <div className="hero-counter" aria-hidden="true">
        <span className="hero-counter-num">0{currentSlide}</span>
        <span className="hero-counter-line" />
        <span>0{slides.length}</span>
      </div>

      {/* Scroll hint */}
      <div className="hero-scroll-hint" aria-hidden="true">
        <span>Scroll</span>
        <div className="hero-scroll-line" />
      </div>

      {/* Arrow buttons */}
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

      {/* Swiper container */}
      <div ref={containerRef} className="hero-swiper swiper">
        <div className="swiper-wrapper">
          {slides.map((slide) => (
            <div key={slide.id} className="swiper-slide">
              {/* Background image — always rendered for instant display */}
              {slide.imageSrc ? (
                <Image
                  src={slide.imageSrc}
                  alt={`${slide.headingLine1}${slide.headingItalic} banner`}
                  fill
                  className="hero-slide-img"
                  priority={
                    true
                  } /* ALL slides priority — prevents lazy-load stall */
                  sizes="100vw"
                  quality={85}
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

              {/* Content — always visible, no waiting for JS */}
              <div className="hero-slide-content">
                <p className="hero-badge">{slide.badge}</p>
                <h2 className="hero-heading">
                  {slide.headingLine1}
                  <em>{slide.headingItalic}</em>
                </h2>
                <div className="hero-divider" aria-hidden="true" />
                <p className="hero-para">{slide.para}</p>
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

        <div className="hero-pagination swiper-pagination" />
      </div>
    </section>
  );
}
