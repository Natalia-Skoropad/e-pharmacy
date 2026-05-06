'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/common';
import { useAuth } from '@/components/providers';

import { ROUTES } from '@/lib/constants/routes';

import { addCartItem } from '@/services';

import css from './AddToCartButton.module.css';

//===================================================================

type AddToCartButtonProps = {
  productId: string;
  disabled?: boolean;
};

//===================================================================

function AddToCartButton({
  productId,
  disabled = false,
}: AddToCartButtonProps) {
  const router = useRouter();

  const { token, isAuthenticated, isAuthReady } = useAuth();

  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddToCart = async () => {
    if (!isAuthReady) return;

    if (!isAuthenticated || !token) {
      router.push(`${ROUTES.LOGIN}?redirect=${ROUTES.CART}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage('');

      await addCartItem(
        {
          productId,
          quantity: 1,
        },
        token
      );

      setMessage('Added to cart');
    } catch {
      setMessage('Could not add product to cart');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={css.wrap}>
      <Button
        type="button"
        disabled={disabled || isSubmitting || !isAuthReady}
        onClick={handleAddToCart}
      >
        {isSubmitting ? 'Adding...' : 'Add to cart'}
      </Button>

      {message ? (
        <p className={css.message} role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export default AddToCartButton;
