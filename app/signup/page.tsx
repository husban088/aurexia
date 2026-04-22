"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import "./signup.css";

export default function SignUp() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: connect to your auth logic
    console.log("Sign up →", { avatar, username, email, password });
  };

  return (
    <div className="su-root">
      {/* Grain */}
      <div className="su-grain" aria-hidden="true" />

      {/* Bg lines */}
      <div className="su-bg-lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* Corner brackets */}
      <div className="su-corner su-corner--tl" aria-hidden="true" />
      <div className="su-corner su-corner--tr" aria-hidden="true" />
      <div className="su-corner su-corner--bl" aria-hidden="true" />
      <div className="su-corner su-corner--br" aria-hidden="true" />

      {/* Card */}
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

            {/* Decorative ring */}
            <div className="su-ring" aria-hidden="true">
              <div className="su-ring-inner" />
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="su-form-panel">
          <div className="su-form-wrap">
            {/* Header */}
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
              {/* Avatar upload */}
              <div className="su-avatar-row">
                <button
                  type="button"
                  className="su-avatar-btn"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Upload profile picture"
                >
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt="Your avatar"
                      fill
                      className="su-avatar-img"
                    />
                  ) : (
                    <span className="su-avatar-placeholder" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      >
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                  )}
                  <span className="su-avatar-badge" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="su-file-input"
                  onChange={handleAvatarChange}
                  aria-label="Profile picture"
                />
                <div className="su-avatar-hint">
                  <p className="su-avatar-hint-title">Profile Picture</p>
                  <p className="su-avatar-hint-sub">
                    Click to upload · JPG, PNG, WEBP
                  </p>
                </div>
              </div>

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

              {/* Submit */}
              <button type="submit" className="su-submit-btn">
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
              </button>
            </form>

            {/* Divider */}
            <div className="su-or" aria-hidden="true">
              <span className="su-or-line" />
              <span className="su-or-text">or</span>
              <span className="su-or-line" />
            </div>

            {/* Sign in link */}
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
