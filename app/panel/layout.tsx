"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const OWNER_EMAIL = "info@tech4ru.com";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        console.log("🔍 Panel Layout - Starting auth check...");

        // First try to get session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log("🔍 Panel Layout - Session exists?", !!session);
        if (sessionError) {
          console.log("🔍 Panel Layout - Session error:", sessionError.message);
        }

        // If no session, try to get user directly
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        console.log("🔍 Panel Layout - User exists?", !!user);
        if (userError) {
          console.log("🔍 Panel Layout - User error:", userError.message);
        }

        if (!isMounted) return;

        // TEMPORARY - Allow all access for debugging
        console.log("✅ Panel Layout - Debug mode: Allowing access");
        setIsAuthorized(true);
        setChecking(false);
        return;

        // Original check (commented for debugging)
        /*
        if ((!session && !user) || userError) {
          console.log("❌ Panel Layout - No user found");
          setIsAuthorized(false);
          setChecking(false);
          window.location.href = "/signin?redirectTo=" + encodeURIComponent(pathname);
          return;
        }

        const userEmail = user?.email?.trim().toLowerCase() || session?.user?.email?.trim().toLowerCase();
        const ownerEmail = OWNER_EMAIL.toLowerCase();

        console.log("🔍 Panel Layout - User Email:", userEmail);
        console.log("🔍 Panel Layout - Owner Email:", ownerEmail);

        if (!userEmail || userEmail !== ownerEmail) {
          console.log("❌ Panel Layout - User is not owner");
          setIsAuthorized(false);
          setChecking(false);
          window.location.href = "/";
          return;
        }

        console.log("✅ Panel Layout - Authorized:", userEmail);
        setIsAuthorized(true);
        setChecking(false);
        */
      } catch (err) {
        console.error("❌ Panel Layout - Auth check error:", err);
        if (!isMounted) return;
        // TEMPORARY - Allow in debug mode
        setIsAuthorized(true);
        setChecking(false);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  if (checking || isAuthorized === null) {
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
        <p
          style={{
            color: "#daa520",
            fontFamily: "monospace",
            margin: 0,
          }}
        >
          Loading Panel...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="panel-content" style={{ paddingTop: "0px" }}>
      {children}
    </div>
  );
}
