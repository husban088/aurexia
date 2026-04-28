"use client";

import { useState } from "react";
import Link from "next/link";
import ProductGrid from "./ProductGrid";
import QuickView from "./QuickView";
import { supabase } from "@/lib/supabase";
import "../styles/product-grid.css";

interface SubcategoryPageProps {
  category: string;
  subcategory: string;
  title: string;
  description: string;
  breadcrumb: {
    parent: string;
    parentHref: string;
  };
}

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
}

export default function Subcategory({
  category,
  subcategory,
  title,
  description,
  breadcrumb,
}: SubcategoryPageProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] =
    useState<QuickViewProduct | null>(null);
  const [quickViewVariants, setQuickViewVariants] = useState<ProductVariant[]>(
    []
  );
  const [quickViewSelectedVariant, setQuickViewSelectedVariant] =
    useState<ProductVariant | null>(null);
  const [variantImagesMap, setVariantImagesMap] = useState<
    Record<string, string[]>
  >({});

  const handleQuickView = async (productId: string) => {
    try {
      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (productError) {
        console.error("Error fetching product:", productError);
        return;
      }

      // Fetch variants
      const { data: variantsData, error: variantsError } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true);

      if (variantsError) {
        console.error("Error fetching variants:", variantsError);
        return;
      }

      // Fetch variant images
      if (variantsData && variantsData.length > 0) {
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
          setVariantImagesMap(imagesByVariant);
        }
      }

      // Get best variant for price
      const bestVariant =
        variantsData?.find((v: any) => v.attribute_type === "standard") ||
        variantsData?.[0];

      // Get product images from variant or product
      let productImages: string[] = [];
      if (bestVariant && variantImagesMap[bestVariant.id]) {
        productImages = variantImagesMap[bestVariant.id];
      } else if (productData.images) {
        productImages = productData.images;
      }

      const stock = bestVariant?.stock || productData.stock || 0;
      const lowStockThreshold =
        bestVariant?.low_stock_threshold || productData.low_stock_threshold;
      const stockStatus =
        stock === 0
          ? "out_of_stock"
          : lowStockThreshold && stock <= lowStockThreshold
          ? "low_stock"
          : "in_stock";

      const quickViewData: QuickViewProduct = {
        id: productData.id,
        name: productData.name,
        brand: productData.brand,
        price: bestVariant?.price || productData.price || 0,
        original_price:
          bestVariant?.original_price || productData.original_price,
        category: productData.category,
        subcategory: productData.subcategory,
        images: productImages,
        stock: stock,
        description: bestVariant?.description || productData.description,
        condition: productData.condition,
        is_featured: productData.is_featured,
        is_active: productData.is_active,
        stockStatus: stockStatus,
        lowStockThreshold: lowStockThreshold,
        rating: productData.rating,
        reviews_count: productData.reviews_count,
      };

      setQuickViewProduct(quickViewData);
      setQuickViewVariants(variantsData || []);
      setQuickViewSelectedVariant(bestVariant || null);
      setQuickViewOpen(true);
    } catch (err) {
      console.error("QuickView error:", err);
    }
  };

  return (
    <>
      <div className="sub-root">
        <div className="sub-ambient" aria-hidden="true" />
        <div className="sub-grain" aria-hidden="true" />
        <div className="sub-lines" aria-hidden="true">
          {[...Array(6)].map((_, i) => (
            <span key={i} />
          ))}
        </div>

        <div className="sub-hero">
          <div className="sub-hero-inner">
            <div className="sub-breadcrumb">
              <Link href="/" className="sub-breadcrumb-link">
                Home
              </Link>
              <span className="sub-breadcrumb-sep">/</span>
              <Link
                href={breadcrumb.parentHref}
                className="sub-breadcrumb-link"
              >
                {breadcrumb.parent}
              </Link>
              <span className="sub-breadcrumb-sep">/</span>
              <span className="sub-breadcrumb-current">{subcategory}</span>
            </div>

            <h1
              className="sub-title"
              dangerouslySetInnerHTML={{ __html: title }}
            />
            <p className="sub-description">{description}</p>

            <div className="sub-deco">
              <div className="sub-deco-line" />
              <div className="sub-deco-diamond" />
              <div className="sub-deco-line" />
            </div>
          </div>
        </div>

        <div className="sub-main">
          <ProductGrid
            category={category}
            subcategory={subcategory}
            onQuickView={handleQuickView}
          />
        </div>
      </div>

      <QuickView
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        product={quickViewProduct}
        variants={quickViewVariants}
        selectedVariant={quickViewSelectedVariant}
        variantImagesMap={variantImagesMap}
      />
    </>
  );
}
