"use client";

import { useEffect, useState, useCallback } from "react";
import { getSalePercent } from "@/lib/saleStore";

export default function SaleBannerPopup() {
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState<number | null>(null);

  useEffect(() => {
    const activePercent = getSalePercent();
    if (!activePercent) return;

    setPercent(activePercent);

    const timer = setTimeout(() => {
      setVisible(true);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  if (!percent) return null;

  const imageSrc = `/sale-banner-${percent}.png`;

  return (
    <>
      {/* ── Styles ── */}
      <style>{`
        .sb-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.80);
          backdrop-filter: blur(5px);
          z-index: 9998;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .sb-overlay.sb-visible {
          opacity: 1;
          pointer-events: auto;
        }

        .sb-popup {
          position: fixed;
          top: 50%;
          left: 50%;
          z-index: 9999;
          transform: translate(-50%, -50%) scale(0.88);
          opacity: 0;
          transition: opacity 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                      transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          pointer-events: none;

          /* Responsive width — never overflow viewport */
          width: min(92vw, 680px);

          /* Let height follow image naturally */
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.88),
                      0 0 0 1px rgba(218, 165, 32, 0.18);
        }
        .sb-popup.sb-visible {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
          pointer-events: auto;
        }

        /* Image fills the popup completely — no cropping, no stretching */
        .sb-img {
          display: block;
          width: 100%;
          height: auto;        /* height follows image's natural ratio */
          max-height: 90vh;    /* never taller than viewport */
          object-fit: contain; /* show full image, no crop */
          border-radius: 14px;
          background: #0a0a0a; /* dark fill while loading */
        }

        /* Close button */
        .sb-close {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10000;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #fff;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          backdrop-filter: blur(6px);
          transition: background 0.2s ease, transform 0.15s ease;
          padding: 0;
        }
        .sb-close:hover {
          background: rgba(218, 165, 32, 0.75);
          transform: scale(1.08);
        }

        /* Mobile: even narrower screens */
        @media (max-width: 480px) {
          .sb-popup {
            width: 96vw;
            border-radius: 10px;
          }
          .sb-img {
            border-radius: 10px;
          }
        }

        /* Very tall images on small phones — cap height */
        @media (max-height: 600px) {
          .sb-img {
            max-height: 80vh;
            object-fit: contain;
          }
        }
      `}</style>

      {/* Backdrop — click bahar pe close karo */}
      <div
        className={`sb-overlay${visible ? " sb-visible" : ""}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Popup — andar click pe close nahi hoga */}
      <div
        className={`sb-popup${visible ? " sb-visible" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${percent}% Sale Banner`}
      >
        {/* Close Button */}
        <button
          className="sb-close"
          onClick={handleClose}
          aria-label="Close banner"
        >
          ✕
        </button>

        {/* 
          Image — object-fit: contain ensures:
          ✅ Full image always visible
          ✅ No cropping
          ✅ No stretching
          ✅ Responsive on all screen sizes
          ✅ Height auto-adjusts to image ratio
        */}
        <img
          src={imageSrc}
          alt={`${percent}% Sale`}
          className="sb-img"
          draggable={false}
        />
      </div>
    </>
  );
}
