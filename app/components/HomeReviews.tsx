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

// ── Stars ─────────────────────────────────────────────────────
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="hr-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`hr-star${
            i <= Math.round(rating) ? " hr-star--filled" : ""
          }`}
          viewBox="0 0 24 24"
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

// ── Single Review Card ─────────────────────────────────────────
function ReviewCard({ review }: { review: HomeReview }) {
  const firstImage =
    review.images && review.images.length > 0 ? review.images[0] : null;
  const initial = review.name.charAt(0).toUpperCase();

  return (
    <div className="hr-card">
      {/* Gold shimmer top */}
      <div className="hr-card-shine" />

      {/* Quote mark decoration */}
      <div className="hr-card-quote">&ldquo;</div>

      {/* ── Avatar / Image — top, round, one image ── */}
      <div className="hr-card-avatar-wrap">
        {firstImage ? (
          <img
            src={firstImage}
            alt={review.name}
            className="hr-card-avatar-img"
            draggable={false}
          />
        ) : (
          <div className="hr-card-avatar-fallback">{initial}</div>
        )}
        {/* Verified badge on avatar */}
        <div className="hr-card-badge">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      {/* ── Name — center ── */}
      <h4 className="hr-card-name">{review.name}</h4>

      {/* ── Stars ── */}
      <StarDisplay rating={review.rating} />

      {/* ── Title ── */}
      <h3 className="hr-card-title">&ldquo;{review.title}&rdquo;</h3>

      {/* ── Description ── */}
      <p className="hr-card-body">{review.body}</p>

      {/* ── Product tag ── */}
      {review.product_name && (
        <div className="hr-card-product">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          {review.product_name}
        </div>
      )}

      {/* ── Bottom gold line ── */}
      <div className="hr-card-bottom-line" />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function HomeReviews() {
  const [reviews, setReviews] = useState<HomeReview[]>([]);
  const [loading, setLoading] = useState(true);

  // How many cards visible at once (responsive)
  const [visibleCount, setVisibleCount] = useState(3);

  // Track the offset index (how far we've scrolled)
  const [offset, setOffset] = useState(0);

  // Animation state — "idle" | "left" | "right"
  const [animDir, setAnimDir] = useState<"idle" | "left" | "right">("idle");

  // Drag / swipe
  const dragStart = useRef<number | null>(null);
  const touchStart = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Autoplay
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Responsive: update visible count ─────────────────────────
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setVisibleCount(3);
      else if (window.innerWidth >= 640) setVisibleCount(2);
      else setVisibleCount(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── Fetch reviews ─────────────────────────────────────────────
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

        const productIds = [...new Set(reviewData.map((r) => r.product_id))];
        const { data: products } = await supabase
          .from("products")
          .select("id, name")
          .in("id", productIds);

        const productMap: Record<string, string> = {};
        (products || []).forEach((p: { id: string; name: string }) => {
          productMap[p.id] = p.name;
        });

        setReviews(
          reviewData.map((r) => ({
            ...r,
            product_name: productMap[r.product_id] || "Our Product",
          }))
        );
      } catch (err) {
        console.error("HomeReviews fetch:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ── Navigation ─────────────────────────────────────────────────
  const totalSlides = reviews.length;

  const canPrev = offset > 0;
  const canNext = offset + visibleCount < totalSlides;

  const go = useCallback(
    (dir: "left" | "right") => {
      if (animDir !== "idle") return;

      if (dir === "right" && !canNext) {
        // Loop back to start
        setAnimDir("right");
        setTimeout(() => {
          setOffset(0);
          setAnimDir("idle");
        }, 420);
        return;
      }
      if (dir === "left" && !canPrev) {
        // Loop to end
        setAnimDir("left");
        setTimeout(() => {
          setOffset(Math.max(0, totalSlides - visibleCount));
          setAnimDir("idle");
        }, 420);
        return;
      }

      setAnimDir(dir);
      setTimeout(() => {
        setOffset((prev) =>
          dir === "right"
            ? Math.min(prev + 1, totalSlides - visibleCount)
            : Math.max(prev - 1, 0)
        );
        setAnimDir("idle");
      }, 420);
    },
    [animDir, canNext, canPrev, totalSlides, visibleCount]
  );

  const next = useCallback(() => go("right"), [go]);
  const prev = useCallback(() => go("left"), [go]);

  // ── Autoplay ──────────────────────────────────────────────────
  const startAutoplay = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    autoTimer.current = setInterval(() => next(), 4500);
  }, [next]);

  const stopAutoplay = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
  }, []);

  useEffect(() => {
    if (reviews.length > visibleCount) startAutoplay();
    return stopAutoplay;
  }, [reviews.length, visibleCount, startAutoplay, stopAutoplay]);

  // ── Mouse drag ────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStart.current = e.clientX;
    isDragging.current = false;
    stopAutoplay();
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStart.current === null) return;
    if (Math.abs(e.clientX - dragStart.current) > 8) isDragging.current = true;
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current;
    if (Math.abs(dx) > 55) dx > 0 ? prev() : next();
    dragStart.current = null;
    setTimeout(() => {
      isDragging.current = false;
    }, 60);
    startAutoplay();
  };
  const handleMouseLeave = () => {
    dragStart.current = null;
    isDragging.current = false;
    startAutoplay();
  };

  // ── Touch swipe ────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
    stopAutoplay();
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 50) dx > 0 ? prev() : next();
    touchStart.current = null;
    startAutoplay();
  };

  // ── Visible reviews ───────────────────────────────────────────
  const visibleReviews = reviews.slice(offset, offset + visibleCount);

  // Loading
  if (loading) {
    return (
      <section className="hr-section">
        <div className="hr-content">
          <div className="hr-header">
            <p className="hr-eyebrow">
              <span className="hr-eye-line" />
              Customer Voices
              <span className="hr-eye-line" />
            </p>
            <h2 className="hr-title">
              What Our Customers <em>Say</em>
            </h2>
          </div>
          <div className="hr-skeleton-row">
            {[1, 2, 3].map((i) => (
              <div key={i} className="hr-skeleton-card">
                <div className="hr-skeleton-circle" />
                <div className="hr-skeleton-line hr-skeleton-line--short" />
                <div className="hr-skeleton-stars" />
                <div className="hr-skeleton-line" />
                <div className="hr-skeleton-line" />
                <div className="hr-skeleton-line hr-skeleton-line--short" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  const avgRating = (
    reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  ).toFixed(1);
  const showNav = totalSlides > visibleCount;

  return (
    <section className="hr-section">
      {/* Decorative background */}
      <div className="hr-bg-orb hr-bg-orb--1" />
      <div className="hr-bg-orb hr-bg-orb--2" />
      <div className="hr-bg-grid" />

      <div className="hr-content">
        {/* ── Header ── */}
        <div className="hr-header">
          <p className="hr-eyebrow">
            <span className="hr-eye-line" />
            Customer Voices
            <span className="hr-eye-line" />
          </p>
          <h2 className="hr-title">
            What Our Customers <em>Say</em>
          </h2>
          <p className="hr-subtitle">
            Real experiences from people who love what they bought
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="hr-stats">
          <div className="hr-stat">
            <span className="hr-stat-num">{reviews.length}+</span>
            <span className="hr-stat-label">Verified Reviews</span>
          </div>
          <div className="hr-stat-sep" />
          <div className="hr-stat">
            <span className="hr-stat-num">{avgRating}</span>
            <span className="hr-stat-label">Average Rating</span>
          </div>
          <div className="hr-stat-sep" />
          <div className="hr-stat">
            <span className="hr-stat-num">98%</span>
            <span className="hr-stat-label">Happy Customers</span>
          </div>
        </div>

        {/* ── Slider Stage ── */}
        <div
          className="hr-stage-wrap"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
        >
          {/* Left arrow */}
          {showNav && (
            <button
              className="hr-arrow hr-arrow--prev"
              onClick={prev}
              aria-label="Previous"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Cards grid — KEY FIX: no opacity trick, always visible */}
          <div
            className={`hr-cards-grid hr-cards-grid--${visibleCount} hr-cards-grid--anim-${animDir}`}
          >
            {visibleReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {/* Right arrow */}
          {showNav && (
            <button
              className="hr-arrow hr-arrow--next"
              onClick={next}
              aria-label="Next"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Dot indicators ── */}
        {showNav && (
          <div className="hr-dots">
            {Array.from({ length: Math.ceil(totalSlides / visibleCount) }).map(
              (_, i) => {
                const pageOffset = i * visibleCount;
                const isActive =
                  offset >= pageOffset && offset < pageOffset + visibleCount;
                return (
                  <button
                    key={i}
                    className={`hr-dot${isActive ? " hr-dot--active" : ""}`}
                    onClick={() => {
                      stopAutoplay();
                      setOffset(
                        Math.min(pageOffset, totalSlides - visibleCount)
                      );
                      startAutoplay();
                    }}
                    aria-label={`Page ${i + 1}`}
                  />
                );
              }
            )}
          </div>
        )}
      </div>
    </section>
  );
}
