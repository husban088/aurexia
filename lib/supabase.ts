// lib/supabase.ts
// ✅ IMPORTANT: Use createBrowserClient from @supabase/ssr
// Plain createClient from @supabase/supabase-js stores session in localStorage
// createBrowserClient stores session in COOKIES — middleware can read it
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Product = {
  id?: string;
  created_at?: string;
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
};

export type Profile = {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type Cart = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
};

export type CartWithItems = Cart & {
  items: (CartItem & { product: Product })[];
};
