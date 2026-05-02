"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import { supabase } from "@/lib/supabase";
import "./checkout.css";
import { useCurrency } from "../context/CurrencyContext";

// Import components
import ShippingSection from "@/app/checkout/components//ShippingSection";
import PaymentSection from "@/app/checkout/components/PaymentSection";
import ReviewSection from "@/app/checkout/components/ReviewSection";
import CartSummary from "@/app/checkout/components/CartSummary";

type Step = "shipping" | "payment" | "review";

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
  country?: string;
  cardNumber?: string;
  cardName?: string;
  expiry?: string;
  cvv?: string;
}

const STEPS: { id: Step; label: string; num: string }[] = [
  { id: "shipping", label: "Shipping", num: "01" },
  { id: "payment", label: "Payment", num: "02" },
  { id: "review", label: "Review", num: "03" },
];

// Country code mapping — covers all currencies in currency.ts
const COUNTRY_CODES: Record<
  string,
  {
    code: string;
    flag: string;
    pattern: RegExp;
    example: string;
    validation: (num: string) => boolean;
  }
> = {
  PKR: {
    code: "+92",
    flag: "🇵🇰",
    pattern: /^[0-9]{10}$/,
    example: "3XXXXXXXXX",
    validation: (num) => /^3[0-9]{9}$/.test(num),
  },
  USD: {
    code: "+1",
    flag: "🇺🇸",
    pattern: /^[0-9]{10}$/,
    example: "2125551234",
    validation: (num) => /^[2-9][0-9]{9}$/.test(num),
  },
  GBP: {
    code: "+44",
    flag: "🇬🇧",
    pattern: /^[0-9]{10}$/,
    example: "7123456789",
    validation: (num) => /^[0-9]{10}$/.test(num),
  },
  EUR: {
    code: "+352",
    flag: "🇪🇺",
    pattern: /^[0-9]{9,10}$/,
    example: "661234567",
    validation: (num) => /^[6][0-9]{8,9}$/.test(num),
  },
  AED: {
    code: "+971",
    flag: "🇦🇪",
    pattern: /^[0-9]{9}$/,
    example: "501234567",
    validation: (num) => /^5[0-9]{8}$/.test(num),
  },
  SAR: {
    code: "+966",
    flag: "🇸🇦",
    pattern: /^[0-9]{9}$/,
    example: "512345678",
    validation: (num) => /^5[0-9]{8}$/.test(num),
  },
  AUD: {
    code: "+61",
    flag: "🇦🇺",
    pattern: /^[0-9]{9}$/,
    example: "412345678",
    validation: (num) => /^4[0-9]{8}$/.test(num),
  },
  CAD: {
    code: "+1",
    flag: "🇨🇦",
    pattern: /^[0-9]{10}$/,
    example: "4161234567",
    validation: (num) => /^[2-9][0-9]{9}$/.test(num),
  },
  INR: {
    code: "+91",
    flag: "🇮🇳",
    pattern: /^[0-9]{10}$/,
    example: "9876543210",
    validation: (num) => /^[6-9][0-9]{9}$/.test(num),
  },
};

const STORAGE_KEYS = {
  CHECKOUT_FORM: "checkout_form_data",
  CHECKOUT_STEP: "checkout_current_step",
};

export default function Checkout() {
  const router = useRouter();
  const {
    items,
    loading,
    initialized,
    fetchCart,
    clearCart,
    getSubtotal,
    getCartCount,
  } = useCartStore();
  const { formatPrice, currency } = useCurrency();
  const [step, setStep] = useState<Step>("shipping");
  const [focused, setFocused] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+92");
  const [selectedFlag, setSelectedFlag] = useState("🇵🇰");
  const [phonePattern, setPhonePattern] = useState<RegExp>(/^[0-9]{10}$/);
  const [phoneExample, setPhoneExample] = useState("3XXXXXXXXX");
  const [phoneValidator, setPhoneValidator] = useState<
    (num: string) => boolean
  >(() => (num: string) => /^3[0-9]{9}$/.test(num));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Payment related states
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "card" | "paypal"
  >("card");

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    zip: "",
    country: "PK",
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const savedStep = localStorage.getItem(STORAGE_KEYS.CHECKOUT_STEP);
    if (
      savedStep &&
      (savedStep === "shipping" ||
        savedStep === "payment" ||
        savedStep === "review")
    ) {
      setStep(savedStep as Step);
    }

    const savedForm = localStorage.getItem(STORAGE_KEYS.CHECKOUT_FORM);
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm);
        setForm((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Error loading saved form:", e);
      }
    }
  }, []);

  // Save form data to localStorage
  useEffect(() => {
    if (form.firstName) {
      localStorage.setItem(STORAGE_KEYS.CHECKOUT_FORM, JSON.stringify(form));
    }
  }, [form]);

  // Save current step
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHECKOUT_STEP, step);
  }, [step]);

  const clearSavedCheckoutData = () => {
    localStorage.removeItem(STORAGE_KEYS.CHECKOUT_FORM);
    localStorage.removeItem(STORAGE_KEYS.CHECKOUT_STEP);
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!placed && (form.firstName || form.email)) {
        localStorage.setItem(STORAGE_KEYS.CHECKOUT_FORM, JSON.stringify(form));
        localStorage.setItem(STORAGE_KEYS.CHECKOUT_STEP, step);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form, step, placed]);

  useEffect(() => {
    if (!initialized) {
      try {
        const persisted = localStorage.getItem("cart-storage");
        if (persisted) {
          const parsed = JSON.parse(persisted);
          if (parsed.state?.items?.length > 0) {
            console.log(
              "📦 Checkout Page - Loaded from storage:",
              parsed.state.items.length
            );
          }
        }
      } catch (e) {}
    }
  }, [initialized]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Update country code based on currency
  useEffect(() => {
    const countryData = COUNTRY_CODES[currency.code] || COUNTRY_CODES.PKR;
    setSelectedCountryCode(countryData.code);
    setSelectedFlag(countryData.flag);
    setPhonePattern(countryData.pattern);
    setPhoneExample(countryData.example);
    setPhoneValidator(() => countryData.validation);
  }, [currency.code]);

  // Auto-fill email if logged in
  useEffect(() => {
    const getUserEmail = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email && !form.email) {
        setForm((f) => ({ ...f, email: session.user.email || "" }));
      }
    };
    getUserEmail();
  }, [form.email]);

  // Generate order number when entering payment section
  useEffect(() => {
    if (step === "payment" && !orderNumber) {
      const newOrderNumber = `AX-${Date.now()
        .toString(36)
        .toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;
      setOrderNumber(newOrderNumber);
    }
  }, [step, orderNumber]);

  const setFormField =
    (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      let value = e.target.value;
      if (key === "cardNumber") {
        value = value
          .replace(/\s/g, "")
          .replace(/(.{4})/g, "$1 ")
          .trim();
        if (value.length > 19) value = value.slice(0, 19);
      }
      if (key === "expiry") {
        value = value.replace(/[^0-9]/g, "");
        if (value.length >= 2) {
          value = value.slice(0, 2) + "/" + value.slice(2, 4);
        }
        if (value.length > 5) value = value.slice(0, 5);
      }
      if (key === "cvv") {
        value = value.replace(/[^0-9]/g, "");
        if (value.length > 4) value = value.slice(0, 4);
      }
      setForm((f) => ({ ...f, [key]: value }));
      if (errors[key as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
      setTimeout(() => {
        localStorage.setItem(
          STORAGE_KEYS.CHECKOUT_FORM,
          JSON.stringify({ ...form, [key]: value })
        );
      }, 0);
    };

  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, form[field]);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateField = (
    field: keyof FormData,
    value: string
  ): string | undefined => {
    switch (field) {
      case "firstName":
        if (!value.trim()) return "First name is required";
        if (value.trim().length < 2)
          return "First name must be at least 2 characters";
        return undefined;
      case "lastName":
        if (!value.trim()) return "Last name is required";
        if (value.trim().length < 2)
          return "Last name must be at least 2 characters";
        return undefined;
      case "email":
        if (!value.trim()) return "Email address is required";
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!emailRegex.test(value))
          return "Please enter a valid email address (e.g., name@example.com)";
        return undefined;
      case "phone":
        if (!value.trim()) return "Phone number is required";
        if (!phonePattern.test(value))
          return `Please enter a valid ${selectedCountryCode} phone number (e.g., ${phoneExample})`;
        if (phoneValidator && !phoneValidator(value))
          return `Please enter a valid ${selectedCountryCode} phone number`;
        return undefined;
      case "address":
        if (!value.trim()) return "Street address is required";
        return undefined;
      case "apartment":
        return undefined;
      case "city":
        if (!value.trim()) return "City is required";
        return undefined;
      case "zip":
        if (!value.trim()) return "ZIP/Postal code is required";
        if (value.length < 3) return "Please enter a valid ZIP code";
        return undefined;
      case "cardNumber":
        if (!value.trim()) return "Card number is required";
        const cardNum = value.replace(/\s/g, "");
        if (cardNum.length < 16)
          return "Please enter a valid 16-digit card number";
        return undefined;
      case "cardName":
        if (!value.trim()) return "Cardholder name is required";
        return undefined;
      case "expiry":
        if (!value.trim()) return "Expiry date is required";
        if (value.length < 5) return "Please enter valid expiry date (MM/YY)";
        const [month, year] = value.split("/");
        const expMonth = parseInt(month);
        const expYear = parseInt("20" + year);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        if (expMonth < 1 || expMonth > 12) return "Invalid month";
        if (
          expYear < currentYear ||
          (expYear === currentYear && expMonth < currentMonth)
        ) {
          return "Card has expired";
        }
        return undefined;
      case "cvv":
        if (!value.trim()) return "CVV is required";
        if (value.length < 3) return "CVV must be 3-4 digits";
        return undefined;
      default:
        return undefined;
    }
  };

  const subtotal = getSubtotal();
  const cartCount = getCartCount();
  // Free shipping threshold: 3000 PKR converted to current currency
  const freeShippingThresholdPKR = 3000;
  const freeShippingThreshold = freeShippingThresholdPKR * currency.rate;
  const shippingCostPKR = 250;
  const shippingCost = shippingCostPKR * currency.rate;
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCost;
  const total = subtotal + shipping;
  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  const validItems = items;

  const validateShipping = (): boolean => {
    const fieldsToValidate: (keyof FormData)[] = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "zip",
    ];
    const newErrors: FormErrors = {};
    let isValid = true;

    for (const field of fieldsToValidate) {
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    fieldsToValidate.forEach((field) =>
      setTouched((prev) => ({ ...prev, [field]: true }))
    );
    return isValid;
  };

  const validatePayment = (): boolean => {
    const fieldsToValidate: (keyof FormData)[] = [
      "cardNumber",
      "cardName",
      "expiry",
      "cvv",
    ];
    const newErrors: FormErrors = {};
    let isValid = true;

    for (const field of fieldsToValidate) {
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    fieldsToValidate.forEach((field) =>
      setTouched((prev) => ({ ...prev, [field]: true }))
    );
    return isValid;
  };

  const nextStep = () => {
    if (step === "shipping") {
      if (!validateShipping()) return;
      setStep("payment");
      localStorage.setItem(STORAGE_KEYS.CHECKOUT_STEP, "payment");
    } else if (step === "payment") {
      if (!validatePayment()) return;
      setStep("review");
      localStorage.setItem(STORAGE_KEYS.CHECKOUT_STEP, "review");
    }
  };

  const prevStep = () => {
    if (step === "payment") {
      setStep("shipping");
      localStorage.setItem(STORAGE_KEYS.CHECKOUT_STEP, "shipping");
    } else if (step === "review") {
      setStep("payment");
      localStorage.setItem(STORAGE_KEYS.CHECKOUT_STEP, "payment");
    }
  };

  const getFieldError = (field: keyof FormData): string | undefined => {
    if (touched[field]) {
      return errors[field as keyof FormErrors];
    }
    return undefined;
  };

  // Handle payment method change from PaymentSection
  const handlePaymentMethodChange = (method: "card" | "paypal") => {
    setSelectedPaymentMethod(method);
  };

  // Handle payment success from Stripe/PayPal
  const handlePaymentSuccess = () => {
    setPaymentCompleted(true);
    setStep("review");
    localStorage.setItem(STORAGE_KEYS.CHECKOUT_STEP, "review");
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    console.error("Payment error:", error);
  };

  const placeOrder = async () => {
    // ✅ Pehle check karo - payment already completed hai?
    if (!paymentCompleted) {
      alert("Please complete payment first!");
      return;
    }

    // ✅ Agar payment completed hai toh agey badho
    if (validItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    const orderRef =
      orderNumber ||
      `AX-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;
    setOrderNumber(orderRef);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const orderItems = validItems.map((item) => {
        const product = item.product ?? {
          id: item.product_id,
          name: item.variant_name || "Product",
          price: item.variant_price ?? 0,
        };
        const ppu = item.pieces_per_unit ?? 1;
        const pricePerPiece = item.variant_price ?? (product as any).price ?? 0;
        return {
          product_id: product.id,
          product_name: product.name,
          variant_id: item.variant_id,
          variant_name: item.variant_name,
          quantity: item.quantity,
          pieces_per_unit: ppu,
          unit_price: pricePerPiece,
          total_price: pricePerPiece * ppu * item.quantity,
          variant_image: item.variant_image,
        };
      });

      const { error: orderError } = await supabase.from("orders").insert({
        order_number: orderRef,
        user_id: userId,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: `${selectedCountryCode}${form.phone}`,
        address: form.address,
        apartment: form.apartment || null,
        city: form.city,
        zip: form.zip,
        country: form.country,
        subtotal: subtotal,
        shipping_cost: shipping,
        total_amount: total,
        status: "processing",
        payment_status: "paid",
        payment_method: selectedPaymentMethod === "card" ? "stripe" : "paypal",
        items: orderItems,
      });

      if (orderError) {
        console.error("Order save error:", orderError);
        alert("Failed to save order. Please contact support.");
        setSubmitting(false);
        return;
      }

      // Send notification (optional - don't block order)
      try {
        const notificationData = {
          orderNumber: orderRef,
          email: form.email,
          phone: `${selectedCountryCode}${form.phone}`,
          name: `${form.firstName} ${form.lastName}`,
          items: validItems.map((item) => {
            const product = item.product ?? {
              name: item.variant_name || "Product",
              price: item.variant_price ?? 0,
            };
            const ppu = item.pieces_per_unit ?? 1;
            const pricePerPiece =
              item.variant_price ?? (product as any).price ?? 0;
            return {
              name: product.name,
              variant: item.variant_name,
              quantity: item.quantity,
              piecesPerUnit: ppu,
              price: pricePerPiece * ppu * item.quantity,
            };
          }),
          subtotal: subtotal,
          shipping: shipping,
          total: total,
          shippingAddress: `${form.address}${
            form.apartment ? `, ${form.apartment}` : ""
          }, ${form.city}, ${form.zip}`,
          paymentMethod: selectedPaymentMethod === "card" ? "Stripe" : "PayPal",
        };
        await fetch("/api/send-order-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notificationData),
        });
      } catch (notifyError) {
        console.error("Notification error:", notifyError);
      }

      await clearCart();
      clearSavedCheckoutData();
      setPlaced(true);
    } catch (error) {
      console.error("Order placement error:", error);
      alert("There was an error placing your order. Please try again.");
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="co-root">
        <div className="co-grain" aria-hidden="true" />
        <div className="co-wrap">
          <div className="co-spinner" style={{ margin: "4rem auto" }} />
        </div>
      </div>
    );
  }

  // Empty cart state
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
              Add some luxury items to your cart before checkout.
            </p>
            <Link href="/watches" className="co-empty-btn">
              Continue Shopping
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="14"
                height="14"
              >
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Order placed success state
  if (placed) {
    return (
      <div className="co-root">
        <div className="co-grain" aria-hidden="true" />
        <div className="co-success">
          <div className="co-success-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="co-success-title">
            Thank <em>You</em>
          </h1>
          <p className="co-success-sub">
            Your order has been received. A confirmation has been sent to{" "}
            {form.email} and via SMS to your phone.
          </p>
          <div className="co-success-ref">
            <span className="co-success-ref-label">Order Reference</span>
            <span className="co-success-ref-val">{orderNumber}</span>
          </div>
          <Link href="/" className="co-success-btn">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="co-header">
          <p className="co-eyebrow">
            <span className="co-ey-line" />
            Secure Checkout
            <span className="co-ey-line" />
          </p>
          <h1 className="co-title">
            Complete <em>Your Order</em>
          </h1>
        </div>

        <div className="co-steps">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`co-step${s.id === step ? " co-step--active" : ""}${
                i < currentStepIndex ? " co-step--done" : ""
              }`}
            >
              <div className="co-step-circle">
                {i < currentStepIndex ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    width="12"
                    height="12"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{s.num}</span>
                )}
              </div>
              <span className="co-step-label">{s.label}</span>
              {i < STEPS.length - 1 && <div className="co-step-line" />}
            </div>
          ))}
        </div>

        <div className="co-layout">
          <div className="co-form-col">
            {/* STEP 1: SHIPPING */}
            {step === "shipping" && (
              <ShippingSection
                form={form}
                setFormField={setFormField}
                getFieldError={getFieldError}
                handleBlur={handleBlur}
                focused={focused}
                setFocused={setFocused}
                selectedFlag={selectedFlag}
                selectedCountryCode={selectedCountryCode}
                phoneExample={phoneExample}
              />
            )}

            {/* STEP 2: PAYMENT with Stripe & PayPal */}
            {step === "payment" && (
              <PaymentSection
                form={form}
                setFormField={setFormField}
                getFieldError={getFieldError}
                handleBlur={handleBlur}
                focused={focused}
                setFocused={setFocused}
                totalAmount={total}
                currency={currency.code}
                orderNumber={orderNumber}
                formData={{
                  firstName: form.firstName,
                  lastName: form.lastName,
                  email: form.email,
                  phone: `${selectedCountryCode}${form.phone}`,
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
                onPaymentMethodChange={handlePaymentMethodChange}
              />
            )}

            {/* STEP 3: REVIEW */}
            {step === "review" && (
              <ReviewSection
                items={validItems}
                form={form}
                selectedCountryCode={selectedCountryCode}
                selectedFlag={selectedFlag}
                formatPrice={formatPrice}
              />
            )}

            <div className="co-nav-btns">
              {currentStepIndex > 0 ? (
                <button className="co-back-btn" onClick={prevStep}>
                  ← Back
                </button>
              ) : (
                <Link href="/cart" className="co-back-btn">
                  ← Cart
                </Link>
              )}
              {step === "review" ? (
                <button
                  className="co-next-btn"
                  onClick={placeOrder}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="co-spinner-btn" />
                      Processing...
                    </>
                  ) : (
                    <>Place Order →</>
                  )}
                </button>
              ) : step === "payment" ? null : (
                <button className="co-next-btn" onClick={nextStep}>
                  Continue →
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - ORDER SUMMARY */}
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
