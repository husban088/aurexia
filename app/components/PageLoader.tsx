"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import "./PageLoader.css";

export default function PageLoader() {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Show loader only on home page and page reloads
    const isHomePage = pathname === "/";

    // Check if this is a page reload (not navigation)
    const isReload =
      performance.getEntriesByType("navigation")[0]?.type === "reload";

    // Show loader only on home page reloads
    if (isHomePage && isReload) {
      setLoading(true);

      // Hide loader after page is fully loaded
      const timer = setTimeout(() => {
        setLoading(false);
      }, 800);

      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="page-loader">
      <div className="loader-backdrop" />

      {/* Grain Texture */}
      <div className="loader-grain" />

      {/* Gold Ambient Glow */}
      <div className="loader-ambient" />

      {/* Main Loader Container */}
      <div className="loader-container">
        {/* Rotating Rings */}
        <div className="loader-rings">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
          <div className="ring ring-4" />
        </div>

        {/* Logo Text */}
        <div className="loader-logo">
          <span className="logo-techs">TECH</span>
          <span className="logo-fours">4U</span>
          <div className="logo-luxury-line">
            <span className="luxury-line" />
          </div>
        </div>

        {/* Loading Bar */}
        <div className="loader-bar-wrapper">
          <div className="loader-bar" />
        </div>

        {/* Loading Percentage */}
        <div className="loader-percentage">
          <span className="percent-number">0</span>
          <span className="percent-sign">%</span>
        </div>

        {/* Loading Text */}
        <p className="loader-text">Loading Experience</p>
      </div>

      {/* Decorative Corners */}
      <div className="loader-corner corner-tl" />
      <div className="loader-corner corner-tr" />
      <div className="loader-corner corner-bl" />
      <div className="loader-corner corner-br" />
    </div>
  );
}
