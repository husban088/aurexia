"use client";

import React, { useState, useEffect, useRef } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripePayment from "./StripePayment";
import PayPalPayment from "./PayPalPayment";
import "./PaymentSection.css";
import { useCurrency } from "@/app/context/CurrencyContext";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  zip: string;
  country: string;
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
}

interface PaymentSectionProps {
  form?: {
    cardNumber: string;
    cardName: string;
    expiry: string;
    cvv: string;
  };
  setFormField?: (
    key: keyof FormData,
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  getFieldError?: (field: keyof FormData) => string | undefined;
  handleBlur?: (field: keyof FormData) => void;
  focused?: string | null;
  setFocused?: (field: string | null) => void;
  totalAmount: number;
  orderNumber: string;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    apartment: string;
    city: string;
    zip: string;
  };
  subtotal: number;
  shipping: number;
  total: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  onPaymentMethodChange?: (method: "card" | "paypal") => void;
}

// ── PKR → target currency conversion rates ────────────────────────────────────
const PKR_RATES: Record<string, number> = {
  USD: 0.0036,
  GBP: 0.00284,
  AUD: 0.00548,
  EUR: 0.00332,
  CAD: 0.0049,
  AED: 0.01322,
  SAR: 0.0135,
  INR: 0.3,
  NZD: 0.00594,
  SGD: 0.00484,
  JPY: 0.54,
  CNY: 0.02612,
  CHF: 0.00316,
  PKR: 1.0,
};

// ── Currencies Stripe supports (lowercase) ────────────────────────────────────
const STRIPE_SUPPORTED = new Set([
  "usd",
  "gbp",
  "aud",
  "eur",
  "cad",
  "aed",
  "sar",
  "inr",
  "sgd",
  "nzd",
  "jpy",
  "chf",
]);

// ── Zero-decimal currencies ───────────────────────────────────────────────────
const ZERO_DECIMAL = new Set(["jpy", "krw", "idr", "twd"]);

// ─────────────────────────────────────────────────────────────────────────────
// getStripeReady — ONE function, ONE source of truth
// Input:  detectedCurrencyCode e.g. "USD", "PKR", "GBP", "AED"
// Output: { stripeCurrency: "usd", convertRate: 0.0036 }
// PKR → always USD (Stripe nahi karta PKR)
// Unknown → USD fallback
// ─────────────────────────────────────────────────────────────────────────────
function getStripeReady(detectedCode: string): {
  stripeCurrency: string;
  pkrRate: number;
} {
  const upper = (detectedCode || "USD").toUpperCase();

  // PKR → USD (Stripe doesn't support PKR)
  const targetUpper = upper === "PKR" ? "USD" : upper;
  const stripeCurrency = targetUpper.toLowerCase();

  // If Stripe doesn't support this currency → fallback to USD
  if (!STRIPE_SUPPORTED.has(stripeCurrency)) {
    return { stripeCurrency: "usd", pkrRate: PKR_RATES["USD"] };
  }

  const pkrRate = PKR_RATES[targetUpper] ?? PKR_RATES["USD"];
  return { stripeCurrency, pkrRate };
}

// ── Convert PKR to Stripe amount (already in float, e.g. 13.55) ──────────────
function convertPKRtoFloat(pkrAmount: number, pkrRate: number): number {
  const raw = pkrAmount * pkrRate;
  return Math.max(0.5, parseFloat(raw.toFixed(2))); // minimum $0.50 safety
}

export default function PaymentSection({
  totalAmount,
  orderNumber,
  formData,
  subtotal,
  shipping,
  total,
  onPaymentSuccess,
  onPaymentError,
  onPaymentMethodChange,
  form = { cardNumber: "", cardName: "", expiry: "", cvv: "" },
  setFormField = () => () => {},
  getFieldError = () => undefined,
  handleBlur = () => {},
  focused = null,
  setFocused = () => {},
}: PaymentSectionProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "card" | "paypal"
  >("card");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);

  const successCalledRef = useRef(false);

  const { formatPrice, currency: detectedCurrency } = useCurrency();

  // ✅ SINGLE SOURCE OF TRUTH — ek jagah se currency + rate dono niklo
  const { stripeCurrency, pkrRate } = getStripeReady(
    detectedCurrency?.code || "USD",
  );

  // ✅ convertedTotal — PKR amount → foreign currency float (e.g. 3820 PKR → 13.75 USD)
  const convertedTotal = convertPKRtoFloat(totalAmount, pkrRate);

  console.log(
    `💱 Currency: ${detectedCurrency?.code || "USD"} → Stripe: ${stripeCurrency.toUpperCase()} | PKR ${totalAmount} → ${convertedTotal} ${stripeCurrency.toUpperCase()}`,
  );

  const handleMethodChange = (method: "card" | "paypal") => {
    setSelectedPaymentMethod(method);
    if (onPaymentMethodChange) onPaymentMethodChange(method);
  };

  // ✅ Create Stripe PaymentIntent when card selected
  useEffect(() => {
    if (
      selectedPaymentMethod === "card" &&
      convertedTotal > 0 &&
      !clientSecret
    ) {
      const createPaymentIntent = async () => {
        setIsLoadingStripe(true);
        try {
          console.log(
            `📤 Sending to Stripe: amount=${convertedTotal} currency=${stripeCurrency} order=${orderNumber}`,
          );

          const response = await fetch("/api/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: convertedTotal, // ✅ correct float amount
              currency: stripeCurrency, // ✅ correct stripe currency code
              metadata: {
                orderNumber,
                customerEmail: formData?.email || "",
                customerName: formData
                  ? `${formData.firstName} ${formData.lastName}`.trim()
                  : "",
                originalCurrency: "PKR",
                originalAmount: totalAmount,
              },
            }),
          });

          const data = await response.json();

          if (data.clientSecret) {
            console.log(`✅ PaymentIntent ready: ${data.paymentIntentId}`);
            setClientSecret(data.clientSecret);
          } else {
            console.error("❌ PaymentIntent failed:", data.error);
            onPaymentError(data.error || "Failed to initialize payment");
          }
        } catch (error) {
          console.error("❌ create-payment-intent network error:", error);
          onPaymentError(
            "Failed to initialize payment. Please refresh and try again.",
          );
        } finally {
          setIsLoadingStripe(false);
        }
      };

      createPaymentIntent();
    }
  }, [
    selectedPaymentMethod,
    convertedTotal,
    stripeCurrency,
    orderNumber,
    formData?.email,
    formData?.firstName,
    formData?.lastName,
    clientSecret,
    onPaymentError,
  ]);

  // ✅ Payment success — foran parent call, koi delay nahi
  const handlePaymentSuccess = () => {
    if (successCalledRef.current) return;
    successCalledRef.current = true;
    onPaymentSuccess();
  };

  const appearance = {
    theme: "flat" as const,
    variables: {
      colorPrimary: "#daa520",
      colorBackground: "#ffffff",
      colorText: "#1a1a1a",
      borderRadius: "12px",
    },
  };

  return (
    <div className="ps-payment-section">
      <h2 className="ps-section-title">
        <em>02.</em> Payment Details
      </h2>

      {/* Payment method selector */}
      <div className="ps-payment-method-selector">
        <button
          className={`ps-method-btn ${
            selectedPaymentMethod === "card" ? "ps-method-btn--active" : ""
          }`}
          onClick={() => handleMethodChange("card")}
          type="button"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 8h20" />
            <circle cx="7" cy="16" r="1" />
            <circle cx="17" cy="16" r="1" />
          </svg>
          Credit / Debit Card
        </button>
        <button
          className={`ps-method-btn ${
            selectedPaymentMethod === "paypal" ? "ps-method-btn--active" : ""
          }`}
          onClick={() => handleMethodChange("paypal")}
          type="button"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M7 8h10M7 12h6M7 16h4" />
            <rect x="3" y="4" width="18" height="16" rx="2" />
          </svg>
          PayPal
        </button>
      </div>

      {selectedPaymentMethod === "card" && (
        <div className="ps-stripe-container">
          {clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance }}
            >
              <StripePayment
                amount={convertedTotal}
                currency={stripeCurrency}
                orderNumber={orderNumber}
                onSuccess={handlePaymentSuccess}
                onError={onPaymentError}
                formatPrice={formatPrice}
                totalAmountPKR={totalAmount}
              />
            </Elements>
          ) : isLoadingStripe ? (
            <div className="ps-loading">
              <div className="co-spinner" />
              <span>Initializing secure payment...</span>
            </div>
          ) : (
            <div className="ps-loading">
              <div className="co-spinner" />
              <span>Loading payment form...</span>
            </div>
          )}
        </div>
      )}

      {selectedPaymentMethod === "paypal" && (
        <div className="ps-paypal-container">
          <PayPalPayment
            amount={totalAmount}
            orderNumber={orderNumber}
            formData={formData}
            subtotal={subtotal}
            shipping={shipping}
            total={total}
            onSuccess={handlePaymentSuccess}
            onError={onPaymentError}
          />
        </div>
      )}

      <div className="ps-secure-note">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          width="16"
          height="16"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <span>
          SSL secured checkout • Your payment info is encrypted
          {selectedPaymentMethod === "card" ? " by Stripe" : " by PayPal"}
        </span>
      </div>
    </div>
  );
}
