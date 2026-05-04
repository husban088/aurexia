"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { isOwner } from "@/lib/checkOwner";
import "./signin.css";

/* ═══════════════════════════════════════════
   SESSION CACHE HELPERS
   Same pattern as layout.tsx — set BEFORE
   redirect so layout gets cache instantly
═══════════════════════════════════════════ */
const CACHE_KEY = "panel_auth_ok";

function setCachedAuth(ok: boolean) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ok, ts: Date.now() }));
  } catch {
    // sessionStorage not available (SSR / private mode) — silently ignore
  }
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function SignIn() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  /* ── On mount: skip form if already signed in ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get("redirectTo");
        const owner = isOwner(session.user.email);
        if (owner) {
          setCachedAuth(true);
          window.location.replace(
            redirectTo?.startsWith("/panel") ? redirectTo : "/panel"
          );
        } else {
          window.location.replace("/profile");
        }
      }
    });

    /* ── Show success message after password reset ── */
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "success") {
      setResetSuccess(
        "Password reset successful! Please sign in with your new password."
      );
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  /* ── Form submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let emailToUse = identifier.trim();
    const isEmail = identifier.includes("@");

    /* Username → email lookup */
    if (!isEmail) {
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

    /* Sign in */
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email: emailToUse, password });

    if (signInError) {
      setError(
        "Incorrect credentials. Please check your email/username and password."
      );
      setLoading(false);
      return;
    }

    const userEmail = signInData?.user?.email ?? null;
    const ownerUser = isOwner(userEmail);

    /* Cache BEFORE redirect — layout gets it instantly */
    setCachedAuth(ownerUser);

    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirectTo");

    if (ownerUser) {
      window.location.replace(
        redirectTo?.startsWith("/panel") ? redirectTo : "/panel"
      );
    } else {
      window.location.replace("/profile");
    }
  };

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <div className="si-root">
      {/* Decorative overlays */}
      <div className="si-grain" aria-hidden="true" />
      <div className="si-bg-lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* Corner brackets */}
      <div className="si-corner si-corner--tl" aria-hidden="true" />
      <div className="si-corner si-corner--tr" aria-hidden="true" />
      <div className="si-corner si-corner--bl" aria-hidden="true" />
      <div className="si-corner si-corner--br" aria-hidden="true" />

      <div className="si-card">
        {/* ══ LEFT: Brand Panel ══ */}
        <div className="si-brand">
          <div className="si-brand-inner">
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
              &ldquo;Time is the most precious luxury — wear it well.&rdquo;
            </p>
            <div className="si-watch-ring" aria-hidden="true">
              <div className="si-watch-inner" />
            </div>
          </div>
        </div>

        {/* ══ RIGHT: Form Panel ══ */}
        <div className="si-form-panel">
          <div className="si-form-wrap">
            {/* Password reset success alert */}
            {resetSuccess && (
              <div className="si-success-box" role="alert">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  width="14"
                  height="14"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {resetSuccess}
              </div>
            )}

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
              {/* Error alert */}
              {error && (
                <div className="si-error-box" role="alert">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    width="14"
                    height="14"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Username / Email field */}
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

              {/* Password field */}
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
                    onClick={() => setShowPass((prev) => !prev)}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
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
                        aria-hidden="true"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="si-field-line" aria-hidden="true" />
              </div>

              {/* Forgot password link */}
              <div className="si-forgot-row">
                <Link href="/forgot-password" className="si-forgot-link">
                  Forgot password?
                </Link>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="si-submit-btn"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <span className="si-btn-loader" aria-hidden="true">
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
                      aria-hidden="true"
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

            {/* Divider */}
            <div className="si-or" aria-hidden="true">
              <span className="si-or-line" />
              <span className="si-or-text">or</span>
              <span className="si-or-line" />
            </div>

            {/* Switch to signup */}
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
                  aria-hidden="true"
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
