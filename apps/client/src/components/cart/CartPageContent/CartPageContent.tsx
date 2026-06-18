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
  getCartOrderPath,
  getCartOrderTotal,
  groupCartItemsByPharmacy,
  type CartPharmacyGroup,
} from '@/lib/cart/cart-groups';

import { CART_DESCRIPTION, CART_TITLE } from '@/lib/seo';
import { APP_ERROR_MESSAGES, getAppErrorMessage } from '@/lib/errors';
import { ROUTES } from '@/lib/routes';
import { buildPharmacyPath, createBreadcrumbs } from '@/lib/routes';
import { useAuth } from '@e-pharmacy/auth/core';
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
      totalPrice: item.unitPrice * quantity,
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
  const { isAuthenticated, isAuthReady } = useAuth();
  const canUseCart = isAuthReady && isAuthenticated;

  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const [continueShoppingPharmacy, setContinueShoppingPharmacy] =
    useState<CartPharmacyGroup | null>(null);

  const [pendingAction, setPendingAction] = useState<
    | { type: 'item'; itemId: string }
    | { type: 'pharmacy'; pharmacyId: string; pharmacyName: string }
    | { type: 'clear' }
    | null
  >(null);

  const isUpdating = Boolean(updatingItemId) || isClearing;

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
  }, [isAuthenticated, isAuthReady]);

  const handleQuantityChange = async (cartItemId: string, quantity: number) => {
    if (!canUseCart || quantity < 1) return;

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
    if (!canUseCart) return;

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
    if (!canUseCart) return;

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

  const visibleCart = canUseCart ? cart : EMPTY_CART;
  const shouldShowLoading = !isAuthReady || (isAuthenticated && isLoading);

  const groupedCartItems = useMemo(
    () => groupCartItemsByPharmacy(visibleCart.items),
    [visibleCart.items]
  );

  const handleRemovePharmacy = async (pharmacyId: string) => {
    if (!canUseCart) return;

    try {
      setIsClearing(true);
      setError('');

      const pharmacyItems = cart.items.filter((item) => item.pharmacyId === pharmacyId);
      let nextCart = cart;

      for (const item of pharmacyItems) {
        const response = await removeCartItem(item.id);
        nextCart = response.cart;
      }

      setCart(nextCart);
    } catch (error) {
      setError(
        getAppErrorMessage(error, {
          fallback: APP_ERROR_MESSAGES.cart.removeOrder,
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

    if (pendingAction.type === 'pharmacy') {
      await handleRemovePharmacy(pendingAction.pharmacyId);
    }

    if (pendingAction.type === 'clear') {
      await handleClear();
    }

    setPendingAction(null);
  };

  const pendingActionText =
    pendingAction?.type === 'item'
      ? 'Remove this product from the order?'
      : pendingAction?.type === 'pharmacy'
        ? `Remove the whole order from ${pendingAction.pharmacyName}?`
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

            <CountLabel
              shown={visibleCart.totalItems}
              total={visibleCart.totalItems}
              label="items"
            />
          </div>

          {shouldShowLoading ? (
            <div className={css.status}>
              <LoadingSpinner label="Loading pharmacy orders..." />
            </div>
          ) : null}

          {error ? (
            <div className={css.notice} role="alert">
              {error}
            </div>
          ) : null}

          {!shouldShowLoading && visibleCart.items.length === 0 ? (
            <div className={css.empty}>
              <h2 className={css.emptyTitle}>Your cart is empty</h2>

              <p className={css.emptyText}>
                Add products from the catalog and they will appear here.
              </p>

              <ButtonLink
                className={css.emptyButton}
                href={ROUTES.PRODUCTS_CATALOG}
              >
                Browse products
              </ButtonLink>
            </div>
          ) : null}

          {visibleCart.items.length > 0 ? (
            <ul className={css.groupList}>
              {groupedCartItems.map((group) => (
                <li className={css.order} key={group.pharmacyId}>
                  <div className={css.orderGrid}>
                    <div className={css.orderMain}>
                      <div className={css.pharmacyGroupHead}>
                        <div className={css.pharmacyInfo}>
                          <p className={css.groupKicker}>Pharmacy order</p>
                          <h2 className={css.pharmacyGroupTitle}>
                            {group.pharmacyName}
                          </h2>

                          <RatingSummary
                            className={css.pharmacyRating}
                            rating={group.pharmacyRating}
                            reviewsCount={group.pharmacyReviewsCount ?? 0}
                            size="sm"
                          />
                        </div>

                        <div className={css.pharmacyActions}>
                          <ButtonLink
                            href={buildPharmacyPath(
                              group.pharmacyName,
                              group.pharmacyId
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
                                type: 'pharmacy',
                                pharmacyId: group.pharmacyId,
                                pharmacyName: group.pharmacyName,
                              })
                            }
                          >
                            Remove order
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
                      pharmacyId={group.pharmacyId}
                      totalItems={group.totalItems}
                      totalPrice={getCartOrderTotal(group)}
                      checkoutPath={getCartOrderPath(group)}
                      isUpdating={isUpdating}
                      onContinueShopping={() => setContinueShoppingPharmacy(group)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {continueShoppingPharmacy && canUseCart ? (
            <ContinueShoppingModal
              pharmacyId={continueShoppingPharmacy.pharmacyId}
              pharmacyName={continueShoppingPharmacy.pharmacyName}
              cartItems={visibleCart.items}
              onClose={() => setContinueShoppingPharmacy(null)}
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
