"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface StripePaymentProps {
  amount: number;
  currency: string; // Already normalized: "usd" | "gbp" | "aud"
  orderNumber: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function StripePayment({
  amount,
  currency,
  orderNumber,
  onSuccess,
  onError,
}: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setPaymentError(null);

    // ✅ Confirm payment — Stripe's PaymentElement handles card details securely
    // Card data never touches your server — goes directly to Stripe
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout?payment_success=true`,
      },
      redirect: "if_required", // ✅ No redirect for card payments — stays on page
    });

    if (error) {
      // ✅ Show user-friendly error message
      const errorMsg = error.message || "Payment failed. Please try again.";
      setPaymentError(errorMsg);
      onError(errorMsg);
    } else {
      // ✅ Payment succeeded — notify parent
      onSuccess();
    }

    setIsProcessing(false);
  };

  // ✅ Display currency symbol based on currency code
  const getCurrencySymbol = (code: string): string => {
    const symbols: Record<string, string> = {
      usd: "$",
      gbp: "£",
      aud: "A$",
      eur: "€",
      cad: "C$",
      inr: "₹",
      aed: "د.إ",
      sar: "﷼",
    };
    return symbols[code.toLowerCase()] ?? code.toUpperCase();
  };

  return (
    <form onSubmit={handleSubmit} className="sp-stripe-form">
      {/* ✅ Stripe's PaymentElement — fully PCI compliant, card data goes to Stripe */}
      <div className="sp-card-element-wrapper">
        <PaymentElement
          options={{
            layout: "tabs", // Shows tabs for Card, Google Pay etc
          }}
        />
      </div>

      {/* ✅ Error message display */}
      {paymentError && (
        <div className="sp-error-message">
          <span className="sp-error-icon">⚠️</span>
          <span>{paymentError}</span>
        </div>
      )}

      {/* ✅ Pay button with amount + correct currency symbol */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="sp-pay-button"
      >
        {isProcessing ? (
          <>
            <span className="sp-spinner" />
            Processing...
          </>
        ) : (
          `Pay ${getCurrencySymbol(currency)}${amount.toFixed(2)}`
        )}
      </button>
    </form>
  );
}
