"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import { supabase } from "@/lib/supabase";
import "./checkout.css";
import { useCurrency } from "../context/CurrencyContext";

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

// Country code mapping with flags
const COUNTRY_CODES: Record<
  string,
  { code: string; flag: string; pattern: RegExp; example: string }
> = {
  PKR: {
    code: "+92",
    flag: "🇵🇰",
    pattern: /^[0-9]{10}$/,
    example: "3XXXXXXXXX",
  },
  USD: {
    code: "+1",
    flag: "🇺🇸",
    pattern: /^[0-9]{10}$/,
    example: "2125551234",
  },
  GBP: {
    code: "+44",
    flag: "🇬🇧",
    pattern: /^[0-9]{10}$/,
    example: "7123456789",
  },
  EUR: {
    code: "+352",
    flag: "🇪🇺",
    pattern: /^[0-9]{9,10}$/,
    example: "661234567",
  },
  AED: {
    code: "+971",
    flag: "🇦🇪",
    pattern: /^[0-9]{9}$/,
    example: "501234567",
  },
  SAR: {
    code: "+966",
    flag: "🇸🇦",
    pattern: /^[0-9]{9}$/,
    example: "512345678",
  },
};

export default function Checkout() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔥 CRITICAL: Load from localStorage immediately
  useEffect(() => {
    if (mounted && !initialized) {
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
  }, [mounted, initialized]);

  useEffect(() => {
    if (mounted) {
      fetchCart();
    }
  }, [fetchCart, mounted]);

  // Update country code based on currency
  useEffect(() => {
    const countryData = COUNTRY_CODES[currency.code] || COUNTRY_CODES.PKR;
    setSelectedCountryCode(countryData.code);
    setSelectedFlag(countryData.flag);
    setPhonePattern(countryData.pattern);
    setPhoneExample(countryData.example);
  }, [currency.code]);

  // Auto-fill email if user is logged in
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
  const shipping = subtotal >= 3000 ? 0 : 250;
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
    } else if (step === "payment") {
      if (!validatePayment()) return;
      setStep("review");
    }
  };

  const prevStep = () => {
    if (step === "payment") setStep("shipping");
    else if (step === "review") setStep("payment");
  };

  const getFieldError = (field: keyof FormData): string | undefined => {
    if (touched[field]) {
      return errors[field as keyof FormErrors];
    }
    return undefined;
  };

  const placeOrder = async () => {
    if (validItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    const orderRef = `AX-${Date.now()
      .toString(36)
      .toUpperCase()}-${Math.random()
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
        status: "pending",
        items: orderItems,
      });

      if (orderError) {
        console.error("Order save error:", orderError);
        alert("Failed to save order. Please try again.");
        setSubmitting(false);
        return;
      }

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
          paymentMethod: "Card",
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
      setPlaced(true);
    } catch (error) {
      console.error("Order placement error:", error);
      alert("There was an error placing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state
  if (!mounted || (loading && items.length === 0)) {
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
              <div className="co-section">
                <h2 className="co-section-title">
                  <em>01.</em> Shipping Information
                </h2>
                <div className="co-fields-grid">
                  <div
                    className={`co-field co-field--half ${
                      focused === "firstName" ? "co-field--focused" : ""
                    } ${getFieldError("firstName") ? "co-field--error" : ""}`}
                  >
                    <label className="co-label">First Name *</label>
                    <div className="co-input-wrap">
                      <input
                        type="text"
                        className="co-input"
                        placeholder="John"
                        value={form.firstName}
                        onChange={setFormField("firstName")}
                        onFocus={() => setFocused("firstName")}
                        onBlur={() => {
                          setFocused(null);
                          handleBlur("firstName");
                        }}
                      />
                    </div>
                    <div className="co-field-line" />
                    {getFieldError("firstName") && (
                      <span className="co-error-text">
                        {getFieldError("firstName")}
                      </span>
                    )}
                  </div>

                  <div
                    className={`co-field co-field--half ${
                      focused === "lastName" ? "co-field--focused" : ""
                    } ${getFieldError("lastName") ? "co-field--error" : ""}`}
                  >
                    <label className="co-label">Last Name *</label>
                    <div className="co-input-wrap">
                      <input
                        type="text"
                        className="co-input"
                        placeholder="Doe"
                        value={form.lastName}
                        onChange={setFormField("lastName")}
                        onFocus={() => setFocused("lastName")}
                        onBlur={() => {
                          setFocused(null);
                          handleBlur("lastName");
                        }}
                      />
                    </div>
                    <div className="co-field-line" />
                    {getFieldError("lastName") && (
                      <span className="co-error-text">
                        {getFieldError("lastName")}
                      </span>
                    )}
                  </div>

                  <div
                    className={`co-field ${
                      focused === "email" ? "co-field--focused" : ""
                    } ${getFieldError("email") ? "co-field--error" : ""}`}
                  >
                    <label className="co-label">Email Address *</label>
                    <div className="co-input-wrap">
                      <input
                        type="email"
                        className="co-input"
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={setFormField("email")}
                        onFocus={() => setFocused("email")}
                        onBlur={() => {
                          setFocused(null);
                          handleBlur("email");
                        }}
                      />
                    </div>
                    <div className="co-field-line" />
                    {getFieldError("email") && (
                      <span className="co-error-text">
                        {getFieldError("email")}
                      </span>
                    )}
                  </div>

                  <div
                    className={`co-field ${
                      focused === "phone" ? "co-field--focused" : ""
                    } ${getFieldError("phone") ? "co-field--error" : ""}`}
                  >
                    <label className="co-label">Phone Number *</label>
                    <div className="co-input-wrap">
                      <div className="co-phone-prefix">
                        <span className="co-phone-flag">{selectedFlag}</span>
                        <span className="co-phone-code">
                          {selectedCountryCode}
                        </span>
                      </div>
                      <input
                        type="tel"
                        className="co-input co-input-with-prefix"
                        placeholder={phoneExample}
                        value={form.phone}
                        onChange={setFormField("phone")}
                        onFocus={() => setFocused("phone")}
                        onBlur={() => {
                          setFocused(null);
                          handleBlur("phone");
                        }}
                      />
                    </div>
                    <div className="co-field-line" />
                    {getFieldError("phone") && (
                      <span className="co-error-text">
                        {getFieldError("phone")}
                      </span>
                    )}
                    <span className="co-hint-text">
                      We'll send order updates via SMS to this number
                    </span>
                  </div>

                  <div
                    className={`co-field ${
                      focused === "address" ? "co-field--focused" : ""
                    } ${getFieldError("address") ? "co-field--error" : ""}`}
                  >
                    <label className="co-label">Street Address *</label>
                    <div className="co-input-wrap">
                      <input
                        type="text"
                        className="co-input"
                        placeholder="House number and street name"
                        value={form.address}
                        onChange={setFormField("address")}
                        onFocus={() => setFocused("address")}
                        onBlur={() => {
                          setFocused(null);
                          handleBlur("address");
                        }}
                      />
                    </div>
                    <div className="co-field-line" />
                    {getFieldError("address") && (
                      <span className="co-error-text">
                        {getFieldError("address")}
                      </span>
                    )}
                  </div>

                  <div
                    className={`co-field ${
                      focused === "apartment" ? "co-field--focused" : ""
                    }`}
                  >
                    <label className="co-label">
                      Apartment, Suite, etc. (Optional)
                    </label>
                    <div className="co-input-wrap">
                      <input
                        type="text"
                        className="co-input"
                        placeholder="Apt, Suite, Unit, Building"
                        value={form.apartment}
                        onChange={setFormField("apartment")}
                        onFocus={() => setFocused("apartment")}
                        onBlur={() => setFocused(null)}
                      />
                    </div>
                    <div className="co-field-line" />
                  </div>

                  <div
                    className={`co-field co-field--half ${
                      focused === "city" ? "co-field--focused" : ""
                    } ${getFieldError("city") ? "co-field--error" : ""}`}
                  >
                    <label className="co-label">City *</label>
                    <div className="co-input-wrap">
                      <input
                        type="text"
                        className="co-input"
                        placeholder="New York"
                        value={form.city}
                        onChange={setFormField("city")}
                        onFocus={() => setFocused("city")}
                        onBlur={() => {
                          setFocused(null);
                          handleBlur("city");
                        }}
                      />
                    </div>
                    <div className="co-field-line" />
                    {getFieldError("city") && (
                      <span className="co-error-text">
                        {getFieldError("city")}
                      </span>
                    )}
                  </div>

                  <div
                    className={`co-field co-field--half ${
                      focused === "zip" ? "co-field--focused" : ""
                    } ${getFieldError("zip") ? "co-field--error" : ""}`}
                  >
                    <label className="co-label">ZIP Code *</label>
                    <div className="co-input-wrap">
                      <input
                        type="text"
                        className="co-input"
                        placeholder="10001"
                        value={form.zip}
                        onChange={setFormField("zip")}
                        onFocus={() => setFocused("zip")}
                        onBlur={() => {
                          setFocused(null);
                          handleBlur("zip");
                        }}
                      />
                    </div>
                    <div className="co-field-line" />
                    {getFieldError("zip") && (
                      <span className="co-error-text">
                        {getFieldError("zip")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PAYMENT */}
            {step === "payment" && (
              <div className="co-section">
                <h2 className="co-section-title">
                  <em>02.</em> Payment Details
                </h2>
                <div className="co-card-preview">
                  <div className="co-card-chip" />
                  <p className="co-card-num-display">
                    {form.cardNumber ? form.cardNumber : "•••• •••• •••• ••••"}
                  </p>
                  <div className="co-card-meta">
                    <span className="co-card-name-display">
                      {form.cardName || "CARDHOLDER NAME"}
                    </span>
                    <span className="co-card-exp-display">
                      {form.expiry || "MM/YY"}
                    </span>
                  </div>
                  <div className="co-card-brand">TECH4U</div>
                </div>
                <div className="co-fields-grid">
                  <div
                    className={`co-field ${
                      focused === "cardNumber" ? "co-field--focused" : ""
                    } ${getFieldError("cardNumber") ? "co-field--error" : ""}`}
                  >
                    <label className="co-label">Card Number *</label>
                    <div className="co-input-wrap">
                      <input
                        type="text"
                        className="co-input"
                        placeholder="1234 5678 9012 3456"
                        value={form.cardNumber}
                        onChange={setFormField("cardNumber")}
                        onFocus={() => setFocused("cardNumber")}
                        onBlur={() => {
                          setFocused(null);
                          handleBlur("cardNumber");
                        }}
                        maxLength={19}
                      />
                    </div>
                    <div className="co-field-line" />
                    {getFieldError("cardNumber") && (
                      <span className="co-error-text">
                        {getFieldError("cardNumber")}
                      </span>
                    )}
                  </div>

                  <div
                    className={`co-field ${
                      focused === "cardName" ? "co-field--focused" : ""
                    } ${getFieldError("cardName") ? "co-field--error" : ""}`}
                  >
                    <label className="co-label">Cardholder Name *</label>
                    <div className="co-input-wrap">
                      <input
                        type="text"
                        className="co-input"
                        placeholder="JOHN DOE"
                        value={form.cardName}
                        onChange={setFormField("cardName")}
                        onFocus={() => setFocused("cardName")}
                        onBlur={() => {
                          setFocused(null);
                          handleBlur("cardName");
                        }}
                      />
                    </div>
                    <div className="co-field-line" />
                    {getFieldError("cardName") && (
                      <span className="co-error-text">
                        {getFieldError("cardName")}
                      </span>
                    )}
                  </div>

                  <div
                    className={`co-field co-field--half ${
                      focused === "expiry" ? "co-field--focused" : ""
                    } ${getFieldError("expiry") ? "co-field--error" : ""}`}
                  >
                    <label className="co-label">Expiry *</label>
                    <div className="co-input-wrap">
                      <input
                        type="text"
                        className="co-input"
                        placeholder="MM/YY"
                        value={form.expiry}
                        onChange={setFormField("expiry")}
                        onFocus={() => setFocused("expiry")}
                        onBlur={() => {
                          setFocused(null);
                          handleBlur("expiry");
                        }}
                        maxLength={5}
                      />
                    </div>
                    <div className="co-field-line" />
                    {getFieldError("expiry") && (
                      <span className="co-error-text">
                        {getFieldError("expiry")}
                      </span>
                    )}
                  </div>

                  <div
                    className={`co-field co-field--half ${
                      focused === "cvv" ? "co-field--focused" : ""
                    } ${getFieldError("cvv") ? "co-field--error" : ""}`}
                  >
                    <label className="co-label">CVV *</label>
                    <div className="co-input-wrap">
                      <input
                        type="password"
                        className="co-input"
                        placeholder="•••"
                        value={form.cvv}
                        onChange={setFormField("cvv")}
                        onFocus={() => setFocused("cvv")}
                        onBlur={() => {
                          setFocused(null);
                          handleBlur("cvv");
                        }}
                        maxLength={4}
                      />
                    </div>
                    <div className="co-field-line" />
                    {getFieldError("cvv") && (
                      <span className="co-error-text">
                        {getFieldError("cvv")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="co-secure-note">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    width="16"
                    height="16"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <span>
                    SSL secured checkout • Your payment info is encrypted
                  </span>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW */}
            {step === "review" && (
              <div className="co-section">
                <h2 className="co-section-title">
                  <em>03.</em> Review Your Order
                </h2>
                <div className="co-review-blocks">
                  <div className="co-review-block">
                    <p className="co-review-block-title">Shipping To</p>
                    <p className="co-review-block-val">
                      {form.firstName} {form.lastName}
                      <br />
                      {form.address}
                      {form.apartment ? `, ${form.apartment}` : ""}
                      <br />
                      {form.city}, {form.zip}
                      <br />
                      📞 {selectedCountryCode} {form.phone}
                      <br />
                      📧 {form.email}
                    </p>
                  </div>
                  <div className="co-review-block">
                    <p className="co-review-block-title">Payment</p>
                    <p className="co-review-block-val">
                      Card ending in{" "}
                      {form.cardNumber
                        ? form.cardNumber.replace(/\s/g, "").slice(-4)
                        : "••••"}
                      <br />
                      {form.cardName || "—"}
                      <br />
                      Expires: {form.expiry || "—"}
                    </p>
                  </div>
                </div>
                <ul className="co-review-items">
                  {validItems.map((item) => {
                    const product = item.product ?? {
                      id: item.product_id,
                      name: item.variant_name || "Product",
                      description: "",
                      category: "",
                      subcategory: "",
                      condition: "new",
                      is_featured: false,
                      is_active: true,
                      price: item.variant_price ?? 0,
                      images: [],
                    };
                    const ppu = item.pieces_per_unit ?? 1;
                    const pricePerPiecePKR =
                      item.variant_price ?? product.price ?? 0;
                    const itemTotalPKR = pricePerPiecePKR * ppu * item.quantity;
                    const rowPhysicalPieces = ppu * item.quantity;
                    const displayName =
                      item.variant_name && item.variant_name !== "Standard"
                        ? `${product.name} (${item.variant_name})${
                            ppu > 1 ? ` - ${ppu}-Piece` : ""
                          }`
                        : ppu > 1
                        ? `${product.name} (${ppu}-Piece)`
                        : product.name;
                    return (
                      <li key={item.id} className="co-review-item">
                        <div className="co-review-item-info">
                          <p className="co-review-item-name">{displayName}</p>
                          <p className="co-review-item-variant">
                            {product.subcategory} × {item.quantity} unit
                            {item.quantity !== 1 ? "s" : ""}
                            {ppu > 1 && ` (${rowPhysicalPieces} total pieces)`}
                          </p>
                        </div>
                        <span className="co-review-item-price">
                          {formatPrice(itemTotalPKR)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="co-review-terms">
                  By placing your order, you agree to our{" "}
                  <Link href="/terms" className="co-review-link">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="co-review-link">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
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
              ) : (
                <button className="co-next-btn" onClick={nextStep}>
                  Continue →
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - ORDER SUMMARY */}
          <div className="co-summary-col">
            <div className="co-summary-card">
              <p className="co-summary-title">
                <span className="co-ey-line" />
                Order Summary
                <span className="co-ey-line" />
              </p>
              <ul className="co-summary-items">
                {validItems.slice(0, 3).map((item) => {
                  const product = item.product ?? {
                    id: item.product_id,
                    name: item.variant_name || "Product",
                    description: "",
                    category: "",
                    subcategory: "",
                    condition: "new",
                    is_featured: false,
                    is_active: true,
                    price: item.variant_price ?? 0,
                    images: item.variant_image ? [item.variant_image] : [],
                  };
                  const ppu = item.pieces_per_unit ?? 1;
                  const pricePerPiecePKR =
                    item.variant_price ?? product.price ?? 0;
                  const itemTotalPKR = pricePerPiecePKR * ppu * item.quantity;
                  const displayImage =
                    item.variant_image || product.images?.[0] || null;
                  const displayName =
                    item.variant_name && item.variant_name !== "Standard"
                      ? `${product.name} (${item.variant_name})`
                      : product.name;
                  return (
                    <li key={item.id} className="co-summary-item">
                      <div className="co-summary-item-img">
                        {displayImage ? (
                          <img
                            src={displayImage}
                            alt={product.name}
                            style={{
                              objectFit: "cover",
                              width: "100%",
                              height: "100%",
                            }}
                          />
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.8"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        )}
                      </div>
                      <div className="co-summary-item-info">
                        <p className="co-summary-item-name">{displayName}</p>
                        <p className="co-summary-item-variant">
                          {ppu > 1 ? `${ppu}-Piece × ` : ""}
                          {item.quantity}{" "}
                          {item.quantity === 1 ? "unit" : "units"}
                        </p>
                      </div>
                      <span className="co-summary-item-price">
                        {formatPrice(itemTotalPKR)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {validItems.length > 3 && (
                <div className="co-summary-more">
                  +{validItems.length - 3} more item
                  {validItems.length - 3 > 1 ? "s" : ""}
                </div>
              )}
              <div className="co-summary-breakdown">
                <div className="co-summary-row">
                  <span>
                    Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})
                  </span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="co-summary-row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                <div className="co-summary-divider" />
                <div className="co-summary-row co-summary-total">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <div className="co-perks">
                <div className="co-perk">
                  <span className="co-perk-icon">🔒</span>
                  <span className="co-perk-text">Secure Checkout</span>
                </div>
                <div className="co-perk">
                  <span className="co-perk-icon">↩</span>
                  <span className="co-perk-text">30-Day Easy Returns</span>
                </div>
                <div className="co-perk">
                  <span className="co-perk-icon">✦</span>
                  <span className="co-perk-text">Luxury Packaging</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
