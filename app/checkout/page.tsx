"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import { supabase } from "@/lib/supabase";
import "./checkout.css";
import { useCurrency } from "../context/CurrencyContext";

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

const currencyToPhone: Record<
  string,
  { code: string; flag: string; example: string; name: string }
> = {
  PKR: { code: "+92", flag: "🇵🇰", example: "3001234567", name: "Pakistan" },
  USD: { code: "+1", flag: "🇺🇸", example: "2125551234", name: "United States" },
  GBP: {
    code: "+44",
    flag: "🇬🇧",
    example: "7123456789",
    name: "United Kingdom",
  },
  EUR: { code: "+49", flag: "🇪🇺", example: "15123456789", name: "Europe" },
  AUD: { code: "+61", flag: "🇦🇺", example: "412345678", name: "Australia" },
  CAD: { code: "+1", flag: "🇨🇦", example: "4165551234", name: "Canada" },
  AED: { code: "+971", flag: "🇦🇪", example: "501234567", name: "UAE" },
  SAR: { code: "+966", flag: "🇸🇦", example: "501234567", name: "Saudi Arabia" },
  INR: { code: "+91", flag: "🇮🇳", example: "9876543210", name: "India" },
};

const STORAGE_KEY = "checkout_form_data";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `T4U-${timestamp}-${random}`;
}

export default function Checkout() {
  const router = useRouter();
  const { items, loading, fetchCart, clearCart, getSubtotal, getCartCount } =
    useCartStore();

  const { formatPrice, currency } = useCurrency();

  // ─── KEY FIX ────────────────────────────────────────────────────────────────
  // Hum ek "settled" flag rakhte hain. Jab tak cart store se pehli baar
  // actual response nahi aata (chahe items hon ya na hon), hum koi bhi
  // conditional UI (empty / checkout) nahi dikhate — sirf ek neutral spinner.
  //
  // Agar items pehle se store mein hain (cached), toh `loading` false hoga
  // aur hum foran checkout show karenge bina kisi flash ke.
  // ─────────────────────────────────────────────────────────────────────────────
  const [cartSettled, setCartSettled] = useState(
    // Sync-check: agar store mein already items hain toh settled = true
    () => !loading && items.length > 0
  );
  const fetchedRef = useRef(false);

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

  const [checkoutStep, setCheckoutStep] = useState<"shipping" | "payment">(
    "shipping"
  );
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");

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
    setForm((prev) => ({ ...prev, country: detectedCountryCode }));
  }, [detectedCountryCode]);

  useEffect(() => {
    const savedForm = localStorage.getItem(STORAGE_KEY);
    if (savedForm) {
      try {
        setForm((prev) => ({ ...prev, ...JSON.parse(savedForm) }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (form.firstName) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    }
  }, [form]);

  // ─── Cart fetch — only once per mount ────────────────────────────────────────
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Agar items already hain (cached store) toh fetch dobara na karo
    if (items.length > 0) {
      setCartSettled(true);
      return;
    }

    // Fetch karo aur jab done ho (chahe empty ya full) tab settled mark karo
    fetchCart().finally(() => {
      setCartSettled(true);
    });
  }, [fetchCart, items.length]);

  // Jab loading khatam ho toh bhi settled karo (safety net)
  useEffect(() => {
    if (!loading) {
      setCartSettled(true);
    }
  }, [loading]);

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
        if (!/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(value))
          return "Enter a valid email address";
        return undefined;
      case "phone":
        if (!value.trim()) return "Phone number is required";
        if (value.trim().length < 7)
          return `Enter a valid number (e.g. ${phoneInfo.example})`;
        return undefined;
      case "address":
        if (!value.trim()) return "Address is required";
        return undefined;
      case "city":
        if (!value.trim()) return "City is required";
        return undefined;
      case "zip":
        if (!value.trim()) return "ZIP/Postal code is required";
        if (value.length < 3) return "Enter a valid ZIP code";
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
  const shipping = subtotal >= 3000 ? 0 : 250;
  const total = subtotal + shipping;
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

  const handlePaymentSuccess = async () => {
    setSubmitting(true);
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

      const response = await fetch("/api/send-order-notification", {
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
      });

      const result = await response.json();
      setNotifStatus({
        email: result.emailSent ?? false,
        whatsapp: result.whatsappSent ?? false,
      });

      try {
        await supabase.from("orders").insert({
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
        });
      } catch (dbError) {
        console.warn("⚠️ Database save skipped:", dbError);
      }

      await clearCart();
      localStorage.removeItem(STORAGE_KEY);
      setPlaced(true);
    } catch (error) {
      console.error("❌ Order error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
  };

  // ============================================
  // LOADING STATE — sirf tab jab cart abhi settle nahi hua
  // Yahan "Your cart is empty" KABHI nahi dikhega — sirf spinner
  // ============================================
  if (!cartSettled) {
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
  // EMPTY CART — sirf tab jab cart settled ho AUR items sach mein 0 hon
  // Aur order bhi place nahi hua ho
  // ============================================
  if (cartSettled && items.length === 0 && !placed) {
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
        items={validItems}
        subtotal={subtotal}
        shipping={shipping}
        total={total}
        cartCount={cartCount}
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
            {/* ─── STEP 1: SHIPPING ─── */}
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

            {/* ─── STEP 2: PAYMENT ─── */}
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
                  currency={currency?.code || "USD"}
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
  );
}
