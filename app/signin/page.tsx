"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "./signin.css";

export default function SignIn() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clear stale Supabase storage on signin page load
    const clearStaleAuth = () => {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes("supabase") && key.includes("auth-token")) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.error("Error clearing storage:", e);
      }
    };
    clearStaleAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Determine if identifier is email or username
    let emailToUse = identifier.trim();
    const isEmail = identifier.includes("@");

    if (!isEmail) {
      // Look up email from username
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", identifier.trim())
        .maybeSingle();

      if (profileError || !profile) {
        setError("No account found with that username.");
        setLoading(false);
        return;
      }
      emailToUse = profile.email;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (signInError) {
      setError(
        "Incorrect credentials. Please check your email/username and password."
      );
      setLoading(false);
      return;
    }

    router.push("/profile");
  };

  // Add this inside the component, after useState declarations
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Add this useEffect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "success") {
      setResetSuccess(
        "Password reset successful! Please sign in with your new password."
      );
      // Clear the URL parameter
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  return (
    <div className="si-root">
      <div className="si-grain" aria-hidden="true" />
      <div className="si-bg-lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="si-corner si-corner--tl" aria-hidden="true" />
      <div className="si-corner si-corner--tr" aria-hidden="true" />
      <div className="si-corner si-corner--bl" aria-hidden="true" />
      <div className="si-corner si-corner--br" aria-hidden="true" />

      <div className="si-card">
        {/* Left panel — brand */}
        <div className="si-brand">
          <div className="si-brand-inner">
            {/* <div className="si-brand-logo">
              <Image
                src="/logo.png"
                alt="Aurexia"
                width={52}
                height={52}
                className="si-logo-img"
                priority
              />
            </div> */}
            <p className="si-brand-eyebrow">
              <span className="si-ey-line" />
              Welcome Back
              <span className="si-ey-line" />
            </p>
            <h1 className="si-brand-title">Tech4U</h1>
            <p className="si-brand-tagline">
              Luxury lives in every
              <br />
              <em>detail.</em>
            </p>
            <div className="si-brand-divider" aria-hidden="true" />
            <p className="si-brand-quote">
              "Time is the most precious luxury — wear it well."
            </p>
            <div className="si-watch-ring" aria-hidden="true">
              <div className="si-watch-inner" />
            </div>
          </div>
        </div>

        {resetSuccess && (
          <div className="si-success-box" role="alert">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              width="14"
              height="14"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {resetSuccess}
          </div>
        )}

        {/* Right panel — form */}
        <div className="si-form-panel">
          <div className="si-form-wrap">
            <div className="si-form-header">
              <p className="si-form-eyebrow">
                <span className="si-ey-line" />
                Member Access
                <span className="si-ey-line" />
              </p>
              <h2 className="si-form-title">
                Sign <em>In</em>
              </h2>
              <p className="si-form-sub">
                Enter your credentials to access your account
              </p>
            </div>

            <form className="si-form" onSubmit={handleSubmit} noValidate>
              {/* Error */}
              {error && (
                <div className="si-error-box" role="alert">
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

              {/* Username / Email */}
              <div
                className={`si-field${
                  focused === "id" ? " si-field--focused" : ""
                }${identifier ? " si-field--filled" : ""}`}
              >
                <label className="si-label" htmlFor="si-identifier">
                  Username or Email
                </label>
                <div className="si-input-wrap">
                  <span className="si-input-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="si-identifier"
                    type="text"
                    className="si-input"
                    placeholder="your@email.com or username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onFocus={() => setFocused("id")}
                    onBlur={() => setFocused(null)}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="si-field-line" aria-hidden="true" />
              </div>

              {/* Password */}
              <div
                className={`si-field${
                  focused === "pw" ? " si-field--focused" : ""
                }${password ? " si-field--filled" : ""}`}
              >
                <label className="si-label" htmlFor="si-password">
                  Password
                </label>
                <div className="si-input-wrap">
                  <span className="si-input-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </span>
                  <input
                    id="si-password"
                    type={showPass ? "text" : "password"}
                    className="si-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("pw")}
                    onBlur={() => setFocused(null)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="si-eye-btn"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="si-field-line" aria-hidden="true" />
              </div>

              {/* Forgot password */}
              <div className="si-forgot-row">
                <Link href="/forgot-password" className="si-forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="si-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="si-btn-loader">
                    <span className="si-spinner" />
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
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

            <div className="si-or" aria-hidden="true">
              <span className="si-or-line" />
              <span className="si-or-text">or</span>
              <span className="si-or-line" />
            </div>

            <p className="si-switch">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="si-switch-link">
                Sign up for free
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
          </div>
        </div>
      </div>
    </div>
  );
}
