"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaTwitter,
  FaYoutube,
  FaPinterestP,
  FaLinkedinIn,
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaPaypal,
  FaApple,
  FaGoogle,
  FaStar,
  FaCrown,
} from "react-icons/fa";
import {
  MdKeyboardArrowRight,
  MdSend,
  MdCheckCircle,
  MdExpandLess,
  MdVibration,
  MdHome,
  MdSupportAgent,
  MdBusinessCenter,
  MdGavel,
} from "react-icons/md";
import { GiCarKey, GiWatch, GiLaurelCrown } from "react-icons/gi";
import "./footer.css";

// ─── Pre-computed static particle positions ───────────────────────────────────
// Math.random() in JSX causes React hydration mismatch (SSR vs CSR diff).
// Fixed values eliminate the mismatch and make footer render instantly.
const PARTICLES = [
  { left: "5%", delay: "0s", duration: "8s" },
  { left: "12%", delay: "1.2s", duration: "12s" },
  { left: "20%", delay: "0.4s", duration: "6s" },
  { left: "27%", delay: "3.1s", duration: "9s" },
  { left: "34%", delay: "1.7s", duration: "7s" },
  { left: "41%", delay: "0.9s", duration: "11s" },
  { left: "48%", delay: "2.3s", duration: "8s" },
  { left: "55%", delay: "4.0s", duration: "10s" },
  { left: "62%", delay: "0.5s", duration: "6s" },
  { left: "69%", delay: "1.8s", duration: "13s" },
  { left: "74%", delay: "3.6s", duration: "7s" },
  { left: "79%", delay: "0.2s", duration: "9s" },
  { left: "83%", delay: "2.9s", duration: "11s" },
  { left: "87%", delay: "1.1s", duration: "8s" },
  { left: "90%", delay: "0.7s", duration: "6s" },
  { left: "93%", delay: "4.4s", duration: "14s" },
  { left: "7%", delay: "3.3s", duration: "10s" },
  { left: "15%", delay: "2.0s", duration: "7s" },
  { left: "58%", delay: "1.5s", duration: "9s" },
  { left: "96%", delay: "0.3s", duration: "12s" },
];
// ─────────────────────────────────────────────────────────────────────────────

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [currentYear, setCurrentYear] = useState(2026);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing after first intersection
        }
      },
      { threshold: 0.1 }
    );

    const footer = document.querySelector(".footer");
    if (footer) observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const footerLinks = {
    shop: [
      { name: "Watches", href: "/watches", icon: <GiWatch /> },
      { name: "Accessories", href: "/accessories", icon: <MdVibration /> },
      { name: "Automotive", href: "/automotive", icon: <GiCarKey /> },
      { name: "Home Decor", href: "/home-decor", icon: <MdHome /> },
      { name: "New Arrivals", href: "/new-arrivals", badge: true },
      { name: "Best Sellers", href: "/best-sellers", badge: true },
    ],
    support: [
      { name: "Contact Us", href: "/contact", icon: <MdSupportAgent /> },
      { name: "FAQs", href: "/faqs" },
      { name: "Shipping Info", href: "/shipping" },
      { name: "Returns & Exchanges", href: "/returns" },
      { name: "Size Guide", href: "/size-guide" },
      { name: "24/7 Concierge", href: "/concierge", premium: true },
    ],
    company: [
      { name: "About Tech4U", href: "/about", icon: <MdBusinessCenter /> },
      { name: "Our Story", href: "/our-story" },
      { name: "Sustainability", href: "/sustainability", eco: true },
      { name: "Press & Media", href: "/press" },
      { name: "Careers", href: "/careers" },
      { name: "Affiliate Program", href: "/affiliate" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy", icon: <MdGavel /> },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "GDPR Compliance", href: "/gdpr" },
      { name: "Accessibility", href: "/accessibility" },
    ],
  };

  const socialLinks = [
    {
      name: "Facebook",
      icon: <FaFacebookF />,
      href: "https://www.facebook.com/share/17a6uqbE89/",
      color: "#1877F2",
      gradient: "linear-gradient(135deg, #1877F2, #0d5bb5)",
    },
    {
      name: "Instagram",
      icon: <FaInstagram />,
      href: "https://www.instagram.com/tech4ruu?igsh=NjRrZGl5dTd6cDNk",
      color: "#E4405F",
      gradient: "linear-gradient(135deg, #f09433, #d62976, #962fbf)",
    },
    {
      name: "TikTok",
      icon: <FaTiktok />,
      href: "https://www.tiktok.com/@tech4ru?lang=en-GB",
      color: "#000000",
      gradient: "linear-gradient(135deg, #00f2ea, #ff0050)",
    },
    {
      name: "Twitter",
      icon: <FaTwitter />,
      href: "https://twitter.com/tech4u",
      color: "#1DA1F2",
      gradient: "linear-gradient(135deg, #1DA1F2, #0d8bec)",
    },
    {
      name: "YouTube",
      icon: <FaYoutube />,
      href: "https://youtube.com/tech4u",
      color: "#FF0000",
      gradient: "linear-gradient(135deg, #FF0000, #cc0000)",
    },
    {
      name: "Pinterest",
      icon: <FaPinterestP />,
      href: "https://pinterest.com/tech4u",
      color: "#BD081C",
      gradient: "linear-gradient(135deg, #BD081C, #8a0613)",
    },
    {
      name: "LinkedIn",
      icon: <FaLinkedinIn />,
      href: "https://linkedin.com/company/tech4u",
      color: "#0A66C2",
      gradient: "linear-gradient(135deg, #0A66C2, #074a8a)",
    },
  ];

  const paymentMethods = [
    { name: "Visa", icon: <FaCcVisa />, color: "#1A1F71" },
    { name: "Mastercard", icon: <FaCcMastercard />, color: "#EB001B" },
    { name: "American Express", icon: <FaCcAmex />, color: "#006FCF" },
    { name: "PayPal", icon: <FaPaypal />, color: "#003087" },
    { name: "Apple Pay", icon: <FaApple />, color: "#000000" },
    { name: "Google Pay", icon: <FaGoogle />, color: "#4285F4" },
  ];

  const categories = [
    { id: "shop", title: "Shop", icon: <GiWatch />, color: "#daa520" },
    {
      id: "support",
      title: "Support",
      icon: <MdSupportAgent />,
      color: "#f0c040",
    },
    {
      id: "company",
      title: "Company",
      icon: <MdBusinessCenter />,
      color: "#daa520",
    },
    { id: "legal", title: "Legal", icon: <MdGavel />, color: "#8b6914" },
  ];

  return (
    <footer className="footer">
      {/* 3D Glassmorphism Overlay */}
      <div className="footer-glass-overlay" />

      {/* Particles — fixed positions, no Math.random(), no hydration mismatch */}
      <div className="footer-particles">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="footer-particle"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Gold decorative line top */}
      <div className="footer-gold-line">
        <div className="footer-gold-shine" />
      </div>

      {/* Main Footer Content */}
      <div className={`footer-container ${isVisible ? "visible" : ""}`}>
        {/* Left Section - Brand & Newsletter */}
        <div className="footer-brand">
          <div className="footer-logo-wrapper">
            <div className="footer-logo-3d">
              <img
                src="/footer__logo.png"
                alt="TECH4U Luxury Store"
                className="footer-logo-img"
              />
            </div>
            <div className="footer-logo-gold-ring">
              <GiLaurelCrown />
            </div>
          </div>

          <p className="footer-tagline">
            <span className="tagline-gold">✦</span> Luxury in Every Detail{" "}
            <span className="tagline-gold">✦</span>
          </p>

          <p className="footer-description">
            Curating the finest in watches, automotive elegance, home decor, and
            tech accessories for those who demand nothing but the extraordinary.
            <span className="footer-description-glow">Since 2026</span>
          </p>

          {/* Newsletter */}
          <div className="footer-newsletter">
            <div className="footer-newsletter-header">
              <div className="newsletter-glow" />
              <p className="footer-newsletter-title">Join the Inner Circle</p>
              <span className="newsletter-badge">VIP</span>
            </div>
            <p className="footer-newsletter-sub">
              Receive exclusive offers, early access, and curated luxury drops.
            </p>
            <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
              <div className="footer-input-wrapper">
                <input
                  type="email"
                  className="footer-newsletter-input"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="footer-newsletter-btn">
                  <span>Subscribe</span>
                  <MdSend />
                </button>
              </div>
            </form>
            {subscribed && (
              <div className="footer-subscribe-success">
                <MdCheckCircle />
                <span>Welcome to the Inner Circle!</span>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="footer-social">
            {socialLinks.map((social, index) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label={social.name}
                style={{
                  animationDelay: `${index * 0.05}s`,
                  background:
                    social.gradient ||
                    `linear-gradient(135deg, ${social.color}, ${social.color}cc)`,
                }}
              >
                <span className="footer-social-icon">{social.icon}</span>
                <div className="footer-social-ripple" />
                <span className="footer-social-tooltip">{social.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Right Section - Links Grid */}
        <div className="footer-links">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`footer-links-column ${
                hoveredColumn === category.id ? "hovered" : ""
              }`}
              onMouseEnter={() => setHoveredColumn(category.id)}
              onMouseLeave={() => setHoveredColumn(null)}
              onClick={() =>
                setActiveCategory(
                  activeCategory === category.id ? null : category.id
                )
              }
            >
              <div className="footer-links-header">
                <div
                  className="footer-links-icon"
                  style={{ color: category.color }}
                >
                  {category.icon}
                </div>
                <h4 className="footer-links-title">
                  {category.title}
                  <div className="footer-links-gold-dot" />
                </h4>
                <button className="footer-links-mobile-toggle">
                  <MdKeyboardArrowRight
                    className={activeCategory === category.id ? "rotated" : ""}
                  />
                </button>
              </div>
              <ul
                className={`footer-links-list ${
                  activeCategory === category.id ? "active" : ""
                }`}
              >
                {footerLinks[category.id as keyof typeof footerLinks].map(
                  (link, idx) => (
                    <li
                      key={link.name}
                      className="footer-link-item"
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <Link href={link.href} className="footer-link">
                        <span className="footer-link-icon-wrapper">
                          {(link as any).icon && (
                            <span className="footer-link-icon">
                              {(link as any).icon}
                            </span>
                          )}
                        </span>
                        <span className="footer-link-text">{link.name}</span>
                        <span className="footer-link-arrow">
                          <MdKeyboardArrowRight />
                        </span>
                      </Link>
                      {(link as any).badge && (
                        <span className="footer-link-badge">NEW</span>
                      )}
                      {(link as any).premium && (
                        <span className="footer-link-badge premium">
                          PREMIUM
                        </span>
                      )}
                      {(link as any).eco && (
                        <span className="footer-link-badge eco">🌱 ECO</span>
                      )}
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          {/* Payment Methods */}
          <div className="footer-payment">
            <span className="payment-label">Secure Payments</span>
            <div className="payment-icons">
              {paymentMethods.map((method) => (
                <div
                  key={method.name}
                  className="footer-payment-icon"
                  title={method.name}
                >
                  <div
                    className="payment-card-front"
                    style={{ color: method.color }}
                  >
                    {method.icon}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="footer-copyright">
            <div className="copyright-gold-line" />
            <p>
              © {currentYear}{" "}
              <span className="footer-copyright-brand">TECH4U</span>
              <span className="copyright-separator">◆</span>
              Luxury in Every Detail
              <span className="copyright-separator">◆</span>
              All rights reserved.
            </p>
            <div className="copyright-gold-line right" />
          </div>

          {/* Back to Top */}
          <button
            className="footer-back-to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
          >
            <div className="back-to-top-ring">
              <MdExpandLess />
            </div>
            <span>Back to Top</span>
            <div className="back-to-top-glow" />
          </button>
        </div>
      </div>

      {/* Animated border gradient bottom */}
      <div className="footer-bottom-gold">
        <div className="gold-wave" />
      </div>

      {/* Floating Orbs */}
      <div className="footer-orb orb-1" />
      <div className="footer-orb orb-2" />
      <div className="footer-orb orb-3" />
    </footer>
  );
}
