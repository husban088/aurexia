"use client";

import {
  BulkPricingManager,
  BulkPricingTier,
} from "@/app/components/BulkPricingManager";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PanelNavbar from "@/app/components/PanelNavbar";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { isOwner } from "@/lib/checkOwner";
import { convertPriceToPKR, convertPriceFromPKR } from "@/lib/panelCurrency";
import ProductDescription from "@/app/components/ProductDescription";
import "@/app/panel/add-product/add-product.css";
import "./edit-product.css";
import { useCurrency } from "@/app/context/CurrencyContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  title: string;
  msg: string;
  exiting?: boolean;
};

type Mode = "simple" | "detailed";
type StockStatus = "in_stock" | "out_of_stock" | "low_stock";

type FAQ = {
  id?: string;
  question: string;
  answer: string;
  display_order: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_SUGGESTIONS = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Gold",
  "Silver",
  "Rose Gold",
  "Pink",
  "Purple",
  "Orange",
  "Brown",
  "Grey",
  "Navy Blue",
  "Beige",
];
const SIZE_SUGGESTIONS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "28mm",
  "32mm",
  "36mm",
  "40mm",
  "42mm",
  "44mm",
];
const MATERIAL_SUGGESTIONS = [
  "Plastic",
  "Metal",
  "Stainless Steel",
  "Titanium",
  "Aluminum",
  "Fabric",
  "Leather",
  "Silicone",
  "Glass",
  "Ceramic",
  "Wood",
  "Gold Plated",
  "Carbon Fiber",
];
const CAPACITY_SUGGESTIONS = [
  "100ml",
  "200ml",
  "300ml",
  "500ml",
  "1L",
  "2L",
  "50mAh",
  "100mAh",
  "500mAh",
  "1000mAh",
  "2000mAh",
  "5000mAh",
  "10000mAh",
  "65W",
  "100W",
];

const TABS = [
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
    id: "interior-auto",
    label: "Interior Auto",
    category: "Automotive",
    sub: "Interior Accessories",
  },
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

function detectStockStatus(
  stock: number,
  lowStockThreshold: number | null
): StockStatus {
  if (stock === 0) return "out_of_stock";
  if (lowStockThreshold && lowStockThreshold > 0 && stock <= lowStockThreshold)
    return "low_stock";
  return "in_stock";
}

// ─── Toast Container ─────────────────────────────────────────────────────────

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

// ─── Stock Status Selector ───────────────────────────────────────────────────

function StockStatusSelector({
  value,
  onChange,
  stock,
  onStockChange,
  lowStockThreshold,
  onThresholdChange,
}: {
  value: StockStatus;
  onChange: (s: StockStatus) => void;
  stock: number;
  onStockChange: (v: number) => void;
  lowStockThreshold: number | null;
  onThresholdChange: (v: number | null) => void;
}) {
  const uniqueId = useRef(`stock_${Date.now()}_${Math.random()}`).current;

  return (
    <div>
      <div className="ap-stock-radio-group">
        <div
          className={`ap-stock-radio-option ${
            value === "in_stock" ? "active-in-stock" : ""
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange("in_stock");
          }}
        >
          <input
            type="radio"
            name={uniqueId}
            checked={value === "in_stock"}
            readOnly
          />
          <span>In Stock</span>
        </div>
        <div
          className={`ap-stock-radio-option ${
            value === "out_of_stock" ? "active-out-stock" : ""
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange("out_of_stock");
          }}
        >
          <input
            type="radio"
            name={uniqueId}
            checked={value === "out_of_stock"}
            readOnly
          />
          <span>Out of Stock</span>
        </div>
        <div
          className={`ap-stock-radio-option ${
            value === "low_stock" ? "active-low-stock" : ""
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange("low_stock");
          }}
        >
          <input
            type="radio"
            name={uniqueId}
            checked={value === "low_stock"}
            readOnly
          />
          <span>Low Stock Alert</span>
        </div>
      </div>

      {value !== "out_of_stock" && (
        <div
          className="ap-low-stock-threshold"
          style={{ marginTop: "0.75rem" }}
        >
          <label>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 3h-8l-2 4h12l-2-4z" />
            </svg>
            Quantity / Pieces in Stock:
          </label>
          <input
            type="number"
            min="1"
            value={stock === 999999 ? "" : stock || ""}
            onChange={(e) =>
              onStockChange(e.target.value ? parseInt(e.target.value) : 999999)
            }
            placeholder="e.g., 50 (leave empty = unlimited)"
          />
          <span>units</span>
        </div>
      )}

      {value === "low_stock" && (
        <div className="ap-low-stock-threshold" style={{ marginTop: "0.5rem" }}>
          <label>
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
            Alert when quantity reaches:
          </label>
          <input
            type="number"
            min="1"
            value={lowStockThreshold || ""}
            onChange={(e) =>
              onThresholdChange(
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            placeholder="e.g., 5"
          />
          <span>units or less</span>
        </div>
      )}
    </div>
  );
}

// ─── FAQ Builder ─────────────────────────────────────────────────────────────

function FAQBuilder({
  faqs,
  setFaqs,
}: {
  faqs: FAQ[];
  setFaqs: (v: FAQ[]) => void;
}) {
  const addFAQ = () =>
    setFaqs([
      ...faqs,
      { question: "", answer: "", display_order: faqs.length },
    ]);
  const removeFAQ = (i: number) => setFaqs(faqs.filter((_, idx) => idx !== i));
  const updateQ = (i: number, v: string) => {
    const n = [...faqs];
    n[i] = { ...n[i], question: v };
    setFaqs(n);
  };
  const updateA = (i: number, v: string) => {
    const n = [...faqs];
    n[i] = { ...n[i], answer: v };
    setFaqs(n);
  };

  if (faqs.length === 0) {
    return (
      <div className="ap-faq-section">
        <div className="ap-faq-empty">
          <p>No FAQs added yet. Click the button below to add.</p>
        </div>
        <button type="button" className="ap-add-faq-btn" onClick={addFAQ}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>{" "}
          Add FAQ
        </button>
      </div>
    );
  }

  return (
    <div className="ap-faq-section">
      <div className="ap-faq-list">
        {faqs.map((faq, i) => (
          <div key={i} className="ap-faq-item">
            <div className="ap-faq-header">
              <input
                type="text"
                className="ap-faq-question-input"
                value={faq.question}
                onChange={(e) => updateQ(i, e.target.value)}
                placeholder={`Question ${i + 1}...`}
              />
              <button
                type="button"
                className="ap-faq-remove-btn"
                onClick={() => removeFAQ(i)}
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
            <div className="ap-faq-answer-section">
              <textarea
                className="ap-faq-answer-input"
                value={faq.answer}
                onChange={(e) => updateA(i, e.target.value)}
                placeholder="Write your answer here..."
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="ap-add-faq-btn" onClick={addFAQ}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>{" "}
        Add Another FAQ
      </button>
    </div>
  );
}

// ─── Multi-Image Uploader ───────────────────────────────────────────────────

function MultiImageUploader({
  images,
  onImagesChange,
  onError,
}: {
  images: string[];
  onImagesChange: (imgs: string[]) => void;
  onError: (msg: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onError("Only image files are allowed");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onImagesChange([...images, url]);
    } catch (err) {
      onError(
        "Upload failed: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
    setUploading(false);
  };

  const removeImage = (index: number) =>
    onImagesChange(images.filter((_, i) => i !== index));

  const MAX_IMAGES = 20;
  const canAdd = images.length < MAX_IMAGES;

  return (
    <div className="ap-variant-images">
      {images.length > 0 && (
        <p
          style={{
            fontFamily: "var(--ap-sans)",
            fontSize: "0.65rem",
            color: "#999",
            marginBottom: "0.5rem",
          }}
        >
          {images.length}/{MAX_IMAGES} images · First image is main thumbnail
        </p>
      )}
      <div className="ap-variant-image-list">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="ap-variant-image-item"
            style={{ position: "relative" }}
          >
            {idx === 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "3px",
                  left: "3px",
                  background: "#8b6914",
                  color: "#fff",
                  fontSize: "0.5rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "1px 4px",
                  borderRadius: "3px",
                  zIndex: 2,
                  fontFamily: "var(--ap-sans)",
                  pointerEvents: "none",
                }}
              >
                Main
              </span>
            )}
            <img src={img} alt={`Image ${idx + 1}`} />
            <button
              type="button"
              className="ap-variant-image-remove"
              onClick={() => removeImage(idx)}
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
        {canAdd && (
          <button
            type="button"
            className="ap-variant-image-add"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <div
                className="ap-spinner"
                style={{ width: "20px", height: "20px" }}
              />
            ) : (
              "+ Upload Image"
            )}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            if (fileRef.current) fileRef.current.value = "";
          }}
          style={{ display: "none" }}
        />
      </div>
      {!canAdd && (
        <p
          style={{
            fontFamily: "var(--ap-sans)",
            fontSize: "0.65rem",
            color: "#f59e0b",
            marginTop: "0.4rem",
          }}
        >
          Maximum {MAX_IMAGES} images reached. Remove one to add more.
        </p>
      )}
    </div>
  );
}

// ─── Variant Data Type ───────────────────────────────────────────────────────

interface VariantData {
  id?: string;
  attributeType: string;
  attributeValue: string;
  price?: number;
  originalPrice?: number | null;
  description?: string;
  descriptionImages?: string[];
  stock?: number;
  lowStockThreshold?: number | null;
  images?: string[];
  stockStatus?: StockStatus;
  bulkPricingTiers?: BulkPricingTier[];
}

// ─── Color Detection Helper ──────────────────────────────────────────────────

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> =
  {
    black: { bg: "#1a1a1a", text: "#ffffff", border: "#444" },
    white: { bg: "#f5f5f5", text: "#111111", border: "#ccc" },
    red: { bg: "#dc2626", text: "#ffffff", border: "#b91c1c" },
    blue: { bg: "#2563eb", text: "#ffffff", border: "#1d4ed8" },
    green: { bg: "#16a34a", text: "#ffffff", border: "#15803d" },
    yellow: { bg: "#eab308", text: "#111111", border: "#ca8a04" },
    gold: { bg: "#d97706", text: "#ffffff", border: "#b45309" },
    silver: { bg: "#9ca3af", text: "#111111", border: "#6b7280" },
    "rose gold": { bg: "#e879a8", text: "#ffffff", border: "#db2777" },
    pink: { bg: "#ec4899", text: "#ffffff", border: "#db2777" },
    purple: { bg: "#9333ea", text: "#ffffff", border: "#7e22ce" },
    orange: { bg: "#f97316", text: "#ffffff", border: "#ea580c" },
    brown: { bg: "#92400e", text: "#ffffff", border: "#78350f" },
    grey: { bg: "#6b7280", text: "#ffffff", border: "#4b5563" },
    gray: { bg: "#6b7280", text: "#ffffff", border: "#4b5563" },
    "navy blue": { bg: "#1e3a8a", text: "#ffffff", border: "#1e40af" },
    navy: { bg: "#1e3a8a", text: "#ffffff", border: "#1e40af" },
    beige: { bg: "#d4b896", text: "#111111", border: "#b8956a" },
  };

function getColorStyle(colorName: string) {
  const key = colorName.toLowerCase().trim();
  return (
    COLOR_MAP[key] || {
      bg: "rgba(139,105,20,0.15)",
      text: "#8b6914",
      border: "rgba(139,105,20,0.3)",
    }
  );
}

function getAttributeTypeLabel(type: string) {
  const labels: Record<string, string> = {
    color: "🎨 Color",
    size: "📐 Size",
    material: "🧱 Material",
    capacity: "⚡ Capacity",
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

// ─── Variant Form Item ──────────────────────────────────────────────────────

function VariantFormItem({
  attributeType,
  attributeValue,
  initialData,
  onUpdate,
  onRemove,
  onError,
  isFirstItem,
}: {
  attributeType: string;
  attributeValue: string;
  initialData?: VariantData;
  onUpdate: (data: any) => void;
  onRemove: () => void;
  onError: (msg: string) => void;
  isFirstItem?: boolean;
}) {
  const { currency } = useCurrency();

  const [priceDisplay, setPriceDisplay] = useState(() => {
    const pkrPrice = initialData?.price || 0;
    return convertPriceFromPKR(pkrPrice, currency).toFixed(2);
  });
  const [originalPriceDisplay, setOriginalPriceDisplay] = useState(() => {
    const pkrPrice = initialData?.originalPrice || 0;
    return pkrPrice ? convertPriceFromPKR(pkrPrice, currency).toFixed(2) : "";
  });
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [descriptionImages, setDescriptionImages] = useState<string[]>(
    initialData?.descriptionImages || []
  );

  const initStatus = detectStockStatus(
    initialData?.stock ?? 999999,
    initialData?.lowStockThreshold ?? null
  );
  const [stockStatus, setStockStatus] = useState<StockStatus>(initStatus);
  const initStock = initialData?.stock ?? 999999;
  const [stockPieces, setStockPieces] = useState<number>(
    initStock === 0 ? 0 : initStock
  );
  const [lowStockThreshold, setLowStockThreshold] = useState<number | null>(
    initialData?.lowStockThreshold ?? null
  );
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [bulkTiers, setBulkTiers] = useState<BulkPricingTier[]>(() => {
    const tiers = initialData?.bulkPricingTiers || [];
    return tiers.map((tier: BulkPricingTier) => ({
      ...tier,
      tier_price: convertPriceFromPKR(tier.tier_price, currency),
      discount_price: tier.discount_price
        ? convertPriceFromPKR(tier.discount_price, currency)
        : null,
    }));
  });
  const [expanded, setExpanded] = useState(isFirstItem !== false);

  const getStockValue = (): number => {
    if (stockStatus === "out_of_stock") return 0;
    return stockPieces || 999999;
  };

  const getStockStatusLabel = () => {
    if (stockStatus === "out_of_stock") return "Out of Stock";
    if (stockStatus === "low_stock")
      return `Low Stock (Alert at ${lowStockThreshold || 5})`;
    const pieces = stockPieces === 999999 ? "Unlimited" : `${stockPieces} pcs`;
    return `In Stock (${pieces})`;
  };

  const currentUnitPrice = parseFloat(priceDisplay) || 0;

  const getPriceInPKR = (displayPrice: string): number => {
    const priceNum = parseFloat(displayPrice) || 0;
    return convertPriceToPKR(priceNum, currency);
  };

  const handleDescriptionChange = (
    newValue: string,
    imagesInDesc: string[]
  ) => {
    setDescription(newValue);
    setDescriptionImages(imagesInDesc);
  };

  useEffect(() => {
    onUpdate({
      id: initialData?.id,
      attributeType,
      attributeValue,
      price: getPriceInPKR(priceDisplay),
      originalPrice: originalPriceDisplay
        ? getPriceInPKR(originalPriceDisplay)
        : null,
      description,
      descriptionImages,
      stock: getStockValue(),
      lowStockThreshold: stockStatus === "low_stock" ? lowStockThreshold : null,
      images,
      stockStatus,
      bulkPricingTiers: bulkTiers.map((tier: BulkPricingTier) => ({
        ...tier,
        tier_price: convertPriceToPKR(tier.tier_price, currency),
        discount_price: tier.discount_price
          ? convertPriceToPKR(tier.discount_price, currency)
          : null,
      })),
      displayCurrency: currency.code,
    });
  }, [
    priceDisplay,
    originalPriceDisplay,
    description,
    descriptionImages,
    stockStatus,
    stockPieces,
    lowStockThreshold,
    images,
    bulkTiers,
    currency,
  ]);

  const colorStyle =
    attributeType === "color" ? getColorStyle(attributeValue) : null;

  return (
    <div className="ap-variant-form-item">
      <div
        className="ap-variant-form-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span
          style={{
            fontFamily: "var(--ap-sans)",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#8b6914",
            background: "rgba(139,105,20,0.12)",
            border: "1px solid rgba(139,105,20,0.25)",
            borderRadius: "4px",
            padding: "2px 7px",
            flexShrink: 0,
          }}
        >
          {getAttributeTypeLabel(attributeType)}
        </span>

        {colorStyle ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: colorStyle.bg,
              color: colorStyle.text,
              border: `1.5px solid ${colorStyle.border}`,
              borderRadius: "6px",
              padding: "3px 10px 3px 6px",
              fontFamily: "var(--ap-sans)",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: colorStyle.bg,
                border: `2px solid ${colorStyle.text}`,
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            {attributeValue}
          </span>
        ) : (
          <span
            style={{
              fontFamily: "var(--ap-sans)",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#1a1a1a",
              background: "rgba(0,0,0,0.07)",
              border: "1.5px solid rgba(0,0,0,0.15)",
              borderRadius: "6px",
              padding: "3px 10px",
              flexShrink: 0,
            }}
          >
            {attributeValue}
          </span>
        )}

        <span
          className="ap-variant-form-badge"
          style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
        >
          {getStockStatusLabel()}
        </span>
        {bulkTiers.length > 0 && (
          <span
            className="ap-variant-form-badge"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
          >
            {bulkTiers.length} Bulk Tiers
          </span>
        )}
        {images.length > 0 && (
          <span
            className="ap-variant-form-badge"
            style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}
          >
            {images.length} Images
          </span>
        )}
        {descriptionImages.length > 0 && (
          <span
            className="ap-variant-form-badge"
            style={{ background: "rgba(139,105,20,0.1)", color: "#8b6914" }}
          >
            📷 {descriptionImages.length} Desc Images
          </span>
        )}
        <span
          style={{
            marginLeft: "auto",
            color: "#8b6914",
            fontSize: "0.75rem",
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
        <button
          type="button"
          className="ap-variant-form-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
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

      <div
        className="ap-variant-form-body"
        style={{ display: expanded ? "block" : "none" }}
      >
        <div className="ap-row">
          <div className="ap-field">
            <label className="ap-label">Sale Price ({currency.symbol}) *</label>
            <input
              type="number"
              className="ap-input"
              value={priceDisplay}
              onChange={(e) => setPriceDisplay(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div className="ap-field">
            <label className="ap-label">
              Original Price ({currency.symbol})
            </label>
            <input
              type="number"
              className="ap-input"
              value={originalPriceDisplay}
              onChange={(e) => setOriginalPriceDisplay(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="ap-field">
          <label className="ap-label">
            Description (Rich Text with Images)
          </label>
          <ProductDescription
            value={description}
            onChange={handleDescriptionChange}
            existingImages={descriptionImages}
            maxImages={20}
          />
        </div>

        <div className="ap-field">
          <label className="ap-label">Stock Status</label>
          <StockStatusSelector
            value={stockStatus}
            onChange={(s) => {
              setStockStatus(s);
              if (s === "out_of_stock") setStockPieces(0);
            }}
            stock={stockPieces}
            onStockChange={setStockPieces}
            lowStockThreshold={lowStockThreshold}
            onThresholdChange={setLowStockThreshold}
          />
        </div>

        <div className="ap-field">
          <label className="ap-label">Variant Gallery Images</label>
          <MultiImageUploader
            images={images}
            onImagesChange={setImages}
            onError={onError}
          />
        </div>

        {currentUnitPrice > 0 && (
          <BulkPricingManager
            unitPrice={currentUnitPrice}
            tiers={bulkTiers}
            onTiersChange={setBulkTiers}
            onError={onError}
          />
        )}
      </div>
    </div>
  );
}

// ─── Attribute Selector ─────────────────────────────────────────────────────

function AttributeSelector({
  label,
  type,
  values,
  setValues,
  suggestions,
  variants,
  setVariants,
  onError,
  initialVariantsData,
}: {
  label: string;
  type: string;
  values: string[];
  setValues: (v: string[]) => void;
  suggestions: string[];
  variants: any[];
  setVariants: (v: any[] | ((prev: any[]) => any[])) => void;
  onError: (msg: string) => void;
  initialVariantsData?: any[];
}) {
  const { currency } = useCurrency();

  const convertVariantData = (v: any) => ({
    id: v.id,
    attributeType: type,
    attributeValue: v.attribute_value,
    price: v.price || 0,
    originalPrice: v.original_price || null,
    description: v.description_rich || v.description || "",
    descriptionImages: v.description_images || [],
    stock: v.stock ?? 999999,
    lowStockThreshold: v.low_stock_threshold || null,
    images: (v.variant_images || [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((i: any) => i.image_url),
    stockStatus: detectStockStatus(
      v.stock ?? 999999,
      v.low_stock_threshold ?? null
    ),
    bulkPricingTiers: (v.bulk_pricing_tiers || []).map((tier: any) => ({
      ...tier,
      tier_price: convertPriceFromPKR(tier.tier_price, currency),
      discount_price: tier.discount_price
        ? convertPriceFromPKR(tier.discount_price, currency)
        : null,
    })),
  });

  const [inputValue, setInputValue] = useState("");

  const addValue = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !values.includes(trimmed)) {
      setValues([...values, trimmed]);
      const existingVariant = initialVariantsData?.find(
        (v) => v.attribute_value === trimmed && v.attribute_type === type
      );
      if (existingVariant) {
        setVariants([...variants, convertVariantData(existingVariant)]);
      } else {
        setVariants([
          ...variants,
          {
            id: undefined,
            attributeType: type,
            attributeValue: trimmed,
            price: 0,
            originalPrice: null,
            description: "",
            descriptionImages: [],
            stock: 999999,
            lowStockThreshold: null,
            images: [],
            stockStatus: "in_stock",
            bulkPricingTiers: [],
          },
        ]);
      }
    }
    setInputValue("");
  };

  const removeValue = (valueToRemove: string) => {
    setValues(values.filter((v) => v !== valueToRemove));
    setVariants(variants.filter((v) => v.attributeValue !== valueToRemove));
  };

  const updateVariant = useCallback(
    (attributeValue: string, data: any) => {
      setVariants((prev: any[]) =>
        prev.map((v) =>
          v.attributeValue === attributeValue ? { ...v, ...data } : v
        )
      );
    },
    [setVariants]
  );

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !values.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="ap-attribute-section">
      <div className="ap-attribute-header">
        <label className="ap-label">{label}</label>
        <div className="ap-attribute-input-wrap">
          <input
            type="text"
            className="ap-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addValue(inputValue))
            }
            placeholder={`Add ${label.toLowerCase()}...`}
          />
          <button
            type="button"
            className="ap-attribute-add"
            onClick={() => addValue(inputValue)}
          >
            Add
          </button>
        </div>
        {filteredSuggestions.length > 0 && (
          <div className="ap-attribute-suggestions">
            {filteredSuggestions.map((s) => (
              <button key={s} type="button" onClick={() => addValue(s)}>
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {values.length > 0 && (
        <div className="ap-variant-forms-container">
          {values.map((value, idx) => {
            const variant = variants.find((v) => v.attributeValue === value);
            if (!variant) return null;
            return (
              <VariantFormItem
                key={`${type}-${value}`}
                attributeType={type}
                attributeValue={value}
                initialData={variant}
                onUpdate={(data) => updateVariant(value, data)}
                onRemove={() => removeValue(value)}
                onError={onError}
                isFirstItem={idx === 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Simple Mode Edit Form ──────────────────────────────────────────────────

function SimpleModeEditForm({
  tab,
  productId,
  initialProduct,
  initialVariant,
  initialImages,
  initialFaqs,
  initialBulkTiers,
  onSuccess,
  onError,
}: {
  tab: (typeof TABS)[0];
  productId: string;
  initialProduct: any;
  initialVariant: any;
  initialImages: string[];
  initialFaqs: FAQ[];
  initialBulkTiers: BulkPricingTier[];
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const { currency } = useCurrency();
  const [name, setName] = useState(initialProduct?.name || "");
  // Load rich description from variant first, fall back to product-level
  const [description, setDescription] = useState(
    initialVariant?.description_rich ||
      initialVariant?.description ||
      initialProduct?.description ||
      ""
  );
  const [descriptionImages, setDescriptionImages] = useState<string[]>(
    initialVariant?.description_images ||
      initialProduct?.description_images ||
      []
  );
  const [brand, setBrand] = useState(initialProduct?.brand || "");
  const [priceDisplay, setPriceDisplay] = useState(() => {
    const pkrPrice = initialVariant?.price || 0;
    return convertPriceFromPKR(pkrPrice, currency).toFixed(2);
  });
  const [originalPriceDisplay, setOriginalPriceDisplay] = useState(() => {
    const pkrPrice = initialVariant?.original_price || 0;
    return pkrPrice ? convertPriceFromPKR(pkrPrice, currency).toFixed(2) : "";
  });
  const [condition, setCondition] = useState(
    initialProduct?.condition || "new"
  );
  const [isFeatured, setIsFeatured] = useState(
    initialProduct?.is_featured || false
  );
  const [isActive, setIsActive] = useState(initialProduct?.is_active !== false);

  const initStock = initialVariant?.stock ?? 999999;
  const initThreshold = initialVariant?.low_stock_threshold ?? null;
  const [stockStatus, setStockStatus] = useState<StockStatus>(
    detectStockStatus(initStock, initThreshold)
  );
  const [stockPieces, setStockPieces] = useState<number>(
    initStock === 0 ? 0 : initStock
  );
  const [lowStockThreshold, setLowStockThreshold] = useState<number | null>(
    initThreshold
  );

  const [images, setImages] = useState<string[]>(initialImages);
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs);
  const [bulkTiers, setBulkTiers] = useState<BulkPricingTier[]>(() =>
    initialBulkTiers.map((tier: BulkPricingTier) => ({
      ...tier,
      tier_price: convertPriceFromPKR(tier.tier_price, currency),
      discount_price: tier.discount_price
        ? convertPriceFromPKR(tier.discount_price, currency)
        : null,
    }))
  );

  const [uploading, setUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const getStockValue = (): number => {
    if (stockStatus === "out_of_stock") return 0;
    return stockPieces || 999999;
  };

  const getStockLabel = () => {
    if (stockStatus === "out_of_stock") return "Out of Stock";
    if (stockStatus === "low_stock")
      return `Low Stock (Alert: ${lowStockThreshold || 5} units)`;
    const pieces = stockPieces === 999999 ? "Unlimited" : `${stockPieces} pcs`;
    return `In Stock (${pieces})`;
  };

  const getPriceInPKR = (displayPrice: string): number => {
    const priceNum = parseFloat(displayPrice) || 0;
    return convertPriceToPKR(priceNum, currency);
  };

  const handleDescriptionChange = (
    newValue: string,
    imagesInDesc: string[]
  ) => {
    setDescription(newValue);
    setDescriptionImages(imagesInDesc);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onError("Only image files are allowed");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setImages((prev) => [...prev, url]);
    } catch (err) {
      onError(
        "Upload failed: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !priceDisplay) {
      onError("Product name and price are required");
      return;
    }

    setIsUpdating(true);

    // 1. Update product
    const { error: productError } = await supabase
      .from("products")
      .update({
        name: name.trim(),
        description: description,
        description_images: descriptionImages,
        category: tab.category,
        subcategory: tab.sub,
        brand: brand.trim() || null,
        condition,
        is_featured: isFeatured,
        is_active: isActive,
        currency_code: currency.code,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (productError) {
      onError("Failed to update product: " + productError.message);
      setIsUpdating(false);
      return;
    }

    // 2. Update or create variant
    let variantId = initialVariant?.id;
    const pricePKR = getPriceInPKR(priceDisplay);
    const originalPricePKR = originalPriceDisplay
      ? getPriceInPKR(originalPriceDisplay)
      : null;
    const stockVal = getStockValue();
    const thresholdVal = stockStatus === "low_stock" ? lowStockThreshold : null;

    if (variantId) {
      const { error: variantError } = await supabase
        .from("product_variants")
        .update({
          price: pricePKR,
          original_price: originalPricePKR,
          description_rich: description,
          description_images: descriptionImages,
          description: description ? description.substring(0, 500) : null,
          stock: stockVal,
          low_stock_threshold: thresholdVal,
          currency_code: currency.code,
          base_price_pkr: pricePKR,
          base_original_price_pkr: originalPricePKR,
          is_active: true,
        })
        .eq("id", variantId);

      if (variantError) {
        onError("Failed to update variant: " + variantError.message);
        setIsUpdating(false);
        return;
      }
    } else {
      const { data: newVariant, error: variantError } = await supabase
        .from("product_variants")
        .insert([
          {
            product_id: productId,
            attribute_type: "standard",
            attribute_value: "Standard",
            price: pricePKR,
            original_price: originalPricePKR,
            description_rich: description,
            description_images: descriptionImages,
            description: description ? description.substring(0, 500) : null,
            stock: stockVal,
            low_stock_threshold: thresholdVal,
            is_active: true,
            currency_code: currency.code,
            base_price_pkr: pricePKR,
            base_original_price_pkr: originalPricePKR,
          },
        ])
        .select()
        .single();

      if (variantError) {
        onError("Failed to create variant: " + variantError.message);
        setIsUpdating(false);
        return;
      }
      variantId = newVariant.id;
    }

    // 3. Update images
    await supabase.from("variant_images").delete().eq("variant_id", variantId);
    if (images.length > 0) {
      const { error: imgErr } = await supabase.from("variant_images").insert(
        images.map((url, idx) => ({
          variant_id: variantId,
          image_url: url,
          display_order: idx,
        }))
      );
      if (imgErr) console.error("Image save error:", imgErr);
    }

    // 4. Update bulk pricing
    await supabase
      .from("bulk_pricing_tiers")
      .delete()
      .eq("variant_id", variantId);
    if (bulkTiers.length > 0) {
      const validTiers = bulkTiers.filter(
        (t) => t.min_quantity && t.tier_price
      );
      if (validTiers.length > 0) {
        await supabase.from("bulk_pricing_tiers").insert(
          validTiers.map((t) => ({
            variant_id: variantId,
            min_quantity: t.min_quantity,
            max_quantity: t.max_quantity,
            tier_price: convertPriceToPKR(t.tier_price, currency),
            discount_percentage: t.discount_percentage,
            discount_price: t.discount_price
              ? convertPriceToPKR(t.discount_price, currency)
              : null,
            currency_code: currency.code,
            base_tier_price_pkr: convertPriceToPKR(t.tier_price, currency),
          }))
        );
      }
    }

    // 5. Update FAQs
    await supabase.from("product_faqs").delete().eq("product_id", productId);
    if (faqs.length > 0) {
      const validFaqs = faqs.filter((f) => f.question.trim());
      if (validFaqs.length > 0) {
        await supabase.from("product_faqs").insert(
          validFaqs.map((f, idx) => ({
            product_id: productId,
            question: f.question.trim(),
            answer: f.answer.trim() || null,
            display_order: idx,
          }))
        );
      }
    }

    setIsUpdating(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="ap-form-grid-simple">
        <div>
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
              <h3 className="ap-card-title">Basic Product Information</h3>
            </div>
            <div className="ap-card-body">
              <div className="ap-field">
                <label className="ap-label">Product Name *</label>
                <input
                  className="ap-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="ap-row">
                <div className="ap-field">
                  <label className="ap-label">
                    Sale Price ({currency.symbol}) *
                  </label>
                  <input
                    type="number"
                    className="ap-input"
                    value={priceDisplay}
                    onChange={(e) => setPriceDisplay(e.target.value)}
                    required
                  />
                </div>
                <div className="ap-field">
                  <label className="ap-label">
                    Original Price ({currency.symbol})
                  </label>
                  <input
                    type="number"
                    className="ap-input"
                    value={originalPriceDisplay}
                    onChange={(e) => setOriginalPriceDisplay(e.target.value)}
                  />
                </div>
              </div>

              <div className="ap-field">
                <label className="ap-label">Product Description</label>
                <ProductDescription
                  value={description}
                  onChange={handleDescriptionChange}
                  existingImages={descriptionImages}
                  maxImages={20}
                />
              </div>

              <div className="ap-row">
                <div className="ap-field">
                  <label className="ap-label">Brand</label>
                  <input
                    className="ap-input"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>
                <div className="ap-field">
                  <label className="ap-label">Condition</label>
                  <select
                    className="ap-select"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>
              </div>

              <div className="ap-field">
                <label className="ap-label">Stock Status</label>
                <StockStatusSelector
                  value={stockStatus}
                  onChange={(s) => {
                    setStockStatus(s);
                    if (s === "out_of_stock") setStockPieces(0);
                  }}
                  stock={stockPieces}
                  onStockChange={setStockPieces}
                  lowStockThreshold={lowStockThreshold}
                  onThresholdChange={setLowStockThreshold}
                />
              </div>

              {parseFloat(priceDisplay) > 0 && (
                <div className="ap-field">
                  <label className="ap-label">
                    Bulk Pricing (Quantity Discounts)
                  </label>
                  <BulkPricingManager
                    unitPrice={parseFloat(priceDisplay) || 0}
                    tiers={bulkTiers}
                    onTiersChange={setBulkTiers}
                    onError={onError}
                  />
                </div>
              )}

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

          <div className="ap-card" style={{ marginTop: "1.5rem" }}>
            <div className="ap-card-header">
              <div className="ap-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="ap-card-title">FAQs</h3>
            </div>
            <div className="ap-card-body">
              <FAQBuilder faqs={faqs} setFaqs={setFaqs} />
            </div>
          </div>
        </div>

        <div>
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
              <h3 className="ap-card-title">Product Gallery Images</h3>
            </div>
            <div className="ap-card-body">
              <div
                className="ap-img-upload"
                onClick={() => !uploading && fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && handleImageUpload(e.target.files[0])
                  }
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
                  {uploading ? "Uploading..." : "Click to Upload Images"}
                </p>
                <p className="ap-img-upload-sub">JPG, PNG, WEBP</p>
              </div>
              {images.length > 0 && (
                <div className="ap-img-previews">
                  {images.map((url, i) => (
                    <div key={i} className="ap-img-thumb">
                      <img src={url} alt={`Product ${i + 1}`} />
                      <button
                        type="button"
                        className="ap-img-thumb-remove"
                        onClick={() =>
                          setImages(images.filter((_, j) => j !== i))
                        }
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
          </div>

          <div className="ap-card" style={{ marginTop: "1.5rem" }}>
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
                ["Stock", getStockLabel()],
                ["Bulk Tiers", `${bulkTiers.length} tiers`],
                ["FAQs", `${faqs.length} added`],
                ["Currency", currency.code],
                ["Description Images", `${descriptionImages.length} images`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid rgba(218,165,32,0.1)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--ap-sans)",
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#999",
                    }}
                  >
                    {k}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--ap-serif)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#8b6914",
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
              <button
                type="submit"
                className="ap-submit-btn"
                disabled={isUpdating}
                style={{ marginTop: "1rem" }}
              >
                {isUpdating ? (
                  <>
                    <div className="ap-spinner" /> Updating in {currency.code}
                    ...
                  </>
                ) : (
                  <>
                    Update Product in {currency.code}{" "}
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
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "#666",
                  textAlign: "center",
                  marginTop: "0.5rem",
                }}
              >
                Prices will be saved in PKR (base) and converted to{" "}
                {currency.code} for display
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// ─── Detailed Mode Edit Form ─────────────────────────────────────────────────

function DetailedModeEditForm({
  tab,
  productId,
  initialProduct,
  initialVariants,
  initialFaqs,
  onSuccess,
  onError,
}: {
  tab: (typeof TABS)[0];
  productId: string;
  initialProduct: any;
  initialVariants: any[];
  initialFaqs: FAQ[];
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const { currency } = useCurrency();
  const [name, setName] = useState(initialProduct?.name || "");
  const [description, setDescription] = useState(
    initialProduct?.description || ""
  );
  const [descriptionImages, setDescriptionImages] = useState<string[]>(
    initialProduct?.description_images || []
  );
  const [brand, setBrand] = useState(initialProduct?.brand || "");
  const [condition, setCondition] = useState(
    initialProduct?.condition || "new"
  );
  const [isFeatured, setIsFeatured] = useState(
    initialProduct?.is_featured || false
  );
  const [isActive, setIsActive] = useState(initialProduct?.is_active !== false);
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mainImages, setMainImages] = useState<string[]>(() => {
    // First priority: main_images column from DB
    if (
      initialProduct?.main_images &&
      Array.isArray(initialProduct.main_images) &&
      initialProduct.main_images.length > 0
    ) {
      return initialProduct.main_images;
    }
    // Second priority: images from any non-standard variant (fallback)
    const nonStandardImages = initialVariants
      .filter((v) => v.attribute_type !== "standard")
      .flatMap((v) =>
        (v.variant_images || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((i: any) => i.image_url)
      );
    if (nonStandardImages.length > 0) return nonStandardImages.slice(0, 5);
    // Empty array — user will upload
    return [];
  });

  const buildInitial = (type: string) =>
    initialVariants
      .filter((v) => v.attribute_type === type)
      .map((v) => v.attribute_value);

  const [colors, setColors] = useState<string[]>(buildInitial("color"));
  const [sizes, setSizes] = useState<string[]>(buildInitial("size"));
  const [materials, setMaterials] = useState<string[]>(
    buildInitial("material")
  );
  const [capacities, setCapacities] = useState<string[]>(
    buildInitial("capacity")
  );

  const convertVariantData = (v: any) => ({
    id: v.id,
    attributeType: v.attribute_type,
    attributeValue: v.attribute_value,
    price: v.price || 0,
    originalPrice: v.original_price || null,
    description: v.description_rich || v.description || "",
    descriptionImages: v.description_images || [],
    stock: v.stock ?? 999999,
    lowStockThreshold: v.low_stock_threshold ?? null,
    images: (v.variant_images || [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((i: any) => i.image_url),
    stockStatus: detectStockStatus(
      v.stock ?? 999999,
      v.low_stock_threshold ?? null
    ),
    bulkPricingTiers: (v.bulk_pricing_tiers || []).map((tier: any) => ({
      ...tier,
      tier_price: convertPriceFromPKR(tier.tier_price, currency),
      discount_price: tier.discount_price
        ? convertPriceFromPKR(tier.discount_price, currency)
        : null,
    })),
  });

  const buildInitialVariants = (type: string) =>
    initialVariants
      .filter((v) => v.attribute_type === type)
      .map(convertVariantData);

  const [colorVariants, setColorVariants] = useState<any[]>(
    buildInitialVariants("color")
  );
  const [sizeVariants, setSizeVariants] = useState<any[]>(
    buildInitialVariants("size")
  );
  const [materialVariants, setMaterialVariants] = useState<any[]>(
    buildInitialVariants("material")
  );
  const [capacityVariants, setCapacityVariants] = useState<any[]>(
    buildInitialVariants("capacity")
  );

  const totalVariants =
    colorVariants.length +
    sizeVariants.length +
    materialVariants.length +
    capacityVariants.length;

  const handleDescriptionChange = (
    newValue: string,
    imagesInDesc: string[]
  ) => {
    setDescription(newValue);
    setDescriptionImages(imagesInDesc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onError("Product name is required");
      return;
    }

    const allVariants = [
      ...colorVariants,
      ...sizeVariants,
      ...materialVariants,
      ...capacityVariants,
    ];
    if (allVariants.length === 0) {
      onError(
        "Please add at least one attribute (color, size, material, or capacity)"
      );
      return;
    }

    setIsUpdating(true);

    // 1. Update product
    const { error: productError } = await supabase
      .from("products")
      .update({
        name: name.trim(),
        description: description,
        description_images: descriptionImages,
        main_images: mainImages,
        category: tab.category,
        subcategory: tab.sub,
        brand: brand.trim() || null,
        condition,
        is_featured: isFeatured,
        is_active: isActive,
        currency_code: currency.code,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (productError) {
      onError("Failed to update product: " + productError.message);
      setIsUpdating(false);
      return;
    }

    // 2. Delete existing variants and their related data
    const { data: existingVariants } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId);

    if (existingVariants && existingVariants.length > 0) {
      const variantIds = existingVariants.map((v) => v.id);
      await supabase
        .from("variant_images")
        .delete()
        .in("variant_id", variantIds);
      await supabase
        .from("bulk_pricing_tiers")
        .delete()
        .in("variant_id", variantIds);
      await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", productId);
    }

    // 3. Insert new variants
    // NOTE: variant.price and variant.bulkPricingTiers.tier_price are ALREADY in PKR
    // because VariantFormItem's useEffect converts them via getPriceInPKR/convertPriceToPKR
    // before calling onUpdate. Do NOT convert again to avoid double conversion.
    for (const variant of allVariants) {
      const pricePKR = variant.price; // already PKR from VariantFormItem onUpdate
      const originalPricePKR = variant.originalPrice ?? null; // already PKR

      const { data: variantData, error: variantError } = await supabase
        .from("product_variants")
        .insert([
          {
            product_id: productId,
            attribute_type: variant.attributeType,
            attribute_value: variant.attributeValue,
            price: pricePKR,
            original_price: originalPricePKR,
            description_rich: variant.description || "",
            description_images: variant.descriptionImages || [],
            description: variant.description
              ? variant.description.substring(0, 500)
              : null,
            stock: variant.stock,
            low_stock_threshold: variant.lowStockThreshold,
            is_active: true,
            currency_code: currency.code,
            base_price_pkr: pricePKR,
            base_original_price_pkr: originalPricePKR,
          },
        ])
        .select()
        .single();

      if (variantError) {
        onError("Failed to save variant: " + variantError.message);
        setIsUpdating(false);
        return;
      }

      if (variant.images?.length > 0) {
        await supabase.from("variant_images").insert(
          variant.images.map((url: string, idx: number) => ({
            variant_id: variantData.id,
            image_url: url,
            display_order: idx,
          }))
        );
      }

      if (variant.bulkPricingTiers?.length > 0) {
        const validTiers = variant.bulkPricingTiers.filter(
          (t: BulkPricingTier) => t.min_quantity && t.tier_price
        );
        if (validTiers.length > 0) {
          await supabase.from("bulk_pricing_tiers").insert(
            validTiers.map((t: BulkPricingTier) => ({
              variant_id: variantData.id,
              min_quantity: t.min_quantity,
              max_quantity: t.max_quantity,
              tier_price: t.tier_price, // already PKR from VariantFormItem onUpdate
              discount_percentage: t.discount_percentage,
              discount_price: t.discount_price ?? null, // already PKR
              currency_code: currency.code,
              base_tier_price_pkr: t.tier_price, // already PKR
            }))
          );
        }
      }
    }

    // 4. Update FAQs
    await supabase.from("product_faqs").delete().eq("product_id", productId);
    if (faqs.length > 0) {
      const validFaqs = faqs.filter((f) => f.question.trim());
      if (validFaqs.length > 0) {
        await supabase.from("product_faqs").insert(
          validFaqs.map((f, idx) => ({
            product_id: productId,
            question: f.question.trim(),
            answer: f.answer.trim() || null,
            display_order: idx,
          }))
        );
      }
    }

    setIsUpdating(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="ap-form-grid-detailed">
        <div className="ap-detailed-left">
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
              <h3 className="ap-card-title">Basic Product Information</h3>
            </div>
            <div className="ap-card-body">
              <div className="ap-field">
                <label className="ap-label">Product Name *</label>
                <input
                  className="ap-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="ap-field">
                <label className="ap-label">Product Description</label>
                <ProductDescription
                  value={description}
                  onChange={handleDescriptionChange}
                  existingImages={descriptionImages}
                  maxImages={20}
                />
              </div>

              <div className="ap-row">
                <div className="ap-field">
                  <label className="ap-label">Brand</label>
                  <input
                    className="ap-input"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>
                <div className="ap-field">
                  <label className="ap-label">Condition</label>
                  <select
                    className="ap-select"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>
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
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </div>
              <h3 className="ap-card-title">
                Product Attributes (Each with Rich Text Description)
              </h3>
            </div>
            <div className="ap-card-body">
              <AttributeSelector
                label="Colors"
                type="color"
                values={colors}
                setValues={setColors}
                suggestions={COLOR_SUGGESTIONS}
                variants={colorVariants}
                setVariants={setColorVariants}
                onError={onError}
                initialVariantsData={initialVariants}
              />
              <AttributeSelector
                label="Sizes"
                type="size"
                values={sizes}
                setValues={setSizes}
                suggestions={SIZE_SUGGESTIONS}
                variants={sizeVariants}
                setVariants={setSizeVariants}
                onError={onError}
                initialVariantsData={initialVariants}
              />
              <AttributeSelector
                label="Materials"
                type="material"
                values={materials}
                setValues={setMaterials}
                suggestions={MATERIAL_SUGGESTIONS}
                variants={materialVariants}
                setVariants={setMaterialVariants}
                onError={onError}
                initialVariantsData={initialVariants}
              />
              <AttributeSelector
                label="Capacities"
                type="capacity"
                values={capacities}
                setValues={setCapacities}
                suggestions={CAPACITY_SUGGESTIONS}
                variants={capacityVariants}
                setVariants={setCapacityVariants}
                onError={onError}
                initialVariantsData={initialVariants}
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
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="ap-card-title">FAQs</h3>
            </div>
            <div className="ap-card-body">
              <FAQBuilder faqs={faqs} setFaqs={setFaqs} />
            </div>
          </div>
        </div>

        <div className="ap-detailed-right">
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
              <h3 className="ap-card-title">Main Product Gallery Images</h3>
            </div>
            <div className="ap-card-body">
              <p
                style={{
                  fontFamily: "var(--ap-sans)",
                  fontSize: "0.7rem",
                  color: "#8b6914",
                  marginBottom: "0.75rem",
                  background: "rgba(139,105,20,0.08)",
                  border: "1px solid rgba(139,105,20,0.2)",
                  borderRadius: "6px",
                  padding: "0.5rem 0.75rem",
                }}
              >
                📸 These are the main product images shown in listings. Add up
                to 20. First image = main thumbnail.
              </p>
              <MultiImageUploader
                images={mainImages}
                onImagesChange={setMainImages}
                onError={onError}
              />
            </div>
          </div>

          <div className="ap-card" style={{ marginTop: "1.5rem" }}>
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
                ["Colors", colors.length > 0 ? colors.join(", ") : "—"],
                ["Sizes", sizes.length > 0 ? sizes.join(", ") : "—"],
                [
                  "Materials",
                  materials.length > 0 ? materials.join(", ") : "—",
                ],
                [
                  "Capacities",
                  capacities.length > 0 ? capacities.join(", ") : "—",
                ],
                ["Total Variants", totalVariants.toString()],
                ["Main Images", `${mainImages.length} uploaded`],
                ["FAQs", `${faqs.length} added`],
                ["Currency", currency.code],
                ["Description Images", `${descriptionImages.length} images`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid rgba(218,165,32,0.1)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--ap-sans)",
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#999",
                    }}
                  >
                    {k}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--ap-serif)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#8b6914",
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
              <button
                type="submit"
                className="ap-submit-btn"
                disabled={isUpdating}
                style={{ marginTop: "1rem" }}
              >
                {isUpdating ? (
                  <>
                    <div className="ap-spinner" /> Updating in {currency.code}
                    ...
                  </>
                ) : (
                  <>
                    Update Product with Variants in {currency.code}{" "}
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
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "#666",
                  textAlign: "center",
                  marginTop: "0.5rem",
                }}
              >
                Prices will be saved in PKR (base) and converted to{" "}
                {currency.code} for display
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// ─── Main Edit Product Page ──────────────────────────────────────────────────

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const { currency, loading: currencyLoading } = useCurrency();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [productData, setProductData] = useState<any>(null);
  const [variantsData, setVariantsData] = useState<any[]>([]);
  const [faqsData, setFaqsData] = useState<FAQ[]>([]);
  const [simpleImages, setSimpleImages] = useState<string[]>([]);
  const [simpleBulkTiers, setSimpleBulkTiers] = useState<BulkPricingTier[]>([]);
  const [simpleVariant, setSimpleVariant] = useState<any>(null);

  const [mode, setMode] = useState<Mode>("simple");
  const [activeTab, setActiveTab] = useState(0);

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

  // Auth check
  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          router.push("/signin?redirectTo=/panel");
          return;
        }
        if (!isOwner(user.email)) {
          router.push("/");
          return;
        }
        if (mounted) {
          setAuthorized(true);
          setChecking(false);
        }
      } catch {
        router.push("/signin");
      }
    };
    checkAuth();
    return () => {
      mounted = false;
    };
  }, [router]);

  // Load product data
  useEffect(() => {
    if (!authorized || !productId) return;
    let mounted = true;

    async function loadAll() {
      setDataLoading(true);
      try {
        const { data: prod, error: prodErr } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();
        if (prodErr) throw prodErr;

        const { data: variants } = await supabase
          .from("product_variants")
          .select("*, variant_images(*), bulk_pricing_tiers(*)")
          .eq("product_id", productId)
          .order("created_at", { ascending: true });

        const { data: faqs } = await supabase
          .from("product_faqs")
          .select("*")
          .eq("product_id", productId)
          .order("display_order");

        if (!mounted) return;

        setProductData(prod);
        setFaqsData(
          (faqs || []).map((f: any) => ({
            id: f.id,
            question: f.question,
            answer: f.answer || "",
            display_order: f.display_order,
          }))
        );

        const allVariants = variants || [];
        const isSimple =
          allVariants.length === 0 ||
          allVariants.every((v: any) => v.attribute_type === "standard");

        if (isSimple) {
          setMode("simple");
          const sv = allVariants[0] || null;
          setSimpleVariant(sv);
          const sortedImages = (sv?.variant_images || [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((i: any) => i.image_url);
          setSimpleImages(sortedImages);
          setSimpleBulkTiers(sv?.bulk_pricing_tiers || []);
        } else {
          setMode("detailed");
          const processedVariants = allVariants.map((v: any) => ({
            ...v,
            description_rich: v.description_rich || v.description || "",
            description_images: v.description_images || [],
            images: (v.variant_images || [])
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((i: any) => i.image_url),
          }));
          setVariantsData(processedVariants);
        }

        if (prod) {
          const tabIdx = TABS.findIndex(
            (t) => t.category === prod.category && t.sub === prod.subcategory
          );
          if (tabIdx !== -1) setActiveTab(tabIdx);
        }
      } catch (err) {
        console.error("Load error:", err);
        addToast("error", "Load Failed", "Could not fetch product details");
      } finally {
        if (mounted) setDataLoading(false);
      }
    }

    loadAll();
    return () => {
      mounted = false;
    };
  }, [authorized, productId]);

  if (currencyLoading || checking || dataLoading) {
    return (
      <div className="ap-root">
        <div className="ap-ambient" aria-hidden="true" />
        <div className="ap-grain" aria-hidden="true" />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            className="ap-spinner"
            style={{ width: "40px", height: "40px" }}
          />
          <p
            style={{
              color: "#666",
              fontFamily: "var(--ap-sans)",
              fontSize: "0.8rem",
            }}
          >
            {checking
              ? "Verifying access..."
              : currencyLoading
              ? "Loading currency..."
              : "Loading product..."}
          </p>
        </div>
      </div>
    );
  }

  if (!authorized || !productData) return null;

  const handleSuccess = () => {
    addToast(
      "success",
      "Product Updated",
      `${productData.name || "Product"} has been updated successfully in ${
        currency.code
      }!`
    );
    setTimeout(() => router.push("/panel"), 1500);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    )
      return;

    const { data: variants } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId);
    if (variants && variants.length > 0) {
      const ids = variants.map((v) => v.id);
      await supabase.from("variant_images").delete().in("variant_id", ids);
      await supabase.from("bulk_pricing_tiers").delete().in("variant_id", ids);
    }
    await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", productId);
    await supabase.from("product_faqs").delete().eq("product_id", productId);
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      addToast("error", "Delete Failed", error.message);
    } else {
      addToast(
        "success",
        "Product Deleted",
        "Product has been removed from store. Redirecting..."
      );
      setTimeout(() => router.push("/panel"), 1500);
    }
  };

  return (
    <div className="ap-root">
      <div className="ap-ambient" aria-hidden="true" />
      <div className="ap-grain" aria-hidden="true" />
      <PanelNavbar />

      <div className="ap-content">
        {/* ── Page Header ── */}
        <div
          className="ap-page-header"
          style={{
            position: "relative",
            textAlign: "center",
            marginBottom: "2.5rem",
          }}
        >
          <Link
            href="/panel"
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontFamily: "var(--ap-sans)",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#8b6914",
              textDecoration: "none",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ width: "16px", height: "16px" }}
            >
              <path
                d="M19 12H5M12 19l-7-7 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </Link>

          <div>
            <p className="ap-eyebrow">
              <span className="ap-ey-line" />
              Inventory Management — {currency.code}
              <span className="ap-ey-line" />
            </p>
            <h1 className="ap-page-title">
              Edit <em>{productData.name || "Product"}</em>
            </h1>
            <p className="ap-page-sub">
              Update product information, images, and specifications
            </p>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444",
              fontFamily: "var(--ap-sans)",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ width: "14px", height: "14px" }}
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
            Delete
          </button>
        </div>

        {/* ── Mode Buttons ── */}
        <div className="ap-mode-buttons">
          <button
            type="button"
            className={`ap-mode-btn ${mode === "simple" ? "active" : ""}`}
            onClick={() => setMode("simple")}
          >
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
            Simple Mode
            <br />
            <span>Single product with images</span>
          </button>
          <button
            type="button"
            className={`ap-mode-btn ${mode === "detailed" ? "active" : ""}`}
            onClick={() => setMode("detailed")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Detailed Mode
            <br />
            <span>
              Colors, sizes, materials, capacities with variant images
            </span>
          </button>
        </div>

        {/* ── Category Tabs ── */}
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

        {/* ── Form ── */}
        {mode === "simple" ? (
          <SimpleModeEditForm
            key={`simple-${activeTab}`}
            tab={TABS[activeTab]}
            productId={productId}
            initialProduct={productData}
            initialVariant={simpleVariant}
            initialImages={simpleImages}
            initialFaqs={faqsData}
            initialBulkTiers={simpleBulkTiers}
            onSuccess={handleSuccess}
            onError={(msg) => addToast("error", "Error", msg)}
          />
        ) : (
          <DetailedModeEditForm
            key={`detailed-${activeTab}`}
            tab={TABS[activeTab]}
            productId={productId}
            initialProduct={productData}
            initialVariants={variantsData}
            initialFaqs={faqsData}
            onSuccess={handleSuccess}
            onError={(msg) => addToast("error", "Error", msg)}
          />
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
