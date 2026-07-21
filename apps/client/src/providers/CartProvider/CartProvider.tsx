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

import type { Cart } from '@e-pharmacy/types';

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

//===================================================================

const CartContext = createContext<CartContextValue | null>(null);

//===================================================================

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthReady, canUseClientFeatures } = useClientAuthCapabilities();

  const [cart, setCartState] = useState<Cart>(EMPTY_CART);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPromiseRef = useRef<Promise<Cart> | null>(null);
  const previousClientAccessRef = useRef<boolean | null>(null);

  const setCart = useCallback((nextCart: Cart) => {
    setCartState(nextCart);
    setIsLoaded(true);
    setError('');
  }, []);

  const loadCart = useCallback(async () => {
    if (!canUseClientFeatures) {
      setCartState(EMPTY_CART);
      setIsLoaded(true);
      setError('');
      return EMPTY_CART;
    }

    if (loadPromiseRef.current) return loadPromiseRef.current;

    setIsLoading(true);

    const promise = getCart()
      .then((response) => {
        setCart(response.cart);
        return response.cart;
      })
      .catch((cause) => {
        setError('Could not load cart.');
        throw cause;
      })
      .finally(() => {
        setIsLoading(false);
        loadPromiseRef.current = null;
      });

    loadPromiseRef.current = promise;

    return promise;
  }, [canUseClientFeatures, setCart]);

  const invalidateCart = useCallback(() => {
    setIsLoaded(false);
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) return;

      const couldUseClientFeatures = previousClientAccessRef.current;
      previousClientAccessRef.current = canUseClientFeatures;

      if (!canUseClientFeatures) {
        loadPromiseRef.current = null;
        setIsLoading(false);
        setCartState(EMPTY_CART);
        setIsLoaded(true);
        setError('');
        return;
      }

      if (couldUseClientFeatures !== true) {
        setIsLoaded(false);
        void loadCart().catch(() => undefined);
        return;
      }

      if (!isLoaded && !isLoading) {
        void loadCart().catch(() => undefined);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [canUseClientFeatures, isAuthReady, isLoaded, isLoading, loadCart]);

  useEffect(() => {
    const onCartUpdated = (event: Event) => {
      if (!canUseClientFeatures) return;

      const detail = (event as CustomEvent<CartUpdatedEventDetail>).detail;

      if (detail?.cart) {
        setCart(detail.cart);
        return;
      }

      if (typeof detail?.totalItems === 'number') {
        setCartState((current) => ({
          ...current,
          totalItems: detail.totalItems,
        }));
      }
    };

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
    };
  }, [canUseClientFeatures, setCart]);

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
