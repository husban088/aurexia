"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { useLanguage } from "@/app/context/LanguageContext";
import "./WhyChooseUs.css";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

/* ═══════════════════════════════════════════
   TRANSLATIONS
═══════════════════════════════════════════ */
const t = {
  title: {
    en: "Why Choose",
    ar: "لماذا تختار",
    de: "Warum wählen",
  },
  titleEm: {
    en: "Tech4U",
    ar: "Tech4U",
    de: "Tech4U",
  },
  subtitle: {
    en: "Premium products, verified authenticity, and world-class service — everything curated to elevate your lifestyle.",
    ar: "منتجات فاخرة، أصالة موثّقة، وخدمة عالمية — كل شيء مختار لترتقي بأسلوب حياتك.",
    de: "Premium-Produkte, geprüfte Echtheit und erstklassiger Service — alles kuratiert, um Ihren Lebensstil zu verbessern.",
  },
  cards: [
    {
      id: "01",
      icon: "star",
      titleEn: "Certified Authenticity",
      titleAr: "مصادقة معتمدة",
      titleDe: "Zertifizierte Echtheit",
      descEn:
        "Every timepiece ships with a certificate of authenticity. Zero counterfeits — ever. Your investment is real.",
      descAr: "كل ساعة تُشحن مع شهادة أصالة. لا مزيفات أبداً. استثمارك حقيقي.",
      descDe:
        "Jedes Zeitmesser wird mit einem Echtheitszertifikat geliefert. Null Fälschungen — niemals. Ihre Investition ist real.",
    },
    {
      id: "02",
      icon: "shipping",
      titleEn: "Global Delivery",
      titleAr: "توصيل سريع عالمي",
      titleDe: "Weltweite Expresslieferung",
      descEn:
        "Insured, tracked shipping all over the world. Your order arrives pristine — or we make it right.",
      descAr:
        "شحن مؤمّن ومتتبع في جميع أنحاء العالم. طلبك يصل بحالة ممتازة — أو نصلحه.",
      descDe:
        "Versicherter, verfolgbarer Versand auf der ganzen Welt. Ihre Bestellung kommt einwandfrei an — oder wir machen es richtig.",
    },
    {
      id: "03",
      icon: "shield",
      titleEn: "Buyer Protection",
      titleAr: "حماية المشتري",
      titleDe: "Käuferschutz",
      descEn:
        "Full purchase protection on every order. If it's not exactly as described, you're fully covered — no questions asked.",
      descAr:
        "حماية كاملة للشراء على كل طلب. إذا لم يكن كما هو موصوف تماماً، فأنت مغطى بالكامل.",
      descDe:
        "Vollständiger Kaufschutz bei jeder Bestellung. Wenn es nicht genau wie beschrieben ist, sind Sie vollständig abgesichert.",
    },
    {
      id: "04",
      icon: "curated",
      titleEn: "Curated for Collectors",
      titleAr: "مختار للمقتنين",
      titleDe: "Für Sammler kuratiert",
      descEn:
        "Each piece is hand-selected by experts. Limited inventory means you're never wearing what everyone else owns.",
      descAr:
        "يتم اختيار كل قطعة يدوياً من قبل خبراء. المخزون المحدود يعني أنك لن ترتدي ما يمتلكه الجميع.",
      descDe:
        "Jedes Stück wird von Experten handverlesen. Begrenztes Inventar bedeutet, dass Sie nie das tragen, was alle anderen besitzen.",
    },
    {
      id: "05",
      icon: "payment",
      titleEn: "Secure Multi-Currency Checkout",
      titleAr: "دفع آمن بعملات متعددة",
      titleDe: "Sicheres Mehrwährungs-Checkout",
      descEn:
        "Pay in USD, GBP, AUD, EUR, AED and more. Stripe & PayPal encryption — your data is never stored.",
      descAr:
        "ادفع بالدولار الأمريكي والجنيه الإسترليني والدولار الأسترالي واليورو والدرهم وغيرها.",
      descDe:
        "Bezahlen Sie in USD, GBP, AUD, EUR, AED und mehr. Stripe & PayPal Verschlüsselung.",
    },
    {
      id: "06",
      icon: "support",
      titleEn: "White-Glove Support",
      titleAr: "دعم على أعلى مستوى",
      titleDe: "Erstklassiger Support",
      descEn:
        "A real human responds — fast. Whether it's a sizing question or a returns request, we treat every customer as a VIP.",
      descAr:
        "إنسان حقيقي يرد بسرعة. سواء كان سؤالاً عن المقاس أو طلب إرجاع، نعامل كل عميل كشخص مميز.",
      descDe:
        "Ein echter Mensch antwortet — schnell. Ob Größenfrage oder Rückgabeanfrage, wir behandeln jeden Kunden als VIP.",
    },
  ],
};

/* ═══════════════════════════════════════════
   SVG ICONS
═══════════════════════════════════════════ */
function Icon({ name }: { name: string }) {
  switch (name) {
    case "star":
      return (
        <svg viewBox="0 0 24 24" className="wcu-icon-svg" aria-hidden="true">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </svg>
      );
    case "shipping":
      return (
        <svg viewBox="0 0 24 24" className="wcu-icon-svg" aria-hidden="true">
          <rect x="1" y="3" width="15" height="13" rx="1" />
          <path d="M16 8h4l3 5v3h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" className="wcu-icon-svg" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "curated":
      return (
        <svg viewBox="0 0 24 24" className="wcu-icon-svg" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case "payment":
      return (
        <svg viewBox="0 0 24 24" className="wcu-icon-svg" aria-hidden="true">
          <rect x="1" y="4" width="22" height="16" rx="2" />
          <path d="M1 10h22" />
          <circle cx="7" cy="16" r="1" />
          <circle cx="17" cy="16" r="1" />
        </svg>
      );
    case "support":
      return (
        <svg viewBox="0 0 24 24" className="wcu-icon-svg" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h8M8 14h5" />
        </svg>
      );
    default:
      return null;
  }
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function WhyChooseUs() {
  const { language, isRTLMode } = useLanguage();
  const lang = language as "en" | "ar" | "de";
  const swiperRef = useRef<any>(null);
  const isRTL = isRTLMode;

  return (
    <section
      className="wcu-root"
      dir={isRTL ? "rtl" : "ltr"}
      aria-label="Why choose Tech4U"
    >
      {/* Ambient glow */}
      <div className="wcu-ambient" aria-hidden="true" />

      {/* Header */}
      <div className="wcu-header">
        <h2 className="wcu-title">
          {t.title[lang]} <em>{t.titleEm[lang]}</em>
        </h2>
        <p className="wcu-subtitle">{t.subtitle[lang]}</p>
      </div>

      {/* Swiper Slider */}
      <div className="wcu-slider-wrapper">
        <div className="wcu-nav-buttons">
          <button className="wcu-nav-prev" aria-label="Previous">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button className="wcu-nav-next" aria-label="Next">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <Swiper
          ref={swiperRef}
          modules={[Autoplay, Navigation, Pagination]}
          spaceBetween={24}
          slidesPerView={1}
          centeredSlides={false}
          loop={true}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          navigation={{
            prevEl: ".wcu-nav-prev",
            nextEl: ".wcu-nav-next",
          }}
          pagination={{
            clickable: true,
            el: ".wcu-pagination",
            bulletClass: "wcu-bullet",
            bulletActiveClass: "wcu-bullet-active",
          }}
          breakpoints={{
            640: {
              slidesPerView: 1.2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 24,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 30,
            },
          }}
        >
          {t.cards.map((card) => (
            <SwiperSlide key={card.id}>
              <div className="wcu-card">
                <div className="wcu-card-shimmer" aria-hidden="true" />
                <div className="wcu-icon-wrap">
                  <Icon name={card.icon} />
                </div>
                <span className="wcu-card-num" aria-hidden="true">
                  {card.id}
                </span>
                <h3 className="wcu-card-title">
                  {lang === "en"
                    ? card.titleEn
                    : lang === "ar"
                      ? card.titleAr
                      : card.titleDe}
                </h3>
                <p className="wcu-card-desc">
                  {lang === "en"
                    ? card.descEn
                    : lang === "ar"
                      ? card.descAr
                      : card.descDe}
                </p>
                <div className="wcu-card-bar" aria-hidden="true" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="wcu-pagination" />
      </div>
    </section>
  );
}
