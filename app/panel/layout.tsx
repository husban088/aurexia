"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isOwner } from "@/lib/checkOwner";

const CACHE_KEY = "panel_auth_ok";
const CACHE_TTL = 30 * 60 * 1000;

function getCachedAuth(): boolean {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const { ok, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return false;
    }
    return ok === true;
  } catch {
    return false;
  }
}

function setCachedAuth() {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ok: true, ts: Date.now() }),
    );
  } catch {}
}

function clearCachedAuth() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

function getEmailFromLocalStorage(): string | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        (key.startsWith("sb-") || key.includes("supabase")) &&
        key.endsWith("-auth-token")
      ) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const email =
          parsed?.user?.email || parsed?.currentSession?.user?.email || null;
        if (email) return email;
      }
    }
  } catch {}
  return null;
}

function isAuthorizedSync(): boolean {
  if (typeof window === "undefined") return false;
  if (getCachedAuth()) return true;
  const email = getEmailFromLocalStorage();
  if (email && isOwner(email)) {
    setCachedAuth();
    return true;
  }
  return false;
}

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const bgVerifyDone = useRef(false);

  // ── HYDRATION-SAFE: always start with null (= "not yet checked")
  // Server renders null, client also renders null initially — no mismatch.
  // useEffect immediately resolves this to true/false before first paint.
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Sync check from localStorage/sessionStorage — runs immediately on mount
    const syncAuth = isAuthorizedSync();

    if (syncAuth) {
      setAuthorized(true);
      // Background async verification to confirm session is still valid
      if (!bgVerifyDone.current) {
        bgVerifyDone.current = true;
        supabase.auth
          .getSession()
          .then(({ data: { session } }) => {
            if (!session?.user || !isOwner(session.user.email)) {
              clearCachedAuth();
              setAuthorized(false);
              window.location.replace(
                "/signin?redirectTo=" + encodeURIComponent(pathname),
              );
            } else {
              setCachedAuth();
            }
          })
          .catch(() => {
            // Network error — stay authorized
          });
      }
      return;
    }

    // Not found in localStorage — do async check
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user && isOwner(session.user.email)) {
          setCachedAuth();
          setAuthorized(true);
        } else {
          clearCachedAuth();
          setAuthorized(false);
          window.location.replace(
            "/signin?redirectTo=" + encodeURIComponent(pathname),
          );
        }
      })
      .catch(() => {
        setAuthorized(false);
        window.location.replace(
          "/signin?redirectTo=" + encodeURIComponent(pathname),
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // BFCache — browser back/forward button
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (!e.persisted) return;
      if (isAuthorizedSync()) {
        setAuthorized(true);
      } else {
        window.location.replace(
          "/signin?redirectTo=" + encodeURIComponent(pathname),
        );
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [pathname]);

  // null = still checking — render nothing (same on server and client)
  if (authorized === null) return null;

  // Authorized — show children
  if (authorized) {
    return (
      <div className="panel-content" style={{ paddingTop: "0px" }}>
        {children}
      </div>
    );
  }

  // Not authorized — redirect is happening, render nothing
  return null;
}
