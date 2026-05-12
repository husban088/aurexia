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
  },
];

// ─────────────────────────────────────────────────────────────
// SWIPER CDN LOADER
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// STATIC SLIDES COMPONENT
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

          <div className="hero-slide-overlay" aria-hidden="true" />

          <div className="hero-slide-content" dir={isRTL ? "rtl" : "ltr"}>
            <p className="hero-badge">{badgeTexts[slide.type][language]}</p>

            <h2 className="hero-heading">
              {headingLine1Translations[slide.type][language]}
              <em>{headingItalicTranslations[slide.type][language]}</em>
            </h2>

            <div className="hero-divider" aria-hidden="true" />

            <p className="hero-para">{paraTexts[slide.type][language]}</p>

            <div className="hero-btn-wrap">
              <Link
                href={slide.ctaHref}
                className="hero-btn-primary"
                prefetch={false}
              >
                {ctaLabels[slide.ctaKey][language]}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link
                href={slide.ghostHref}
                className="hero-btn-ghost"
                prefetch={false}
              >
                {ctaLabels[slide.ghostKey][language]}
              </Link>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN HERO SECTION COMPONENT
// ─────────────────────────────────────────────────────────────
export default function HeroSection() {
  const [isClient, setIsClient] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);
  const { language, isRTLMode } = useLanguage();

  const containerRef = useRef<HTMLDivElement>(null);
  const swiperInstanceRef = useRef<any>(null);
  const initAttempted = useRef(false);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
      dir={isRTLMode ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <div className="hero-corner-tl" aria-hidden="true" />
      <div className="hero-corner-tr" aria-hidden="true" />
      <div className="hero-corner-bl" aria-hidden="true" />
      <div className="hero-corner-br" aria-hidden="true" />

      <div
        className="hero-counter"
        aria-hidden="true"
        style={{ visibility: isClient ? "visible" : "hidden" }}
      >
        <span className="hero-counter-num">0{currentSlide}</span>
        <span className="hero-counter-line" />
        <span>0{slidesConfig.length}</span>
      </div>

      <div className="hero-scroll-hint" aria-hidden="true">
        <span>Scroll</span>
        <div className="hero-scroll-line" />
      </div>

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
