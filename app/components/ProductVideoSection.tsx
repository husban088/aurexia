// app/components/ProductVideoSection.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import "./ProductVideoSection.css";

interface ProductVideoSectionProps {
  videoUrl: string | null;
  productName: string;
}

export default function ProductVideoSection({
  videoUrl,
  productName,
}: ProductVideoSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  // No video — return null (no white space, no text)
  if (!videoUrl || videoUrl.trim() === "") {
    return null;
  }

  // Intersection Observer for scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (videoRef.current && !isPlaying) {
              // Auto-play when visible
              videoRef.current.play().catch(() => {
                // Autoplay prevented by browser — mute and try again
                if (videoRef.current) {
                  videoRef.current.muted = true;
                  videoRef.current.play().catch(() => {});
                }
              });
            }
          } else {
            setIsVisible(false);
            if (videoRef.current && isPlaying) {
              videoRef.current.pause();
            }
          }
        });
      },
      { threshold: 0.3 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);
  const handleVideoEnded = () => setIsPlaying(false);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      ref={sectionRef}
      className={`pvs-root ${isVisible ? "visible" : ""}`}
      data-video-present="true"
    >
      {/* Ambient Glow - Behind Video */}
      <div className="pvs-ambient" aria-hidden="true" />

      {/* Main Container */}
      <div className="pvs-container">
        {/* Decorative Corner Elements */}
        <div className="pvs-corner pvs-corner--tl" aria-hidden="true" />
        <div className="pvs-corner pvs-corner--tr" aria-hidden="true" />
        <div className="pvs-corner pvs-corner--bl" aria-hidden="true" />
        <div className="pvs-corner pvs-corner--br" aria-hidden="true" />

        {/* Section Header */}
        <div className="pvs-header">
          <div className="pvs-eyebrow">
            <span className="pvs-ey-line" />
            <span className="pvs-ey-text">Experience the Luxury</span>
            <span className="pvs-ey-line pvs-ey-line--right" />
          </div>
          <h2 className="pvs-title">
            Watch <em>{productName}</em> in Action
          </h2>
          <div className="pvs-subtitle">
            <div className="pvs-sub-line" />
            <span>Immerse yourself in every detail</span>
            <div className="pvs-sub-line pvs-sub-line--right" />
          </div>
        </div>

        {/* Video Wrapper with Glassmorphism */}
        <div className="pvs-video-wrapper">
          <div className="pvs-glass-overlay" aria-hidden="true" />

          {/* Video Element */}
          <video
            ref={videoRef}
            className="pvs-video"
            src={videoUrl}
            poster=""
            loop
            muted={isMuted}
            playsInline
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onEnded={handleVideoEnded}
            preload="metadata"
          />

          {/* Video Controls Overlay */}
          <div
            className={`pvs-controls-overlay ${!isPlaying ? "visible" : ""}`}
          >
            <button
              className="pvs-play-btn"
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {!isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mute Toggle Button */}
          <button
            className="pvs-mute-btn"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

          {/* Progress Bar */}
          <div className="pvs-progress-bar">
            <div
              className="pvs-progress-fill"
              style={{
                width: videoRef.current
                  ? (videoRef.current.currentTime / videoRef.current.duration) *
                      100 +
                    "%"
                  : "0%",
              }}
            />
          </div>
        </div>

        {/* Decorative Floating Particles */}
        <div className="pvs-particles" aria-hidden="true">
          <div className="pvs-particle" />
          <div className="pvs-particle" />
          <div className="pvs-particle" />
          <div className="pvs-particle" />
          <div className="pvs-particle" />
          <div className="pvs-particle" />
        </div>
      </div>
    </div>
  );
}
