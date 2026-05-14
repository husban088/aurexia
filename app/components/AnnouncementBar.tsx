// app/components/AnnouncementBar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import "./AnnouncementBar.css";

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const messages = [
    {
      icon: "🚚",
      text: "FREE SHIPPING WORLDWIDE",
      subtext: "",
    },
    {
      icon: "⚡",
      text: "HURRY UP! LIMITED TIME OFFER",
      subtext: "",
    },
    {
      icon: "✨",
      text: "LUXURY IN EVERY DETAIL",
      subtext: "Premium quality guaranteed",
    },
  ];

  // ── Rotate messages every 5s ──────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [messages.length]);

  // ── Scroll logic:
  //    - At very top (scrollY <= 10) → always show
  //    - Scrolling DOWN → hide announcement bar
  //    - Scrolling UP → show announcement bar again
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;

        if (currentY <= 10) {
          // At top — always show
          setVisible(true);
        } else if (currentY > lastScrollY.current) {
          // Scrolling DOWN — hide announcement
          setVisible(false);
        } else {
          // Scrolling UP — show announcement
          setVisible(true);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentMessage = messages[currentIndex];

  return (
    <div
      className={`announcement-bar${visible ? " announcement-visible" : " announcement-hidden"}`}
      aria-hidden={!visible}
    >
      <div className="announcement-container">
        <div className="announcement-content">
          <span className="announcement-icon">{currentMessage.icon}</span>
          <div className="announcement-text-wrapper">
            <span className="announcement-text">{currentMessage.text}</span>
            {currentMessage.subtext && (
              <span className="announcement-subtext">
                {currentMessage.subtext}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
