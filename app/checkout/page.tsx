// app/checkout/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import { supabase } from "@/lib/supabase";
import "./checkout.css";
import { useCurrency } from "../context/CurrencyContext";

// Import components
import ShippingSection from "@/app/checkout/components/ShippingSection";
import CartSummary from "@/app/checkout/components/CartSummary";
import PaymentSection from "@/app/checkout/components/PaymentSection";
import OrderSuccess from "@/app/checkout/components/OrderSuccess";

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

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  apartment?: string;
  city?: string;
  zip?: string;
}

// ✅ Toast component
function PaymentToast({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "-120px"})`,
        opacity: visible ? 1 : 0,
        transition: "all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          color: "#fff",
          padding: "14px 24px",
          borderRadius: "50px",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(218,165,32,0.3)",
          fontSize: "15px",
          fontWeight: 600,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          border: "1px solid rgba(218,165,32,0.4)",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 12px rgba(34,197,94,0.5)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span style={{ color: "#daa520" }}>Payment Successful!</span>
        <span style={{ color: "#aaa", fontWeight: 400, fontSize: "14px" }}>
          — Your order is confirmed
        </span>
      </div>
    </div>
  );
}

// Currency code → country code mapping
const currencyToCountry: Record<string, string> = {
  PKR: "PK",
  USD: "US",
  GBP: "GB",
  EUR: "DE",
  AUD: "AU",
  CAD: "CA",
  AED: "AE",
  SAR: "SA",
  INR: "IN",
};

// ✅ FIXED: Complete phone info with min/max digits per country
const currencyToPhone: Record<
  string,
  {
    code: string;
    flag: string;
    example: string;
    name: string;
    minDigits: number;
    maxDigits: number;
  }
> = {
  PKR: {
    code: "+92",
    flag: "🇵🇰",
    example: "3001234567",
    name: "Pakistan",
    minDigits: 10,
    maxDigits: 11,
  },
  USD: {
    code: "+1",
    flag: "🇺🇸",
    example: "2125551234",
    name: "United States",
    minDigits: 10,
    maxDigits: 10,
  },
  GBP: {
    code: "+44",
    flag: "🇬🇧",
    example: "7123456789",
    name: "United Kingdom",
    minDigits: 10,
    maxDigits: 11,
  },
  EUR: {
    code: "+49",
    flag: "🇪🇺",
    example: "15123456789",
    name: "Europe",
    minDigits: 9,
    maxDigits: 12,
  },
  AUD: {
    code: "+61",
    flag: "🇦🇺",
    example: "412345678",
    name: "Australia",
    minDigits: 9,
    maxDigits: 9,
  },
  CAD: {
    code: "+1",
    flag: "🇨🇦",
    example: "4165551234",
    name: "Canada",
    minDigits: 10,
    maxDigits: 10,
  },
  AED: {
    code: "+971",
    flag: "🇦🇪",
    example: "501234567",
    name: "UAE",
    minDigits: 9,
    maxDigits: 9,
  },
  SAR: {
    code: "+966",
    flag: "🇸🇦",
    example: "501234567",
    name: "Saudi Arabia",
    minDigits: 9,
    maxDigits: 9,
  },
  INR: {
    code: "+91",
    flag: "🇮🇳",
    example: "9876543210",
    name: "India",
    minDigits: 10,
    maxDigits: 10,
  },
};

const STORAGE_KEY = "checkout_form_data";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `T4U-${timestamp}-${random}`;
}

// ============================================
// MAIN CHECKOUT COMPONENT
// ============================================
export default function Checkout() {
  const router = useRouter();
  const {
    items,
    loading,
    fetchCart,
    clearCart,
    getSubtotal,
    getCartCount,
    initialized,
    refreshCart,
  } = useCartStore();

  const { formatPrice, currency } = useCurrency();

  const [isHydrated, setIsHydrated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [cartFetched, setCartFetched] = useState(false);

  const [focused, setFocused] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [orderNumber] = useState(() => generateOrderNumber());
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [notifStatus, setNotifStatus] = useState<{
    email: boolean | null;
    whatsapp: boolean | null;
  }>({ email: null, whatsapp: null });

  const [showToast, setShowToast] = useState(false);

  const [snapshotItems, setSnapshotItems] = useState<typeof items>([]);
  const [snapshotSubtotal, setSnapshotSubtotal] = useState(0);
  const [snapshotCartCount, setSnapshotCartCount] = useState(0);

  const ORDER_SESSION_KEY = "checkout_order_success";

  const [checkoutStep, setCheckoutStep] = useState<"shipping" | "payment">(
    "shipping"
  );
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");

  // Get phone info from detected currency
  const phoneInfo = currencyToPhone[currency.code] || currencyToPhone["USD"];
  const detectedCountryCode = currencyToCountry[currency.code] || "US";

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    zip: "",
    country: detectedCountryCode,
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isStripeReturn = params.get("payment_success") === "true";
      const savedOrder = sessionStorage.getItem("checkout_order_success");

      if (isStripeReturn && savedOrder) {
        try {
          const orderData = JSON.parse(savedOrder);
          setForm((prev) => ({ ...prev, ...orderData.form }));
          setPaymentMethod(orderData.paymentMethod || "card");
          setNotifStatus(
            orderData.notifStatus || { email: null, whatsapp: null }
          );
          if (orderData.snapItems?.length) {
            setSnapshotItems(orderData.snapItems);
            setSnapshotSubtotal(orderData.snapSubtotal || 0);
            setSnapshotCartCount(orderData.snapCount || 0);
          }
          setShowToast(true);
          setTimeout(() => {
            setPlaced(true);
            setShowToast(false);
            window.history.replaceState({}, "", window.location.pathname);
          }, 1500);
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    setIsHydrated(true);
    if (!initialized || items.length === 0) {
      fetchCart().then(() => {
        setCartFetched(true);
      });
    } else {
      setCartFetched(true);
    }
  }, [isMounted, initialized, items.length, fetchCart]);

  useEffect(() => {
    if (isMounted) {
      setForm((prev) => ({ ...prev, country: detectedCountryCode }));
    }
  }, [detectedCountryCode, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    const savedForm = localStorage.getItem(STORAGE_KEY);
    if (savedForm) {
      try {
        setForm((prev) => ({ ...prev, ...JSON.parse(savedForm) }));
      } catch {}
    }
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (form.firstName) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    }
  }, [form, isMounted]);

  const setFormField =
    (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setForm((f) => ({ ...f, [key]: value }));
      if (errors[key as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    };

  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const getFieldError = (field: keyof FormData): string | undefined => {
    return touched[field] ? errors[field as keyof FormErrors] : undefined;
  };

  // ✅ FIXED: Phone validation uses country-specific digit rules
  const validateField = (
    field: keyof FormData,
    value: string
  ): string | undefined => {
    switch (field) {
      case "firstName":
        if (!value.trim()) return "First name is required";
        if (value.trim().length < 2) return "At least 2 characters";
        return undefined;
      case "lastName":
        if (!value.trim()) return "Last name is required";
        if (value.trim().length < 2) return "At least 2 characters";
        return undefined;
      case "email":
        if (!value.trim()) return "Email is required";
        // ✅ Accepts ALL email providers: Gmail, Hotmail, Yahoo, info@, etc.
        if (!/^[^\s@]+@([^\s@]+\.)+[^\s@]{2,}$/.test(value.trim()))
          return "Enter a valid email address";
        return undefined;
      case "phone": {
        if (!value.trim()) return "Phone number is required";
        // Strip spaces and dashes for digit count
        const digitsOnly = value.replace(/[\s\-\(\)]/g, "");
        const { minDigits, maxDigits, example } = phoneInfo;
        if (digitsOnly.length < minDigits || digitsOnly.length > maxDigits) {
          return `Enter a valid ${phoneInfo.name} number (e.g. ${example})`;
        }
        // Must be digits only (after stripping spaces/dashes)
        if (!/^\d+$/.test(digitsOnly)) {
          return "Phone number must contain digits only";
        }
        return undefined;
      }
      case "address":
        if (!value.trim()) return "Address is required";
        return undefined;
      case "city":
        if (!value.trim()) return "City is required";
        return undefined;
      case "zip":
        if (!value.trim()) return "ZIP/Postal code is required";
        if (value.trim().length < 3) return "Enter a valid ZIP code";
        return undefined;
      default:
        return undefined;
    }
  };

  const validateAll = (): boolean => {
    const fields: (keyof FormData)[] = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "zip",
    ];
    const newErrors: FormErrors = {};
    let valid = true;
    fields.forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field as keyof FormErrors] = error;
        valid = false;
      }
    });
    setErrors(newErrors);
    setTouched(fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    return valid;
  };

  const subtotal = getSubtotal();
  const cartCount = getCartCount();
  const shipping = 0;
  const total = subtotal;
  const validItems = items;

  const fullPhone = `${phoneInfo.code}${form.phone}`;
  const customerName = `${form.firstName} ${form.lastName}`;
  const shippingAddress = [
    form.address,
    form.apartment,
    form.city,
    form.zip,
    phoneInfo.name,
  ]
    .filter(Boolean)
    .join(", ");

  const handleContinueToPayment = () => {
    if (!validateAll()) return;
    if (validItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    setCheckoutStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ FIXED: handlePaymentSuccess — shows success page immediately,
  // then fires notifications in background and updates notifStatus when done
  const handlePaymentSuccess = useCallback(async () => {
    const snapItems = [...items];
    const snapSubtotal = getSubtotal();
    const snapCount = getCartCount();
    setSnapshotItems(snapItems);
    setSnapshotSubtotal(snapSubtotal);
    setSnapshotCartCount(snapCount);

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "checkout_order_success",
        JSON.stringify({
          form,
          paymentMethod,
          notifStatus: { email: null, whatsapp: null },
          snapItems,
          snapSubtotal,
          snapCount,
        })
      );
    }

    // Show toast
    setShowToast(true);

    // Show success page after 1.2s
    setTimeout(() => {
      setPlaced(true);
      setShowToast(false);
      sessionStorage.removeItem("checkout_order_success");
      clearCart().catch(() => {});
      localStorage.removeItem(STORAGE_KEY);
    }, 1200);

    // ✅ Fire notifications in background — update notifStatus when complete
    try {
      const orderItems = validItems.map((item) => {
        const product = item.product ?? {
          name: item.variant_name || "Product",
          price: item.variant_price ?? 0,
        };
        const ppu = item.pieces_per_unit ?? 1;
        const pricePerPiece = item.variant_price ?? (product as any).price ?? 0;
        return {
          name: (product as any).name,
          variant: item.variant_name || null,
          quantity: item.quantity,
          piecesPerUnit: ppu,
          price: pricePerPiece * ppu * item.quantity,
          image: item.variant_image || (product as any).images?.[0] || null,
        };
      });

      // ✅ Await notification — update status when done (shows on success page)
      fetch("/api/send-order-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          email: form.email,
          phone: fullPhone,
          name: customerName,
          items: orderItems,
          subtotal,
          shipping,
          total,
          shippingAddress,
          paymentMethod:
            paymentMethod === "card" ? "Credit/Debit Card (Stripe)" : "PayPal",
          currency: currency.code,
        }),
      })
        .then((r) => r.json())
        .then((result) => {
          // ✅ Update notifStatus — success page will re-render with correct values
          setNotifStatus({
            email: result.emailSent ?? false,
            whatsapp: result.whatsappSent ?? false,
          });
        })
        .catch(() => {
          setNotifStatus({ email: false, whatsapp: false });
        });

      // Save to Supabase
      supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: form.email,
          customer_phone: fullPhone,
          shipping_address: shippingAddress,
          items: orderItems,
          subtotal,
          shipping_cost: shipping,
          total,
          payment_method: paymentMethod === "card" ? "Stripe" : "PayPal",
          currency: currency.code,
          status: "confirmed",
          created_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.warn("⚠️ DB save failed:", error);
        });
    } catch (err) {
      console.warn("⚠️ Background tasks error:", err);
    }

    return () => {};
  }, [
    validItems,
    orderNumber,
    form,
    fullPhone,
    customerName,
    subtotal,
    shipping,
    total,
    shippingAddress,
    paymentMethod,
    currency.code,
    clearCart,
    items,
    getSubtotal,
    getCartCount,
  ]);

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (
    !placed &&
    (!isMounted ||
      !isHydrated ||
      !cartFetched ||
      (loading && items.length === 0))
  ) {
    return (
      <div className="co-root">
        <div className="co-grain" aria-hidden="true" />
        <div className="co-wrap">
          <div className="co-spinner" style={{ margin: "4rem auto" }} />
        </div>
      </div>
    );
  }

  // ============================================
  // EMPTY CART STATE
  // ============================================
  if (!loading && items.length === 0 && !placed) {
    return (
      <div className="co-root">
        <div className="co-grain" aria-hidden="true" />
        <div className="co-wrap">
          <div className="co-empty-state">
            <div className="co-empty-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <h2 className="co-empty-title">Your cart is empty</h2>
            <p className="co-empty-sub">
              Add some items to your cart before checkout.
            </p>
            <Link href="/watches" className="co-empty-btn">
              Continue Shopping →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // SUCCESS STATE
  // ============================================
  if (placed) {
    const displayItems = snapshotItems.length > 0 ? snapshotItems : validItems;
    const displaySubtotal = snapshotSubtotal > 0 ? snapshotSubtotal : subtotal;
    const displayCartCount =
      snapshotCartCount > 0 ? snapshotCartCount : cartCount;

    return (
      <OrderSuccess
        firstName={form.firstName}
        lastName={form.lastName}
        email={form.email}
        phone={form.phone}
        address={form.address}
        apartment={form.apartment}
        city={form.city}
        zip={form.zip}
        country={phoneInfo.name}
        orderNumber={orderNumber}
        paymentMethod={paymentMethod}
        items={displayItems}
        subtotal={displaySubtotal}
        shipping={0}
        total={displaySubtotal}
        cartCount={displayCartCount}
        notifStatus={notifStatus}
        fullPhone={fullPhone}
        shippingAddress={shippingAddress}
        formatPrice={formatPrice}
      />
    );
  }

  // ============================================
  // MAIN CHECKOUT UI
  // ============================================
  return (
    <>
      <PaymentToast visible={showToast} />

      <div className="co-root">
        <div className="co-grain" aria-hidden="true" />
        <div className="co-lines" aria-hidden="true">
          {[...Array(5)].map((_, i) => (
            <span key={i} />
          ))}
        </div>
        <div className="co-ambient" aria-hidden="true" />
        <div className="co-corner co-corner--tl" aria-hidden="true" />
        <div className="co-corner co-corner--tr" aria-hidden="true" />

        <div className="co-wrap">
          {/* Header */}
          <div className="co-header">
            <p className="co-eyebrow">
              <span className="co-ey-line" />
              Secure Checkout
              <span className="co-ey-line" />
            </p>
            <h1 className="co-title">
              Complete <em>Your Order</em>
            </h1>

            {/* Step Indicator */}
            <div className="co-steps">
              <div
                className={`co-step ${
                  checkoutStep === "shipping"
                    ? "co-step--active"
                    : "co-step--done"
                }`}
              >
                <div className="co-step-circle">
                  {checkoutStep === "payment" ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      width="14"
                      height="14"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    "1"
                  )}
                </div>
                <span>Shipping</span>
              </div>
              <div className="co-step-line" />
              <div
                className={`co-step ${
                  checkoutStep === "payment" ? "co-step--active" : ""
                }`}
              >
                <div className="co-step-circle">2</div>
                <span>Payment</span>
              </div>
            </div>
          </div>

          <div className="co-layout">
            <div className="co-form-col">
              {/* STEP 1: SHIPPING */}
              {checkoutStep === "shipping" && (
                <>
                  <ShippingSection
                    form={form}
                    setFormField={setFormField}
                    getFieldError={getFieldError}
                    handleBlur={handleBlur}
                    focused={focused}
                    setFocused={setFocused}
                    selectedFlag={phoneInfo.flag}
                    selectedCountryCode={phoneInfo.code}
                    phoneExample={phoneInfo.example}
                    selectedCountry={detectedCountryCode}
                    onCountryChange={(code) =>
                      setForm((f) => ({ ...f, country: code, phone: "" }))
                    }
                  />

                  <div className="co-nav-btns">
                    <Link href="/cart" className="co-back-btn">
                      ← Cart
                    </Link>
                    <button
                      className="co-next-btn co-continue-btn"
                      onClick={handleContinueToPayment}
                    >
                      Continue to Payment →
                    </button>
                  </div>
                </>
              )}

              {/* STEP 2: PAYMENT */}
              {checkoutStep === "payment" && (
                <>
                  <button
                    className="co-back-step-btn"
                    onClick={() => setCheckoutStep("shipping")}
                  >
                    ← Back to Shipping
                  </button>

                  <PaymentSection
                    totalAmount={total}
                    orderNumber={orderNumber}
                    formData={{
                      firstName: form.firstName,
                      lastName: form.lastName,
                      email: form.email,
                      phone: form.phone,
                      address: form.address,
                      apartment: form.apartment,
                      city: form.city,
                      zip: form.zip,
                    }}
                    subtotal={subtotal}
                    shipping={shipping}
                    total={total}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    onPaymentMethodChange={setPaymentMethod}
                  />
                </>
              )}
            </div>

            {/* Cart Summary Sidebar */}
            <div className="co-summary-col">
              <CartSummary
                items={validItems}
                subtotal={subtotal}
                shipping={shipping}
                total={total}
                cartCount={cartCount}
                formatPrice={formatPrice}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
