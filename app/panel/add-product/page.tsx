"use client";

import {
  BulkPricingManager,
  BulkPricingTier,
} from "@/app/components/BulkPricingManager";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import PanelNavbar from "@/app/components/PanelNavbar";
import {
  supabase,
  ProductVariant,
  VariantImage,
  ProductFAQ,
} from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useCurrency } from "../../context/CurrencyContext";
import { convertPriceToPKR, convertPriceFromPKR } from "@/lib/panelCurrency";
import ProductDescription from "@/app/components/ProductDescription";
import "../panel.css";
import "./add-product.css";

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  title: string;
  msg: string;
  exiting?: boolean;
};

type Mode = "simple" | "detailed";

type FAQ = {
  id?: string;
  question: string;
  answer: string;
  display_order: number;
};

type StockStatus = "in_stock" | "out_of_stock" | "low_stock";

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

function StockStatusSelector({
  value,
  onChange,
  lowStockThreshold,
  onThresholdChange,
}: {
  value: StockStatus;
  onChange: (status: StockStatus) => void;
  lowStockThreshold: number | null;
  onThresholdChange: (threshold: number | null) => void;
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
      {value === "low_stock" && (
        <div className="ap-low-stock-threshold">
          <label>Alert when quantity reaches:</label>
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

function MultiImageUploader({
  images,
  onImagesChange,
  onError,
  maxImages = 20,
}: {
  images: string[];
  onImagesChange: (imgs: string[]) => void;
  onError: (msg: string) => void;
  maxImages?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length + files.length > maxImages) {
      onError(`Maximum ${maxImages} images allowed`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    const newUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          onError(`"${file.name}" is not an image file`);
          continue;
        }
        try {
          const url = await uploadToCloudinary(file);
          newUrls.push(url);
        } catch (err) {
          onError(`Failed to upload ${file.name}`);
        }
      }
      onImagesChange([...images, ...newUrls]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (index: number) =>
    onImagesChange(images.filter((_, i) => i !== index));

  return (
    <div className="ap-variant-images">
      <div className="ap-variant-image-list">
        {images.map((img, idx) => (
          <div key={idx} className="ap-variant-image-item">
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
        {images.length < maxImages && (
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
              <>+ Add Image</>
            )}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>
      {images.length > 0 && (
        <div className="ap-image-count">
          {images.length} / {maxImages} images
        </div>
      )}
    </div>
  );
}

// ─── Color Detection Helpers ─────────────────────────────────────────────────

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

// VariantFormItem with Rich Text Description
function VariantFormItem({
  attributeType,
  attributeValue,
  onUpdate,
  onRemove,
  onError,
  currencyRate,
  currencyCode,
  currencySymbol,
  isFirstItem,
}: {
  attributeType: string;
  attributeValue: string;
  onUpdate: (data: any) => void;
  onRemove: () => void;
  onError: (msg: string) => void;
  currencyRate: number;
  currencyCode: string;
  currencySymbol: string;
  isFirstItem?: boolean;
}) {
  const [priceDisplay, setPriceDisplay] = useState("");
  const [originalPriceDisplay, setOriginalPriceDisplay] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionImages, setDescriptionImages] = useState<string[]>([]);
  const [stockStatus, setStockStatus] = useState<StockStatus>("in_stock");
  const [lowStockThreshold, setLowStockThreshold] = useState<number | null>(
    null
  );
  const [images, setImages] = useState<string[]>([]);
  const [bulkTiers, setBulkTiers] = useState<BulkPricingTier[]>([]);
  const expandedRef = useRef(isFirstItem !== false);
  const [, forceUpdate] = useState(0);
  const expanded = expandedRef.current;
  const toggleExpanded = () => {
    expandedRef.current = !expandedRef.current;
    forceUpdate((n) => n + 1);
  };

  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const getStockValue = (): number => {
    if (stockStatus === "out_of_stock") return 0;
    if (stockStatus === "low_stock") return lowStockThreshold || 5;
    return 999999;
  };

  const getPriceInPKRFast = (displayPrice: string): number => {
    const priceNum = parseFloat(displayPrice) || 0;
    if (currencyCode === "PKR") return priceNum;
    return Math.round((priceNum / currencyRate) * 100) / 100;
  };

  const handleDescriptionChange = (
    newValue: string,
    imagesInDesc: string[]
  ) => {
    setDescription(newValue);
    setDescriptionImages(imagesInDesc);
    // Immediately update parent with both description text and images
    onUpdateRef.current({
      attributeType,
      attributeValue,
      pricePKR: getPriceInPKRFast(priceDisplay),
      priceDisplay,
      originalPricePKR: originalPriceDisplay
        ? getPriceInPKRFast(originalPriceDisplay)
        : null,
      originalPriceDisplay,
      description: newValue,
      descriptionImages: imagesInDesc,
      stock: getStockValue(),
      lowStockThreshold: stockStatus === "low_stock" ? lowStockThreshold : null,
      images,
      stockStatus,
      bulkPricingTiers: bulkTiers.map((tier) => ({
        ...tier,
        tier_price:
          currencyCode !== "PKR"
            ? Math.round((tier.tier_price / currencyRate) * 100) / 100
            : tier.tier_price,
      })),
      displayCurrency: currencyCode,
    });
  };

  useEffect(() => {
    const pricePKR = getPriceInPKRFast(priceDisplay);
    const originalPricePKR = originalPriceDisplay
      ? getPriceInPKRFast(originalPriceDisplay)
      : null;

    onUpdateRef.current({
      attributeType,
      attributeValue,
      pricePKR,
      priceDisplay,
      originalPricePKR,
      originalPriceDisplay,
      description,
      descriptionImages,
      stock: getStockValue(),
      lowStockThreshold: stockStatus === "low_stock" ? lowStockThreshold : null,
      images,
      stockStatus,
      bulkPricingTiers: bulkTiers.map((tier) => ({
        ...tier,
        tier_price:
          currencyCode !== "PKR"
            ? Math.round((tier.tier_price / currencyRate) * 100) / 100
            : tier.tier_price,
      })),
      displayCurrency: currencyCode,
    });
  }, [
    priceDisplay,
    originalPriceDisplay,
    description,
    descriptionImages,
    stockStatus,
    lowStockThreshold,
    images,
    bulkTiers,
    currencyRate,
    currencyCode,
    attributeType,
    attributeValue,
  ]);

  const currentUnitPrice = parseFloat(priceDisplay) || 0;
  // Use the symbol passed from currency prop directly — covers ALL currencies (AED, SAR, CAD, AUD, INR, etc.)
  const getSymbol = () => currencySymbol || currencyCode;

  const getStatusLabel = () => {
    if (stockStatus === "out_of_stock") return "Out of Stock";
    if (stockStatus === "low_stock")
      return `Low Stock (Alert: ${lowStockThreshold || 5})`;
    const stockVal = getStockValue();
    if (stockVal === 999999) return "In Stock (Unlimited)";
    return `In Stock (${stockVal} pcs)`;
  };

  const colorStyle =
    attributeType === "color" ? getColorStyle(attributeValue) : null;

  return (
    <div className="ap-variant-form-item">
      <div className="ap-variant-form-header" onClick={toggleExpanded}>
        {/* Attribute Type Label */}
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

        {/* Attribute Value — colored swatch for colors, plain badge for others */}
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
          {getStatusLabel()}
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
        {/* Expand/collapse arrow */}
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
        style={{ display: expanded ? "flex" : "none" }}
      >
        <div className="ap-row">
          <div className="ap-field">
            <label className="ap-label">Sale Price ({getSymbol()})</label>
            <input
              type="number"
              step="0.01"
              className="ap-input"
              value={priceDisplay}
              onChange={(e) => setPriceDisplay(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="ap-field">
            <label className="ap-label">Original Price ({getSymbol()})</label>
            <input
              type="number"
              step="0.01"
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
            onChange={setStockStatus}
            lowStockThreshold={lowStockThreshold}
            onThresholdChange={setLowStockThreshold}
          />
        </div>

        <div className="ap-field">
          <label className="ap-label">Gallery Images (Max 20)</label>
          <MultiImageUploader
            images={images}
            onImagesChange={setImages}
            onError={onError}
            maxImages={20}
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

function AttributeSelector({
  label,
  type,
  values,
  setValues,
  suggestions,
  variants,
  setVariants,
  onError,
  currencyRate,
  currencyCode,
  currencySymbol,
}: {
  label: string;
  type: string;
  values: string[];
  setValues: (v: string[]) => void;
  suggestions: string[];
  variants: any[];
  setVariants: (v: any[] | ((prev: any[]) => any[])) => void;
  onError: (msg: string) => void;
  currencyRate: number;
  currencyCode: string;
  currencySymbol: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const addValue = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !values.includes(trimmed)) {
      setValues([...values, trimmed]);
      const newVariant = {
        attributeType: type,
        attributeValue: trimmed,
        priceDisplay: "",
        originalPriceDisplay: "",
        description: "",
        descriptionImages: [],
        stock: 999999,
        lowStockThreshold: null,
        images: [],
        stockStatus: "in_stock" as StockStatus,
        bulkPricingTiers: [],
      };
      setVariants((prev: any[]) => [...prev, newVariant]);
    }
    setInputValue("");
  };

  const removeValue = (valueToRemove: string) => {
    setValues(values.filter((v) => v !== valueToRemove));
    setVariants((prev: any[]) =>
      prev.filter((v) => v.attributeValue !== valueToRemove)
    );
  };

  const updateVariant = useCallback(
    (index: number, data: any) => {
      setVariants((prev: any[]) => {
        const newVariants = [...prev];
        if (newVariants[index]) {
          newVariants[index] = { ...newVariants[index], ...data };
        }
        return newVariants;
      });
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
            onKeyDown={(e) => e.key === "Enter" && addValue(inputValue)}
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
                onUpdate={(data) => updateVariant(idx, data)}
                onRemove={() => removeValue(value)}
                onError={onError}
                currencyRate={currencyRate}
                currencyCode={currencyCode}
                currencySymbol={currencySymbol}
                isFirstItem={idx === 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SIMPLE MODE - WITH RICH TEXT EDITOR
// ============================================================
function SimpleModeForm({
  tab,
  onSuccess,
  onError,
  router,
}: {
  tab: (typeof TABS)[0];
  onSuccess: () => void;
  onError: (msg: string) => void;
  router: any;
}) {
  const { currency } = useCurrency();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionImages, setDescriptionImages] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [originalPriceDisplay, setOriginalPriceDisplay] = useState("");
  const [condition, setCondition] = useState("new");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [stockStatus, setStockStatus] = useState<StockStatus>("in_stock");
  const [lowStockThreshold, setLowStockThreshold] = useState<number | null>(
    null
  );
  const [images, setImages] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [bulkTiers, setBulkTiers] = useState<BulkPricingTier[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDescriptionChange = (
    newValue: string,
    imagesInDesc: string[]
  ) => {
    setDescription(newValue);
    setDescriptionImages(imagesInDesc);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (images.length + files.length > 20) {
      onError("Maximum 20 images allowed");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        onError(`"${file.name}" is not an image file`);
        continue;
      }
      try {
        const url = await uploadToCloudinary(file);
        newUrls.push(url);
      } catch (err) {
        onError(`Failed to upload ${file.name}`);
      }
    }
    setImages([...images, ...newUrls]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (index: number) =>
    setImages(images.filter((_, i) => i !== index));

  const getStockValue = (): number => {
    if (stockStatus === "out_of_stock") return 0;
    if (stockStatus === "low_stock") return lowStockThreshold || 5;
    return 999999;
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setDescriptionImages([]);
    setBrand("");
    setPriceDisplay("");
    setOriginalPriceDisplay("");
    setImages([]);
    setFaqs([]);
    setBulkTiers([]);
    setLowStockThreshold(null);
    setStockStatus("in_stock");
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const dbInsert = async (table: string, body: object) => {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      const errMsg = Array.isArray(data)
        ? data[0]?.message
        : data?.message || data?.error || JSON.stringify(data);
      throw new Error(`${table} insert failed (${res.status}): ${errMsg}`);
    }
    return Array.isArray(data) ? data[0] : data;
  };

  const dbInsertMany = async (table: string, body: object[]) => {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error(`${table} bulk insert error:`, data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!name.trim()) {
      onError("Product name is required");
      return;
    }
    if (!priceDisplay || parseFloat(priceDisplay) <= 0) {
      onError("Sale price is required and must be greater than 0");
      return;
    }

    if (isSubmitting) {
      onError("Product is already being saved...");
      return;
    }

    setIsSubmitting(true);
    console.log("🚀 Starting product save...");

    try {
      const currentCurrency = currency;
      const currentRate = currency.rate;
      const priceNum = parseFloat(priceDisplay);
      const originalPriceNum = parseFloat(originalPriceDisplay) || 0;

      let pricePKR = priceNum;
      let originalPricePKR: number | null =
        originalPriceNum > 0 ? originalPriceNum : null;

      if (currentCurrency.code !== "PKR" && currentRate > 0) {
        pricePKR = Number((priceNum / currentRate).toFixed(2));
        if (originalPricePKR) {
          originalPricePKR = Number(
            (originalPriceNum / currentRate).toFixed(2)
          );
        }
      }

      // 1. Insert Product with rich text description and images
      console.log("📦 Inserting product...");
      const productData = await dbInsert("products", {
        name: name.trim(),
        description: description || null,
        description_images: descriptionImages,
        category: tab.category,
        subcategory: tab.sub,
        brand: brand.trim() || null,
        condition: condition,
        is_featured: isFeatured,
        is_active: isActive,
        price: pricePKR,
        stock: getStockValue(),
        images: images,
        original_price: originalPricePKR,
      });
      console.log("✅ Product inserted:", productData.id);

      // 2. Insert Variant with description images
      console.log("📦 Inserting variant...");
      const variantData = await dbInsert("product_variants", {
        product_id: productData.id,
        attribute_type: "standard",
        attribute_value: "Standard",
        price: pricePKR,
        original_price: originalPricePKR,
        description_rich: description || null,
        description_images: descriptionImages,
        description: description ? description.substring(0, 500) : null,
        stock: getStockValue(),
        low_stock_threshold:
          stockStatus === "low_stock" ? lowStockThreshold : null,
        is_active: true,
      });
      console.log("✅ Variant inserted:", variantData.id);

      console.log("✅ Product saved successfully!");
      resetForm();
      onSuccess();

      // 3. Background: Insert Images
      if (images.length > 0) {
        dbInsertMany(
          "variant_images",
          images.map((url, idx) => ({
            variant_id: variantData.id,
            image_url: url,
            display_order: idx,
          }))
        ).catch((err) => console.error("Image insert error:", err));
      }

      // 4. Background: Insert Bulk Tiers
      const validTiers = bulkTiers.filter(
        (t) => t.min_quantity && t.tier_price > 0
      );
      if (validTiers.length > 0) {
        dbInsertMany(
          "bulk_pricing_tiers",
          validTiers.map((t) => ({
            variant_id: variantData.id,
            min_quantity: t.min_quantity,
            max_quantity: t.max_quantity,
            tier_price:
              currentCurrency.code !== "PKR" && currentRate > 0
                ? Number((t.tier_price / currentRate).toFixed(2))
                : t.tier_price,
            discount_percentage: t.discount_percentage,
            discount_price: t.discount_price ?? null,
          }))
        ).catch((err) => console.error("Tier insert error:", err));
      }

      // 5. Background: Insert FAQs
      const validFaqs = faqs.filter((f) => f.question.trim());
      if (validFaqs.length > 0) {
        dbInsertMany(
          "product_faqs",
          validFaqs.map((f, idx) => ({
            product_id: productData.id,
            question: f.question.trim(),
            answer: f.answer.trim() || null,
            display_order: idx,
          }))
        ).catch((err) => console.error("FAQ insert error:", err));
      }

      setTimeout(() => {
        window.location.href = "/panel";
      }, 1500);
    } catch (err: any) {
      console.error("❌ Submit error:", err);
      onError(
        err.message || "Failed to save product. Check console for details."
      );
    } finally {
      setIsSubmitting(false);
    }
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
                    step="0.01"
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
                    step="0.01"
                    className="ap-input"
                    value={originalPriceDisplay}
                    onChange={(e) => setOriginalPriceDisplay(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="ap-field">
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
                  onChange={setStockStatus}
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
              <h3 className="ap-card-title">Product Images (Max 20)</h3>
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
                  multiple
                  onChange={(e) => handleImageUpload(e.target.files)}
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
                <p className="ap-img-upload-sub">
                  JPG, PNG, WEBP (Max 20 images)
                </p>
              </div>
              {images.length > 0 && (
                <div className="ap-img-previews">
                  {images.map((url, i) => (
                    <div key={i} className="ap-img-thumb">
                      <img src={url} alt={`Product ${i + 1}`} />
                      <button
                        type="button"
                        className="ap-img-thumb-remove"
                        onClick={() => removeImage(i)}
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
                  <div className="ap-image-count">
                    {images.length} / 20 images
                  </div>
                </div>
              )}
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
              <button
                type="submit"
                className="ap-submit-btn"
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? (
                  <>
                    <div
                      className="ap-spinner"
                      style={{
                        width: "16px",
                        height: "16px",
                        marginRight: "8px",
                      }}
                    />{" "}
                    Saving...
                  </>
                ) : (
                  <>
                    Save Product in {currency.symbol}{" "}
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

// ============================================================
// DETAILED MODE - WITH RICH TEXT EDITOR FOR EACH VARIANT
// ============================================================
function DetailedModeForm({
  tab,
  onSuccess,
  onError,
  router,
}: {
  tab: (typeof TABS)[0];
  onSuccess: () => void;
  onError: (msg: string) => void;
  router: any;
}) {
  const { currency } = useCurrency();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionImages, setDescriptionImages] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("new");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [capacities, setCapacities] = useState<string[]>([]);
  const [colorVariants, setColorVariants] = useState<any[]>([]);
  const [sizeVariants, setSizeVariants] = useState<any[]>([]);
  const [materialVariants, setMaterialVariants] = useState<any[]>([]);
  const [capacityVariants, setCapacityVariants] = useState<any[]>([]);

  const handleDescriptionChange = (
    newValue: string,
    imagesInDesc: string[]
  ) => {
    setDescription(newValue);
    setDescriptionImages(imagesInDesc);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setDescriptionImages([]);
    setBrand("");
    setColors([]);
    setSizes([]);
    setMaterials([]);
    setCapacities([]);
    setColorVariants([]);
    setSizeVariants([]);
    setMaterialVariants([]);
    setCapacityVariants([]);
    setFaqs([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
      onError("Please add at least one attribute");
      return;
    }

    let hasValidPrice = false;
    for (const v of allVariants) {
      const priceVal = parseFloat(v.priceDisplay);
      if (!isNaN(priceVal) && priceVal > 0) {
        hasValidPrice = true;
        break;
      }
    }
    if (!hasValidPrice) {
      onError("Please set a valid price for at least one variant");
      return;
    }

    if (isSubmitting) {
      onError("Product is already being saved...");
      return;
    }

    setIsSubmitting(true);
    console.log("🚀 Starting detailed product save...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const dbInsert = async (table: string, body: object) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = Array.isArray(data)
          ? data[0]?.message
          : data?.message || data?.error || JSON.stringify(data);
        throw new Error(`${table} insert failed (${res.status}): ${errMsg}`);
      }
      return Array.isArray(data) ? data[0] : data;
    };

    const dbInsertMany = async (table: string, body: object[]) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error(`${table} bulk insert error:`, data);
      }
    };

    try {
      const currentCurrency = currency;
      const currentRate = currency.rate;

      // 1. Insert Product with rich text description and images
      console.log("📦 Inserting product...");
      const productData = await dbInsert("products", {
        name: name.trim(),
        description: description || null,
        description_images: descriptionImages,
        category: tab.category,
        subcategory: tab.sub,
        brand: brand.trim() || null,
        condition: condition,
        is_featured: isFeatured,
        is_active: isActive,
      });
      console.log("✅ Product inserted:", productData.id);

      // 2. Insert each variant with rich text description and images
      for (const variant of allVariants) {
        const priceNum = parseFloat(variant.priceDisplay);
        if (isNaN(priceNum) || priceNum <= 0) continue;

        const originalPriceNum = variant.originalPriceDisplay
          ? parseFloat(variant.originalPriceDisplay)
          : 0;

        let pricePKR = priceNum;
        let originalPricePKR: number | null =
          originalPriceNum > 0 ? originalPriceNum : null;

        if (currentCurrency.code !== "PKR" && currentRate > 0) {
          pricePKR = Number((priceNum / currentRate).toFixed(2));
          if (originalPricePKR) {
            originalPricePKR = Number(
              (originalPriceNum / currentRate).toFixed(2)
            );
          }
        }
        if (pricePKR <= 0) pricePKR = 0.01;

        console.log(`📦 Inserting variant: ${variant.attributeValue}...`);
        let variantData: any;
        try {
          variantData = await dbInsert("product_variants", {
            product_id: productData.id,
            attribute_type: variant.attributeType,
            attribute_value: variant.attributeValue,
            price: pricePKR,
            original_price: originalPricePKR,
            description_rich: variant.description || null,
            description_images: variant.descriptionImages || [],
            description: variant.description
              ? variant.description.substring(0, 500)
              : null,
            stock: variant.stock || 999999,
            low_stock_threshold: variant.lowStockThreshold || null,
            is_active: true,
          });
          console.log(`✅ Variant inserted: ${variantData.id}`);
        } catch (varErr: any) {
          console.error("Variant insert error:", varErr.message);
          continue;
        }

        // Background: Insert images
        if (variant.images && variant.images.length > 0) {
          dbInsertMany(
            "variant_images",
            variant.images.map((url: string, idx: number) => ({
              variant_id: variantData.id,
              image_url: url,
              display_order: idx,
            }))
          ).catch((err) => console.error("Image error:", err));
        }

        // Background: Insert bulk tiers
        if (variant.bulkPricingTiers && variant.bulkPricingTiers.length > 0) {
          const validTiers = variant.bulkPricingTiers.filter(
            (t: any) => t.min_quantity && t.tier_price > 0
          );
          if (validTiers.length > 0) {
            dbInsertMany(
              "bulk_pricing_tiers",
              validTiers.map((t: any) => ({
                variant_id: variantData.id,
                min_quantity: t.min_quantity,
                max_quantity: t.max_quantity,
                tier_price: t.tier_price,
                discount_percentage: t.discount_percentage ?? null,
                discount_price: t.discount_price ?? null,
              }))
            ).catch((err) => console.error("Tier error:", err));
          }
        }
      }

      console.log("✅ Product saved successfully!");
      resetForm();
      onSuccess();

      // Background: Insert FAQs
      const validFaqs = faqs.filter((f) => f.question.trim());
      if (validFaqs.length > 0) {
        dbInsertMany(
          "product_faqs",
          validFaqs.map((f, idx) => ({
            product_id: productData.id,
            question: f.question.trim(),
            answer: f.answer.trim() || null,
            display_order: idx,
          }))
        ).catch((err) => console.error("FAQ error:", err));
      }

      setTimeout(() => {
        window.location.href = "/panel";
      }, 1500);
    } catch (err: any) {
      console.error("❌ Submit error:", err);
      onError(
        err.message || "Failed to save product. Check console for details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalVariants =
    colorVariants.length +
    sizeVariants.length +
    materialVariants.length +
    capacityVariants.length;

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
                currencyRate={currency.rate}
                currencyCode={currency.code}
                currencySymbol={currency.symbol}
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
                currencyRate={currency.rate}
                currencyCode={currency.code}
                currencySymbol={currency.symbol}
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
                currencyRate={currency.rate}
                currencyCode={currency.code}
                currencySymbol={currency.symbol}
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
                currencyRate={currency.rate}
                currencyCode={currency.code}
                currencySymbol={currency.symbol}
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
                ["FAQs", `${faqs.length} added`],
                ["Currency", currency.code],
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
                disabled={isSubmitting}
                style={{
                  marginTop: "1rem",
                  opacity: isSubmitting ? 0.7 : 1,
                  width: "100%",
                }}
              >
                {isSubmitting ? (
                  <>
                    <div
                      className="ap-spinner"
                      style={{
                        width: "16px",
                        height: "16px",
                        marginRight: "8px",
                      }}
                    />{" "}
                    Saving {totalVariants} variant(s)...
                  </>
                ) : (
                  <>
                    Save Product with {totalVariants} Variant(s) in{" "}
                    {currency.symbol}{" "}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ width: "14px", height: "14px" }}
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [mode, setMode] = useState<Mode>("simple");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { currency } = useCurrency();

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

  const handleModeChange = (newMode: Mode) => {
    if (newMode === mode) return;
    setToasts([]);
    setMode(newMode);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            Inventory Management - {currency.code}
            <span className="ap-ey-line" />
          </p>
          <h1 className="ap-page-title">
            Add <em>Product</em> in {currency.code}
          </h1>
          <p className="ap-page-sub">
            Choose mode: Simple images only or detailed variant management
            <br />
            <span style={{ fontSize: "0.7rem", color: "#8b6914" }}>
              💱 All prices will be saved in PKR (base) and converted to{" "}
              {currency.code} for display
            </span>
          </p>
        </div>
        <div className="ap-mode-buttons">
          <button
            type="button"
            className={`ap-mode-btn ${mode === "simple" ? "active" : ""}`}
            onClick={() => handleModeChange("simple")}
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
            <span>Just product images</span>
          </button>
          <button
            type="button"
            className={`ap-mode-btn ${mode === "detailed" ? "active" : ""}`}
            onClick={() => handleModeChange("detailed")}
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
        {mode === "simple" ? (
          <SimpleModeForm
            key={`simple-${mode}`}
            tab={TABS[activeTab]}
            onSuccess={() =>
              addToast(
                "success",
                "Product Saved",
                `${TABS[activeTab].sub} added successfully! Redirecting...`
              )
            }
            onError={(msg) => addToast("error", "Error", msg)}
            router={router}
          />
        ) : (
          <DetailedModeForm
            key={`detailed-${mode}`}
            tab={TABS[activeTab]}
            onSuccess={() =>
              addToast(
                "success",
                "Product Saved",
                `${TABS[activeTab].sub} with variants added successfully! Redirecting...`
              )
            }
            onError={(msg) => addToast("error", "Error", msg)}
            router={router}
          />
        )}
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}