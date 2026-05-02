"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/cartStore";
import "@/app/styles/product-grid.css";
import { useCurrency } from "../context/CurrencyContext";

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

// FAST fetch function with all variants and images
async function fetchProductsWithVariants(
  category: string,
  subcategory?: string,
  limit?: number,
  featured?: boolean
) {
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

  return data.map((item: any) => {
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
}

// Variant selector component for product grid
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

// Loading Spinner Component
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

// Product Card Component with Variant Support - FIXED HOVER IMAGE
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

  // ✅ FIXED: Hover handlers for image switching
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Get current display image - show second image on hover if available
  const getDisplayImage = () => {
    if (currentImages.length === 0) return null;
    if (isHovered && currentImages.length > 1) {
      return currentImages[1];
    }
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
      low_stock_threshold:
        selectedVariant?.low_stock_threshold || productData.low_stock_threshold,
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
        window.location.href = `/product/${productData.id}`;
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
          <img src={displayImage} alt={productData.name} loading="eager" />
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
      <style jsx>{`
        @keyframes pg-spin {
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

export default function ProductGrid({
  category,
  subcategory,
  limit,
  featured = false,
  onQuickView,
}: ProductGridProps) {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const { formatPrice } = useCurrency();
  const { addToCart } = useCartStore();

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      const data = await fetchProductsWithVariants(
        category,
        subcategory,
        limit,
        featured
      );
      if (active) {
        setProducts(data);
        setLoading(false);
      }
    }

    loadProducts();
    return () => {
      active = false;
    };
  }, [category, subcategory, limit, featured]);

  const filteredAndSorted = useMemo(() => {
    let filtered = [...products];
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
  }, [products, search, sort]);

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

  return (
    <>
      <style>{`@keyframes pg-spin { to { transform: rotate(360deg); } }`}</style>
      {!limit && (
        <div className="pg-toolbar">
          <div className="pg-search-wrap">
            <svg
              className="pg-search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="pg-search"
              placeholder={`Search ${subcategory || category}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="pg-sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="featured">Featured First</option>
          </select>
          <span className="pg-count">
            <em>{filteredAndSorted.length}</em>{" "}
            {filteredAndSorted.length === 1 ? "item" : "items"}
          </span>
        </div>
      )}
      <div className="pg-grid">
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
