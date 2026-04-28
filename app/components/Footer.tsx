"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "./footer.css";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [currentYear, setCurrentYear] = useState(2024);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
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
      { name: "Watches", href: "/watches" },
      { name: "Accessories", href: "/accessories" },
      { name: "Automotive", href: "/automotive" },
      { name: "Home Decor", href: "/home-decor" },
      { name: "New Arrivals", href: "/new-arrivals" },
      { name: "Best Sellers", href: "/best-sellers" },
    ],
    support: [
      { name: "Contact Us", href: "/contact" },
      { name: "FAQs", href: "/faqs" },
      { name: "Shipping Info", href: "/shipping" },
      { name: "Returns & Exchanges", href: "/returns" },
      { name: "Size Guide", href: "/size-guide" },
      { name: "Track Order", href: "/track-order" },
    ],
    company: [
      { name: "About Tech4U", href: "/about" },
      { name: "Our Story", href: "/our-story" },
      { name: "Sustainability", href: "/sustainability" },
      { name: "Press & Media", href: "/press" },
      { name: "Careers", href: "/careers" },
      { name: "Affiliate Program", href: "/affiliate" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "GDPR Compliance", href: "/gdpr" },
      { name: "Accessibility", href: "/accessibility" },
    ],
  };

  const socialLinks = [
    {
      name: "Instagram",
      icon: "📷",
      href: "https://instagram.com",
      color: "#E4405F",
    },
    {
      name: "Facebook",
      icon: "📘",
      href: "https://facebook.com",
      color: "#1877F2",
    },
    {
      name: "Twitter",
      icon: "🐦",
      href: "https://twitter.com",
      color: "#1DA1F2",
    },
    {
      name: "YouTube",
      icon: "📺",
      href: "https://youtube.com",
      color: "#FF0000",
    },
    {
      name: "Pinterest",
      icon: "📌",
      href: "https://pinterest.com",
      color: "#BD081C",
    },
    {
      name: "LinkedIn",
      icon: "🔗",
      href: "https://linkedin.com",
      color: "#0A66C2",
    },
  ];

  const paymentMethods = [
    { name: "Visa", icon: "💳" },
    { name: "Mastercard", icon: "💳" },
    { name: "American Express", icon: "💳" },
    { name: "PayPal", icon: "💰" },
    { name: "Apple Pay", icon: "📱" },
    { name: "Google Pay", icon: "🤖" },
  ];

  return (
    <footer className="footer">
      {/* Gold decorative line top */}
      <div className="footer-gold-line" />

      {/* Main Footer Content */}
      <div className="footer-container">
        {/* Left Section - Brand & Newsletter */}
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="footer-logo-tech">TECH</span>
            <span className="footer-logo-four">4U</span>
          </div>
          <p className="footer-tagline">Luxury in Every Detail</p>
          <p className="footer-description">
            Curating the finest in watches, automotive elegance, home decor, and
            tech accessories for those who demand nothing but the extraordinary.
          </p>

          {/* Newsletter */}
          <div className="footer-newsletter">
            <p className="footer-newsletter-title">Join the Inner Circle</p>
            <p className="footer-newsletter-sub">
              Receive exclusive offers, early access, and curated luxury drops.
            </p>
            <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
              <div className="footer-input-wrapper">
                <input
                  type="email"
                  className="footer-newsletter-input"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="footer-newsletter-btn">
                  <span>Subscribe</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </form>
            {subscribed && (
              <div className="footer-subscribe-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline
                    points="20 6 9 17 4 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Thank you for subscribing!</span>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="footer-social">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label={social.name}
                style={
                  { "--social-color": social.color } as React.CSSProperties
                }
              >
                <span className="footer-social-icon">{social.icon}</span>
                <span className="footer-social-tooltip">{social.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Right Section - Links Grid */}
        <div className="footer-links">
          <div className="footer-links-column">
            <h4 className="footer-links-title">Shop</h4>
            <ul className="footer-links-list">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="footer-link">
                    {link.name}
                    <span className="footer-link-arrow">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-links-column">
            <h4 className="footer-links-title">Support</h4>
            <ul className="footer-links-list">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="footer-link">
                    {link.name}
                    <span className="footer-link-arrow">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-links-column">
            <h4 className="footer-links-title">Company</h4>
            <ul className="footer-links-list">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="footer-link">
                    {link.name}
                    <span className="footer-link-arrow">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-links-column">
            <h4 className="footer-links-title">Legal</h4>
            <ul className="footer-links-list">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="footer-link">
                    {link.name}
                    <span className="footer-link-arrow">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          {/* Payment Methods */}
          <div className="footer-payment">
            {paymentMethods.map((method) => (
              <div
                key={method.name}
                className="footer-payment-icon"
                title={method.name}
              >
                <span>{method.icon}</span>
              </div>
            ))}
          </div>

          {/* Copyright */}
          <div className="footer-copyright">
            <p>
              © {currentYear}{" "}
              <span className="footer-copyright-brand">TECH4U</span> — Luxury in
              Every Detail. All rights reserved.
            </p>
          </div>

          {/* Back to Top */}
          <button
            className="footer-back-to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M12 19V5M5 12l7-7 7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Top</span>
          </button>
        </div>
      </div>

      {/* Animated border gradient bottom */}
      <div className="footer-bottom-gold" />
    </footer>
  );
}
