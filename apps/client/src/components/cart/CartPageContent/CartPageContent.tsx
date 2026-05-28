'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  CartItemCard,
  CartSummary,
  ContinueShoppingModal,
} from '@/components/cart';

import {
  Button,
  ButtonLink,
  ConfirmActionModal,
  Container,
  LoadingSpinner,
  RatingSummary,
} from '@/components/common';

import Breadcrumbs from '@/components/layout/Breadcrumbs';

import { dispatchCartUpdated } from '@/lib/cart/cart-events';
import { CART_DESCRIPTION, CART_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { buildStorePath, createBreadcrumbs } from '@/lib/routes';

import { useAuth } from '@/providers';
import { clearCart, getCart, removeCartItem, updateCartItem } from '@/services';
import type { Cart } from '@/types';

import css from './CartPageContent.module.css';

//===================================================================

type StoreCartGroup = {
  storeId: string;
  storeName: string;
  items: Cart['items'];
  totalItems: number;
  totalPrice: number;
  storeRating?: number;
  storeReviewsCount?: number;
};

//===================================================================

const EMPTY_CART: Cart = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

//===================================================================

function groupCartItemsByStore(items: Cart['items']): StoreCartGroup[] {
  const groups = new Map<string, StoreCartGroup>();

  for (const item of items) {
    const storeName =
      item.storeName || item.product.storeName || 'Pharmacy order';
    const currentGroup = groups.get(item.storeId);

    if (currentGroup) {
      currentGroup.items.push(item);
      currentGroup.totalItems += item.quantity;
      currentGroup.totalPrice += item.totalPrice;
      continue;
    }

    groups.set(item.storeId, {
      storeId: item.storeId,
      storeName,
      items: [item],
      totalItems: item.quantity,
      totalPrice: item.totalPrice,
      storeRating: item.storeRating,
      storeReviewsCount: item.storeReviewsCount,
    });
  }

  return [...groups.values()];
}

function getCartWithUpdatedQuantity(
  cart: Cart,
  cartItemId: string,
  quantity: number
): Cart {
  const nextItems = cart.items.map((item) => {
    if (item.id !== cartItemId) return item;

    return {
      ...item,
      quantity,
      totalPrice: item.price * quantity,
    };
  });

  return {
    items: nextItems,
    totalItems: nextItems.reduce((total, item) => total + item.quantity, 0),
    totalPrice: nextItems.reduce((total, item) => total + item.totalPrice, 0),
  };
}

//===================================================================

function CartPageContent() {
  const { token } = useAuth();

  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [continueShoppingStore, setContinueShoppingStore] =
    useState<StoreCartGroup | null>(null);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'item'; itemId: string }
    | { type: 'store'; storeId: string; storeName: string }
    | { type: 'clear' }
    | null
  >(null);

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

    const previousCart = cart;
    const optimisticCart = getCartWithUpdatedQuantity(
      previousCart,
      cartItemId,
      quantity
    );

    setCart(optimisticCart);
    dispatchCartUpdated(optimisticCart);

    try {
      setUpdatingItemId(cartItemId);
      setError('');

      const response = await updateCartItem(cartItemId, { quantity }, token);

      setCart(response.cart);
    } catch {
      setCart(previousCart);
      dispatchCartUpdated(previousCart);
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

  const groupedCartItems = useMemo(
    () => groupCartItemsByStore(cart.items),
    [cart.items]
  );

  const handleRemoveStore = async (storeId: string) => {
    if (!token) return;

    try {
      setIsClearing(true);
      setError('');

      const storeItems = cart.items.filter((item) => item.storeId === storeId);
      let nextCart = cart;

      for (const item of storeItems) {
        const response = await removeCartItem(item.id, token);
        nextCart = response.cart;
      }

      setCart(nextCart);
    } catch {
      setError('Could not remove pharmacy invoice.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleConfirmPendingAction = async () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'item') {
      await handleRemove(pendingAction.itemId);
    }

    if (pendingAction.type === 'store') {
      await handleRemoveStore(pendingAction.storeId);
    }

    if (pendingAction.type === 'clear') {
      await handleClear();
    }

    setPendingAction(null);
  };

  const pendingActionText =
    pendingAction?.type === 'item'
      ? 'Remove this product from the invoice?'
      : pendingAction?.type === 'store'
        ? `Remove the whole invoice from ${pendingAction.storeName}?`
        : 'Clear the whole cart?';

  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="cart-title">
        <Container>
          <Breadcrumbs items={createBreadcrumbs(CART_TITLE)} />

          <div className={css.hero}>
            <div>
              <h1 className={css.title} id="cart-title">
                {CART_TITLE}
              </h1>

              <p className={css.text}>{CART_DESCRIPTION}</p>
            </div>

            <p className={css.badge}>{cartItemsLabel}</p>
          </div>

          {isLoading ? (
            <div className={css.status}>
              <LoadingSpinner label="Loading pharmacy invoices..." />
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

              <ButtonLink
                className={css.emptyButton}
                href={ROUTES.MEDICINES_CATALOG}
              >
                Browse medicines
              </ButtonLink>
            </div>
          ) : null}

          {cart.items.length > 0 ? (
            <ul className={css.groupList}>
              {groupedCartItems.map((group) => (
                <li className={css.invoice} key={group.storeId}>
                  <div className={css.invoiceGrid}>
                    <div className={css.invoiceMain}>
                      <div className={css.storeGroupHead}>
                        <div className={css.storeInfo}>
                          <p className={css.groupKicker}>Pharmacy invoice</p>
                          <h2 className={css.storeGroupTitle}>
                            {group.storeName}
                          </h2>

                          <RatingSummary
                            className={css.storeRating}
                            rating={group.storeRating}
                            reviewsCount={group.storeReviewsCount ?? 0}
                            size="sm"
                          />
                        </div>

                        <div className={css.storeActions}>
                          <ButtonLink
                            href={buildStorePath(
                              group.storeName,
                              group.storeId
                            )}
                            variant="secondary"
                            size="sm"
                          >
                            Pharmacy details
                          </ButtonLink>

                          <Button
                            className={css.dangerButton}
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() =>
                              setPendingAction({
                                type: 'store',
                                storeId: group.storeId,
                                storeName: group.storeName,
                              })
                            }
                          >
                            Remove invoice
                          </Button>
                        </div>
                      </div>

                      <ul className={css.list}>
                        {group.items.map((item) => (
                          <li key={item.id}>
                            <CartItemCard
                              item={item}
                              isUpdating={updatingItemId === item.id}
                              onQuantityChange={handleQuantityChange}
                              onRemove={(itemId) =>
                                setPendingAction({ type: 'item', itemId })
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    </div>

                    <CartSummary
                      storeId={group.storeId}
                      storeName={group.storeName}
                      totalItems={group.totalItems}
                      totalPrice={group.totalPrice}
                      isUpdating={isUpdating}
                      onContinueShopping={() => setContinueShoppingStore(group)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {continueShoppingStore && token ? (
            <ContinueShoppingModal
              storeId={continueShoppingStore.storeId}
              storeName={continueShoppingStore.storeName}
              cartItems={cart.items}
              authToken={token}
              onClose={() => setContinueShoppingStore(null)}
              onCartChange={setCart}
            />
          ) : null}

          {pendingAction ? (
            <ConfirmActionModal
              title="Confirm removing"
              text={pendingActionText}
              isLoading={isUpdating}
              onConfirm={() => void handleConfirmPendingAction()}
              onCancel={() => setPendingAction(null)}
            />
          ) : null}
        </Container>
      </section>
    </main>
  );
}

export default CartPageContent;
