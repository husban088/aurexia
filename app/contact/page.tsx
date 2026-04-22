"use client";

import { useState } from "react";
import Link from "next/link";
import "./contact.css";

const contactDetails = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    label: "Our Boutique",
    value: "12 Mayfair Lane, London W1K 3QD",
    sub: "Mon–Sat: 10:00 – 19:00",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.03 1.19 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.08 6.08l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
    label: "Phone & WhatsApp",
    value: "+44 20 7946 0958",
    sub: "Available 9am – 8pm GMT",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    label: "Email Us",
    value: "concierge@aurexia.com",
    sub: "Response within 24 hours",
  },
];

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: connect to your backend/email service
    console.log("Contact →", { name, email, subject, message });
    setSubmitted(true);
  };

  return (
    <div className="co-root">
      {/* Grain */}
      <div className="co-grain" aria-hidden="true" />

      {/* Background geometry */}
      <div className="co-bg-geo" aria-hidden="true">
        <div className="co-geo-ring co-geo-ring--1" />
        <div className="co-geo-ring co-geo-ring--2" />
        <div className="co-geo-ring co-geo-ring--3" />
        <div className="co-geo-line co-geo-line--1" />
        <div className="co-geo-line co-geo-line--2" />
        <div className="co-geo-line co-geo-line--3" />
      </div>

      {/* Corner brackets */}
      <div className="co-corner co-corner--tl" aria-hidden="true" />
      <div className="co-corner co-corner--tr" aria-hidden="true" />
      <div className="co-corner co-corner--bl" aria-hidden="true" />
      <div className="co-corner co-corner--br" aria-hidden="true" />

      <div className="co-container">
        {/* ── Page Header ── */}
        <header className="co-header">
          <p className="co-eyebrow">
            <span className="co-ey-line" />
            Get In Touch
            <span className="co-ey-line" />
          </p>
          <h1 className="co-heading">
            We're Here
            <br />
            For <em>You</em>
          </h1>
          <p className="co-sub">
            Whether you're seeking the perfect timepiece or need assistance with
            your order, our dedicated concierge team is ready to assist you.
          </p>
        </header>

        {/* ── Main Content ── */}
        <div className="co-main">
          {/* Left — Info Panel */}
          <aside className="co-info">
            {/* Contact Cards */}
            <div className="co-info-cards">
              {contactDetails.map((item, i) => (
                <div
                  key={i}
                  className="co-info-card"
                  style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                >
                  <div className="co-info-icon">{item.icon}</div>
                  <div>
                    <p className="co-info-label">{item.label}</p>
                    <p className="co-info-value">{item.value}</p>
                    <p className="co-info-sub">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="co-social">
              <p className="co-social-label">
                <span className="co-ey-line" style={{ width: 14 }} />
                Follow Aurexia
                <span className="co-ey-line" style={{ width: 14 }} />
              </p>
              <div className="co-social-icons">
                {/* Instagram */}
                <a
                  href="#"
                  className="co-social-btn"
                  aria-label="Instagram"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                    <circle
                      cx="17.5"
                      cy="6.5"
                      r="1"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                </a>
                {/* Twitter/X */}
                <a
                  href="#"
                  className="co-social-btn"
                  aria-label="Twitter"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* Facebook */}
                <a
                  href="#"
                  className="co-social-btn"
                  aria-label="Facebook"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </a>
                {/* Pinterest */}
                <a
                  href="#"
                  className="co-social-btn"
                  aria-label="Pinterest"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83.18-.77 1.23-5.22 1.23-5.22s-.31-.63-.31-1.57c0-1.47.85-2.57 1.91-2.57.9 0 1.34.68 1.34 1.49 0 .91-.58 2.27-.88 3.53-.25 1.05.52 1.91 1.55 1.91 1.86 0 3.1-2.39 3.1-5.22 0-2.15-1.47-3.76-4.12-3.76-3 0-4.87 2.24-4.87 4.74 0 .86.25 1.47.64 1.94.18.21.2.3.13.54-.05.17-.15.59-.2.75-.06.24-.25.33-.46.24-1.29-.53-1.9-1.96-1.9-3.57 0-2.64 2.23-6.15 6.67-6.15 3.57 0 5.93 2.6 5.93 5.39 0 3.7-2.05 6.48-5.07 6.48-1.01 0-1.96-.55-2.29-1.17l-.65 2.55c-.2.78-.77 1.78-1.18 2.41A10 10 0 0022 12c0-5.52-4.48-10-10-10z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="co-map-placeholder" aria-hidden="true">
              <div className="co-map-inner">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                >
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                  <line x1="9" y1="3" x2="9" y2="18" />
                  <line x1="15" y1="6" x2="15" y2="21" />
                </svg>
                <p>View on Map</p>
              </div>
            </div>
          </aside>

          {/* Right — Form Panel */}
          <section className="co-form-section">
            <div className="co-form-card">
              {/* Deco corner */}
              <div
                className="co-form-corner co-form-corner--tr"
                aria-hidden="true"
              />
              <div
                className="co-form-corner co-form-corner--bl"
                aria-hidden="true"
              />

              {submitted ? (
                <div className="co-success">
                  <div className="co-success-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline
                        points="20 6 9 17 4 12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="co-success-eyebrow">
                    <span className="co-ey-line" />
                    Message Sent
                    <span className="co-ey-line" />
                  </p>
                  <h3 className="co-success-title">
                    Thank You, <em>{name || "Guest"}</em>
                  </h3>
                  <p className="co-success-sub">
                    Our concierge team will respond within 24 hours.
                  </p>
                  <button
                    className="co-success-btn"
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setEmail("");
                      setSubject("");
                      setMessage("");
                    }}
                  >
                    Send Another
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      width="14"
                      height="14"
                    >
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <div className="co-form-header">
                    <p className="co-eyebrow">
                      <span className="co-ey-line" />
                      Send Message
                      <span className="co-ey-line" />
                    </p>
                    <h2 className="co-form-title">
                      Let's <em>Connect</em>
                    </h2>
                    <p className="co-form-sub">
                      Every message is read personally by our team.
                    </p>
                  </div>

                  <form className="co-form" onSubmit={handleSubmit} noValidate>
                    {/* Row: Name + Email */}
                    <div className="co-form-row">
                      <div
                        className={`co-field${
                          focused === "na" ? " focused" : ""
                        }${name ? " filled" : ""}`}
                      >
                        <label className="co-label" htmlFor="co-name">
                          Full Name
                        </label>
                        <div className="co-input-wrap">
                          <span className="co-input-icon" aria-hidden="true">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </span>
                          <input
                            id="co-name"
                            type="text"
                            className="co-input"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onFocus={() => setFocused("na")}
                            onBlur={() => setFocused(null)}
                            autoComplete="name"
                            required
                          />
                        </div>
                        <div className="co-field-line" aria-hidden="true" />
                      </div>

                      <div
                        className={`co-field${
                          focused === "em" ? " focused" : ""
                        }${email ? " filled" : ""}`}
                      >
                        <label className="co-label" htmlFor="co-email">
                          Email Address
                        </label>
                        <div className="co-input-wrap">
                          <span className="co-input-icon" aria-hidden="true">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                          </span>
                          <input
                            id="co-email"
                            type="email"
                            className="co-input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setFocused("em")}
                            onBlur={() => setFocused(null)}
                            autoComplete="email"
                            required
                          />
                        </div>
                        <div className="co-field-line" aria-hidden="true" />
                      </div>
                    </div>

                    {/* Subject */}
                    <div
                      className={`co-field${
                        focused === "su" ? " focused" : ""
                      }${subject ? " filled" : ""}`}
                    >
                      <label className="co-label" htmlFor="co-subject">
                        Subject
                      </label>
                      <div className="co-input-wrap">
                        <span className="co-input-icon" aria-hidden="true">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </span>
                        <input
                          id="co-subject"
                          type="text"
                          className="co-input"
                          placeholder="How can we help?"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          onFocus={() => setFocused("su")}
                          onBlur={() => setFocused(null)}
                          required
                        />
                      </div>
                      <div className="co-field-line" aria-hidden="true" />
                    </div>

                    {/* Message */}
                    <div
                      className={`co-field co-field--textarea${
                        focused === "ms" ? " focused" : ""
                      }${message ? " filled" : ""}`}
                    >
                      <label className="co-label" htmlFor="co-message">
                        Message
                      </label>
                      <div className="co-input-wrap co-input-wrap--textarea">
                        <span
                          className="co-input-icon co-input-icon--top"
                          aria-hidden="true"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                          </svg>
                        </span>
                        <textarea
                          id="co-message"
                          className="co-textarea"
                          placeholder="Share your enquiry with us..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onFocus={() => setFocused("ms")}
                          onBlur={() => setFocused(null)}
                          rows={5}
                          required
                        />
                      </div>
                      <div className="co-field-line" aria-hidden="true" />
                    </div>

                    {/* Submit */}
                    <button type="submit" className="co-submit-btn">
                      <span>Send Message</span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
