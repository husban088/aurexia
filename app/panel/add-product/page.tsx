"use client";

import { useState, useRef, useCallback } from "react";
import PanelNavbar from "@/app/components/PanelNavbar";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import "../panel.css";
import "./add-product.css";

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

// Updated TABS with new categories
const TABS = [
  // Accessories
  {
    id: "chargers",
    label: "Chargers",
    category: "Accessories",
    sub: "Chargers",
  },
  { id: "cables", label: "Cables", category: "Accessories", sub: "Cables" },
  {
    id: "phone-holders",
    label: "Phone Holders",
    category: "Accessories",
    sub: "Phone Holders",
  },
  {
    id: "tech-gadgets",
    label: "Tech Gadgets",
    category: "Accessories",
    sub: "Tech Gadgets",
  },
  {
    id: "smart-accessories",
    label: "Smart Accessories",
    category: "Accessories",
    sub: "Smart Accessories",
  },
  // Watches
  {
    id: "men-watches",
    label: "Men Watches",
    category: "Watches",
    sub: "Men Watches",
  },
  {
    id: "women-watches",
    label: "Women Watches",
    category: "Watches",
    sub: "Women Watches",
  },
  {
    id: "smart-watches",
    label: "Smart Watches",
    category: "Watches",
    sub: "Smart Watches",
  },
  {
    id: "luxury-watches",
    label: "Luxury Watches",
    category: "Watches",
    sub: "Luxury Watches",
  },
  // Automotive
  {
    id: "car-accessories",
    label: "Car Accessories",
    category: "Automotive",
    sub: "Car Accessories",
  },
  {
    id: "car-cleaning",
    label: "Car Cleaning",
    category: "Automotive",
    sub: "Car Cleaning Tools",
  },
  {
    id: "auto-phone-holders",
    label: "Phone Holders",
    category: "Automotive",
    sub: "Phone Holders",
  },
  {
    id: "interior-auto",
    label: "Interior Auto",
    category: "Automotive",
    sub: "Interior Accessories",
  },
  // Home Decor
  {
    id: "wall-decor",
    label: "Wall Decor",
    category: "Home Decor",
    sub: "Wall Decor",
  },
  {
    id: "lighting",
    label: "Lighting",
    category: "Home Decor",
    sub: "Lighting",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    category: "Home Decor",
    sub: "Kitchen Essentials",
  },
  {
    id: "storage",
    label: "Storage",
    category: "Home Decor",
    sub: "Storage & Organizers",
  },
];

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
  const [dragover, setDragover] = useState(false);

  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const validFiles = files.filter((f) => f.type.startsWith("image/"));
      if (validFiles.length === 0) {
        onError("Only image files are allowed");
        return;
      }
      setUploading(true);
      setProgress(0);
      const uploaded: string[] = [];
      for (let i = 0; i < validFiles.length; i++) {
        try {
          const url = await uploadToCloudinary(validFiles[i]);
          uploaded.push(url);
        } catch (err) {
          onError(
            `Upload failed: ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          );
        }
        setProgress(Math.round(((i + 1) / validFiles.length) * 100));
      }
      if (uploaded.length > 0) setImages([...images, ...uploaded]);
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    },
    [images, setImages, onError]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div
        className={`ap-img-upload${dragover ? " dragover" : ""}`}
        onClick={() => !uploading && fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragover(true);
        }}
        onDragLeave={() => setDragover(false)}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => processFiles(Array.from(e.target.files || []))}
          style={{ display: "none" }}
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
          {uploading ? "Uploading..." : "Upload Product Images"}
        </p>
        <p className="ap-img-upload-sub">
          Click or drag & drop · JPG, PNG, WEBP
        </p>
      </div>
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
      {images.length > 0 && (
        <div className="ap-img-previews">
          {images.map((url, i) => (
            <div key={i} className="ap-img-thumb">
              <img src={url} alt={`Product ${i + 1}`} />
              <button
                className="ap-img-thumb-remove"
                type="button"
                onClick={() => setImages(images.filter((_, j) => j !== i))}
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
            placeholder="Key"
            onChange={(e) => {
              const n = [...specs];
              n[i] = { ...n[i], key: e.target.value };
              setSpecs(n);
            }}
          />
          <input
            className="ap-input"
            value={s.val}
            placeholder="Value"
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
  const [condition, setCondition] = useState("new");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [specs, setSpecs] = useState<{ key: string; val: string }[]>([]);
  const [loading, setLoading] = useState(false);

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
      setName("");
      setDesc("");
      setPrice("");
      setOriginalPrice("");
      setBrand("");
      setStock("");
      setImages([]);
      setSpecs([]);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="ap-form-grid">
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
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
                  placeholder={`e.g. ${tab.sub} - Premium`}
                  required
                />
              </Field>
              <Field label="Description">
                <textarea
                  className="ap-textarea"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Detailed product description..."
                  rows={4}
                />
              </Field>
            </div>
          </div>

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
                    placeholder="0"
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
                <Field label="Brand">
                  <input
                    className="ap-input"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Brand name"
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
                  </select>
                </Field>
              </div>
              <div style={{ display: "flex", gap: "1.5rem" }}>
                <label className="ap-check-wrap">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  <span className="ap-check-label">Featured</span>
                </label>
                <label className="ap-check-wrap">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span className="ap-check-label">Active</span>
                </label>
              </div>
            </div>
          </div>

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
                </svg>
              </div>
              <h3 className="ap-card-title">Specifications</h3>
            </div>
            <div className="ap-card-body">
              <SpecBuilder specs={specs} setSpecs={setSpecs} />
            </div>
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
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
                    padding: "0.5rem 0",
                    borderBottom: "1px solid rgba(184,150,62,0.08)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--ap-sans)",
                      fontSize: "0.6rem",
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
                    <div className="ap-spinner" /> Saving...
                  </>
                ) : (
                  <>
                    Save Product
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
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

export default function AddProductPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: Toast["type"], title: string, msg: string) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, title, msg }]);
    setTimeout(
      () =>
        setToasts((p) =>
          p.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        ),
      4000
    );
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  };

  const removeToast = (id: number) => {
    setToasts((p) => p.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 350);
  };

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
            Select a category · fill in details · images upload to Cloudinary
          </p>
        </div>

        <div className="ap-tabs">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className={`ap-tab${activeTab === i ? " active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              <span className="ap-tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        <ProductForm
          key={activeTab}
          tab={TABS[activeTab]}
          onSuccess={() =>
            addToast(
              "success",
              "Product Saved",
              `${TABS[activeTab].sub} added successfully!`
            )
          }
          onError={(msg) => addToast("error", "Error", msg)}
        />
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
