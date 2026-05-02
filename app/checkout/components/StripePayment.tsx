"use client";

import { useEffect, useState } from "react";
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

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout?payment_success=true`,
        payment_method_data: {
          billing_details: {
            name: document.querySelector<HTMLInputElement>("#cardholder-name")
              ?.value,
          },
        },
      },
      redirect: "if_required",
    });

    if (error) {
      setPaymentError(error.message || "Payment failed");
      onError(error.message || "Payment failed");
    } else {
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="sp-stripe-form">
      <div className="sp-card-element-wrapper">
        <PaymentElement />
      </div>

      {paymentError && (
        <div className="sp-error-message">
          <span className="sp-error-icon">⚠️</span>
          <span>{paymentError}</span>
        </div>
      )}

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
          `Pay ${amount} ${currency.toUpperCase()}`
        )}
      </button>
    </form>
  );
}
