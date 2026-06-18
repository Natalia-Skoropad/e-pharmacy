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

import { useAuth } from '@e-pharmacy/auth/core';
import { getCart } from '@/lib/api/browser';

import {
  CART_UPDATED_EVENT,
  type CartUpdatedEventDetail,
} from '@/lib/cart/cart-events';

import type { Cart } from '@e-pharmacy/types';

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
  const { isAuthReady, isAuthenticated } = useAuth();
  const [cart, setCartState] = useState<Cart>(EMPTY_CART);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const loadPromiseRef = useRef<Promise<Cart> | null>(null);

  const setCart = useCallback((nextCart: Cart) => {
    setCartState(nextCart);
    setIsLoaded(true);
    setError('');
  }, []);

  const loadCart = useCallback(async () => {
    if (loadPromiseRef.current) return loadPromiseRef.current;
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
    setIsLoading(true);
    loadPromiseRef.current = promise;
    return promise;
  }, [setCart]);

  const invalidateCart = useCallback(() => setIsLoaded(false), []);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isAuthenticated) {
      const timeoutId = window.setTimeout(() => {
        setCartState(EMPTY_CART);
        setIsLoaded(true);
        setError('');
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    if (!isLoaded && !isLoading) void loadCart().catch(() => undefined);
  }, [isAuthReady, isAuthenticated, isLoaded, isLoading, loadCart]);

  useEffect(() => {
    const onCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<CartUpdatedEventDetail>).detail;
      if (detail?.cart) setCart(detail.cart);
      else if (typeof detail?.totalItems === 'number') {
        setCartState((current) => ({
          ...current,
          totalItems: detail.totalItems,
        }));
      }
    };
    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
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
