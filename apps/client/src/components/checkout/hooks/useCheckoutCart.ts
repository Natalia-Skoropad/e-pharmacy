import { useEffect, useState } from 'react';

import { APP_ERROR_MESSAGES, getAppErrorMessage } from '@/lib/errors';
import { getCart } from '@e-pharmacy/api-client/client';
import type { Cart } from '@e-pharmacy/types';

//===================================================================

const EMPTY_CART: Cart = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

//===================================================================

export function useCheckoutCart(isAuthReady: boolean, isAuthenticated: boolean) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) return;

    let isMounted = true;

    async function fetchCart() {
      try {
        const response = await getCart();

        if (!isMounted) return;

        setCart(response.cart);
        setError('');
      } catch (error) {
        if (!isMounted) return;

        setError(
          getAppErrorMessage(error, {
            fallback: APP_ERROR_MESSAGES.checkout.load,
          })
        );
      } finally {
        if (!isMounted) return;

        setIsLoading(false);
      }
    }

    void fetchCart();

    return () => {
      isMounted = false;
    };
  }, [isAuthReady, isAuthenticated]);

  const canUseCart = isAuthReady && isAuthenticated;

  return {
    cart: canUseCart ? cart : EMPTY_CART,
    error: canUseCart ? error : '',
    isLoading: !isAuthReady || (isAuthenticated && isLoading),
    setCart,
    setError,
  };
}
