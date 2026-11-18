'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Building2,
  PackageSearch,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';

import { Button } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';

import {
  CountLabel,
  formatInitials,
  RatingSummary,
} from '@e-pharmacy/ui/data-display';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { Container } from '@e-pharmacy/ui/layout';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { useToast } from '@e-pharmacy/ui/feedback';
import { Breadcrumbs } from '@e-pharmacy/ui/navigation';

import { formatPharmacyLocation } from '@e-pharmacy/utils/strings';
import type { Cart } from '@e-pharmacy/types/cart';

import {
  CART_CHANGED_ERROR_CODE,
  STOCK_CHANGED_ERROR_CODE,
} from '@e-pharmacy/config/cart';

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
import { OrderPageSkeleton } from '@/components/common/OrderPageSkeleton/OrderPageSkeleton';
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
  const toast = useToast();
  const [isEntryRefreshing, setIsEntryRefreshing] = useState(true);

  const {
    cart,
    isLoaded,
    isLoading,
    error: cartLoadError,
    retryCart,
    refreshCart,
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

  // Cart prices are read from current pharmacy offers, not snapshots.
  // Refresh on entry and when returning to the tab after a possible reprice.
  useEffect(() => {
    if (!canUseCart) return;

    let isActive = true;

    void refreshCart()
      .catch(() => undefined)
      .finally(() => {
        if (isActive) setIsEntryRefreshing(false);
      });

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible')
        void refreshCart().catch(() => undefined);
    };

    window.addEventListener('focus', refreshOnFocus);

    return () => {
      isActive = false;
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [canUseCart, refreshCart]);

  const isUpdating = pendingItemIds.size > 0 || isClearing;
  const visibleError = error || cartLoadError;

  const handleQuantityChange = async (cartItemId: string, quantity: number) => {
    const previousQuantity = cart.items.find(
      (item) => item.id === cartItemId
    )?.quantity;

    if (
      !canUseCart ||
      quantity < 1 ||
      previousQuantity === undefined ||
      previousQuantity === quantity
    )
      return;

    try {
      setError('');
      const response = await updateItemQuantity(cartItemId, { quantity });

      if (response) {
        toast.success(
          quantity > previousQuantity
            ? 'One product unit was added to the order.'
            : 'One product unit was removed from the order.'
        );
      }
    } catch (error) {
      const message = getUserFacingErrorMessage(error, {
        fallback: APP_ERROR_MESSAGES.cart.update,
        backendCodeMessages: CART_BACKEND_CODE_MESSAGES,
      });

      setError(message);
      toast.error(message);
    }
  };

  const handleRemove = async (cartItemId: string): Promise<boolean> => {
    if (!canUseCart) return false;

    try {
      setError('');

      const response = await removeItemFromCart(cartItemId);

      if (!response) return false;

      toast.success('Product was removed from the order.');

      return true;
    } catch (error) {
      const message = getUserFacingErrorMessage(error, {
        fallback: APP_ERROR_MESSAGES.cart.remove,
        backendCodeMessages: CART_BACKEND_CODE_MESSAGES,
      });

      setError(message);
      toast.error(message);

      return false;
    }
  };

  const handleClear = async (): Promise<boolean> => {
    if (!canUseCart) return false;

    try {
      setError('');

      const response = await clearAllCart();

      if (!response) return false;

      toast.success('Cart was cleared.');

      return true;
    } catch (error) {
      const message = getUserFacingErrorMessage(error, {
        fallback: APP_ERROR_MESSAGES.cart.clear,
        backendCodeMessages: CART_BACKEND_CODE_MESSAGES,
      });

      setError(message);
      toast.error(message);

      return false;
    }
  };

  const visibleCart = canUseCart ? cart : EMPTY_CART;

  const shouldShowLoading =
    isBootstrapping ||
    (canUseCart && (isEntryRefreshing || !isLoaded || isLoading));

  const groupedCartItems = useMemo(
    () => groupCartItemsByPharmacy(visibleCart.items),
    [visibleCart.items]
  );

  const handleRemovePharmacy = async (pharmacyId: string): Promise<boolean> => {
    if (!canUseCart) return false;

    try {
      setError('');

      const response = await removePharmacyOrder(pharmacyId);

      if (!response) return false;

      toast.success('Pharmacy order was removed from the cart.');

      return true;
    } catch (error) {
      const message = getUserFacingErrorMessage(error, {
        fallback: APP_ERROR_MESSAGES.cart.removeOrder,
        backendCodeMessages: CART_BACKEND_CODE_MESSAGES,
      });

      setError(message);
      toast.error(message);

      return false;
    }
  };

  const handleConfirmPendingAction = async () => {
    if (!pendingAction) return;

    const succeeded =
      pendingAction.type === 'item'
        ? await handleRemove(pendingAction.itemId)
        : pendingAction.type === 'pharmacy'
          ? await handleRemovePharmacy(pendingAction.pharmacyId)
          : await handleClear();

    if (succeeded) setPendingAction(null);
  };

  const pendingActionText =
    pendingAction?.type === 'item'
      ? 'This product will be removed from your pharmacy order. Are you sure?'
      : pendingAction?.type === 'pharmacy'
        ? `All products from ${pendingAction.pharmacyName} will be removed from your cart. Are you sure?`
        : 'All products will be removed from your cart. Are you sure?';

  const pendingActionTitle =
    pendingAction?.type === 'item'
      ? 'Remove product from order?'
      : pendingAction?.type === 'pharmacy'
        ? 'Remove pharmacy order?'
        : 'Clear your cart?';

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

            {!shouldShowLoading && !cartLoadError ? (
              <CountLabel
                shown={groupedCartItems.length}
                total={groupedCartItems.length}
                label={groupedCartItems.length === 1 ? 'order' : 'orders'}
                fullWidthOnMobile
              />
            ) : null}
          </div>

          {shouldShowLoading ? <OrderPageSkeleton variant="cart" /> : null}

          {!shouldShowLoading && cartLoadError ? (
            <ProfileResourceState
              variant="error"
              title="We couldn’t load your cart"
              description={cartLoadError}
              onRetry={() => retryCart()}
              retryLabel="Try again"
            />
          ) : !shouldShowLoading && error ? (
            <ProfileResourceState
              variant="error"
              title="Your cart could not be updated"
              description={error}
              onRetry={() => refreshCart()}
              retryLabel="Refresh cart"
            />
          ) : null}

          {!shouldShowLoading && visibleCart.issues.length > 0 ? (
            <div className={css.notice} role="status">
              <p>{APP_ERROR_MESSAGES.cart.itemsChanged}</p>
            </div>
          ) : null}

          {!shouldShowLoading &&
          !visibleError &&
          visibleCart.items.length === 0 ? (
            <ProfileResourceState
              variant="empty"
              icon={<ShoppingCart size={24} aria-hidden="true" />}
              title="Your cart is empty"
              description="Add products from the catalog and they will appear here."
              sideActionOnDesktop
              headingLevel={2}
              action={
                <LinkButton
                  href={ROUTES.PRODUCTS_CATALOG}
                  iconLeft={<PackageSearch size={18} aria-hidden="true" />}
                >
                  Browse products
                </LinkButton>
              }
            />
          ) : null}

          {!shouldShowLoading &&
          !cartLoadError &&
          visibleCart.items.length > 0 ? (
            <ul className={css.groupList}>
              {groupedCartItems.map((group) => (
                <li className={css.order} key={group.pharmacyId}>
                  <div className={css.orderGrid}>
                    <div className={css.orderMain}>
                      <div className={css.pharmacyGroupHead}>
                        <div className={css.pharmacyIdentity}>
                          <TableImagePreview
                            src={group.pharmacyImageUrl}
                            alt={`${group.pharmacyName} photo`}
                            fallback={formatInitials(group.pharmacyName, 'P')}
                            size={70}
                          />

                          <div className={css.pharmacyInfo}>
                            {group.pharmacyLocation ? (
                              <p className={css.pharmacyLocation}>
                                {formatPharmacyLocation(group.pharmacyLocation)}
                              </p>
                            ) : null}
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
                        </div>

                        <div className={css.pharmacyActions}>
                          <LinkButton
                            href={buildPharmacyPath(
                              group.pharmacyName,
                              group.pharmacyId
                            )}
                            variant="secondary"
                            size="sm"
                            iconLeft={
                              <Building2 size={16} aria-hidden="true" />
                            }
                          >
                            Pharmacy details
                          </LinkButton>

                          <Button
                            className={css.dangerButton}
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isUpdating}
                            iconLeft={<Trash2 size={16} aria-hidden="true" />}
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
              eyebrow={
                pendingAction.type === 'item' ? 'CART PRODUCT' : 'CART ORDER'
              }
              title={pendingActionTitle}
              text={pendingActionText}
              confirmLabel={
                pendingAction.type === 'item'
                  ? 'Remove product'
                  : pendingAction.type === 'pharmacy'
                    ? 'Remove order'
                    : 'Clear cart'
              }
              cancelLabel="Keep editing"
              destructive
              confirmIconLeft={<Trash2 size={17} aria-hidden="true" />}
              cancelIconLeft={<X size={17} aria-hidden="true" />}
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
