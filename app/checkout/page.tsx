"use client";

import { useState } from "react";
import Link from "next/link";
import "./checkout.css";

type Step = "shipping" | "payment" | "review";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
}

const STEPS: { id: Step; label: string; num: string }[] = [
  { id: "shipping", label: "Shipping", num: "01" },
  { id: "payment", label: "Payment", num: "02" },
  { id: "review", label: "Review", num: "03" },
];

const orderItems = [
  {
    name: "Prestige Chronograph",
    variant: "Rose Gold · 42mm",
    price: 429,
    qty: 1,
  },
  {
    name: "Elite Magsafe Wallet",
    variant: "Midnight Black",
    price: 89,
    qty: 2,
  },
];

export default function Checkout() {
  const [step, setStep] = useState<Step>("shipping");
  const [focused, setFocused] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    country: "",
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  const set =
    (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const subtotal = orderItems.reduce((a, b) => a + b.price * b.qty, 0);
  const shipping = subtotal >= 300 ? 0 : 25;
  const total = subtotal + shipping;

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  const nextStep = () => {
    if (step === "shipping") setStep("payment");
    else if (step === "payment") setStep("review");
    else setPlaced(true);
  };

  const prevStep = () => {
    if (step === "payment") setStep("shipping");
    else if (step === "review") setStep("payment");
  };

  if (placed) {
    return (
      <div className="co-root">
        <div className="co-grain" aria-hidden="true" />
        <div className="co-lines" aria-hidden="true">
          {[...Array(5)].map((_, i) => (
            <span key={i} />
          ))}
        </div>
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
          <p className="co-eyebrow">
            <span className="co-ey-line" />
            Order Confirmed
            <span className="co-ey-line" />
          </p>
          <h1 className="co-success-title">
            Thank <em>You</em>
          </h1>
          <p className="co-success-sub">
            Your order has been received and is being prepared with care. A
            confirmation has been sent to {form.email || "your email"}.
          </p>
          <div className="co-success-ref">
            <span className="co-success-ref-label">Order Reference</span>
            <span className="co-success-ref-val">
              AX-{Math.random().toString(36).substring(2, 8).toUpperCase()}
            </span>
          </div>
          <Link href="/" className="co-success-btn">
            <span>Return Home</span>
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
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="co-root">
      <div className="co-grain" aria-hidden="true" />
      <div className="co-lines" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className="co-ambient" aria-hidden="true" />
      <div className="co-corner co-corner--tl" aria-hidden="true" />
      <div className="co-corner co-corner--tr" aria-hidden="true" />

      <div className="co-wrap">
        {/* Header */}
        <div className="co-header">
          <p className="co-eyebrow">
            <span className="co-ey-line" />
            Secure Checkout
            <span className="co-ey-line" />
          </p>
          <h1 className="co-title">
            Complete <em>Your Order</em>
          </h1>
        </div>

        {/* Step indicator */}
        <div className="co-steps">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`co-step${s.id === step ? " co-step--active" : ""}${
                i < currentStepIndex ? " co-step--done" : ""
              }`}
            >
              <div className="co-step-circle">
                {i < currentStepIndex ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="12"
                    height="12"
                  >
                    <polyline
                      points="20 6 9 17 4 12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span>{s.num}</span>
                )}
              </div>
              <span className="co-step-label">{s.label}</span>
              {i < STEPS.length - 1 && <div className="co-step-line" />}
            </div>
          ))}
        </div>

        <div className="co-layout">
          {/* ── Form Column ── */}
          <div className="co-form-col">
            {/* SHIPPING STEP */}
            {step === "shipping" && (
              <div className="co-section" key="shipping">
                <h2 className="co-section-title">
                  <em>01.</em> Shipping Information
                </h2>
                <div className="co-fields-grid">
                  {(
                    [
                      {
                        key: "firstName",
                        label: "First Name",
                        placeholder: "John",
                        half: true,
                      },
                      {
                        key: "lastName",
                        label: "Last Name",
                        placeholder: "Doe",
                        half: true,
                      },
                      {
                        key: "email",
                        label: "Email Address",
                        placeholder: "john@email.com",
                        type: "email",
                      },
                      {
                        key: "phone",
                        label: "Phone Number",
                        placeholder: "+1 (555) 000-0000",
                        type: "tel",
                      },
                      {
                        key: "address",
                        label: "Street Address",
                        placeholder: "123 Luxury Ave",
                      },
                      {
                        key: "city",
                        label: "City",
                        placeholder: "New York",
                        half: true,
                      },
                      {
                        key: "zip",
                        label: "ZIP / Postal Code",
                        placeholder: "10001",
                        half: true,
                      },
                      {
                        key: "country",
                        label: "Country",
                        placeholder: "United States",
                      },
                    ] as {
                      key: keyof FormData;
                      label: string;
                      placeholder: string;
                      half?: boolean;
                      type?: string;
                    }[]
                  ).map((f) => (
                    <div
                      key={f.key}
                      className={`co-field${f.half ? " co-field--half" : ""}${
                        focused === f.key ? " co-field--focused" : ""
                      }${form[f.key] ? " co-field--filled" : ""}`}
                    >
                      <label className="co-label" htmlFor={`co-${f.key}`}>
                        {f.label}
                      </label>
                      <div className="co-input-wrap">
                        <input
                          id={`co-${f.key}`}
                          type={f.type || "text"}
                          className="co-input"
                          placeholder={f.placeholder}
                          value={form[f.key]}
                          onChange={set(f.key)}
                          onFocus={() => setFocused(f.key)}
                          onBlur={() => setFocused(null)}
                        />
                      </div>
                      <div className="co-field-line" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PAYMENT STEP */}
            {step === "payment" && (
              <div className="co-section" key="payment">
                <h2 className="co-section-title">
                  <em>02.</em> Payment Details
                </h2>

                {/* Card preview */}
                <div className="co-card-preview">
                  <div className="co-card-chip" aria-hidden="true" />
                  <p className="co-card-num-display">
                    {form.cardNumber
                      ? form.cardNumber.replace(/(.{4})/g, "$1 ").trim()
                      : "•••• •••• •••• ••••"}
                  </p>
                  <div className="co-card-meta">
                    <span className="co-card-name-display">
                      {form.cardName || "CARDHOLDER NAME"}
                    </span>
                    <span className="co-card-exp-display">
                      {form.expiry || "MM/YY"}
                    </span>
                  </div>
                  <div className="co-card-brand" aria-hidden="true">
                    VISA
                  </div>
                </div>

                <div className="co-fields-grid">
                  {(
                    [
                      {
                        key: "cardNumber",
                        label: "Card Number",
                        placeholder: "1234 5678 9012 3456",
                      },
                      {
                        key: "cardName",
                        label: "Cardholder Name",
                        placeholder: "JOHN DOE",
                      },
                      {
                        key: "expiry",
                        label: "Expiry",
                        placeholder: "MM/YY",
                        half: true,
                      },
                      {
                        key: "cvv",
                        label: "CVV",
                        placeholder: "•••",
                        half: true,
                      },
                    ] as {
                      key: keyof FormData;
                      label: string;
                      placeholder: string;
                      half?: boolean;
                    }[]
                  ).map((f) => (
                    <div
                      key={f.key}
                      className={`co-field${f.half ? " co-field--half" : ""}${
                        focused === f.key ? " co-field--focused" : ""
                      }${form[f.key] ? " co-field--filled" : ""}`}
                    >
                      <label className="co-label" htmlFor={`co-${f.key}`}>
                        {f.label}
                      </label>
                      <div className="co-input-wrap">
                        <input
                          id={`co-${f.key}`}
                          type={f.key === "cvv" ? "password" : "text"}
                          className="co-input"
                          placeholder={f.placeholder}
                          value={form[f.key]}
                          onChange={set(f.key)}
                          onFocus={() => setFocused(f.key)}
                          onBlur={() => setFocused(null)}
                          maxLength={
                            f.key === "cardNumber"
                              ? 19
                              : f.key === "cvv"
                              ? 4
                              : undefined
                          }
                        />
                      </div>
                      <div className="co-field-line" aria-hidden="true" />
                    </div>
                  ))}
                </div>

                <div className="co-secure-note">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    width="13"
                    height="13"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <span>
                    Your payment is secured with 256-bit SSL encryption
                  </span>
                </div>
              </div>
            )}

            {/* REVIEW STEP */}
            {step === "review" && (
              <div className="co-section" key="review">
                <h2 className="co-section-title">
                  <em>03.</em> Review Your Order
                </h2>

                <div className="co-review-blocks">
                  <div className="co-review-block">
                    <p className="co-review-block-title">Shipping To</p>
                    <p className="co-review-block-val">
                      {form.firstName} {form.lastName}
                      <br />
                      {form.address}, {form.city} {form.zip}
                      <br />
                      {form.country}
                    </p>
                  </div>
                  <div className="co-review-block">
                    <p className="co-review-block-title">Payment</p>
                    <p className="co-review-block-val">
                      Card ending in{" "}
                      {form.cardNumber ? form.cardNumber.slice(-4) : "••••"}
                      <br />
                      {form.cardName || "—"}
                    </p>
                  </div>
                </div>

                <ul className="co-review-items">
                  {orderItems.map((item) => (
                    <li key={item.name} className="co-review-item">
                      <div className="co-review-item-info">
                        <span className="co-review-item-name">{item.name}</span>
                        <span className="co-review-item-variant">
                          {item.variant} × {item.qty}
                        </span>
                      </div>
                      <span className="co-review-item-price">
                        ${(item.price * item.qty).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="co-review-terms">
                  By placing your order you agree to our{" "}
                  <Link href="/terms" className="co-review-link">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="co-review-link">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            )}

            {/* Nav buttons */}
            <div className="co-nav-btns">
              {currentStepIndex > 0 ? (
                <button className="co-back-btn" onClick={prevStep}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    width="14"
                    height="14"
                  >
                    <path
                      d="M19 12H5M12 19l-7-7 7-7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Back
                </button>
              ) : (
                <Link href="/cart" className="co-back-btn">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    width="14"
                    height="14"
                  >
                    <path
                      d="M19 12H5M12 19l-7-7 7-7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Cart
                </Link>
              )}

              <button className="co-next-btn" onClick={nextStep}>
                <span>{step === "review" ? "Place Order" : "Continue"}</span>
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
          </div>

          {/* ── Order Summary Column ── */}
          <div className="co-summary-col">
            <div className="co-summary-card">
              <p className="co-summary-title">
                <span className="co-ey-line" />
                Order Summary
                <span className="co-ey-line" />
              </p>

              <ul className="co-summary-items">
                {orderItems.map((item) => (
                  <li key={item.name} className="co-summary-item">
                    <div className="co-summary-item-img" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.8"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <div className="co-summary-item-info">
                      <span className="co-summary-item-name">{item.name}</span>
                      <span className="co-summary-item-variant">
                        {item.variant}
                      </span>
                    </div>
                    <span className="co-summary-item-price">
                      ${(item.price * item.qty).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="co-summary-breakdown">
                <div className="co-summary-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="co-summary-row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `$${shipping}`}</span>
                </div>
                <div className="co-summary-divider" />
                <div className="co-summary-row co-summary-total">
                  <span>Total</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>

              {/* Perks */}
              <div className="co-perks">
                {[
                  { icon: "✦", text: "Luxury gift packaging included" },
                  { icon: "↩", text: "30-day free returns" },
                  { icon: "🔒", text: "SSL secured checkout" },
                ].map((p) => (
                  <div key={p.text} className="co-perk">
                    <span className="co-perk-icon">{p.icon}</span>
                    <span className="co-perk-text">{p.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
