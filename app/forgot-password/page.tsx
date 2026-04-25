"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import "./forgot-password.css";
import { clearAuthStorage } from "@/lib/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Clear any existing session before sending reset email
      clearAuthStorage();
      await supabase.auth.signOut();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-root">
      <div className="fp-grain" aria-hidden="true" />
      <div className="fp-bg-lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="fp-corner fp-corner--tl" aria-hidden="true" />
      <div className="fp-corner fp-corner--tr" aria-hidden="true" />
      <div className="fp-corner fp-corner--bl" aria-hidden="true" />
      <div className="fp-corner fp-corner--br" aria-hidden="true" />

      <div className="fp-card">
        {/* Left brand */}
        <div className="fp-brand">
          <div className="fp-brand-inner">
            <div className="fp-brand-logo">
              <Image
                src="/logo.png"
                alt="Aurexia"
                width={52}
                height={52}
                className="fp-logo-img"
                priority
              />
            </div>
            <p className="fp-brand-eyebrow">
              <span className="fp-ey-line" />
              Password Reset
              <span className="fp-ey-line" />
            </p>
            <h1 className="fp-brand-title">Aurexia</h1>
            <p className="fp-brand-tagline">
              Secure your
              <br />
              <em>luxury access.</em>
            </p>
            <div className="fp-brand-divider" aria-hidden="true" />
            <p className="fp-brand-note">
              Enter your registered email and we'll send you a secure link to
              reset your password instantly.
            </p>
            <div className="fp-ring" aria-hidden="true">
              <div className="fp-ring-inner" />
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="fp-form-panel">
          <div className="fp-form-wrap">
            {!sent ? (
              <>
                <div className="fp-form-header">
                  <p className="fp-form-eyebrow">
                    <span className="fp-ey-line" />
                    Account Recovery
                    <span className="fp-ey-line" />
                  </p>
                  <h2 className="fp-form-title">
                    Forgot <em>Password?</em>
                  </h2>
                  <p className="fp-form-sub">
                    We'll send a reset link to your email
                  </p>
                </div>

                <form className="fp-form" onSubmit={handleSubmit} noValidate>
                  {error && (
                    <div className="fp-error-box" role="alert">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        width="14"
                        height="14"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <div
                    className={`fp-field${focused ? " fp-field--focused" : ""}${
                      email ? " fp-field--filled" : ""
                    }`}
                  >
                    <label className="fp-label" htmlFor="fp-email">
                      Email Address
                    </label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon" aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </span>
                      <input
                        id="fp-email"
                        type="email"
                        className="fp-input"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        autoComplete="email"
                        required
                      />
                    </div>
                    <div className="fp-field-line" aria-hidden="true" />
                  </div>

                  <button
                    type="submit"
                    className="fp-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="fp-spinner" />
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path
                            d="M5 12h14M12 5l7 7-7 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <div className="fp-or" aria-hidden="true">
                  <span className="fp-or-line" />
                  <span className="fp-or-text">or</span>
                  <span className="fp-or-line" />
                </div>

                <p className="fp-switch">
                  Remember your password?{" "}
                  <Link href="/signin" className="fp-switch-link">
                    Sign in
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      width="12"
                      height="12"
                    >
                      <path
                        d="M9 18l6-6-6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </p>
              </>
            ) : (
              <div className="fp-success">
                <div className="fp-success-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div className="fp-success-ring" aria-hidden="true" />
                <p className="fp-success-eyebrow">
                  <span className="fp-ey-line" />
                  Email Sent
                  <span className="fp-ey-line" />
                </p>
                <h2 className="fp-success-title">
                  Check your <em>inbox</em>
                </h2>
                <p className="fp-success-desc">
                  We've sent a password reset link to
                </p>
                <p className="fp-success-email">{email}</p>
                <p className="fp-success-note">
                  Open the email and click the link to set a new password. The
                  link expires in 1 hour.
                </p>
                <Link href="/signin" className="fp-back-btn">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      d="M19 12H5M12 5l-7 7 7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Back to Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
