// lib/cartStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase, CartItemType, Product, ProductVariant } from "./supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CartItemWithDetails extends CartItemType {
  product?: Product;
  variantStock?: number;
  variantLowStockThreshold?: number | null;
  variantStockStatus?: "in_stock" | "out_of_stock" | "low_stock";
}

interface CartStore {
  items: CartItemWithDetails[];
  loading: boolean;
  initialized: boolean;
  cartId: string | null;
  sessionId: string | null;
  onCartOpen: (() => void) | null;
  setOnCartOpen: (fn: () => void) => void;
  fetchCart: () => Promise<void>;
  addToCart: (
    product: Product,
    variant?: ProductVariant | null,
    quantity?: number,
    piecesPerUnit?: number
  ) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartCount: () => number;
  getSubtotal: () => number;
  getTotalPieces: () => number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("guest_session_id");
  if (!sid) {
    sid = generateSessionId();
    localStorage.setItem("guest_session_id", sid);
  }
  return sid;
}

function deriveStockStatus(
  stock: number,
  threshold?: number | null
): "in_stock" | "out_of_stock" | "low_stock" {
  if (stock === 0) return "out_of_stock";
  if (stock >= 999999) return "in_stock";
  if (threshold && threshold > 0 && stock <= threshold) return "low_stock";
  return "in_stock";
}

// ─── MUTATION GUARD ───────────────────────────────────────────────────────────
let lastMutationAt = 0;
const MUTATION_GUARD_MS = 8000;

function markMutation() {
  lastMutationAt = Date.now();
}

function isMutationRecent() {
  return Date.now() - lastMutationAt < MUTATION_GUARD_MS;
}

// ─── fetchCartItems ───────────────────────────────────────────────────────────

async function fetchCartItems(cartId: string): Promise<CartItemWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from("cart_items")
      .select(
        `
        *,
        product:products!cart_items_product_id_fkey(*)
      `
      )
      .eq("cart_id", cartId);

    if (error) {
      console.error("fetchCartItems error:", error);
      return [];
    }

    const rawItems = (data as any[]) || [];

    const items: CartItemWithDetails[] = rawItems.map((item) => {
      const ppu: number = item.pieces_per_unit ?? 1;
      const base: CartItemWithDetails = { ...item, pieces_per_unit: ppu };
      return base;
    });

    // Enrich with live stock from product_variants
    const variantIds = items
      .filter((i) => i.variant_id)
      .map((i) => i.variant_id as string);

    if (variantIds.length > 0) {
      const { data: variantsData } = await supabase
        .from("product_variants")
        .select("id, stock, low_stock_threshold")
        .in("id", variantIds);

      if (variantsData) {
        const vMap: Record<
          string,
          { stock: number; low_stock_threshold?: number | null }
        > = {};
        variantsData.forEach((v: any) => {
          vMap[v.id] = {
            stock: v.stock,
            low_stock_threshold: v.low_stock_threshold,
          };
        });

        return items.map((item) => {
          if (item.variant_id && vMap[item.variant_id]) {
            const { stock, low_stock_threshold } = vMap[item.variant_id];
            return {
              ...item,
              variantStock: stock,
              variantLowStockThreshold: low_stock_threshold ?? null,
              variantStockStatus: deriveStockStatus(stock, low_stock_threshold),
            };
          }
          const stock = item.product?.stock ?? 0;
          const threshold = (item.product as any)?.low_stock_threshold ?? null;
          return {
            ...item,
            variantStock: stock,
            variantLowStockThreshold: threshold,
            variantStockStatus: deriveStockStatus(stock, threshold),
          };
        });
      }
    }

    return items.map((item) => {
      const stock = item.product?.stock ?? 0;
      const threshold = (item.product as any)?.low_stock_threshold ?? null;
      return {
        ...item,
        variantStock: stock,
        variantLowStockThreshold: threshold,
        variantStockStatus: deriveStockStatus(stock, threshold),
      };
    });
  } catch (err) {
    console.error("fetchCartItems error:", err);
    return [];
  }
}

// ─── getOrCreateCart ──────────────────────────────────────────────────────────

async function getOrCreateCart(): Promise<{
  cartId: string;
  sessionId: string | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sessionId = user ? null : getSessionId();
  let cart: any = null;

  if (user) {
    const { data } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    cart = data;
  } else if (sessionId) {
    const { data } = await supabase
      .from("carts")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();
    cart = data;
  }

  if (!cart) {
    const payload: Record<string, string> = {};
    if (user) payload.user_id = user.id;
    else if (sessionId) payload.session_id = sessionId;

    const { data: newCart, error } = await supabase
      .from("carts")
      .insert(payload)
      .select()
      .single();

    if (error || !newCart) throw new Error("Could not create cart");
    return { cartId: newCart.id, sessionId };
  }

  return { cartId: cart.id, sessionId };
}

// ─── fetchCart lock ───────────────────────────────────────────────────────────
let fetchCartPromise: Promise<void> | null = null;

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      initialized: false,
      cartId: null,
      sessionId: null,
      onCartOpen: null,

      setOnCartOpen: (fn) => set({ onCartOpen: fn }),

      // ── fetchCart ──────────────────────────────────────────────────────────
      fetchCart: async () => {
        if (fetchCartPromise) return fetchCartPromise;

        fetchCartPromise = (async () => {
          if (get().items.length === 0) set({ loading: true });

          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const sessionId = user ? null : getSessionId();
            set({ sessionId });

            let cart: any = null;

            if (user) {
              const { data: userCart } = await supabase
                .from("carts")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();
              cart = userCart;

              const guestSid = localStorage.getItem("guest_session_id");
              if (guestSid) {
                const { data: guestCart } = await supabase
                  .from("carts")
                  .select("*")
                  .eq("session_id", guestSid)
                  .maybeSingle();

                if (guestCart && !cart) {
                  const { data: claimed } = await supabase
                    .from("carts")
                    .update({ user_id: user.id, session_id: null })
                    .eq("id", guestCart.id)
                    .select()
                    .single();
                  cart = claimed;
                  localStorage.removeItem("guest_session_id");
                } else if (guestCart && cart) {
                  const guestItems = await fetchCartItems(guestCart.id);
                  const userItems = await fetchCartItems(cart.id);
                  for (const gi of guestItems) {
                    const existing = userItems.find(
                      (u) =>
                        u.product_id === gi.product_id &&
                        u.variant_id === gi.variant_id &&
                        (u.pieces_per_unit ?? 1) === (gi.pieces_per_unit ?? 1)
                    );
                    if (existing) {
                      await supabase
                        .from("cart_items")
                        .update({ quantity: existing.quantity + gi.quantity })
                        .eq("id", existing.id);
                    } else {
                      await supabase.from("cart_items").insert({
                        cart_id: cart.id,
                        product_id: gi.product_id,
                        variant_id: gi.variant_id,
                        variant_name: gi.variant_name,
                        variant_price: gi.variant_price,
                        variant_original_price: gi.variant_original_price,
                        variant_image: gi.variant_image,
                        quantity: gi.quantity,
                        pieces_per_unit: gi.pieces_per_unit ?? 1,
                      });
                    }
                  }
                  await supabase
                    .from("cart_items")
                    .delete()
                    .eq("cart_id", guestCart.id);
                  await supabase.from("carts").delete().eq("id", guestCart.id);
                  localStorage.removeItem("guest_session_id");
                }
              }
            } else if (sessionId) {
              const { data: guestCart } = await supabase
                .from("carts")
                .select("*")
                .eq("session_id", sessionId)
                .maybeSingle();
              cart = guestCart;
            }

            if (!cart) {
              const payload: Record<string, string> = {};
              if (user) payload.user_id = user.id;
              else if (sessionId) payload.session_id = sessionId;

              const { data: newCart, error: cartErr } = await supabase
                .from("carts")
                .insert(payload)
                .select()
                .single();

              if (cartErr || !newCart) {
                set({ loading: false, initialized: true });
                return;
              }
              cart = newCart;
            }

            const cartId = cart.id;

            if (isMutationRecent()) {
              set({ cartId, loading: false, initialized: true });
              return;
            }

            const freshItems = await fetchCartItems(cartId);
            const currentItems = get().items;

            if (currentItems.length === 0) {
              set({
                cartId,
                items: freshItems,
                loading: false,
                initialized: true,
              });
              return;
            }

            const mergedItems: CartItemWithDetails[] = [];

            for (const currentItem of currentItems) {
              if (currentItem.id.startsWith("temp_")) {
                mergedItems.push(currentItem);
                continue;
              }

              const dbItem = freshItems.find((fi) => fi.id === currentItem.id);
              if (dbItem) {
                mergedItems.push({
                  ...currentItem,
                  variantStock: dbItem.variantStock,
                  variantLowStockThreshold: dbItem.variantLowStockThreshold,
                  variantStockStatus: dbItem.variantStockStatus,
                  updated_at: dbItem.updated_at,
                });
              }
            }

            for (const dbItem of freshItems) {
              const existsInCurrent = currentItems.some(
                (ci) => ci.id === dbItem.id
              );
              if (!existsInCurrent) {
                mergedItems.push(dbItem);
              }
            }

            set({
              cartId,
              items: mergedItems,
              loading: false,
              initialized: true,
            });
          } catch (err) {
            console.error("fetchCart error:", err);
            set({ loading: false, initialized: true });
          } finally {
            fetchCartPromise = null;
          }
        })();

        return fetchCartPromise;
      },

      // ── addToCart ──────────────────────────────────────────────────────────
      addToCart: async (
        product: Product,
        variant: ProductVariant | null = null,
        quantity: number = 1,
        piecesPerUnit: number = 1
      ) => {
        markMutation();

        const { items, cartId: existingCartId, onCartOpen } = get();

        const variantId = variant?.id;
        const variantName = variant ? variant.attribute_value : "Standard";
        const variantPrice = variant?.price ?? product.price ?? 0;
        const variantOriginalPrice =
          variant?.original_price ?? product.original_price;

        const rawStock =
          variant != null ? variant.stock ?? 999999 : product.stock ?? 999999;
        const lowStockThreshold =
          variant != null
            ? variant.low_stock_threshold ?? null
            : (product as any).low_stock_threshold ?? null;

        const stockStatus = deriveStockStatus(rawStock, lowStockThreshold);

        if (stockStatus === "out_of_stock") {
          alert("This product is out of stock");
          return;
        }

        let variantImage = "";
        if (variant?.id) {
          const { data: imgs } = await supabase
            .from("variant_images")
            .select("image_url")
            .eq("variant_id", variant.id)
            .order("display_order", { ascending: true })
            .limit(1);
          if (imgs && imgs.length > 0) variantImage = imgs[0].image_url;
        }
        if (!variantImage && product.images?.length)
          variantImage = product.images[0];

        const existingItem = items.find(
          (i) =>
            i.product_id === product.id &&
            i.variant_id === variantId &&
            (i.pieces_per_unit ?? 1) === piecesPerUnit
        );

        const newQuantity = existingItem
          ? existingItem.quantity + quantity
          : quantity;

        if (stockStatus !== "in_stock" && rawStock > 0) {
          const totalPhysical = newQuantity * piecesPerUnit;
          if (totalPhysical > rawStock) {
            const maxUnits = Math.floor(rawStock / piecesPerUnit);
            alert(
              `Only ${rawStock} items in stock. Max ${maxUnits} unit(s) of ${piecesPerUnit}-piece size.`
            );
            return;
          }
        }

        // Optimistic update
        if (existingItem) {
          set({
            items: get().items.map((i) =>
              i.id === existingItem.id ? { ...i, quantity: newQuantity } : i
            ),
          });
        } else {
          const tempId = `temp_${Date.now()}_${Math.random()}`;
          const tempItem: CartItemWithDetails = {
            id: tempId,
            cart_id: existingCartId || "",
            product_id: product.id!,
            variant_id: variantId,
            variant_name: variantName,
            variant_price: variantPrice,
            variant_original_price: variantOriginalPrice,
            variant_image: variantImage,
            quantity,
            pieces_per_unit: piecesPerUnit,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            variantStock: rawStock,
            variantLowStockThreshold: lowStockThreshold,
            variantStockStatus: stockStatus,
            product: {
              ...product,
              price: variantPrice,
              original_price: variantOriginalPrice,
              stock: rawStock,
            },
          };
          set({ items: [...get().items, tempItem] });
        }

        if (onCartOpen) onCartOpen();

        // Sync to DB
        try {
          const { cartId } = await getOrCreateCart();
          if (!get().cartId) set({ cartId });

          if (existingItem) {
            const { error } = await supabase
              .from("cart_items")
              .update({ quantity: newQuantity })
              .eq("id", existingItem.id);

            if (error) {
              console.error("addToCart update error:", error);
              set({
                items: get().items.map((i) =>
                  i.id === existingItem.id
                    ? { ...i, quantity: existingItem.quantity }
                    : i
                ),
              });
            }
          } else {
            // FIX: Use explicit column names without select(*) to avoid relationship issues
            const { data: inserted, error } = await supabase
              .from("cart_items")
              .insert({
                cart_id: cartId,
                product_id: product.id,
                variant_id: variantId,
                variant_name: variantName,
                variant_price: variantPrice,
                variant_original_price: variantOriginalPrice,
                variant_image: variantImage,
                quantity,
                pieces_per_unit: piecesPerUnit,
              })
              .select(
                "id, cart_id, product_id, variant_id, variant_name, variant_price, variant_original_price, variant_image, quantity, pieces_per_unit, created_at, updated_at"
              )
              .single();

            if (error || !inserted) {
              console.error("addToCart insert error:", error);
              set({
                items: get().items.filter(
                  (i) =>
                    !(
                      i.id.startsWith("temp_") &&
                      i.product_id === product.id &&
                      i.variant_id === variantId &&
                      (i.pieces_per_unit ?? 1) === piecesPerUnit
                    )
                ),
              });
              return;
            }

            // Fetch product separately for the inserted item
            const { data: productData } = await supabase
              .from("products")
              .select("*")
              .eq("id", product.id)
              .single();

            const ins = inserted as any;
            set({
              items: get().items.map((i) =>
                i.id.startsWith("temp_") &&
                i.product_id === product.id &&
                i.variant_id === variantId &&
                (i.pieces_per_unit ?? 1) === piecesPerUnit
                  ? {
                      ...ins,
                      pieces_per_unit: ins.pieces_per_unit ?? piecesPerUnit,
                      variantStock: rawStock,
                      variantLowStockThreshold: lowStockThreshold,
                      variantStockStatus: stockStatus,
                      product: productData ?? {
                        ...product,
                        price: variantPrice,
                        original_price: variantOriginalPrice,
                        stock: rawStock,
                      },
                    }
                  : i
              ),
              cartId,
            });
          }
        } catch (err) {
          console.error("addToCart sync error:", err);
        }
      },

      // ── updateQuantity ─────────────────────────────────────────────────────
      updateQuantity: async (itemId: string, quantity: number) => {
        markMutation();

        if (quantity <= 0) {
          await get().removeFromCart(itemId);
          return;
        }

        const { items } = get();
        const item = items.find((i) => i.id === itemId);
        if (!item) return;

        const rawStock = item.variantStock ?? 999999;
        const stockStatus = item.variantStockStatus ?? "in_stock";
        const ppu = item.pieces_per_unit ?? 1;

        if (stockStatus === "out_of_stock") {
          alert("This item is out of stock");
          await get().removeFromCart(itemId);
          return;
        }

        if (stockStatus !== "in_stock" && rawStock > 0) {
          const totalPhysical = quantity * ppu;
          if (totalPhysical > rawStock) {
            const maxUnits = Math.floor(rawStock / ppu);
            alert(
              `Only ${rawStock} items in stock. Max ${maxUnits} unit(s) allowed.`
            );
            if (maxUnits <= 0) {
              await get().removeFromCart(itemId);
              return;
            }
            quantity = maxUnits;
          }
        }

        set({
          items: items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
        });

        const { error } = await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("id", itemId);

        if (error) {
          console.error("updateQuantity error:", error);
          set({
            items: get().items.map((i) =>
              i.id === itemId ? { ...i, quantity: item.quantity } : i
            ),
          });
        }
      },

      // ── removeFromCart ─────────────────────────────────────────────────────
      removeFromCart: async (itemId: string) => {
        markMutation();

        const { items } = get();
        set({ items: items.filter((i) => i.id !== itemId) });

        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", itemId);

        if (error) {
          console.error("removeFromCart error:", error);
          set({ items });
        }
      },

      // ── clearCart ──────────────────────────────────────────────────────────
      clearCart: async () => {
        markMutation();
        const { cartId } = get();
        if (!cartId) return;
        set({ items: [] });
        await supabase.from("cart_items").delete().eq("cart_id", cartId);
      },

      // ── getCartCount ───────────────────────────────────────────────────────
      getCartCount: () => get().items.reduce((t, i) => t + i.quantity, 0),

      // ── getSubtotal ────────────────────────────────────────────────────────
      getSubtotal: () =>
        get().items.reduce((t, i) => {
          const price = i.variant_price ?? i.product?.price ?? 0;
          const ppu = i.pieces_per_unit ?? 1;
          return t + price * ppu * i.quantity;
        }, 0),

      // ── getTotalPieces ─────────────────────────────────────────────────────
      getTotalPieces: () =>
        get().items.reduce(
          (t, i) => t + (i.pieces_per_unit ?? 1) * i.quantity,
          0
        ),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items
          .filter((item) => !item.id.startsWith("temp_"))
          .map((item) => ({
            id: item.id,
            cart_id: item.cart_id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            variant_name: item.variant_name,
            variant_price: item.variant_price,
            variant_original_price: item.variant_original_price,
            variant_image: item.variant_image,
            quantity: item.quantity,
            pieces_per_unit: item.pieces_per_unit ?? 1,
            created_at: item.created_at,
            updated_at: item.updated_at,
            variantStock: item.variantStock,
            variantLowStockThreshold: item.variantLowStockThreshold,
            variantStockStatus: item.variantStockStatus,
            product: item.product
              ? {
                  id: item.product.id,
                  name: item.product.name,
                  description: item.product.description,
                  category: item.product.category,
                  subcategory: item.product.subcategory,
                  images: item.product.images,
                  brand: item.product.brand,
                  condition: item.product.condition,
                  is_featured: item.product.is_featured,
                  is_active: item.product.is_active,
                  price: item.variant_price ?? item.product.price,
                  original_price:
                    item.variant_original_price ?? item.product.original_price,
                  stock: item.variantStock ?? item.product.stock,
                  created_at: item.product.created_at,
                  updated_at: item.product.updated_at,
                }
              : undefined,
          })),
        cartId: state.cartId,
      }),
    }
  )
);
