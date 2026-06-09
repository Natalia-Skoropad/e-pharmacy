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
  Container,
  CountLabel,
  LoadingSpinner,
  RatingSummary,
} from '@e-pharmacy/ui/common';

import { ConfirmationModal } from '@e-pharmacy/ui/modals';
import { Breadcrumbs } from '@e-pharmacy/ui/layout';
import { dispatchCartUpdated } from '@/lib/cart/cart-events';

import {
  getCartInvoicePath,
  getCartInvoiceTotal,
  groupCartItemsByStore,
  type CartStoreGroup,
} from '@/lib/cart/cart-groups';

import { CART_DESCRIPTION, CART_TITLE } from '@e-pharmacy/config/seo';
import { APP_ERROR_MESSAGES, getAppErrorMessage } from '@/lib/errors';
import { ROUTES } from '@e-pharmacy/config/routes';
import { buildStorePath, createBreadcrumbs } from '@e-pharmacy/config/routes';
import { useAuth } from '@/providers';
import { getCart } from '@e-pharmacy/api-client/client';

import {
  clearCart,
  removeCartItem,
  updateCartItem,
} from '@/services/cart-service';

import type { Cart } from '@e-pharmacy/types';

import css from './CartPageContent.module.css';

//===================================================================

const EMPTY_CART: Cart = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

//===================================================================

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
  const { sessionMarker } = useAuth();

  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const [continueShoppingStore, setContinueShoppingStore] =
    useState<CartStoreGroup | null>(null);
  
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
      if (!sessionMarker) return;

      try {
        const response = await getCart();

        if (!isMounted) return;

        setCart(response.cart);
        setError('');
      } catch (error) {
        if (!isMounted) return;

        setError(
          getAppErrorMessage(error, { fallback: APP_ERROR_MESSAGES.cart.load })
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
  }, [sessionMarker]);

  const handleQuantityChange = async (cartItemId: string, quantity: number) => {
    if (!sessionMarker || quantity < 1) return;

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

      const response = await updateCartItem(cartItemId, { quantity });

      setCart(response.cart);
      dispatchCartUpdated(response.cart);
    } catch (error) {
      setCart(previousCart);
      dispatchCartUpdated(previousCart);
      setError(
        getAppErrorMessage(error, { fallback: APP_ERROR_MESSAGES.cart.update })
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = async (cartItemId: string) => {
    if (!sessionMarker) return;

    try {
      setUpdatingItemId(cartItemId);
      setError('');

      const response = await removeCartItem(cartItemId);

      setCart(response.cart);
    } catch (error) {
      setError(
        getAppErrorMessage(error, { fallback: APP_ERROR_MESSAGES.cart.remove })
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClear = async () => {
    if (!sessionMarker) return;

    try {
      setIsClearing(true);
      setError('');

      const response = await clearCart();

      setCart(response.cart);
    } catch (error) {
      setError(
        getAppErrorMessage(error, { fallback: APP_ERROR_MESSAGES.cart.clear })
      );
    } finally {
      setIsClearing(false);
    }
  };

  const groupedCartItems = useMemo(
    () => groupCartItemsByStore(cart.items),
    [cart.items]
  );

  const handleRemoveStore = async (storeId: string) => {
    if (!sessionMarker) return;

    try {
      setIsClearing(true);
      setError('');

      const storeItems = cart.items.filter((item) => item.storeId === storeId);
      let nextCart = cart;

      for (const item of storeItems) {
        const response = await removeCartItem(item.id);
        nextCart = response.cart;
      }

      setCart(nextCart);
    } catch (error) {
      setError(
        getAppErrorMessage(error, {
          fallback: APP_ERROR_MESSAGES.cart.removeInvoice,
        })
      );
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

            <CountLabel shown={cart.totalItems} total={cart.totalItems} label="items" />
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
                      totalItems={group.totalItems}
                      totalPrice={getCartInvoiceTotal(group)}
                      checkoutPath={getCartInvoicePath(group)}
                      isUpdating={isUpdating}
                      onContinueShopping={() => setContinueShoppingStore(group)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {continueShoppingStore && sessionMarker ? (
            <ContinueShoppingModal
              storeId={continueShoppingStore.storeId}
              storeName={continueShoppingStore.storeName}
              cartItems={cart.items}
              onClose={() => setContinueShoppingStore(null)}
              onCartChange={setCart}
            />
          ) : null}

          {pendingAction ? (
            <ConfirmationModal
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
