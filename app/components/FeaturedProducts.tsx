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

// Dynamic import for QuickView to avoid SSR issues
// Already using dynamic import below

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

// Pre-fetched initial data type
export interface FeaturedTabData {
  products: FeaturedProduct[];
  variantsMap: Record<string, ProductVariant[]>;
  variantImagesMap: Record<string, string[]>;
}

const getStockStatus = (
  stock: number,
  threshold?: number | null
): "in_stock" | "out_of_stock" | "low_stock" => {
  if (stock === 0) return "out_of_stock";
  if (threshold && threshold > 0 && stock <= threshold) return "low_stock";
  return "in_stock";
};

// Standalone fetch function
export async function fetchFeaturedTabData(
  tab: string
): Promise<FeaturedTabData> {
  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .eq("category", tab)
    .order("created_at", { ascending: false })
    .limit(12);

  if (productsError || !productsData || productsData.length === 0) {
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

  const productIds = productsData.map((p: any) => p.id);

  const { data: variantsData } = await supabase
    .from("product_variants")
    .select("*")
    .in("product_id", productIds)
    .eq("is_active", true);

  const variantsByProduct: Record<string, ProductVariant[]> = {};

  if (variantsData && variantsData.length > 0) {
    variantsData.forEach((variant: any) => {
      if (!variantsByProduct[variant.product_id]) {
        variantsByProduct[variant.product_id] = [];
      }
      variantsByProduct[variant.product_id].push({
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
      });
    });

    const order = { standard: 0, color: 1, size: 2, material: 3, capacity: 4 };
    for (const productId in variantsByProduct) {
      variantsByProduct[productId].sort(
        (a, b) =>
          (order[a.attribute_type as keyof typeof order] || 5) -
          (order[b.attribute_type as keyof typeof order] || 5)
      );
    }

    const variantIds = variantsData.map((v: any) => v.id);
    const { data: imagesData } = await supabase
      .from("variant_images")
      .select("*")
      .in("variant_id", variantIds)
      .order("display_order", { ascending: true });

    if (imagesData) {
      const imagesByVariant: Record<string, string[]> = {};
      imagesData.forEach((img: any) => {
        if (!imagesByVariant[img.variant_id]) {
          imagesByVariant[img.variant_id] = [];
        }
        imagesByVariant[img.variant_id].push(img.image_url);
      });
      return {
        products: formattedProducts,
        variantsMap: variantsByProduct,
        variantImagesMap: imagesByVariant,
      };
    }
  }

  return {
    products: formattedProducts,
    variantsMap: variantsByProduct,
    variantImagesMap: {},
  };
}

// Skeleton Loader Component
function ProductCardSkeleton() {
  return (
    <div className="fp-card fp-card--skeleton">
      <div className="fp-card-img fp-skel-img">
        <div className="fp-skel-img-overlay"></div>
      </div>
      <div className="fp-card-body">
        <div
          className="fp-skel-line"
          style={{ width: "40%", height: "0.65rem" }}
        ></div>
        <div
          className="fp-skel-line"
          style={{ width: "85%", height: "1.25rem", marginTop: "0.25rem" }}
        ></div>
        <div
          className="fp-skel-line"
          style={{ width: "60%", height: "1.35rem", marginTop: "0.5rem" }}
        ></div>
        <div
          className="fp-skel-line"
          style={{ width: "90%", height: "0.55rem", marginTop: "0.5rem" }}
        ></div>
        <div
          className="fp-skel-line"
          style={{ width: "70%", height: "0.55rem", marginTop: "0.3rem" }}
        ></div>
        <div
          className="fp-skel-line"
          style={{ width: "45%", height: "0.6rem", marginTop: "0.5rem" }}
        ></div>
      </div>
    </div>
  );
}

// Variant selector component
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
                // eslint-disable-next-line @next/next/no-img-element
                <img src={variantImage} alt={variant.attribute_value} />
              ) : (
                <span className="fp-variant-text">
                  {variant.attribute_value.charAt(0)}
                </span>
              )}
              <span className="fp-variant-label-text">
                {variant.attribute_value.length > 12
                  ? variant.attribute_value.slice(0, 10) + "..."
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

// Loading Spinner Component
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

// Single Product Card Component with Currency Support
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
    variantImagesMap: VariantImagesMap
  ) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { currency, formatPrice } = useCurrency();
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

  // Loading states for buttons
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const [addToCartLoading, setAddToCartLoading] = useState(false);

  const { addToCart } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    (variantId: string): string[] => {
      return variantImagesMap[variantId] || [];
    },
    [variantImagesMap]
  );

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setCurrentImages(getVariantImages(variant.id));
    setCurrentImageIndex(0);
  };

  const handleMouseEnter = () => {
    if (currentImages.length > 1) {
      setCurrentImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  const displayImage =
    currentImages.length > 0 ? currentImages[currentImageIndex] : null;

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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedVariant) {
      alert("Please select a variant first");
      return;
    }

    if (stockStatus === "out_of_stock") {
      alert("This product is out of stock");
      return;
    }

    setAddToCartLoading(true);

    // Small delay to show loader
    await new Promise((resolve) => setTimeout(resolve, 300));

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
      low_stock_threshold: selectedVariant.low_stock_threshold,
      stockStatus: stockStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addToCart(productToAdd, selectedVariant, 1, 1);
    setAddToCartLoading(false);
  };

  const handleQuickViewClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setQuickViewLoading(true);

    // Small delay to show loader
    await new Promise((resolve) => setTimeout(resolve, 200));

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

  // Display prices in user's currency using formatPrice
  const displaySalePrice = selectedVariant
    ? formatPrice(selectedVariant.price)
    : formatPrice(0);
  const displayOriginalPrice = selectedVariant?.original_price
    ? formatPrice(selectedVariant.original_price)
    : null;

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return <ProductCardSkeleton />;
  }

  return (
    <Link href={`/product/${product.id}`} className="fp-card">
      <div
        className="fp-card-img"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayImage} alt={product.name} loading="lazy" />
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
          {product.is_featured && (
            <span className="fp-badge fp-badge--feat">Featured</span>
          )}
          {discount && discount > 0 && (
            <span className="fp-badge fp-badge--sale">-{discount}%</span>
          )}
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
        <h3 className="fp-card-name">{product.name}</h3>

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

      {/* Add spinner animation styles */}
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

// FeaturedProducts Component
export default function FeaturedProducts({
  initialData,
}: {
  initialData?: { [tab: string]: FeaturedTabData };
}) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("Accessories");
  const [products, setProducts] = useState<FeaturedProduct[]>(
    initialData?.["Accessories"]?.products || []
  );
  const [variantsMap, setVariantsMap] = useState<
    Record<string, ProductVariant[]>
  >(initialData?.["Accessories"]?.variantsMap || {});
  const [variantImagesMap, setVariantImagesMap] = useState<
    Record<string, string[]>
  >(initialData?.["Accessories"]?.variantImagesMap || {});
  const [loading, setLoading] = useState(!initialData?.["Accessories"]);

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

  const dataCache = useRef<{
    [tab: string]: FeaturedTabData;
  }>(initialData || {});

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadDataForTab = useCallback(
    async (tab: string, isInitialLoad: boolean = false) => {
      if (dataCache.current[tab]) {
        setProducts(dataCache.current[tab].products);
        setVariantsMap(dataCache.current[tab].variantsMap);
        setVariantImagesMap(dataCache.current[tab].variantImagesMap);
        if (isInitialLoad) setLoading(false);
        return;
      }

      if (isInitialLoad) {
        setLoading(true);
      }

      try {
        const tabData = await fetchFeaturedTabData(tab);
        dataCache.current[tab] = tabData;
        setProducts(tabData.products);
        setVariantsMap(tabData.variantsMap);
        setVariantImagesMap(tabData.variantImagesMap);
        if (isInitialLoad) setLoading(false);
      } catch (error) {
        console.error("Error loading products:", error);
        if (isInitialLoad) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const categories = ["Accessories", "Watches", "Automotive", "Home Decor"];

    if (!initialData?.["Accessories"]) {
      loadDataForTab("Accessories", true);
    }

    categories.forEach((category) => {
      if (category !== "Accessories" && !initialData?.[category]) {
        setTimeout(() => loadDataForTab(category, false), 100);
      }
    });
  }, [initialData, loadDataForTab]);

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      loadDataForTab(tab, false);
    },
    [loadDataForTab]
  );

  useEffect(() => {
    if (swiperRef.current && !loading && products.length > 0 && mounted) {
      setTimeout(() => {
        swiperRef.current?.update();
      }, 50);
    }
  }, [products, loading, mounted]);

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
    const quickViewProductData: QuickViewProduct = {
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
      stockStatus: stockStatus,
      lowStockThreshold: lowStockThreshold,
    };

    setQuickViewProduct(quickViewProductData);
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

  const skeletonCount = 8;

  const getCurrencyText = () => {
    if (!mounted) return "";
    if (currency.code === "PKR") return "PKR (₨)";
    return `${currency.code} (${currency.symbol})`;
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <section className="fp-section">
        <div className="fp-header">
          <div className="fp-skeleton-header">
            <div
              className="fp-skel-line"
              style={{ width: "200px", height: "20px", margin: "0 auto" }}
            ></div>
            <div
              className="fp-skel-line"
              style={{ width: "300px", height: "40px", margin: "10px auto" }}
            ></div>
          </div>
        </div>
        <div className="fp-container">
          <div className="fp-skeleton-grid">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="fp-section">
        <div className="fp-header">
          <p className="fp-eyebrow">
            <span className="fp-ey-line" />
            Curated Selection {currency.flag} {getCurrencyText()}
            <span className="fp-ey-line" />
          </p>
          <h2 className="fp-title">
            Featured <em>Products</em>
          </h2>
          <p className="fp-subtitle">
            Handpicked luxury essentials across our finest categories
            <br />
            <span style={{ fontSize: "0.7rem", color: "#8b6914" }}>
              💱 Prices shown in {currency.code} ({currency.symbol})
            </span>
          </p>

          {/* Featured Banner Image - FULLY RESPONSIVE */}
          <div
            style={{
              width: "100%",
              marginTop: "1.5rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
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

          {loading && products.length === 0 ? (
            <Swiper
              modules={[Pagination, Navigation, A11y]}
              spaceBetween={1}
              slidesPerView={1}
              breakpoints={{
                480: { slidesPerView: 2, spaceBetween: 1 },
                768: { slidesPerView: 3, spaceBetween: 1 },
                1024: { slidesPerView: 4, spaceBetween: 1 },
              }}
              className="fp-swiper"
            >
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <SwiperSlide key={`skeleton-${i}`}>
                  <ProductCardSkeleton />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : products.length === 0 && !loading ? (
            <div className="fp-empty">
              <p>No featured products in this category</p>
            </div>
          ) : (
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
          )}

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
