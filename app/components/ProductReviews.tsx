// app/components/ProductReviews.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import "@/app/components/ProductReviews.css";

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

// ── Simple memory cache only (no localStorage to avoid hydration issues) ──
const reviewCache: Record<string, Review[]> = {};
let activeFetches: Record<string, Promise<Review[]>> = {};

// ── Stars Component ──
function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="pr-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`pr-star${i <= Math.round(rating) ? " pr-star--filled" : ""}`}
          width={size}
          height={size}
          viewBox="0 0 24 24"
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

// ── Single Review Card ──
function ReviewCard({ review }: { review: Review }) {
  const firstImage =
    review.images && review.images.length > 0 ? review.images[0] : null;
  const initial = review.name.charAt(0).toUpperCase();

  return (
    <div className="pr-card">
      <div className="pr-card-shimmer" />
      <div className="pr-card-quote">&ldquo;</div>
      <div className="pr-card-avatar-wrap">
        {firstImage ? (
          <img
            src={firstImage}
            alt={review.name}
            className="pr-card-avatar-img"
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const sib = e.currentTarget
                .nextElementSibling as HTMLElement | null;
              if (sib) sib.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="pr-card-avatar-fallback"
          style={{ display: firstImage ? "none" : undefined }}
        >
          {initial}
        </div>
        <div className="pr-card-badge">
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
      <h4 className="pr-card-name">{review.name}</h4>
      <StarDisplay rating={review.rating} size={16} />
      <h3 className="pr-card-title">&ldquo;{review.title}&rdquo;</h3>
      <p className="pr-card-body">{review.body}</p>
      <div className="pr-card-bottom-line" />
    </div>
  );
}

// ── Reviews Slider ──
function ReviewsSlider({ reviews }: { reviews: Review[] }) {
  const [visibleCount, setVisibleCount] = useState(3);
  const [offset, setOffset] = useState(0);
  const [animDir, setAnimDir] = useState<"idle" | "left" | "right">("idle");
  const dragStart = useRef<number | null>(null);
  const touchStart = useRef<number | null>(null);
  const isDragging = useRef(false);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const totalSlides = reviews.length;
  const showNav = totalSlides > visibleCount;

  const go = useCallback(
    (dir: "left" | "right") => {
      if (animDir !== "idle") return;
      setAnimDir(dir);
      setTimeout(() => {
        setOffset((prev) => {
          if (dir === "right") {
            const n = prev + 1;
            return n + visibleCount > totalSlides ? 0 : n;
          } else {
            const n = prev - 1;
            return n < 0 ? Math.max(0, totalSlides - visibleCount) : n;
          }
        });
        setAnimDir("idle");
      }, 450);
    },
    [animDir, totalSlides, visibleCount],
  );

  const next = useCallback(() => go("right"), [go]);
  const prev = useCallback(() => go("left"), [go]);

  const startAutoplay = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    if (totalSlides > visibleCount)
      autoTimer.current = setInterval(() => next(), 5000);
  }, [next, totalSlides, visibleCount]);

  const stopAutoplay = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
  }, []);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStart.current = e.clientX;
    isDragging.current = false;
    stopAutoplay();
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (
      dragStart.current !== null &&
      Math.abs(e.clientX - dragStart.current) > 8
    ) {
      isDragging.current = true;
    }
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

  const visibleReviews = reviews.slice(offset, offset + visibleCount);
  const pages = Math.ceil(totalSlides / visibleCount);
  const currentPage = Math.floor(offset / visibleCount);

  return (
    <div className="pr-slider">
      <div
        className="pr-stage-wrap"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
      >
        {showNav && (
          <button
            className="pr-arrow pr-arrow--prev"
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
        <div
          className={`pr-cards-grid pr-cards-grid--${visibleCount} pr-cards-grid--anim-${animDir}`}
        >
          {visibleReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
        {showNav && (
          <button
            className="pr-arrow pr-arrow--next"
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
      {showNav && (
        <div className="pr-dots">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              className={`pr-dot${i === currentPage ? " pr-dot--active" : ""}`}
              onClick={() => {
                stopAutoplay();
                setOffset(
                  Math.min(i * visibleCount, totalSlides - visibleCount),
                );
                startAutoplay();
              }}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cloudinary upload helper ──
async function uploadImageSafe(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<string | null> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_REVIEW_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Cloudinary env vars missing");
    onProgress?.("Config error — uploading without image");
    return null;
  }

  let uploadFile = file;
  if (file.size > 1_500_000) {
    try {
      uploadFile = await compressImage(file, 1200, 0.82);
    } catch {
      /* fallback to original */
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("upload_preset", uploadPreset);

    const r = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: fd,
        signal: controller.signal,
      },
    );

    if (!r.ok) return null;
    const j = await r.json();
    return j?.secure_url ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function compressImage(
  file: File,
  maxWidth: number,
  quality: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas toBlob failed"));
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Main ProductReviews Component ──
export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(
    () => reviewCache[productId] ?? [],
  );
  const [loadingReviews, setLoadingReviews] = useState(
    () => !reviewCache[productId],
  );
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
  const [submitError, setSubmitError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch reviews - with cache and deduplication
  const fetchReviews = useCallback(
    async (forceRefresh = false) => {
      if (!productId) return;

      // Cache hit - skip fetch
      if (!forceRefresh && reviewCache[productId]) {
        setReviews(reviewCache[productId]);
        setLoadingReviews(false);
        return;
      }

      // Already fetching - wait for it
      if (activeFetches[productId]) {
        const data = await activeFetches[productId];
        if (mountedRef.current) {
          reviewCache[productId] = data;
          setReviews(data);
          setLoadingReviews(false);
        }
        return;
      }

      setLoadingReviews(true);

      const promise = (async () => {
        try {
          const { data, error } = await supabase
            .from("product_reviews")
            .select("*")
            .eq("product_id", productId)
            .order("created_at", { ascending: false });

          if (error) return [];
          return data || [];
        } catch {
          return [];
        }
      })();

      activeFetches[productId] = promise;
      const result = await promise;
      delete activeFetches[productId];

      if (mountedRef.current) {
        reviewCache[productId] = result;
        setReviews(result);
        setLoadingReviews(false);
      }
    },
    [productId],
  );

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle online/offline
  useEffect(() => {
    const handleOnline = () => {
      if (!reviewCache[productId] && mountedRef.current) {
        fetchReviews(true);
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [productId, fetchReviews]);

  // Handle page show (bfcache)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && reviewCache[productId]) {
        setReviews(reviewCache[productId]);
        setLoadingReviews(false);
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [productId]);

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
    setUploadStatus("");
  };

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const toAdd = files.slice(0, 5 - imageFiles.length);
    setImageFiles((prev) => [...prev, ...toAdd]);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
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

  const handleSubmit = async () => {
    if (submitting) return;

    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleanProductId = productId?.trim();

    if (!cleanProductId || !UUID_RE.test(cleanProductId)) {
      setSubmitError("Invalid product ID. Please refresh the page.");
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError("");
    setUploadStatus("");
    setSubmitting(true);

    try {
      const uploadedUrls: string[] = [];
      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          if (!mountedRef.current) break;
          setUploadStatus(`Uploading photo ${i + 1} of ${imageFiles.length}…`);
          const url = await uploadImageSafe(imageFiles[i]);
          if (url) uploadedUrls.push(url);
        }
        if (mountedRef.current) setUploadStatus("Saving review…");
      }

      const { error: insertError } = await supabase
        .from("product_reviews")
        .insert({
          product_id: cleanProductId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          title: title.trim(),
          body: body.trim(),
          rating: Number(rating),
          images: uploadedUrls,
        });

      if (insertError) {
        setSubmitError(
          `Submit failed: ${insertError.message || "Unknown error"}`,
        );
        return;
      }

      resetForm();
      setShowForm(false);
      setSubmitted(true);
      // Clear cache for this product
      delete reviewCache[productId];
      await fetchReviews(true);
      setTimeout(() => {
        if (mountedRef.current) setSubmitted(false);
      }, 5000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      if (mountedRef.current) {
        setSubmitting(false);
        setUploadStatus("");
      }
    }
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <section className="pr-section">
      <div className="pr-bg-orb pr-bg-orb--1" />
      <div className="pr-bg-orb pr-bg-orb--2" />
      <div className="pr-bg-orb pr-bg-orb--3" />
      <div className="pr-bg-grid" />
      <div className="pr-sparkle pr-sparkle--1" />
      <div className="pr-sparkle pr-sparkle--2" />
      <div className="pr-sparkle pr-sparkle--3" />
      <div className="pr-sparkle pr-sparkle--4" />
      <div className="pr-sparkle pr-sparkle--5" />
      <div className="pr-sparkle pr-sparkle--6" />

      <div className="pr-content">
        <div className="pr-header">
          <p className="pr-eyebrow">
            <span className="pr-eye-line" />
            Customer Voices
            <span className="pr-eye-line" />
          </p>
          <h2 className="pr-title">
            Reviews &amp; <em>Ratings</em>
          </h2>
        </div>

        {reviews.length > 0 && (
          <div className="pr-summary">
            <div className="pr-summary-left">
              <span className="pr-summary-num">{avgRating.toFixed(1)}</span>
              <StarDisplay rating={avgRating} size={22} />
              <span className="pr-summary-count">
                {reviews.length} Review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="pr-summary-bars">
              {breakdown.map(({ star, count }) => (
                <div key={star} className="pr-bar-row">
                  <span className="pr-bar-label">{star}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24">
                    <polygon
                      points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                      fill="#d4af37"
                    />
                  </svg>
                  <div className="pr-bar-track">
                    <div
                      className="pr-bar-fill"
                      style={{
                        width:
                          reviews.length > 0
                            ? `${(count / reviews.length) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <span className="pr-bar-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {submitted && (
          <div className="pr-toast pr-toast--success">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            Review submitted successfully — thank you!
          </div>
        )}

        {!showForm && (
          <button
            className="pr-write-btn"
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
        )}

        {showForm && (
          <div className="pr-form-wrap">
            <div className="pr-form-header">
              <h3 className="pr-form-title">Share Your Experience</h3>
              <p className="pr-form-sub">
                Your review helps others make confident decisions
              </p>
            </div>

            {submitError && (
              <div className="pr-error-banner">
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
                <span>{submitError}</span>
              </div>
            )}

            <div className="pr-form">
              <div className="pr-form-row">
                <div className="pr-form-group">
                  <label className="pr-form-label">
                    Your Name <span className="pr-req">*</span>
                  </label>
                  <input
                    className={`pr-form-input${errors.name ? " pr-input--error" : ""}`}
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && (
                    <span className="pr-form-error">{errors.name}</span>
                  )}
                </div>
                <div className="pr-form-group">
                  <label className="pr-form-label">
                    Email Address <span className="pr-req">*</span>
                  </label>
                  <input
                    className={`pr-form-input${errors.email ? " pr-input--error" : ""}`}
                    placeholder="john@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && (
                    <span className="pr-form-error">{errors.email}</span>
                  )}
                </div>
              </div>

              <div className="pr-form-group">
                <label className="pr-form-label">
                  Your Rating <span className="pr-req">*</span>
                </label>
                <div className="pr-star-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`pr-star-btn${star <= (hoverRating || rating) ? " pr-star-btn--active" : ""}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      aria-label={`Rate ${star} stars`}
                    >
                      <svg viewBox="0 0 24 24" width="30" height="30">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                    </button>
                  ))}
                  {(hoverRating || rating) > 0 && (
                    <span className="pr-star-label">
                      {ratingLabels[hoverRating || rating]}
                    </span>
                  )}
                </div>
                {errors.rating && (
                  <span className="pr-form-error">{errors.rating}</span>
                )}
              </div>

              <div className="pr-form-group">
                <label className="pr-form-label">
                  Review Title <span className="pr-req">*</span>
                </label>
                <input
                  className={`pr-form-input${errors.title ? " pr-input--error" : ""}`}
                  placeholder="Summarise your experience"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {errors.title && (
                  <span className="pr-form-error">{errors.title}</span>
                )}
              </div>

              <div className="pr-form-group">
                <label className="pr-form-label">
                  Your Review <span className="pr-req">*</span>
                </label>
                <textarea
                  className={`pr-form-textarea${errors.body ? " pr-input--error" : ""}`}
                  placeholder="Tell us about your experience with this product..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                />
                {errors.body && (
                  <span className="pr-form-error">{errors.body}</span>
                )}
              </div>

              <div className="pr-form-group">
                <label className="pr-form-label">
                  Add Photos{" "}
                  <span className="pr-optional">(optional, up to 5)</span>
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
                    className="pr-upload-zone"
                    onClick={() => fileInputRef.current?.click()}
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
                    <p className="pr-upload-text">
                      <span>Click to upload</span> or drag &amp; drop
                    </p>
                    <p className="pr-upload-sub">
                      PNG, JPG, WEBP up to 10MB each
                    </p>
                  </div>
                )}
                {imagePreviews.length > 0 && (
                  <div className="pr-previews">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="pr-preview-item">
                        <img src={src} alt={`Preview ${idx + 1}`} />
                        <button
                          className="pr-preview-remove"
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

              <div className="pr-form-actions">
                <button
                  type="button"
                  className="pr-btn-cancel"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="pr-btn-submit"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="pr-spinner" />
                      {uploadStatus || "Submitting…"}
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
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pr-list-header">
          <h3 className="pr-list-title">Customer Reviews</h3>
          {reviews.length > 0 && (
            <span className="pr-list-count">
              {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loadingReviews ? (
          <div className="pr-skeleton-row">
            {[1, 2, 3].map((i) => (
              <div key={i} className="pr-skeleton-card">
                <div className="pr-skeleton-circle" />
                <div className="pr-skeleton-line pr-skeleton-line--short" />
                <div className="pr-skeleton-stars-skel" />
                <div className="pr-skeleton-line" />
                <div className="pr-skeleton-line" />
                <div className="pr-skeleton-line pr-skeleton-line--short" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="pr-empty">
            <div className="pr-empty-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="pr-empty-text">No reviews yet</p>
            <p className="pr-empty-sub">
              Be the first to share your experience
            </p>
          </div>
        ) : (
          <ReviewsSlider reviews={reviews} />
        )}
      </div>

      <style jsx>{`
        .pr-error-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px 18px;
          margin-bottom: 20px;
          border-radius: 10px;
          background: rgba(220, 38, 38, 0.12);
          border: 1.5px solid rgba(220, 38, 38, 0.5);
          color: #ef4444;
          font-size: 14px;
          line-height: 1.6;
          word-break: break-word;
        }
        .pr-error-banner svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }
      `}</style>
    </section>
  );
}
