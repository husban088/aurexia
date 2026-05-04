"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { signOutUser } from "@/lib/auth";
import "./profile.css";

type ProfileData = {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
};

// ─── MODULE-LEVEL CACHE ───────────────────────────────────────────────────────
// Survives Next.js client-side navigation — profile loads instantly on revisit
let _cachedProfile: ProfileData | null = null;
let _fetchPromise: Promise<ProfileData | null> | null = null;

async function getProfile(): Promise<ProfileData | null> {
  // 1. Return cache instantly (no network, no delay)
  if (_cachedProfile) return _cachedProfile;

  // 2. Dedupe in-flight calls
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        _fetchPromise = null;
        return null;
      }

      // Try fetching profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        // Profile doesn't exist yet — create it
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            username:
              user.user_metadata?.username ||
              user.email?.split("@")[0] ||
              "user",
            email: user.email || "",
          })
          .select()
          .single();

        const result: ProfileData =
          insertError || !newProfile
            ? {
                id: user.id,
                username:
                  user.user_metadata?.username ||
                  user.email?.split("@")[0] ||
                  "user",
                email: user.email || "",
                created_at: user.created_at,
                updated_at: user.updated_at || user.created_at,
              }
            : newProfile;

        _cachedProfile = result;
        _fetchPromise = null;
        return result;
      }

      _cachedProfile = profileData;
      _fetchPromise = null;
      return profileData;
    } catch {
      _fetchPromise = null;
      return null;
    }
  })();

  return _fetchPromise;
}

// Clear cache on sign-out so next user gets fresh data
function clearProfileCache() {
  _cachedProfile = null;
  _fetchPromise = null;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();

  // Sync-init from cache — renders instantly if already loaded
  const [profile, setProfile] = useState<ProfileData | null>(_cachedProfile);
  const [loading, setLoading] = useState(!_cachedProfile);
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");

  // Edit states
  const [username, setUsername] = useState(_cachedProfile?.username ?? "");
  const [focused, setFocused] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);

  // Password states
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    // Already cached — nothing to fetch
    if (_cachedProfile) {
      setProfile(_cachedProfile);
      setUsername(_cachedProfile.username);
      setLoading(false);
      return;
    }

    let active = true;

    getProfile().then((result) => {
      if (!active) return;
      if (!result) {
        router.replace("/signin?redirectTo=/profile");
        return;
      }
      setProfile(result);
      setUsername(result.username);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

  const getInitials = (name: string) => {
    return name?.slice(0, 2)?.toUpperCase() || "??";
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setAlert(null);
    setSaving(true);

    try {
      const trimmed = username.trim();
      if (!trimmed) {
        setAlert({ type: "error", msg: "Username cannot be empty." });
        setSaving(false);
        return;
      }

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", trimmed)
        .neq("id", profile.id)
        .maybeSingle();

      if (existing) {
        setAlert({ type: "error", msg: "This username is already taken." });
        setSaving(false);
        return;
      }

      const { data: updated, error } = await supabase
        .from("profiles")
        .update({ username: trimmed })
        .eq("id", profile.id)
        .select()
        .single();

      if (error) throw error;

      // Update cache so next navigation is also instant with new username
      _cachedProfile = updated;
      setProfile(updated);
      setUsername(updated.username);
      setAlert({ type: "success", msg: "Profile updated successfully!" });
    } catch (err) {
      console.error(err);
      setAlert({
        type: "error",
        msg: "Failed to update profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setPassLoading(true);

    try {
      if (!newPass || newPass.length < 6) {
        setAlert({
          type: "error",
          msg: "New password must be at least 6 characters.",
        });
        setPassLoading(false);
        return;
      }
      if (newPass !== confirmPass) {
        setAlert({ type: "error", msg: "Passwords do not match." });
        setPassLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;

      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      setAlert({ type: "success", msg: "Password changed successfully!" });
    } catch (err: any) {
      setAlert({
        type: "error",
        msg: err?.message || "Failed to change password.",
      });
    } finally {
      setPassLoading(false);
    }
  };

  const handleSignOut = async () => {
    clearProfileCache(); // Clear cache so fresh user starts clean
    await signOutUser();
    window.location.href = "/signin";
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="pf-loading">
        <div className="pf-loading-ring" style={{ position: "relative" }}>
          <div className="pf-loading-inner" />
        </div>
        <p className="pf-loading-text">Loading Profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="pf-root">
      <div className="pf-grain" aria-hidden="true" />
      <div className="pf-bg-lines" aria-hidden="true">
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
        {/* ── Aside ── */}
        <aside className="pf-aside">
          <div className="pf-avatar-wrap">
            <div className="pf-avatar-glow" aria-hidden="true" />
            <div className="pf-avatar-ring">
              <div className="pf-avatar">
                <span className="pf-avatar-initials">
                  {getInitials(profile.username)}
                </span>
              </div>
            </div>
          </div>

          <div className="pf-aside-info">
            <p className="pf-aside-eyebrow">
              <span className="pf-ey-line" />
              Member
              <span className="pf-ey-line" />
            </p>
            <h2 className="pf-aside-name">{profile.username}</h2>
            <p className="pf-aside-email">{profile.email}</p>
            <div className="pf-aside-divider" aria-hidden="true" />
          </div>

          <div className="pf-aside-meta">
            <div className="pf-meta-item">
              <span className="pf-meta-label">Status</span>
              <span className="pf-meta-value">
                <span className="pf-dot" />
                <span className="pf-meta-active">Active</span>
              </span>
            </div>
            <div className="pf-meta-item">
              <span className="pf-meta-label">Joined</span>
              <span className="pf-meta-value">
                {formatDate(profile.created_at)}
              </span>
            </div>
            <div className="pf-meta-item">
              <span className="pf-meta-label">Updated</span>
              <span className="pf-meta-value">
                {formatDate(profile.updated_at)}
              </span>
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

        {/* ── Main ── */}
        <main className="pf-main">
          <div className="pf-main-header">
            <p className="pf-main-eyebrow">
              <span className="pf-ey-line" />
              Your Account
            </p>
            <h1 className="pf-main-title">
              My <em>Profile</em>
            </h1>
            <p className="pf-main-sub">
              Manage your personal information and security settings
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
                setAlert(null);
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
              Profile Info
            </button>
            <button
              className={`pf-tab${
                activeTab === "security" ? " pf-tab--active" : ""
              }`}
              onClick={() => {
                setActiveTab("security");
                setAlert(null);
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
              Security
            </button>
          </div>

          {/* Alert */}
          {alert && (
            <div className={`pf-alert pf-alert--${alert.type}`} role="alert">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="14"
                height="14"
              >
                {alert.type === "success" ? (
                  <polyline points="20 6 9 17 4 12" />
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </>
                )}
              </svg>
              {alert.msg}
            </div>
          )}

          {/* ── Profile Info Tab ── */}
          {activeTab === "info" && (
            <form className="pf-form" onSubmit={handleSaveProfile} noValidate>
              <div className="pf-form-grid">
                {/* Username */}
                <div
                  className={`pf-field${
                    focused === "un" ? " pf-field--focused" : ""
                  }${username ? " pf-field--filled" : ""}`}
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
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocused("un")}
                      onBlur={() => setFocused(null)}
                      placeholder="your_username"
                      autoComplete="username"
                    />
                  </div>
                  <div className="pf-field-line" aria-hidden="true" />
                </div>

                {/* Email (read-only) */}
                <div className="pf-field pf-field--filled">
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
                      value={profile.email}
                      readOnly
                      style={{ opacity: 0.7, cursor: "not-allowed" }}
                    />
                  </div>
                  <div className="pf-field-line" aria-hidden="true" />
                </div>

                {/* Member Since (read-only) */}
                <div className="pf-field pf-field--filled">
                  <label className="pf-label">Member Since</label>
                  <div className="pf-input-wrap">
                    <span className="pf-input-icon" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="pf-input"
                      value={formatDate(profile.created_at)}
                      readOnly
                      style={{ opacity: 0.7, cursor: "not-allowed" }}
                    />
                  </div>
                  <div className="pf-field-line" aria-hidden="true" />
                </div>

                {/* User ID (read-only) */}
                <div className="pf-field pf-field--filled">
                  <label className="pf-label">User ID</label>
                  <div className="pf-input-wrap">
                    <span className="pf-input-icon" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="2" y="7" width="20" height="14" rx="2" />
                        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="pf-input"
                      value={profile.id.slice(0, 8) + "••••••••"}
                      readOnly
                      style={{
                        opacity: 0.5,
                        cursor: "not-allowed",
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                      }}
                    />
                  </div>
                  <div className="pf-field-line" aria-hidden="true" />
                </div>
              </div>

              <p className="pf-form-info">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  width="13"
                  height="13"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Email address cannot be changed. Only username is editable.
              </p>

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

          {/* ── Security Tab ── */}
          {activeTab === "security" && (
            <form
              className="pf-form"
              onSubmit={handleChangePassword}
              noValidate
            >
              <div className="pf-form-grid pf-form-grid--single">
                {/* New Password */}
                <div
                  className={`pf-field${
                    focused === "np" ? " pf-field--focused" : ""
                  }${newPass ? " pf-field--filled" : ""}`}
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
                      type={showNew ? "text" : "password"}
                      className="pf-input"
                      placeholder="••••••••"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      onFocus={() => setFocused("np")}
                      onBlur={() => setFocused(null)}
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="pf-eye-btn"
                      onClick={() => setShowNew(!showNew)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        {showNew ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                  <div className="pf-field-line" aria-hidden="true" />
                </div>

                {/* Confirm Password */}
                <div
                  className={`pf-field${
                    focused === "cp" ? " pf-field--focused" : ""
                  }${confirmPass ? " pf-field--filled" : ""}`}
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
                      type={showConfirm ? "text" : "password"}
                      className="pf-input"
                      placeholder="••••••••"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      onFocus={() => setFocused("cp")}
                      onBlur={() => setFocused(null)}
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="pf-eye-btn"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        {showConfirm ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                  <div className="pf-field-line" aria-hidden="true" />
                </div>
              </div>

              <p className="pf-form-info">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  width="13"
                  height="13"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Password must be at least 6 characters long.
              </p>

              <button
                type="submit"
                className="pf-save-btn"
                disabled={passLoading}
              >
                {passLoading ? (
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
        </main>
      </div>
    </div>
  );
}
