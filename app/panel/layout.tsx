"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isOwner } from "@/lib/checkOwner";

const CACHE_KEY = "panel_auth_ok";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

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

function setCachedAuth(ok: boolean) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ok, ts: Date.now() }));
  } catch {}
}

function clearCachedAuth() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ✅ KEY INSIGHT:
  // Agar cache hai → seedha children show karo (NO loading screen)
  // Background mein quietly session verify karo
  // Agar session invalid nikli → tab redirect karo
  // Agar cache nahi → tab loading show karo (sirf pehli dafa)

  const [showContent, setShowContent] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const cached = getCachedAuth();

    if (cached) {
      // ✅ Cache hai — FORAN content show karo, loading nahi
      setShowContent(true);

      // ✅ Background mein quietly verify karo (user ko pata nahi chalega)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user || !isOwner(session.user.email)) {
          // Session expire ho gayi — silently redirect
          clearCachedAuth();
          window.location.replace(
            "/signin?redirectTo=" + encodeURIComponent(pathname)
          );
        } else {
          // Session valid — cache refresh karo
          setCachedAuth(true);
        }
      });

      return;
    }

    // ✅ Cache nahi — loading show karo aur check karo
    setShowLoading(true);

    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && isOwner(session.user.email)) {
          setCachedAuth(true);
          setShowLoading(false);
          setShowContent(true);
          return;
        }

        // getSession failed — try getUser
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!error && user && isOwner(user.email)) {
          setCachedAuth(true);
          setShowLoading(false);
          setShowContent(true);
          return;
        }

        // Not authenticated
        clearCachedAuth();
        window.location.replace(
          "/signin?redirectTo=" + encodeURIComponent(pathname)
        );
      } catch {
        // Network error — try one more time
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user && isOwner(session.user.email)) {
            setCachedAuth(true);
            setShowLoading(false);
            setShowContent(true);
            return;
          }
        } catch {}

        window.location.replace(
          "/signin?redirectTo=" + encodeURIComponent(pathname)
        );
      }
    }

    checkAuth();
  }, []);

  if (showContent) {
    return (
      <div className="panel-content" style={{ paddingTop: "0px" }}>
        {children}
      </div>
    );
  }

  if (showLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#0a0a0a",
          gap: "1rem",
        }}
      >
        <div className="ap-spinner" style={{ width: "40px", height: "40px" }} />
        <p style={{ color: "#daa520", fontFamily: "monospace", margin: 0 }}>
          Verifying Access...
        </p>
      </div>
    );
  }

  // ✅ Na loading na content — blank screen (milliseconds ke liye)
  // Isse flicker avoid hogi
  return <div style={{ background: "#0a0a0a", minHeight: "100vh" }} />;
}
