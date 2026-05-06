"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/cartStore";
import "@/app/styles/product-grid.css";
import { useCurrency } from "../context/CurrencyContext";
import FilterSidebar from "@/app/components/ProductGridFilters";
import "@/app/styles/grid-controls.css";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  subcategory: string;
  images: string[];
  stock: number;
  brand?: string;
  condition: string;
  is_featured: boolean;
  is_active: boolean;
  specs: Record<string, string>;
  created_at: string;
  low_stock_threshold?: number | null;
  stockStatus?: "in_stock" | "out_of_stock" | "low_stock";
  variantId?: string;
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

interface ExtendedProduct extends Product {
  variants?: ProductVariant[];
  variantImagesMap?: VariantImagesMap;
  selectedVariantId?: string;
}

interface ProductGridProps {
  category: string;
  subcategory?: string;
  limit?: number;
  featured?: boolean;
  onQuickView?: (productId: string) => void;
}

// ─── MODULE-LEVEL CACHE ──────────────────────────────────────────────────────
const MODULE_CACHE: Record<string, ExtendedProduct[]> = {};
const FETCH_IN_FLIGHT: Record<string, Promise<ExtendedProduct[]>> = {};

function cacheKey(
  category: string,
  subcategory?: string,
  limit?: number,
  featured?: boolean
) {
  return `${category}|${subcategory ?? ""}|${limit ?? ""}|${
    featured ? "1" : "0"
  }`;
}

// ─── Prefetch all common category combinations ───────────────────────────────
const ALL_CATEGORIES = ["Accessories", "Watches", "Automotive", "Home Decor"];
const ALL_SUBCATEGORIES: Record<string, string[]> = {
  Accessories: [
    "Chargers",
    "Cables",
    "Phone Holders",
    "Tech Gadgets",
    "Smart Accessories",
  ],
  Watches: ["Men Watches", "Women Watches", "Smart Watches", "Luxury Watches"],
  Automotive: [
    "Car Accessories",
    "Car Cleaning Tools",
    "Phone Holders",
    "Interior Accessories",
  ],
  "Home Decor": [
    "Wall Decor",
    "Lighting",
    "Kitchen Essentials",
    "Storage Organizers",
  ],
};

function prefetchAllProductGridData() {
  ALL_CATEGORIES.forEach((category) => {
    ensureCategoryCached(category, undefined, undefined, false);
    ensureCategoryCached(category, undefined, undefined, true);
    const subcats = ALL_SUBCATEGORIES[category] || [];
    subcats.forEach((subcat) => {
      ensureCategoryCached(category, subcat, undefined, false);
    });
  });
}

async function ensureCategoryCached(
  category: string,
  subcategory?: string,
  limit?: number,
  featured?: boolean
): Promise<ExtendedProduct[]> {
  const key = cacheKey(category, subcategory, limit, featured);

  if (MODULE_CACHE[key]) {
    return MODULE_CACHE[key];
  }

  const inFlight = FETCH_IN_FLIGHT[key];
  if (inFlight) {
    return await inFlight;
  }

  const promise = fetchProductsWithVariants(
    category,
    subcategory,
    limit,
    featured
  );
  FETCH_IN_FLIGHT[key] = promise;

  const data = await promise;
  MODULE_CACHE[key] = data;
  delete FETCH_IN_FLIGHT[key];
  return data;
}

const truncateProductName = (name: string, maxLength: number = 45): string => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength).trim() + "...";
};

const getStockStatus = (
  stock: number,
  threshold?: number | null
): "in_stock" | "out_of_stock" | "low_stock" => {
  if (stock === 0) return "out_of_stock";
  if (stock >= 999999) return "in_stock";
  if (threshold && threshold > 0 && stock <= threshold) return "low_stock";
  return "in_stock";
};

const getStockLabel = (
  status: "in_stock" | "out_of_stock" | "low_stock",
  stock: number
) => {
  if (status === "out_of_stock") return "Out of Stock";
  if (status === "low_stock") return `Only ${stock} left`;
  return "In Stock";
};

const getStockClass = (status: "in_stock" | "out_of_stock" | "low_stock") => {
  if (status === "out_of_stock") return "out";
  if (status === "low_stock") return "low";
  return "in";
};

async function fetchProductsWithVariants(
  category: string,
  subcategory?: string,
  limit?: number,
  featured?: boolean
): Promise<ExtendedProduct[]> {
  let query = supabase
    .from("products")
    .select("*, product_variants(*, variant_images(*))")
    .eq("is_active", true)
    .eq("category", category);

  if (subcategory) query = query.eq("subcategory", subcategory);
  if (featured) query = query.eq("is_featured", true);
  query = query.order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error || !data) return [];

  const typePriority: Record<string, number> = {
    standard: 0,
    color: 1,
    size: 2,
    material: 3,
    capacity: 4,
  };

  const result = data.map((item: any) => {
    const variants = (item.product_variants || []).map((variant: any) => {
      const variantImages = (variant.variant_images || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((img: any) => img.image_url);

      return {
        id: variant.id,
        product_id: variant.product_id,
        attribute_type: variant.attribute_type,
        attribute_value: variant.attribute_value,
        price: variant.price,
        original_price: variant.original_price,
        description: variant.description,
        stock: variant.stock,
        low_stock_threshold: variant.low_stock_threshold,
        images: variantImages,
        stockStatus: getStockStatus(variant.stock, variant.low_stock_threshold),
      };
    });

    const sortedVariants = [...variants].sort(
      (a, b) =>
        (typePriority[a.attribute_type] || 5) -
        (typePriority[b.attribute_type] || 5)
    );
    const bestVariant = sortedVariants[0];

    const variantImagesMap: VariantImagesMap = {};
    variants.forEach((variant: ProductVariant) => {
      if (variant.images && variant.images.length > 0) {
        variantImagesMap[variant.id] = variant.images;
      }
    });

    return {
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: bestVariant?.price ?? item.price ?? 0,
      original_price:
        bestVariant?.original_price ?? item.original_price ?? undefined,
      category: item.category,
      subcategory: item.subcategory,
      images:
        bestVariant?.images?.length > 0
          ? bestVariant.images
          : item.images || [],
      stock: bestVariant?.stock ?? item.stock ?? 0,
      brand: item.brand || undefined,
      condition: item.condition || "new",
      is_featured: item.is_featured || false,
      is_active: item.is_active ?? true,
      specs: item.specs || {},
      created_at: item.created_at || new Date().toISOString(),
      low_stock_threshold:
        bestVariant?.low_stock_threshold ?? item.low_stock_threshold ?? null,
      stockStatus:
        bestVariant?.stockStatus ||
        getStockStatus(
          bestVariant?.stock ?? item.stock ?? 0,
          bestVariant?.low_stock_threshold ?? item.low_stock_threshold
        ),
      variantId: bestVariant?.id,
      variants: sortedVariants,
      variantImagesMap,
    };
  });

  return result;
}

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
    <div className="pg-card-variants">
      <span className="pg-variant-label">
        {getIcon()} {getTypeLabel()}:
      </span>
      <div className="pg-variant-thumbnails">
        {displayVariants.map((variant) => {
          const variantImage = getVariantImage(variant.id);
          const isActive = currentValue === variant.attribute_value;
          return (
            <button
              key={variant.id}
              className={`pg-variant-thumb ${isActive ? "active" : ""}`}
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
                <span className="pg-variant-text">
                  {variant.attribute_value.charAt(0)}
                </span>
              )}
              <span className="pg-variant-label-text">
                {variant.attribute_value.length > 10
                  ? variant.attribute_value.slice(0, 8) + "..."
                  : variant.attribute_value}
              </span>
            </button>
          );
        })}
        {hasMore && (
          <span className="pg-variant-more">+{variants.length - 4}</span>
        )}
      </div>
    </div>
  );
}

function LoadingSpinner({ size = 18 }: { size?: number }) {
  return (
    <div
      className="pg-spinner"
      style={{
        width: size,
        height: size,
        border: "2px solid rgba(218,165,32,0.2)",
        borderTopColor: "#daa520",
        borderRadius: "50%",
        animation: "pg-spin 0.8s linear infinite",
        display: "inline-block",
      }}
    />
  );
}

function SkeletonCard() {
  return (
    <div
      className="pg-card"
      style={{
        pointerEvents: "none",
        animation: "pg-skeleton-pulse 1.4s ease-in-out infinite",
      }}
    >
      <div
        className="pg-card-img"
        style={{ background: "rgba(0,0,0,0.06)", borderRadius: 8 }}
      />
      <div className="pg-card-body" style={{ gap: 10 }}>
        <div
          style={{
            height: 12,
            width: "40%",
            background: "rgba(0,0,0,0.06)",
            borderRadius: 4,
          }}
        />
        <div
          style={{
            height: 16,
            width: "80%",
            background: "rgba(0,0,0,0.08)",
            borderRadius: 4,
          }}
        />
        <div
          style={{
            height: 14,
            width: "55%",
            background: "rgba(218,165,32,0.15)",
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
}

function ProductCardComponent({
  productData,
  onQuickView,
  formatPrice,
  addToCart,
}: {
  productData: ExtendedProduct;
  onQuickView?: (productId: string) => void;
  formatPrice: (value: number) => string;
  addToCart: (
    product: any,
    variant: any,
    quantity: number,
    maxStock?: number
  ) => Promise<void>;
}) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    productData.variants && productData.variants.length > 0
      ? productData.variants[0]
      : null
  );
  const [currentImages, setCurrentImages] = useState<string[]>(() => {
    if (
      productData.variants &&
      productData.variants.length > 0 &&
      productData.variantImagesMap
    ) {
      const firstVariant = productData.variants[0];
      if (firstVariant && productData.variantImagesMap[firstVariant.id]) {
        return productData.variantImagesMap[firstVariant.id];
      }
    }
    return productData.images || [];
  });
  const [addToCartLoading, setAddToCartLoading] = useState(false);

  const colorVariants =
    productData.variants?.filter((v) => v.attribute_type === "color") || [];
  const sizeVariants =
    productData.variants?.filter((v) => v.attribute_type === "size") || [];
  const materialVariants =
    productData.variants?.filter((v) => v.attribute_type === "material") || [];
  const capacityVariants =
    productData.variants?.filter((v) => v.attribute_type === "capacity") || [];

  const getVariantImage = useCallback(
    (variantId: string): string | null => {
      if (
        productData.variantImagesMap &&
        productData.variantImagesMap[variantId]
      ) {
        const images = productData.variantImagesMap[variantId];
        return images && images.length > 0 ? images[0] : null;
      }
      return null;
    },
    [productData.variantImagesMap]
  );

  const getVariantImages = useCallback(
    (variantId: string): string[] => {
      if (
        productData.variantImagesMap &&
        productData.variantImagesMap[variantId]
      ) {
        return productData.variantImagesMap[variantId];
      }
      return [];
    },
    [productData.variantImagesMap]
  );

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    const newImages = getVariantImages(variant.id);
    setCurrentImages(newImages);
    setIsHovered(false);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const getDisplayImage = () => {
    if (currentImages.length === 0) return null;
    return currentImages[0];
  };

  const displayImage = getDisplayImage();

  const discount =
    selectedVariant?.original_price &&
    selectedVariant.original_price > selectedVariant.price
      ? Math.round(
          ((selectedVariant.original_price - selectedVariant.price) /
            selectedVariant.original_price) *
            100
        )
      : productData.original_price &&
        productData.original_price > productData.price
      ? Math.round(
          ((productData.original_price - productData.price) /
            productData.original_price) *
            100
        )
      : null;

  const stockStatus = selectedVariant
    ? getStockStatus(selectedVariant.stock, selectedVariant.low_stock_threshold)
    : productData.stockStatus ||
      getStockStatus(productData.stock, productData.low_stock_threshold);
  const isLowStock = stockStatus === "low_stock";
  const isOutOfStock = stockStatus === "out_of_stock";
  const currentStock = selectedVariant?.stock || productData.stock || 0;

  const getStockLabelText = () => {
    if (isOutOfStock) return "Out of Stock";
    if (isLowStock) return `Only ${currentStock} left`;
    return "In Stock";
  };

  const getStockClassText = () => {
    if (isOutOfStock) return "out";
    if (isLowStock) return "low";
    return "in";
  };

  const truncatedName = truncateProductName(productData.name, 45);

  const displaySalePrice = selectedVariant
    ? formatPrice(selectedVariant.price)
    : formatPrice(productData.price);
  const displayOriginalPrice = selectedVariant?.original_price
    ? formatPrice(selectedVariant.original_price)
    : productData.original_price &&
      productData.original_price > productData.price
    ? formatPrice(productData.original_price)
    : null;

  const handleAddToCartClick = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedVariant && !productData.variantId) {
      alert("Please select a variant first");
      return;
    }
    if (isOutOfStock) {
      alert("This product is out of stock");
      return;
    }
    if (addToCartLoading) return;

    setAddToCartLoading(true);

    const variantToUse =
      selectedVariant ||
      (productData.variantId
        ? {
            id: productData.variantId,
            product_id: productData.id,
            attribute_type: "standard" as const,
            attribute_value: "Standard",
            price: productData.price,
            original_price: productData.original_price,
            stock: productData.stock,
            low_stock_threshold: productData.low_stock_threshold ?? undefined,
            is_active: true,
          }
        : null);

    const productToAdd = {
      id: productData.id,
      name: productData.name,
      description:
        selectedVariant?.description || productData.description || "",
      category: productData.category,
      subcategory: productData.subcategory,
      brand: productData.brand || "",
      condition: productData.condition,
      is_featured: productData.is_featured,
      is_active: productData.is_active,
      images: currentImages.length > 0 ? currentImages : productData.images,
      price: selectedVariant?.price || productData.price,
      original_price:
        selectedVariant?.original_price || productData.original_price,
      stock: currentStock,
      stockStatus: stockStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await addToCart(productToAdd, variantToUse, 1, 1);
    } finally {
      setAddToCartLoading(false);
    }
  };

  const handleQuickViewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(productData.id);
  };

  return (
    <div
      onClick={() => {
        router.push(`/product/${productData.id}`);
      }}
      className="pg-card"
      style={{ cursor: "pointer" }}
    >
      <div
        className="pg-card-img"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={productData.name}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div className="pg-card-placeholder">
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
        <div className="pg-icon-buttons">
          <button
            className="pg-icon-btn pg-icon-btn--view"
            onClick={handleQuickViewClick}
            aria-label="Quick View"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z" />
            </svg>
          </button>
          <button
            className="pg-icon-btn pg-icon-btn--cart"
            onClick={handleAddToCartClick}
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
      <div className="pg-card-body">
        {productData.brand && (
          <p className="pg-card-brand">{productData.brand}</p>
        )}
        <h3 className="pg-card-name" title={productData.name}>
          {truncatedName}
        </h3>
        <div className="pg-card-price-row">
          <span className="pg-card-price">{displaySalePrice}</span>
          {displayOriginalPrice && (
            <span className="pg-card-orig">{displayOriginalPrice}</span>
          )}
          {discount && discount > 0 && (
            <span className="pg-card-discount">-{discount}%</span>
          )}
        </div>
        {colorVariants.length > 0 && (
          <VariantThumbnails
            variants={colorVariants}
            type="color"
            onSelect={handleVariantSelect}
            currentValue={selectedVariant?.attribute_value || ""}
            variantImagesMap={productData.variantImagesMap || {}}
            getVariantImage={getVariantImage}
          />
        )}
        {sizeVariants.length > 0 && (
          <VariantThumbnails
            variants={sizeVariants}
            type="size"
            onSelect={handleVariantSelect}
            currentValue={selectedVariant?.attribute_value || ""}
            variantImagesMap={productData.variantImagesMap || {}}
            getVariantImage={getVariantImage}
          />
        )}
        {materialVariants.length > 0 && (
          <VariantThumbnails
            variants={materialVariants}
            type="material"
            onSelect={handleVariantSelect}
            currentValue={selectedVariant?.attribute_value || ""}
            variantImagesMap={productData.variantImagesMap || {}}
            getVariantImage={getVariantImage}
          />
        )}
        {capacityVariants.length > 0 && (
          <VariantThumbnails
            variants={capacityVariants}
            type="capacity"
            onSelect={handleVariantSelect}
            currentValue={selectedVariant?.attribute_value || ""}
            variantImagesMap={productData.variantImagesMap || {}}
            getVariantImage={getVariantImage}
          />
        )}
        <div className={`pg-card-stock ${getStockClassText()}`}>
          {getStockLabelText()}
        </div>
      </div>
      <div className="pg-card-line" />
    </div>
  );
}

// ─── Main ProductGrid Component ───────────────────────────────────────────────
export default function ProductGrid({
  category,
  subcategory,
  limit,
  featured = false,
  onQuickView,
}: ProductGridProps) {
  const key = cacheKey(category, subcategory, limit, featured);

  // ✅ FIX: Store FETCH_IN_FLIGHT[key] in a variable to avoid TypeScript error
  const hasInFlight = !!FETCH_IN_FLIGHT[key];

  const [products, setProducts] = useState<ExtendedProduct[]>(
    () => MODULE_CACHE[key] ?? []
  );
  const [loading, setLoading] = useState(() => {
    if (MODULE_CACHE[key]) return false;
    if (hasInFlight) return true;
    return true;
  });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [columns, setColumns] = useState(4);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    category: "All",
    subcategory: "All",
    color: "All",
    size: "All",
    capacity: "All",
    material: "All",
  });
  const { formatPrice } = useCurrency();
  const { addToCart } = useCartStore();

  useEffect(() => {
    setTimeout(() => {
      prefetchAllProductGridData();
    }, 100);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (MODULE_CACHE[key]) {
        setProducts(MODULE_CACHE[key]);
        setLoading(false);
        return;
      }

      const inFlightPromise = FETCH_IN_FLIGHT[key];
      if (inFlightPromise) {
        const data = await inFlightPromise;
        if (isMounted) {
          setProducts(data);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const data = await ensureCategoryCached(
          category,
          subcategory,
          limit,
          featured
        );
        if (isMounted) {
          setProducts(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading products:", err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    // Fix: Chrome back/forward (bfcache) — pageshow fires when page restored from bfcache
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && isMounted) {
        const cached = MODULE_CACHE[key];
        if (cached && cached.length > 0) {
          setProducts(cached);
          setLoading(false);
        } else {
          setLoading(true);
          ensureCategoryCached(category, subcategory, limit, featured).then(
            (data) => {
              if (isMounted) {
                setProducts(data);
                setLoading(false);
              }
            }
          );
        }
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      isMounted = false;
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [key, category, subcategory, limit, featured]);

  const getFilterOptions = useMemo(() => {
    const categories = new Set<string>();
    const subcategories = new Set<string>();
    const colors = new Set<string>();
    const sizes = new Set<string>();
    const capacities = new Set<string>();
    const materials = new Set<string>();

    products.forEach((product) => {
      categories.add(product.category);
      subcategories.add(product.subcategory);

      product.variants?.forEach((variant) => {
        if (variant.attribute_type === "color")
          colors.add(variant.attribute_value);
        if (variant.attribute_type === "size")
          sizes.add(variant.attribute_value);
        if (variant.attribute_type === "capacity")
          capacities.add(variant.attribute_value);
        if (variant.attribute_type === "material")
          materials.add(variant.attribute_value);
      });
    });

    return {
      categories: Array.from(categories).sort(),
      subcategories: Array.from(subcategories).sort(),
      colors: Array.from(colors).sort(),
      sizes: Array.from(sizes).sort(),
      capacities: Array.from(capacities).sort(),
      materials: Array.from(materials).sort(),
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (selectedFilters.category !== "All") {
      filtered = filtered.filter(
        (p) => p.category === selectedFilters.category
      );
    }
    if (selectedFilters.subcategory !== "All") {
      filtered = filtered.filter(
        (p) => p.subcategory === selectedFilters.subcategory
      );
    }
    if (selectedFilters.color !== "All") {
      filtered = filtered.filter((p) =>
        p.variants?.some(
          (v) =>
            v.attribute_type === "color" &&
            v.attribute_value === selectedFilters.color
        )
      );
    }
    if (selectedFilters.size !== "All") {
      filtered = filtered.filter((p) =>
        p.variants?.some(
          (v) =>
            v.attribute_type === "size" &&
            v.attribute_value === selectedFilters.size
        )
      );
    }
    if (selectedFilters.capacity !== "All") {
      filtered = filtered.filter((p) =>
        p.variants?.some(
          (v) =>
            v.attribute_type === "capacity" &&
            v.attribute_value === selectedFilters.capacity
        )
      );
    }
    if (selectedFilters.material !== "All") {
      filtered = filtered.filter((p) =>
        p.variants?.some(
          (v) =>
            v.attribute_type === "material" &&
            v.attribute_value === selectedFilters.material
        )
      );
    }

    return filtered;
  }, [products, selectedFilters]);

  const filteredAndSorted = useMemo(() => {
    let filtered = [...filteredProducts];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.brand && p.brand.toLowerCase().includes(s)) ||
          p.subcategory.toLowerCase().includes(s)
      );
    }
    switch (sort) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "featured":
        filtered.sort(
          (a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
        );
        break;
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return filtered;
  }, [filteredProducts, search, sort]);

  const handleFilterChange = (filterType: string, value: string) => {
    setSelectedFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const handleClearAllFilters = () => {
    setSelectedFilters({
      category: "All",
      subcategory: "All",
      color: "All",
      size: "All",
      capacity: "All",
      material: "All",
    });
  };

  const activeFilterCount = Object.values(selectedFilters).filter(
    (v) => v !== "All"
  ).length;

  if (loading && products.length === 0) {
    const skeletonCount = limit ?? 8;
    return (
      <>
        <style>{`
          @keyframes pg-spin { to { transform: rotate(360deg); } }
          @keyframes pg-skeleton-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        `}</style>
        <div className="pg-grid">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </>
    );
  }

  if (filteredAndSorted.length === 0 && products.length > 0) {
    return (
      <div className="pg-empty">
        <div className="pg-empty-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <p className="pg-empty-title">No products found</p>
        <p className="pg-empty-sub">
          {search
            ? `No results for "${search}"`
            : "Check back soon for new arrivals"}
        </p>
      </div>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <div className="pg-empty">
        <div className="pg-empty-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <p className="pg-empty-title">No products found</p>
        <p className="pg-empty-sub">Check back soon for new arrivals</p>
      </div>
    );
  }

  return (
    <>
      <style>{`@keyframes pg-spin { to { transform: rotate(360deg); } }`}</style>
      {!limit && (
        <>
          <div className="grid-controls-bar">
            <div className="grid-controls-left">
              <button
                className="filter-trigger"
                onClick={() => setIsFilterOpen(true)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="filter-active-dot" />
                )}
              </button>

              <div className="per-row-selector">
                <button
                  className={`per-row-btn ${columns === 2 ? "active" : ""}`}
                  onClick={() => setColumns(2)}
                  data-tooltip="2 columns"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="8" height="18" rx="1" />
                    <rect x="13" y="3" width="8" height="18" rx="1" />
                  </svg>
                </button>
                <button
                  className={`per-row-btn ${columns === 3 ? "active" : ""}`}
                  onClick={() => setColumns(3)}
                  data-tooltip="3 columns"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="2" y="3" width="6" height="18" rx="1" />
                    <rect x="9" y="3" width="6" height="18" rx="1" />
                    <rect x="16" y="3" width="6" height="18" rx="1" />
                  </svg>
                </button>
                <button
                  className={`per-row-btn ${columns === 4 ? "active" : ""}`}
                  onClick={() => setColumns(4)}
                  data-tooltip="4 columns"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="1" y="3" width="5" height="18" rx="1" />
                    <rect x="7" y="3" width="5" height="18" rx="1" />
                    <rect x="13" y="3" width="5" height="18" rx="1" />
                    <rect x="19" y="3" width="4" height="18" rx="1" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid-controls-right">
              <select
                className="grid-sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="featured">Featured First</option>
              </select>
              <span className="grid-result-count">
                <em>{filteredAndSorted.length}</em>{" "}
                {filteredAndSorted.length === 1 ? "item" : "items"}
              </span>
            </div>
          </div>

          <FilterSidebar
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            filters={getFilterOptions}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAllFilters}
          />
        </>
      )}
      <div className={`pg-grid pg-grid--cols-${columns}`}>
        {filteredAndSorted.map((product) => (
          <ProductCardComponent
            key={product.id}
            productData={product}
            onQuickView={onQuickView}
            formatPrice={formatPrice}
            addToCart={addToCart}
          />
        ))}
      </div>
    </>
  );
}
