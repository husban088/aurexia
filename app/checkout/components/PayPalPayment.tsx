// app/checkout/components/PayPalPayment.tsx
"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState } from "react";

interface PayPalPaymentProps {
  amount: number;
  currency: string;
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
  const [paymentCancelled, setPaymentCancelled] = useState(false);

  const finalCurrency = currency.toUpperCase();
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // ✅ Amount check
  if (!amount || amount <= 0) {
    return (
      <div className="ps-paypal-error">
        <p>Unable to process payment. Invalid amount.</p>
      </div>
    );
  }

  // ✅ Client ID check — sirf missing/placeholder check, hardcoded ID block NAHI
  if (!clientId || clientId === "your_paypal_client_id") {
    return (
      <div className="ps-paypal-error">
        <p>
          ⚠️ PayPal Client ID missing hai. .env.local mein
          NEXT_PUBLIC_PAYPAL_CLIENT_ID daalo.
        </p>
      </div>
    );
  }

  const createOrder = async () => {
    setPaymentCancelled(false);
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

      return data.orderId;
    } catch (error) {
      console.error("Failed to create PayPal order:", error);
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
        onSuccess();
      } else {
        throw new Error(result.error || "Payment capture failed");
      }
    } catch (error) {
      console.error("Error capturing PayPal order:", error);
      setIsProcessing(false);
      onPaymentError(
        error instanceof Error ? error.message : "Payment processing failed"
      );
    }
  };

  const handlePayPalError = (err: any) => {
    console.error("PayPal error:", err);
    setIsProcessing(false);
    onPaymentError(
      "PayPal payment failed. Please try again or use a different payment method."
    );
  };

  const handleCancel = () => {
    console.log("PayPal payment cancelled by user");
    setPaymentCancelled(true);
    setIsProcessing(false);
  };

  // ✅ Processing spinner — sirf capture ke baad (popup close hone pe NAHI)
  if (isProcessing) {
    return (
      <div className="ps-loading">
        <div className="co-spinner" />
        <span>Processing your payment...</span>
      </div>
    );
  }

  return (
    // ✅ KEY FIX: PayPalScriptProvider yahan hai — stable rahega, re-render pe script reload nahi hogi
    <PayPalScriptProvider
      options={{
        clientId: clientId,
        currency: finalCurrency,
        intent: "capture",
        components: "buttons",
      }}
    >
      <div>
        {paymentCancelled && (
          <div
            style={{
              marginBottom: "12px",
              padding: "10px 14px",
              background: "#fff8e1",
              border: "1px solid #f0b429",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#7c5a00",
            }}
          >
            ⚠️ Payment cancel ho gayi. Dobara try karo.
          </div>
        )}

        <PayPalButtons
          key={`${orderNumber}-${finalCurrency}`}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={handlePayPalError}
          onCancel={handleCancel}
          forceReRender={[amount, finalCurrency, orderNumber]}
          style={{
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "paypal",
            height: 48,
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}
