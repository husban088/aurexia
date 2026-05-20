"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";
import "./explore-aurexia.css";

/* ──────────────────────────────────────────
   COMPLETE TRANSLATIONS FOR ALL CATEGORIES
────────────────────────────────────────── */

const categoryTranslations = {
  labelMen: { en: "Men's", ar: "رجالي", de: "Herren" },
  labelWomen: { en: "Women's", ar: "نسائي", de: "Damen" },
  labelMobile: { en: "Mobile", ar: "جوال", de: "Mobil" },
  labelHome: { en: "Home", ar: "المنزل", de: "Zuhause" },
  titleGentleman: { en: "Gentleman's", ar: "الأناقة", de: "Gentleman" },
  titleFeminine: { en: "Feminine", ar: "الأنوثة", de: "Weiblich" },
  titleTech: { en: "Tech", ar: "تقنية", de: "Technik" },
  titleLiving: { en: "Living", ar: "المعيشة", de: "Wohnen" },
  italicTimepieces: { en: " Timepieces", ar: " الزمنية", de: " Zeitmesser" },
  italicElegance: { en: " Elegance", ar: " الرقي", de: " Eleganz" },
  italicAccessories: { en: " Accessories", ar: " الإكسسوارات", de: " Zubehör" },
  italicDecor: { en: " Décor", ar: " الديكور", de: " Dekor" },
  subGentleman: {
    en: "Precision. Power. Legacy.",
    ar: "دقة. قوة. إرث.",
    de: "Präzision. Kraft. Vermächtnis.",
  },
  subWomen: {
    en: "Grace. Radiance. Statement.",
    ar: "رشاقة. إشراق. بيان.",
    de: "Anmut. Ausstrahlung. Statement.",
  },
  subMobile: {
    en: "Minimal. Smart. Refined.",
    ar: "بسيط. ذكي. راقي.",
    de: "Minimal. Smart. Raffiniert.",
  },
  subHome: {
    en: "Atmosphere. Artistry. Space.",
    ar: "جو. فن. مساحة.",
    de: "Atmosphäre. Kunst. Raum.",
  },
  paraMen: {
    en: "Crafted for the man who moves the world. Surgical steel, sapphire crystal — worn on the wrist of ambition.",
    ar: "مصممة للرجل الذي يحرك العالم. فولاذ جراحي، كريستال ياقوتي — يرتديها معصم الطموح.",
    de: "Gefertigt für den Mann, der die Welt bewegt. Chirurgenstahl, Saphirglas — getragen am Handgelenk des Ehrgeizes.",
  },
  paraWomen: {
    en: "Where luxury meets femininity. Diamond-set dials and rose gold bracelet — time, reimagined as jewellery.",
    ar: "حيث تلتقي الفخامة بالأنوثة. موانئ مرصعة بالألماس وسوار من الورد الذهبي — الوقت، معاد تصوره كمجوهرات.",
    de: "Wo Luxus auf Weiblichkeit trifft. Diamantbesetzte Zifferblätter und Armband aus Roségold — Zeit, neu interpretiert als Schmuck.",
  },
  paraMobile: {
    en: "Precision-engineered accessories for the connected generation — cases, chargers and earbuds that elevate every touchpoint.",
    ar: "إكسسوارات هندسية دقيقة للجيل المتصل — حوافظ، شواحن، وسماعات أذن ترفع كل نقطة اتصال.",
    de: "Präzise gefertigtes Zubehör für die vernetzte Generation — Hüllen, Ladegeräte und Ohrhörer, die jeden Berührungspunkt aufwerten.",
  },
  paraHome: {
    en: "Curated pieces that transform four walls into a sanctuary. Artisanal objects that speak in the language of silence.",
    ar: "قطع منسقة تحول الجدران الأربعة إلى ملاذ. أشياء حرفية تتحدث بلغة الصمت.",
    de: "Kuratierte Stücke, die vier Wände in ein Heiligtum verwandeln. Kunsthandwerkliche Objekte, die in der Sprache der Stille sprechen.",
  },
  ctaMen: {
    en: "Explore Men's Watches",
    ar: "استكشف ساعات الرجال",
    de: "Herrenuhren entdecken",
  },
  ctaWomen: {
    en: "Explore Women's Watches",
    ar: "استكشف ساعات النساء",
    de: "Damenuhren entdecken",
  },
  ctaMobile: {
    en: "Shop Accessories",
    ar: "تسوق الإكسسوارات",
    de: "Zubehör kaufen",
  },
  ctaHome: { en: "Discover Décor", ar: "اكتشف الديكور", de: "Dekor entdecken" },
  tagWatches: { en: "Watches", ar: "ساعات", de: "Uhren" },
  tagAccessories: { en: "Accessories", ar: "إكسسوارات", de: "Zubehör" },
  tagDecor: { en: "Décor", ar: "ديكور", de: "Dekor" },
  eyebrowText: {
    en: "Curated Collections",
    ar: "مجموعات منسقة",
    de: "Kurierte Kollektionen",
  },
  headerTitle: { en: "Explore", ar: "استكشف", de: "Entdecken Sie" },
  brandName: { en: "Tech4U", ar: "تيك4يو", de: "Tech4U" },
  headerSub: {
    en: "Four worlds of luxury. One destination. Yours to discover.",
    ar: "أربعة عوالم من الفخامة. وجهة واحدة. لك لكتشفها.",
    de: "Vier Welten des Luxus. Ein Ziel. Zu entdecken.",
  },
};

const categories = [
  {
    id: 1,
    labelKey: "labelMen",
    titleKey: "titleGentleman",
    italicKey: "italicTimepieces",
    subKey: "subGentleman",
    paraKey: "paraMen",
    ctaKey: "ctaMen",
    href: "/watches/men",
    imageSrc: "/menwatch.jpg",
    placeholderClass: "ea-ph-men",
    tagKey: "tagWatches",
    accentColor: "#b8963e",
  },
  {
    id: 2,
    labelKey: "labelWomen",
    titleKey: "titleFeminine",
    italicKey: "italicElegance",
    subKey: "subWomen",
    paraKey: "paraWomen",
    ctaKey: "ctaWomen",
    href: "/watches/women",
    imageSrc: "/womenwatch.jpg",
    placeholderClass: "ea-ph-women",
    tagKey: "tagWatches",
    accentColor: "#c9a96e",
  },
  {
    id: 3,
    labelKey: "labelMobile",
    titleKey: "titleTech",
    italicKey: "italicAccessories",
    subKey: "subMobile",
    paraKey: "paraMobile",
    ctaKey: "ctaMobile",
    href: "/accessories",
    imageSrc: "/mobacc.webp",
    placeholderClass: "ea-ph-mobile",
    tagKey: "tagAccessories",
    accentColor: "#8fa3b1",
  },
  {
    id: 4,
    labelKey: "labelHome",
    titleKey: "titleLiving",
    italicKey: "italicDecor",
    subKey: "subHome",
    paraKey: "paraHome",
    ctaKey: "ctaHome",
    href: "/home-decor",
    imageSrc: "/homedecor.jpg",
    placeholderClass: "ea-ph-decor",
    tagKey: "tagDecor",
    accentColor: "#a07850",
  },
];

function getTranslation(
  key: keyof typeof categoryTranslations,
  lang: "en" | "ar" | "de",
): string {
  return (
    categoryTranslations[key]?.[lang] || categoryTranslations[key]?.en || key
  );
}

/* ──────────────────────────────────────────
   SWIPER CDN LOADER — no module-level cache (bfcache safe)
────────────────────────────────────────── */
function loadSwiperCDN(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof window !== "undefined" && (window as any).Swiper) {
      resolve();
      return;
    }

    if (!document.querySelector("link[data-ea-swiper-css]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css";
      link.setAttribute("data-ea-swiper-css", "1");
      document.head.appendChild(link);
    }

    if (document.querySelector("script[data-ea-swiper-js]")) {
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

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";
    script.setAttribute("data-ea-swiper-js", "1");
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

/* ──────────────────────────────────────────
   CARD COMPONENT
────────────────────────────────────────── */
function CategoryCard({
  cat,
  language,
  isRTL,
}: {
  cat: (typeof categories)[0];
  language: "en" | "ar" | "de";
  isRTL: boolean;
}) {
  const label = getTranslation(cat.labelKey as any, language);
  const title = getTranslation(cat.titleKey as any, language);
  const italic = getTranslation(cat.italicKey as any, language);
  const sub = getTranslation(cat.subKey as any, language);
  const para = getTranslation(cat.paraKey as any, language);
  const ctaLabel = getTranslation(cat.ctaKey as any, language);
  const tag = getTranslation(cat.tagKey as any, language);

  return (
    <article
      className="ea-card"
      style={{ "--accent": cat.accentColor } as React.CSSProperties}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="ea-card-img-wrap">
        {cat.imageSrc ? (
          <Image
            src={cat.imageSrc}
            alt={`${title}${italic}`}
            fill
            className="ea-card-img"
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={80}
          />
        ) : (
          <div className={`ea-card-placeholder ${cat.placeholderClass}`} />
        )}
        <div className="ea-card-img-overlay" />
      </div>

      <span className="ea-card-tag">{tag}</span>
      <span className="ea-card-label">{label}</span>

      <div className="ea-card-body">
        <p className="ea-card-sub">{sub}</p>
        <h3 className="ea-card-title">
          {title}
          <em>{italic}</em>
        </h3>
        <div className="ea-card-divider" />
        <p className="ea-card-para">{para}</p>

        <Link href={cat.href} className="ea-card-cta" prefetch={false}>
          <span>{ctaLabel}</span>
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

      <div className="ea-card-corner ea-card-corner--tl" aria-hidden="true" />
      <div className="ea-card-corner ea-card-corner--br" aria-hidden="true" />
    </article>
  );
}

/* ──────────────────────────────────────────
   STATIC SLIDES
────────────────────────────────────────── */
function StaticSlides({
  language,
  isRTL,
}: {
  language: "en" | "ar" | "de";
  isRTL: boolean;
}) {
  return (
    <>
      {categories.map((cat) => (
        <div key={cat.id} className="swiper-slide ea-slide">
          <CategoryCard cat={cat} language={language} isRTL={isRTL} />
        </div>
      ))}
    </>
  );
}

/* ──────────────────────────────────────────
   INNER COMPONENT — remounts on bfcache via key prop
────────────────────────────────────────── */
function ExploreInner() {
  const { language, isRTLMode } = useLanguage();

  const swiperRef = useRef<HTMLDivElement>(null);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const swiperInstRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    loadSwiperCDN().then(() => {
      if (cancelled) return;
      if (
        !swiperRef.current ||
        !prevBtnRef.current ||
        !nextBtnRef.current ||
        !paginationRef.current
      )
        return;

      // Destroy stale instance
      if (swiperInstRef.current) {
        try {
          swiperInstRef.current.destroy(true, true);
        } catch (e) {}
        swiperInstRef.current = null;
      }

      setTimeout(() => {
        if (cancelled) return;
        if (!swiperRef.current || !(window as any).Swiper) return;

        try {
          swiperInstRef.current = new (window as any).Swiper(
            swiperRef.current,
            {
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
              grabCursor: true,
              touchRatio: 1,
              touchAngle: 45,
              simulateTouch: true,
              touchStartPreventDefault: false,
              loop: true,
              autoplay: {
                delay: 3800,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              },
              speed: 900,
              navigation: {
                nextEl: nextBtnRef.current,
                prevEl: prevBtnRef.current,
              },
              pagination: {
                el: paginationRef.current,
                clickable: true,
                dynamicBullets: true,
              },
              observer: true,
              observeParents: true,
              resizeObserver: true,
            },
          );
        } catch (err) {
          console.error("ExploreAurexia Swiper init error:", err);
        }
      }, 100);
    });

    return () => {
      cancelled = true;
      if (swiperInstRef.current) {
        try {
          swiperInstRef.current.destroy(true, true);
        } catch (e) {}
        swiperInstRef.current = null;
      }
    };
  }, []);

  // Resize handler
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        swiperInstRef.current?.update();
      }, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  const goPrev = () => swiperInstRef.current?.slidePrev();
  const goNext = () => swiperInstRef.current?.slideNext();

  return (
    <section
      className="ea-section"
      aria-label="Explore Aurexia Categories"
      dir={isRTLMode ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <div className="ea-grain" aria-hidden="true" />
      <div className="ea-bg-lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="ea-header">
        <p className="ea-header-eyebrow">
          <span className="ea-eyebrow-line" />
          {getTranslation("eyebrowText", language)}
          <span className="ea-eyebrow-line" />
        </p>
        <h2 className="ea-header-title">
          {getTranslation("headerTitle", language)}{" "}
          <em>{getTranslation("brandName", language)}</em>
        </h2>
        <p className="ea-header-sub">{getTranslation("headerSub", language)}</p>
      </div>

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

        <div
          ref={swiperRef}
          className="ea-swiper swiper"
          suppressHydrationWarning
        >
          <div className="swiper-wrapper">
            <StaticSlides language={language} isRTL={isRTLMode} />
          </div>
          <div
            ref={paginationRef}
            className="ea-pagination swiper-pagination"
            suppressHydrationWarning
          />
        </div>
      </div>

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

/* ──────────────────────────────────────────
   MAIN EXPORT
   bfcache remount is handled by providers.tsx (shellKey)
────────────────────────────────────────── */
export default function ExploreAurexia() {
  return <ExploreInner />;
}
