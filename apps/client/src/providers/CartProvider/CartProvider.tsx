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

import type { Cart } from '@e-pharmacy/types/cart';

import { getCart } from '@/lib/api/browser';
import { useClientAuthCapabilities } from '@/hooks/useClientAuthCapabilities';
import { useClientSessionScope } from '@/providers/AuthProvider';

import {
  CART_UPDATED_EVENT,
  type CartUpdatedEventDetail,
} from '@/lib/cart/cart-events';

//===================================================================

const EMPTY_CART: Cart = { items: [], totalItems: 0, totalPrice: 0 };

//===================================================================

type CartContextValue = {
  cart: Cart;
  isLoaded: boolean;
  isLoading: boolean;
  error: string;
  loadCart: () => Promise<Cart>;
  setCart: (cart: Cart) => void;
  invalidateCart: () => void;
};

type CartSnapshot = Readonly<{
  ownerKey: string;
  cart: Cart;
  isLoaded: boolean;
  error: string;
}>;

type ActiveCartLoad = Readonly<{
  ownerKey: string;
  generation: number;
  controller: AbortController;
  promise: Promise<Cart>;
}>;

//===================================================================

const CartContext = createContext<CartContextValue | null>(null);

//===================================================================

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isBootstrapping, canUseClientFeatures } =
    useClientAuthCapabilities();
  const { ownerKey: sessionOwnerKey } = useClientSessionScope();

  const clientOwnerKey = canUseClientFeatures && user ? sessionOwnerKey : null;

  const [snapshot, setSnapshot] = useState<CartSnapshot | null>(null);
  const [loadingOwnerKey, setLoadingOwnerKey] = useState<string | null>(null);

  const ownerKeyRef = useRef<string | null>(clientOwnerKey);
  const loadGenerationRef = useRef(0);
  const activeLoadRef = useRef<ActiveCartLoad | null>(null);

  const currentSnapshot =
    snapshot?.ownerKey === clientOwnerKey ? snapshot : null;

  const cart = currentSnapshot?.cart ?? EMPTY_CART;
  const isLoaded = clientOwnerKey ? Boolean(currentSnapshot?.isLoaded) : true;
  const isLoading = Boolean(
    clientOwnerKey && loadingOwnerKey === clientOwnerKey
  );
  const error = currentSnapshot?.error ?? '';

  const setCart = useCallback(
    (nextCart: Cart) => {
      const ownerKey = clientOwnerKey;
      if (!ownerKey || ownerKeyRef.current !== ownerKey) return;

      setSnapshot({
        ownerKey,
        cart: nextCart,
        isLoaded: true,
        error: '',
      });
    },
    [clientOwnerKey]
  );

  const loadCart = useCallback(async () => {
    const ownerKey = clientOwnerKey;

    if (!ownerKey) return EMPTY_CART;

    const activeLoad = activeLoadRef.current;
    if (activeLoad?.ownerKey === ownerKey) return activeLoad.promise;

    activeLoad?.controller.abort();

    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;
    const controller = new AbortController();
    setLoadingOwnerKey(ownerKey);

    const promise = getCart({ signal: controller.signal })
      .then((response) => {
        if (
          controller.signal.aborted ||
          ownerKeyRef.current !== ownerKey ||
          loadGenerationRef.current !== generation
        ) {
          return EMPTY_CART;
        }

        setSnapshot({
          ownerKey,
          cart: response.cart,
          isLoaded: true,
          error: '',
        });

        return response.cart;
      })
      .catch((cause: unknown) => {
        if (
          controller.signal.aborted ||
          ownerKeyRef.current !== ownerKey ||
          loadGenerationRef.current !== generation
        ) {
          return EMPTY_CART;
        }

        setSnapshot((current) => ({
          ownerKey,
          cart: current?.ownerKey === ownerKey ? current.cart : EMPTY_CART,
          isLoaded: true,
          error: 'Could not load cart.',
        }));

        throw cause;
      })
      .finally(() => {
        const currentLoad = activeLoadRef.current;

        if (
          currentLoad?.ownerKey === ownerKey &&
          currentLoad.generation === generation
        ) {
          activeLoadRef.current = null;
          setLoadingOwnerKey((current) =>
            current === ownerKey ? null : current
          );
        }
      });

    activeLoadRef.current = {
      ownerKey,
      generation,
      controller,
      promise,
    };

    return promise;
  }, [clientOwnerKey]);

  const invalidateCart = useCallback(() => {
    if (!clientOwnerKey) return;

    setSnapshot((current) => ({
      ownerKey: clientOwnerKey,
      cart: current?.ownerKey === clientOwnerKey ? current.cart : EMPTY_CART,
      isLoaded: false,
      error: '',
    }));
  }, [clientOwnerKey]);

  useEffect(() => {
    if (isBootstrapping || !clientOwnerKey || isLoaded) return;
    if (activeLoadRef.current?.ownerKey === clientOwnerKey) return;

    void loadCart().catch(() => undefined);
  }, [clientOwnerKey, isBootstrapping, isLoaded, loadCart]);

  useEffect(
    () => () => {
      loadGenerationRef.current += 1;
      activeLoadRef.current?.controller.abort();
      activeLoadRef.current = null;
    },
    []
  );

  useEffect(() => {
    const onCartUpdated = (event: Event) => {
      if (!ownerKeyRef.current) return;

      const detail = (event as CustomEvent<CartUpdatedEventDetail>).detail;

      if (detail?.cart) {
        setCart(detail.cart);
        return;
      }

      if (typeof detail?.totalItems === 'number') {
        setSnapshot((current) => {
          const ownerKey = ownerKeyRef.current;

          if (!ownerKey) return current;

          const currentCart =
            current?.ownerKey === ownerKey ? current.cart : EMPTY_CART;

          return {
            ownerKey,
            cart: {
              ...currentCart,
              totalItems: detail.totalItems,
            },
            isLoaded: true,
            error: '',
          };
        });
      }
    };

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
    };
  }, [setCart]);

  const value = useMemo(
    () => ({
      cart,
      isLoaded,
      isLoading,
      error,
      loadCart,
      setCart,
      invalidateCart,
    }),
    [cart, isLoaded, isLoading, error, loadCart, setCart, invalidateCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

//===================================================================

export function useCart() {
  const context = useContext(CartContext);

  if (!context) throw new Error('useCart must be used inside CartProvider.');

  return context;
}
