"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import "./WhyChooseUs.css";

/* ═══════════════════════════════════════════
   TRANSLATIONS
═══════════════════════════════════════════ */
const t = {
  eyebrow: {
    en: "Why Tech4U",
    ar: "لماذا تيك4يو",
    de: "Warum Tech4U",
  },
  titleMain: {
    en: "The Standard of",
    ar: "معيار",
    de: "Der Maßstab für",
  },
  titleEm: {
    en: "True Luxury",
    ar: "الفخامة الحقيقية",
    de: "Wahren Luxus",
  },
  subtitle: {
    en: "Trusted by collectors all over the world — here's what sets us apart.",
    ar: "موثوق به من قبل المقتنين في جميع أنحاء العالم — إليك ما يميزنا.",
    de: "Von Sammlern auf der ganzen Welt vertraut — das macht uns besonders.",
  },
  stats: [
    {
      value: "12K+",
      label: {
        en: "Happy Collectors",
        ar: "مقتنٍ سعيد",
        de: "Glückliche Sammler",
      },
    },
    {
      label: {
        en: "All Over The World",
        ar: "جميع أنحاء العالم",
        de: "Auf der ganzen Welt",
      },
    },
    {
      value: "48+",
      label: {
        en: "Exclusive Pieces",
        ar: "قطعة حصرية",
        de: "Exklusive Stücke",
      },
    },
    {
      value: "100%",
      label: {
        en: "Satisfaction Rate",
        ar: "معدل الرضا",
        de: "Zufriedenheitsrate",
      },
    },
  ],
  cards: [
    {
      num: "01",
      icon: "star",
      title: {
        en: "Certified Authenticity",
        ar: "مصادقة معتمدة",
        de: "Zertifizierte Echtheit",
      },
      desc: {
        en: "Every timepiece ships with a certificate of authenticity. Zero counterfeits — ever. Your investment is real.",
        ar: "كل ساعة تُشحن مع شهادة أصالة. لا مزيفات أبداً. استثمارك حقيقي.",
        de: "Jedes Zeitmesser wird mit einem Echtheitszertifikat geliefert. Null Fälschungen — niemals. Ihre Investition ist real.",
      },
    },
    {
      num: "02",
      icon: "shipping",
      title: {
        en: "Global Delivery",
        ar: "توصيل سريع عالمي",
        de: "Weltweite Expresslieferung",
      },
      desc: {
        en: "Insured, tracked shipping all over the world. Your order arrives pristine — or we make it right.",
        ar: "شحن مؤمّن ومتتبع في جميع أنحاء العالم. طلبك يصل بحالة ممتازة — أو نصلحه.",
        de: "Versicherter, verfolgbarer Versand auf der ganzen Welt. Ihre Bestellung kommt einwandfrei an — oder wir machen es richtig.",
      },
    },
    {
      num: "03",
      icon: "shield",
      title: {
        en: "Buyer Protection",
        ar: "حماية المشتري",
        de: "Käuferschutz",
      },
      desc: {
        en: "Full purchase protection on every order. If it's not exactly as described, you're fully covered — no questions asked.",
        ar: "حماية كاملة للشراء على كل طلب. إذا لم يكن كما هو موصوف تماماً، فأنت مغطى بالكامل.",
        de: "Vollständiger Kaufschutz bei jeder Bestellung. Wenn es nicht genau wie beschrieben ist, sind Sie vollständig abgesichert.",
      },
    },
    {
      num: "04",
      icon: "curated",
      title: {
        en: "Curated for Collectors",
        ar: "مختار للمقتنين",
        de: "Für Sammler kuratiert",
      },
      desc: {
        en: "Each piece is hand-selected by experts. Limited inventory means you're never wearing what everyone else owns.",
        ar: "يتم اختيار كل قطعة يدوياً من قبل خبراء. المخزون المحدود يعني أنك لن ترتدي ما يمتلكه الجميع.",
        de: "Jedes Stück wird von Experten handverlesen. Begrenztes Inventar bedeutet, dass Sie nie das tragen, was alle anderen besitzen.",
      },
    },
    {
      num: "05",
      icon: "payment",
      title: {
        en: "Secure Multi-Currency Checkout",
        ar: "دفع آمن بعملات متعددة",
        de: "Sicheres Mehrwährungs-Checkout",
      },
      desc: {
        en: "Pay in USD, GBP, AUD, EUR, AED and more. Stripe & PayPal encryption — your data is never stored.",
        ar: "ادفع بالدولار الأمريكي والجنيه الإسترليني والدولار الأسترالي واليورو والدرهم وغيرها.",
        de: "Bezahlen Sie in USD, GBP, AUD, EUR, AED und mehr. Stripe & PayPal Verschlüsselung.",
      },
    },
    {
      num: "06",
      icon: "support",
      title: {
        en: "White-Glove Support",
        ar: "دعم على أعلى مستوى",
        de: "Erstklassiger Support",
      },
      desc: {
        en: "A real human responds — fast. Whether it's a sizing question or a returns request, we treat every customer as a VIP.",
        ar: "إنسان حقيقي يرد بسرعة. سواء كان سؤالاً عن المقاس أو طلب إرجاع، نعامل كل عميل كشخص مميز.",
        de: "Ein echter Mensch antwortet — schnell. Ob Größenfrage oder Rückgabeanfrage, wir behandeln jeden Kunden als VIP.",
      },
    },
  ],
};

/* ═══════════════════════════════════════════
   SVG ICONS (unchanged)
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

  return (
    <section
      className="wcu-root"
      dir={isRTLMode ? "rtl" : "ltr"}
      aria-label="Why choose Tech4U"
    >
      {/* Ambient glow */}
      <div className="wcu-ambient" aria-hidden="true" />

      {/* Header */}
      <div className="wcu-header">
        <p className="wcu-eyebrow">
          <span className="wcu-ey-line" />
          {t.eyebrow[lang]}
          <span className="wcu-ey-line" />
        </p>
        <h2 className="wcu-title">
          {t.titleMain[lang]} <em>{t.titleEm[lang]}</em>
        </h2>
        <p className="wcu-sub">{t.subtitle[lang]}</p>
      </div>

      {/* Cards Grid */}
      <div className="wcu-grid">
        {t.cards.map((card) => (
          <div key={card.num} className="wcu-card">
            {/* Shimmer line — animated on hover via CSS */}
            <div className="wcu-card-shimmer" aria-hidden="true" />

            <div className="wcu-icon-wrap">
              <Icon name={card.icon} />
            </div>

            <span className="wcu-card-num" aria-hidden="true">
              {card.num}
            </span>
            <h3 className="wcu-card-title">{card.title[lang]}</h3>
            <p className="wcu-card-desc">{card.desc[lang]}</p>

            {/* Bottom bar */}
            <div className="wcu-card-bar" aria-hidden="true" />
          </div>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="wcu-stats-bar">
        {t.stats.map((s, i) => (
          <div key={i} className="wcu-stat">
            <span className="wcu-stat-val">{s.value}</span>
            <span className="wcu-stat-lbl">{s.label[lang]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
