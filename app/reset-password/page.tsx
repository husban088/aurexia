"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "./reset-password.css";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // ✅ FIX: Handle the recovery session from the email link
    // Supabase sends the user to this page with a hash fragment containing the tokens
    // onAuthStateChange fires PASSWORD_RECOVERY event when the link is valid
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[ResetPassword] Auth event:", event);

      if (event === "PASSWORD_RECOVERY") {
        // ✅ Session is now active, user can set new password
        setReady(true);
      } else if (event === "SIGNED_IN" && session) {
        // Some Supabase versions fire SIGNED_IN instead
        setReady(true);
      }
    });

    // Also check if we already have a session (user refreshed the page)
    const checkExistingSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
      }
    };
    checkExistingSession();

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);

    // ✅ FIX: Update the password using the active session
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(
        updateError.message || "Failed to reset password. Please try again."
      );
      setLoading(false);
      return;
    }

    // ✅ FIX: Sign out after password reset so user signs in fresh
    await supabase.auth.signOut({ scope: "local" });

    setDone(true);
    setLoading(false);

    // Redirect to signin after 2 seconds with success param
    setTimeout(() => {
      router.push("/signin?reset=success");
    }, 2000);
  };

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
        {/* Left brand */}
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
              Secure your
              <br />
              <em>luxury access.</em>
            </p>
            <div className="rp-brand-divider" aria-hidden="true" />
            <p className="rp-brand-note">
              Choose a strong password to keep your Aurexia account safe and
              secure.
            </p>
            <div className="rp-ring" aria-hidden="true">
              <div className="rp-ring-inner" />
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="rp-form-panel">
          <div className="rp-form-wrap">
            {done ? (
              /* Success state */
              <div className="rp-success">
                <div className="rp-success-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="rp-success-ring" aria-hidden="true" />
                <p className="rp-success-eyebrow">
                  <span className="rp-ey-line" />
                  Success
                  <span className="rp-ey-line" />
                </p>
                <h2 className="rp-success-title">
                  Password <em>Reset!</em>
                </h2>
                <p className="rp-success-desc">
                  Your password has been updated successfully. Redirecting you
                  to sign in…
                </p>
                <Link href="/signin" className="rp-back-btn">
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
                  Sign In Now
                </Link>
              </div>
            ) : !ready ? (
              /* Waiting for recovery link */
              <div className="rp-waiting">
                <div className="rp-spinner-wrap">
                  <span className="rp-spinner-large" />
                </div>
                <p className="rp-waiting-title">Verifying reset link…</p>
                <p className="rp-waiting-sub">
                  Please wait while we verify your password reset link.
                </p>
                <p className="rp-waiting-note">
                  If nothing happens, your link may have expired.{" "}
                  <Link href="/forgot-password" className="rp-link">
                    Request a new one.
                  </Link>
                </p>
              </div>
            ) : (
              /* Reset form */
              <>
                <div className="rp-form-header">
                  <p className="rp-form-eyebrow">
                    <span className="rp-ey-line" />
                    Set New Password
                    <span className="rp-ey-line" />
                  </p>
                  <h2 className="rp-form-title">
                    Reset <em>Password</em>
                  </h2>
                  <p className="rp-form-sub">
                    Enter and confirm your new password below
                  </p>
                </div>

                <form className="rp-form" onSubmit={handleSubmit} noValidate>
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

                  {/* New Password */}
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
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocused("pw")}
                        onBlur={() => setFocused(null)}
                        autoComplete="new-password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="rp-eye-btn"
                        onClick={() => setShowPass(!showPass)}
                        aria-label={
                          showPass ? "Hide password" : "Show password"
                        }
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

                  {/* Confirm Password */}
                  <div
                    className={`rp-field${
                      focused === "cp" ? " rp-field--focused" : ""
                    }${confirmPassword ? " rp-field--filled" : ""}`}
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
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <input
                        id="rp-confirm"
                        type={showConfirm ? "text" : "password"}
                        className="rp-input"
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocused("cp")}
                        onBlur={() => setFocused(null)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="rp-eye-btn"
                        onClick={() => setShowConfirm(!showConfirm)}
                        aria-label={
                          showConfirm ? "Hide password" : "Show password"
                        }
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

                <p className="rp-switch">
                  Remember your password?{" "}
                  <Link href="/signin" className="rp-switch-link">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
