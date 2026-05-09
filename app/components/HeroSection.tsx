"use client";

// ─────────────────────────────────────────────────────────────────────────────
// HeroSection.tsx — Hydration-error-free version
//
// FIX: Instead of conditionally rendering slides based on isMounted,
// we render all slides immediately on both server and client,
// then initialize Swiper after hydration.
// ─────────────────────────────────────────────────────────────────────────────

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
  {
    id: 4,
    badge: "Premium Automotive Gear",
    headingLine1: "Auto",
    headingItalic: " Motive",
    para: "Drive with distinction. Premium car accessories, smart tech integration, and luxury finishes for the modern driver who demands excellence on every road.",
    cta: { label: "Explore Automotive", href: "/automotive" },
    ghost: { label: "View Collection", href: "/auto-collection" },
    imageSrc: "/banner4.png",
    placeholderClass: "hero-ph-4",
  },
];

/* ──────────────────────────────────────────
   SWIPER CDN LOADER
────────────────────────────────────────── */
let swiperCDNLoaded = false;
let swiperCDNLoading: Promise<void> | null = null;

function loadSwiperCDN(): Promise<void> {
  if (typeof window !== "undefined" && (window as any).Swiper) {
    swiperCDNLoaded = true;
    return Promise.resolve();
  }
  if (swiperCDNLoaded) return Promise.resolve();
  if (swiperCDNLoading) return swiperCDNLoading;

  swiperCDNLoading = new Promise<void>((resolve) => {
    if (!document.querySelector("link[data-hero-swiper-css]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css";
      link.setAttribute("data-hero-swiper-css", "1");
      document.head.appendChild(link);
    }

    if (document.querySelector("script[data-hero-swiper-js]")) {
      const poll = setInterval(() => {
        if ((window as any).Swiper) {
          clearInterval(poll);
          swiperCDNLoaded = true;
          swiperCDNLoading = null;
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(poll);
        resolve();
      }, 5000);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";
    script.setAttribute("data-hero-swiper-js", "1");
    script.onload = () => {
      swiperCDNLoaded = true;
      swiperCDNLoading = null;
      resolve();
    };
    script.onerror = () => {
      swiperCDNLoading = null;
      resolve();
    };
    document.head.appendChild(script);
  });

  return swiperCDNLoading;
}

/* ──────────────────────────────────────────
   STATIC SLIDES RENDER (used on both server and client)
────────────────────────────────────────── */
function StaticSlides() {
  return (
    <>
      {slides.map((slide) => (
        <div key={slide.id} className="swiper-slide">
          {/* Background image */}
          {slide.imageSrc ? (
            <Image
              src={slide.imageSrc}
              alt={`${slide.headingLine1}${slide.headingItalic} banner`}
              fill
              className="hero-slide-img"
              priority
              sizes="100vw"
              quality={85}
              suppressHydrationWarning
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

          {/* Content */}
          <div className="hero-slide-content">
            <p className="hero-badge">{slide.badge}</p>
            <h2 className="hero-heading">
              {slide.headingLine1}
              <em>{slide.headingItalic}</em>
            </h2>
            <div className="hero-divider" aria-hidden="true" />
            <p className="hero-para">{slide.para}</p>
            <div className="hero-btn-wrap">
              <Link
                href={slide.cta.href}
                className="hero-btn-primary"
                prefetch={false}
              >
                {slide.cta.label}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link
                href={slide.ghost.href}
                className="hero-btn-ghost"
                prefetch={false}
              >
                {slide.ghost.label}
              </Link>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

/* ──────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────── */
export default function HeroSection() {
  const [isClient, setIsClient] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const swiperInstanceRef = useRef<any>(null);
  const initAttempted = useRef(false);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  // Mark client-side after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  /* ── Swiper init (only on client) ── */
  const initSwiper = useCallback(() => {
    if (typeof window === "undefined") return;
    if (initAttempted.current) return;
    if (!(window as any).Swiper) return;
    if (!containerRef.current) return;

    if (swiperInstanceRef.current?.destroy) {
      try {
        swiperInstanceRef.current.destroy(true, true);
      } catch (e) {}
      swiperInstanceRef.current = null;
    }

    try {
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
            nextEl: nextBtnRef.current,
            prevEl: prevBtnRef.current,
          },
          on: {
            realIndexChange: (swiper: any) => {
              setCurrentSlide((swiper.realIndex ?? 0) + 1);
            },
          },
        },
      );
      initAttempted.current = true;
    } catch (err) {
      console.error("Hero Swiper initialization error:", err);
    }
  }, []);

  // Load CDN and initialize Swiper after client hydration
  useEffect(() => {
    if (!isClient) return;

    let cancelled = false;

    loadSwiperCDN().then(() => {
      if (!cancelled) {
        setTimeout(() => {
          if (!cancelled) initSwiper();
        }, 100);
      }
    });

    return () => {
      cancelled = true;
      if (swiperInstanceRef.current?.destroy) {
        try {
          swiperInstanceRef.current.destroy(true, true);
        } catch (e) {}
        swiperInstanceRef.current = null;
      }
      initAttempted.current = false;
    };
  }, [isClient, initSwiper]);

  // Handle window resize
  useEffect(() => {
    if (!isClient || !swiperInstanceRef.current) return;

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (swiperInstanceRef.current) {
          swiperInstanceRef.current.update();
        }
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isClient]);

  const goPrev = () => swiperInstanceRef.current?.slidePrev();
  const goNext = () => swiperInstanceRef.current?.slideNext();

  return (
    <section
      className="hero-section"
      aria-label="Hero banner"
      suppressHydrationWarning
    >
      {/* Decorative corners */}
      <div className="hero-corner-tl" aria-hidden="true" />
      <div className="hero-corner-tr" aria-hidden="true" />
      <div className="hero-corner-bl" aria-hidden="true" />
      <div className="hero-corner-br" aria-hidden="true" />

      {/* Slide counter - visible on client only */}
      <div
        className="hero-counter"
        aria-hidden="true"
        style={{ visibility: isClient ? "visible" : "hidden" }}
      >
        <span className="hero-counter-num">0{currentSlide}</span>
        <span className="hero-counter-line" />
        <span>0{slides.length}</span>
      </div>

      {/* Scroll hint */}
      <div className="hero-scroll-hint" aria-hidden="true">
        <span>Scroll</span>
        <div className="hero-scroll-line" />
      </div>

      {/* Arrow buttons - always rendered */}
      <button
        ref={prevBtnRef}
        className="hero-nav-btn hero-nav-prev"
        onClick={goPrev}
        aria-label="Previous slide"
        type="button"
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
        ref={nextBtnRef}
        className="hero-nav-btn hero-nav-next"
        onClick={goNext}
        aria-label="Next slide"
        type="button"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M9 18l6-6-6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* 
        CRITICAL FIX: 
        - Render slides on BOTH server and client (same content)
        - This ensures hydration doesn't fail
        - Swiper will enhance the existing DOM after initialization
      */}
      <div
        ref={containerRef}
        className="hero-swiper swiper"
        suppressHydrationWarning
      >
        <div className="swiper-wrapper">
          <StaticSlides />
        </div>

        <div
          className="hero-pagination swiper-pagination"
          suppressHydrationWarning
        />
      </div>
    </section>
  );
}
