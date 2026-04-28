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

// Star Icon Component
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
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        try {
          const url = await uploadToCloudinary(file);
          uploadedUrls.push(url);
        } catch (err) {
          console.error("Failed to upload image:", err);
        }
      }

      const { error: insertError } = await supabase
        .from("product_reviews")
        .insert({
          product_id: productId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          title: title.trim(),
          body: body.trim(),
          rating: rating,
          images: uploadedUrls,
        });

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        setSubmitError(
          insertError.message || "Failed to submit review. Please try again."
        );
        return;
      }

      // Update product rating & reviews_count
      const { data: allReviews } = await supabase
        .from("product_reviews")
        .select("rating")
        .eq("product_id", productId);

      if (allReviews && allReviews.length > 0) {
        const newAvg =
          allReviews.reduce(
            (s: number, r: { rating: number }) => s + r.rating,
            0
          ) / allReviews.length;
        await supabase
          .from("products")
          .update({
            rating: Math.round(newAvg * 10) / 10,
            reviews_count: allReviews.length,
          })
          .eq("id", productId);
      }

      resetForm();
      setShowForm(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      await fetchReviews();
    } catch (err: unknown) {
      console.error("Unexpected error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
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
                    <span>Click to upload</span> or drag & drop
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

      <div className="pd-reviews-list-header">
        <h3 className="pd-reviews-list-title">Customer Reviews</h3>
        {reviews.length > 0 && (
          <span className="pd-reviews-list-count">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

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
      ) : (
        <div className="pd-reviews-list">
          {reviews.map((review) => (
            <div key={review.id} className="pd-review-card">
              <div className="pd-review-card-top">
                <div className="pd-review-author">
                  <div className="pd-review-avatar">
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="pd-review-author-info">
                    <span className="pd-review-author-name">{review.name}</span>
                    <span className="pd-review-date">
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="pd-review-stars">
                  <StarDisplay rating={review.rating} size={14} />
                </div>
              </div>
              <h4 className="pd-review-card-title">{review.title}</h4>
              <p className="pd-review-body">{review.body}</p>
              {review.images && review.images.length > 0 && (
                <div className="pd-review-images">
                  {review.images.map((img, idx) => (
                    <div key={idx} className="pd-review-img-thumb">
                      <img src={img} alt={`Review image ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
