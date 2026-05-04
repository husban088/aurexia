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
  form?: {
    cardNumber: string;
    cardName: string;
    expiry: string;
    cvv: string;
  };
  setFormField?: (
    key: keyof FormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  getFieldError?: (field: keyof FormData) => string | undefined;
  handleBlur?: (field: keyof FormData) => void;
  focused?: string | null;
  setFocused?: (field: string | null) => void;
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

const getStripeCurrency = (currency: string): string => {
  if (!currency || typeof currency !== "string") {
    return "usd";
  }
  const map: Record<string, string> = {
    PKR: "usd",
    USD: "usd",
    GBP: "gbp",
    AUD: "aud",
    EUR: "eur",
    CAD: "cad",
    AED: "aed",
    SAR: "sar",
    INR: "inr",
  };
  const upperCurrency = currency.toUpperCase();
  return map[upperCurrency] ?? "usd";
};

const getPayPalCurrency = (currency: string): string => {
  if (!currency || typeof currency !== "string") {
    return "USD";
  }
  const map: Record<string, string> = {
    PKR: "USD",
    USD: "USD",
    GBP: "GBP",
    AUD: "AUD",
    EUR: "EUR",
    CAD: "CAD",
    AED: "AED",
    SAR: "SAR",
    INR: "INR",
  };
  const upperCurrency = currency.toUpperCase();
  return map[upperCurrency] ?? "USD";
};

export default function PaymentSection({
  totalAmount,
  currency = "USD",
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
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const { formatPrice, currency: currencyObj } = useCurrency();
  const conversionRate = currencyObj?.rate || 1;
  const convertedTotal = parseFloat((totalAmount * conversionRate).toFixed(2));

  const stripeCurrency = getStripeCurrency(currency);
  const paypalCurrency = getPayPalCurrency(currency);

  const handleMethodChange = (method: "card" | "paypal") => {
    setSelectedPaymentMethod(method);
    if (onPaymentMethodChange) {
      onPaymentMethodChange(method);
    }
  };

  useEffect(() => {
    if (
      selectedPaymentMethod === "card" &&
      convertedTotal > 0 &&
      !clientSecret &&
      !paymentProcessing
    ) {
      const createPaymentIntent = async () => {
        setIsLoadingStripe(true);
        try {
          const response = await fetch("/api/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: convertedTotal,
              currency: stripeCurrency,
              metadata: {
                orderNumber,
                customerEmail: formData?.email || "",
                customerName: formData
                  ? `${formData.firstName} ${formData.lastName}`
                  : "",
              },
            }),
          });

          const data = await response.json();
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            onPaymentError(data.error || "Failed to initialize payment");
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
    convertedTotal,
    stripeCurrency,
    orderNumber,
    formData?.email,
    formData?.firstName,
    formData?.lastName,
    clientSecret,
    onPaymentError,
    paymentProcessing,
  ]);

  const handlePaymentSuccess = () => {
    setPaymentProcessing(true);
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
          {!paymentProcessing ? (
            <PayPalPayment
              amount={convertedTotal}
              currency={paypalCurrency}
              orderNumber={orderNumber}
              formData={formData}
              subtotal={parseFloat((subtotal * conversionRate).toFixed(2))}
              shipping={parseFloat((shipping * conversionRate).toFixed(2))}
              total={convertedTotal}
              onSuccess={handlePaymentSuccess}
              onError={onPaymentError}
            />
          ) : (
            <div className="ps-loading">
              <div className="co-spinner" />
              <span>Completing your order...</span>
            </div>
          )}
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
