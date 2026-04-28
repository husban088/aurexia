// lib/supabase.ts
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Bulk Pricing Tier type
export type BulkPricingTier = {
  id?: string;
  variant_id: string;
  min_quantity: number;
  max_quantity: number;
  tier_price: number; // Total price for that quantity
  discount_percentage: number | null; // Discount percentage
  discount_price: number | null; // Final discounted price
  created_at?: string;
  updated_at?: string;
};

// Product type (basic info only)
export type Product = {
  id?: string;
  created_at?: string;
  updated_at?: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand?: string;
  condition: string;
  is_featured: boolean;
  is_active: boolean;
  rating?: number;
  reviews_count?: number;
  price?: number;
  stock?: number;
  images?: string[];
  original_price?: number;
};

// Product Variant type
export type ProductVariant = {
  id?: string;
  product_id: string;
  attribute_type: "color" | "size" | "material" | "capacity" | "standard";
  attribute_value: string;
  price: number;
  original_price?: number;
  description?: string;
  stock: number;
  low_stock_threshold?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  bulk_pricing_tiers?: BulkPricingTier[];
};

// Variant Image type
export type VariantImage = {
  id?: string;
  variant_id: string;
  image_url: string;
  display_order: number;
  created_at?: string;
};

// Product FAQ type
export type ProductFAQ = {
  id?: string;
  product_id: string;
  question: string;
  answer?: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

// Cart Item type
export type CartItemType = {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string;
  variant_name?: string;
  variant_price?: number; // per-piece price (even for bulk tiers)
  variant_original_price?: number;
  variant_image?: string;
  quantity: number; // number of "units" in cart (each unit = pieces_per_unit pieces)
  pieces_per_unit: number; // how many physical pieces each "unit" represents (1 for single, 2 for 2-piece tier, etc.)
  created_at: string;
  updated_at: string;
  product?: Product;
};

// Cart type
export type Cart = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CartWithItems = Cart & {
  items: CartItemType[];
};

export type Profile = {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
};
