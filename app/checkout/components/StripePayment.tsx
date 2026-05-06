// app/checkout/components/StripePayment.tsx
"use client";

import { useState, useRef } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface StripePaymentProps {
  amount: number;
  currency: string;
  orderNumber: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  formatPrice?: (pkrAmount: number) => string;
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

  // ✅ Prevent double success calls
  const successCalledRef = useRef(false);

  // ✅ Note: Stripe redirect recovery is handled in parent page.tsx via sessionStorage

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;
    if (isProcessing) return;

    setIsProcessing(true);
    setPaymentError(null);

    console.log("💳 Stripe: Confirming payment for order:", orderNumber);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?payment_success=true`,
        },
        redirect: "if_required",
      });

      if (error) {
        // ❌ Payment failed
        console.error("❌ Stripe payment error:", error);
        const errorMsg = error.message || "Payment failed. Please try again.";
        setPaymentError(errorMsg);
        onError(errorMsg);
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // ✅ Payment successful — no redirect happened
        console.log("✅ Stripe payment successful for order:", orderNumber);

        if (!successCalledRef.current) {
          successCalledRef.current = true;
          // ✅ Call onSuccess immediately — toast shows, then success page
          onSuccess();
        }
        // Don't reset isProcessing — component will unmount when success page shows
      } else {
        // Payment requires additional action (redirect will happen automatically)
        console.log("🔄 Stripe: Redirecting for additional authentication...");
      }
    } catch (err: any) {
      console.error("❌ Stripe unexpected error:", err);
      const errorMsg = err.message || "Payment failed. Please try again.";
      setPaymentError(errorMsg);
      onError(errorMsg);
      setIsProcessing(false);
    }
  };

  // ✅ Currency symbol map
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

  // ✅ Button label: use formatPrice if available
  const buttonLabel =
    formatPrice && totalAmountPKR !== undefined
      ? formatPrice(totalAmountPKR)
      : `${getCurrencySymbol(currency)}${amount.toFixed(2)}`;

  return (
    <form onSubmit={handleSubmit} className="sp-stripe-form">
      {/* ✅ Stripe's PaymentElement — fully PCI compliant */}
      <div className="sp-card-element-wrapper">
        <PaymentElement
          options={{
            layout: "tabs",
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

      {/* ✅ Pay button */}
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
