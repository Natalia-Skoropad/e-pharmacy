'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  AddCartItemPayload,
  Cart,
  CartResponse,
  UpdateCartItemPayload,
} from '@e-pharmacy/types/cart';

import { useCart } from '@/providers/CartProvider';
import { dispatchCartUpdated } from '@/lib/cart/cart-events';

import {
  addCartItem,
  clearCart,
  removeCartItem,
  updateCartItem,
} from '@/lib/cart/cart-commands';

//===================================================================

type CartMutationOptions = {
  canUseCart: boolean;
};

type OfferMutationOptions = {
  offerId?: string;
};

//===================================================================

function getCartWithUpdatedQuantity(
  cart: Cart,
  cartItemId: string,
  quantity: number
): Cart {
  const nextItems = cart.items.map((item) => {
    if (item.id !== cartItemId) return item;

    return {
      ...item,
      quantity,
      totalPrice: item.unitPrice * quantity,
    };
  });

  return {
    items: nextItems,
    totalItems: nextItems.reduce((total, item) => total + item.quantity, 0),
    totalPrice: nextItems.reduce((total, item) => total + item.totalPrice, 0),
  };
}

//===================================================================

function addToSet(current: Set<string>, id: string): Set<string> {
  const next = new Set(current);
  next.add(id);
  return next;
}

//===================================================================

function removeFromSet(current: Set<string>, id: string): Set<string> {
  const next = new Set(current);
  next.delete(id);
  return next;
}

//===================================================================

export function useCartMutations({ canUseCart }: CartMutationOptions) {
  const { cart, setCart } = useCart();
  const cartRef = useRef(cart);
  const pendingItemIdsRef = useRef(new Set<string>());
  const pendingOfferIdsRef = useRef(new Set<string>());
  const itemRequestVersionRef = useRef(new Map<string, number>());

  const [pendingItemIds, setPendingItemIds] = useState<Set<string>>(
    () => new Set()
  );
  const [pendingOfferIds, setPendingOfferIds] = useState<Set<string>>(
    () => new Set()
  );
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const commitCart = useCallback(
    (nextCart: Cart) => {
      setCart(nextCart);
      dispatchCartUpdated(nextCart);
    },
    [setCart]
  );

  const markItemPending = useCallback((cartItemId: string) => {
    pendingItemIdsRef.current.add(cartItemId);
    setPendingItemIds((current) => addToSet(current, cartItemId));
  }, []);

  const unmarkItemPending = useCallback((cartItemId: string) => {
    pendingItemIdsRef.current.delete(cartItemId);
    setPendingItemIds((current) => removeFromSet(current, cartItemId));
  }, []);

  const markOfferPending = useCallback((offerId?: string) => {
    if (!offerId) return;

    pendingOfferIdsRef.current.add(offerId);
    setPendingOfferIds((current) => addToSet(current, offerId));
  }, []);

  const unmarkOfferPending = useCallback((offerId?: string) => {
    if (!offerId) return;

    pendingOfferIdsRef.current.delete(offerId);
    setPendingOfferIds((current) => removeFromSet(current, offerId));
  }, []);

  const updateItemQuantity = useCallback(
    async (
      cartItemId: string,
      payload: UpdateCartItemPayload,
      options: OfferMutationOptions = {}
    ): Promise<CartResponse | null> => {
      if (!canUseCart || payload.quantity < 1) return null;
      if (pendingItemIdsRef.current.has(cartItemId)) return null;

      const previousCart = cartRef.current;
      const version = (itemRequestVersionRef.current.get(cartItemId) ?? 0) + 1;

      itemRequestVersionRef.current.set(cartItemId, version);

      markItemPending(cartItemId);
      markOfferPending(options.offerId);

      const optimisticCart = getCartWithUpdatedQuantity(
        previousCart,
        cartItemId,
        payload.quantity
      );

      commitCart(optimisticCart);

      try {
        const response = await updateCartItem(cartItemId, payload);

        if (itemRequestVersionRef.current.get(cartItemId) === version) {
          commitCart(response.cart);
        }

        return response;
      } catch (error) {
        if (itemRequestVersionRef.current.get(cartItemId) === version) {
          commitCart(previousCart);
        }

        throw error;
      } finally {
        unmarkItemPending(cartItemId);
        unmarkOfferPending(options.offerId);
      }
    },
    [
      canUseCart,
      commitCart,
      markItemPending,
      markOfferPending,
      unmarkItemPending,
      unmarkOfferPending,
    ]
  );

  const addProductToCart = useCallback(
    async (
      payload: AddCartItemPayload,
      options: OfferMutationOptions = {}
    ): Promise<CartResponse | null> => {
      if (!canUseCart) return null;

      if (options.offerId && pendingOfferIdsRef.current.has(options.offerId)) {
        return null;
      }

      markOfferPending(options.offerId);

      try {
        const response = await addCartItem(payload);
        commitCart(response.cart);
        return response;
      } finally {
        unmarkOfferPending(options.offerId);
      }
    },
    [canUseCart, commitCart, markOfferPending, unmarkOfferPending]
  );

  const removeItemFromCart = useCallback(
    async (
      cartItemId: string,
      options: OfferMutationOptions = {}
    ): Promise<CartResponse | null> => {
      if (!canUseCart) return null;
      if (pendingItemIdsRef.current.has(cartItemId)) return null;

      markItemPending(cartItemId);
      markOfferPending(options.offerId);

      try {
        const response = await removeCartItem(cartItemId);
        commitCart(response.cart);
        return response;
      } finally {
        unmarkItemPending(cartItemId);
        unmarkOfferPending(options.offerId);
      }
    },
    [
      canUseCart,
      commitCart,
      markItemPending,
      markOfferPending,
      unmarkItemPending,
      unmarkOfferPending,
    ]
  );

  const clearAllCart = useCallback(async (): Promise<CartResponse | null> => {
    if (!canUseCart || isClearing) return null;

    setIsClearing(true);

    try {
      const response = await clearCart();
      commitCart(response.cart);
      return response;
    } finally {
      setIsClearing(false);
    }
  }, [canUseCart, commitCart, isClearing]);

  const removePharmacyOrder = useCallback(
    async (pharmacyId: string): Promise<Cart | null> => {
      if (!canUseCart || isClearing) return null;

      setIsClearing(true);

      try {
        const pharmacyItems = cartRef.current.items.filter(
          (item) => item.pharmacyId === pharmacyId
        );

        let nextCart = cartRef.current;

        for (const item of pharmacyItems) {
          const response = await removeCartItem(item.id);
          nextCart = response.cart;
          commitCart(nextCart);
        }

        return nextCart;
      } finally {
        setIsClearing(false);
      }
    },
    [canUseCart, commitCart, isClearing]
  );

  return {
    pendingItemIds,
    pendingOfferIds,
    isClearing,
    addProductToCart,
    updateItemQuantity,
    removeItemFromCart,
    clearAllCart,
    removePharmacyOrder,
  };
}
