// app/checkout/components/PayPalPayment.tsx
"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState } from "react";

interface PayPalPaymentProps {
  amount: number;
  currency: string; // Already normalized: "USD" | "GBP" | "AUD"
  orderNumber: string;
  formData: any;
  subtotal: number;
  shipping: number;
  total: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function PayPalPayment({
  amount,
  currency,
  orderNumber,
  formData,
  subtotal,
  shipping,
  total,
  onSuccess,
  onError: onPaymentError,
}: PayPalPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ currency is already "USD" | "GBP" | "AUD" — handled in PaymentSection
  const finalCurrency = currency.toUpperCase();

  // Validate amount
  if (!amount || amount <= 0) {
    console.error("Invalid amount for PayPal:", amount);
    return (
      <div className="ps-paypal-error">
        <p>Unable to process payment. Invalid amount.</p>
      </div>
    );
  }

  const createOrder = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/create-paypal-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: finalCurrency,
          orderData: {
            orderNumber,
            description: `Order ${orderNumber} - Tech4U`,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create PayPal order");
      }

      if (!data.orderId) {
        throw new Error("No order ID received from PayPal");
      }

      setIsProcessing(false);
      return data.orderId;
    } catch (error) {
      console.error("Failed to create PayPal order:", error);
      setIsProcessing(false);
      onPaymentError(
        error instanceof Error ? error.message : "Failed to initialize PayPal"
      );
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/capture-paypal-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: data.orderID,
          orderNumber,
          formData,
          subtotal,
          shipping,
          total,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onSuccess(); // ✅ Payment captured — notify parent
      } else {
        throw new Error(result.error || "Payment capture failed");
      }
    } catch (error) {
      console.error("Error capturing PayPal order:", error);
      onPaymentError(
        error instanceof Error ? error.message : "Payment processing failed"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalError = (err: any) => {
    console.error("PayPal error:", err);
    setIsProcessing(false);
    onPaymentError(
      "PayPal payment failed. Please try again or use a different payment method."
    );
  };

  // Client ID validation
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!clientId || clientId === "your_paypal_client_id") {
    return (
      <div className="ps-paypal-error">
        <p>
          ⚠️ PayPal is not configured yet. Please add your PayPal API
          credentials to .env.local
        </p>
        <p style={{ fontSize: "12px", marginTop: "8px" }}>
          Get your credentials from{" "}
          <a
            href="https://developer.paypal.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            PayPal Developer Portal
          </a>
        </p>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="ps-loading">
        <div className="co-spinner" />
        <span>Processing PayPal payment...</span>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: clientId,
        currency: finalCurrency,
        intent: "capture",
        components: "buttons",
      }}
    >
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={handlePayPalError}
        onCancel={() => {
          console.log("PayPal payment cancelled");
          onPaymentError("Payment was cancelled");
        }}
        style={{
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
          height: 48,
        }}
      />
    </PayPalScriptProvider>
  );
}
