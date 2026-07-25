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
  const mountedRef = useRef(true);
  const pendingItemIdsRef = useRef(new Set<string>());
  const pendingOfferIdsRef = useRef(new Set<string>());
  const mutationVersionRef = useRef(0);
  const clearingLockRef = useRef(false);

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

  useEffect(() => {
    mountedRef.current = true;
    const pendingItemIdsAtMount = pendingItemIdsRef.current;
    const pendingOfferIdsAtMount = pendingOfferIdsRef.current;

    return () => {
      mountedRef.current = false;
      mutationVersionRef.current += 1;
      clearingLockRef.current = false;
      pendingItemIdsAtMount.clear();
      pendingOfferIdsAtMount.clear();
    };
  }, []);

  const beginMutation = useCallback(() => {
    mutationVersionRef.current += 1;
    return mutationVersionRef.current;
  }, []);

  const isCurrentMutation = useCallback(
    (version: number) =>
      mountedRef.current && mutationVersionRef.current === version,
    []
  );

  const commitCart = useCallback(
    (nextCart: Cart) => {
      cartRef.current = nextCart;
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
    if (mountedRef.current) {
      setPendingItemIds((current) => removeFromSet(current, cartItemId));
    }
  }, []);

  const markOfferPending = useCallback((offerId?: string) => {
    if (!offerId) return;

    pendingOfferIdsRef.current.add(offerId);
    setPendingOfferIds((current) => addToSet(current, offerId));
  }, []);

  const unmarkOfferPending = useCallback((offerId?: string) => {
    if (!offerId) return;

    pendingOfferIdsRef.current.delete(offerId);
    if (mountedRef.current) {
      setPendingOfferIds((current) => removeFromSet(current, offerId));
    }
  }, []);

  const updateItemQuantity = useCallback(
    async (
      cartItemId: string,
      payload: UpdateCartItemPayload,
      options: OfferMutationOptions = {}
    ): Promise<CartResponse | null> => {
      if (!canUseCart || clearingLockRef.current || payload.quantity < 1) {
        return null;
      }
      if (pendingItemIdsRef.current.has(cartItemId)) return null;

      const previousCart = cartRef.current;
      const version = beginMutation();

      markItemPending(cartItemId);
      markOfferPending(options.offerId);

      commitCart(
        getCartWithUpdatedQuantity(previousCart, cartItemId, payload.quantity)
      );

      try {
        const response = await updateCartItem(cartItemId, payload);

        if (isCurrentMutation(version)) commitCart(response.cart);
        return response;
      } catch (error) {
        if (isCurrentMutation(version)) commitCart(previousCart);
        throw error;
      } finally {
        unmarkItemPending(cartItemId);
        unmarkOfferPending(options.offerId);
      }
    },
    [
      beginMutation,
      canUseCart,
      commitCart,
      isCurrentMutation,
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
      if (!canUseCart || clearingLockRef.current) return null;

      if (options.offerId && pendingOfferIdsRef.current.has(options.offerId)) {
        return null;
      }

      const version = beginMutation();
      markOfferPending(options.offerId);

      try {
        const response = await addCartItem(payload);
        if (isCurrentMutation(version)) commitCart(response.cart);
        return response;
      } finally {
        unmarkOfferPending(options.offerId);
      }
    },
    [
      beginMutation,
      canUseCart,
      commitCart,
      isCurrentMutation,
      markOfferPending,
      unmarkOfferPending,
    ]
  );

  const removeItemFromCart = useCallback(
    async (
      cartItemId: string,
      options: OfferMutationOptions = {}
    ): Promise<CartResponse | null> => {
      if (!canUseCart || clearingLockRef.current) return null;
      if (pendingItemIdsRef.current.has(cartItemId)) return null;

      const version = beginMutation();
      markItemPending(cartItemId);
      markOfferPending(options.offerId);

      try {
        const response = await removeCartItem(cartItemId);
        if (isCurrentMutation(version)) commitCart(response.cart);
        return response;
      } finally {
        unmarkItemPending(cartItemId);
        unmarkOfferPending(options.offerId);
      }
    },
    [
      beginMutation,
      canUseCart,
      commitCart,
      isCurrentMutation,
      markItemPending,
      markOfferPending,
      unmarkItemPending,
      unmarkOfferPending,
    ]
  );

  const clearAllCart = useCallback(async (): Promise<CartResponse | null> => {
    if (
      !canUseCart ||
      clearingLockRef.current ||
      pendingItemIdsRef.current.size > 0 ||
      pendingOfferIdsRef.current.size > 0
    ) {
      return null;
    }

    clearingLockRef.current = true;
    setIsClearing(true);
    const version = beginMutation();

    try {
      const response = await clearCart();
      if (isCurrentMutation(version)) commitCart(response.cart);
      return response;
    } finally {
      clearingLockRef.current = false;
      if (mountedRef.current) setIsClearing(false);
    }
  }, [beginMutation, canUseCart, commitCart, isCurrentMutation]);

  const removePharmacyOrder = useCallback(
    async (pharmacyId: string): Promise<Cart | null> => {
      if (
        !canUseCart ||
        clearingLockRef.current ||
        pendingItemIdsRef.current.size > 0 ||
        pendingOfferIdsRef.current.size > 0
      ) {
        return null;
      }

      clearingLockRef.current = true;
      setIsClearing(true);
      const version = beginMutation();

      try {
        const pharmacyItems = cartRef.current.items.filter(
          (item) => item.pharmacyId === pharmacyId
        );

        let nextCart = cartRef.current;

        for (const item of pharmacyItems) {
          const response = await removeCartItem(item.id);
          nextCart = response.cart;

          if (isCurrentMutation(version)) commitCart(nextCart);
        }

        return nextCart;
      } finally {
        clearingLockRef.current = false;
        if (mountedRef.current) setIsClearing(false);
      }
    },
    [beginMutation, canUseCart, commitCart, isCurrentMutation]
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
