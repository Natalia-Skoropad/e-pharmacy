'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type {
  AddCartItemPayload,
  Cart,
  CartResponse,
  UpdateCartItemPayload,
} from '@e-pharmacy/types/cart';

import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '@/lib/api/browser/cart.api';
import { useClientAuthCapabilities } from '@/hooks/useClientAuthCapabilities';
import { isAbortError } from '@/lib/async/is-abort-error';
import { removeCartItemsSequentially } from '@/lib/cart/cart-pharmacy-removal';

import {
  createCartMutationQueue,
  type CartMutationQueue,
} from '@/lib/cart/cart-mutation-queue';

import {
  beginCartLoad,
  completeCartLoad,
  createInitialCartState,
  failCartLoad,
  getCartStateCart,
  type CartState,
} from '@/lib/cart/cart-state';

import { useClientSessionScope } from '@/providers/AuthProvider';

//===================================================================

const EMPTY_CART: Cart = { items: [], totalItems: 0, totalPrice: 0 };
const CART_LOAD_ERROR_MESSAGE = 'Could not load cart.';

//===================================================================

type OfferMutationOptions = Readonly<{
  offerId?: string;
}>;

export type CartContextValue = Readonly<{
  cart: Cart;
  status: CartState['status'];
  isLoaded: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  loadError: unknown | null;
  error: string;
  pendingItemIds: ReadonlySet<string>;
  pendingOfferIds: ReadonlySet<string>;
  isClearing: boolean;
  loadCart: () => Promise<Cart | null>;
  refreshCart: () => Promise<Cart | null>;
  retryCart: () => Promise<Cart | null>;
  replaceCartFromServer: (cart: Cart) => void;
  addProductToCart: (
    payload: AddCartItemPayload,
    options?: OfferMutationOptions
  ) => Promise<CartResponse | null>;
  updateItemQuantity: (
    cartItemId: string,
    payload: UpdateCartItemPayload,
    options?: OfferMutationOptions
  ) => Promise<CartResponse | null>;
  removeItemFromCart: (
    cartItemId: string,
    options?: OfferMutationOptions
  ) => Promise<CartResponse | null>;
  clearAllCart: () => Promise<CartResponse | null>;
  removePharmacyOrder: (pharmacyId: string) => Promise<Cart | null>;
}>;

type ActiveCartLoad = Readonly<{
  ownerKey: string;
  controller: AbortController;
  promise: Promise<Cart | null>;
}>;

//===================================================================

function getCartWithUpdatedQuantity(
  cart: Cart,
  cartItemId: string,
  quantity: number
): Cart {
  const nextItems = cart.items.map((item) =>
    item.id === cartItemId
      ? {
          ...item,
          quantity,
          totalPrice: item.unitPrice * quantity,
        }
      : item
  );

  return {
    items: nextItems,
    totalItems: nextItems.reduce((total, item) => total + item.quantity, 0),
    totalPrice: nextItems.reduce((total, item) => total + item.totalPrice, 0),
  };
}

//===================================================================

function addSetValue(current: ReadonlySet<string>, value: string): Set<string> {
  const next = new Set(current);
  next.add(value);
  return next;
}

function removeSetValue(
  current: ReadonlySet<string>,
  value: string
): Set<string> {
  const next = new Set(current);
  next.delete(value);
  return next;
}

//===================================================================

const CartContext = createContext<CartContextValue | null>(null);

//===================================================================

export function CartProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { user, isBootstrapping, canUseClientFeatures } =
    useClientAuthCapabilities();
  const { ownerKey: sessionOwnerKey } = useClientSessionScope();

  const clientOwnerKey = canUseClientFeatures && user ? sessionOwnerKey : null;

  const [state, setState] = useState<CartState>(() =>
    createInitialCartState(clientOwnerKey)
  );
  const [pendingItemIds, setPendingItemIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [pendingOfferIds, setPendingOfferIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [isClearing, setIsClearing] = useState(false);

  const stateRef = useRef(state);
  const pendingItemIdsRef = useRef(new Set<string>());
  const pendingOfferIdsRef = useRef(new Set<string>());
  const clearingRef = useRef(false);
  const activeLoadRef = useRef<ActiveCartLoad | null>(null);
  const lifecycleActiveRef = useRef(true);
  const mutationQueue = useMemo<CartMutationQueue>(
    () => createCartMutationQueue(),
    []
  );

  const updateState = useCallback(
    (updater: (current: CartState) => CartState): void => {
      if (!lifecycleActiveRef.current) return;

      setState((current) => {
        const next = updater(current);
        stateRef.current = next;
        return next;
      });
    },
    []
  );

  const replaceCartFromServer = useCallback(
    (nextCart: Cart): void => {
      const ownerKey = clientOwnerKey;
      if (!ownerKey || !lifecycleActiveRef.current) return;

      updateState(() => completeCartLoad(ownerKey, nextCart));
    },
    [clientOwnerKey, updateState]
  );

  const performCartLoad = useCallback(async (): Promise<Cart | null> => {
    const ownerKey = clientOwnerKey;
    if (!ownerKey || !lifecycleActiveRef.current) return null;

    const activeLoad = activeLoadRef.current;
    if (activeLoad?.ownerKey === ownerKey) return activeLoad.promise;

    activeLoad?.controller.abort();

    const controller = new AbortController();
    updateState((current) => beginCartLoad(current, ownerKey));

    const promise = getCart({ signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted || !lifecycleActiveRef.current) {
          return null;
        }

        updateState(() => completeCartLoad(ownerKey, response.cart));
        return response.cart;
      })
      .catch((error: unknown) => {
        if (
          controller.signal.aborted ||
          isAbortError(error) ||
          !lifecycleActiveRef.current
        ) {
          return null;
        }

        updateState((current) => failCartLoad(current, ownerKey, error));
        throw error;
      })
      .finally(() => {
        if (activeLoadRef.current?.controller === controller) {
          activeLoadRef.current = null;
        }
      });

    activeLoadRef.current = { ownerKey, controller, promise };
    return promise;
  }, [clientOwnerKey, updateState]);

  const loadCart = useCallback(async (): Promise<Cart | null> => {
    const confirmedCart = getCartStateCart(stateRef.current);
    return confirmedCart ?? performCartLoad();
  }, [performCartLoad]);

  const markItemPending = useCallback((cartItemId: string): void => {
    pendingItemIdsRef.current.add(cartItemId);
    setPendingItemIds((current) => addSetValue(current, cartItemId));
  }, []);

  const unmarkItemPending = useCallback((cartItemId: string): void => {
    pendingItemIdsRef.current.delete(cartItemId);
    if (!lifecycleActiveRef.current) return;
    setPendingItemIds((current) => removeSetValue(current, cartItemId));
  }, []);

  const markOfferPending = useCallback((offerId?: string): void => {
    if (!offerId) return;
    pendingOfferIdsRef.current.add(offerId);
    setPendingOfferIds((current) => addSetValue(current, offerId));
  }, []);

  const unmarkOfferPending = useCallback((offerId?: string): void => {
    if (!offerId) return;
    pendingOfferIdsRef.current.delete(offerId);
    if (!lifecycleActiveRef.current) return;
    setPendingOfferIds((current) => removeSetValue(current, offerId));
  }, []);

  const addProductToCart = useCallback(
    async (
      payload: AddCartItemPayload,
      options: OfferMutationOptions = {}
    ): Promise<CartResponse | null> => {
      if (!clientOwnerKey || clearingRef.current) return null;
      if (options.offerId && pendingOfferIdsRef.current.has(options.offerId)) {
        return null;
      }

      markOfferPending(options.offerId);

      try {
        return await mutationQueue.enqueue(async (signal) => {
          const response = await addCartItem(payload, { signal });
          if (signal.aborted || !lifecycleActiveRef.current) return response;
          replaceCartFromServer(response.cart);
          return response;
        });
      } finally {
        unmarkOfferPending(options.offerId);
      }
    },
    [
      clientOwnerKey,
      markOfferPending,
      mutationQueue,
      replaceCartFromServer,
      unmarkOfferPending,
    ]
  );

  const updateItemQuantity = useCallback(
    async (
      cartItemId: string,
      payload: UpdateCartItemPayload,
      options: OfferMutationOptions = {}
    ): Promise<CartResponse | null> => {
      if (!clientOwnerKey || clearingRef.current || payload.quantity < 1) {
        return null;
      }
      if (pendingItemIdsRef.current.has(cartItemId)) return null;

      markItemPending(cartItemId);
      markOfferPending(options.offerId);

      try {
        return await mutationQueue.enqueue(async (signal) => {
          const previousCart = getCartStateCart(stateRef.current) ?? EMPTY_CART;

          replaceCartFromServer(
            getCartWithUpdatedQuantity(
              previousCart,
              cartItemId,
              payload.quantity
            )
          );

          try {
            const response = await updateCartItem(cartItemId, payload, {
              signal,
            });

            if (!signal.aborted && lifecycleActiveRef.current) {
              replaceCartFromServer(response.cart);
            }

            return response;
          } catch (error) {
            if (!signal.aborted && lifecycleActiveRef.current) {
              replaceCartFromServer(previousCart);
            }
            throw error;
          }
        });
      } finally {
        unmarkItemPending(cartItemId);
        unmarkOfferPending(options.offerId);
      }
    },
    [
      clientOwnerKey,
      markItemPending,
      markOfferPending,
      mutationQueue,
      replaceCartFromServer,
      unmarkItemPending,
      unmarkOfferPending,
    ]
  );

  const removeItemFromCart = useCallback(
    async (
      cartItemId: string,
      options: OfferMutationOptions = {}
    ): Promise<CartResponse | null> => {
      if (!clientOwnerKey || clearingRef.current) return null;
      if (pendingItemIdsRef.current.has(cartItemId)) return null;

      markItemPending(cartItemId);
      markOfferPending(options.offerId);

      try {
        return await mutationQueue.enqueue(async (signal) => {
          const response = await removeCartItem(cartItemId, { signal });
          if (!signal.aborted && lifecycleActiveRef.current) {
            replaceCartFromServer(response.cart);
          }
          return response;
        });
      } finally {
        unmarkItemPending(cartItemId);
        unmarkOfferPending(options.offerId);
      }
    },
    [
      clientOwnerKey,
      markItemPending,
      markOfferPending,
      mutationQueue,
      replaceCartFromServer,
      unmarkItemPending,
      unmarkOfferPending,
    ]
  );

  const clearAllCart = useCallback(async (): Promise<CartResponse | null> => {
    if (
      !clientOwnerKey ||
      clearingRef.current ||
      pendingItemIdsRef.current.size > 0 ||
      pendingOfferIdsRef.current.size > 0
    ) {
      return null;
    }

    clearingRef.current = true;
    setIsClearing(true);

    try {
      return await mutationQueue.enqueue(async (signal) => {
        const response = await clearCart({ signal });
        if (!signal.aborted && lifecycleActiveRef.current) {
          replaceCartFromServer(response.cart);
        }
        return response;
      });
    } finally {
      clearingRef.current = false;
      if (lifecycleActiveRef.current) setIsClearing(false);
    }
  }, [clientOwnerKey, mutationQueue, replaceCartFromServer]);

  const removePharmacyOrder = useCallback(
    async (pharmacyId: string): Promise<Cart | null> => {
      if (
        !clientOwnerKey ||
        clearingRef.current ||
        pendingItemIdsRef.current.size > 0 ||
        pendingOfferIdsRef.current.size > 0
      ) {
        return null;
      }

      clearingRef.current = true;
      setIsClearing(true);

      try {
        return await mutationQueue.enqueue(async (signal) => {
          const pharmacyItems = (
            getCartStateCart(stateRef.current) ?? EMPTY_CART
          ).items.filter((item) => item.pharmacyId === pharmacyId);

          return removeCartItemsSequentially({
            itemIds: pharmacyItems.map((item) => item.id),
            initialCart: getCartStateCart(stateRef.current) ?? EMPTY_CART,
            signal,
            removeItem: (cartItemId, requestSignal) =>
              removeCartItem(cartItemId, { signal: requestSignal }),
            refreshCart: (requestSignal) => getCart({ signal: requestSignal }),
            onConfirmedCart: (confirmedCart) => {
              if (!signal.aborted && lifecycleActiveRef.current) {
                replaceCartFromServer(confirmedCart);
              }
            },
          });
        });
      } finally {
        clearingRef.current = false;
        if (lifecycleActiveRef.current) setIsClearing(false);
      }
    },
    [clientOwnerKey, mutationQueue, replaceCartFromServer]
  );

  useEffect(() => {
    if (isBootstrapping || !clientOwnerKey || state.status !== 'idle') return;
    void performCartLoad().catch(() => undefined);
  }, [clientOwnerKey, isBootstrapping, performCartLoad, state.status]);

  useEffect(
    () => () => {
      lifecycleActiveRef.current = false;
      activeLoadRef.current?.controller.abort();
      activeLoadRef.current = null;
      mutationQueue.close(
        new DOMException('Cart session ended.', 'AbortError')
      );
      pendingItemIdsRef.current.clear();
      pendingOfferIdsRef.current.clear();
      clearingRef.current = false;
    },
    [mutationQueue]
  );

  const stateCart = getCartStateCart(state);
  const cart = stateCart ?? EMPTY_CART;
  const isLoading = state.status === 'loading';
  const isRefreshing = state.status === 'refreshing';
  const isLoaded =
    state.status === 'success' ||
    state.status === 'refreshing' ||
    state.status === 'error';
  const loadError = state.status === 'error' ? state.error : null;
  const error = loadError ? CART_LOAD_ERROR_MESSAGE : '';

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      status: state.status,
      isLoaded,
      isLoading,
      isRefreshing,
      loadError,
      error,
      pendingItemIds,
      pendingOfferIds,
      isClearing,
      loadCart,
      refreshCart: performCartLoad,
      retryCart: performCartLoad,
      replaceCartFromServer,
      addProductToCart,
      updateItemQuantity,
      removeItemFromCart,
      clearAllCart,
      removePharmacyOrder,
    }),
    [
      addProductToCart,
      cart,
      clearAllCart,
      error,
      isClearing,
      isLoaded,
      isLoading,
      isRefreshing,
      loadError,
      loadCart,
      performCartLoad,
      pendingItemIds,
      pendingOfferIds,
      removeItemFromCart,
      removePharmacyOrder,
      replaceCartFromServer,
      state.status,
      updateItemQuantity,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

//===================================================================

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) throw new Error('useCart must be used inside CartProvider.');

  return context;
}
