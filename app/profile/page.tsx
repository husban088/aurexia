"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import "./profile.css";

export default function Profile() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit states
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  const [focused, setFocused] = useState<string | null>(null);

  // Fetch user data function
  const fetchUserData = useCallback(async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/signin");
      return;
    }

    setUser(session.user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setEditUsername(profileData.username || "");
      setEditEmail(profileData.email || session.user.email || "");
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchUserData();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          await fetchUserData();
        } else if (event === "SIGNED_OUT") {
          router.push("/signin");
        } else if (event === "USER_UPDATED") {
          await fetchUserData();
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [fetchUserData, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    // Check username uniqueness if changed
    if (editUsername !== profile?.username) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", editUsername.trim())
        .maybeSingle();

      if (existing && existing.id !== user?.id) {
        setError("This username is already taken.");
        setSaving(false);
        return;
      }
    }

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: editUsername.trim(), email: editEmail.trim() })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    // Update email in auth if changed
    if (editEmail.trim() !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: editEmail.trim(),
      });
      if (emailError) {
        setError(emailError.message);
        setSaving(false);
        return;
      }
    }

    // Refresh profile data
    await fetchUserData();

    setSuccess("Profile updated successfully.");
    setSaving(false);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);

    // Update password directly (no need to re-authenticate)
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess("Password changed successfully. Please sign in again.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSaving(false);

    // Sign out after 2 seconds and redirect to signin
    setTimeout(async () => {
      await supabase.auth.signOut();
      router.push("/signin");
    }, 2000);
  };

  if (loading) {
    return (
      <div className="pf-loading">
        <div className="pf-loading-ring">
          <div className="pf-loading-inner" />
        </div>
        <p className="pf-loading-text">Loading your profile…</p>
      </div>
    );
  }

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : "AU";

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="pf-root">
      <div className="pf-grain" aria-hidden="true" />
      <div className="pf-bg-lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="pf-corner pf-corner--tl" aria-hidden="true" />
      <div className="pf-corner pf-corner--tr" aria-hidden="true" />
      <div className="pf-corner pf-corner--bl" aria-hidden="true" />
      <div className="pf-corner pf-corner--br" aria-hidden="true" />

      <div className="pf-container">
        {/* LEFT PANEL */}
        <aside className="pf-aside">
          <div className="pf-avatar-wrap">
            <div className="pf-avatar-ring">
              <div className="pf-avatar">
                <span className="pf-avatar-initials">{initials}</span>
              </div>
            </div>
            <div className="pf-avatar-glow" aria-hidden="true" />
          </div>

          <div className="pf-aside-info">
            <p className="pf-aside-eyebrow">
              <span className="pf-ey-line" />
              Member
              <span className="pf-ey-line" />
            </p>
            <h2 className="pf-aside-name">{profile?.username || "—"}</h2>
            <p className="pf-aside-email">{profile?.email || user?.email}</p>
            <div className="pf-aside-divider" />
            <div className="pf-aside-meta">
              <div className="pf-meta-item">
                <span className="pf-meta-label">Member Since</span>
                <span className="pf-meta-value">{joinDate}</span>
              </div>
              <div className="pf-meta-item">
                <span className="pf-meta-label">Status</span>
                <span className="pf-meta-value pf-meta-active">
                  <span className="pf-dot" />
                  Active
                </span>
              </div>
            </div>
          </div>

          <button className="pf-signout-btn" onClick={handleSignOut}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </aside>

        {/* RIGHT PANEL */}
        <div className="pf-main">
          <div className="pf-main-header">
            <p className="pf-main-eyebrow">
              <span className="pf-ey-line" />
              Your Account
              <span className="pf-ey-line" />
            </p>
            <h1 className="pf-main-title">
              Profile <em>Settings</em>
            </h1>
            <p className="pf-main-sub">
              Manage your personal information and security
            </p>
          </div>

          {/* Tabs */}
          <div className="pf-tabs">
            <button
              className={`pf-tab${
                activeTab === "info" ? " pf-tab--active" : ""
              }`}
              onClick={() => {
                setActiveTab("info");
                setError(null);
                setSuccess(null);
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Personal Info
            </button>
            <button
              className={`pf-tab${
                activeTab === "password" ? " pf-tab--active" : ""
              }`}
              onClick={() => {
                setActiveTab("password");
                setError(null);
                setSuccess(null);
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Password
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="pf-alert pf-alert--error" role="alert">
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
          {success && (
            <div className="pf-alert pf-alert--success" role="alert">
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
              {success}
            </div>
          )}

          {/* INFO TAB */}
          {activeTab === "info" && (
            <form className="pf-form" onSubmit={handleSaveInfo}>
              <div className="pf-form-grid">
                <div
                  className={`pf-field${
                    focused === "un" ? " pf-field--focused" : ""
                  }${editUsername ? " pf-field--filled" : ""}`}
                >
                  <label className="pf-label" htmlFor="pf-username">
                    Username
                  </label>
                  <div className="pf-input-wrap">
                    <span className="pf-input-icon" aria-hidden="true">
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
                      id="pf-username"
                      type="text"
                      className="pf-input"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      onFocus={() => setFocused("un")}
                      onBlur={() => setFocused(null)}
                      autoComplete="username"
                      required
                    />
                  </div>
                  <div className="pf-field-line" aria-hidden="true" />
                </div>

                <div
                  className={`pf-field${
                    focused === "em" ? " pf-field--focused" : ""
                  }${editEmail ? " pf-field--filled" : ""}`}
                >
                  <label className="pf-label" htmlFor="pf-email">
                    Email Address
                  </label>
                  <div className="pf-input-wrap">
                    <span className="pf-input-icon" aria-hidden="true">
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
                      id="pf-email"
                      type="email"
                      className="pf-input"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      onFocus={() => setFocused("em")}
                      onBlur={() => setFocused(null)}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="pf-field-line" aria-hidden="true" />
                </div>
              </div>

              <div className="pf-form-info">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  width="13"
                  height="13"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                </svg>
                Changing your email will require re-verification.
              </div>

              <button type="submit" className="pf-save-btn" disabled={saving}>
                {saving ? (
                  <span className="pf-spinner" />
                ) : (
                  <>
                    <span>Save Changes</span>
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
          )}

          {/* PASSWORD TAB */}
          {activeTab === "password" && (
            <form className="pf-form" onSubmit={handleSavePassword}>
              <div className="pf-form-grid pf-form-grid--single">
                <div
                  className={`pf-field${
                    focused === "np" ? " pf-field--focused" : ""
                  }${newPassword ? " pf-field--filled" : ""}`}
                >
                  <label className="pf-label" htmlFor="pf-new-pass">
                    New Password
                  </label>
                  <div className="pf-input-wrap">
                    <span className="pf-input-icon" aria-hidden="true">
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
                      id="pf-new-pass"
                      type={showNewPass ? "text" : "password"}
                      className="pf-input"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setFocused("np")}
                      onBlur={() => setFocused(null)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="pf-eye-btn"
                      onClick={() => setShowNewPass(!showNewPass)}
                    >
                      {showNewPass ? (
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
                  <div className="pf-field-line" aria-hidden="true" />
                </div>

                <div
                  className={`pf-field${
                    focused === "cfp" ? " pf-field--focused" : ""
                  }${confirmPassword ? " pf-field--filled" : ""}`}
                >
                  <label className="pf-label" htmlFor="pf-confirm-pass">
                    Confirm New Password
                  </label>
                  <div className="pf-input-wrap">
                    <span className="pf-input-icon" aria-hidden="true">
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
                      id="pf-confirm-pass"
                      type={showConfirmPass ? "text" : "password"}
                      className="pf-input"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocused("cfp")}
                      onBlur={() => setFocused(null)}
                      required
                    />
                    <button
                      type="button"
                      className="pf-eye-btn"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                    >
                      {showConfirmPass ? (
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
                  <div className="pf-field-line" aria-hidden="true" />
                </div>
              </div>

              <button type="submit" className="pf-save-btn" disabled={saving}>
                {saving ? (
                  <span className="pf-spinner" />
                ) : (
                  <>
                    <span>Update Password</span>
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
          )}
        </div>
      </div>
    </div>
  );
}
