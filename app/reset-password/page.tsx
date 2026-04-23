"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import "./reset-password.css";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;

    const setupSession = async () => {
      if (hash && hash.includes("type=recovery")) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error && data.session) {
            setValidSession(true);
            window.history.replaceState(null, "", window.location.pathname);
          } else {
            setValidSession(false);
          }
          setChecking(false);
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      setValidSession(!!session);
      setChecking(false);
    };

    setupSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          setValidSession(true);
          setChecking(false);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);

    // Sign out after 2 seconds and redirect to signin
    setTimeout(async () => {
      await supabase.auth.signOut();
      router.push("/signin?reset=success");
    }, 2000);
  };

  if (checking) {
    return (
      <div
        className="rp-root"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <span className="rp-spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  if (!validSession) {
    return (
      <div
        className="rp-root"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: "1rem",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h2 style={{ color: "#fff", fontSize: "1.4rem" }}>
          Link expired or invalid
        </h2>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem" }}>
          Please request a new password reset link.
        </p>
        <Link
          href="/forgot-password"
          style={{
            marginTop: "0.5rem",
            color: "#b49150",
            textDecoration: "underline",
            fontSize: "0.95rem",
          }}
        >
          Go to Forgot Password
        </Link>
      </div>
    );
  }

  return (
    <div className="rp-root">
      <div className="rp-grain" aria-hidden="true" />
      <div className="rp-bg-lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="rp-corner rp-corner--tl" aria-hidden="true" />
      <div className="rp-corner rp-corner--tr" aria-hidden="true" />
      <div className="rp-corner rp-corner--bl" aria-hidden="true" />
      <div className="rp-corner rp-corner--br" aria-hidden="true" />

      <div className="rp-card">
        <div className="rp-brand">
          <div className="rp-brand-inner">
            <div className="rp-brand-logo">
              <Image
                src="/logo.png"
                alt="Aurexia"
                width={52}
                height={52}
                className="rp-logo-img"
                priority
              />
            </div>
            <p className="rp-brand-eyebrow">
              <span className="rp-ey-line" />
              New Password
              <span className="rp-ey-line" />
            </p>
            <h1 className="rp-brand-title">Aurexia</h1>
            <p className="rp-brand-tagline">
              Restore your
              <br />
              <em>secure access.</em>
            </p>
            <div className="rp-brand-divider" aria-hidden="true" />
            <p className="rp-brand-note">
              Choose a strong password. Use at least 6 characters with a mix of
              letters and numbers.
            </p>
            <div className="rp-ring" aria-hidden="true">
              <div className="rp-ring-inner" />
            </div>
          </div>
        </div>

        <div className="rp-form-panel">
          <div className="rp-form-wrap">
            {!done ? (
              <>
                <div className="rp-form-header">
                  <p className="rp-form-eyebrow">
                    <span className="rp-ey-line" />
                    Account Security
                    <span className="rp-ey-line" />
                  </p>
                  <h2 className="rp-form-title">
                    Set New <em>Password</em>
                  </h2>
                  <p className="rp-form-sub">
                    Enter and confirm your new password below
                  </p>
                </div>

                {error && (
                  <div className="rp-error-box" role="alert">
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

                <form className="rp-form" onSubmit={handleSubmit} noValidate>
                  <div
                    className={`rp-field${
                      focused === "pw" ? " rp-field--focused" : ""
                    }${password ? " rp-field--filled" : ""}`}
                  >
                    <label className="rp-label" htmlFor="rp-password">
                      New Password
                    </label>
                    <div className="rp-input-wrap">
                      <span className="rp-input-icon" aria-hidden="true">
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
                        id="rp-password"
                        type={showPass ? "text" : "password"}
                        className="rp-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocused("pw")}
                        onBlur={() => setFocused(null)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="rp-eye-btn"
                        onClick={() => setShowPass(!showPass)}
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
                    <div className="rp-field-line" aria-hidden="true" />
                  </div>

                  <div
                    className={`rp-field${
                      focused === "cf" ? " rp-field--focused" : ""
                    }${confirm ? " rp-field--filled" : ""}`}
                  >
                    <label className="rp-label" htmlFor="rp-confirm">
                      Confirm Password
                    </label>
                    <div className="rp-input-wrap">
                      <span className="rp-input-icon" aria-hidden="true">
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
                        id="rp-confirm"
                        type={showConfirm ? "text" : "password"}
                        className="rp-input"
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        onFocus={() => setFocused("cf")}
                        onBlur={() => setFocused(null)}
                        required
                      />
                      <button
                        type="button"
                        className="rp-eye-btn"
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? (
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
                    <div className="rp-field-line" aria-hidden="true" />
                  </div>

                  <button
                    type="submit"
                    className="rp-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="rp-spinner" />
                    ) : (
                      <>
                        <span>Reset Password</span>
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
              </>
            ) : (
              <div className="rp-success">
                <div className="rp-success-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <p className="rp-success-eyebrow">
                  <span className="rp-ey-line" />
                  Success
                  <span className="rp-ey-line" />
                </p>
                <h2 className="rp-success-title">
                  Password <em>Updated!</em>
                </h2>
                <p className="rp-success-note">
                  Your new password has been set successfully. Redirecting you
                  to sign in...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
