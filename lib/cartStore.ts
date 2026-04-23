// lib/cartStore.ts
import { create } from "zustand";
import { supabase, CartItem, Product } from "./supabase";

interface CartStore {
  items: (CartItem & { product: Product })[];
  loading: boolean;
  cartId: string | null;

  // ✅ Callback — layout mein set hoga, addToCart ke baad cart sidebar auto-open karega
  onCartOpen: (() => void) | null;
  setOnCartOpen: (fn: () => void) => void;

  fetchCart: () => Promise<void>;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  loading: false,
  cartId: null,
  onCartOpen: null,

  // Layout se ek baar set hoga
  setOnCartOpen: (fn: () => void) => set({ onCartOpen: fn }),

  fetchCart: async () => {
    set({ loading: true });

    // ✅ getUser() — reliable, getSession() localStorage-only tha
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      set({ items: [], loading: false, cartId: null });
      return;
    }

    // Get or create cart
    let { data: cart } = await supabase
      .from("carts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(); // ✅ maybeSingle — error nahi aata agar row na ho

    if (!cart) {
      const { data: newCart, error: cartErr } = await supabase
        .from("carts")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (cartErr || !newCart) {
        set({ items: [], loading: false });
        return;
      }
      cart = newCart;
    }

    // Get cart items with products joined
    const { data: items } = await supabase
      .from("cart_items")
      .select(
        `
        *,
        product:product_id (*)
      `
      )
      .eq("cart_id", cart.id);

    set({
      items: (items || []) as (CartItem & { product: Product })[],
      loading: false,
      cartId: cart.id,
    });
  },

  addToCart: async (product: Product, quantity: number = 1) => {
    // ✅ getUser() — reliable
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // User logged in nahi — signin page pe bhejo
      window.location.href = "/signin";
      return;
    }

    const { cartId, items } = get();
    let currentCartId = cartId;

    // Cart nahi hai toh create karo
    if (!currentCartId) {
      // Pehle check karo existing cart
      const { data: existingCart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingCart) {
        currentCartId = existingCart.id;
      } else {
        const { data: newCart } = await supabase
          .from("carts")
          .insert({ user_id: user.id })
          .select()
          .single();
        currentCartId = newCart?.id ?? null;
      }

      if (!currentCartId) return;
      set({ cartId: currentCartId });
    }

    // Check if product already in cart
    const existingItem = items.find((item) => item.product_id === product.id);

    if (existingItem) {
      // ✅ Optimistic update — UI foran update hoga
      const newQuantity = existingItem.quantity + quantity;
      set({
        items: items.map((item) =>
          item.id === existingItem.id
            ? { ...item, quantity: newQuantity }
            : item
        ),
      });

      await supabase
        .from("cart_items")
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq("id", existingItem.id);
    } else {
      // ✅ Optimistic update — product ko turant items mein add karo
      const tempItem = {
        id: `temp-${Date.now()}`,
        cart_id: currentCartId,
        product_id: product.id!,
        quantity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product,
      } as CartItem & { product: Product };

      set({ items: [...items, tempItem] });

      await supabase.from("cart_items").insert({
        cart_id: currentCartId,
        product_id: product.id,
        quantity,
      });
    }

    // ✅ Cart sidebar auto-open karo
    const { onCartOpen } = get();
    if (onCartOpen) onCartOpen();

    // Background mein real data sync karo
    await get().fetchCart();
  },

  // Inside cartStore.ts, replace the updateQuantity function:

  updateQuantity: async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      // Auto-delete when quantity becomes 0
      await supabase.from("cart_items").delete().eq("id", itemId);

      await get().fetchCart();
      return;
    }

    await supabase
      .from("cart_items")
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq("id", itemId);

    await get().fetchCart();
  },

  removeFromCart: async (itemId: string) => {
    // Optimistic remove
    set({ items: get().items.filter((item) => item.id !== itemId) });

    await supabase.from("cart_items").delete().eq("id", itemId);

    await get().fetchCart();
  },

  clearCart: async () => {
    const { cartId } = get();
    if (!cartId) return;

    await supabase.from("cart_items").delete().eq("cart_id", cartId);
    set({ items: [] });
  },

  getCartCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  },
}));
