"use client";

import { useState, useRef, useEffect } from "react";
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
  const [lbZoom, setLbZoom] = useState(1);
  const [lbPan, setLbPan] = useState({ x: 0, y: 0 });
  const [lbDragging, setLbDragging] = useState(false);

  // Touch swipe for main gallery
  const mainSwipeStart = useRef<{ x: number; y: number } | null>(null);
  const mainSwipeEnd = useRef<{ x: number; y: number } | null>(null);

  // Touch swipe for lightbox
  const lbSwipeStart = useRef<{ x: number; y: number } | null>(null);
  const lbSwipeEnd = useRef<{ x: number; y: number } | null>(null);

  // Drag for zoomed image
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

  const mainContainerRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  function switchImg(idx: number) {
    if (idx === activeImg) return;
    setImgEntering(true);
    setTimeout(() => {
      setActiveImg(idx);
      setImgEntering(false);
    }, 80);
  }

  // Handle mouse swipe for main gallery
  const handleMainMouseDown = (e: React.MouseEvent) => {
    mainSwipeStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMainMouseUp = (e: React.MouseEvent) => {
    if (!mainSwipeStart.current) return;
    mainSwipeEnd.current = { x: e.clientX, y: e.clientY };
    const deltaX = mainSwipeEnd.current.x - mainSwipeStart.current.x;
    if (Math.abs(deltaX) > 50 && images.length > 1) {
      if (deltaX > 0) {
        // Swipe right - previous image
        switchImg((activeImg - 1 + images.length) % images.length);
      } else {
        // Swipe left - next image
        switchImg((activeImg + 1) % images.length);
      }
    }
    mainSwipeStart.current = null;
    mainSwipeEnd.current = null;
  };

  // Handle touch swipe for main gallery
  const handleMainTouchStart = (e: React.TouchEvent) => {
    mainSwipeStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleMainTouchEnd = (e: React.TouchEvent) => {
    if (!mainSwipeStart.current) return;
    mainSwipeEnd.current = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };
    const deltaX = mainSwipeEnd.current.x - mainSwipeStart.current.x;
    if (Math.abs(deltaX) > 50 && images.length > 1) {
      if (deltaX > 0) {
        // Swipe right - previous image
        switchImg((activeImg - 1 + images.length) % images.length);
      } else {
        // Swipe left - next image
        switchImg((activeImg + 1) % images.length);
      }
    }
    mainSwipeStart.current = null;
    mainSwipeEnd.current = null;
  };

  // Handle mouse swipe for lightbox
  const handleLbMouseDown = (e: React.MouseEvent) => {
    if (lbZoom > 1) {
      // If zoomed, allow panning
      e.preventDefault();
      setLbDragging(true);
      lbDragStart.current = {
        x: e.clientX,
        y: e.clientY,
        px: lbPan.x,
        py: lbPan.y,
      };
    } else {
      // If not zoomed, allow swipe to change image
      lbSwipeStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleLbMouseMove = (e: React.MouseEvent) => {
    if (lbZoom > 1 && lbDragging && lbDragStart.current) {
      setLbPan({
        x: lbDragStart.current.px + (e.clientX - lbDragStart.current.x),
        y: lbDragStart.current.py + (e.clientY - lbDragStart.current.y),
      });
    }
  };

  const handleLbMouseUp = (e: React.MouseEvent) => {
    if (lbZoom > 1) {
      setLbDragging(false);
      lbDragStart.current = null;
    } else if (lbSwipeStart.current) {
      const deltaX = e.clientX - lbSwipeStart.current.x;
      if (Math.abs(deltaX) > 50 && images.length > 1) {
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

  // Handle touch swipe for lightbox
  const handleLbTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (lbZoom > 1) {
      // If zoomed, allow panning
      lbTouchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        px: lbPan.x,
        py: lbPan.y,
      };
    } else {
      // If not zoomed, allow swipe to change image
      lbSwipeStart.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleLbTouchMove = (e: React.TouchEvent) => {
    if (lbZoom > 1 && lbTouchStart.current) {
      const touch = e.touches[0];
      setLbPan({
        x: lbTouchStart.current.px + (touch.clientX - lbTouchStart.current.x),
        y: lbTouchStart.current.py + (touch.clientY - lbTouchStart.current.y),
      });
    }
  };

  const handleLbTouchEnd = (e: React.TouchEvent) => {
    if (lbZoom > 1) {
      lbTouchStart.current = null;
    } else if (lbSwipeStart.current) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - lbSwipeStart.current.x;
      if (Math.abs(deltaX) > 50 && images.length > 1) {
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

  // Handle double click for zoom
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lbZoom > 1) {
      setLbZoom(1);
      setLbPan({ x: 0, y: 0 });
    } else {
      setLbZoom(2.5);
    }
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setLbZoom((z) => {
      const nz = Math.min(4, Math.max(1, z + delta));
      if (nz === 1) setLbPan({ x: 0, y: 0 });
      return nz;
    });
  };

  // Handle outside click to close lightbox
  const handleLightboxClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setLightbox(false);
      setLbZoom(1);
      setLbPan({ x: 0, y: 0 });
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === "Escape") {
        setLightbox(false);
        setLbZoom(1);
        setLbPan({ x: 0, y: 0 });
      }
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
  }, [lightbox, images.length]);

  // Reset zoom when changing images in lightbox
  useEffect(() => {
    if (lightbox) {
      setLbZoom(1);
      setLbPan({ x: 0, y: 0 });
    }
  }, [activeImg, lightbox]);

  // Prevent body scroll when lightbox is open
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
          <div
            className="pg-main-img-wrap"
            onClick={() => images.length > 0 && setLightbox(true)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
              const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
              const img = e.currentTarget.querySelector(
                "img"
              ) as HTMLImageElement;
              if (img)
                img.style.transform = `scale(1.06) translate(${x}px, ${y}px)`;
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
            <div className="pg-zoom-hint">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              Click to Zoom
            </div>
            {/* Swipe hint for mobile */}
            {images.length > 1 && (
              <div className="pg-swipe-hint">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                  <polyline points="8 8 12 4 16 8" />
                  <polyline points="8 16 12 20 16 16" />
                </svg>
                Swipe to browse
              </div>
            )}
          </div>

          {/* SWIPER PREV ARROW */}
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

          {/* SWIPER NEXT ARROW */}
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

      {/* LIGHTBOX MODAL - HIGH Z-INDEX */}
      {lightbox && images[activeImg] && (
        <div
          className="pg-lightbox"
          ref={lightboxRef}
          onClick={handleLightboxClick}
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
              onClick={() => {
                setLightbox(false);
                setLbZoom(1);
                setLbPan({ x: 0, y: 0 });
              }}
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

          {/* IMAGE STAGE - WITH SWIPE AND PAN SUPPORT */}
          <div
            className="pg-lb-stage"
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

          {/* BOTTOM THUMBNAIL STRIP */}
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
