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

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        // Use getUser() — most reliable, validates with Supabase server
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (error || !user) {
          // Not logged in
          setIsAuthorized(false);
          window.location.href =
            "/signin?redirectTo=" + encodeURIComponent(pathname);
          return;
        }

        const userEmail = user.email?.trim().toLowerCase() || "";
        const ownerEmail = OWNER_EMAIL.toLowerCase();

        if (userEmail !== ownerEmail) {
          // Logged in but not owner
          setIsAuthorized(false);
          window.location.href = "/";
          return;
        }

        setIsAuthorized(true);
      } catch (err) {
        console.error("Panel auth error:", err);
        if (!isMounted) return;
        setIsAuthorized(false);
        window.location.href =
          "/signin?redirectTo=" + encodeURIComponent(pathname);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Loading state — light background, no black
  if (isAuthorized === null) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #f8f4ed 0%, #fdfaf5 100%)",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "2px solid rgba(184,134,11,0.2)",
            borderTopColor: "#daa520",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p
          style={{
            color: "#8b6914",
            fontFamily: "monospace",
            fontSize: "0.75rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Verifying Access...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <div className="panel-content">{children}</div>;
}
