"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import { currencies } from "@/lib/currency";
import { supabase } from "@/lib/supabase";
import "./checkout.css";
import { useCurrency } from "../context/CurrencyContext";

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

export default function Checkout() {
  const router = useRouter();
  const { items, loading, fetchCart, clearCart, getSubtotal } = useCartStore();
  const { formatPrice, currency } = useCurrency();
  const [step, setStep] = useState<Step>("shipping");
  const [focused, setFocused] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+1");
  const [selectedFlag, setSelectedFlag] = useState("🇺🇸");

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    country: "US",
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    const getUserEmail = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email && !form.email) {
        setForm((f) => ({ ...f, email: session.user.email || "" }));
      }
    };
    getUserEmail();

    // Set phone code based on currency
    const countryCurrencies: Record<string, { code: string; flag: string }> = {
      USD: { code: "+1", flag: "🇺🇸" },
      GBP: { code: "+44", flag: "🇬🇧" },
      EUR: { code: "+352", flag: "🇪🇺" },
      AUD: { code: "+61", flag: "🇦🇺" },
    };
    const phoneData = countryCurrencies[currency.code] || {
      code: "+1",
      flag: "🇺🇸",
    };
    setSelectedCountryCode(phoneData.code);
    setSelectedFlag(phoneData.flag);
  }, [currency.code, form.email]);

  const setFormField =
    (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const subtotal = getSubtotal();
  const shipping = subtotal >= 3000 ? 0 : 250;
  const total = subtotal + shipping;
  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  const validateShipping = () => {
    const required = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "zip",
    ];
    for (const field of required) {
      if (!form[field as keyof FormData]) return false;
    }
    return true;
  };

  const validatePayment = () => {
    const required = ["cardNumber", "cardName", "expiry", "cvv"];
    for (const field of required) {
      if (!form[field as keyof FormData]) return false;
    }
    if (form.cardNumber.replace(/\s/g, "").length < 16) return false;
    if (form.cvv.length < 3) return false;
    return true;
  };

  const nextStep = () => {
    if (step === "shipping") {
      if (!validateShipping()) {
        alert("Please fill all shipping details.");
        return;
      }
      setStep("payment");
    } else if (step === "payment") {
      if (!validatePayment()) {
        alert("Please fill all payment details correctly.");
        return;
      }
      setStep("review");
    }
  };

  const prevStep = () => {
    if (step === "payment") setStep("shipping");
    else if (step === "review") setStep("payment");
  };

  const placeOrder = async () => {
    if (items.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    const orderRef = `AX-${Date.now()
      .toString(36)
      .toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;
    setOrderNumber(orderRef);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      // Save order logic here
      await clearCart();
      setPlaced(true);
    } catch (error) {
      console.error("Order placement error:", error);
      alert("There was an error placing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="co-root">
        <div className="co-grain" aria-hidden="true" />
        <div className="co-wrap">
          <div className="co-spinner" />
        </div>
      </div>
    );
  }

  if (items.length === 0 && !placed) {
    return (
      <div className="co-root">
        <div className="co-grain" aria-hidden="true" />
        <div className="co-wrap">
          <div className="co-empty-state">
            <div className="co-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              </svg>
            </div>
            <h2 className="co-empty-title">Your cart is empty</h2>
            <Link href="/watches" className="co-empty-btn">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="co-root">
        <div className="co-success">
          <div className="co-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="co-success-title">
            Thank <em>You</em>
          </h1>
          <p className="co-success-sub">
            Your order has been received. A confirmation has been sent to{" "}
            {form.email}.
          </p>
          <div className="co-success-ref">
            <span>Order Reference</span>
            <span>{orderNumber}</span>
          </div>
          <Link href="/" className="co-success-btn">
            Return Home
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
      <div className="co-wrap">
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
                    width="12"
                    height="12"
                  >
                    <polyline points="20 6 9 17 4 12" />
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
          <div className="co-form-col">
            {step === "shipping" && (
              <div className="co-section">
                <h2 className="co-section-title">
                  <em>01.</em> Shipping Information
                </h2>
                <div className="co-fields-grid">
                  {[
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
                      placeholder: "1234567890",
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
                      label: "ZIP Code",
                      placeholder: "10001",
                      half: true,
                    },
                  ].map((f) => (
                    <div
                      key={f.key}
                      className={`co-field${f.half ? " co-field--half" : ""}${
                        focused === f.key ? " co-field--focused" : ""
                      }`}
                    >
                      <label className="co-label" htmlFor={`co-${f.key}`}>
                        {f.label}
                      </label>
                      <div className="co-input-wrap">
                        <div className="co-phone-prefix">
                          <span className="co-phone-flag">{selectedFlag}</span>
                          <span className="co-phone-code">
                            {selectedCountryCode}
                          </span>
                        </div>
                        <input
                          id={`co-${f.key}`}
                          type={f.type || "text"}
                          className="co-input co-input-with-prefix"
                          placeholder={f.placeholder}
                          value={form[f.key as keyof FormData] as string}
                          onChange={setFormField(f.key as keyof FormData)}
                          onFocus={() => setFocused(f.key)}
                          onBlur={() => setFocused(null)}
                        />
                      </div>
                      <div className="co-field-line" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === "payment" && (
              <div className="co-section">
                <h2 className="co-section-title">
                  <em>02.</em> Payment Details
                </h2>
                <div className="co-card-preview">
                  <div className="co-card-chip" />
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
                  <div className="co-card-brand">TECH4U</div>
                </div>
                <div className="co-fields-grid">
                  {[
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
                  ].map((f) => (
                    <div
                      key={f.key}
                      className={`co-field${f.half ? " co-field--half" : ""}${
                        focused === f.key ? " co-field--focused" : ""
                      }`}
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
                          value={form[f.key as keyof FormData] as string}
                          onChange={setFormField(f.key as keyof FormData)}
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
                      <div className="co-field-line" />
                    </div>
                  ))}
                </div>
                <div className="co-secure-note">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <span>SSL secured checkout</span>
                </div>
              </div>
            )}

            {step === "review" && (
              <div className="co-section">
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
                      📞 {selectedCountryCode} {form.phone}
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
                  {items.map((item) => (
                    <li key={item.id} className="co-review-item">
                      <div>
                        <p className="co-review-item-name">
                          {item.product.name}
                        </p>
                        <p className="co-review-item-variant">
                          {item.product.subcategory} × {item.quantity}
                        </p>
                      </div>
                      <span className="co-review-item-price">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="co-nav-btns">
              {currentStepIndex > 0 ? (
                <button className="co-back-btn" onClick={prevStep}>
                  ← Back
                </button>
              ) : (
                <Link href="/cart" className="co-back-btn">
                  ← Cart
                </Link>
              )}
              {step === "review" ? (
                <button
                  className="co-next-btn"
                  onClick={placeOrder}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="co-spinner-btn" />
                  ) : (
                    <>Place Order →</>
                  )}
                </button>
              ) : (
                <button className="co-next-btn" onClick={nextStep}>
                  Continue →
                </button>
              )}
            </div>
          </div>

          <div className="co-summary-col">
            <div className="co-summary-card">
              <p className="co-summary-title">
                <span className="co-ey-line" />
                Order Summary
                <span className="co-ey-line" />
              </p>
              <ul className="co-summary-items">
                {items.slice(0, 3).map((item) => (
                  <li key={item.id} className="co-summary-item">
                    <div className="co-summary-item-img">
                      {item.product.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          width={42}
                          height={42}
                        />
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="co-summary-item-name">
                        {item.product.name}
                      </p>
                      <p className="co-summary-item-variant">
                        ×{item.quantity}
                      </p>
                    </div>
                    <span className="co-summary-item-price">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </li>
                ))}
                {items.length > 3 && (
                  <li className="co-summary-more">
                    +{items.length - 3} more items
                  </li>
                )}
              </ul>
              <div className="co-summary-breakdown">
                <div className="co-summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="co-summary-row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                <div className="co-summary-divider" />
                <div className="co-summary-row co-summary-total">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
