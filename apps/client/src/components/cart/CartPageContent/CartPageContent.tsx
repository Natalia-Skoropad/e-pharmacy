'use client';

import { useMemo, useState } from 'react';

import { Button, LoadingSpinner } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { CountLabel, RatingSummary } from '@e-pharmacy/ui/data-display';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs } from '@e-pharmacy/ui/navigation';
import type { Cart } from '@e-pharmacy/types/cart';
import { CART_CHANGED_ERROR_CODE, STOCK_CHANGED_ERROR_CODE } from '@e-pharmacy/config/cart';

import {
  getCartOrderPath,
  groupCartItemsByPharmacy,
  type CartPharmacyGroup,
} from '@/lib/cart/cart-groups';

import { CART_DESCRIPTION, CART_TITLE } from '@/lib/seo/metadata-copy';
import { hasCartGroupStockConflict } from '@/lib/cart/cart-stock';
import { APP_ERROR_MESSAGES, getUserFacingErrorMessage } from '@/lib/errors';
import { ROUTES } from '@/lib/routes';
import { buildPharmacyPath, createBreadcrumbs } from '@/lib/routes';
import { useClientAuthCapabilities } from '@/hooks/useClientAuthCapabilities';
import { useCart } from '@/providers/CartProvider';

import CartItemCard from '@/components/cart/CartItemCard/CartItemCard';
import CartSummary from '@/components/cart/CartSummary/CartSummary';
import ContinueShoppingModal from '@/components/cart/ContinueShoppingModal/ContinueShoppingModal';

import css from './CartPageContent.module.css';

//===================================================================

const CART_BACKEND_CODE_MESSAGES = {
  [CART_CHANGED_ERROR_CODE]: APP_ERROR_MESSAGES.cart.changed,
  [STOCK_CHANGED_ERROR_CODE]: APP_ERROR_MESSAGES.cart.stockChanged,
} as const;

//===================================================================

const EMPTY_CART: Cart = {
  revision: 0,
  items: [],
  totalItems: 0,
  totalPrice: 0,
  issues: [],
};

//===================================================================

function CartPageContent() {
  const { isBootstrapping, canUseClientFeatures } = useClientAuthCapabilities();
  const canUseCart = canUseClientFeatures;

  const {
    cart,
    isLoaded,
    isLoading,
    isRefreshing,
    error: cartLoadError,
    retryCart,
    pendingItemIds,
    isClearing,
    updateItemQuantity,
    removeItemFromCart,
    clearAllCart,
    removePharmacyOrder,
  } = useCart();
  const [error, setError] = useState('');

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
          backendCodeMessages: CART_BACKEND_CODE_MESSAGES,
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
          backendCodeMessages: CART_BACKEND_CODE_MESSAGES,
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
          backendCodeMessages: CART_BACKEND_CODE_MESSAGES,
        })
      );
    }
  };

  const visibleCart = canUseCart ? cart : EMPTY_CART;
  const shouldShowLoading =
    isBootstrapping || (canUseCart && (!isLoaded || isLoading));

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
          backendCodeMessages: CART_BACKEND_CODE_MESSAGES,
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
              <p>{visibleError}</p>
              {cartLoadError ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isLoading || isRefreshing}
                  onClick={() => void retryCart().catch(() => undefined)}
                >
                  Retry loading cart
                </Button>
              ) : null}
            </div>
          ) : null}

          {visibleCart.issues.length > 0 ? (
            <div className={css.notice} role="status">
              <p>{APP_ERROR_MESSAGES.cart.itemsChanged}</p>
            </div>
          ) : null}

          {!shouldShowLoading &&
          !visibleError &&
          visibleCart.items.length === 0 ? (
            <div className={css.empty}>
              <h2 className={css.emptyTitle}>Your cart is empty</h2>

              <p className={css.emptyText}>
                Add products from the catalog and they will appear here.
              </p>

              <LinkButton
                className={css.emptyButton}
                href={ROUTES.PRODUCTS_CATALOG}
              >
                Browse products
              </LinkButton>
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
                          <LinkButton
                            href={buildPharmacyPath(
                              group.pharmacyName,
                              group.pharmacyId
                            )}
                            variant="secondary"
                            size="sm"
                          >
                            Pharmacy details
                          </LinkButton>

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
                      totalPrice={group.totalPrice}
                      checkoutPath={getCartOrderPath(group)}
                      isUpdating={isUpdating}
                      hasStockConflict={hasCartGroupStockConflict(group)}
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
