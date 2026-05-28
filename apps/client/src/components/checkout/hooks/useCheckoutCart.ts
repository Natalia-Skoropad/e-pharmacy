import { useEffect, useState } from 'react';

import { getCart } from '@/services';
import type { Cart } from '@/types';

//===================================================================

const EMPTY_CART: Cart = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

//===================================================================

export function useCheckoutCart(sessionMarker: string | null | undefined) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchCart() {
      if (!sessionMarker) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getCart();

        if (!isMounted) return;

        setCart(response.cart);
        setError('');
      } catch {
        if (!isMounted) return;

        setError('Could not load checkout data.');
      } finally {
        if (!isMounted) return;

        setIsLoading(false);
      }
    }

    void fetchCart();

    return () => {
      isMounted = false;
    };
  }, [sessionMarker]);

  return {
    cart,
    error,
    isLoading,
    setCart,
    setError,
  };
}
