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

// ─── fetchCartItems ───────────────────────────────────────────────────────────

async function fetchCartItems(cartId: string): Promise<CartItemWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from("cart_items")
      .select(
        `
        id,
        cart_id,
        product_id,
        variant_id,
        variant_name,
        variant_price,
        variant_original_price,
        variant_image,
        quantity,
        pieces_per_unit,
        created_at,
        updated_at
      `
      )
      .eq("cart_id", cartId);

    if (error) {
      console.error("fetchCartItems error:", error);
      return [];
    }

    const rawItems = (data as any[]) || [];
    if (rawItems.length === 0) return [];

    const productIds = [...new Set(rawItems.map((item) => item.product_id))];

    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    const productMap: Record<string, Product> = {};
    if (productsData) {
      productsData.forEach((p: any) => {
        productMap[p.id] = p;
      });
    }

    const variantIds = rawItems
      .filter((i) => i.variant_id)
      .map((i) => i.variant_id as string);

    let variantStockMap: Record<
      string,
      { stock: number; low_stock_threshold: number | null }
    > = {};

    if (variantIds.length > 0) {
      const { data: variantsData } = await supabase
        .from("product_variants")
        .select("id, stock, low_stock_threshold")
        .in("id", variantIds);

      if (variantsData) {
        variantsData.forEach((v: any) => {
          variantStockMap[v.id] = {
            stock: v.stock,
            low_stock_threshold: v.low_stock_threshold,
          };
        });
      }
    }

    const items: CartItemWithDetails[] = rawItems.map((item) => {
      const product = productMap[item.product_id];
      const variantInfo = item.variant_id
        ? variantStockMap[item.variant_id]
        : null;

      const stock = variantInfo?.stock ?? product?.stock ?? 0;
      const threshold =
        variantInfo?.low_stock_threshold ??
        (product as any)?.low_stock_threshold ??
        null;
      const stockStatus = deriveStockStatus(stock, threshold);

      return {
        ...item,
        pieces_per_unit: item.pieces_per_unit ?? 1,
        product: product,
        variantStock: stock,
        variantLowStockThreshold: threshold,
        variantStockStatus: stockStatus,
      };
    });

    return items;
  } catch (err) {
    console.error("fetchCartItems exception:", err);
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

// ─── addToCart lock — prevents double-click duplicate inserts ─────────────────
let addToCartInProgress = false;

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
          if (get().items.length === 0) {
            set({ loading: true });
          }

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

              // Guest cart merge — login ke baad guest items user cart mein
              const guestSid = localStorage.getItem("guest_session_id");
              if (guestSid) {
                const { data: guestCart } = await supabase
                  .from("carts")
                  .select("*")
                  .eq("session_id", guestSid)
                  .maybeSingle();

                if (guestCart && !cart) {
                  // User ka koi cart nahi — guest cart claim kar lo
                  const { data: claimed } = await supabase
                    .from("carts")
                    .update({ user_id: user.id, session_id: null })
                    .eq("id", guestCart.id)
                    .select()
                    .single();
                  cart = claimed;
                  localStorage.removeItem("guest_session_id");
                } else if (guestCart && cart) {
                  // Dono hain — merge karo
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
            const freshItems = await fetchCartItems(cartId);

            // Out of stock items silently hatao
            const validItems = freshItems.filter((item) => {
              const stockStatus = item.variantStockStatus ?? "in_stock";
              if (stockStatus === "out_of_stock") {
                supabase.from("cart_items").delete().eq("id", item.id);
                return false;
              }
              return true;
            });

            // localStorage + DB items merge — duplicates avoid karo
            const currentItems = get().items.filter(
              (i) => !i.id.startsWith("temp_")
            );
            const mergedMap = new Map<string, CartItemWithDetails>();

            // DB items pehle (authoritative)
            for (const dbItem of validItems) {
              mergedMap.set(dbItem.id, dbItem);
            }

            // localStorage items sirf woh jo DB mein nahi hain
            for (const localItem of currentItems) {
              if (!mergedMap.has(localItem.id)) {
                mergedMap.set(localItem.id, localItem);
              }
            }

            set({
              cartId,
              items: Array.from(mergedMap.values()),
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
      // ✅ Prices are always stored in PKR (base currency)
      // Currency conversion happens only at DISPLAY time in CartSidebar/formatPrice
      // Never store converted prices — always store raw PKR from database
      addToCart: async (
        product: Product,
        variant: ProductVariant | null = null,
        quantity: number = 1,
        piecesPerUnit: number = 1
      ) => {
        // ✅ FIX: Lock released in finally — no matter what path exits
        if (addToCartInProgress) return;
        addToCartInProgress = true;

        try {
          if (!product.id) {
            console.error("addToCart: product.id is missing");
            return;
          }

          const { items, onCartOpen } = get();

          const variantId = variant?.id ?? undefined;
          const variantName = variant ? variant.attribute_value : "Standard";

          // ✅ PKR prices — always raw from database, NEVER converted
          const variantPrice = variant?.price ?? product.price ?? 0;
          const variantOriginalPrice =
            variant?.original_price ?? product.original_price ?? undefined;

          const rawStock =
            variant != null
              ? variant.stock ?? 999999
              : (product as any).stock ?? 999999;
          const lowStockThreshold =
            variant != null
              ? variant.low_stock_threshold ?? null
              : (product as any).low_stock_threshold ?? null;

          const stockStatus = deriveStockStatus(rawStock, lowStockThreshold);

          if (stockStatus === "out_of_stock") {
            alert("This product is out of stock");
            return; // finally will still run — lock released ✅
          }

          // ✅ Variant image — product.images[0] use karo (already passed from card)
          const variantImage =
            product.images && product.images.length > 0
              ? product.images[0]
              : "";

          // Same product+variant+ppu ki existing item check karo
          const existingItem = items.find(
            (i) =>
              i.product_id === product.id &&
              i.variant_id === variantId &&
              (i.pieces_per_unit ?? 1) === piecesPerUnit
          );

          const newQuantity = existingItem
            ? existingItem.quantity + quantity
            : quantity;

          // Stock limit check
          if (stockStatus !== "in_stock" && rawStock > 0) {
            const totalPhysical = newQuantity * piecesPerUnit;
            if (totalPhysical > rawStock) {
              const maxUnits = Math.floor(rawStock / piecesPerUnit);
              alert(
                `Only ${rawStock} items in stock. Max ${maxUnits} unit(s) of ${piecesPerUnit}-piece size.`
              );
              return; // finally will still run ✅
            }
          }

          // ✅ OPTIMISTIC UPDATE — UI instantly update hogi
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
              cart_id: get().cartId || "",
              product_id: product.id,
              variant_id: variantId,
              variant_name: variantName,
              variant_price: variantPrice, // ✅ PKR — raw DB value
              variant_original_price: variantOriginalPrice, // ✅ PKR — raw DB value
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
                price: variantPrice, // ✅ PKR
                original_price: variantOriginalPrice, // ✅ PKR
                stock: rawStock,
              },
            };
            set({ items: [...get().items, tempItem] });
          }

          // ✅ Cart sidebar immediately kholo
          if (onCartOpen) onCartOpen();

          // ✅ Background DB sync
          try {
            let cartId = get().cartId;
            if (!cartId) {
              const result = await getOrCreateCart();
              cartId = result.cartId;
              set({ cartId });
            }

            if (existingItem) {
              // ✅ Existing item quantity update
              const { error } = await supabase
                .from("cart_items")
                .update({
                  quantity: newQuantity,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingItem.id);

              if (error) {
                console.error("addToCart update error:", error);
                // Rollback
                set({
                  items: get().items.map((i) =>
                    i.id === existingItem.id
                      ? { ...i, quantity: existingItem.quantity }
                      : i
                  ),
                });
              }
            } else {
              // ✅ Naya item insert — prices always PKR
              const { data: inserted, error } = await supabase
                .from("cart_items")
                .insert({
                  cart_id: cartId,
                  product_id: product.id,
                  variant_id: variantId ?? null,
                  variant_name: variantName,
                  variant_price: variantPrice, // ✅ PKR stored in DB
                  variant_original_price: variantOriginalPrice ?? null, // ✅ PKR
                  variant_image: variantImage,
                  quantity,
                  pieces_per_unit: piecesPerUnit,
                })
                .select()
                .single();

              if (error || !inserted) {
                console.error("addToCart insert error:", error);
                // Temp item rollback
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

              // ✅ Temp item → real DB item replace
              set({
                items: get().items.map((i) =>
                  i.id.startsWith("temp_") &&
                  i.product_id === product.id &&
                  i.variant_id === variantId &&
                  (i.pieces_per_unit ?? 1) === piecesPerUnit
                    ? {
                        ...inserted,
                        pieces_per_unit:
                          inserted.pieces_per_unit ?? piecesPerUnit,
                        variantStock: rawStock,
                        variantLowStockThreshold: lowStockThreshold,
                        variantStockStatus: stockStatus,
                        product: {
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
          } catch (dbErr) {
            console.error("addToCart DB sync error:", dbErr);
          }
        } finally {
          // ✅ FIXED: Lock ALWAYS released — even on early return (out_of_stock, stock limit, etc.)
          setTimeout(() => {
            addToCartInProgress = false;
          }, 500);
        }
      },

      // ── updateQuantity ─────────────────────────────────────────────────────
      updateQuantity: async (itemId: string, quantity: number) => {
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

        // Optimistic update
        set({
          items: items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
        });

        if (!itemId.startsWith("temp_")) {
          const { error } = await supabase
            .from("cart_items")
            .update({ quantity, updated_at: new Date().toISOString() })
            .eq("id", itemId);

          if (error) {
            console.error("updateQuantity error:", error);
            // Rollback
            set({
              items: get().items.map((i) =>
                i.id === itemId ? { ...i, quantity: item.quantity } : i
              ),
            });
          }
        }
      },

      // ── removeFromCart ─────────────────────────────────────────────────────
      removeFromCart: async (itemId: string) => {
        const { items } = get();

        // Optimistic remove
        set({ items: items.filter((i) => i.id !== itemId) });

        if (!itemId.startsWith("temp_")) {
          const { error } = await supabase
            .from("cart_items")
            .delete()
            .eq("id", itemId);

          if (error) {
            console.error("removeFromCart error:", error);
            // Rollback
            set({ items });
          }
        }
      },

      // ── clearCart ──────────────────────────────────────────────────────────
      clearCart: async () => {
        const { cartId } = get();
        set({ items: [] });
        if (cartId) {
          await supabase.from("cart_items").delete().eq("cart_id", cartId);
        }
      },

      // ── getCartCount ───────────────────────────────────────────────────────
      getCartCount: () => get().items.reduce((t, i) => t + i.quantity, 0),

      // ── getSubtotal ────────────────────────────────────────────────────────
      // ✅ Always returns PKR — display layer (CartSidebar) converts to selected currency
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
        items: state.items.map((item) => ({
          id: item.id,
          cart_id: item.cart_id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          variant_name: item.variant_name,
          variant_price: item.variant_price, // ✅ PKR stored
          variant_original_price: item.variant_original_price, // ✅ PKR stored
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
                price: item.variant_price ?? item.product.price, // ✅ PKR
                original_price:
                  item.variant_original_price ?? item.product.original_price, // ✅ PKR
                stock: item.variantStock ?? item.product.stock,
                created_at: item.product.created_at,
                updated_at: item.product.updated_at,
              }
            : undefined,
        })),
        cartId: state.cartId,
        sessionId: state.sessionId,
        initialized: state.initialized,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.items?.length) {
          console.log(
            "✅ Cart rehydrated:",
            state.items.length,
            "items from localStorage"
          );
        }
      },
    }
  )
);
