import { useState } from 'react';

import { useCart } from '@/providers/CartProvider';

//===================================================================

export function useCheckoutCart(isAuthReady: boolean, isAuthenticated: boolean) {
  const {
    cart,
    isLoading: isCartLoading,
    error: cartLoadError,
    setCart,
  } = useCart();

  const [error, setError] = useState('');
  const canUseCart = isAuthReady && isAuthenticated;

  return {
    cart,
    error: canUseCart ? error || cartLoadError : '',
    isLoading: !isAuthReady || (isAuthenticated && isCartLoading),
    setCart,
    setError,
  };
}
