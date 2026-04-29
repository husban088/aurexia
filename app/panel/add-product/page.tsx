"use client";

import {
  BulkPricingManager,
  BulkPricingTier,
} from "@/app/components/BulkPricingManager";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation"; // ← YEH IMPORT ADD KIYA
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

// Pre-defined suggestions
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

// Stock Status Selector Component
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
  const handleInStock = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("in_stock");
  };

  const handleOutOfStock = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("out_of_stock");
  };

  const handleLowStock = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("low_stock");
  };

  const uniqueId = useRef(`stock_${Date.now()}_${Math.random()}`).current;

  return (
    <div>
      <div className="ap-stock-radio-group">
        <div
          className={`ap-stock-radio-option ${
            value === "in_stock" ? "active-in-stock" : ""
          }`}
          onClick={handleInStock}
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
          onClick={handleOutOfStock}
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
          onClick={handleLowStock}
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

// FAQ Builder Component
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
          </svg>
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
        </svg>
        Add Another FAQ
      </button>
    </div>
  );
}

// Multi-Image Upload Component
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
    </div>
  );
}

// Variant Form Item
function VariantFormItem({
  attributeType,
  attributeValue,
  onUpdate,
  onRemove,
  onError,
}: {
  attributeType: string;
  attributeValue: string;
  onUpdate: (data: any) => void;
  onRemove: () => void;
  onError: (msg: string) => void;
}) {
  const { currency } = useCurrency();
  const [priceDisplay, setPriceDisplay] = useState("");
  const [originalPriceDisplay, setOriginalPriceDisplay] = useState("");
  const [description, setDescription] = useState("");
  const [stockStatus, setStockStatus] = useState<StockStatus>("in_stock");
  const [lowStockThreshold, setLowStockThreshold] = useState<number | null>(
    null
  );
  const [images, setImages] = useState<string[]>([]);
  const [bulkTiers, setBulkTiers] = useState<BulkPricingTier[]>([]);
  const [expanded, setExpanded] = useState(true);

  const getStockValue = (): number => {
    switch (stockStatus) {
      case "out_of_stock":
        return 0;
      case "low_stock":
        return lowStockThreshold || 5;
      default:
        return 999999;
    }
  };

  const getPriceInPKR = (displayPrice: string): number => {
    const priceNum = parseFloat(displayPrice) || 0;
    return convertPriceToPKR(priceNum, currency);
  };

  useEffect(() => {
    onUpdate({
      attributeType,
      attributeValue,
      pricePKR: getPriceInPKR(priceDisplay),
      priceDisplay: priceDisplay,
      originalPricePKR: originalPriceDisplay
        ? getPriceInPKR(originalPriceDisplay)
        : null,
      originalPriceDisplay: originalPriceDisplay,
      description,
      stock: getStockValue(),
      lowStockThreshold: stockStatus === "low_stock" ? lowStockThreshold : null,
      images,
      stockStatus,
      bulkPricingTiers: bulkTiers.map((tier) => ({
        ...tier,
        tier_price: convertPriceToPKR(tier.tier_price, currency),
      })),
      displayCurrency: currency.code,
    });
  }, [
    priceDisplay,
    originalPriceDisplay,
    description,
    stockStatus,
    lowStockThreshold,
    images,
    bulkTiers,
    currency,
  ]);

  const currentUnitPrice = parseFloat(priceDisplay) || 0;

  return (
    <div className="ap-variant-form-item">
      <div
        className="ap-variant-form-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="ap-variant-form-value">{attributeValue}</span>
        <span className="ap-variant-form-badge">{attributeType}</span>
        <span
          className="ap-variant-form-badge"
          style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
        >
          {stockStatus === "out_of_stock"
            ? "Out of Stock"
            : stockStatus === "low_stock"
            ? "Low Stock"
            : "In Stock"}
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

      {expanded && (
        <div className="ap-variant-form-body">
          <div className="ap-row">
            <div className="ap-field">
              <label className="ap-label">Sale Price ({currency.symbol})</label>
              <input
                type="number"
                className="ap-input"
                value={priceDisplay}
                onChange={(e) => setPriceDisplay(e.target.value)}
                placeholder="0"
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
            <label className="ap-label">Description</label>
            <textarea
              className="ap-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product description for this variant..."
              rows={2}
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
            <label className="ap-label">Images</label>
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
      )}
    </div>
  );
}

// Attribute Selector Component
function AttributeSelector({
  label,
  type,
  values,
  setValues,
  suggestions,
  variants,
  setVariants,
  onError,
}: {
  label: string;
  type: string;
  values: string[];
  setValues: (v: string[]) => void;
  suggestions: string[];
  variants: any[];
  setVariants: (v: any[]) => void;
  onError: (msg: string) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  const addValue = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !values.includes(trimmed)) {
      setValues([...values, trimmed]);
      setVariants([
        ...variants,
        {
          attributeType: type,
          attributeValue: trimmed,
          priceDisplay: "",
          originalPriceDisplay: "",
          description: "",
          stock: 999999,
          lowStockThreshold: null,
          images: [],
          stockStatus: "in_stock",
          bulkPricingTiers: [],
        },
      ]);
    }
    setInputValue("");
  };

  const removeValue = (valueToRemove: string) => {
    setValues(values.filter((v) => v !== valueToRemove));
    setVariants(variants.filter((v) => v.attributeValue !== valueToRemove));
  };

  const updateVariant = (index: number, data: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], ...data };
    setVariants(newVariants);
  };

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
          {values.map((value, idx) => (
            <VariantFormItem
              key={value}
              attributeType={type}
              attributeValue={value}
              onUpdate={(data) => updateVariant(idx, data)}
              onRemove={() => removeValue(value)}
              onError={onError}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Simple Mode Form - FIXED with safe page reload using router
function SimpleModeForm({
  tab,
  onSuccess,
  onError,
  router, // ← router prop add kiya
}: {
  tab: (typeof TABS)[0];
  onSuccess: () => void;
  onError: (msg: string) => void;
  router: any; // ← router prop add kiya
}) {
  const { currency } = useCurrency();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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

  const getStockValue = (): number => {
    if (stockStatus === "out_of_stock") return 0;
    if (stockStatus === "low_stock") return lowStockThreshold || 5;
    return 999999;
  };

  const getPriceInPKR = (displayPrice: string): number => {
    const priceNum = parseFloat(displayPrice) || 0;
    return convertPriceToPKR(priceNum, currency);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onError("Only image files are allowed");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setImages([...images, url]);
    } catch (err) {
      onError(
        "Upload failed: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
    setUploading(false);
  };

  const handleBulkTiersChange = (tiers: BulkPricingTier[]) => {
    setBulkTiers(tiers);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setBrand("");
    setPriceDisplay("");
    setOriginalPriceDisplay("");
    setImages([]);
    setFaqs([]);
    setBulkTiers([]);
    setLowStockThreshold(null);
    setStockStatus("in_stock");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      onError("Product name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert product
      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert([
          {
            name: name.trim(),
            description: description.trim(),
            category: tab.category,
            subcategory: tab.sub,
            brand: brand.trim() || null,
            condition,
            is_featured: isFeatured,
            is_active: isActive,
            currency_code: currency.code,
          },
        ])
        .select()
        .single();

      if (productError) throw new Error(productError.message);

      const pricePKR = getPriceInPKR(priceDisplay);
      const originalPricePKR = originalPriceDisplay
        ? getPriceInPKR(originalPriceDisplay)
        : null;
      const stockVal = getStockValue();

      const { data: variantData, error: variantError } = await supabase
        .from("product_variants")
        .insert([
          {
            product_id: productData.id,
            attribute_type: "standard",
            attribute_value: "Standard",
            price: pricePKR,
            original_price: originalPricePKR,
            description: description.trim(),
            stock: stockVal,
            low_stock_threshold:
              stockStatus === "low_stock" ? lowStockThreshold : null,
            is_active: true,
            currency_code: currency.code,
            base_price_pkr: pricePKR,
            base_original_price_pkr: originalPricePKR,
          },
        ])
        .select()
        .single();

      if (variantError) throw new Error(variantError.message);

      if (images.length > 0) {
        const imageInserts = images.map((url, idx) => ({
          variant_id: variantData.id,
          image_url: url,
          display_order: idx,
        }));
        await supabase.from("variant_images").insert(imageInserts);
      }

      if (bulkTiers.length > 0) {
        const validTiers = bulkTiers.filter(
          (t) => t.min_quantity && t.tier_price
        );
        if (validTiers.length > 0) {
          const bulkInserts = validTiers.map((t) => ({
            variant_id: variantData.id,
            min_quantity: t.min_quantity,
            max_quantity: t.max_quantity,
            tier_price: convertPriceToPKR(t.tier_price, currency),
            discount_percentage: t.discount_percentage,
            discount_price: t.discount_price
              ? convertPriceToPKR(t.discount_price, currency)
              : null,
            currency_code: currency.code,
            base_tier_price_pkr: convertPriceToPKR(t.tier_price, currency),
          }));
          await supabase.from("bulk_pricing_tiers").insert(bulkInserts);
        }
      }

      if (faqs.length > 0) {
        const validFaqs = faqs.filter((f) => f.question.trim());
        if (validFaqs.length > 0) {
          const faqInserts = validFaqs.map((f, idx) => ({
            product_id: productData.id,
            question: f.question.trim(),
            answer: f.answer.trim() || null,
            display_order: idx,
          }));
          await supabase.from("product_faqs").insert(faqInserts);
        }
      }

      // Reset form, show success toast, then redirect to panel page
      resetForm();
      onSuccess(); // This will show the success toast

      // Safe redirect to panel page after delay
      setTimeout(() => {
        // Client-side safe navigation
        if (typeof window !== "undefined") {
          router.push("/panel");
        }
      }, 1500);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save product");
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
                    Sale Price ({currency.symbol})
                  </label>
                  <input
                    type="number"
                    className="ap-input"
                    value={priceDisplay}
                    onChange={(e) => setPriceDisplay(e.target.value)}
                    placeholder="0"
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
                <label className="ap-label">Description</label>
                <textarea
                  className="ap-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
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
                    onTiersChange={handleBulkTiersChange}
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
              <h3 className="ap-card-title">Product Images</h3>
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
              >
                {isSubmitting ? (
                  <>
                    <div className="ap-spinner" /> Saving in {currency.code}...
                  </>
                ) : (
                  <>
                    Save Product in {currency.code}{" "}
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

// Detailed Mode Form - FIXED with safe page reload using router
function DetailedModeForm({
  tab,
  onSuccess,
  onError,
  router, // ← router prop add kiya
}: {
  tab: (typeof TABS)[0];
  onSuccess: () => void;
  onError: (msg: string) => void;
  router: any; // ← router prop add kiya
}) {
  const { currency } = useCurrency();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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

  const getPriceInPKR = (displayPrice: string): number => {
    const priceNum = parseFloat(displayPrice) || 0;
    return convertPriceToPKR(priceNum, currency);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
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

    setIsSubmitting(true);

    try {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert([
          {
            name: name.trim(),
            description: description.trim(),
            category: tab.category,
            subcategory: tab.sub,
            brand: brand.trim() || null,
            condition,
            is_featured: isFeatured,
            is_active: isActive,
            currency_code: currency.code,
          },
        ])
        .select()
        .single();

      if (productError) throw new Error(productError.message);

      for (const variant of allVariants) {
        const pricePKR = getPriceInPKR(variant.priceDisplay || "0");
        const originalPricePKR = variant.originalPriceDisplay
          ? getPriceInPKR(variant.originalPriceDisplay)
          : null;

        const { data: variantData, error: variantError } = await supabase
          .from("product_variants")
          .insert([
            {
              product_id: productData.id,
              attribute_type: variant.attributeType,
              attribute_value: variant.attributeValue,
              price: pricePKR,
              original_price: originalPricePKR,
              description: variant.description || "",
              stock: variant.stock || 999999,
              low_stock_threshold: variant.lowStockThreshold,
              is_active: true,
              currency_code: currency.code,
              base_price_pkr: pricePKR,
              base_original_price_pkr: originalPricePKR,
            },
          ])
          .select()
          .single();

        if (variantError) throw new Error(variantError.message);

        if (variant.images && variant.images.length > 0) {
          const imageInserts = variant.images.map(
            (url: string, idx: number) => ({
              variant_id: variantData.id,
              image_url: url,
              display_order: idx,
            })
          );
          await supabase.from("variant_images").insert(imageInserts);
        }

        if (variant.bulkPricingTiers && variant.bulkPricingTiers.length > 0) {
          const validTiers = variant.bulkPricingTiers.filter(
            (t: BulkPricingTier) => t.min_quantity && t.tier_price
          );
          if (validTiers.length > 0) {
            const bulkInserts = validTiers.map((t: BulkPricingTier) => ({
              variant_id: variantData.id,
              min_quantity: t.min_quantity,
              max_quantity: t.max_quantity,
              tier_price: convertPriceToPKR(t.tier_price, currency),
              discount_percentage: t.discount_percentage,
              discount_price: t.discount_price
                ? convertPriceToPKR(t.discount_price, currency)
                : null,
              currency_code: currency.code,
              base_tier_price_pkr: convertPriceToPKR(t.tier_price, currency),
            }));
            await supabase.from("bulk_pricing_tiers").insert(bulkInserts);
          }
        }
      }

      if (faqs.length > 0) {
        const validFaqs = faqs.filter((f) => f.question.trim());
        if (validFaqs.length > 0) {
          const faqInserts = validFaqs.map((f, idx) => ({
            product_id: productData.id,
            question: f.question.trim(),
            answer: f.answer.trim() || null,
            display_order: idx,
          }));
          await supabase.from("product_faqs").insert(faqInserts);
        }
      }

      // Reset form, show success toast, then redirect to panel page
      resetForm();
      onSuccess(); // This will show the success toast

      // Safe redirect to panel page after delay
      setTimeout(() => {
        // Client-side safe navigation
        if (typeof window !== "undefined") {
          router.push("/panel");
        }
      }, 1500);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save product");
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
                <label className="ap-label">Description</label>
                <textarea
                  className="ap-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
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
              <h3 className="ap-card-title">Product Attributes</h3>
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
                style={{ marginTop: "1rem" }}
              >
                {isSubmitting ? (
                  <>
                    <div className="ap-spinner" /> Saving in {currency.code}...
                  </>
                ) : (
                  <>
                    Save Product with Variants in {currency.code}{" "}
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
  const router = useRouter(); // ← YEH ADD KIYA
  const [activeTab, setActiveTab] = useState(0);
  const [mode, setMode] = useState<Mode>("simple");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { currency, loading: currencyLoading } = useCurrency();

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

  if (currencyLoading) {
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
          }}
        >
          <div
            className="ap-spinner"
            style={{ width: "40px", height: "40px" }}
          />
        </div>
      </div>
    );
  }

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
            <span>Just product images</span>
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
            key={activeTab}
            tab={TABS[activeTab]}
            onSuccess={() =>
              addToast(
                "success",
                "Product Saved",
                `${TABS[activeTab].sub} added successfully in ${currency.code}! Redirecting...`
              )
            }
            onError={(msg) => addToast("error", "Error", msg)}
            router={router} // ← router prop pass kiya
          />
        ) : (
          <DetailedModeForm
            key={activeTab}
            tab={TABS[activeTab]}
            onSuccess={() =>
              addToast(
                "success",
                "Product Saved",
                `${TABS[activeTab].sub} with variants added successfully in ${currency.code}! Redirecting...`
              )
            }
            onError={(msg) => addToast("error", "Error", msg)}
            router={router} // ← router prop pass kiya
          />
        )}
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
