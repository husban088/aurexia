"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, A11y } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import "@/app/styles/featured-products.css";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/cartStore";
import { useCurrency } from "../context/CurrencyContext";
import QuickView from "./QuickView";

/* ─────────────────────────────────────────────────────────────
   MODULE-LEVEL CACHE
   Lives for the entire browser session (not per-component).
   Navigation back/forward never refetches — data is instant.
───────────────────────────────────────────────────────────── */
interface CachedData {
  products: FeaturedProduct[];
  variantsMap: Record<string, ProductVariant[]>;
  variantImagesMap: VariantImagesMap;
}

const MODULE_CACHE: Record<string, CachedData> = {};

/* Tracks in-flight promises so two mounts don't double-fetch */
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

/* ── Helpers ── */
const truncateProductName = (name: string, maxLength = 50) =>
  name.length <= maxLength ? name : name.substring(0, maxLength).trim() + "...";

const getStockStatus = (
  stock: number,
  threshold?: number | null
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
    return { products: [], variantsMap: {}, variantImagesMap: {} };
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
    })
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

  return {
    products: formattedProducts,
    variantsMap: variantsByProduct,
    variantImagesMap,
  };
}

/* ── Prefetch all tabs into module cache ── */
const ALL_TABS = ["Accessories", "Watches", "Automotive", "Home Decor"];

/* 
  Returns a promise that resolves when the given tab is fully cached.
  Safe to call multiple times — deduped via FETCH_IN_FLIGHT. 
*/
async function ensureTabCached(tab: string): Promise<CachedData> {
  // If already cached, return cached data
  if (MODULE_CACHE[tab]) {
    return MODULE_CACHE[tab];
  }

  // If fetch already in flight, wait for it
  const inFlight = FETCH_IN_FLIGHT[tab];
  if (inFlight) {
    return await inFlight;
  }

  // Start new fetch
  const promise = fetchFeaturedTabDataFast(tab).then((data) => {
    MODULE_CACHE[tab] = data;
    delete FETCH_IN_FLIGHT[tab];
    return data;
  });

  FETCH_IN_FLIGHT[tab] = promise;
  return await promise;
}

function prefetchAllTabs() {
  ALL_TABS.forEach((tab) => {
    if (!MODULE_CACHE[tab] && !FETCH_IN_FLIGHT[tab]) {
      const promise = fetchFeaturedTabDataFast(tab).then((data) => {
        MODULE_CACHE[tab] = data;
        delete FETCH_IN_FLIGHT[tab];
        return data;
      });
      FETCH_IN_FLIGHT[tab] = promise;
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   VARIANT THUMBNAILS
───────────────────────────────────────────────────────────── */
function VariantThumbnails({
  variants,
  type,
  onSelect,
  currentValue,
  variantImagesMap,
  getVariantImage,
}: {
  variants: ProductVariant[];
  type: string;
  onSelect: (variant: ProductVariant) => void;
  currentValue: string;
  variantImagesMap: VariantImagesMap;
  getVariantImage: (variantId: string) => string | null;
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
    <div className="fp-card-variants">
      <span className="fp-variant-label">
        {getIcon()} {getTypeLabel()}:
      </span>
      <div className="fp-variant-thumbnails">
        {displayVariants.map((variant) => {
          const variantImage = getVariantImage(variant.id);
          const isActive = currentValue === variant.attribute_value;
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
                <img src={variantImage} alt={variant.attribute_value} />
              ) : (
                <span className="fp-variant-text">
                  {variant.attribute_value.charAt(0)}
                </span>
              )}
              <span className="fp-variant-label-text">
                {variant.attribute_value.length > 10
                  ? variant.attribute_value.slice(0, 8) + "..."
                  : variant.attribute_value}
              </span>
            </button>
          );
        })}
        {hasMore && (
          <span className="fp-variant-more">+{variants.length - 4}</span>
        )}
      </div>
    </div>
  );
}

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
   PRODUCT CARD
───────────────────────────────────────────────────────────── */
function ProductCard({
  product,
  variants,
  variantImagesMap,
  onQuickView,
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
    variantImages: VariantImagesMap
  ) => void;
}) {
  const { formatPrice } = useCurrency();

  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null
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

  const colorVariants = variants.filter((v) => v.attribute_type === "color");
  const sizeVariants = variants.filter((v) => v.attribute_type === "size");
  const materialVariants = variants.filter(
    (v) => v.attribute_type === "material"
  );
  const capacityVariants = variants.filter(
    (v) => v.attribute_type === "capacity"
  );

  const getVariantImage = useCallback(
    (variantId: string): string | null => {
      const images = variantImagesMap[variantId];
      return images && images.length > 0 ? images[0] : null;
    },
    [variantImagesMap]
  );

  const getVariantImages = useCallback(
    (variantId: string): string[] => variantImagesMap[variantId] || [],
    [variantImagesMap]
  );

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setCurrentImages(getVariantImages(variant.id));
    setCurrentImageIndex(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (currentImages.length > 1) setCurrentImageIndex(1);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCurrentImageIndex(0);
  };

  const displayImage =
    isHovered && currentImages.length > 1
      ? currentImages[1]
      : currentImages[currentImageIndex] ?? null;

  const discount =
    selectedVariant?.original_price &&
    selectedVariant.original_price > selectedVariant.price
      ? Math.round(
          ((selectedVariant.original_price - selectedVariant.price) /
            selectedVariant.original_price) *
            100
        )
      : null;

  const stockStatus = getStockStatus(
    selectedVariant?.stock || 0,
    selectedVariant?.low_stock_threshold
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
      // Create a clean product object without low_stock_threshold to avoid type issues
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
        images: currentImages,
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
    e: React.MouseEvent<HTMLButtonElement>
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
      variantImagesMap
    );
    setQuickViewLoading(false);
  };

  const displaySalePrice = selectedVariant
    ? formatPrice(selectedVariant.price)
    : formatPrice(0);
  const displayOriginalPrice = selectedVariant?.original_price
    ? formatPrice(selectedVariant.original_price)
    : null;

  return (
    <div
      onClick={() => {
        window.location.href = `/product/${product.id}`;
      }}
      className="fp-card"
      style={{ cursor: "pointer" }}
    >
      <div
        className="fp-card-img"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {displayImage ? (
          <img src={displayImage} alt={product.name} loading="eager" />
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
          {product.condition === "new" && !discount && (
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

      <div className="fp-card-body">
        {product.brand && <p className="fp-card-brand">{product.brand}</p>}
        <h3 className="fp-card-name" title={product.name}>
          {truncateProductName(product.name, 45)}
        </h3>
        <div className="fp-card-price-row">
          <span className="fp-card-price">{displaySalePrice}</span>
          {displayOriginalPrice && (
            <span className="fp-card-orig">{displayOriginalPrice}</span>
          )}
          {discount && discount > 0 && (
            <span className="fp-card-discount">-{discount}%</span>
          )}
        </div>
        {colorVariants.length > 0 && (
          <VariantThumbnails
            variants={colorVariants}
            type="color"
            onSelect={handleVariantSelect}
            currentValue={selectedVariant?.attribute_value || ""}
            variantImagesMap={variantImagesMap}
            getVariantImage={getVariantImage}
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
          />
        )}
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
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState("Accessories");

  const [products, setProducts] = useState<FeaturedProduct[]>(
    () => MODULE_CACHE["Accessories"]?.products ?? []
  );
  const [variantsMap, setVariantsMap] = useState<
    Record<string, ProductVariant[]>
  >(() => MODULE_CACHE["Accessories"]?.variantsMap ?? {});
  const [variantImagesMap, setVariantImagesMap] = useState<
    Record<string, string[]>
  >(() => MODULE_CACHE["Accessories"]?.variantImagesMap ?? {});

  const [quickViewProduct, setQuickViewProduct] =
    useState<QuickViewProduct | null>(null);
  const [quickViewVariants, setQuickViewVariants] = useState<ProductVariant[]>(
    []
  );
  const [quickViewSelectedVariant, setQuickViewSelectedVariant] =
    useState<ProductVariant | null>(null);
  const [quickViewVariantImagesMap, setQuickViewVariantImagesMap] = useState<
    Record<string, string[]>
  >({});
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const swiperRef = useRef<SwiperType | null>(null);
  const { currency } = useCurrency();

  /* ── On mount: load initial "Accessories" tab + prefetch all others ── */
  useEffect(() => {
    let isMounted = true;

    async function loadInitialTab() {
      // If already in cache, state was already set via initializer
      if (MODULE_CACHE["Accessories"]) {
        // Make sure state is updated
        if (isMounted) {
          const d = MODULE_CACHE["Accessories"];
          setProducts(d.products);
          setVariantsMap(d.variantsMap);
          setVariantImagesMap(d.variantImagesMap);
        }
        // Still kick off background prefetch for other tabs
        prefetchAllTabs();
        return;
      }

      // Not cached yet — fetch now
      const data = await ensureTabCached("Accessories");

      if (isMounted && data) {
        setProducts(data.products);
        setVariantsMap(data.variantsMap);
        setVariantImagesMap(data.variantImagesMap);
      }

      // Prefetch remaining tabs in background after initial tab is ready
      prefetchAllTabs();
    }

    loadInitialTab();
    return () => {
      isMounted = false;
    };
  }, []);

  /* ── Tab change — instant from cache, fetch only if missing ── */
  const handleTabChange = useCallback(async (tab: string) => {
    setActiveTab(tab);

    if (MODULE_CACHE[tab]) {
      // Instant — already cached
      const d = MODULE_CACHE[tab];
      setProducts(d.products);
      setVariantsMap(d.variantsMap);
      setVariantImagesMap(d.variantImagesMap);
      setTimeout(() => swiperRef.current?.update(), 50);
      return;
    }

    // Not cached — fetch
    const data = await ensureTabCached(tab);
    if (data) {
      setProducts(data.products);
      setVariantsMap(data.variantsMap);
      setVariantImagesMap(data.variantImagesMap);
    }

    setTimeout(() => swiperRef.current?.update(), 50);
  }, []);

  /* ── Update swiper when products change ── */
  useEffect(() => {
    if (swiperRef.current && products.length > 0) {
      setTimeout(() => swiperRef.current?.update(), 50);
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
    variantImages: VariantImagesMap
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

  const getCurrencyText = () =>
    currency.code === "PKR"
      ? "PKR (₨)"
      : `${currency.code} (${currency.symbol})`;

  return (
    <>
      <section className="fp-section">
        <div className="fp-header">
          <p className="fp-eyebrow">
            <span className="fp-ey-line" />
            Curated Selection
            <span className="fp-ey-line" />
          </p>
          <h2 className="fp-title">
            Featured <em>Products</em>
          </h2>
          <p className="fp-subtitle">
            Handpicked luxury essentials across our finest categories
          </p>

          <div
            style={{
              width: "100%",
              marginTop: "1.5rem",
              display: "flex",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src="/feat.png"
              alt="Featured Banner"
              style={{
                width: "100%",
                height: "auto",
                maxWidth: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          <div className="fp-tabs" style={{ marginTop: "2rem" }}>
            {["Accessories", "Watches", "Automotive", "Home Decor"].map(
              (tab) => (
                <button
                  key={tab}
                  className={`fp-tab${
                    activeTab === tab ? " fp-tab--active" : ""
                  }`}
                  onClick={() => handleTabChange(tab)}
                >
                  {tab}
                </button>
              )
            )}
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
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button ref={nextRef} className="fp-nav-btn" aria-label="Next">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <Swiper
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
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard
                  product={product}
                  variants={variantsMap[product.id] || []}
                  variantImagesMap={variantImagesMap}
                  onQuickView={handleQuickView}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="fp-view-all-wrap">
            <Link href={activeTabData?.href || "/"} className="fp-view-all">
              <span>View All {activeTabData?.label || activeTab}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
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
