"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";
import "./GlobalFAQSection.css";

/* ═══════════════════════════════════════════
   TRANSLATIONS
═══════════════════════════════════════════ */
const t = {
  title: {
    en: "Why,",
    ar: "لماذا،",
    de: "Warum,",
  },
  titleEm: {
    en: "Shop With Us?",
    ar: "تسوق معنا؟",
    de: "Kaufe bei uns ein?",
  },
  subtitle: {
    en: "Quick answers, secure shopping, and reliable support — everything you need for a smooth and confident shopping experience",
    ar: "إجابات سريعة، تسوق آمن، ودعم موثوق — كل ما تحتاجه لتجربة تسوق سلسة وموثوقة",
    de: "Schnelle Antworten, sicheres Einkaufen und zuverlässiger Support – für ein reibungsloses und vertrauensvolles Einkaufserlebnis.",
  },
  faqs: [
    {
      id: "01",
      questionEn: "Are your products 100% authentic?",
      questionAr: "هل منتجاتكم أصلية 100%؟",
      questionDe: "Sind Ihre Produkte 100% authentisch?",
      answerEn:
        "Yes, absolutely. Every product we sell comes with a certificate of authenticity. We source directly from authorized dealers and manufacturers. Zero counterfeits — ever. Your investment is completely protected.",
      answerAr:
        "نعم، بالتأكيد. كل منتج نبيعه يأتي مع شهادة أصالة. نحن نستورد مباشرة من الموزعين والمصنعين المعتمدين. لا مزيفات أبداً. استثمارك محمي بالكامل.",
      answerDe:
        "Ja, absolut. Jedes Produkt, das wir verkaufen, wird mit einem Echtheitszertifikat geliefert. Wir beziehen direkt von autorisierten Händlern und Herstellern. Null Fälschungen — niemals. Ihre Investition ist vollständig geschützt.",
    },
    {
      id: "02",
      questionEn: "Do you ship worldwide?",
      questionAr: "هل تشحنون إلى جميع أنحاء العالم؟",
      questionDe: "Versenden Sie weltweit?",
      answerEn:
        "Yes! We ship to over 50 countries worldwide including USA, UK, Australia, Germany, UAE, Canada, France, Italy, and many more. Delivery typically takes 3-7 business days depending on your location. All shipments are fully insured and tracked.",
      answerAr:
        "نعم! نشحن إلى أكثر من 50 دولة حول العالم بما في ذلك الولايات المتحدة والمملكة المتحدة وأستراليا وألمانيا والإمارات وكندا وفرنسا وإيطاليا والعديد غيرها. يستغرق التوصيل عادةً 3-7 أيام عمل حسب موقعك. جميع الشحنات مؤمنة بالكامل ومتتبعة.",
      answerDe:
        "Ja! Wir versenden in über 50 Länder weltweit, darunter USA, UK, Australien, Deutschland, VAE, Kanada, Frankreich, Italien und viele mehr. Die Lieferung dauert je nach Standort in der Regel 3-7 Werktage. Alle Sendungen sind vollständig versichert und verfolgbar.",
    },
    {
      id: "03",
      questionEn: "What is your return policy?",
      questionAr: "ما هي سياسة الإرجاع الخاصة بكم؟",
      questionDe: "Was ist Ihre Rückgaberichtlinie?",
      answerEn:
        "We offer a 30-day hassle-free return policy. If you're not completely satisfied with your purchase, you can return it within 30 days of delivery for a full refund. Items must be unworn and in original condition with all packaging. We cover return shipping on defective items.",
      answerAr:
        "نحن نقدم سياسة إرجاع خالية من المتاعب لمدة 30 يومًا. إذا لم تكن راضيًا تمامًا عن مشترياتك، يمكنك إرجاعها في غضون 30 يومًا من التوصيل لاسترداد كامل المبلغ. يجب أن تكون العناصر غير مرتدية وفي حالتها الأصلية مع جميع التغليف. نحن نغطي تكاليف شحن الإرجاع للعناصر المعيبة.",
      answerDe:
        "Wir bieten eine 30-tägige, problemlose Rückgaberegelung. Wenn Sie mit Ihrem Kauf nicht vollständig zufrieden sind, können Sie ihn innerhalb von 30 Tagen nach Lieferung zurückgeben und erhalten eine vollständige Rückerstattung. Artikel müssen ungetragen und im Originalzustand mit aller Verpackung sein. Wir übernehmen die Rücksendekosten für defekte Artikel.",
    },
    {
      id: "04",
      questionEn: "How do I track my order?",
      questionAr: "كيف يمكنني تتبع طلبي؟",
      questionDe: "Wie kann ich meine Bestellung verfolgen?",
      answerEn:
        "Once your order ships, you'll receive an email with a tracking number and link. You can also log into your account and view your order status. All our shipments include real-time tracking so you always know where your package is.",
      answerAr:
        "بمجرد شحن طلبك، ستصلك رسالة بريد إلكتروني تحتوي على رقم تتبع ورابط. يمكنك أيضًا تسجيل الدخول إلى حسابك وعرض حالة طلبك. جميع شحناتنا تتضمن تتبعًا فوريًا حتى تعرف دائمًا مكان طردك.",
      answerDe:
        "Sobald Ihre Bestellung versandt wird, erhalten Sie eine E-Mail mit einer Sendungsverfolgungsnummer und einem Link. Sie können sich auch in Ihr Konto einloggen und den Bestellstatus einsehen. Alle unsere Sendungen enthalten eine Echtzeitverfolgung, damit Sie immer wissen, wo sich Ihr Paket befindet.",
    },
    {
      id: "05",
      questionEn: "Do you offer gift wrapping?",
      questionAr: "هل تقدمون تغليف الهدايا؟",
      questionDe: "Bieten Sie Geschenkverpackung an?",
      answerEn:
        "Yes! We offer premium gift wrapping for all our products. Our signature packaging includes a luxury box, satin ribbon, and a handwritten note upon request. Perfect for special occasions. Just select the gift wrapping option at checkout.",
      answerAr:
        "نعم! نحن نقدم تغليف هدايا فاخر لجميع منتجاتنا. تشمل عبواتنا المميزة صندوقًا فاخرًا وشريطًا من الساتان وبطاقة مكتوبة بخط اليد عند الطلب. مثالي للمناسبات الخاصة. ما عليك سوى تحديد خيار تغليف الهدايا عند الدفع.",
      answerDe:
        "Ja! Wir bieten premium Geschenkverpackung für alle unsere Produkte an. Unsere Signature-Verpackung umfasst eine Luxusbox, ein Satinband und eine handgeschriebene Karte auf Anfrage. Perfekt für besondere Anlässe. Wählen Sie einfach die Geschenkverpackungsoption an der Kasse.",
    },
    {
      id: "06",
      questionEn: "Is my payment information secure?",
      questionAr: "هل معلومات الدفع الخاصة بي آمنة؟",
      questionDe: "Sind meine Zahlungsinformationen sicher?",
      answerEn:
        "Absolutely. We use Stripe and PayPal for all transactions, both industry leaders in payment security. Your payment details are never stored on our servers. We also offer multi-currency checkout in USD, GBP, AUD, EUR, AED, and more.",
      answerAr:
        "بالتأكيد. نحن نستخدم سترايب و PayPal لجميع المعاملات، وكلاهما من رواد الصناعة في أمان الدفع. لا يتم تخزين تفاصيل الدفع الخاصة بك على خوادمنا. كما نقدم الدفع بعملات متعددة بالدولار الأمريكي والجنيه الإسترليني والدولار الأسترالي واليورو والدرهم وغيرها.",
      answerDe:
        "Absolut. Wir verwenden Stripe und PayPal für alle Transaktionen, beide Branchenführer in der Zahlungssicherheit. Ihre Zahlungsdetails werden niemals auf unseren Servern gespeichert. Wir bieten auch Mehrwährungs-Checkout in USD, GBP, AUD, EUR, AED und mehr an.",
    },
    {
      id: "07",
      questionEn: "How can I contact customer support?",
      questionAr: "كيف يمكنني الاتصال بدعم العملاء؟",
      questionDe: "Wie kann ich den Kundensupport kontaktieren?",
      answerEn:
        "Our white-glove support team is available 7 days a week. You can reach us via email at info@tech4ru.com, through our live chat feature, or via WhatsApp. We're here to help with any question, big or small.",
      answerAr:
        "فريق الدعم المتميز لدينا متاح 7 أيام في الأسبوع. يمكنك التواصل معنا عبر البريد الإلكتروني info@tech4ru.com، أو عبر ميزة الدردشة المباشرة، أو عبر واتساب. نحن هنا لمساعدتك في أي سؤال كبير أو صغير.",
      answerDe:
        "Unser White-Glove-Support-Team ist 7 Tage die Woche für Sie da. Sie können uns per E-Mail unter info@tech4ru.com, über unsere Live-Chat-Funktion oder per WhatsApp erreichen. Wir sind hier, um Ihnen bei jeder Frage zu helfen, ob groß oder klein.",
    },
    {
      id: "08",
      questionEn: "Do you offer bulk or wholesale discounts?",
      questionAr: "هل تقدمون خصومات بالجملة أو تجارية؟",
      questionDe: "Bieten Sie Mengen- oder Großhandelsrabatte an?",
      answerEn:
        "Yes! For bulk orders of 5+ pieces, we offer significant discounts. Please contact our wholesale team at wholesale@tech4u.com with your requirements, and we'll provide a custom quote. We also offer special pricing for corporate gifts and events.",
      answerAr:
        "نعم! للطلبات بالجملة من 5+ قطع، نقدم خصومات كبيرة. يرجى الاتصال بفريق الجملة لدينا على wholesale@tech4u.com مع متطلباتك، وسنقدم لك عرض سعر مخصص. كما نقدم أسعارًا خاصة للهدايا المؤسسية والمناسبات.",
      answerDe:
        "Ja! Für Großbestellungen von 5+ Stück bieten wir erhebliche Rabatte. Bitte kontaktieren Sie unser Großhandelsteam unter wholesale@tech4u.com mit Ihren Anforderungen, und wir werden Ihnen ein individuelles Angebot unterbreiten. Wir bieten auch Sonderpreise für Firmengeschenke und Veranstaltungen an.",
    },
  ],
  stillQuestions: {
    en: "Still have questions?",
    ar: "لا تزال لديك أسئلة؟",
    de: "Haben Sie noch Fragen?",
  },
  contactBtn: {
    en: "Contact Us",
    ar: "اتصل بنا",
    de: "Kontaktieren Sie uns",
  },
  whatsappBtn: {
    en: "WhatsApp Support",
    ar: "دعم واتساب",
    de: "WhatsApp Support",
  },
  whatsappNumber: "+4915782101282",
};

/* ═══════════════════════════════════════════
   FAQ ACCORDION ITEM
═══════════════════════════════════════════ */
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

function FAQAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`gfaq-item ${isOpen ? "open" : ""}`}>
      <button
        className="gfaq-question-btn"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="gfaq-question-left">
          <span className="gfaq-question-num">{item.id}</span>
          <span className="gfaq-question-text">{item.question}</span>
        </div>
        <div className="gfaq-icon-wrap">
          <svg
            className="gfaq-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <svg
            className="gfaq-icon-close"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </button>

      <div
        className="gfaq-answer-container"
        style={{
          maxHeight: isOpen ? "500px" : "0",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="gfaq-answer-content">
          <div className="gfaq-answer-line" aria-hidden="true" />
          <p className="gfaq-answer-text">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function GlobalFAQSection() {
  const { language, isRTLMode } = useLanguage();
  const lang = language as "en" | "ar" | "de";
  // ✅ No default open FAQ - all closed initially
  const [openId, setOpenId] = useState<string | null>(null);

  const faqsData = t.faqs.map((faq) => ({
    id: faq.id,
    question:
      lang === "en"
        ? faq.questionEn
        : lang === "ar"
          ? faq.questionAr
          : faq.questionDe,
    answer:
      lang === "en"
        ? faq.answerEn
        : lang === "ar"
          ? faq.answerAr
          : faq.answerDe,
  }));

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const openWhatsApp = () => {
    const number = t.whatsappNumber.replace(/\s/g, "");
    window.open(`https://wa.me/${number}`, "_blank");
  };

  return (
    <section
      className="gfaq-root"
      dir={isRTLMode ? "rtl" : "ltr"}
      aria-label="Frequently Asked Questions"
    >
      {/* Grain texture */}
      <div className="gfaq-grain" aria-hidden="true" />

      {/* Ambient glow */}
      <div className="gfaq-ambient" aria-hidden="true" />

      {/* Decorative lines */}
      <div className="gfaq-lines" aria-hidden="true">
        {[...Array(4)].map((_, i) => (
          <span key={i} />
        ))}
      </div>

      {/* Header Section */}
      <div className="gfaq-header">
        <h2 className="gfaq-title">
          {t.title[lang]} <em>{t.titleEm[lang]}</em>
        </h2>

        <p className="gfaq-subtitle">{t.subtitle[lang]}</p>

        <div className="gfaq-title-decoration" aria-hidden="true">
          <span className="gfaq-deco-diamond" />
          <span className="gfaq-deco-line" />
          <span className="gfaq-deco-diamond" />
        </div>
      </div>

      {/* FAQ Accordion - Centered */}
      <div className="gfaq-accordion-wrapper">
        <div className="gfaq-accordion-container">
          {faqsData.map((faq) => (
            <FAQAccordionItem
              key={faq.id}
              item={faq}
              isOpen={openId === faq.id}
              onToggle={() => toggleFAQ(faq.id)}
            />
          ))}
        </div>
      </div>

      {/* CTA Section with WhatsApp Button */}
      <div className="gfaq-cta">
        <div className="gfaq-cta-inner">
          <div className="gfaq-cta-glow" aria-hidden="true" />

          <span className="gfaq-cta-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M8 10h8M8 14h5" />
            </svg>
          </span>

          <h3 className="gfaq-cta-title">{t.stillQuestions[lang]}</h3>

          <div className="gfaq-cta-buttons">
            {/* Contact Us Button - Links to Contact Page */}
            <Link href="/contact" className="gfaq-cta-btn gfaq-cta-btn-primary">
              <span>{t.contactBtn[lang]}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>

            {/* WhatsApp Button - Opens WhatsApp Chat */}
            <button
              className="gfaq-cta-btn gfaq-cta-btn-whatsapp"
              onClick={openWhatsApp}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>{t.whatsappBtn[lang]}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
