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
import { useClientAuthCapabilities } from '@/hooks';

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
  identity: string;
  cart: Cart;
  isLoaded: boolean;
  error: string;
}>;

type ActiveCartLoad = Readonly<{
  identity: string;
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

  const clientIdentity = canUseClientFeatures ? (user?.id ?? null) : null;

  const [snapshot, setSnapshot] = useState<CartSnapshot | null>(null);
  const [loadingIdentity, setLoadingIdentity] = useState<string | null>(null);

  const identityRef = useRef<string | null>(clientIdentity);
  const loadGenerationRef = useRef(0);
  const activeLoadRef = useRef<ActiveCartLoad | null>(null);

  const currentSnapshot =
    snapshot?.identity === clientIdentity ? snapshot : null;

  const cart = currentSnapshot?.cart ?? EMPTY_CART;
  const isLoaded = clientIdentity ? Boolean(currentSnapshot?.isLoaded) : true;
  const isLoading = Boolean(
    clientIdentity && loadingIdentity === clientIdentity
  );
  const error = currentSnapshot?.error ?? '';

  useEffect(() => {
    identityRef.current = clientIdentity;
    loadGenerationRef.current += 1;
    activeLoadRef.current?.controller.abort();
    activeLoadRef.current = null;
  }, [clientIdentity]);

  const setCart = useCallback(
    (nextCart: Cart) => {
      if (!clientIdentity) return;

      setSnapshot({
        identity: clientIdentity,
        cart: nextCart,
        isLoaded: true,
        error: '',
      });
    },
    [clientIdentity]
  );

  const loadCart = useCallback(async () => {
    const identity = clientIdentity;

    if (!identity) return EMPTY_CART;

    const activeLoad = activeLoadRef.current;
    if (activeLoad?.identity === identity) return activeLoad.promise;

    activeLoad?.controller.abort();

    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;
    const controller = new AbortController();
    setLoadingIdentity(identity);

    const promise = getCart({ signal: controller.signal })
      .then((response) => {
        if (
          controller.signal.aborted ||
          identityRef.current !== identity ||
          loadGenerationRef.current !== generation
        ) {
          return EMPTY_CART;
        }

        setSnapshot({
          identity,
          cart: response.cart,
          isLoaded: true,
          error: '',
        });

        return response.cart;
      })
      .catch((cause: unknown) => {
        if (
          controller.signal.aborted ||
          identityRef.current !== identity ||
          loadGenerationRef.current !== generation
        ) {
          return EMPTY_CART;
        }

        setSnapshot((current) => ({
          identity,
          cart: current?.identity === identity ? current.cart : EMPTY_CART,
          isLoaded: true,
          error: 'Could not load cart.',
        }));

        throw cause;
      })
      .finally(() => {
        const currentLoad = activeLoadRef.current;

        if (
          currentLoad?.identity === identity &&
          currentLoad.generation === generation
        ) {
          activeLoadRef.current = null;
          setLoadingIdentity((current) =>
            current === identity ? null : current
          );
        }
      });

    activeLoadRef.current = {
      identity,
      generation,
      controller,
      promise,
    };

    return promise;
  }, [clientIdentity]);

  const invalidateCart = useCallback(() => {
    if (!clientIdentity) return;

    setSnapshot((current) => ({
      identity: clientIdentity,
      cart: current?.identity === clientIdentity ? current.cart : EMPTY_CART,
      isLoaded: false,
      error: '',
    }));
  }, [clientIdentity]);

  useEffect(() => {
    if (isBootstrapping || !clientIdentity || isLoaded) return;
    if (activeLoadRef.current?.identity === clientIdentity) return;

    void loadCart().catch(() => undefined);
  }, [clientIdentity, isBootstrapping, isLoaded, loadCart]);

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
      if (!identityRef.current) return;

      const detail = (event as CustomEvent<CartUpdatedEventDetail>).detail;

      if (detail?.cart) {
        setCart(detail.cart);
        return;
      }

      if (typeof detail?.totalItems === 'number') {
        setSnapshot((current) => {
          const identity = identityRef.current;

          if (!identity) return current;

          const currentCart =
            current?.identity === identity ? current.cart : EMPTY_CART;

          return {
            identity,
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
