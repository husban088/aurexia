"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface StripePaymentProps {
  amount: number; // Already converted from PKR → selected currency (e.g. 23.37)
  currency: string; // Already normalized: "usd" | "gbp" | "aud" etc.
  orderNumber: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  // ✅ formatPrice passed from PaymentSection so button shows correct symbol
  formatPrice?: (pkrAmount: number) => string;
  // ✅ Raw PKR total for formatPrice display
  totalAmountPKR?: number;
}

export default function StripePayment({
  amount,
  currency,
  orderNumber,
  onSuccess,
  onError,
  formatPrice,
  totalAmountPKR,
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

    // ✅ Stripe PaymentElement handles card details securely — never touches server
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout?payment_success=true`,
      },
      redirect: "if_required",
    });

    if (error) {
      const errorMsg = error.message || "Payment failed. Please try again.";
      setPaymentError(errorMsg);
      onError(errorMsg);
    } else {
      onSuccess();
    }

    setIsProcessing(false);
  };

  // ✅ Currency symbol map — covers all currencies in your app
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

  // ✅ Button label: use formatPrice if available (shows PKR/USD/AED etc correctly)
  // Otherwise fall back to symbol + amount
  const buttonLabel =
    formatPrice && totalAmountPKR !== undefined
      ? formatPrice(totalAmountPKR)
      : `${getCurrencySymbol(currency)}${amount.toFixed(2)}`;

  return (
    <form onSubmit={handleSubmit} className="sp-stripe-form">
      {/* ✅ Stripe's PaymentElement — fully PCI compliant, shows card/Google Pay/Apple Pay tabs */}
      {/* ✅ NO custom card preview — Stripe already renders its own beautiful card UI */}
      <div className="sp-card-element-wrapper">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {/* ✅ Error message */}
      {paymentError && (
        <div className="sp-error-message">
          <span className="sp-error-icon">⚠️</span>
          <span>{paymentError}</span>
        </div>
      )}

      {/* ✅ Pay button — shows correct currency (Rs. 6,766 / $24.24 / £19.02 etc.) */}
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
          <>Pay {buttonLabel}</>
        )}
      </button>
    </form>
  );
}
