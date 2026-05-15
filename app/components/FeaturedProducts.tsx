"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, A11y } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import "@/app/styles/featured-products.css";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/cartStore";
import { useCurrency } from "../context/CurrencyContext";
import { useLanguage } from "../context/LanguageContext";
import QuickView from "./QuickView";
import { useSaleSync, applyDiscount } from "@/lib/saleStore";

/* ─────────────────────────────────────────────────────────────
   MODULE-LEVEL CACHE
───────────────────────────────────────────────────────────── */
interface CachedData {
  products: FeaturedProduct[];
  variantsMap: Record<string, ProductVariant[]>;
  variantImagesMap: VariantImagesMap;
  fetchedAt?: number;
}

const MODULE_CACHE: Record<string, CachedData> = {};
const FETCH_IN_FLIGHT: Record<string, Promise<CachedData>> = {};

/* ── Types ── */
interface QuickViewProduct {
  id: string;
  name: string;
  brand?: string;
  price: number;
  original_price?: number;
  category: string;
  subcategory: string;
  images: string[];
  stock: number;
  description?: string;
  condition?: string;
  is_featured?: boolean;
  is_active?: boolean;
  stockStatus?: "in_stock" | "out_of_stock" | "low_stock";
  lowStockThreshold?: number | null;
}

interface FeaturedProduct {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  category: string;
  subcategory: string;
  condition: string;
  is_featured: boolean;
  is_active: boolean;
  rating?: number;
  reviews_count?: number;
}

interface ProductVariant {
  id: string;
  product_id: string;
  attribute_type: "color" | "size" | "material" | "capacity" | "standard";
  attribute_value: string;
  price: number;
  original_price?: number;
  description?: string;
  stock: number;
  low_stock_threshold?: number;
  images: string[];
  stockStatus?: "in_stock" | "out_of_stock" | "low_stock";
}

interface VariantImagesMap {
  [variantId: string]: string[];
}

/* ── Translations for Featured Products Section ── */
const fpTranslations = {
  eyebrow: {
    en: "Curated Selection",
    ar: "مجموعة منسقة",
    de: "Kurierte Auswahl",
  },
  title: {
    en: "Featured",
    ar: "المميزة",
    de: "Ausgewählte",
  },
  titleItalic: {
    en: "Products",
    ar: "المنتجات",
    de: "Produkte",
  },
  subtitle: {
    en: "Handpicked luxury essentials across our finest categories",
    ar: "أساسيات فاخرة منتقاة عبر أفضل الفئات",
    de: "Handverlesene Luxus-Essentials aus unseren besten Kategorien",
  },
  viewAllPrefix: {
    en: "View All ",
    ar: "عرض الكل ",
    de: "Alle anzeigen ",
  },
  // Tab labels
  tabs: {
    Accessories: { en: "Accessories", ar: "الإكسسوارات", de: "Zubehör" },
    Watches: { en: "Watches", ar: "الساعات", de: "Uhren" },
    Automotive: { en: "Automotive", ar: "السيارات", de: "Automobil" },
    "Home Decor": { en: "Home Decor", ar: "ديكور المنزل", de: "Wohnkultur" },
  },
  // Empty state
  emptyTitle: {
    en: "No featured products found",
    ar: "لا توجد منتجات مميزة",
    de: "Keine ausgewählten Produkte gefunden",
  },
  emptySub: {
    en: "Check back soon for new arrivals",
    ar: "تفقد قريبًا للحصول على إصدارات جديدة",
    de: "Schauen Sie bald wieder vorbei für neue Artikel",
  },
};

const getFpTranslation = (
  key: keyof typeof fpTranslations,
  lang: "en" | "ar" | "de",
  subKey?: string,
): string => {
  if (subKey && fpTranslations[key] && (fpTranslations[key] as any)[subKey]) {
    return (fpTranslations[key] as any)[subKey][lang];
  }
  if (fpTranslations[key] && (fpTranslations[key] as any)[lang]) {
    return (fpTranslations[key] as any)[lang];
  }
  return (fpTranslations[key] as any)?.en || "";
};

/* ── Helpers ── */
const truncateProductName = (name: string, maxLength = 50) =>
  name.length <= maxLength ? name : name.substring(0, maxLength).trim() + "...";

const getStockStatus = (
  stock: number,
  threshold?: number | null,
): "in_stock" | "out_of_stock" | "low_stock" => {
  if (stock === 0) return "out_of_stock";
  if (stock >= 999999) return "in_stock";
  if (threshold && threshold > 0 && stock <= threshold) return "low_stock";
  return "in_stock";
};

/* ── Fetch function ── */
async function fetchFeaturedTabDataFast(tab: string): Promise<CachedData> {
  const { data: productsData, error } = await supabase
    .from("products")
    .select("*, product_variants(*, variant_images(*))")
    .eq("is_active", true)
    .eq("is_featured", true)
    .eq("category", tab)
    .order("created_at", { ascending: false });

  if (error || !productsData || productsData.length === 0) {
    return {
      products: [],
      variantsMap: {},
      variantImagesMap: {},
      fetchedAt: Date.now(),
    };
  }

  const formattedProducts: FeaturedProduct[] = productsData.map(
    (item: any) => ({
      id: item.id,
      name: item.name,
      brand: item.brand || undefined,
      description: item.description || undefined,
      category: item.category,
      subcategory: item.subcategory,
      condition: item.condition || "new",
      is_featured: item.is_featured || false,
      is_active: item.is_active || true,
      rating: item.rating != null && item.rating > 0 ? item.rating : undefined,
      reviews_count:
        item.reviews_count != null && item.reviews_count > 0
          ? item.reviews_count
          : undefined,
    }),
  );

  const variantsByProduct: Record<string, ProductVariant[]> = {};
  const variantImagesMap: VariantImagesMap = {};

  productsData.forEach((product: any) => {
    const variants = product.product_variants || [];
    variantsByProduct[product.id] = variants.map((variant: any) => ({
      id: variant.id,
      product_id: variant.product_id,
      attribute_type: variant.attribute_type,
      attribute_value: variant.attribute_value,
      price: variant.price,
      original_price: variant.original_price,
      description: variant.description,
      stock: variant.stock,
      low_stock_threshold: variant.low_stock_threshold,
      images: [],
      stockStatus: getStockStatus(variant.stock, variant.low_stock_threshold),
    }));

    variants.forEach((variant: any) => {
      const images = (variant.variant_images || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((img: any) => img.image_url);
      if (images.length > 0) variantImagesMap[variant.id] = images;
    });
  });

  const result = {
    products: formattedProducts,
    variantsMap: variantsByProduct,
    variantImagesMap,
    fetchedAt: Date.now(),
  };

  MODULE_CACHE[tab] = result;
  saveToStorage(tab, result);
  return result;
}

const ALL_TABS = ["Accessories", "Watches", "Automotive", "Home Decor"];

async function ensureTabCached(tab: string): Promise<CachedData> {
  if (MODULE_CACHE[tab]) return MODULE_CACHE[tab];

  const inFlight = FETCH_IN_FLIGHT[tab];
  if (inFlight) return await inFlight;

  const promise = fetchFeaturedTabDataFast(tab).then((data) => {
    delete FETCH_IN_FLIGHT[tab];
    return data;
  });

  FETCH_IN_FLIGHT[tab] = promise;
  return await promise;
}

async function invalidateAndRefetch(tab: string): Promise<CachedData> {
  delete MODULE_CACHE[tab];
  delete FETCH_IN_FLIGHT[tab];
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      delete s[tab];
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    }
  } catch (_) {}
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      delete s[tab];
      localStorage.setItem(LOCAL_KEY, JSON.stringify(s));
    }
  } catch (_) {}
  return await ensureTabCached(tab);
}
const SESSION_KEY = "fp_cache_v3";
const LOCAL_KEY = "fp_cache_local_v3";

function saveToStorage(tab: string, data: CachedData) {
  if (typeof window === "undefined") return;

  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    existing[tab] = data;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(existing));
  } catch (_) {}

  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    existing[tab] = { data, ts: Date.now() };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(existing));
  } catch (_) {}
}

function loadFromStorageSync(): void {
  if (typeof window === "undefined") return;

  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.entries(parsed).forEach(([tab, data]) => {
        if (!MODULE_CACHE[tab]) MODULE_CACHE[tab] = data as CachedData;
      });
      return;
    }
  } catch (_) {}

  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    Object.entries(parsed).forEach(([tab, entry]: [string, any]) => {
      if (entry?.data && Date.now() - (entry.ts || 0) < 86400000) {
        if (!MODULE_CACHE[tab]) MODULE_CACHE[tab] = entry.data;
      }
    });
  } catch (_) {}
}

/* ─────────────────────────────────────────────────────────────
   STAR COMPONENTS
───────────────────────────────────────────────────────────── */
function StarIcon({ filled, size = 11 }: { filled: boolean; size?: number }) {
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

function StarDisplay({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} filled={i <= Math.round(rating)} size={size} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="fp-card fp-card--skeleton">
      <div className="fp-card-img fp-skel-img" style={{ paddingTop: "100%" }} />
      <div className="fp-card-body">
        <div
          className="fp-skel-line"
          style={{ width: "45%", marginBottom: 8 }}
        />
        <div className="fp-skel-line" style={{ width: "85%" }} />
        <div className="fp-skel-line" style={{ width: "65%" }} />
        <div className="fp-skel-line" style={{ width: "40%", marginTop: 12 }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LOADING SPINNER
───────────────────────────────────────────────────────────── */
function LoadingSpinner({ size = 18 }: { size?: number }) {
  return (
    <div
      className="fp-spinner"
      style={{
        width: size,
        height: size,
        border: "2px solid rgba(218,165,32,0.2)",
        borderTopColor: "#daa520",
        borderRadius: "50%",
        animation: "fp-spin 0.8s linear infinite",
        display: "inline-block",
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   VARIANT THUMBNAILS with RTL support
───────────────────────────────────────────────────────────── */
function VariantThumbnails({
  variants,
  type,
  onSelect,
  currentValue,
  variantImagesMap,
  getVariantImage,
  isRTL,
}: {
  variants: ProductVariant[];
  type: string;
  onSelect: (variant: ProductVariant) => void;
  currentValue: string;
  variantImagesMap: VariantImagesMap;
  getVariantImage: (variantId: string) => string | null;
  isRTL: boolean;
}) {
  if (!variants || variants.length === 0) return null;

  const getIcon = () => {
    switch (type) {
      case "color":
        return "🎨";
      case "size":
        return "📏";
      case "material":
        return "🔧";
      case "capacity":
        return "⚡";
      default:
        return "•";
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "color":
        return "Colors";
      case "size":
        return "Sizes";
      case "material":
        return "Materials";
      case "capacity":
        return "Capacities";
      default:
        return type;
    }
  };

  const displayVariants = variants.slice(0, 4);
  const hasMore = variants.length > 4;

  return (
    <div className="fp-card-variants" dir={isRTL ? "rtl" : "ltr"}>
      <span className="fp-variant-label">
        {getIcon()} {getTypeLabel()}:
      </span>
      <div className="fp-variant-thumbnails">
        {displayVariants.map((variant) => {
          const variantImage = getVariantImage(variant.id);
          const isActive = currentValue === variant.attribute_value;
          const labelText = variant.attribute_value;

          return (
            <button
              key={variant.id}
              className={`fp-variant-thumb ${isActive ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(variant);
              }}
              title={variant.attribute_value}
            >
              {variantImage ? (
                <div className="fp-variant-thumb-img">
                  <img
                    src={variantImage}
                    alt={variant.attribute_value}
                    suppressHydrationWarning
                  />
                </div>
              ) : (
                <div className="fp-variant-thumb-placeholder">
                  <span className="fp-variant-thumb-text">
                    {variant.attribute_value.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="fp-variant-thumb-label">{labelText}</span>
            </button>
          );
        })}
        {hasMore && (
          <div className="fp-variant-more">+{variants.length - 4}</div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PRODUCT CARD with RTL
───────────────────────────────────────────────────────────── */
function ProductCard({
  product,
  variants,
  variantImagesMap,
  onQuickView,
  isRTL,
}: {
  product: FeaturedProduct;
  variants: ProductVariant[];
  variantImagesMap: VariantImagesMap;
  onQuickView: (
    product: FeaturedProduct,
    variants: ProductVariant[],
    selectedVariant: ProductVariant | null,
    productImages: string[],
    productPrice: number,
    productStock: number,
    stockStatus: "in_stock" | "out_of_stock" | "low_stock",
    lowStockThreshold: number | null | undefined,
    variantImages: VariantImagesMap,
  ) => void;
  isRTL: boolean;
}) {
  const { formatPrice } = useCurrency();
  const router = useRouter();

  const [isHovered, setIsHovered] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null,
  );
  const [currentImages, setCurrentImages] = useState<string[]>(() => {
    const firstVariant = variants[0];
    if (firstVariant && variantImagesMap[firstVariant.id]) {
      return variantImagesMap[firstVariant.id];
    }
    return [];
  });
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const { addToCart } = useCartStore();

  const [liveRating, setLiveRating] = useState<number | null>(
    product.rating != null && product.rating > 0 ? product.rating : null,
  );
  const [liveReviewCount, setLiveReviewCount] = useState<number | null>(
    product.reviews_count != null && product.reviews_count > 0
      ? product.reviews_count
      : null,
  );

  useEffect(() => {
    const channel = supabase
      .channel(`fp-rating-${product.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "product_reviews",
          filter: `product_id=eq.${product.id}`,
        },
        async () => {
          const { data } = await supabase
            .from("products")
            .select("rating, reviews_count")
            .eq("id", product.id)
            .single();
          if (data) {
            if (data.rating != null && data.rating > 0)
              setLiveRating(data.rating);
            if (data.reviews_count != null && data.reviews_count > 0)
              setLiveReviewCount(data.reviews_count);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [product.id]);

  const colorVariants = variants.filter((v) => v.attribute_type === "color");
  const sizeVariants = variants.filter((v) => v.attribute_type === "size");
  const materialVariants = variants.filter(
    (v) => v.attribute_type === "material",
  );
  const capacityVariants = variants.filter(
    (v) => v.attribute_type === "capacity",
  );

  const getVariantImage = useCallback(
    (variantId: string): string | null =>
      variantImagesMap[variantId]?.[0] || null,
    [variantImagesMap],
  );

  const getVariantImages = useCallback(
    (variantId: string): string[] => variantImagesMap[variantId] || [],
    [variantImagesMap],
  );

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setCurrentImages(getVariantImages(variant.id));
    setIsHovered(false);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const displayImage = currentImages[0] ?? null;

  const discount =
    selectedVariant?.original_price &&
    selectedVariant.original_price > selectedVariant.price
      ? Math.round(
          ((selectedVariant.original_price - selectedVariant.price) /
            selectedVariant.original_price) *
            100,
        )
      : null;

  const stockStatus = getStockStatus(
    selectedVariant?.stock || 0,
    selectedVariant?.low_stock_threshold,
  );
  const isLowStock = stockStatus === "low_stock";
  const isOutOfStock = stockStatus === "out_of_stock";
  const currentStock = selectedVariant?.stock || 0;

  const getStockLabel = () => {
    if (isOutOfStock) return "Out of Stock";
    if (isLowStock) return `Only ${currentStock} left`;
    return "In Stock";
  };

  const getStockClass = () => {
    if (isOutOfStock) return "out";
    if (isLowStock) return "low";
    return "in";
  };

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant) {
      alert("Please select a variant first");
      return;
    }
    if (isOutOfStock) {
      alert("This product is out of stock");
      return;
    }
    if (addToCartLoading) return;
    setAddToCartLoading(true);
    try {
      const productToAdd = {
        id: product.id,
        name: product.name,
        description: selectedVariant?.description || product.description || "",
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand || "",
        condition: product.condition,
        is_featured: product.is_featured,
        is_active: product.is_active,
        images: currentImages.length > 0 ? currentImages : [],
        price: selectedVariant.price,
        original_price: selectedVariant.original_price,
        stock: selectedVariant.stock,
        stockStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await addToCart(productToAdd, selectedVariant, 1, 1);
    } catch (err) {
      console.error("Add to cart error:", err);
    } finally {
      setAddToCartLoading(false);
    }
  };

  const handleQuickViewClick = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewLoading(true);
    await new Promise((r) => setTimeout(r, 80));
    onQuickView(
      product,
      variants,
      selectedVariant,
      currentImages,
      selectedVariant?.price || 0,
      selectedVariant?.stock || 0,
      stockStatus,
      selectedVariant?.low_stock_threshold,
      variantImagesMap,
    );
    setQuickViewLoading(false);
  };

  // ✅ FIX: useSaleSync() reactive hook — sale apply/remove pe auto-update
  const { saleData } = useSaleSync();
  const activeSalePercent = saleData.percent; // null jab sale off ho

  const basePrice = selectedVariant?.price || 0;

  // Sale sirf tab apply hogi jab activeSalePercent valid ho (null nahi)
  const discountedPrice =
    activeSalePercent && activeSalePercent > 0
      ? applyDiscount(basePrice, activeSalePercent)
      : basePrice;

  // originalForDisplay: sale active → basePrice strikethrough; sale off → variant ki own original_price
  const originalForDisplay =
    activeSalePercent && activeSalePercent > 0 && basePrice > 0
      ? basePrice
      : selectedVariant?.original_price || null;

  const displaySalePrice = formatPrice(discountedPrice);
  const displayOriginalPrice =
    originalForDisplay && originalForDisplay > discountedPrice
      ? formatPrice(originalForDisplay)
      : null;

  // totalDiscount: sale active → salePercent; sale off → variant ki apni discount
  const totalDiscount =
    activeSalePercent && activeSalePercent > 0 ? activeSalePercent : discount;

  const productSlug = product.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 60);

  const productHref = `/product/${productSlug}--${product.id}`;

  return (
    <Link
      href={productHref}
      prefetch={true}
      className="fp-card"
      style={{ cursor: "pointer", display: "block", textDecoration: "none" }}
    >
      <div
        className="fp-card-img"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.name}
            loading="eager"
            decoding="async"
            suppressHydrationWarning
          />
        ) : (
          <div className="fp-card-placeholder">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        <div className="fp-card-badges">
          {product.condition === "new" && !totalDiscount && (
            <span className="fp-badge fp-badge--new">New</span>
          )}
          {isLowStock && (
            <span className="fp-badge fp-badge--low">Low Stock</span>
          )}
        </div>
        <div className="fp-icon-buttons">
          <button
            className="fp-icon-btn fp-icon-btn--view"
            onClick={handleQuickViewClick}
            aria-label="Quick View"
            disabled={quickViewLoading}
          >
            {quickViewLoading ? (
              <LoadingSpinner size={18} />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z" />
              </svg>
            )}
          </button>
          <button
            className="fp-icon-btn fp-icon-btn--cart"
            onClick={handleAddToCart}
            aria-label="Add to Cart"
            disabled={isOutOfStock || addToCartLoading}
          >
            {addToCartLoading ? (
              <LoadingSpinner size={18} />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="fp-card-body" dir={isRTL ? "rtl" : "ltr"}>
        {product.brand && <p className="fp-card-brand">{product.brand}</p>}
        <h3 className="fp-card-name" title={product.name}>
          {truncateProductName(product.name, 45)}
        </h3>
        <div className="fp-card-price-row">
          <span className="fp-card-price">{displaySalePrice}</span>
          {displayOriginalPrice && (
            <span className="fp-card-orig">{displayOriginalPrice}</span>
          )}
          {totalDiscount && totalDiscount > 0 && (
            <span className="fp-card-discount">-{totalDiscount}%</span>
          )}
        </div>

        <div className="fp-card-rating">
          {liveRating !== null &&
            liveReviewCount !== null &&
            liveReviewCount > 0 && (
              <>
                <StarDisplay rating={liveRating} size={11} />
                <span className="fp-card-rating-count">
                  ({liveReviewCount})
                </span>
              </>
            )}
        </div>

        <div className="fp-card-variants-wrapper">
          {colorVariants.length > 0 && (
            <VariantThumbnails
              variants={colorVariants}
              type="color"
              onSelect={handleVariantSelect}
              currentValue={selectedVariant?.attribute_value || ""}
              variantImagesMap={variantImagesMap}
              getVariantImage={getVariantImage}
              isRTL={isRTL}
            />
          )}
          {sizeVariants.length > 0 && (
            <VariantThumbnails
              variants={sizeVariants}
              type="size"
              onSelect={handleVariantSelect}
              currentValue={selectedVariant?.attribute_value || ""}
              variantImagesMap={variantImagesMap}
              getVariantImage={getVariantImage}
              isRTL={isRTL}
            />
          )}
          {materialVariants.length > 0 && (
            <VariantThumbnails
              variants={materialVariants}
              type="material"
              onSelect={handleVariantSelect}
              currentValue={selectedVariant?.attribute_value || ""}
              variantImagesMap={variantImagesMap}
              getVariantImage={getVariantImage}
              isRTL={isRTL}
            />
          )}
          {capacityVariants.length > 0 && (
            <VariantThumbnails
              variants={capacityVariants}
              type="capacity"
              onSelect={handleVariantSelect}
              currentValue={selectedVariant?.attribute_value || ""}
              variantImagesMap={variantImagesMap}
              getVariantImage={getVariantImage}
              isRTL={isRTL}
            />
          )}
        </div>
        <div className={`fp-card-stock ${getStockClass()}`}>
          {getStockLabel()}
        </div>
      </div>
      <div className="fp-card-line" />
      <style jsx>{`
        @keyframes fp-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Link>
  );
}

// ── Module-level init ──
if (typeof window !== "undefined") {
  loadFromStorageSync();
}

export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState("Accessories");
  const activeTabRef = useRef("Accessories");
  const { language, isRTLMode } = useLanguage();

  const [products, setProducts] = useState<FeaturedProduct[]>(() => {
    return MODULE_CACHE["Accessories"]?.products ?? [];
  });
  const [variantsMap, setVariantsMap] = useState<
    Record<string, ProductVariant[]>
  >(() => {
    return MODULE_CACHE["Accessories"]?.variantsMap ?? {};
  });
  const [variantImagesMap, setVariantImagesMap] = useState<
    Record<string, string[]>
  >(() => {
    return MODULE_CACHE["Accessories"]?.variantImagesMap ?? {};
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !MODULE_CACHE["Accessories"];
  });
  const [initialLoadDone, setInitialLoadDone] = useState(() => {
    return !!MODULE_CACHE["Accessories"];
  });

  const [quickViewProduct, setQuickViewProduct] =
    useState<QuickViewProduct | null>(null);
  const [quickViewVariants, setQuickViewVariants] = useState<ProductVariant[]>(
    [],
  );
  const [quickViewSelectedVariant, setQuickViewSelectedVariant] =
    useState<ProductVariant | null>(null);
  const [quickViewVariantImagesMap, setQuickViewVariantImagesMap] = useState<
    Record<string, string[]>
  >({});
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const [swiperKey, setSwiperKey] = useState(0);

  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    if (initialLoadDone) {
      setTimeout(() => {
        ALL_TABS.forEach((tab) => {
          if (!MODULE_CACHE[tab]) ensureTabCached(tab).catch(console.error);
        });
      }, 500);
      return;
    }
    ensureTabCached("Accessories").then((data) => {
      if (data) {
        setProducts(data.products);
        setVariantsMap(data.variantsMap);
        setVariantImagesMap(data.variantImagesMap);
        setIsLoading(false);
        setInitialLoadDone(true);
      }
    });
    setTimeout(() => {
      ALL_TABS.forEach((tab) => {
        if (!MODULE_CACHE[tab]) ensureTabCached(tab).catch(console.error);
      });
    }, 500);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const cached = MODULE_CACHE[activeTabRef.current];
      if (cached) {
        setProducts(cached.products);
        setVariantsMap(cached.variantsMap);
        setVariantImagesMap(cached.variantImagesMap);
        setIsLoading(false);
        setSwiperKey((k) => k + 1);
        setTimeout(() => {
          swiperRef.current?.update();
          swiperRef.current?.slideTo(0, 0);
        }, 50);
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      const cached = MODULE_CACHE[activeTabRef.current];
      if (cached) {
        setProducts(cached.products);
        setVariantsMap(cached.variantsMap);
        setVariantImagesMap(cached.variantImagesMap);
        setIsLoading(false);
        setTimeout(() => {
          swiperRef.current?.update();
          swiperRef.current?.slideTo(0, 0);
        }, 50);
      }
    };

    // FIX: Tab pe wapas aane pe (admin panel se) fresh data lo
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        // Cache invalidate karo aur fresh data fetch karo
        const freshData = await invalidateAndRefetch(activeTabRef.current);
        setProducts(freshData.products);
        setVariantsMap(freshData.variantsMap);
        setVariantImagesMap(freshData.variantImagesMap);
        setIsLoading(false);
        setSwiperKey((k) => k + 1);
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleTabChange = useCallback(
    async (tab: string) => {
      if (tab === activeTab) return;

      setActiveTab(tab);
      activeTabRef.current = tab;

      const cached = MODULE_CACHE[tab];
      if (cached) {
        setProducts(cached.products);
        setVariantsMap(cached.variantsMap);
        setVariantImagesMap(cached.variantImagesMap);
        setIsLoading(false);
        setSwiperKey((k) => k + 1);
        return;
      }

      setIsLoading(true);
      setProducts([]);

      const data = await ensureTabCached(tab);
      if (data) {
        setProducts(data.products);
        setVariantsMap(data.variantsMap);
        setVariantImagesMap(data.variantImagesMap);
        setIsLoading(false);
        setSwiperKey((k) => k + 1);
      }
    },
    [activeTab],
  );

  useEffect(() => {
    const channel = supabase
      .channel("fp-featured-products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        async (payload: any) => {
          const record = payload.new || payload.old || {};
          const affectedCategory = record.category;

          // FIX: INSERT pe payload.old null hota hai — isFeaturedOld undefined hoga
          // ?? false isliye use kiya ke undefined ko false treat karo
          const isFeaturedNew = payload.new?.is_featured ?? false;
          const isFeaturedOld = payload.old?.is_featured ?? false;

          // Agar INSERT aur naya record featured hai — refresh karo
          // Agar UPDATE aur koi bhi side featured thi — refresh karo
          // Agar DELETE aur purana featured tha — refresh karo
          const shouldRefresh = isFeaturedNew || isFeaturedOld;
          if (!shouldRefresh) return;

          if (affectedCategory && ALL_TABS.includes(affectedCategory)) {
            const freshData = await invalidateAndRefetch(affectedCategory);
            if (activeTabRef.current === affectedCategory) {
              setProducts(freshData.products);
              setVariantsMap(freshData.variantsMap);
              setVariantImagesMap(freshData.variantImagesMap);
              setIsLoading(false);
              setSwiperKey((k) => k + 1);
            }
          } else {
            const freshData = await invalidateAndRefetch(activeTabRef.current);
            setProducts(freshData.products);
            setVariantsMap(freshData.variantsMap);
            setVariantImagesMap(freshData.variantImagesMap);
            setIsLoading(false);
            setSwiperKey((k) => k + 1);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (swiperRef.current && products.length > 0) {
      setTimeout(() => {
        swiperRef.current?.update();
      }, 50);
    }
  }, [products]);

  const handleQuickView = (
    product: FeaturedProduct,
    variants: ProductVariant[],
    selectedVariant: ProductVariant | null,
    productImages: string[],
    productPrice: number,
    productStock: number,
    stockStatus: "in_stock" | "out_of_stock" | "low_stock",
    lowStockThreshold: number | null | undefined,
    variantImages: VariantImagesMap,
  ) => {
    setQuickViewProduct({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: productPrice,
      original_price: selectedVariant?.original_price,
      category: product.category,
      subcategory: product.subcategory,
      images: productImages,
      stock: productStock,
      description: selectedVariant?.description || product.description,
      condition: product.condition,
      is_featured: product.is_featured,
      is_active: product.is_active,
      stockStatus,
      lowStockThreshold,
    });
    setQuickViewVariants(variants);
    setQuickViewSelectedVariant(selectedVariant);
    setQuickViewVariantImagesMap(variantImages);
    setQuickViewOpen(true);
  };

  const activeTabData = [
    { key: "Accessories", label: "Accessories", href: "/accessories" },
    { key: "Watches", label: "Watches", href: "/watches" },
    { key: "Automotive", label: "Automotive", href: "/automotive" },
    { key: "Home Decor", label: "Home Decor", href: "/home-decor" },
  ].find((t) => t.key === activeTab);

  const SKELETON_COUNT = 4;

  return (
    <>
      <section className="fp-section" dir={isRTLMode ? "rtl" : "ltr"}>
        <div className="fp-header">
          <p className="fp-eyebrow">
            <span className="fp-ey-line" />
            {getFpTranslation("eyebrow", language)}
            <span className="fp-ey-line" />
          </p>
          <h2 className="fp-title">
            {getFpTranslation("title", language)}{" "}
            <em>{getFpTranslation("titleItalic", language)}</em>
          </h2>
          <p className="fp-subtitle">
            {getFpTranslation("subtitle", language)}
          </p>

          <div className="fp-tabs" style={{ marginTop: "2rem" }}>
            {ALL_TABS.map((tab) => (
              <button
                key={tab}
                className={`fp-tab${activeTab === tab ? " fp-tab--active" : ""}`}
                onClick={() => handleTabChange(tab)}
              >
                {
                  fpTranslations.tabs[tab as keyof typeof fpTranslations.tabs][
                    language
                  ]
                }
              </button>
            ))}
          </div>
        </div>

        <div className="fp-container">
          <div className="fp-nav">
            <button ref={prevRef} className="fp-nav-btn" aria-label="Previous">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <polyline
                  points={isRTLMode ? "9 18 15 12 9 6" : "15 18 9 12 15 6"}
                />
              </svg>
            </button>
            <button ref={nextRef} className="fp-nav-btn" aria-label="Next">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <polyline
                  points={isRTLMode ? "15 18 9 12 15 6" : "9 18 15 12 9 6"}
                />
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div
              className="fp-skeleton-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1px",
                paddingBottom: "3.5rem",
              }}
            >
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="fp-empty">
              <p>{getFpTranslation("emptyTitle", language)}</p>
            </div>
          ) : (
            <Swiper
              key={swiperKey}
              modules={[Pagination, Navigation, A11y]}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                if (
                  swiper.params.navigation &&
                  typeof swiper.params.navigation !== "boolean"
                ) {
                  swiper.params.navigation.prevEl = prevRef.current;
                  swiper.params.navigation.nextEl = nextRef.current;
                  swiper.navigation.init();
                  swiper.navigation.update();
                }
              }}
              navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
              pagination={{ clickable: true }}
              spaceBetween={1}
              slidesPerView={1}
              breakpoints={{
                480: { slidesPerView: 2, spaceBetween: 1 },
                768: { slidesPerView: 3, spaceBetween: 1 },
                1024: { slidesPerView: 4, spaceBetween: 1 },
              }}
              className="fp-swiper"
              dir={isRTLMode ? "rtl" : "ltr"}
            >
              {products.map((product) => (
                <SwiperSlide key={product.id}>
                  <ProductCard
                    product={product}
                    variants={variantsMap[product.id] || []}
                    variantImagesMap={variantImagesMap}
                    onQuickView={handleQuickView}
                    isRTL={isRTLMode}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          )}

          <div className="fp-view-all-wrap">
            <Link
              href={activeTabData?.href || "/"}
              className="fp-view-all"
              prefetch={false}
            >
              <span>
                {getFpTranslation("viewAllPrefix", language)}
                {activeTabData?.label || activeTab}
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline
                  points={isRTLMode ? "12 5 5 12 12 19" : "12 5 19 12 12 19"}
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <QuickView
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        product={quickViewProduct}
        variants={quickViewVariants}
        selectedVariant={quickViewSelectedVariant}
        variantImagesMap={quickViewVariantImagesMap}
      />
    </>
  );
}
