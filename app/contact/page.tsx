"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import "./contact.css";

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
interface FormFields {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

interface Toast {
  id: number;
  type: "success" | "error" | "info";
  title: string;
  msg: string;
  exiting?: boolean;
}

/* ═══════════════════════════════════════════
   CONTACT DETAILS
═══════════════════════════════════════════ */
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
    value: "Faisalabad, Punjab, Pakistan",
    sub: "Mon–Sat: 10:00 – 19:00 PKT",
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
    value: "+92 300 0000000",
    sub: "Available 9am – 8pm PKT",
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
    value: "husbanshk@gmail.com",
    sub: "Response within 24 hours",
  },
];

/* ═══════════════════════════════════════════
   VALIDATION
═══════════════════════════════════════════ */
function validateField(field: keyof FormFields, value: string): string {
  switch (field) {
    case "name":
      if (!value.trim()) return "Full name is required";
      if (value.trim().length < 4) return "Name must be at least 4 characters";
      return "";
    case "email":
      if (!value.trim()) return "Email address is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
        return "Please enter a valid email address";
      return "";
    case "subject":
      if (!value.trim()) return "Subject is required";
      return "";
    case "message":
      if (!value.trim()) return "Message cannot be empty";
      return "";
    default:
      return "";
  }
}

/* ═══════════════════════════════════════════
   TOAST HOOK
═══════════════════════════════════════════ */
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const show = useCallback(
    (title: string, msg: string, type: Toast["type"] = "success") => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, title, msg, type }]);
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        );
        setTimeout(
          () => setToasts((prev) => prev.filter((t) => t.id !== id)),
          400
        );
      }, 3000); // Reduced from 4000 to 3000 for faster dismissal
    },
    []
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 400);
  }, []);

  return { toasts, show, dismiss };
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function Contact() {
  const [form, setForm] = useState<FormFields>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormFields, boolean>>
  >({});
  const [focused, setFocused] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const { toasts, show: showToast, dismiss } = useToast();

  /* ── Real-time validation on touched fields ── */
  useEffect(() => {
    const newErrors: FieldErrors = {};
    (Object.keys(touched) as (keyof FormFields)[]).forEach((field) => {
      if (touched[field]) {
        const err = validateField(field, form[field]);
        if (err) newErrors[field] = err;
      }
    });
    setErrors(newErrors);
  }, [form, touched]);

  /* ── Field change ── */
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /* ── Field blur — mark as touched ── */
  function handleBlur(field: keyof FormFields) {
    setFocused(null);
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  /* ── Submit - OPTIMIZED FOR SPEED ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    /* Mark all fields touched */
    setTouched({ name: true, email: true, subject: true, message: true });

    /* Validate all */
    const newErrors: FieldErrors = {};
    (Object.keys(form) as (keyof FormFields)[]).forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) newErrors[field] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast(
        "Validation Error",
        "Please fix the highlighted fields before sending.",
        "error"
      );
      return;
    }

    setSending(true);

    try {
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) {
          setErrors(data.errors);
        }
        showToast(
          "Send Failed",
          data.message || "Something went wrong. Please try again.",
          "error"
        );
      } else {
        showToast(
          "Message Sent!",
          "We've received your message and will reply within 24 hours.",
          "success"
        );
        setSubmitted(true);
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        showToast(
          "Timeout",
          "Request took too long. Please check your connection and try again.",
          "error"
        );
      } else {
        showToast(
          "Network Error",
          "Unable to connect. Please check your internet and try again.",
          "error"
        );
      }
    } finally {
      setSending(false);
    }
  }

  /* ── Reset form ── */
  function resetForm() {
    setForm({ name: "", email: "", subject: "", message: "" });
    setErrors({});
    setTouched({});
    setSubmitted(false);
  }

  /* ── Field helper ── */
  function fieldClass(field: keyof FormFields) {
    const classes = ["co-field"];
    if (focused === field) classes.push("focused");
    if (form[field]) classes.push("filled");
    if (errors[field] && touched[field]) classes.push("co-field--error");
    return classes.join(" ");
  }

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
        {/* Page Header */}
        <header className="co-header">
          <p className="co-eyebrow">
            <span className="co-ey-line" />
            <span className="co-ey-line-head">Get In Touch</span>
            <span className="co-ey-line" />
          </p>
          <h1 className="co-heading">
            We're Here
            <br />
            For <em>You</em>
          </h1>
          <p className="co-sub">
            Whether you need help with an order or have a question, our
            dedicated team is ready to assist you.
          </p>
        </header>

        {/* Main Grid */}
        <div className="co-main">
          {/* ── LEFT: Info Panel ── */}
          <aside className="co-info">
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

            {/* Social */}
            <div className="co-social">
              <p className="co-social-label">
                <span className="co-ey-line" style={{ width: 14 }} />
                Follow Aurexia
                <span className="co-ey-line" style={{ width: 14 }} />
              </p>
              <div className="co-social-icons">
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
                <a
                  href="#"
                  className="co-social-btn"
                  aria-label="Twitter/X"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
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
                <a
                  href="#"
                  className="co-social-btn"
                  aria-label="WhatsApp"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Map placeholder */}
            <div
              className="co-map-placeholder"
              onClick={() =>
                window.open(
                  "https://maps.google.com?q=Faisalabad+Punjab+Pakistan",
                  "_blank"
                )
              }
            >
              <div className="co-map-inner">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p>View on Maps</p>
              </div>
            </div>
          </aside>

          {/* ── RIGHT: Form ── */}
          <section className="co-form-section">
            <div className="co-form-card">
              <div
                className="co-form-corner co-form-corner--tr"
                aria-hidden="true"
              />
              <div
                className="co-form-corner co-form-corner--bl"
                aria-hidden="true"
              />

              {submitted ? (
                /* ── Success State ── */
                <div className="co-success">
                  <div className="co-success-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="co-success-eyebrow">
                    <span className="co-ey-line" style={{ width: 20 }} />
                    Message Delivered
                    <span className="co-ey-line" style={{ width: 20 }} />
                  </p>
                  <h2 className="co-success-title">
                    Thank You, <em>{form.name.split(" ")[0] || "Friend"}</em>
                  </h2>
                  <p className="co-success-sub">
                    We've received your message and will get back to you within
                    24 hours.
                  </p>
                  <button className="co-success-btn" onClick={resetForm}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ width: 14, height: 14 }}
                    >
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                    </svg>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  {/* Form Header */}
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

                  {/* ── FORM ── */}
                  <form className="co-form" onSubmit={handleSubmit} noValidate>
                    {/* Row: Name + Email */}
                    <div className="co-form-row">
                      {/* Name */}
                      <div className={fieldClass("name")}>
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
                            name="name"
                            type="text"
                            className="co-input"
                            placeholder="Your name (min. 4 chars)"
                            value={form.name}
                            onChange={handleChange}
                            onFocus={() => setFocused("name")}
                            onBlur={() => handleBlur("name")}
                            autoComplete="name"
                            aria-invalid={!!errors.name}
                            aria-describedby={
                              errors.name ? "err-name" : undefined
                            }
                          />
                        </div>
                        <div className="co-field-line" aria-hidden="true" />
                        {errors.name && touched.name && (
                          <p
                            className="co-field-error"
                            id="err-name"
                            role="alert"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div className={fieldClass("email")}>
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
                            name="email"
                            type="email"
                            className="co-input"
                            placeholder="your@email.com"
                            value={form.email}
                            onChange={handleChange}
                            onFocus={() => setFocused("email")}
                            onBlur={() => handleBlur("email")}
                            autoComplete="email"
                            aria-invalid={!!errors.email}
                            aria-describedby={
                              errors.email ? "err-email" : undefined
                            }
                          />
                        </div>
                        <div className="co-field-line" aria-hidden="true" />
                        {errors.email && touched.email && (
                          <p
                            className="co-field-error"
                            id="err-email"
                            role="alert"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Subject */}
                    <div className={fieldClass("subject")}>
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
                          name="subject"
                          type="text"
                          className="co-input"
                          placeholder="How can we help?"
                          value={form.subject}
                          onChange={handleChange}
                          onFocus={() => setFocused("subject")}
                          onBlur={() => handleBlur("subject")}
                          aria-invalid={!!errors.subject}
                          aria-describedby={
                            errors.subject ? "err-subject" : undefined
                          }
                        />
                      </div>
                      <div className="co-field-line" aria-hidden="true" />
                      {errors.subject && touched.subject && (
                        <p
                          className="co-field-error"
                          id="err-subject"
                          role="alert"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          {errors.subject}
                        </p>
                      )}
                    </div>

                    {/* Message */}
                    <div
                      className={`${fieldClass("message")} co-field--textarea`}
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
                          name="message"
                          className="co-textarea"
                          placeholder="Share your enquiry with us…"
                          value={form.message}
                          onChange={handleChange}
                          onFocus={() => setFocused("message")}
                          onBlur={() => handleBlur("message")}
                          rows={5}
                          aria-invalid={!!errors.message}
                          aria-describedby={
                            errors.message ? "err-message" : undefined
                          }
                        />
                      </div>
                      <div className="co-field-line" aria-hidden="true" />
                      {errors.message && touched.message && (
                        <p
                          className="co-field-error"
                          id="err-message"
                          role="alert"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          {errors.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button - OPTIMIZED */}
                    <button
                      type="submit"
                      className="co-submit-btn"
                      disabled={sending}
                    >
                      {sending ? (
                        <>
                          <span className="co-spinner" aria-hidden="true" />
                          Sending...
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* TOASTS */}
      <div className="co-toast-wrap" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`co-toast co-toast--${t.type}${
              t.exiting ? " co-toast--exit" : ""
            }`}
            role="status"
          >
            <div className="co-toast-icon">
              {t.type === "success" && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {t.type === "error" && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
              {t.type === "info" && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
            <div className="co-toast-body">
              <p className="co-toast-title">{t.title}</p>
              <p className="co-toast-msg">{t.msg}</p>
            </div>
            <button
              className="co-toast-close"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
