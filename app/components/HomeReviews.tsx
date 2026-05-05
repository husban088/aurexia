// app/components/HomeReviews.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import "@/app/components/HomeReviews.css";

interface HomeReview {
  id: string;
  product_id: string;
  name: string;
  title: string;
  body: string;
  rating: number;
  images: string[];
  created_at: string;
  product_name?: string;
}

// ── Star Icons ────────────────────────────────────────────────
function StarIcon({ filled, size = 14 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={filled ? "#b8963e" : "none"}
        stroke="#b8963e"
        strokeWidth="1.5"
        opacity={filled ? 1 : 0.35}
      />
    </svg>
  );
}

function StarDisplay({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="hr-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} filled={i <= Math.round(rating)} size={size} />
      ))}
    </div>
  );
}

// ── Quote SVG ────────────────────────────────────────────────
function QuoteIcon() {
  return (
    <svg
      className="hr-quote-icon"
      viewBox="0 0 48 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 36V22.5C0 16.5 1.5 11.5 4.5 7.5C7.5 3.5 11.5 1 16.5 0L18 3C14.5 4 11.75 6 9.75 9C7.75 12 6.75 15.5 6.75 19.5H13.5V36H0ZM27 36V22.5C27 16.5 28.5 11.5 31.5 7.5C34.5 3.5 38.5 1 43.5 0L45 3C41.5 4 38.75 6 36.75 9C34.75 12 33.75 15.5 33.75 19.5H40.5V36H27Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function HomeReviews() {
  const [reviews, setReviews] = useState<HomeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const progressStart = useRef<number>(0);
  const AUTOPLAY_DURATION = 5000;

  // ── Fetch all reviews ─────────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const { data: reviewData, error } = await supabase
          .from("product_reviews")
          .select("*")
          .gte("rating", 4)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error || !reviewData) {
          setLoading(false);
          return;
        }

        // Fetch product names
        const productIds = [...new Set(reviewData.map((r) => r.product_id))];
        const { data: products } = await supabase
          .from("products")
          .select("id, name")
          .in("id", productIds);

        const productMap: Record<string, string> = {};
        (products || []).forEach((p: { id: string; name: string }) => {
          productMap[p.id] = p.name;
        });

        const enriched = reviewData.map((r) => ({
          ...r,
          product_name: productMap[r.product_id] || "Our Product",
        }));

        setReviews(enriched);
      } catch (err) {
        console.error("HomeReviews fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ── Progress bar animation ─────────────────────────────────
  const startProgress = useCallback(() => {
    setProgress(0);
    progressStart.current = Date.now();
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStart.current;
      const pct = Math.min((elapsed / AUTOPLAY_DURATION) * 100, 100);
      setProgress(pct);
    }, 30);
  }, []);

  const stopProgress = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  // ── Navigate ───────────────────────────────────────────────
  const goTo = useCallback(
    (idx: number) => {
      if (isTransitioning || reviews.length === 0) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIdx(
          ((idx % reviews.length) + reviews.length) % reviews.length
        );
        setIsTransitioning(false);
      }, 350);
    },
    [isTransitioning, reviews.length]
  );

  const next = useCallback(() => {
    goTo(activeIdx + 1);
    startProgress();
  }, [activeIdx, goTo, startProgress]);

  const prev = useCallback(() => {
    goTo(activeIdx - 1);
    startProgress();
  }, [activeIdx, goTo, startProgress]);

  // ── Autoplay ───────────────────────────────────────────────
  useEffect(() => {
    if (reviews.length === 0 || isPaused) return;
    startProgress();
    autoplayRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % reviews.length);
      startProgress();
    }, AUTOPLAY_DURATION);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      stopProgress();
    };
  }, [reviews.length, isPaused, startProgress, stopProgress]);

  // ── Mouse drag ─────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStart.current = { x: e.clientX, y: e.clientY };
    setIsDragging(false);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current) return;
    if (Math.abs(e.clientX - dragStart.current.x) > 5) setIsDragging(true);
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    if (Math.abs(dx) > 60) {
      dx > 0 ? prev() : next();
    }
    dragStart.current = null;
    setTimeout(() => setIsDragging(false), 50);
  };

  // ── Touch swipe ────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    if (Math.abs(dx) > 50) {
      dx > 0 ? prev() : next();
    }
    touchStart.current = null;
  };

  // ── Format date ────────────────────────────────────────────
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // ── Visible cards (prev, active, next) ────────────────────
  const getCard = (offset: number) => {
    if (reviews.length === 0) return null;
    return reviews[
      (((activeIdx + offset) % reviews.length) + reviews.length) %
        reviews.length
    ];
  };

  if (loading) {
    return (
      <section className="hr-section">
        <div className="hr-content">
          <div className="hr-header">
            <p className="hr-eyebrow">
              <span className="hr-eye-line" />
              Customer Voices
              <span className="hr-eye-line hr-eye-line--right" />
            </p>
            <h2 className="hr-title">
              What Our Customers <em>Say</em>
            </h2>
          </div>
          <div className="hr-loading">
            <div className="hr-loading-dot" />
            <div className="hr-loading-dot" />
            <div className="hr-loading-dot" />
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  const current = reviews[activeIdx];
  const prevCard = getCard(-1);
  const nextCard = getCard(1);

  return (
    <section className="hr-section">
      {/* ── Decorative Background ── */}
      <div className="hr-bg-orb hr-bg-orb--1" />
      <div className="hr-bg-orb hr-bg-orb--2" />
      <div className="hr-bg-lines">
        {[...Array(6)].map((_, i) => (
          <span key={i} className="hr-bg-line" />
        ))}
      </div>

      <div className="hr-content">
        {/* ── Section Header ── */}
        <div className="hr-header">
          <p className="hr-eyebrow">
            <span className="hr-eye-line" />
            Customer Voices
            <span className="hr-eye-line hr-eye-line--right" />
          </p>
          <h2 className="hr-title">
            What Our Customers <em>Say</em>
          </h2>
          <p className="hr-subtitle">
            Real experiences from real people who love what they bought
          </p>
        </div>

        {/* ── Stats Row ── */}
        <div className="hr-stats-row">
          <div className="hr-stat">
            <span className="hr-stat-num">{reviews.length}+</span>
            <span className="hr-stat-label">Verified Reviews</span>
          </div>
          <div className="hr-stat-divider" />
          <div className="hr-stat">
            <span className="hr-stat-num">
              {(
                reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
              ).toFixed(1)}
            </span>
            <span className="hr-stat-label">Average Rating</span>
          </div>
          <div className="hr-stat-divider" />
          <div className="hr-stat">
            <span className="hr-stat-num">98%</span>
            <span className="hr-stat-label">Satisfied Customers</span>
          </div>
        </div>

        {/* ── Swiper Stage ── */}
        <div
          className="hr-stage"
          onMouseEnter={() => {
            setIsPaused(true);
            stopProgress();
          }}
          onMouseLeave={() => {
            setIsPaused(false);
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          {/* Side ghost cards */}
          {reviews.length > 2 && prevCard && (
            <div
              className="hr-ghost-card hr-ghost-card--left"
              onClick={prev}
              aria-label="Previous review"
            >
              <div className="hr-ghost-inner">
                <div className="hr-ghost-avatar">
                  {prevCard.name.charAt(0).toUpperCase()}
                </div>
                <div className="hr-ghost-info">
                  <span className="hr-ghost-name">{prevCard.name}</span>
                  <StarDisplay rating={prevCard.rating} size={10} />
                </div>
              </div>
            </div>
          )}

          {/* Main Active Card */}
          <div
            className={`hr-main-card${
              isTransitioning ? " hr-main-card--exit" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gold accent top bar */}
            <div className="hr-card-accent" />

            {/* Quote Icon */}
            <QuoteIcon />

            {/* Stars */}
            <StarDisplay rating={current.rating} size={16} />

            {/* Review Title */}
            <h3 className="hr-card-title">&ldquo;{current.title}&rdquo;</h3>

            {/* Review Body */}
            <p className="hr-card-body">{current.body}</p>

            {/* Review Images */}
            {current.images && current.images.length > 0 && (
              <div className="hr-card-images">
                {current.images.slice(0, 3).map((img, idx) => (
                  <div key={idx} className="hr-card-img-wrap">
                    <img
                      src={img}
                      alt={`Review photo ${idx + 1}`}
                      className="hr-card-img"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Author Row */}
            <div className="hr-card-author">
              <div className="hr-avatar">
                {current.name.charAt(0).toUpperCase()}
              </div>
              <div className="hr-author-info">
                <span className="hr-author-name">{current.name}</span>
                <span className="hr-author-meta">
                  Reviewed{" "}
                  <em className="hr-product-tag">{current.product_name}</em>
                  &nbsp;·&nbsp;{formatDate(current.created_at)}
                </span>
              </div>
              <div className="hr-verified-badge">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Verified
              </div>
            </div>

            {/* Progress bar */}
            <div className="hr-progress-track">
              <div
                className="hr-progress-fill"
                style={{
                  width: `${progress}%`,
                  transition: isPaused ? "none" : "width 0.03s linear",
                }}
              />
            </div>
          </div>

          {/* Right ghost card */}
          {reviews.length > 2 && nextCard && (
            <div
              className="hr-ghost-card hr-ghost-card--right"
              onClick={next}
              aria-label="Next review"
            >
              <div className="hr-ghost-inner">
                <div className="hr-ghost-avatar">
                  {nextCard.name.charAt(0).toUpperCase()}
                </div>
                <div className="hr-ghost-info">
                  <span className="hr-ghost-name">{nextCard.name}</span>
                  <StarDisplay rating={nextCard.rating} size={10} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation Controls ── */}
        <div className="hr-controls">
          <button
            className="hr-arrow hr-arrow--prev"
            onClick={prev}
            aria-label="Previous review"
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

          {/* Dot indicators */}
          <div className="hr-dots">
            {reviews.map((_, i) => (
              <button
                key={i}
                className={`hr-dot${i === activeIdx ? " hr-dot--active" : ""}`}
                onClick={() => {
                  if (autoplayRef.current) clearInterval(autoplayRef.current);
                  goTo(i);
                  startProgress();
                }}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="hr-arrow hr-arrow--next"
            onClick={next}
            aria-label="Next review"
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
        </div>

        {/* ── Counter ── */}
        <p className="hr-counter">
          <span className="hr-counter-current">
            {String(activeIdx + 1).padStart(2, "0")}
          </span>
          <span className="hr-counter-sep">/</span>
          <span className="hr-counter-total">
            {String(reviews.length).padStart(2, "0")}
          </span>
        </p>
      </div>
    </section>
  );
}
