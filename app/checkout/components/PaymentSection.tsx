"use client";

import React, { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripePayment from "./StripePayment";
import PayPalPayment from "./PayPalPayment";
import "./PaymentSection.css";
import { useCurrency } from "@/app/context/CurrencyContext";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
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
  form: {
    cardNumber: string;
    cardName: string;
    expiry: string;
    cvv: string;
  };
  setFormField: (
    key: keyof FormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  getFieldError: (field: keyof FormData) => string | undefined;
  handleBlur: (field: keyof FormData) => void;
  focused: string | null;
  setFocused: (field: string | null) => void;
  totalAmount: number;
  currency: string;
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

// ✅ Currency mapping:
// Stripe doesn't support PKR — convert to USD
// UK customers → GBP, AU customers → AUD, US customers → USD
const getStripeCurrency = (currency: string): string => {
  const map: Record<string, string> = {
    PKR: "usd", // Pakistan → USD (Stripe doesn't support PKR)
    USD: "usd", // USA ✅
    GBP: "gbp", // UK  ✅
    AUD: "aud", // Australia ✅
    EUR: "eur",
    CAD: "cad",
    AED: "aed",
    SAR: "sar",
    INR: "inr",
  };
  return map[currency.toUpperCase()] ?? "usd";
};

// ✅ PayPal currency mapping (same logic)
const getPayPalCurrency = (currency: string): string => {
  const map: Record<string, string> = {
    PKR: "USD", // Pakistan → USD
    USD: "USD", // USA ✅
    GBP: "GBP", // UK  ✅
    AUD: "AUD", // Australia ✅
    EUR: "EUR",
    CAD: "CAD",
    AED: "AED",
    SAR: "SAR",
    INR: "INR",
  };
  return map[currency.toUpperCase()] ?? "USD";
};

export default function PaymentSection({
  totalAmount,
  currency,
  orderNumber,
  formData,
  subtotal,
  shipping,
  total,
  onPaymentSuccess,
  onPaymentError,
  onPaymentMethodChange,
}: PaymentSectionProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "card" | "paypal"
  >("card");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);

  // ✅ Currency context — convert PKR → selected currency for Stripe/PayPal
  const { formatPrice, currency: currencyObj } = useCurrency();

  // ✅ Convert PKR totalAmount → selected currency (e.g. 6766 PKR → $24.24 USD)
  const convertedTotal = parseFloat(
    (totalAmount * currencyObj.rate).toFixed(2)
  );

  // ✅ Get correct currencies
  const stripeCurrency = getStripeCurrency(currency);
  const paypalCurrency = getPayPalCurrency(currency);

  const handleMethodChange = (method: "card" | "paypal") => {
    setSelectedPaymentMethod(method);
    if (onPaymentMethodChange) {
      onPaymentMethodChange(method);
    }
  };

  // ✅ Create Stripe Payment Intent with correct currency
  useEffect(() => {
    if (
      selectedPaymentMethod === "card" &&
      convertedTotal > 0 &&
      !clientSecret
    ) {
      const createPaymentIntent = async () => {
        setIsLoadingStripe(true);
        try {
          const response = await fetch("/api/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: convertedTotal, // ✅ PKR converted to display currency
              currency: stripeCurrency, // ✅ "usd" | "gbp" | "aud" — never "pkr"
              metadata: {
                orderNumber,
                customerEmail: formData.email,
                customerName: `${formData.firstName} ${formData.lastName}`,
              },
            }),
          });

          const data = await response.json();
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            onPaymentError("Failed to initialize payment");
          }
        } catch (error) {
          console.error("Error creating payment intent:", error);
          onPaymentError("Failed to initialize Stripe");
        } finally {
          setIsLoadingStripe(false);
        }
      };
      createPaymentIntent();
    }
  }, [
    selectedPaymentMethod,
    totalAmount,
    stripeCurrency,
    orderNumber,
    formData.email,
    formData.firstName,
    formData.lastName,
    clientSecret,
  ]);

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

      {/* Payment Method Selector */}
      <div className="ps-payment-method-selector">
        <button
          className={`ps-method-btn ${
            selectedPaymentMethod === "card" ? "ps-method-btn--active" : ""
          }`}
          onClick={() => handleMethodChange("card")}
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

      {/* ✅ Card preview removed — Stripe PaymentElement renders its own secure card UI */}

      {/* ✅ Stripe Card Payment Form */}
      {selectedPaymentMethod === "card" && (
        <div className="ps-stripe-container">
          {clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance,
              }}
            >
              <StripePayment
                amount={convertedTotal}
                currency={stripeCurrency}
                orderNumber={orderNumber}
                onSuccess={onPaymentSuccess}
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

      {/* ✅ PayPal Payment */}
      {selectedPaymentMethod === "paypal" && (
        <div className="ps-paypal-container">
          <PayPalPayment
            amount={convertedTotal}
            currency={paypalCurrency}
            orderNumber={orderNumber}
            formData={formData}
            subtotal={parseFloat((subtotal * currencyObj.rate).toFixed(2))}
            shipping={parseFloat((shipping * currencyObj.rate).toFixed(2))}
            total={convertedTotal}
            onSuccess={onPaymentSuccess}
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
