'use client';

import { useMemo, useState } from 'react';

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
import type { Cart } from '@e-pharmacy/types';

import {
  getCartOrderPath,
  getCartOrderTotal,
  groupCartItemsByPharmacy,
  type CartPharmacyGroup,
} from '@/lib/cart/cart-groups';

import { CART_DESCRIPTION, CART_TITLE } from '@/lib/seo';
import { APP_ERROR_MESSAGES, getUserFacingErrorMessage } from '@/lib/errors';
import { ROUTES } from '@/lib/routes';
import { buildPharmacyPath, createBreadcrumbs } from '@/lib/routes';
import { useCartMutations } from '@/lib/cart/useCartMutations';
import { useClientAuthCapabilities } from '@/hooks';

import { useCart } from '@/providers/CartProvider';

import {
  CartItemCard,
  CartSummary,
  ContinueShoppingModal,
} from '@/components/cart';

import css from './CartPageContent.module.css';

//===================================================================

const EMPTY_CART: Cart = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

//===================================================================

function CartPageContent() {
  const { isAuthReady, canUseClientFeatures } =
    useClientAuthCapabilities();
  const canUseCart = canUseClientFeatures;

  const { cart, setCart, isLoaded, isLoading, error: cartLoadError } = useCart();
  const [error, setError] = useState('');

  const {
    pendingItemIds,
    isClearing,
    updateItemQuantity,
    removeItemFromCart,
    clearAllCart,
    removePharmacyOrder,
  } = useCartMutations({ canUseCart });

  const [continueShoppingPharmacy, setContinueShoppingPharmacy] =
    useState<CartPharmacyGroup | null>(null);

  const [pendingAction, setPendingAction] = useState<
    | { type: 'item'; itemId: string }
    | { type: 'pharmacy'; pharmacyId: string; pharmacyName: string }
    | { type: 'clear' }
    | null
  >(null);

  const isUpdating = pendingItemIds.size > 0 || isClearing;

  const visibleError = error || cartLoadError;

  const handleQuantityChange = async (cartItemId: string, quantity: number) => {
    if (!canUseCart || quantity < 1) return;

    try {
      setError('');
      await updateItemQuantity(cartItemId, { quantity });
    } catch (error) {
      setError(
        getUserFacingErrorMessage(error, {
          fallback: APP_ERROR_MESSAGES.cart.update,
        })
      );
    }
  };

  const handleRemove = async (cartItemId: string) => {
    if (!canUseCart) return;

    try {
      setError('');
      await removeItemFromCart(cartItemId);
    } catch (error) {
      setError(
        getUserFacingErrorMessage(error, {
          fallback: APP_ERROR_MESSAGES.cart.remove,
        })
      );
    }
  };

  const handleClear = async () => {
    if (!canUseCart) return;

    try {
      setError('');
      await clearAllCart();
    } catch (error) {
      setError(
        getUserFacingErrorMessage(error, {
          fallback: APP_ERROR_MESSAGES.cart.clear,
        })
      );
    }
  };

  const visibleCart = canUseCart ? cart : EMPTY_CART;
  const shouldShowLoading =
    !isAuthReady || (canUseCart && (!isLoaded || isLoading));

  const groupedCartItems = useMemo(
    () => groupCartItemsByPharmacy(visibleCart.items),
    [visibleCart.items]
  );

  const handleRemovePharmacy = async (pharmacyId: string) => {
    if (!canUseCart) return;

    try {
      setError('');
      await removePharmacyOrder(pharmacyId);
    } catch (error) {
      setError(
        getUserFacingErrorMessage(error, {
          fallback: APP_ERROR_MESSAGES.cart.removeOrder,
        })
      );
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
              shown={groupedCartItems.length}
              total={groupedCartItems.length}
              label={groupedCartItems.length === 1 ? 'order' : 'orders'}
            />
          </div>

          {shouldShowLoading ? (
            <div className={css.status}>
              <LoadingSpinner label="Loading pharmacy orders..." />
            </div>
          ) : null}

          {visibleError ? (
            <div className={css.notice} role="alert">
              {visibleError}
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
                              isUpdating={
                                pendingItemIds.has(item.id) || isClearing
                              }
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
                      onContinueShopping={() =>
                        setContinueShoppingPharmacy(group)
                      }
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
