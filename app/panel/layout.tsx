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

  // ─── Synchronous check — agar sessionStorage mein cache hai toh instant "ok" ──
  const [authState, setAuthState] = useState<"loading" | "ok" | "denied">(
    () => {
      if (typeof window === "undefined") return "loading";
      return getCachedAuth() ? "ok" : "loading";
    },
  );

  // ── BFCache Fix: Chrome back/forward arrow ────────────────────────────────
  // pageshow tab bhi fire hota hai jab Chrome BFCache se page restore kare
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        // BFCache se restore hua — state stale ho sakti hai, cache se re-check karo
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
    // ── Case 1: Cache valid — seedha ok, background mein quietly verify ────────
    if (authState === "ok") {
      if (!bgVerifyDone.current) {
        bgVerifyDone.current = true;

        Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 5000),
          ),
        ])
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
            // Wifi off ya timeout — cache valid hai, panel mein rehne do
            // Kick out mat karo
          });
      }
      return;
    }

    // ── Case 2: No cache — fresh visit, full auth check ───────────────────────
    if (authState !== "loading") return;

    async function checkAuth() {
      try {
        // getSession local storage se padhta hai — fast, mostly offline bhi kaam kare
        const {
          data: { session },
        } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 5000),
          ),
        ]);

        if (session?.user && isOwner(session.user.email)) {
          setCachedAuth(true);
          setAuthState("ok");
          return;
        }

        // Session nahi mila — server se verify karo
        try {
          const {
            data: { user },
            error,
          } = await Promise.race([
            supabase.auth.getUser(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), 5000),
            ),
          ]);

          if (!error && user && isOwner(user.email)) {
            setCachedAuth(true);
            setAuthState("ok");
            return;
          }
        } catch {
          // getUser timeout — niche redirect
        }

        // Authorized nahi — signin
        clearCachedAuth();
        setAuthState("denied");
        window.location.replace(
          "/signin?redirectTo=" + encodeURIComponent(pathname),
        );
      } catch {
        // getSession timeout (wifi off, fresh visit) — signin pe bhejo
        window.location.replace(
          "/signin?redirectTo=" + encodeURIComponent(pathname),
        );
      }
    }

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState]);

  // ── Auth ok — seedha render, zero flicker ────────────────────────────────
  if (authState === "ok") {
    return (
      <div className="panel-content" style={{ paddingTop: "0px" }}>
        {children}
      </div>
    );
  }

  // ── Loading — sirf tab dikhega jab pehli baar aao aur koi cache na ho ─────
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
