"use client";

import { useState, useRef, useCallback } from "react";
import PanelNavbar from "@/app/components/PanelNavbar";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import "../panel.css";
import "./add-product.css";

// ── Toast ──────────────────────────────────────────────────────────────────
type Toast = {
  id: number;
  type: "success" | "error" | "info";
  title: string;
  msg: string;
  exiting?: boolean;
};

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: number) => void;
}) {
  return (
    <div className="ap-toast-wrap">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`ap-toast ap-toast--${t.type}${
            t.exiting ? " exiting" : ""
          }`}
        >
          <div className="ap-toast-icon">
            {t.type === "success" && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {t.type === "error" && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
            {t.type === "info" && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
              </svg>
            )}
          </div>
          <div className="ap-toast-body">
            <p className="ap-toast-title">{t.title}</p>
            <p className="ap-toast-msg">{t.msg}</p>
          </div>
          <button className="ap-toast-close" onClick={() => onRemove(t.id)}>
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
      ))}
    </div>
  );
}

// ── Tabs config ─────────────────────────────────────────────────────────────
const TABS = [
  {
    id: "phones-new",
    label: "New Phones",
    category: "Mobiles",
    sub: "New Phones",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    id: "phones-used",
    label: "Used Phones",
    category: "Mobiles",
    sub: "Used Phones",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M12 18h.01" />
        <path d="M10 6h4" />
      </svg>
    ),
  },
  {
    id: "phones-refurb",
    label: "Refurbished",
    category: "Mobiles",
    sub: "Refurbished Phones",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
      </svg>
    ),
  },
  {
    id: "chargers",
    label: "Chargers",
    category: "Accessories",
    sub: "Chargers",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M5 18H3a2 2 0 01-2-2V8a2 2 0 012-2h16a2 2 0 012 2v8a2 2 0 01-2 2h-2" />
        <path d="M12 22V12l-4 4h8l-4-4" />
      </svg>
    ),
  },
  {
    id: "cables",
    label: "Cables",
    category: "Accessories",
    sub: "Cables",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M17 17H7a5 5 0 010-10h10" />
        <path d="M21 7l-4-4-4 4M17 3v14" />
      </svg>
    ),
  },
  {
    id: "covers",
    label: "Covers",
    category: "Accessories",
    sub: "Covers",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    id: "screen",
    label: "Screen Guards",
    category: "Accessories",
    sub: "Screen Protectors",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
      </svg>
    ),
  },
  {
    id: "earbuds",
    label: "Earbuds",
    category: "Accessories",
    sub: "Earbuds",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M3 18v-6a9 9 0 0118 0v6" />
        <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z" />
        <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
      </svg>
    ),
  },
  {
    id: "powerbanks",
    label: "Power Banks",
    category: "Accessories",
    sub: "Power Banks",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="7" width="18" height="11" rx="2" />
        <path d="M22 11v3M7 12h4l-2 4 4-4h-3" />
      </svg>
    ),
  },
  {
    id: "smartwatches",
    label: "Smart Watches",
    category: "Gadgets",
    sub: "Smart Watches",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="7" />
        <path d="M12 9v3l2 2" />
        <path d="M9.5 3.5l1 3M14.5 3.5l-1 3M9.5 20.5l1-3M14.5 20.5l-1-3" />
      </svg>
    ),
  },
  {
    id: "electronics",
    label: "Electronics",
    category: "Gadgets",
    sub: "Small Electronics",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: "portable",
    label: "Portable",
    category: "Gadgets",
    sub: "Portable Devices",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    id: "lights",
    label: "Dec. Lights",
    category: "Home Decor",
    sub: "Decorative Lights",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
        <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
        <circle cx="12" cy="12" r="5" />
      </svg>
    ),
  },
  {
    id: "wallitems",
    label: "Wall Items",
    category: "Home Decor",
    sub: "Wall Items",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    id: "homeacc",
    label: "Home Acc.",
    category: "Home Decor",
    sub: "Small Home Accessories",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: "men-watches",
    label: "Men Watches",
    category: "Watches",
    sub: "Men Watches",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="7" />
        <path d="M12 9v3l2 2" />
        <path d="M9 3h6M9 21h6" />
      </svg>
    ),
  },
  {
    id: "women-watches",
    label: "Women Watches",
    category: "Watches",
    sub: "Women Watches",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="7" />
        <path d="M12 9v3l2 2" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
];

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="ap-field">
      <label className="ap-label">
        {label}
        {required && <span>*</span>}
      </label>
      {children}
    </div>
  );
}

// ── ImageUploader ─────────────────────────────────────────────────────────────
// FIXED: removed pointerEvents:none bug, proper per-file upload with XHR progress
function ImageUploader({
  images,
  setImages,
  onError,
}: {
  images: string[];
  setImages: (v: string[]) => void;
  onError: (msg: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState("");
  const [dragover, setDragover] = useState(false);

  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const validFiles = files.filter((f) => f.type.startsWith("image/"));
      if (validFiles.length === 0) {
        onError("Only image files are allowed (JPG, PNG, WEBP)");
        return;
      }

      setUploading(true);
      setProgress(0);
      const uploaded: string[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadLabel(
          `Uploading ${i + 1} of ${validFiles.length}: ${file.name}`
        );
        try {
          const url = await uploadToCloudinary(file);
          uploaded.push(url);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Upload failed";
          onError(`Failed to upload "${file.name}": ${message}`);
        }
        setProgress(Math.round(((i + 1) / validFiles.length) * 100));
      }

      if (uploaded.length > 0) {
        setImages([...images, ...uploaded]);
      }

      setUploading(false);
      setUploadLabel("");

      // Reset file input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
    },
    [images, setImages, onError]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragover(true);
  };

  const handleDragLeave = () => setDragover(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Drop zone — clicking this opens file picker */}
      <div
        className={`ap-img-upload${dragover ? " dragover" : ""}`}
        onClick={() => !uploading && fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{ cursor: uploading ? "not-allowed" : "pointer" }}
      >
        {/* Hidden file input — NOT inside the clickable div's event flow problem */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={handleInputChange}
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        />

        <div className="ap-img-upload-icon">
          {uploading ? (
            <div className="ap-spinner" />
          ) : (
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
          )}
        </div>

        <p className="ap-img-upload-title">
          {uploading ? uploadLabel || "Uploading…" : "Upload Product Images"}
        </p>
        <p className="ap-img-upload-sub">
          {uploading
            ? "Please wait while images upload to Cloudinary"
            : "Click to browse · or drag & drop · JPG, PNG, WEBP · Multiple OK"}
        </p>
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="ap-img-progress">
          <div className="ap-img-progress-bar-wrap">
            <div
              className="ap-img-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="ap-img-progress-label">{progress}%</span>
        </div>
      )}

      {/* Previews */}
      {images.length > 0 && (
        <div className="ap-img-previews">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="ap-img-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Product image ${i + 1}`} />
              <button
                className="ap-img-thumb-remove"
                type="button"
                title="Remove image"
                onClick={(e) => {
                  e.stopPropagation();
                  setImages(images.filter((_, j) => j !== i));
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
          ))}
        </div>
      )}
    </div>
  );
}

// ── Spec builder ─────────────────────────────────────────────────────────────
function SpecBuilder({
  specs,
  setSpecs,
}: {
  specs: { key: string; val: string }[];
  setSpecs: (v: { key: string; val: string }[]) => void;
}) {
  return (
    <div className="ap-spec-list">
      {specs.map((s, i) => (
        <div key={i} className="ap-spec-row">
          <input
            className="ap-input"
            value={s.key}
            placeholder="Key e.g. RAM"
            onChange={(e) => {
              const n = [...specs];
              n[i] = { ...n[i], key: e.target.value };
              setSpecs(n);
            }}
          />
          <input
            className="ap-input"
            value={s.val}
            placeholder="Value e.g. 8GB"
            onChange={(e) => {
              const n = [...specs];
              n[i] = { ...n[i], val: e.target.value };
              setSpecs(n);
            }}
          />
          <button
            type="button"
            className="ap-spec-remove"
            onClick={() => setSpecs(specs.filter((_, j) => j !== i))}
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
      ))}
      <button
        type="button"
        className="ap-add-spec-btn"
        onClick={() => setSpecs([...specs, { key: "", val: "" }])}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Specification
      </button>
    </div>
  );
}

// ── Main product form ─────────────────────────────────────────────────────────
function ProductForm({
  tab,
  onSuccess,
  onError,
}: {
  tab: (typeof TABS)[0];
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [stock, setStock] = useState("");
  const [condition, setCondition] = useState(
    tab.id.includes("used")
      ? "used"
      : tab.id.includes("refurb")
      ? "refurbished"
      : "new"
  );
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [specs, setSpecs] = useState<{ key: string; val: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Phone-specific
  const [storage, setStorage] = useState("");
  const [ram, setRam] = useState("");
  const [color, setColor] = useState("");
  const [model, setModel] = useState("");

  const isPhone = tab.category === "Mobiles";
  const isWatch = tab.category === "Watches";
  const isAccessory = tab.category === "Accessories";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      onError("Product name and price are required");
      return;
    }

    setLoading(true);

    const specsObj: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.val.trim()) specsObj[s.key.trim()] = s.val.trim();
    });

    if (isPhone) {
      if (storage) specsObj["Storage"] = storage;
      if (ram) specsObj["RAM"] = ram;
      if (color) specsObj["Color"] = color;
      if (model) specsObj["Model"] = model;
    }

    const product = {
      name: name.trim(),
      description: desc.trim(),
      price: parseFloat(price),
      original_price: originalPrice ? parseFloat(originalPrice) : null,
      brand: brand.trim(),
      stock: parseInt(stock) || 0,
      condition,
      is_featured: isFeatured,
      is_active: isActive,
      images,
      category: tab.category,
      subcategory: tab.sub,
      specs: specsObj,
    };

    const { error } = await supabase.from("products").insert([product]);
    setLoading(false);

    if (error) {
      onError("Supabase error: " + error.message);
    } else {
      onSuccess();
      // Reset form
      setName("");
      setDesc("");
      setPrice("");
      setOriginalPrice("");
      setBrand("");
      setStock("");
      setImages([]);
      setSpecs([]);
      setStorage("");
      setRam("");
      setColor("");
      setModel("");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="ap-form-grid">
        {/* ── Left column ── */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Basic Info */}
          <div className="ap-card">
            <div className="ap-card-header">
              <div className="ap-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="ap-card-title">Product Information</h3>
            </div>
            <div className="ap-card-body">
              <Field label="Product Name" required>
                <input
                  className="ap-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`e.g. ${tab.sub} — Premium Edition`}
                  required
                />
              </Field>

              <Field label="Description">
                <textarea
                  className="ap-textarea"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Detailed product description…"
                  rows={4}
                />
              </Field>

              {isPhone && (
                <div className="ap-row">
                  <Field label="Model">
                    <input
                      className="ap-input"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. iPhone 15 Pro"
                    />
                  </Field>
                  <Field label="Color">
                    <input
                      className="ap-input"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g. Midnight Black"
                    />
                  </Field>
                  <Field label="Storage">
                    <input
                      className="ap-input"
                      value={storage}
                      onChange={(e) => setStorage(e.target.value)}
                      placeholder="e.g. 256GB"
                    />
                  </Field>
                  <Field label="RAM">
                    <input
                      className="ap-input"
                      value={ram}
                      onChange={(e) => setRam(e.target.value)}
                      placeholder="e.g. 8GB"
                    />
                  </Field>
                </div>
              )}

              {isWatch && (
                <div className="ap-row">
                  <Field label="Strap Material">
                    <input
                      className="ap-input"
                      placeholder="e.g. Leather, Silicon"
                      onChange={(e) => {
                        const s = [...specs];
                        const idx = s.findIndex((x) => x.key === "Strap");
                        if (idx >= 0) s[idx].val = e.target.value;
                        else s.push({ key: "Strap", val: e.target.value });
                        setSpecs(s);
                      }}
                    />
                  </Field>
                  <Field label="Case Material">
                    <input
                      className="ap-input"
                      placeholder="e.g. Stainless Steel"
                      onChange={(e) => {
                        const s = [...specs];
                        const idx = s.findIndex((x) => x.key === "Case");
                        if (idx >= 0) s[idx].val = e.target.value;
                        else s.push({ key: "Case", val: e.target.value });
                        setSpecs(s);
                      }}
                    />
                  </Field>
                </div>
              )}

              {isAccessory && (
                <Field label="Compatible With">
                  <input
                    className="ap-input"
                    placeholder="e.g. iPhone 13/14/15, Samsung S24"
                    onChange={(e) => {
                      const s = [...specs];
                      const idx = s.findIndex((x) => x.key === "Compatible");
                      if (idx >= 0) s[idx].val = e.target.value;
                      else s.push({ key: "Compatible", val: e.target.value });
                      setSpecs(s);
                    }}
                  />
                </Field>
              )}
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="ap-card">
            <div className="ap-card-header">
              <div className="ap-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <h3 className="ap-card-title">Pricing & Stock</h3>
            </div>
            <div className="ap-card-body">
              <div className="ap-row">
                <Field label="Sale Price (PKR)" required>
                  <input
                    className="ap-input"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    required
                    min="0"
                  />
                </Field>
                <Field label="Original Price (PKR)">
                  <input
                    className="ap-input"
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="0 (for strikethrough)"
                    min="0"
                  />
                </Field>
                <Field label="Stock Quantity">
                  <input
                    className="ap-input"
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </Field>
                <Field label="Brand / Manufacturer">
                  <input
                    className="ap-input"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Samsung, Apple"
                  />
                </Field>
              </div>

              <div className="ap-row">
                <Field label="Condition">
                  <select
                    className="ap-select"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                    <option value="open-box">Open Box</option>
                  </select>
                </Field>
              </div>

              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                <label className="ap-check-wrap">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  <span className="ap-check-label">Mark as Featured</span>
                </label>
                <label className="ap-check-wrap">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span className="ap-check-label">Active / Visible</span>
                </label>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="ap-card">
            <div className="ap-card-header">
              <div className="ap-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </div>
              <h3 className="ap-card-title">Specifications</h3>
            </div>
            <div className="ap-card-body">
              <SpecBuilder specs={specs} setSpecs={setSpecs} />
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Images */}
          <div className="ap-card">
            <div className="ap-card-header">
              <div className="ap-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <h3 className="ap-card-title">Product Images</h3>
            </div>
            <div className="ap-card-body">
              <ImageUploader
                images={images}
                setImages={setImages}
                onError={onError}
              />
            </div>
          </div>

          {/* Summary + Submit */}
          <div className="ap-card">
            <div className="ap-card-header">
              <div className="ap-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="ap-card-title">Summary</h3>
            </div>
            <div className="ap-card-body">
              {[
                ["Category", tab.category],
                ["Subcategory", tab.sub],
                ["Images", `${images.length} uploaded`],
                ["Specs", `${specs.filter((s) => s.key).length} added`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid rgba(184,150,62,0.08)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--ap-sans)",
                      fontSize: "0.6rem",
                      fontWeight: 300,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "rgba(245,240,232,0.35)",
                    }}
                  >
                    {k}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--ap-serif)",
                      fontSize: "0.85rem",
                      color: "var(--ap-gold-light)",
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}

              <button
                type="submit"
                className="ap-submit-btn"
                disabled={loading}
                style={{ marginTop: "1rem" }}
              >
                {loading ? (
                  <>
                    <div className="ap-spinner" />
                    Saving to Supabase…
                  </>
                ) : (
                  <>
                    <span>Save Product</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AddProductPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: Toast["type"], title: string, msg: string) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, title, msg }]);
    setTimeout(() => {
      setToasts((p) =>
        p.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 350);
    }, 4500);
  };

  const removeToast = (id: number) => {
    setToasts((p) => p.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 350);
  };

  const tab = TABS[activeTab];

  return (
    <div className="ap-root">
      <div className="ap-ambient" aria-hidden="true" />
      <div className="ap-grain" aria-hidden="true" />

      <PanelNavbar />

      <div className="ap-content">
        <div className="ap-page-header">
          <p className="ap-eyebrow">
            <span className="ap-ey-line" />
            Inventory Management
            <span className="ap-ey-line" />
          </p>
          <h1 className="ap-page-title">
            Add <em>Product</em>
          </h1>
          <p className="ap-page-sub">
            Select a category tab · fill in details · images upload instantly to
            Cloudinary
          </p>
        </div>

        {/* Tabs */}
        <div className="ap-tabs">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className={`ap-tab${activeTab === i ? " active" : ""}`}
              onClick={() => setActiveTab(i)}
              title={`${t.category} → ${t.sub}`}
            >
              <div className="ap-tab-icon">{t.icon}</div>
              <span className="ap-tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Form — key forces full reset on tab change */}
        <ProductForm
          key={activeTab}
          tab={tab}
          onSuccess={() =>
            addToast(
              "success",
              "Product Saved",
              `${tab.sub} added to Supabase successfully!`
            )
          }
          onError={(msg) => addToast("error", "Error", msg)}
        />
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
