// app/checkout/components/PayPalPayment.tsx
"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState } from "react";
import { useCurrency } from "@/app/context/CurrencyContext";

interface PayPalPaymentProps {
  amount: number; // Raw PKR amount
  orderNumber: string;
  formData: any;
  subtotal: number;
  shipping: number;
  total: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

// ✅ PayPal supported currencies
const PAYPAL_SUPPORTED: Set<string> = new Set([
  "USD",
  "GBP",
  "AUD",
  "EUR",
  "CAD",
  "AED",
  "SAR",
  "INR",
  "NZD",
  "SGD",
  "JPY",
  "CNY",
  "BRL",
  "MXN",
  "SEK",
  "NOK",
  "DKK",
  "CHF",
  "HKD",
  "TWD",
  "THB",
  "MYR",
  "PHP",
  "IDR",
  "ZAR",
  "PLN",
  "CZK",
  "HUF",
  "ILS",
  "KRW",
  "NGN",
  "QAR",
  "KWD",
  "BHD",
  "OMR",
]);

// ✅ PKR exchange rates — 1 PKR = X foreign currency
// Update these rates periodically or fetch from your API
const PKR_TO_CURRENCY: Record<string, number> = {
  USD: 0.0036, // 1 PKR = 0.00360 USD  (1 USD ≈ 278 PKR)
  GBP: 0.00284, // 1 PKR = 0.00284 GBP  (1 GBP ≈ 352 PKR)
  AUD: 0.00548, // 1 PKR = 0.00548 AUD  (1 AUD ≈ 182 PKR)
  EUR: 0.00332, // 1 PKR = 0.00332 EUR  (1 EUR ≈ 301 PKR)
  CAD: 0.0049, // 1 PKR = 0.00490 CAD  (1 CAD ≈ 204 PKR)
  AED: 0.01322, // 1 PKR = 0.01322 AED  (1 AED ≈ 75.6 PKR)
  SAR: 0.0135, // 1 PKR = 0.01350 SAR  (1 SAR ≈ 74 PKR)
  INR: 0.3, // 1 PKR = 0.30 INR     (1 INR ≈ 3.3 PKR)
  NZD: 0.00594, // 1 PKR = 0.00594 NZD  (1 NZD ≈ 168 PKR)
  SGD: 0.00484, // 1 PKR = 0.00484 SGD  (1 SGD ≈ 206 PKR)
  JPY: 0.54, // 1 PKR = 0.54 JPY     (1 JPY ≈ 1.85 PKR)
  CNY: 0.02612, // 1 PKR = 0.02612 CNY  (1 CNY ≈ 38.3 PKR)
  BRL: 0.01874, // 1 PKR = 0.01874 BRL
  MXN: 0.0612, // 1 PKR = 0.06120 MXN
  SEK: 0.0372, // 1 PKR = 0.03720 SEK
  NOK: 0.0382, // 1 PKR = 0.03820 NOK
  DKK: 0.02476, // 1 PKR = 0.02476 DKK
  CHF: 0.00316, // 1 PKR = 0.00316 CHF
  HKD: 0.0281, // 1 PKR = 0.02810 HKD
  ZAR: 0.0652, // 1 PKR = 0.06520 ZAR
  QAR: 0.01311, // 1 PKR = 0.01311 QAR
  KWD: 0.0011, // 1 PKR = 0.00110 KWD
  PKR: 1.0, // fallback — same currency
};

const CURRENCY_TO_LOCALE: Record<string, string> = {
  PKR: "en_US",
  USD: "en_US",
  GBP: "en_GB",
  AUD: "en_AU",
  EUR: "en_DE",
  CAD: "en_CA",
  AED: "ar_AE",
  SAR: "ar_SA",
  INR: "en_IN",
  NZD: "en_NZ",
  SGD: "en_SG",
  JPY: "ja_JP",
  CNY: "zh_CN",
  BRL: "pt_BR",
  MXN: "es_MX",
  SEK: "sv_SE",
  NOK: "no_NO",
  DKK: "da_DK",
  CHF: "de_CH",
};

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  PKR: "PK",
  USD: "US",
  GBP: "GB",
  AUD: "AU",
  EUR: "DE",
  CAD: "CA",
  AED: "AE",
  SAR: "SA",
  INR: "IN",
  NZD: "NZ",
  SGD: "SG",
  JPY: "JP",
  CNY: "CN",
  BRL: "BR",
  MXN: "MX",
  SEK: "SE",
  NOK: "NO",
  DKK: "DK",
  CHF: "CH",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  PKR: "Rs",
  USD: "$",
  GBP: "£",
  AUD: "A$",
  EUR: "€",
  CAD: "C$",
  INR: "₹",
  AED: "د.إ",
  SAR: "﷼",
  NZD: "NZ$",
  SGD: "S$",
  JPY: "¥",
  CNY: "¥",
  BRL: "R$",
  MXN: "MX$",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  CHF: "CHF",
  HKD: "HK$",
  ZAR: "R",
  QAR: "QR",
  KWD: "KD",
};

// ✅ Zero-decimal currencies (no cents)
const ZERO_DECIMAL_CURRENCIES: Set<string> = new Set([
  "JPY",
  "KRW",
  "IDR",
  "TWD",
]);

export default function PayPalPayment({
  amount, // This is always raw PKR amount
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
  const [processingMessage, setProcessingMessage] = useState(
    "Processing your payment..."
  );

  const { currency: detectedCurrency } = useCurrency();

  const userCurrencyCode = detectedCurrency?.code || "USD";

  // ✅ KEY FIX: Convert PKR → target currency using our own rate table
  // This ensures 565 PKR → 2.03 USD, NOT 565 USD
  const paypalCurrency = PAYPAL_SUPPORTED.has(userCurrencyCode)
    ? userCurrencyCode
    : "USD";
  const targetCurrency = PAYPAL_SUPPORTED.has(userCurrencyCode)
    ? userCurrencyCode
    : "USD";

  // Get conversion rate: how many target-currency units = 1 PKR
  const pkrToTargetRate =
    PKR_TO_CURRENCY[targetCurrency] ?? PKR_TO_CURRENCY["USD"];

  // ✅ Convert: PKR amount × rate = target currency amount
  const rawConverted = amount * pkrToTargetRate;

  // ✅ Zero-decimal currencies (JPY, KRW) need integer amounts
  const convertedAmount = ZERO_DECIMAL_CURRENCIES.has(targetCurrency)
    ? Math.round(rawConverted)
    : parseFloat(rawConverted.toFixed(2));

  // ✅ Minimum amount guard (PayPal requires at least $0.01)
  const safeConvertedAmount = Math.max(
    convertedAmount,
    ZERO_DECIMAL_CURRENCIES.has(targetCurrency) ? 1 : 0.01
  );

  const paypalLocale = CURRENCY_TO_LOCALE[userCurrencyCode] ?? "en_US";
  const countryCode = CURRENCY_TO_COUNTRY[userCurrencyCode] ?? "US";
  const currencySymbol = CURRENCY_SYMBOLS[targetCurrency] ?? "$";

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!amount || amount <= 0) {
    return (
      <div className="ps-paypal-error">
        <p>Unable to process payment. Invalid amount.</p>
      </div>
    );
  }

  if (!clientId || clientId === "your_paypal_client_id") {
    return (
      <div className="ps-paypal-error">
        <p>
          ⚠️ PayPal Client ID missing. Add NEXT_PUBLIC_PAYPAL_CLIENT_ID to
          .env.local
        </p>
      </div>
    );
  }

  // ── Create Order ─────────────────────────────────────────────────────────────
  const createOrder = async () => {
    setPaymentCancelled(false);
    try {
      const response = await fetch("/api/create-paypal-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: safeConvertedAmount, // ✅ Correctly converted amount (e.g. 2.03)
          currency: paypalCurrency, // ✅ Target currency (e.g. "USD")
          orderData: {
            orderNumber,
            description: `Order ${orderNumber} - Tech4U`,
            shippingAddress: {
              firstName: formData?.firstName || "",
              lastName: formData?.lastName || "",
              addressLine1: formData?.address || "",
              city: formData?.city || "",
              postalCode: formData?.zip || "",
              countryCode: countryCode,
            },
          },
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to create PayPal order");
      if (!data.orderId) throw new Error("No order ID received from PayPal");

      return data.orderId;
    } catch (error) {
      console.error("Failed to create PayPal order:", error);
      onPaymentError(
        error instanceof Error ? error.message : "Failed to initialize PayPal"
      );
      throw error;
    }
  };

  // ── Capture ───────────────────────────────────────────────────────────────────
  const onApprove = async (data: any) => {
    setIsProcessing(true);
    setProcessingMessage("Payment approved! Completing your order...");

    // ✅ Call onSuccess immediately after PayPal approves — don't wait for API
    // PayPal approval itself means money is authorized; capture runs in background
    onSuccess();

    // Background: try to capture and save order
    try {
      await fetch("/api/capture-paypal-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: data.orderID,
          orderNumber,
          formData,
          subtotal: safeConvertedAmount,
          shipping: 0,
          total: safeConvertedAmount,
        }),
      });
    } catch (error) {
      // Non-blocking — order is already approved by PayPal
      console.warn("PayPal capture API error (non-blocking):", error);
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
    setPaymentCancelled(true);
    setIsProcessing(false);
  };

  return (
    <PayPalScriptProvider
      key={`paypal-${paypalCurrency}-${paypalLocale}`}
      options={{
        clientId: clientId,
        currency: paypalCurrency,
        intent: "capture",
        components: "buttons",
        locale: paypalLocale,
      }}
    >
      <div>
        {isProcessing ? (
          <div className="ps-loading">
            <div className="co-spinner" />
            <span>{processingMessage}</span>
          </div>
        ) : (
          <>
            {/* Cancelled warning */}
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
                ⚠️ Payment cancelled. Please try again.
              </div>
            )}

            <PayPalButtons
              fundingSource="paypal" // ← yeh line add karo
              key={`btn-${orderNumber}-${paypalCurrency}-${paypalLocale}`}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={handlePayPalError}
              onCancel={handleCancel}
              forceReRender={[
                safeConvertedAmount,
                paypalCurrency,
                paypalLocale,
                orderNumber,
              ]}
              style={{
                layout: "vertical",
                color: "gold",
                shape: "rect",
                label: "paypal",
                height: 48,
              }}
            />

            {/* "You will be charged" info */}
            <div className="ps-paypal-amount-info">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="14"
                height="14"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>
                You will be charged{" "}
                <strong>
                  {currencySymbol}
                  {ZERO_DECIMAL_CURRENCIES.has(targetCurrency)
                    ? safeConvertedAmount.toLocaleString()
                    : safeConvertedAmount.toFixed(2)}{" "}
                  {targetCurrency}
                </strong>
              </span>
            </div>
          </>
        )}
      </div>
    </PayPalScriptProvider>
  );
}
