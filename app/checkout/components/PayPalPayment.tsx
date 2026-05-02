"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

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
  // ✅ currency is already "USD" | "GBP" | "AUD" — handled in PaymentSection
  const finalCurrency = currency.toUpperCase();

  const createOrder = async () => {
    try {
      const response = await fetch("/api/create-paypal-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: finalCurrency, // ✅ Correct currency sent to API
          orderData: {
            orderNumber,
            description: `Order ${orderNumber} - Tech4U`,
          },
        }),
      });

      const data = await response.json();

      if (!data.orderId) {
        onPaymentError("Failed to create PayPal order");
        return;
      }

      return data.orderId;
    } catch (error) {
      console.error("Failed to create PayPal order:", error);
      onPaymentError("Failed to initialize PayPal");
    }
  };

  const onApprove = async (data: any) => {
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

      if (result.success) {
        onSuccess(); // ✅ Payment captured — notify parent
      } else {
        onPaymentError(result.error || "Payment capture failed");
      }
    } catch (error) {
      console.error("Error capturing PayPal order:", error);
      onPaymentError("Payment processing failed");
    }
  };

  const handlePayPalError = (err: any) => {
    console.error("PayPal error:", err);
    onPaymentError("PayPal payment failed. Please try again.");
  };

  return (
    // ✅ PayPalScriptProvider with correct currency
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: finalCurrency, // ✅ "USD" | "GBP" | "AUD"
        intent: "capture",
      }}
    >
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={handlePayPalError}
        style={{
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
        }}
      />
    </PayPalScriptProvider>
  );
}
