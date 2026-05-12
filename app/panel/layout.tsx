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
  const bgVerifyDone = useRef(false);

  // Synchronous init: agar sessionStorage cache hai → instant "ok", warna "loading"
  const [authState, setAuthState] = useState<"loading" | "ok" | "denied">(
    () => {
      if (typeof window === "undefined") return "loading";
      return getCachedAuth() ? "ok" : "loading";
    },
  );

  // BFCache fix: back/forward button pe Chrome page ko freeze se restore karta hai
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        if (getCachedAuth()) {
          setAuthState("ok");
        } else {
          window.location.replace(
            "/signin?redirectTo=" + encodeURIComponent(pathname),
          );
        }
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [pathname]);

  useEffect(() => {
    // ── Case 1: Cache valid → panel dikhao, background mein quietly verify ──
    if (authState === "ok") {
      if (!bgVerifyDone.current) {
        bgVerifyDone.current = true;
        // Background verify — agar session expired ho toh kick out karo
        supabase.auth
          .getSession()
          .then(({ data: { session } }) => {
            if (!session?.user || !isOwner(session.user.email)) {
              clearCachedAuth();
              setAuthState("denied");
              window.location.replace(
                "/signin?redirectTo=" + encodeURIComponent(pathname),
              );
            } else {
              setCachedAuth(true); // timestamp refresh
            }
          })
          .catch(() => {
            // Network error / offline → cache valid hai, panel mein rehne do
          });
      }
      return;
    }

    // ── Case 2: No cache → fresh visit, auth check ──
    if (authState !== "loading") return;

    async function checkAuth() {
      // Step 1: getSession() — localStorage se padhta hai, fast + offline-safe
      let session: any = null;
      try {
        const result = await supabase.auth.getSession();
        session = result.data.session;
      } catch {
        // ignore
      }

      if (session?.user && isOwner(session.user.email)) {
        setCachedAuth(true);
        setAuthState("ok");
        return;
      }

      // Step 2: Session null tha — getUser() se server pe verify karo
      // Yeh network call hai, zyada time le sakta hai
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (!error && user && isOwner(user.email)) {
          setCachedAuth(true);
          setAuthState("ok");
          return;
        }

        // getUser returned but user nahi / authorized nahi
        clearCachedAuth();
        setAuthState("denied");
        window.location.replace(
          "/signin?redirectTo=" + encodeURIComponent(pathname),
        );
      } catch {
        // getUser bhi fail hua (network down, server unreachable)
        // ─── KEY FIX: Redirect mat karo — user ko stuck mat karo ───
        // Agar session bhi null tha AUR getUser bhi fail — toh signin
        clearCachedAuth();
        setAuthState("denied");
        window.location.replace(
          "/signin?redirectTo=" + encodeURIComponent(pathname),
        );
      }
    }

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState]);

  // Auth ok → children render karo
  if (authState === "ok") {
    return (
      <div className="panel-content" style={{ paddingTop: "0px" }}>
        {children}
      </div>
    );
  }

  // Loading screen — sirf first visit pe jab koi cache na ho
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
