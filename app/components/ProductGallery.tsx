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

  // Touch/mouse swipe refs
  const mainSwipeStart = useRef<{ x: number; y: number } | null>(null);
  const mainSwipeEnd = useRef<{ x: number; y: number } | null>(null);

  // Lightbox drag refs
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

  // Lightbox swipe refs (when not zoomed)
  const lbSwipeStart = useRef<{ x: number; y: number } | null>(null);

  const mainContainerRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lbStageRef = useRef<HTMLDivElement>(null);
  const lbImgContainerRef = useRef<HTMLDivElement>(null);

  // ─── Image switch helper ───────────────────────────────────
  function switchImg(idx: number) {
    if (idx === activeImg) return;
    setImgEntering(true);
    setTimeout(() => {
      setActiveImg(idx);
      setImgEntering(false);
    }, 80);
  }

  // ─── Smooth close with animation ──────────────────────────
  const closeLightbox = useCallback(() => {
    setLbClosing(true);
    setTimeout(() => {
      setLightbox(false);
      setLbClosing(false);
      setLbZoom(1);
      setLbPan({ x: 0, y: 0 });
      setLbDragging(false);
      lbDragStart.current = null;
      lbTouchStart.current = null;
      lbSwipeStart.current = null;
      document.body.style.overflow = "";
    }, 320);
  }, []);

  // ─── Main gallery: mouse swipe ────────────────────────────
  const handleMainMouseDown = (e: React.MouseEvent) => {
    mainSwipeStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMainMouseUp = (e: React.MouseEvent) => {
    if (!mainSwipeStart.current) return;
    const deltaX = e.clientX - mainSwipeStart.current.x;
    if (Math.abs(deltaX) > 50 && images.length > 1) {
      if (deltaX > 0) {
        switchImg((activeImg - 1 + images.length) % images.length);
      } else {
        switchImg((activeImg + 1) % images.length);
      }
    }
    mainSwipeStart.current = null;
    mainSwipeEnd.current = null;
  };

  // ─── Main gallery: touch swipe ────────────────────────────
  const handleMainTouchStart = (e: React.TouchEvent) => {
    mainSwipeStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleMainTouchEnd = (e: React.TouchEvent) => {
    if (!mainSwipeStart.current) return;
    const deltaX = e.changedTouches[0].clientX - mainSwipeStart.current.x;
    if (Math.abs(deltaX) > 50 && images.length > 1) {
      if (deltaX > 0) {
        switchImg((activeImg - 1 + images.length) % images.length);
      } else {
        switchImg((activeImg + 1) % images.length);
      }
    }
    mainSwipeStart.current = null;
  };

  // ─── Constrained pan — image stays within viewport ────────
  const getConstrainedPan = (
    newPan: { x: number; y: number },
    zoom: number
  ) => {
    if (!lbStageRef.current || !lbImgContainerRef.current) return newPan;

    const stageRect = lbStageRef.current.getBoundingClientRect();
    const imgEl = lbImgContainerRef.current.querySelector(
      "img"
    ) as HTMLImageElement;
    if (!imgEl) return newPan;

    const naturalW = imgEl.offsetWidth;
    const naturalH = imgEl.offsetHeight;

    const overflowX = Math.max(0, naturalW * zoom - stageRect.width);
    const overflowY = Math.max(0, naturalH * zoom - stageRect.height);

    const maxPanX = overflowX / 2;
    const maxPanY = overflowY / 2;

    return {
      x: Math.min(maxPanX, Math.max(-maxPanX, newPan.x)),
      y: Math.min(maxPanY, Math.max(-maxPanY, newPan.y)),
    };
  };

  // ─── Lightbox: mouse events ───────────────────────────────
  const handleLbMouseDown = (e: React.MouseEvent) => {
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

      if (deltaY > 80 && Math.abs(deltaY) > Math.abs(deltaX)) {
        closeLightbox();
      } else if (Math.abs(deltaX) > 50 && images.length > 1) {
        if (deltaX > 0) {
          setActiveImg((i) => (i - 1 + images.length) % images.length);
        } else {
          setActiveImg((i) => (i + 1) % images.length);
        }
        setLbZoom(1);
        setLbPan({ x: 0, y: 0 });
      }
      lbSwipeStart.current = null;
    }
  };

  // ─── Lightbox: touch events ───────────────────────────────
  const handleLbTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (lbZoom > 1) {
      lbTouchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        px: lbPan.x,
        py: lbPan.y,
      };
    } else {
      lbSwipeStart.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleLbTouchMove = (e: React.TouchEvent) => {
    if (lbZoom > 1 && lbTouchStart.current) {
      const touch = e.touches[0];
      const newPan = {
        x: lbTouchStart.current.px + (touch.clientX - lbTouchStart.current.x),
        y: lbTouchStart.current.py + (touch.clientY - lbTouchStart.current.y),
      };
      setLbPan(getConstrainedPan(newPan, lbZoom));
    } else if (lbSwipeStart.current && lbImgContainerRef.current) {
      // Live swipe-down visual feedback
      const touch = e.touches[0];
      const deltaY = touch.clientY - lbSwipeStart.current.y;
      if (deltaY > 0) {
        if (lbImgContainerRef.current) {
          lbImgContainerRef.current.style.transform = `translateY(${
            deltaY * 0.4
          }px) scale(${Math.max(0.85, 1 - deltaY * 0.001)})`;
          lbImgContainerRef.current.style.transition = "none";
        }
        if (lightboxRef.current) {
          lightboxRef.current.style.background = `rgba(8,6,4,${Math.max(
            0.35,
            0.97 - deltaY * 0.003
          )})`;
        }
      }
    }
  };

  const handleLbTouchEnd = (e: React.TouchEvent) => {
    if (lbZoom > 1) {
      lbTouchStart.current = null;
    } else if (lbSwipeStart.current) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - lbSwipeStart.current.x;
      const deltaY = touch.clientY - lbSwipeStart.current.y;

      // Reset live visual feedback
      if (lbImgContainerRef.current) {
        lbImgContainerRef.current.style.transform = "";
        lbImgContainerRef.current.style.transition = "";
      }
      if (lightboxRef.current) {
        lightboxRef.current.style.background = "";
      }

      if (deltaY > 80 && Math.abs(deltaY) > Math.abs(deltaX)) {
        closeLightbox();
      } else if (Math.abs(deltaX) > 50 && images.length > 1) {
        if (deltaX > 0) {
          setActiveImg((i) => (i - 1 + images.length) % images.length);
        } else {
          setActiveImg((i) => (i + 1) % images.length);
        }
        setLbZoom(1);
        setLbPan({ x: 0, y: 0 });
      }
      lbSwipeStart.current = null;
    }
  };

  // ─── Double click to toggle zoom ──────────────────────────
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lbZoom > 1) {
      setLbZoom(1);
      setLbPan({ x: 0, y: 0 });
    } else {
      setLbZoom(2.5);
    }
  };

  // ─── Mouse wheel zoom ─────────────────────────────────────
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    const newZoom = Math.min(4, Math.max(1, lbZoom + delta));
    if (newZoom === 1) {
      setLbPan({ x: 0, y: 0 });
    } else {
      const scaleFactor = newZoom / lbZoom;
      setLbPan(
        getConstrainedPan(
          {
            x: lbPan.x * scaleFactor,
            y: lbPan.y * scaleFactor,
          },
          newZoom
        )
      );
    }
    setLbZoom(newZoom);
  };

  // ─── Click black backdrop to close ───────────────────────
  // Only fires when clicking the root lightbox div (the dark backdrop)
  const handleLightboxBackdropClick = (e: React.MouseEvent) => {
    if (e.target === lightboxRef.current) {
      closeLightbox();
    }
  };

  // ─── Keyboard navigation ──────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") {
        setActiveImg((i) => (images.length > 0 ? (i + 1) % images.length : 0));
        setLbZoom(1);
        setLbPan({ x: 0, y: 0 });
      }
      if (e.key === "ArrowLeft") {
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

  // ─── Reset zoom on image change ───────────────────────────
  useEffect(() => {
    if (lightbox) {
      setLbZoom(1);
      setLbPan({ x: 0, y: 0 });
    }
  }, [activeImg, lightbox]);

  // ─── Body scroll lock ─────────────────────────────────────
  useEffect(() => {
    if (lightbox) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  // ─── Open lightbox ────────────────────────────────────────
  const openLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightbox(true);
  };

  if (!images || images.length === 0) {
    return (
      <div className="pg-gallery">
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
    );
  }

  return (
    <>
      <div className="pg-gallery">
        {/* MAIN IMAGE WITH SWIPE SUPPORT */}
        <div
          className="pg-swiper-wrap"
          ref={mainContainerRef}
          onMouseDown={handleMainMouseDown}
          onMouseUp={handleMainMouseUp}
          onTouchStart={handleMainTouchStart}
          onTouchEnd={handleMainTouchEnd}
        >
          {/* Big image — click does NOT open lightbox. Only expand btn does. */}
          <div
            className="pg-main-img-wrap"
            onMouseMove={(e) => {
              // Tiny internal parallax — image stays within bounds
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width - 0.5) * 4;
              const y = ((e.clientY - rect.top) / rect.height - 0.5) * 4;
              const img = e.currentTarget.querySelector(
                "img"
              ) as HTMLImageElement;
              if (img)
                img.style.transform = `scale(1.04) translate(${x}px, ${y}px)`;
            }}
            onMouseLeave={(e) => {
              const img = e.currentTarget.querySelector(
                "img"
              ) as HTMLImageElement;
              if (img) img.style.transform = "";
            }}
          >
            <img
              src={images[activeImg]}
              alt={productName}
              className={imgEntering ? "pg-img-entering" : ""}
              style={{
                transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)",
              }}
              draggable={false}
            />
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
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                Swipe to browse
              </div>
            )}

            {/* ── UNIQUE EXPAND BUTTON — bottom-right corner ── */}
            <button
              className="pg-expand-btn"
              onClick={openLightbox}
              aria-label="View full image"
              title="Open fullscreen view"
            >
              {/* Expand arrows icon */}
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

          {/* Swiper prev/next arrows */}
          {images.length > 1 && (
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
          )}

          {images.length > 1 && (
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
          )}
        </div>

        {/* THUMBNAIL STRIP */}
        {images.length > 1 && (
          <div className="pg-thumbs">
            {images.map((src, idx) => (
              <button
                key={idx}
                className={`pg-thumb${activeImg === idx ? " active" : ""}`}
                onClick={() => switchImg(idx)}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          LIGHTBOX — z-index 99999 (above navbar z-500)
          Click black backdrop → close
          Swipe down → close with animation
          Zoom in → constrained pan (image stays in bounds)
          ══════════════════════════════════════════════════════════ */}
      {lightbox && images[activeImg] && (
        <div
          className={`pg-lightbox${lbClosing ? " pg-lightbox--closing" : ""}`}
          ref={lightboxRef}
          onClick={handleLightboxBackdropClick}
        >
          {/* HEADER BAR */}
          <div className="pg-lb-header" onClick={(e) => e.stopPropagation()}>
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
            <span className="pg-lb-counter">
              {activeImg + 1} / {images.length}
            </span>
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
            <button
              className="pg-lightbox-close"
              onClick={closeLightbox}
              aria-label="Close lightbox"
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

          {/* IMAGE STAGE */}
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
            onTouchStart={handleLbTouchStart}
            onTouchMove={handleLbTouchMove}
            onTouchEnd={handleLbTouchEnd}
            onDoubleClick={handleDoubleClick}
            onWheel={handleWheel}
            style={{
              cursor:
                lbZoom > 1 ? (lbDragging ? "grabbing" : "grab") : "zoom-in",
            }}
          >
            <div
              className="pg-lb-img-container"
              ref={lbImgContainerRef}
              style={{
                transform: `scale(${lbZoom}) translate(${lbPan.x / lbZoom}px, ${
                  lbPan.y / lbZoom
                }px)`,
                transition: lbDragging
                  ? "none"
                  : "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <img
                src={images[activeImg]}
                alt="Product zoom"
                draggable={false}
              />
            </div>
          </div>

          {/* LEFT NAV ARROW */}
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

          {/* RIGHT NAV ARROW */}
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

          {/* SWIPE DOWN HINT */}
          <div className="pg-lb-swipe-hint">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="12 5 12 19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
            Swipe down to close
          </div>

          {/* BOTTOM THUMBNAIL STRIP */}
          {images.length > 1 && (
            <div
              className="pg-lb-thumbs"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((src, i) => (
                <button
                  key={i}
                  className={`pg-lb-thumb${activeImg === i ? " active" : ""}`}
                  onClick={() => {
                    setActiveImg(i);
                    setLbZoom(1);
                    setLbPan({ x: 0, y: 0 });
                  }}
                >
                  <img src={src} alt="" />
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