import { useState } from 'react';

import { useCart } from '@/providers/CartProvider';

//===================================================================

export function useCheckoutCart(
  isAuthSettled: boolean,
  isAuthenticated: boolean
) {
  const {
    cart,
    isLoading: isCartLoading,
    isLoaded: isCartLoaded,
    error: cartLoadError,
    replaceCartFromServer,
  } = useCart();

  const [error, setError] = useState('');
  const canUseCart = isAuthSettled && isAuthenticated;

  return {
    cart,
    error: canUseCart ? error || cartLoadError : '',

    // On a direct checkout URL the cart can still be `idle` before its
    // initial fetch starts. Do not reveal the form (or an empty state) until
    // that first request has settled.
    isLoading:
      !isAuthSettled || (isAuthenticated && (!isCartLoaded || isCartLoading)),

    replaceCartFromServer,
    setError,
  };
}
