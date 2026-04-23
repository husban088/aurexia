"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "./signup.css";

export default function SignUp() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate username uniqueness
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.trim())
      .maybeSingle();

    if (existing) {
      setError("This username is already taken. Please choose another.");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: username.trim() },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Auto sign in after signup
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/profile");
  };

  return (
    <div className="su-root">
      <div className="su-grain" aria-hidden="true" />
      <div className="su-bg-lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="su-corner su-corner--tl" aria-hidden="true" />
      <div className="su-corner su-corner--tr" aria-hidden="true" />
      <div className="su-corner su-corner--bl" aria-hidden="true" />
      <div className="su-corner su-corner--br" aria-hidden="true" />

      <div className="su-card">
        {/* Left — brand */}
        <div className="su-brand">
          <div className="su-brand-inner">
            <div className="su-brand-logo">
              <Image
                src="/logo.png"
                alt="Aurexia"
                width={52}
                height={52}
                className="su-logo-img"
                priority
              />
            </div>
            <p className="su-brand-eyebrow">
              <span className="su-ey-line" />
              Join Aurexia
              <span className="su-ey-line" />
            </p>
            <h1 className="su-brand-title">Aurexia</h1>
            <p className="su-brand-tagline">
              Begin your journey
              <br />
              into <em>luxury.</em>
            </p>
            <div className="su-brand-divider" aria-hidden="true" />
            <ul className="su-brand-perks">
              {[
                "Exclusive member pricing",
                "Early access to collections",
                "Free shipping on all orders",
                "Dedicated concierge support",
              ].map((perk) => (
                <li key={perk}>
                  <svg
                    viewBox="0 0 20 20"
                    width="12"
                    height="12"
                    fill="currentColor"
                  >
                    <polygon points="10,1 12.9,7 19.5,8.1 14.7,12.7 16,19.5 10,16.2 4,19.5 5.3,12.7 0.5,8.1 7.1,7" />
                  </svg>
                  {perk}
                </li>
              ))}
            </ul>
            <div className="su-ring" aria-hidden="true">
              <div className="su-ring-inner" />
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="su-form-panel">
          <div className="su-form-wrap">
            <div className="su-form-header">
              <p className="su-form-eyebrow">
                <span className="su-ey-line" />
                New Member
                <span className="su-ey-line" />
              </p>
              <h2 className="su-form-title">
                Create <em>Account</em>
              </h2>
              <p className="su-form-sub">
                Set up your Aurexia profile in seconds
              </p>
            </div>

            <form className="su-form" onSubmit={handleSubmit} noValidate>
              {/* Error */}
              {error && (
                <div className="su-error-box" role="alert">
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

              {/* Username */}
              <div
                className={`su-field${
                  focused === "un" ? " su-field--focused" : ""
                }${username ? " su-field--filled" : ""}`}
              >
                <label className="su-label" htmlFor="su-username">
                  Username
                </label>
                <div className="su-input-wrap">
                  <span className="su-input-icon" aria-hidden="true">
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
                    id="su-username"
                    type="text"
                    className="su-input"
                    placeholder="your_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocused("un")}
                    onBlur={() => setFocused(null)}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="su-field-line" aria-hidden="true" />
              </div>

              {/* Email */}
              <div
                className={`su-field${
                  focused === "em" ? " su-field--focused" : ""
                }${email ? " su-field--filled" : ""}`}
              >
                <label className="su-label" htmlFor="su-email">
                  Email Address
                </label>
                <div className="su-input-wrap">
                  <span className="su-input-icon" aria-hidden="true">
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
                    id="su-email"
                    type="email"
                    className="su-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("em")}
                    onBlur={() => setFocused(null)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="su-field-line" aria-hidden="true" />
              </div>

              {/* Password */}
              <div
                className={`su-field${
                  focused === "pw" ? " su-field--focused" : ""
                }${password ? " su-field--filled" : ""}`}
              >
                <label className="su-label" htmlFor="su-password">
                  Password
                </label>
                <div className="su-input-wrap">
                  <span className="su-input-icon" aria-hidden="true">
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
                    id="su-password"
                    type={showPass ? "text" : "password"}
                    className="su-input"
                    placeholder="••••••••"
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
                    className="su-eye-btn"
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
                <div className="su-field-line" aria-hidden="true" />
              </div>

              <button
                type="submit"
                className="su-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="su-spinner" />
                ) : (
                  <>
                    <span>Create Account</span>
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

            <div className="su-or" aria-hidden="true">
              <span className="su-or-line" />
              <span className="su-or-text">or</span>
              <span className="su-or-line" />
            </div>

            <p className="su-switch">
              Already have an account?{" "}
              <Link href="/signin" className="su-switch-link">
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
          </div>
        </div>
      </div>
    </div>
  );
}
