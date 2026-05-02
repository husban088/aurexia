"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isOwner } from "@/lib/checkOwner";

// ✅ Module-level cache — page navigate karne pe reset nahi hoga
let authCache: {
  authorized: boolean;
  checked: boolean;
} = { authorized: false, checked: false };

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ✅ Agar already check ho chuka hai toh seedha state set karo — no loading
  const [isAuthorized, setIsAuthorized] = useState<boolean>(
    authCache.checked ? authCache.authorized : false
  );
  const [checking, setChecking] = useState<boolean>(!authCache.checked);
  const checkingRef = useRef(false);

  useEffect(() => {
    // ✅ Already cached — kuch nahi karna
    if (authCache.checked) {
      setIsAuthorized(authCache.authorized);
      setChecking(false);
      if (!authCache.authorized) {
        window.location.replace(
          "/signin?redirectTo=" + encodeURIComponent(pathname)
        );
      }
      return;
    }

    // ✅ Prevent double-call
    if (checkingRef.current) return;
    checkingRef.current = true;

    async function checkAuth() {
      try {
        // ✅ getUser() is the most reliable — verifies with Supabase server
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          // Try getSession as fallback
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.user) {
            authCache = { authorized: false, checked: true };
            setIsAuthorized(false);
            setChecking(false);
            window.location.replace(
              "/signin?redirectTo=" + encodeURIComponent(pathname)
            );
            return;
          }

          // Session found via fallback
          const authorized = isOwner(session.user.email);
          authCache = { authorized, checked: true };
          setIsAuthorized(authorized);
          setChecking(false);
          if (!authorized) window.location.replace("/");
          return;
        }

        const authorized = isOwner(user.email);
        authCache = { authorized, checked: true };
        setIsAuthorized(authorized);
        setChecking(false);

        if (!authorized) window.location.replace("/");
      } catch (err) {
        console.error("Panel auth error:", err);
        // On error, try session fallback before giving up
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user && isOwner(session.user.email)) {
            authCache = { authorized: true, checked: true };
            setIsAuthorized(true);
            setChecking(false);
            return;
          }
        } catch {}
        authCache = { authorized: false, checked: true };
        setIsAuthorized(false);
        setChecking(false);
        window.location.replace(
          "/signin?redirectTo=" + encodeURIComponent(pathname)
        );
      }
    }

    checkAuth();
  }, []); // ✅ Sirf mount pe — route changes pe repeat nahi

  // ✅ Authorized — seedha content, zero delay
  if (!checking && isAuthorized) {
    return (
      <div className="panel-content" style={{ paddingTop: "0px" }}>
        {children}
      </div>
    );
  }

  // ✅ Loading — sirf pehli dafa
  if (checking) {
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

  return null;
}
