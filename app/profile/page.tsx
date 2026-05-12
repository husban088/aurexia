"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { signOutUser } from "@/lib/auth";
import { useLanguage } from "@/app/context/LanguageContext";
import "./profile.css";

type ProfileData = {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
};

const profileTranslations = {
  // Aside
  member: { en: "Member", ar: "عضو", de: "Mitglied" },
  status: { en: "Status", ar: "الحالة", de: "Status" },
  active: { en: "Active", ar: "نشط", de: "Aktiv" },
  joined: { en: "Joined", ar: "انضم", de: "Beigetreten" },
  updated: { en: "Updated", ar: "تم التحديث", de: "Aktualisiert" },
  signOut: { en: "Sign Out", ar: "تسجيل الخروج", de: "Abmelden" },

  // Main Header
  yourAccount: { en: "Your Account", ar: "حسابك", de: "Ihr Konto" },
  myProfile: { en: "My", ar: "ملفي", de: "Mein" },
  profileEm: { en: "Profile", ar: "الشخصي", de: "Profil" },
  manageInfo: {
    en: "Manage your personal information and security settings",
    ar: "إدارة معلوماتك الشخصية وإعدادات الأمان",
    de: "Verwalten Sie Ihre persönlichen Daten und Sicherheitseinstellungen",
  },

  // Tabs
  profileInfo: {
    en: "Profile Info",
    ar: "معلومات الملف",
    de: "Profilinformationen",
  },
  security: { en: "Security", ar: "الأمان", de: "Sicherheit" },

  // Form Labels
  username: { en: "Username", ar: "اسم المستخدم", de: "Benutzername" },
  usernamePlaceholder: {
    en: "your_username",
    ar: "اسم_المستخدم",
    de: "ihr_benutzername",
  },
  emailAddress: {
    en: "Email Address",
    ar: "البريد الإلكتروني",
    de: "E-Mail-Adresse",
  },
  memberSince: { en: "Member Since", ar: "عضو منذ", de: "Mitglied seit" },
  userId: { en: "User ID", ar: "معرف المستخدم", de: "Benutzer-ID" },

  // Password
  newPassword: {
    en: "New Password",
    ar: "كلمة المرور الجديدة",
    de: "Neues Passwort",
  },
  confirmPassword: {
    en: "Confirm New Password",
    ar: "تأكيد كلمة المرور الجديدة",
    de: "Neues Passwort bestätigen",
  },
  passwordPlaceholder: { en: "••••••••", ar: "••••••••", de: "••••••••" },

  // Buttons
  saveChanges: {
    en: "Save Changes",
    ar: "حفظ التغييرات",
    de: "Änderungen speichern",
  },
  updatePassword: {
    en: "Update Password",
    ar: "تحديث كلمة المرور",
    de: "Passwort aktualisieren",
  },

  // Info texts
  emailNote: {
    en: "Email address cannot be changed. Only username is editable.",
    ar: "لا يمكن تغيير عنوان البريد الإلكتروني. فقط اسم المستخدم قابل للتعديل.",
    de: "E-Mail-Adresse kann nicht geändert werden. Nur der Benutzername ist bearbeitbar.",
  },
  passwordNote: {
    en: "Password must be at least 6 characters long.",
    ar: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
    de: "Das Passwort muss mindestens 6 Zeichen lang sein.",
  },

  // Alerts
  usernameEmpty: {
    en: "Username cannot be empty.",
    ar: "اسم المستخدم لا يمكن أن يكون فارغًا.",
    de: "Benutzername darf nicht leer sein.",
  },
  usernameTaken: {
    en: "This username is already taken.",
    ar: "اسم المستخدم هذا مستخدم بالفعل.",
    de: "Dieser Benutzername ist bereits vergeben.",
  },
  updateSuccess: {
    en: "Profile updated successfully!",
    ar: "تم تحديث الملف الشخصي بنجاح!",
    de: "Profil erfolgreich aktualisiert!",
  },
  updateFailed: {
    en: "Failed to update profile. Please try again.",
    ar: "فشل تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.",
    de: "Profilaktualisierung fehlgeschlagen. Bitte versuchen Sie es erneut.",
  },
  passwordShort: {
    en: "New password must be at least 6 characters.",
    ar: "يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل.",
    de: "Das neue Passwort muss mindestens 6 Zeichen lang sein.",
  },
  passwordMismatch: {
    en: "Passwords do not match.",
    ar: "كلمات المرور غير متطابقة.",
    de: "Passwörter stimmen nicht überein.",
  },
  passwordChangeSuccess: {
    en: "Password changed successfully!",
    ar: "تم تغيير كلمة المرور بنجاح!",
    de: "Passwort erfolgreich geändert!",
  },
  passwordChangeFailed: {
    en: "Failed to change password.",
    ar: "فشل تغيير كلمة المرور.",
    de: "Passwortänderung fehlgeschlagen.",
  },
};

const getProfileTranslation = (
  key: keyof typeof profileTranslations,
  lang: "en" | "ar" | "de",
): string => {
  return (
    profileTranslations[key]?.[lang] || profileTranslations[key]?.en || key
  );
};

// ─── MODULE-LEVEL CACHE ───────────────────────────────────────────────────────
let _cachedProfile: ProfileData | null = null;
let _fetchPromise: Promise<ProfileData | null> | null = null;

const PF_LOCAL_KEY = "pf_profile_cache_v1";

function saveProfileToStorage(data: ProfileData) {
  try {
    localStorage.setItem(
      PF_LOCAL_KEY,
      JSON.stringify({ data, ts: Date.now() }),
    );
  } catch (_) {}
}

function loadProfileFromStorage(): ProfileData | null {
  if (_cachedProfile) return _cachedProfile;
  try {
    const raw = localStorage.getItem(PF_LOCAL_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (entry?.data && Date.now() - (entry.ts || 0) < 3600000) {
      _cachedProfile = entry.data;
      return entry.data;
    }
  } catch (_) {}
  return null;
}

if (typeof window !== "undefined") {
  loadProfileFromStorage();
}

async function getProfile(): Promise<ProfileData | null> {
  if (_cachedProfile) return _cachedProfile;

  const fromStorage = loadProfileFromStorage();
  if (fromStorage) return fromStorage;

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

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
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
        saveProfileToStorage(result);
        _fetchPromise = null;
        return result;
      }

      _cachedProfile = profileData;
      saveProfileToStorage(profileData);
      _fetchPromise = null;
      return profileData;
    } catch {
      _fetchPromise = null;
      return null;
    }
  })();

  return _fetchPromise;
}

function clearProfileCache() {
  _cachedProfile = null;
  _fetchPromise = null;
  try {
    localStorage.removeItem(PF_LOCAL_KEY);
  } catch (_) {}
}

export default function ProfilePage() {
  const router = useRouter();
  const { language, isRTLMode } = useLanguage();
  const lang = language;

  const [profile, setProfile] = useState<ProfileData | null>(
    () => _cachedProfile ?? loadProfileFromStorage(),
  );
  const [loading, setLoading] = useState(
    () => !(_cachedProfile ?? loadProfileFromStorage()),
  );
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");

  const [username, setUsername] = useState(
    () => (_cachedProfile ?? loadProfileFromStorage())?.username ?? "",
  );
  const [focused, setFocused] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const applyProfile = useCallback((data: ProfileData) => {
    setProfile(data);
    setUsername(data.username);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    const instant = _cachedProfile ?? loadProfileFromStorage();
    if (instant) applyProfile(instant);

    getProfile().then((result) => {
      if (!active) return;
      if (!result) {
        if (!instant) router.replace("/signin?redirectTo=/profile");
        return;
      }
      applyProfile(result);
    });

    const handlePageShow = (_e: PageTransitionEvent) => {
      const cached = _cachedProfile ?? loadProfileFromStorage();
      if (cached) applyProfile(cached);
    };

    const handlePopState = () => {
      const cached = _cachedProfile ?? loadProfileFromStorage();
      if (cached) applyProfile(cached);
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);

    return () => {
      active = false;
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router, applyProfile]);

  const getInitials = (name: string) =>
    name?.slice(0, 2)?.toUpperCase() || "??";

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(
        lang === "ar" ? "ar-AE" : lang === "de" ? "de-DE" : "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      );
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
        setAlert({
          type: "error",
          msg: getProfileTranslation("usernameEmpty", lang),
        });
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
        setAlert({
          type: "error",
          msg: getProfileTranslation("usernameTaken", lang),
        });
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

      _cachedProfile = updated;
      saveProfileToStorage(updated);
      setProfile(updated);
      setUsername(updated.username);
      setAlert({
        type: "success",
        msg: getProfileTranslation("updateSuccess", lang),
      });
    } catch (err) {
      setAlert({
        type: "error",
        msg: getProfileTranslation("updateFailed", lang),
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
          msg: getProfileTranslation("passwordShort", lang),
        });
        setPassLoading(false);
        return;
      }
      if (newPass !== confirmPass) {
        setAlert({
          type: "error",
          msg: getProfileTranslation("passwordMismatch", lang),
        });
        setPassLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;

      setNewPass("");
      setConfirmPass("");
      setAlert({
        type: "success",
        msg: getProfileTranslation("passwordChangeSuccess", lang),
      });
    } catch (err: any) {
      setAlert({
        type: "error",
        msg:
          err?.message || getProfileTranslation("passwordChangeFailed", lang),
      });
    } finally {
      setPassLoading(false);
    }
  };

  const handleSignOut = async () => {
    clearProfileCache();
    await signOutUser();
    window.location.href = "/signin";
  };

  if (loading) {
    return (
      <div className="pf-loading" dir={isRTLMode ? "rtl" : "ltr"}>
        <div className="pf-loading-ring">
          <div className="pf-loading-inner" />
        </div>
        <p className="pf-loading-text">Loading Profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="pf-root" dir={isRTLMode ? "rtl" : "ltr"}>
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
              {getProfileTranslation("member", lang)}
              <span className="pf-ey-line" />
            </p>
            <h2 className="pf-aside-name">{profile.username}</h2>
            <p className="pf-aside-email">{profile.email}</p>
            <div className="pf-aside-divider" aria-hidden="true" />
          </div>
          <div className="pf-aside-meta">
            <div className="pf-meta-item">
              <span className="pf-meta-label">
                {getProfileTranslation("status", lang)}
              </span>
              <span className="pf-meta-value">
                <span className="pf-dot" />
                <span className="pf-meta-active">
                  {getProfileTranslation("active", lang)}
                </span>
              </span>
            </div>
            <div className="pf-meta-item">
              <span className="pf-meta-label">
                {getProfileTranslation("joined", lang)}
              </span>
              <span className="pf-meta-value">
                {formatDate(profile.created_at)}
              </span>
            </div>
            <div className="pf-meta-item">
              <span className="pf-meta-label">
                {getProfileTranslation("updated", lang)}
              </span>
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
            {getProfileTranslation("signOut", lang)}
          </button>
        </aside>

        <main className="pf-main">
          <div className="pf-main-header">
            <p className="pf-main-eyebrow">
              <span className="pf-ey-line" />
              {getProfileTranslation("yourAccount", lang)}
            </p>
            <h1 className="pf-main-title">
              {getProfileTranslation("myProfile", lang)}{" "}
              <em>{getProfileTranslation("profileEm", lang)}</em>
            </h1>
            <p className="pf-main-sub">
              {getProfileTranslation("manageInfo", lang)}
            </p>
          </div>

          <div className="pf-tabs">
            <button
              className={`pf-tab${activeTab === "info" ? " pf-tab--active" : ""}`}
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
              {getProfileTranslation("profileInfo", lang)}
            </button>
            <button
              className={`pf-tab${activeTab === "security" ? " pf-tab--active" : ""}`}
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
              {getProfileTranslation("security", lang)}
            </button>
          </div>

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

          {activeTab === "info" && (
            <form className="pf-form" onSubmit={handleSaveProfile} noValidate>
              <div className="pf-form-grid">
                <div
                  className={`pf-field${focused === "un" ? " pf-field--focused" : ""}${username ? " pf-field--filled" : ""}`}
                >
                  <label className="pf-label" htmlFor="pf-username">
                    {getProfileTranslation("username", lang)}
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
                      placeholder={getProfileTranslation(
                        "usernamePlaceholder",
                        lang,
                      )}
                      autoComplete="username"
                    />
                  </div>
                  <div className="pf-field-line" aria-hidden="true" />
                </div>

                <div className="pf-field pf-field--filled">
                  <label className="pf-label" htmlFor="pf-email">
                    {getProfileTranslation("emailAddress", lang)}
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

                <div className="pf-field pf-field--filled">
                  <label className="pf-label">
                    {getProfileTranslation("memberSince", lang)}
                  </label>
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

                <div className="pf-field pf-field--filled">
                  <label className="pf-label">
                    {getProfileTranslation("userId", lang)}
                  </label>
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
                {getProfileTranslation("emailNote", lang)}
              </p>

              <button type="submit" className="pf-save-btn" disabled={saving}>
                {saving ? (
                  <span className="pf-spinner" />
                ) : (
                  <>
                    <span>{getProfileTranslation("saveChanges", lang)}</span>
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

          {activeTab === "security" && (
            <form
              className="pf-form"
              onSubmit={handleChangePassword}
              noValidate
            >
              <div className="pf-form-grid pf-form-grid--single">
                <div
                  className={`pf-field${focused === "np" ? " pf-field--focused" : ""}${newPass ? " pf-field--filled" : ""}`}
                >
                  <label className="pf-label" htmlFor="pf-new-pass">
                    {getProfileTranslation("newPassword", lang)}
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
                      placeholder={getProfileTranslation(
                        "passwordPlaceholder",
                        lang,
                      )}
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

                <div
                  className={`pf-field${focused === "cp" ? " pf-field--focused" : ""}${confirmPass ? " pf-field--filled" : ""}`}
                >
                  <label className="pf-label" htmlFor="pf-confirm-pass">
                    {getProfileTranslation("confirmPassword", lang)}
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
                      placeholder={getProfileTranslation(
                        "passwordPlaceholder",
                        lang,
                      )}
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
                {getProfileTranslation("passwordNote", lang)}
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
                    <span>{getProfileTranslation("updatePassword", lang)}</span>
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
