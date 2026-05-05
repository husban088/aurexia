"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import "./ProductGallery.css";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const [activeImg, setActiveImg] = useState(0);
  const [imgEntering, setImgEntering] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [lbClosing, setLbClosing] = useState(false);
  const [lbZoom, setLbZoom] = useState(1);
  const [lbPan, setLbPan] = useState({ x: 0, y: 0 });
  const [lbDragging, setLbDragging] = useState(false);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const [zoomIndicatorVal, setZoomIndicatorVal] = useState(1);

  // ── Swipe refs ─────────────────────────────────────────────
  const mainSwipeStart = useRef<{ x: number; y: number } | null>(null);
  const mainIsDragging = useRef(false);

  // Lightbox drag
  const lbDragStart = useRef<{
    x: number;
    y: number;
    px: number;
    py: number;
  } | null>(null);
  const lbTouchStart = useRef<{
    x: number;
    y: number;
    px: number;
    py: number;
  } | null>(null);

  // Lightbox swipe (when not zoomed)
  const lbSwipeStart = useRef<{ x: number; y: number } | null>(null);

  // Pinch-to-zoom
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(1);

  // Zoom indicator timer
  const zoomIndicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // DOM refs
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lbStageRef = useRef<HTMLDivElement>(null);
  const lbImgContainerRef = useRef<HTMLDivElement>(null);
  const mainImgRef = useRef<HTMLImageElement>(null);

  // ── Image switch ────────────────────────────────────────────
  function switchImg(idx: number) {
    if (idx === activeImg) return;
    setImgEntering(true);
    setTimeout(() => {
      setActiveImg(idx);
      setImgEntering(false);
    }, 75);
  }

  // ── Show zoom indicator briefly ─────────────────────────────
  const flashZoomIndicator = useCallback((zoom: number) => {
    if (zoomIndicatorTimer.current) clearTimeout(zoomIndicatorTimer.current);
    setZoomIndicatorVal(zoom);
    setShowZoomIndicator(true);
    zoomIndicatorTimer.current = setTimeout(
      () => setShowZoomIndicator(false),
      900
    );
  }, []);

  // ── Smooth lightbox close ───────────────────────────────────
  const closeLightbox = useCallback(() => {
    setLbClosing(true);
    setTimeout(() => {
      setLightbox(false);
      setLbClosing(false);
      setLbZoom(1);
      setLbPan({ x: 0, y: 0 });
      setLbDragging(false);
      setShowZoomIndicator(false);
      lbDragStart.current = null;
      lbTouchStart.current = null;
      lbSwipeStart.current = null;
      pinchStartDist.current = null;
      document.body.style.overflow = "";
    }, 310);
  }, []);

  // ── Constrained pan — image cannot escape stage ─────────────
  const getConstrainedPan = useCallback(
    (newPan: { x: number; y: number }, zoom: number) => {
      if (!lbStageRef.current || !lbImgContainerRef.current) return newPan;
      const stage = lbStageRef.current.getBoundingClientRect();
      const imgEl = lbImgContainerRef.current.querySelector(
        "img"
      ) as HTMLImageElement;
      if (!imgEl) return newPan;

      const imgW = imgEl.offsetWidth;
      const imgH = imgEl.offsetHeight;

      // How much image overflows stage when zoomed
      const overflowX = Math.max(0, imgW * zoom - stage.width);
      const overflowY = Math.max(0, imgH * zoom - stage.height);

      const maxX = overflowX / 2;
      const maxY = overflowY / 2;

      return {
        x: Math.min(maxX, Math.max(-maxX, newPan.x)),
        y: Math.min(maxY, Math.max(-maxY, newPan.y)),
      };
    },
    []
  );

  // ══════════════════════════════════════════════════════════
  //  MAIN GALLERY — mouse/touch swipe to switch images
  // ══════════════════════════════════════════════════════════

  const handleMainMouseDown = (e: React.MouseEvent) => {
    mainSwipeStart.current = { x: e.clientX, y: e.clientY };
    mainIsDragging.current = false;
  };

  const handleMainMouseMove = (e: React.MouseEvent) => {
    if (!mainSwipeStart.current) return;
    const dx = Math.abs(e.clientX - mainSwipeStart.current.x);
    if (dx > 5) mainIsDragging.current = true;
  };

  const handleMainMouseUp = (e: React.MouseEvent) => {
    if (!mainSwipeStart.current) return;
    const deltaX = e.clientX - mainSwipeStart.current.x;
    if (Math.abs(deltaX) > 45 && images.length > 1) {
      if (deltaX > 0)
        switchImg((activeImg - 1 + images.length) % images.length);
      else switchImg((activeImg + 1) % images.length);
    }
    mainSwipeStart.current = null;
    setTimeout(() => {
      mainIsDragging.current = false;
    }, 10);
  };

  const handleMainTouchStart = (e: React.TouchEvent) => {
    mainSwipeStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    mainIsDragging.current = false;
  };

  const handleMainTouchMove = (e: React.TouchEvent) => {
    if (!mainSwipeStart.current) return;
    const dx = Math.abs(e.touches[0].clientX - mainSwipeStart.current.x);
    if (dx > 8) mainIsDragging.current = true;
  };

  const handleMainTouchEnd = (e: React.TouchEvent) => {
    if (!mainSwipeStart.current) return;
    const deltaX = e.changedTouches[0].clientX - mainSwipeStart.current.x;
    const deltaY = e.changedTouches[0].clientY - mainSwipeStart.current.y;
    // Only swipe if horizontal movement is dominant
    if (
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > 45 &&
      images.length > 1
    ) {
      if (deltaX > 0)
        switchImg((activeImg - 1 + images.length) % images.length);
      else switchImg((activeImg + 1) % images.length);
    }
    mainSwipeStart.current = null;
    setTimeout(() => {
      mainIsDragging.current = false;
    }, 10);
  };

  // ══════════════════════════════════════════════════════════
  //  LIGHTBOX — mouse events (drag + swipe + backdrop click)
  // ══════════════════════════════════════════════════════════

  const handleLbMouseDown = (e: React.MouseEvent) => {
    // Only handle left click
    if (e.button !== 0) return;
    if (lbZoom > 1) {
      e.preventDefault();
      setLbDragging(true);
      lbDragStart.current = {
        x: e.clientX,
        y: e.clientY,
        px: lbPan.x,
        py: lbPan.y,
      };
    } else {
      lbSwipeStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleLbMouseMove = (e: React.MouseEvent) => {
    if (lbZoom > 1 && lbDragging && lbDragStart.current) {
      const newPan = {
        x: lbDragStart.current.px + (e.clientX - lbDragStart.current.x),
        y: lbDragStart.current.py + (e.clientY - lbDragStart.current.y),
      };
      setLbPan(getConstrainedPan(newPan, lbZoom));
    }
  };

  const handleLbMouseUp = (e: React.MouseEvent) => {
    if (lbZoom > 1) {
      setLbDragging(false);
      lbDragStart.current = null;
    } else if (lbSwipeStart.current) {
      const deltaX = e.clientX - lbSwipeStart.current.x;
      const deltaY = e.clientY - lbSwipeStart.current.y;

      if (deltaY > 70 && Math.abs(deltaY) > Math.abs(deltaX)) {
        closeLightbox();
      } else if (Math.abs(deltaX) > 45 && images.length > 1) {
        if (deltaX > 0)
          setActiveImg((i) => (i - 1 + images.length) % images.length);
        else setActiveImg((i) => (i + 1) % images.length);
        setLbZoom(1);
        setLbPan({ x: 0, y: 0 });
      }
      lbSwipeStart.current = null;
    }
  };

  // ══════════════════════════════════════════════════════════
  //  LIGHTBOX — touch events (drag + swipe + pinch-to-zoom)
  // ══════════════════════════════════════════════════════════

  const getTouchDist = (t: React.TouchList) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const handleLbTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      pinchStartDist.current = getTouchDist(e.touches);
      pinchStartZoom.current = lbZoom;
      lbSwipeStart.current = null;
      lbTouchStart.current = null;
      return;
    }
    const touch = e.touches[0];
    if (lbZoom > 1) {
      lbTouchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        px: lbPan.x,
        py: lbPan.y,
      };
      lbSwipeStart.current = null;
    } else {
      lbSwipeStart.current = { x: touch.clientX, y: touch.clientY };
      lbTouchStart.current = null;
    }
    pinchStartDist.current = null;
  };

  const handleLbTouchMove = (e: React.TouchEvent) => {
    // Pinch-to-zoom (2 fingers)
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      const scale = dist / pinchStartDist.current;
      const newZoom = Math.min(4, Math.max(1, pinchStartZoom.current * scale));
      if (newZoom === 1) setLbPan({ x: 0, y: 0 });
      setLbZoom(newZoom);
      return;
    }

    // Pan when zoomed
    if (lbZoom > 1 && lbTouchStart.current) {
      e.preventDefault();
      const touch = e.touches[0];
      const newPan = {
        x: lbTouchStart.current.px + (touch.clientX - lbTouchStart.current.x),
        y: lbTouchStart.current.py + (touch.clientY - lbTouchStart.current.y),
      };
      setLbPan(getConstrainedPan(newPan, lbZoom));
      return;
    }

    // Swipe-down visual feedback (when not zoomed)
    if (lbSwipeStart.current && lbImgContainerRef.current) {
      const touch = e.touches[0];
      const deltaY = touch.clientY - lbSwipeStart.current.y;
      const deltaX = touch.clientX - lbSwipeStart.current.x;
      if (deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
        lbImgContainerRef.current.style.transform = `translateY(${
          deltaY * 0.38
        }px) scale(${Math.max(0.84, 1 - deltaY * 0.0008)})`;
        lbImgContainerRef.current.style.transition = "none";
        if (lightboxRef.current) {
          lightboxRef.current.style.background = `rgba(7,5,3,${Math.max(
            0.35,
            0.97 - deltaY * 0.003
          )})`;
        }
      }
    }
  };

  const handleLbTouchEnd = (e: React.TouchEvent) => {
    // Pinch end
    if (pinchStartDist.current !== null) {
      flashZoomIndicator(lbZoom);
      pinchStartDist.current = null;
      return;
    }

    if (lbZoom > 1) {
      lbTouchStart.current = null;
      return;
    }

    if (lbSwipeStart.current) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - lbSwipeStart.current.x;
      const deltaY = touch.clientY - lbSwipeStart.current.y;

      // Reset visual feedback
      if (lbImgContainerRef.current) {
        lbImgContainerRef.current.style.transform = "";
        lbImgContainerRef.current.style.transition = "";
      }
      if (lightboxRef.current) {
        lightboxRef.current.style.background = "";
      }

      if (deltaY > 75 && Math.abs(deltaY) > Math.abs(deltaX)) {
        closeLightbox();
      } else if (
        Math.abs(deltaX) > 45 &&
        Math.abs(deltaX) > Math.abs(deltaY) &&
        images.length > 1
      ) {
        if (deltaX > 0)
          setActiveImg((i) => (i - 1 + images.length) % images.length);
        else setActiveImg((i) => (i + 1) % images.length);
        setLbZoom(1);
        setLbPan({ x: 0, y: 0 });
      }
      lbSwipeStart.current = null;
    }
  };

  // ── Double-click / double-tap to zoom ───────────────────────
  const lastTapTime = useRef(0);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newZoom = lbZoom > 1 ? 1 : 2.2;
    if (newZoom === 1) setLbPan({ x: 0, y: 0 });
    setLbZoom(newZoom);
    flashZoomIndicator(newZoom);
  };

  const handleLbTouchDoubleTap = (e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTapTime.current < 320) {
      // Double tap
      const newZoom = lbZoom > 1 ? 1 : 2.2;
      if (newZoom === 1) setLbPan({ x: 0, y: 0 });
      setLbZoom(newZoom);
      flashZoomIndicator(newZoom);
    }
    lastTapTime.current = now;
  };

  // ── Mouse wheel zoom ─────────────────────────────────────────
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!lightbox) return;
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.3 : 0.3;
      setLbZoom((prev) => {
        const newZoom = Math.min(4, Math.max(1, prev + delta));
        if (newZoom === 1) setLbPan({ x: 0, y: 0 });
        else {
          setLbPan((pan) =>
            getConstrainedPan(
              { x: pan.x * (newZoom / prev), y: pan.y * (newZoom / prev) },
              newZoom
            )
          );
        }
        return newZoom;
      });
    },
    [lightbox, getConstrainedPan]
  );

  // Attach wheel with passive:false so we can preventDefault
  useEffect(() => {
    const stage = lbStageRef.current;
    if (!stage || !lightbox) return;
    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, [lightbox, handleWheel]);

  // ── Backdrop click to close ──────────────────────────────────
  const handleLightboxBackdropClick = (e: React.MouseEvent) => {
    if (e.target === lightboxRef.current || e.target === lbStageRef.current) {
      closeLightbox();
    }
  };

  // ── Keyboard navigation ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setActiveImg((i) => (images.length > 0 ? (i + 1) % images.length : 0));
        setLbZoom(1);
        setLbPan({ x: 0, y: 0 });
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setActiveImg((i) =>
          images.length > 0 ? (i - 1 + images.length) % images.length : 0
        );
        setLbZoom(1);
        setLbPan({ x: 0, y: 0 });
      }
      if (e.key === "+" || e.key === "=") {
        setLbZoom((z) => Math.min(4, z + 0.5));
      }
      if (e.key === "-") {
        setLbZoom((z) => {
          const nz = Math.max(1, z - 0.5);
          if (nz === 1) setLbPan({ x: 0, y: 0 });
          return nz;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, images.length, closeLightbox]);

  // ── Reset zoom when switching image in lightbox ──────────────
  useEffect(() => {
    if (lightbox) {
      setLbZoom(1);
      setLbPan({ x: 0, y: 0 });
    }
  }, [activeImg, lightbox]);

  // ── Body scroll lock ─────────────────────────────────────────
  useEffect(() => {
    if (lightbox) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  // ── Open lightbox ─────────────────────────────────────────────
  const openLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLbZoom(1);
    setLbPan({ x: 0, y: 0 });
    setLightbox(true);
  };

  // ── Empty state ───────────────────────────────────────────────
  if (!images || images.length === 0) {
    return (
      <div className="pg-gallery">
        <div className="pg-swiper-wrap">
          <div className="pg-main-img-wrap">
            <div className="pg-img-placeholder">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.8"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pg-gallery">
        {/* ── MAIN IMAGE WITH SWIPE ── */}
        <div
          className="pg-swiper-wrap"
          onMouseDown={handleMainMouseDown}
          onMouseMove={handleMainMouseMove}
          onMouseUp={handleMainMouseUp}
          onMouseLeave={() => {
            mainSwipeStart.current = null;
          }}
          onTouchStart={handleMainTouchStart}
          onTouchMove={handleMainTouchMove}
          onTouchEnd={handleMainTouchEnd}
          style={{ cursor: images.length > 1 ? "grab" : "default" }}
        >
          <div
            className="pg-main-img-wrap"
            onMouseMove={(e) => {
              // Subtle parallax — clipped by overflow:hidden
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width - 0.5) * 6;
              const y = ((e.clientY - rect.top) / rect.height - 0.5) * 6;
              if (mainImgRef.current)
                mainImgRef.current.style.transform = `scale(1.03) translate(${x}px, ${y}px)`;
            }}
            onMouseLeave={() => {
              if (mainImgRef.current) mainImgRef.current.style.transform = "";
            }}
          >
            <img
              ref={mainImgRef}
              src={images[activeImg]}
              alt={productName}
              className={imgEntering ? "pg-img-entering" : ""}
              draggable={false}
            />

            {/* Counter */}
            {images.length > 1 && (
              <div className="pg-img-counter">
                {activeImg + 1} / {images.length}
              </div>
            )}

            {/* Swipe hint (mobile) */}
            {images.length > 1 && (
              <div className="pg-swipe-hint">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polyline points="15 18 9 12 15 6" />
                  <line x1="9" y1="12" x2="18" y2="12" />
                </svg>
                Swipe to browse
              </div>
            )}

            {/* Expand / Fullscreen Button */}
            <button
              className="pg-expand-btn"
              onClick={openLightbox}
              aria-label="View full image"
              title="Open fullscreen gallery"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>

          {/* Prev / Next arrows on main image */}
          {images.length > 1 && (
            <>
              <button
                className="pg-swiper-arrow pg-swiper-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  switchImg((activeImg - 1 + images.length) % images.length);
                }}
                aria-label="Previous image"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                className="pg-swiper-arrow pg-swiper-next"
                onClick={(e) => {
                  e.stopPropagation();
                  switchImg((activeImg + 1) % images.length);
                }}
                aria-label="Next image"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* ── THUMBNAIL STRIP — always visible, never hidden ── */}
        {images.length > 1 && (
          <div className="pg-thumbs">
            {images.map((src, idx) => (
              <button
                key={idx}
                className={`pg-thumb${activeImg === idx ? " active" : ""}`}
                onClick={() => switchImg(idx)}
                aria-label={`View image ${idx + 1}`}
              >
                <img src={src} alt="" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          LIGHTBOX — z-index 99999 (above navbar)
          • Click backdrop → close
          • Swipe down → close
          • Double-click / double-tap → zoom toggle
          • Pinch → zoom in/out (stays inside stage)
          • Mouse wheel → zoom (stays inside stage)
          • Drag when zoomed → pan (constrained, can't exit stage)
          • Arrow keys / arrows → navigate
          ══════════════════════════════════════════════════════════ */}
      {lightbox && images[activeImg] && (
        <div
          className={`pg-lightbox${lbClosing ? " pg-lightbox--closing" : ""}`}
          ref={lightboxRef}
          onClick={handleLightboxBackdropClick}
        >
          {/* ── HEADER BAR ── */}
          <div className="pg-lb-header" onClick={(e) => e.stopPropagation()}>
            {/* Dot indicators */}
            <div className="pg-lb-numbering">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`pg-lb-dot${activeImg === i ? " active" : ""}`}
                  onClick={() => {
                    setActiveImg(i);
                    setLbZoom(1);
                    setLbPan({ x: 0, y: 0 });
                  }}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>

            {/* Counter */}
            <span className="pg-lb-counter">
              {activeImg + 1} / {images.length}
            </span>

            {/* Zoom Controls */}
            <div className="pg-lb-zoom-controls">
              <button
                className="pg-lb-zoom-btn"
                onClick={() =>
                  setLbZoom((z) => {
                    const nz = Math.max(1, z - 0.5);
                    if (nz === 1) setLbPan({ x: 0, y: 0 });
                    return nz;
                  })
                }
                aria-label="Zoom out"
                title="Zoom Out (−)"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </button>
              <span className="pg-lb-zoom-level">
                {Math.round(lbZoom * 100)}%
              </span>
              <button
                className="pg-lb-zoom-btn"
                onClick={() => setLbZoom((z) => Math.min(4, z + 0.5))}
                aria-label="Zoom in"
                title="Zoom In (+)"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </button>
            </div>

            {/* Close */}
            <button
              className="pg-lightbox-close"
              onClick={closeLightbox}
              aria-label="Close gallery"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ── IMAGE STAGE ── */}
          <div
            className="pg-lb-stage"
            ref={lbStageRef}
            onMouseDown={handleLbMouseDown}
            onMouseMove={handleLbMouseMove}
            onMouseUp={handleLbMouseUp}
            onMouseLeave={() => {
              setLbDragging(false);
              lbDragStart.current = null;
            }}
            onTouchStart={(e) => {
              handleLbTouchStart(e);
              handleLbTouchDoubleTap(e);
            }}
            onTouchMove={handleLbTouchMove}
            onTouchEnd={handleLbTouchEnd}
            onDoubleClick={handleDoubleClick}
            onClick={handleLightboxBackdropClick}
            style={{
              cursor:
                lbZoom > 1 ? (lbDragging ? "grabbing" : "grab") : "zoom-in",
            }}
          >
            <div
              className="pg-lb-img-container"
              ref={lbImgContainerRef}
              onClick={(e) => e.stopPropagation()}
              style={{
                transform: `scale(${lbZoom}) translate(${lbPan.x / lbZoom}px, ${
                  lbPan.y / lbZoom
                }px)`,
                transition: lbDragging
                  ? "none"
                  : "transform 0.32s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <img
                src={images[activeImg]}
                alt={productName}
                draggable={false}
              />
            </div>
          </div>

          {/* Zoom indicator flash */}
          {showZoomIndicator && (
            <div className="pg-lb-zoom-indicator">
              {Math.round(zoomIndicatorVal * 100)}%
            </div>
          )}

          {/* ── LEFT ARROW ── */}
          {images.length > 1 && (
            <button
              className="pg-lb-arrow pg-lb-arrow--prev"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImg((i) => (i - 1 + images.length) % images.length);
                setLbZoom(1);
                setLbPan({ x: 0, y: 0 });
              }}
              aria-label="Previous image"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* ── RIGHT ARROW ── */}
          {images.length > 1 && (
            <button
              className="pg-lb-arrow pg-lb-arrow--next"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImg((i) => (i + 1) % images.length);
                setLbZoom(1);
                setLbPan({ x: 0, y: 0 });
              }}
              aria-label="Next image"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Swipe down hint */}
          <div className="pg-lb-swipe-hint">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
            Swipe down to close
          </div>

          {/* Pinch zoom hint (mobile only) */}
          <div className="pg-lb-pinch-hint">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            Pinch to zoom · Double-tap to zoom
          </div>

          {/* ── BOTTOM THUMBNAIL STRIP ── */}
          {images.length > 1 && (
            <div className="pg-lb-thumbs" onClick={(e) => e.stopPropagation()}>
              {images.map((src, i) => (
                <button
                  key={i}
                  className={`pg-lb-thumb${activeImg === i ? " active" : ""}`}
                  onClick={() => {
                    setActiveImg(i);
                    setLbZoom(1);
                    setLbPan({ x: 0, y: 0 });
                  }}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={src} alt="" draggable={false} />
                  <span className="pg-lb-thumb-num">{i + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
