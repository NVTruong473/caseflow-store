"use client";

import * as React from "react";

import type { CartItem } from "@/types/domain";

type CartState = {
  items: CartItem[];
  hasLoadedStorage: boolean;
};

type CartQuantityOptions = {
  maxQuantity?: number;
};

type CartAction =
  | {
      type: "add";
      productId: string;
      quantity: number;
      maxQuantity?: number;
    }
  | {
      type: "update";
      productId: string;
      quantity: number;
      maxQuantity?: number;
    }
  | { type: "remove"; productId: string }
  | { type: "clear" }
  | { type: "replace"; items: CartItem[] };

type CartContextValue = {
  hasLoadedStorage: boolean;
  items: CartItem[];
  isCartOpen: boolean;
  totalQuantity: number;
  addItem: (
    productId: string,
    quantity: number,
    options?: CartQuantityOptions,
  ) => void;
  closeCart: () => void;
  updateItemQuantity: (
    productId: string,
    quantity: number,
    options?: CartQuantityOptions,
  ) => void;
  openCart: () => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = React.createContext<CartContextValue | null>(null);
export const CART_STORAGE_VERSION = 1;
export const CART_STORAGE_KEY = "caseflow-store.cart.v1";

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(1, Math.trunc(quantity));
}

function normalizeMaxQuantity(maxQuantity: number | undefined) {
  if (maxQuantity === undefined || !Number.isFinite(maxQuantity)) {
    return undefined;
  }

  return Math.max(0, Math.trunc(maxQuantity));
}

function applyMaxQuantity(quantity: number, maxQuantity: number | undefined) {
  const normalizedMaxQuantity = normalizeMaxQuantity(maxQuantity);

  if (normalizedMaxQuantity === undefined) {
    return quantity;
  }

  return Math.min(quantity, normalizedMaxQuantity);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeCartItems(items: unknown) {
  if (!Array.isArray(items)) {
    return [];
  }

  const quantitiesByProductId = new Map<string, number>();

  for (const item of items) {
    if (!isRecord(item)) {
      continue;
    }

    const { productId, quantity } = item;

    if (typeof productId !== "string" || productId.trim().length === 0) {
      continue;
    }

    if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
      continue;
    }

    const normalizedQuantity = Math.trunc(quantity);

    if (normalizedQuantity <= 0) {
      continue;
    }

    quantitiesByProductId.set(
      productId,
      (quantitiesByProductId.get(productId) ?? 0) + normalizedQuantity,
    );
  }

  return Array.from(quantitiesByProductId, ([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

function readStoredCartItems(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!rawCart) {
      return [];
    }

    const parsedCart: unknown = JSON.parse(rawCart);

    if (
      !isRecord(parsedCart) ||
      parsedCart.version !== CART_STORAGE_VERSION ||
      !Array.isArray(parsedCart.items)
    ) {
      return [];
    }

    return normalizeCartItems(parsedCart.items);
  } catch {
    return [];
  }
}

function writeStoredCartItems(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: CART_STORAGE_VERSION,
        items: normalizeCartItems(items),
      }),
    );
  } catch {
    // Cart persistence is best-effort; checkout will still validate context state.
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      const quantity = normalizeQuantity(action.quantity);
      const maxQuantity = normalizeMaxQuantity(action.maxQuantity);
      const existingItem = state.items.find(
        (item) => item.productId === action.productId,
      );

      if (!existingItem) {
        const nextQuantity = applyMaxQuantity(quantity, maxQuantity);

        if (nextQuantity <= 0) {
          return state;
        }

        return {
          ...state,
          items: [
            ...state.items,
            { productId: action.productId, quantity: nextQuantity },
          ],
        };
      }

      const nextQuantity = applyMaxQuantity(
        existingItem.quantity + quantity,
        maxQuantity,
      );

      if (nextQuantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) => item.productId !== action.productId,
          ),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.productId === action.productId
            ? { ...item, quantity: nextQuantity }
            : item,
        ),
      };
    }

    case "update": {
      const maxQuantity = normalizeMaxQuantity(action.maxQuantity);
      const quantity = applyMaxQuantity(
        Math.trunc(action.quantity),
        maxQuantity,
      );

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) => item.productId !== action.productId,
          ),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.productId === action.productId ? { ...item, quantity } : item,
        ),
      };
    }

    case "remove":
      return {
        ...state,
        items: state.items.filter((item) => item.productId !== action.productId),
      };

    case "clear":
      return { ...state, items: [] };

    case "replace":
      return {
        hasLoadedStorage: true,
        items: normalizeCartItems(action.items),
      };

    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(cartReducer, {
    hasLoadedStorage: false,
    items: [],
  });
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const totalQuantity = state.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  React.useEffect(() => {
    dispatch({ type: "replace", items: readStoredCartItems() });
  }, []);

  React.useEffect(() => {
    if (!state.hasLoadedStorage) {
      return;
    }

    writeStoredCartItems(state.items);
  }, [state.hasLoadedStorage, state.items]);

  const value = React.useMemo<CartContextValue>(
    () => ({
      hasLoadedStorage: state.hasLoadedStorage,
      items: state.items,
      isCartOpen,
      totalQuantity,
      addItem: (productId, quantity, options) =>
        dispatch({
          type: "add",
          productId,
          quantity,
          maxQuantity: options?.maxQuantity,
        }),
      closeCart: () => setIsCartOpen(false),
      updateItemQuantity: (productId, quantity, options) =>
        dispatch({
          type: "update",
          productId,
          quantity,
          maxQuantity: options?.maxQuantity,
        }),
      openCart: () => setIsCartOpen(true),
      removeItem: (productId) => dispatch({ type: "remove", productId }),
      clearCart: () => dispatch({ type: "clear" }),
    }),
    [isCartOpen, state.hasLoadedStorage, state.items, totalQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
