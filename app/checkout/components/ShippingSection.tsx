"use client";

import React from "react";
import { useCurrency } from "@/app/context/CurrencyContext";
import "./ShippingSection.css";

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

interface ShippingSectionProps {
  form: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    apartment: string;
    city: string;
    zip: string;
    country: string;
  };
  setFormField: (
    key: keyof FormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  getFieldError: (field: keyof FormData) => string | undefined;
  handleBlur: (field: keyof FormData) => void;
  focused: string | null;
  setFocused: (field: string | null) => void;
  // These props are kept for backward compat but phone code now comes from currency
  selectedFlag?: string;
  selectedCountryCode?: string;
  phoneExample?: string;
  selectedCountry?: string;
  onCountryChange?: (countryCode: string) => void;
}

export default function ShippingSection({
  form,
  setFormField,
  getFieldError,
  handleBlur,
  focused,
  setFocused,
}: ShippingSectionProps) {
  // ✅ Phone code auto-detect from CurrencyContext (detected from user's country/IP)
  const { currency } = useCurrency();

  // Map currency code → phone prefix + flag + example
  const phoneMap: Record<
    string,
    { code: string; flag: string; example: string }
  > = {
    PKR: { code: "+92", flag: "🇵🇰", example: "3001234567" },
    USD: { code: "+1", flag: "🇺🇸", example: "2125551234" },
    GBP: { code: "+44", flag: "🇬🇧", example: "7123456789" },
    EUR: { code: "+49", flag: "🇪🇺", example: "15123456789" },
    AUD: { code: "+61", flag: "🇦🇺", example: "412345678" },
    CAD: { code: "+1", flag: "🇨🇦", example: "4165551234" },
    AED: { code: "+971", flag: "🇦🇪", example: "501234567" },
    SAR: { code: "+966", flag: "🇸🇦", example: "501234567" },
    INR: { code: "+91", flag: "🇮🇳", example: "9876543210" },
  };

  const phoneInfo = phoneMap[currency.code] || phoneMap["USD"];

  return (
    <div className="ss-shipping-section">
      <h2 className="ss-section-title">
        <em>01.</em> Shipping Information
      </h2>

      <div className="ss-fields-grid">
        {/* First Name */}
        <div
          className={`ss-field ss-field--half ${
            focused === "firstName" ? "ss-field--focused" : ""
          } ${getFieldError("firstName") ? "ss-field--error" : ""}`}
        >
          <label className="ss-label">First Name *</label>
          <div className="ss-input-wrap">
            <input
              type="text"
              className="ss-input"
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
          <div className="ss-field-line" />
          {getFieldError("firstName") && (
            <span className="ss-error-text">{getFieldError("firstName")}</span>
          )}
        </div>

        {/* Last Name */}
        <div
          className={`ss-field ss-field--half ${
            focused === "lastName" ? "ss-field--focused" : ""
          } ${getFieldError("lastName") ? "ss-field--error" : ""}`}
        >
          <label className="ss-label">Last Name *</label>
          <div className="ss-input-wrap">
            <input
              type="text"
              className="ss-input"
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
          <div className="ss-field-line" />
          {getFieldError("lastName") && (
            <span className="ss-error-text">{getFieldError("lastName")}</span>
          )}
        </div>

        {/* Email */}
        <div
          className={`ss-field ${
            focused === "email" ? "ss-field--focused" : ""
          } ${getFieldError("email") ? "ss-field--error" : ""}`}
        >
          <label className="ss-label">Email Address *</label>
          <div className="ss-input-wrap">
            <input
              type="email"
              className="ss-input"
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
          <div className="ss-field-line" />
          {getFieldError("email") && (
            <span className="ss-error-text">{getFieldError("email")}</span>
          )}
        </div>

        {/* Phone Number — auto country code from currency detection */}
        <div
          className={`ss-field ${
            focused === "phone" ? "ss-field--focused" : ""
          } ${getFieldError("phone") ? "ss-field--error" : ""}`}
        >
          <label className="ss-label">Phone Number *</label>
          <div className="ss-input-wrap">
            {/* ✅ Auto-detected flag + code — no dropdown needed */}
            <div className="ss-phone-prefix">
              <span className="ss-phone-flag">{phoneInfo.flag}</span>
              <span className="ss-phone-code">{phoneInfo.code}</span>
            </div>
            <input
              type="tel"
              className="ss-input ss-input-with-prefix"
              placeholder={phoneInfo.example}
              value={form.phone}
              onChange={setFormField("phone")}
              onFocus={() => setFocused("phone")}
              onBlur={() => {
                setFocused(null);
                handleBlur("phone");
              }}
            />
          </div>
          <div className="ss-field-line" />
          {getFieldError("phone") && (
            <span className="ss-error-text">{getFieldError("phone")}</span>
          )}
          <span className="ss-hint-text">
            We'll send order updates via WhatsApp to this number
          </span>
        </div>

        {/* Address */}
        <div
          className={`ss-field ${
            focused === "address" ? "ss-field--focused" : ""
          } ${getFieldError("address") ? "ss-field--error" : ""}`}
        >
          <label className="ss-label">Street Address *</label>
          <div className="ss-input-wrap">
            <input
              type="text"
              className="ss-input"
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
          <div className="ss-field-line" />
          {getFieldError("address") && (
            <span className="ss-error-text">{getFieldError("address")}</span>
          )}
        </div>

        {/* Apartment (Optional) */}
        <div
          className={`ss-field ${
            focused === "apartment" ? "ss-field--focused" : ""
          }`}
        >
          <label className="ss-label">Apartment, Suite, etc. (Optional)</label>
          <div className="ss-input-wrap">
            <input
              type="text"
              className="ss-input"
              placeholder="Apt, Suite, Unit, Building"
              value={form.apartment}
              onChange={setFormField("apartment")}
              onFocus={() => setFocused("apartment")}
              onBlur={() => setFocused(null)}
            />
          </div>
          <div className="ss-field-line" />
        </div>

        {/* City */}
        <div
          className={`ss-field ss-field--half ${
            focused === "city" ? "ss-field--focused" : ""
          } ${getFieldError("city") ? "ss-field--error" : ""}`}
        >
          <label className="ss-label">City *</label>
          <div className="ss-input-wrap">
            <input
              type="text"
              className="ss-input"
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
          <div className="ss-field-line" />
          {getFieldError("city") && (
            <span className="ss-error-text">{getFieldError("city")}</span>
          )}
        </div>

        {/* ZIP */}
        <div
          className={`ss-field ss-field--half ${
            focused === "zip" ? "ss-field--focused" : ""
          } ${getFieldError("zip") ? "ss-field--error" : ""}`}
        >
          <label className="ss-label">ZIP Code *</label>
          <div className="ss-input-wrap">
            <input
              type="text"
              className="ss-input"
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
          <div className="ss-field-line" />
          {getFieldError("zip") && (
            <span className="ss-error-text">{getFieldError("zip")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
