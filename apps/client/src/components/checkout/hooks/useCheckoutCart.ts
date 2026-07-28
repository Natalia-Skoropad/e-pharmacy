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
    error: cartLoadError,
    setCart,
  } = useCart();

  const [error, setError] = useState('');
  const canUseCart = isAuthSettled && isAuthenticated;

  return {
    cart,
    error: canUseCart ? error || cartLoadError : '',
    isLoading: !isAuthSettled || (isAuthenticated && isCartLoading),
    setCart,
    setError,
  };
}
