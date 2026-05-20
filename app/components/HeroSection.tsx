"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";
import "./hero.css";

// ─────────────────────────────────────────────────────────────
// COMPLETE SLIDE DATA WITH ALL TRANSLATIONS
// ─────────────────────────────────────────────────────────────

const headingLine1Translations: Record<
  string,
  Record<"en" | "ar" | "de", string>
> = {
  watches: { en: "Tech4U", ar: "تيك4يو", de: "Tech4U" },
  accessories: { en: "Mobile", ar: "موبايل", de: "Mobil" },
  decor: { en: "Home", ar: "المنزل", de: "Zuhause" },
  automotive: { en: "Auto", ar: "سيارة", de: "Auto" },
};

const headingItalicTranslations: Record<
  string,
  Record<"en" | "ar" | "de", string>
> = {
  watches: { en: " Watches", ar: " ساعات", de: " Uhren" },
  accessories: { en: " Accessories", ar: " إكسسوارات", de: " Zubehör" },
  decor: { en: " Décor", ar: " ديكور", de: " Dekor" },
  automotive: { en: " Motive", ar: " محرك", de: " Antrieb" },
};

const badgeTexts: Record<string, Record<"en" | "ar" | "de", string>> = {
  watches: {
    en: "New Collection 2025",
    ar: "مجموعة جديدة 2025",
    de: "Neue Kollektion 2025",
  },
  accessories: {
    en: "Premium Tech Accessories",
    ar: "إكسسوارات تقنية فاخرة",
    de: "Premium Tech-Zubehör",
  },
  decor: {
    en: "Curated Living",
    ar: "معيشة منسقة",
    de: "Kuratiertes Wohnen",
  },
  automotive: {
    en: "Premium Automotive Gear",
    ar: "معدات سيارات فاخرة",
    de: "Premium-Automobilausrüstung",
  },
};

const paraTexts: Record<string, Record<"en" | "ar" | "de", string>> = {
  watches: {
    en: "Timepieces engineered for those who command attention. Each watch a statement — each second, a signature of precision.",
    ar: "ساعات مصممة لأولئك الذين يلفتون الأنظار. كل ساعة هي بيان - كل ثانية هي توقيع على الدقة.",
    de: "Zeitmesser, die für Aufmerksamkeit sorgen. Jede Uhr eine Aussage - jede Sekunde eine Signatur der Präzision.",
  },
  accessories: {
    en: "Elevate every interaction. Precision-crafted cases, wireless charging, and accessories designed for the discerning.",
    ar: "ارتقِ بكل تفاعل. حقائب مصنوعة بدقة، وشحن لاسلكي، وإكسسوارات مصممة للخبراء.",
    de: "Steigern Sie jede Interaktion. Präzise gefertigte Hüllen, kabelloses Laden und Zubehör für anspruchsvolle Nutzer.",
  },
  decor: {
    en: "Transform your space into a sanctuary. Artisanal pieces that speak in silence — luxury defined by the spaces between.",
    ar: "حوّل مساحتك إلى ملاذ. قطع حرفية تتحدث في صمت - الفخامة تحددها المسافات بينها.",
    de: "Verwandeln Sie Ihren Raum in ein Heiligtum. Kunsthandwerkliche Stücke, die in Stille sprechen - Luxus, definiert durch die Zwischenräume.",
  },
  automotive: {
    en: "Drive with distinction. Premium car accessories, smart tech integration, and luxury finishes for the modern driver who demands excellence on every road.",
    ar: "قد بتميز. إكسسوارات سيارات فاخرة، وتكامل تقني ذكي، ولمسات نهائية فاخرة للسائق العصري الذي يطلب التميز في كل طريق.",
    de: "Fahren Sie mit Stil. Premium-Autozubehör, intelligente Technologieintegration und luxuriöse Oberflächen für den modernen Fahrer, der auf jeder Straße Exzellenz fordert.",
  },
};

const ctaLabels: Record<string, Record<"en" | "ar" | "de", string>> = {
  exploreWatches: {
    en: "Explore Watches",
    ar: "استكشف الساعات",
    de: "Uhren entdecken",
  },
  viewLookbook: {
    en: "View Lookbook",
    ar: "عرض المظهر",
    de: "Lookbook ansehen",
  },
  shopAccessories: {
    en: "Shop Accessories",
    ar: "تسوق الإكسسوارات",
    de: "Zubehör kaufen",
  },
  browseAll: {
    en: "Browse All",
    ar: "تصفح الكل",
    de: "Alle durchsuchen",
  },
  discoverDecor: {
    en: "Discover Décor",
    ar: "اكتشف الديكور",
    de: "Dekor entdecken",
  },
  viewCatalogue: {
    en: "View Catalogue",
    ar: "عرض الكتالوج",
    de: "Katalog ansehen",
  },
  exploreAutomotive: {
    en: "Explore Automotive",
    ar: "استكشف السيارات",
    de: "Automobil entdecken",
  },
  viewCollection: {
    en: "View Collection",
    ar: "عرض المجموعة",
    de: "Kollektion ansehen",
  },
};

const slidesConfig = [
  {
    id: 1,
    type: "watches",
    ctaKey: "exploreWatches",
    ghostKey: "viewLookbook",
    ctaHref: "/watches",
    ghostHref: "/lookbook",
    imageSrc: "/banner1.jpg",
    placeholderClass: "hero-ph-1",
    accentColor: "#daa520",
  },
  {
    id: 2,
    type: "accessories",
    ctaKey: "shopAccessories",
    ghostKey: "browseAll",
    ctaHref: "/accessories",
    ghostHref: "/accessories",
    imageSrc: "/banner2.webp",
    placeholderClass: "hero-ph-2",
    accentColor: "#daa520",
  },
  {
    id: 3,
    type: "decor",
    ctaKey: "discoverDecor",
    ghostKey: "viewCatalogue",
    ctaHref: "/home-decor",
    ghostHref: "/catalogue",
    imageSrc: "/banner3.webp",
    placeholderClass: "hero-ph-3",
    accentColor: "#daa520",
  },
  {
    id: 4,
    type: "automotive",
    ctaKey: "exploreAutomotive",
    ghostKey: "viewCollection",
    ctaHref: "/automotive",
    ghostHref: "/auto-collection",
    imageSrc: "/banner4.png",
    placeholderClass: "hero-ph-4",
    accentColor: "#daa520",
  },
];

// ─────────────────────────────────────────────────────────────
// SWIPER CDN LOADER — no module-level cache (bfcache safe)
// ─────────────────────────────────────────────────────────────
function loadSwiperCDN(): Promise<void> {
  return new Promise<void>((resolve) => {
    // Already loaded
    if (typeof window !== "undefined" && (window as any).Swiper) {
      resolve();
      return;
    }

    // Inject CSS if not there
    if (!document.querySelector("link[data-hero-swiper-css]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css";
      link.setAttribute("data-hero-swiper-css", "1");
      document.head.appendChild(link);
    }

    // If script already injected, poll for Swiper
    if (document.querySelector("script[data-hero-swiper-js]")) {
      const poll = setInterval(() => {
        if ((window as any).Swiper) {
          clearInterval(poll);
          resolve();
        }
      }, 30);
      setTimeout(() => {
        clearInterval(poll);
        resolve();
      }, 5000);
      return;
    }

    // Inject script fresh
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";
    script.setAttribute("data-hero-swiper-js", "1");
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

// ─────────────────────────────────────────────────────────────
// MAGNETIC CURSOR HOOK
// ─────────────────────────────────────────────────────────────
function useMagneticEffect(strength = 0.3) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      el.style.transform = `translateY(-50%) translate(${dx}px, ${dy}px) scale(1.08)`;
    };

    const handleMouseLeave = () => {
      el.style.transform = "translateY(-50%) translate(0,0) scale(1)";
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength]);

  return ref;
}

// ─────────────────────────────────────────────────────────────
// PARTICLE SPARKS COMPONENT
// ─────────────────────────────────────────────────────────────
function GoldParticles() {
  return (
    <div className="hero-particles" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, i) => (
        <span key={i} className={`hero-particle hero-particle-${i + 1}`} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SLIDE NUMBER TICKER
// ─────────────────────────────────────────────────────────────
function SlideCounter({
  current,
  total,
  visible,
}: {
  current: number;
  total: number;
  visible: boolean;
}) {
  return (
    <div
      className="hero-counter"
      aria-hidden="true"
      style={{ visibility: visible ? "visible" : "hidden" }}
    >
      <div className="hero-counter-inner">
        <span className="hero-counter-num">0{current}</span>
        <div className="hero-counter-track">
          <div
            className="hero-counter-progress"
            style={{ width: `${(current / total) * 100}%` }}
          />
        </div>
        <span className="hero-counter-total">0{total}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STATIC SLIDES
// ─────────────────────────────────────────────────────────────
function StaticSlides({
  language,
  isRTL,
}: {
  language: "en" | "ar" | "de";
  isRTL: boolean;
}) {
  return (
    <>
      {slidesConfig.map((slide) => (
        <div key={slide.id} className="swiper-slide">
          <div className="hero-img-parallax">
            {slide.imageSrc ? (
              <Image
                src={slide.imageSrc}
                alt={`${headingLine1Translations[slide.type][language]}${headingItalicTranslations[slide.type][language]} banner`}
                fill
                className="hero-slide-img"
                priority={slide.id === 1}
                sizes="100vw"
                quality={85}
                suppressHydrationWarning
              />
            ) : (
              <div
                className={`hero-slide-placeholder ${slide.placeholderClass}`}
                role="img"
                aria-label={`${headingLine1Translations[slide.type][language]}${headingItalicTranslations[slide.type][language]} background`}
              />
            )}
          </div>

          <div className="hero-slide-overlay" aria-hidden="true" />
          <div className="hero-slide-overlay-vignette" aria-hidden="true" />
          <div className="hero-noise-overlay" aria-hidden="true" />

          <div className="hero-geo-lines" aria-hidden="true">
            <span className="hero-geo-h" />
            <span className="hero-geo-v" />
          </div>

          <div className="hero-slide-content" dir={isRTL ? "rtl" : "ltr"}>
            <div className="hero-badge-wrap">
              <p className="hero-badge">
                <span className="hero-badge-dot" />
                {badgeTexts[slide.type][language]}
                <span className="hero-badge-dot" />
              </p>
            </div>

            <h2 className="hero-heading">
              <span className="hero-heading-line1">
                {headingLine1Translations[slide.type][language]}
              </span>
              <em className="hero-heading-em">
                {headingItalicTranslations[slide.type][language]}
              </em>
            </h2>

            <div className="hero-divider" aria-hidden="true">
              <span className="hero-divider-gem" />
            </div>

            <p className="hero-para">{paraTexts[slide.type][language]}</p>

            <div className="hero-btn-wrap">
              <Link
                href={slide.ctaHref}
                className="hero-btn-primary"
                prefetch={false}
              >
                <span className="hero-btn-primary-bg" aria-hidden="true" />
                <span className="hero-btn-label">
                  {ctaLabels[slide.ctaKey][language]}
                </span>
                <span className="hero-btn-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>

              <Link
                href={slide.ghostHref}
                className="hero-btn-ghost"
                prefetch={false}
              >
                <span className="hero-btn-ghost-fill" aria-hidden="true" />
                <span className="hero-btn-label">
                  {ctaLabels[slide.ghostKey][language]}
                </span>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// NAV BUTTON — with magnetic hover
// ─────────────────────────────────────────────────────────────
function NavButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const ref = useMagneticEffect(0.25);

  return (
    <button
      ref={ref}
      className={`hero-nav-btn hero-nav-${direction}`}
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
      type="button"
    >
      <span className="hero-nav-ripple" aria-hidden="true" />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        {direction === "prev" ? (
          <path
            d="M15 18l-6-6 6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M9 18l6-6-6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// INNER HERO — remounts on bfcache via key prop
// ─────────────────────────────────────────────────────────────
function HeroInner() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const { language, isRTLMode } = useLanguage();

  const containerRef = useRef<HTMLDivElement>(null);
  const swiperInstanceRef = useRef<any>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Custom cursor tracking
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cursor = section.querySelector<HTMLDivElement>(".hero-cursor");
    const cursorDot = section.querySelector<HTMLDivElement>(".hero-cursor-dot");
    if (!cursor || !cursorDot) return;

    let raf: number;
    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const tick = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      cursorDot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    const onEnter = () => {
      cursor.classList.add("hero-cursor--visible");
      cursorDot.classList.add("hero-cursor--visible");
    };
    const onLeave = () => {
      cursor.classList.remove("hero-cursor--visible");
      cursorDot.classList.remove("hero-cursor--visible");
    };

    section.addEventListener("mousemove", onMove);
    section.addEventListener("mouseenter", onEnter);
    section.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseenter", onEnter);
      section.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Swiper init
  useEffect(() => {
    let cancelled = false;

    loadSwiperCDN().then(() => {
      if (cancelled) return;
      if (!containerRef.current) return;

      // Destroy any stale instance
      if (swiperInstanceRef.current?.destroy) {
        try {
          swiperInstanceRef.current.destroy(true, true);
        } catch (e) {}
        swiperInstanceRef.current = null;
      }

      setTimeout(() => {
        if (cancelled || !containerRef.current) return;
        if (!(window as any).Swiper) return;

        try {
          swiperInstanceRef.current = new (window as any).Swiper(
            containerRef.current,
            {
              effect: "fade",
              fadeEffect: { crossFade: true },
              speed: 1400,
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
              on: {
                realIndexChange: (swiper: any) => {
                  setCurrentSlide((swiper.realIndex ?? 0) + 1);
                },
              },
            },
          );
        } catch (err) {
          console.error("Hero Swiper init error:", err);
        }
      }, 100);
    });

    return () => {
      cancelled = true;
      if (swiperInstanceRef.current?.destroy) {
        try {
          swiperInstanceRef.current.destroy(true, true);
        } catch (e) {}
        swiperInstanceRef.current = null;
      }
    };
  }, []);

  // Resize + visibility
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        swiperInstanceRef.current?.update();
      }, 150);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        swiperInstanceRef.current?.autoplay?.start();
      }
    };
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearTimeout(resizeTimeout);
    };
  }, []);

  const goPrev = () => swiperInstanceRef.current?.slidePrev();
  const goNext = () => swiperInstanceRef.current?.slideNext();

  return (
    <section
      ref={sectionRef}
      className="hero-section"
      aria-label="Hero banner"
      dir={isRTLMode ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <div className="hero-cursor" aria-hidden="true">
        <span className="hero-cursor-ring" />
      </div>
      <div className="hero-cursor-dot" aria-hidden="true" />

      <GoldParticles />

      <div className="hero-corner-tl" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="hero-corner-tr" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="hero-corner-bl" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="hero-corner-br" aria-hidden="true">
        <span />
        <span />
      </div>

      <SlideCounter
        current={currentSlide}
        total={slidesConfig.length}
        visible={true}
      />

      <div className="hero-scroll-hint" aria-hidden="true">
        <span className="hero-scroll-text">Scroll</span>
        <div className="hero-scroll-track">
          <div className="hero-scroll-line" />
        </div>
      </div>

      <NavButton direction="prev" onClick={goPrev} />
      <NavButton direction="next" onClick={goNext} />

      <div
        ref={containerRef}
        className="hero-swiper swiper"
        suppressHydrationWarning
      >
        <div className="swiper-wrapper">
          <StaticSlides language={language} isRTL={isRTLMode} />
        </div>
        <div
          className="hero-pagination swiper-pagination"
          suppressHydrationWarning
        />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// bfcache remount is handled by providers.tsx (shellKey)
// ─────────────────────────────────────────────────────────────
export default function HeroSection() {
  return <HeroInner />;
}
