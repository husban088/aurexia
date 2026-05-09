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

// ✅ Module-level flag — survives route changes within same session
let memoryAuthOk: boolean | null = null;

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ✅ Use state instead of just reading from memory/cache
  // This ensures React re-renders when auth resolves
  const [authState, setAuthState] = useState<"loading" | "ok" | "denied">(
    () => {
      // Synchronous check on first render
      if (memoryAuthOk === true) return "ok";
      if (typeof window !== "undefined" && getCachedAuth()) return "ok";
      return "loading";
    },
  );

  useEffect(() => {
    // If already confirmed via memory or cache, do a silent background verify
    if (authState === "ok") {
      memoryAuthOk = true;
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user || !isOwner(session.user.email)) {
          memoryAuthOk = false;
          clearCachedAuth();
          setAuthState("denied");
          window.location.replace(
            "/signin?redirectTo=" + encodeURIComponent(pathname),
          );
        } else {
          setCachedAuth(true);
        }
      });
      return;
    }

    // Not yet authenticated — do full check
    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && isOwner(session.user.email)) {
          memoryAuthOk = true;
          setCachedAuth(true);
          setAuthState("ok");
          return;
        }

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!error && user && isOwner(user.email)) {
          memoryAuthOk = true;
          setCachedAuth(true);
          setAuthState("ok");
          return;
        }

        // Not authorized
        clearCachedAuth();
        memoryAuthOk = false;
        setAuthState("denied");
        window.location.replace(
          "/signin?redirectTo=" + encodeURIComponent(pathname),
        );
      } catch {
        window.location.replace(
          "/signin?redirectTo=" + encodeURIComponent(pathname),
        );
      }
    }

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Auth confirmed — render children immediately, no flicker
  if (authState === "ok") {
    return (
      <div className="panel-content" style={{ paddingTop: "0px" }}>
        {children}
      </div>
    );
  }

  // ✅ Show loading only on first visit (no cache/memory)
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
