// app/components/ProductReviews.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";

export interface Review {
  id: string;
  product_id: string;
  name: string;
  email: string;
  title: string;
  body: string;
  rating: number;
  images: string[];
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
}

// ── Star Icon Component ───────────────────────────────────────
function StarIcon({
  filled,
  half = false,
  size = 14,
}: {
  filled: boolean;
  half?: boolean;
  size?: number;
}) {
  if (half) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="half-grad">
            <stop offset="50%" stopColor="#b8963e" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <polygon
          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          fill="url(#half-grad)"
          stroke="#b8963e"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
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

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} filled={i <= Math.round(rating)} size={size} />
      ))}
    </div>
  );
}

// ── Reviews Swiper Component ──────────────────────────────────
function ReviewsSwiper({ reviews }: { reviews: Review[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const dragStart = useRef<{ x: number } | null>(null);
  const touchStart = useRef<{ x: number } | null>(null);
  const progressStart = useRef<number>(0);
  const AUTOPLAY_DURATION = 5500;

  // ── Progress ──────────────────────────────────────────────
  const startProgress = useCallback(() => {
    setProgress(0);
    progressStart.current = Date.now();
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStart.current;
      setProgress(Math.min((elapsed / AUTOPLAY_DURATION) * 100, 100));
    }, 30);
  }, []);

  const stopProgress = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  // ── Navigate ──────────────────────────────────────────────
  const goTo = useCallback(
    (idx: number) => {
      if (isTransitioning || reviews.length === 0) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIdx(
          ((idx % reviews.length) + reviews.length) % reviews.length
        );
        setIsTransitioning(false);
      }, 320);
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

  // ── Autoplay ──────────────────────────────────────────────
  useEffect(() => {
    if (reviews.length <= 1 || isPaused) return;
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

  // ── Mouse drag ────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStart.current = { x: e.clientX };
    setIsDragging(false);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStart.current && Math.abs(e.clientX - dragStart.current.x) > 5)
      setIsDragging(true);
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    if (Math.abs(dx) > 55) {
      dx > 0 ? prev() : next();
    }
    dragStart.current = null;
    setTimeout(() => setIsDragging(false), 50);
  };

  // ── Touch swipe ───────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    if (Math.abs(dx) > 50) {
      dx > 0 ? prev() : next();
    }
    touchStart.current = null;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (reviews.length === 0) return null;
  const current = reviews[activeIdx];

  return (
    <div className="pd-swiper-reviews">
      {/* ── Main Card ── */}
      <div
        className="pd-swiper-stage"
        onMouseEnter={() => {
          setIsPaused(true);
          stopProgress();
        }}
        onMouseLeave={() => setIsPaused(false)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div
          className={`pd-swiper-card${
            isTransitioning ? " pd-swiper-card--exit" : ""
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gold accent bar */}
          <div className="pd-swiper-accent" />

          {/* Quote icon */}
          <svg className="pd-swiper-quote" viewBox="0 0 48 36" fill="none">
            <path
              d="M0 36V22.5C0 16.5 1.5 11.5 4.5 7.5C7.5 3.5 11.5 1 16.5 0L18 3C14.5 4 11.75 6 9.75 9C7.75 12 6.75 15.5 6.75 19.5H13.5V36H0ZM27 36V22.5C27 16.5 28.5 11.5 31.5 7.5C34.5 3.5 38.5 1 43.5 0L45 3C41.5 4 38.75 6 36.75 9C34.75 12 33.75 15.5 33.75 19.5H40.5V36H27Z"
              fill="currentColor"
            />
          </svg>

          {/* Stars */}
          <div className="pd-swiper-stars">
            <StarDisplay rating={current.rating} size={15} />
          </div>

          {/* Title */}
          <h4 className="pd-swiper-card-title">
            &ldquo;{current.title}&rdquo;
          </h4>

          {/* Body */}
          <p className="pd-swiper-card-body">{current.body}</p>

          {/* Review Images */}
          {current.images && current.images.length > 0 && (
            <div className="pd-swiper-imgs">
              {current.images.slice(0, 4).map((img, idx) => (
                <div key={idx} className="pd-swiper-img-wrap">
                  <img
                    src={img}
                    alt={`Review photo ${idx + 1}`}
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Author */}
          <div className="pd-swiper-author">
            <div className="pd-swiper-avatar">
              {current.name.charAt(0).toUpperCase()}
            </div>
            <div className="pd-swiper-author-text">
              <span className="pd-swiper-author-name">{current.name}</span>
              <span className="pd-swiper-author-date">
                {formatDate(current.created_at)}
              </span>
            </div>
            <div className="pd-swiper-verified">
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
          {reviews.length > 1 && (
            <div className="pd-swiper-progress-track">
              <div
                className="pd-swiper-progress-fill"
                style={{
                  width: `${progress}%`,
                  transition: isPaused ? "none" : "width 0.03s linear",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Controls ── */}
      {reviews.length > 1 && (
        <div className="pd-swiper-controls">
          <button
            className="pd-swiper-arrow pd-swiper-arrow--prev"
            onClick={prev}
            aria-label="Previous"
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

          <div className="pd-swiper-dots">
            {reviews.map((_, i) => (
              <button
                key={i}
                className={`pd-swiper-dot${
                  i === activeIdx ? " pd-swiper-dot--active" : ""
                }`}
                onClick={() => {
                  goTo(i);
                  startProgress();
                }}
                aria-label={`Review ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="pd-swiper-arrow pd-swiper-arrow--next"
            onClick={next}
            aria-label="Next"
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
      )}

      {/* Counter */}
      {reviews.length > 1 && (
        <p className="pd-swiper-counter">
          <span className="pd-swiper-counter-cur">
            {String(activeIdx + 1).padStart(2, "0")}
          </span>
          <span className="pd-swiper-counter-sep">/</span>
          <span className="pd-swiper-counter-tot">
            {String(reviews.length).padStart(2, "0")}
          </span>
        </p>
      )}
    </div>
  );
}

// ── Main ProductReviews Component ─────────────────────────────
export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reviews:", error);
      } else {
        setReviews(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setTitle("");
    setBody("");
    setRating(0);
    setHoverRating(0);
    setImageFiles([]);
    setImagePreviews([]);
    setErrors({});
    setSubmitError("");
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...toAdd]);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Valid email required";
    if (!title.trim()) e.title = "Title is required";
    if (!body.trim()) e.body = "Review is required";
    if (rating === 0) e.rating = "Please select a rating";
    return e;
  };

  // ── Timeout wrapper — promise ko max N ms me resolve karta hai ──
  const withTimeout = <T,>(
    promise: Promise<T>,
    ms: number,
    fallback: T
  ): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitError("");
    setSubmitting(true);

    try {
      // ── Step 1: Image upload (max 8s per image, skip on timeout) ──
      const uploadedUrls: string[] = [];
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          try {
            const url = await withTimeout(
              uploadToCloudinary(file),
              8000,
              "" // timeout pe empty string — skip this image
            );
            if (url) uploadedUrls.push(url);
          } catch {
            // Upload fail hoi — review bina image ke submit karo
          }
        }
      }

      // ── Step 2: Insert review (max 10s) ──
      // withTimeout needs a real Promise — wrap the builder.
      // Fallback cast to "any" avoids PostgrestSingleResponse shape mismatch.
      const insertResult = await withTimeout(
        Promise.resolve(
          supabase.from("product_reviews").insert({
            product_id: productId,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            title: title.trim(),
            body: body.trim(),
            rating: Number(rating),
            images: uploadedUrls,
          })
        ) as Promise<any>,
        10000,
        {
          error: {
            message: "Request timed out. Please try again.",
            code: "TIMEOUT",
          },
          data: null,
          count: null,
          status: 408,
          statusText: "Request Timeout",
        } as any
      );

      const insertError = (insertResult as any)?.error;

      if (insertError) {
        // Supabase PostgrestError — extract all fields properly
        const msg =
          (insertError as any).message ||
          (insertError as any).details ||
          "Failed to submit review. Please try again.";
        console.error("Insert error:", {
          message: (insertError as any).message,
          details: (insertError as any).details,
          hint: (insertError as any).hint,
          code: (insertError as any).code,
        });
        setSubmitError(msg);
        return;
      }

      // ── Step 3: Success — immediately show toast, reset form ──
      resetForm();
      setShowForm(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);

      // ── Step 4: Background refresh (non-blocking, max 5s) ──
      withTimeout(fetchReviews(), 5000, undefined).catch(() => {});
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      console.error("Unexpected submit error:", err);
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="pd-reviews-section pd-reveal">
      <div className="pd-reviews-header">
        <p className="pd-reviews-eyebrow">
          <span className="pd-reviews-eye-line" />
          Customer Voices
          <span className="pd-reviews-eye-line" />
        </p>
        <h2 className="pd-reviews-title">
          Reviews &amp; <em>Ratings</em>
        </h2>
      </div>

      {reviews.length > 0 && (
        <div className="pd-rating-summary">
          <div className="pd-rating-big">
            <span className="pd-rating-num">{avgRating.toFixed(1)}</span>
            <div className="pd-rating-stars-big">
              <StarDisplay rating={avgRating} size={18} />
            </div>
            <span className="pd-rating-count">
              {reviews.length} Review{reviews.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="pd-rating-bars">
            {breakdown.map(({ star, count }) => (
              <div key={star} className="pd-rating-bar-row">
                <span className="pd-bar-label">{star} ★</span>
                <div className="pd-bar-track">
                  <div
                    className="pd-bar-fill"
                    style={{
                      width:
                        reviews.length > 0
                          ? `${(count / reviews.length) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
                <span className="pd-bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {submitted && (
        <div className="pd-review-success" style={{ marginBottom: "1.5rem" }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Review submitted successfully — thank you!
        </div>
      )}

      {!showForm && (
        <div style={{ marginBottom: "2rem" }}>
          <button
            className="pd-write-review-btn"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Write a Review
          </button>
        </div>
      )}

      {showForm && (
        <div className="pd-review-form-wrap">
          <h3 className="pd-review-form-title">Share Your Experience</h3>
          <p className="pd-review-form-sub">
            Your review helps others make confident decisions
          </p>

          {submitError && (
            <div className="pd-review-error" style={{ marginBottom: "1.5rem" }}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {submitError}
            </div>
          )}

          <div className="pd-review-form">
            <div className="pd-review-form-row">
              <div className="pd-form-group">
                <label className="pd-form-label">Your Name *</label>
                <input
                  className="pd-form-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={errors.name ? { borderColor: "var(--pd-error)" } : {}}
                />
                {errors.name && (
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--pd-error)",
                      fontFamily: "var(--pd-sans)",
                    }}
                  >
                    {errors.name}
                  </span>
                )}
              </div>
              <div className="pd-form-group">
                <label className="pd-form-label">Email Address *</label>
                <input
                  className="pd-form-input"
                  placeholder="john@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={errors.email ? { borderColor: "var(--pd-error)" } : {}}
                />
                {errors.email && (
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--pd-error)",
                      fontFamily: "var(--pd-sans)",
                    }}
                  >
                    {errors.email}
                  </span>
                )}
              </div>
            </div>

            <div className="pd-star-picker">
              <label className="pd-form-label">Your Rating *</label>
              <div className="pd-star-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="pd-star-btn"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} stars`}
                  >
                    <StarIcon
                      filled={star <= (hoverRating || rating)}
                      size={28}
                    />
                  </button>
                ))}
                {(hoverRating || rating) > 0 && (
                  <span
                    style={{
                      fontFamily: "var(--pd-sans)",
                      fontSize: "0.65rem",
                      color: "var(--pd-gold)",
                      alignSelf: "center",
                      marginLeft: "0.5rem",
                    }}
                  >
                    {
                      ["", "Poor", "Fair", "Good", "Great", "Excellent"][
                        hoverRating || rating
                      ]
                    }
                  </span>
                )}
              </div>
              {errors.rating && (
                <span
                  style={{
                    fontSize: "0.6rem",
                    color: "var(--pd-error)",
                    fontFamily: "var(--pd-sans)",
                  }}
                >
                  {errors.rating}
                </span>
              )}
            </div>

            <div className="pd-form-group">
              <label className="pd-form-label">Review Title *</label>
              <input
                className="pd-form-input"
                placeholder="Summarise your experience"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={errors.title ? { borderColor: "var(--pd-error)" } : {}}
              />
              {errors.title && (
                <span
                  style={{
                    fontSize: "0.6rem",
                    color: "var(--pd-error)",
                    fontFamily: "var(--pd-sans)",
                  }}
                >
                  {errors.title}
                </span>
              )}
            </div>

            <div className="pd-form-group">
              <label className="pd-form-label">Your Review *</label>
              <textarea
                className="pd-form-textarea"
                placeholder="Tell us about your experience"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                style={errors.body ? { borderColor: "var(--pd-error)" } : {}}
              />
              {errors.body && (
                <span
                  style={{
                    fontSize: "0.6rem",
                    color: "var(--pd-error)",
                    fontFamily: "var(--pd-sans)",
                  }}
                >
                  {errors.body}
                </span>
              )}
            </div>

            <div className="pd-review-img-upload">
              <label className="pd-form-label">
                Add Photos (optional, up to 5)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleImageAdd}
              />
              {imageFiles.length < 5 && (
                <div
                  className="pd-upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && fileInputRef.current?.click()
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="pd-upload-zone-text">
                    <span>Click to upload</span> or drag &amp; drop
                  </p>
                </div>
              )}
              {imagePreviews.length > 0 && (
                <div className="pd-review-img-previews">
                  {imagePreviews.map((src, idx) => (
                    <div key={idx} className="pd-review-img-preview">
                      <img src={src} alt={`Preview ${idx + 1}`} />
                      <button
                        className="pd-review-img-remove"
                        onClick={() => removeImage(idx)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pd-review-form-actions">
              <button
                type="button"
                className="pd-review-cancel"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pd-review-submit"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="pd-review-submit-spinner" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    <span>Submit Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reviews List Header ── */}
      <div className="pd-reviews-list-header">
        <h3 className="pd-reviews-list-title">Customer Reviews</h3>
        {reviews.length > 0 && (
          <span className="pd-reviews-list-count">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Reviews Content ── */}
      {loadingReviews ? (
        <div className="pd-reviews-loading">
          <div className="pd-reviews-loading-dot" />
          <div className="pd-reviews-loading-dot" />
          <div className="pd-reviews-loading-dot" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="pd-reviews-empty">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <p>No reviews yet — be the first to share your experience</p>
        </div>
      ) : reviews.length === 1 ? (
        /* Single review — show normal card */
        <div className="pd-reviews-list">
          <div className="pd-review-card">
            <div className="pd-review-card-top">
              <div className="pd-review-author">
                <div className="pd-review-avatar">
                  {reviews[0].name.charAt(0).toUpperCase()}
                </div>
                <div className="pd-review-author-info">
                  <span className="pd-review-author-name">
                    {reviews[0].name}
                  </span>
                  <span className="pd-review-date">
                    {new Date(reviews[0].created_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                </div>
              </div>
              <div className="pd-review-stars">
                <StarDisplay rating={reviews[0].rating} size={14} />
              </div>
            </div>
            <h4 className="pd-review-card-title">{reviews[0].title}</h4>
            <p className="pd-review-body">{reviews[0].body}</p>
            {reviews[0].images && reviews[0].images.length > 0 && (
              <div className="pd-review-images">
                {reviews[0].images.map((img, idx) => (
                  <div key={idx} className="pd-review-img-thumb">
                    <img src={img} alt={`Review image ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Multiple reviews — Luxury Swiper */
        <ReviewsSwiper reviews={reviews} />
      )}
    </section>
  );
}
