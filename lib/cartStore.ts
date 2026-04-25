import { create } from "zustand";
import { supabase, CartItem, Product } from "./supabase";

interface CartItemWithProduct extends CartItem {
  product: Product;
}

interface CartStore {
  items: CartItemWithProduct[];
  loading: boolean;
  cartId: string | null;
  sessionId: string | null;
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

// Generate unique session ID for guest users
function generateSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function getSessionId(): string {
  let sessionId = localStorage.getItem("guest_session_id");
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem("guest_session_id", sessionId);
  }
  return sessionId;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  loading: false,
  cartId: null,
  sessionId: null,
  onCartOpen: null,

  setOnCartOpen: (fn: () => void) => set({ onCartOpen: fn }),

  fetchCart: async () => {
    set({ loading: true });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const sessionId = !user ? getSessionId() : null;

    set({ sessionId });

    let cart = null;

    if (user) {
      // Logged in user - get cart by user_id
      const { data: userCart } = await supabase
        .from("carts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      cart = userCart;

      // If user has a guest cart with session_id, merge it
      const guestSessionId = localStorage.getItem("guest_session_id");
      if (guestSessionId && !cart) {
        const { data: guestCart } = await supabase
          .from("carts")
          .select("*")
          .eq("session_id", guestSessionId)
          .maybeSingle();

        if (guestCart) {
          // Transfer guest cart to user cart
          const { data: updatedCart } = await supabase
            .from("carts")
            .update({ user_id: user.id, session_id: null })
            .eq("id", guestCart.id)
            .select()
            .single();
          cart = updatedCart;

          // Clear guest session
          localStorage.removeItem("guest_session_id");
        }
      }
    } else {
      // Guest user - get or create cart by session_id
      const currentSessionId = sessionId;
      const { data: guestCart } = await supabase
        .from("carts")
        .select("*")
        .eq("session_id", currentSessionId)
        .maybeSingle();

      cart = guestCart;
    }

    // Create cart if doesn't exist
    if (!cart) {
      const newCartData: any = {};
      if (user) {
        newCartData.user_id = user.id;
      } else {
        newCartData.session_id = sessionId;
      }

      const { data: newCart, error: cartErr } = await supabase
        .from("carts")
        .insert(newCartData)
        .select()
        .single();

      if (cartErr || !newCart) {
        console.error("Error creating cart:", cartErr);
        set({ items: [], loading: false });
        return;
      }
      cart = newCart;
    }

    set({ cartId: cart.id });

    // Get cart items with products
    const { data: items, error: itemsError } = await supabase
      .from("cart_items")
      .select(
        `
        *,
        product:product_id (*)
      `
      )
      .eq("cart_id", cart.id);

    if (itemsError) {
      console.error("Error fetching cart items:", itemsError);
      set({ items: [], loading: false });
      return;
    }

    set({ items: items as CartItemWithProduct[], loading: false });
  },

  addToCart: async (product: Product, quantity: number = 1) => {
    const { items, cartId, onCartOpen } = get();
    let currentCartId = cartId;

    // Get or create cart ID
    if (!currentCartId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const sessionId = !user ? getSessionId() : null;

      let cart = null;

      if (user) {
        const { data: userCart } = await supabase
          .from("carts")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        cart = userCart;
      } else if (sessionId) {
        const { data: guestCart } = await supabase
          .from("carts")
          .select("id")
          .eq("session_id", sessionId)
          .maybeSingle();
        cart = guestCart;
      }

      if (!cart) {
        const newCartData: any = {};
        if (user) {
          newCartData.user_id = user.id;
        } else {
          newCartData.session_id = sessionId;
        }

        const { data: newCart, error: cartError } = await supabase
          .from("carts")
          .insert(newCartData)
          .select()
          .single();

        if (cartError || !newCart) {
          console.error("Error creating cart:", cartError);
          return;
        }
        currentCartId = newCart.id;
        set({ cartId: currentCartId });
      } else {
        currentCartId = cart.id;
        set({ cartId: currentCartId });
      }
    }

    // Check if product already in cart
    const existingItem = items.find((item) => item.product_id === product.id);

    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + quantity;

      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq("id", existingItem.id);

      if (updateError) {
        console.error("Error updating cart item:", updateError);
      }
    } else {
      // Add new item
      const { error: insertError } = await supabase.from("cart_items").insert({
        cart_id: currentCartId,
        product_id: product.id,
        quantity: quantity,
      });

      if (insertError) {
        console.error("Error inserting cart item:", insertError);
        return;
      }
    }

    // Refresh cart to get latest data
    await get().fetchCart();

    // Auto-open cart sidebar
    if (onCartOpen) {
      onCartOpen();
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await get().removeFromCart(itemId);
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq("id", itemId);

    if (error) {
      console.error("Error updating quantity:", error);
    }

    await get().fetchCart();
  },

  removeFromCart: async (itemId: string) => {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      console.error("Error removing item:", error);
    }

    await get().fetchCart();
  },

  clearCart: async () => {
    const { cartId } = get();
    if (!cartId) return;

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId);

    if (error) {
      console.error("Error clearing cart:", error);
    }

    set({ items: [] });
  },

  getCartCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce(
      (total, item) => total + (item.product?.price || 0) * item.quantity,
      0
    );
  },
}));
