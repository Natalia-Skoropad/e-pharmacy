'use client';

import { useEffect, useMemo, useState } from 'react';

import { CartItemCard, CartSummary } from '@/components/cart';
import { ButtonLink, Container } from '@/components/common';
import { useAuth } from '@/components/providers';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

import { CART_DESCRIPTION, CART_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { createBreadcrumbs } from '@/lib/routes';

import { clearCart, getCart, removeCartItem, updateCartItem } from '@/services';

import type { Cart } from '@/types';

import css from './CartPageContent.module.css';

//===================================================================

const EMPTY_CART: Cart = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

//===================================================================

function CartPageContent() {
  const { token } = useAuth();

  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const isUpdating = Boolean(updatingItemId) || isClearing;

  useEffect(() => {
    let isMounted = true;

    async function fetchCart() {
      if (!token) return;

      try {
        const response = await getCart(token);

        if (!isMounted) return;

        setCart(response.cart);
        setError('');
      } catch {
        if (!isMounted) return;

        setError('Could not load your cart. Please check the backend API.');
      } finally {
        if (!isMounted) return;

        setIsLoading(false);
      }
    }

    void fetchCart();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleQuantityChange = async (cartItemId: string, quantity: number) => {
    if (!token || quantity < 1) return;

    try {
      setUpdatingItemId(cartItemId);
      setError('');

      const response = await updateCartItem(cartItemId, { quantity }, token);

      setCart(response.cart);
    } catch {
      setError('Could not update cart item.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = async (cartItemId: string) => {
    if (!token) return;

    try {
      setUpdatingItemId(cartItemId);
      setError('');

      const response = await removeCartItem(cartItemId, token);

      setCart(response.cart);
    } catch {
      setError('Could not remove cart item.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClear = async () => {
    if (!token) return;

    try {
      setIsClearing(true);
      setError('');

      const response = await clearCart(token);

      setCart(response.cart);
    } catch {
      setError('Could not clear cart.');
    } finally {
      setIsClearing(false);
    }
  };

  const cartItemsLabel = useMemo(() => {
    if (cart.totalItems === 1) return '1 item';

    return `${cart.totalItems} items`;
  }, [cart.totalItems]);

  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="cart-title">
        <Container>
          <Breadcrumbs items={createBreadcrumbs(CART_TITLE)} />

          <div className={css.hero}>
            <div>
              <p className={css.kicker}>Shopping cart</p>

              <h1 className={css.title} id="cart-title">
                {CART_TITLE}
              </h1>

              <p className={css.text}>{CART_DESCRIPTION}</p>
            </div>

            <p className={css.badge}>{cartItemsLabel}</p>
          </div>

          {isLoading ? (
            <div className={css.status} role="status">
              Loading cart...
            </div>
          ) : null}

          {error ? (
            <div className={css.notice} role="alert">
              {error}
            </div>
          ) : null}

          {!isLoading && cart.items.length === 0 ? (
            <div className={css.empty}>
              <h2 className={css.emptyTitle}>Your cart is empty</h2>

              <p className={css.emptyText}>
                Add medicines from the catalog and they will appear here.
              </p>

              <ButtonLink href={ROUTES.MEDICINES_CATALOG}>
                Browse medicines
              </ButtonLink>
            </div>
          ) : null}

          {cart.items.length > 0 ? (
            <div className={css.grid}>
              <ul className={css.list}>
                {cart.items.map((item) => (
                  <li key={item.id}>
                    <CartItemCard
                      item={item}
                      isUpdating={updatingItemId === item.id}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemove}
                    />
                  </li>
                ))}
              </ul>

              <CartSummary
                cart={cart}
                isUpdating={isUpdating}
                onClear={handleClear}
              />
            </div>
          ) : null}
        </Container>
      </section>
    </main>
  );
}

export default CartPageContent;
