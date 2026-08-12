'use client';

import { useState } from 'react';

import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/presentation';
import { RatingSummary } from '@e-pharmacy/ui/data-display';
import { useToast } from '@e-pharmacy/ui/feedback';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { Button, SvgIcon } from '@e-pharmacy/ui/primitives';
import { formatMoneyRange } from '@e-pharmacy/utils/money';
import { formatPharmaciesCount } from '@e-pharmacy/utils/numbers';
import type { ProductCardSummary } from '@e-pharmacy/types/products';

import { useClientAuthCapabilities, useFavoriteActions } from '@/hooks';

import { isCartOrderLimitError } from '@/lib/cart/order-limit';
import { APP_ERROR_MESSAGES, getUserFacingErrorMessage } from '@/lib/errors';

import {
  getFavoriteActionCopy,
  shouldRenderFavoriteControl,
} from '@/lib/favorites/favorite-presentation';

import { buildProductPath } from '@/lib/routes';
import { useCart } from '@/providers/CartProvider';

import CatalogEntityCard, {
  type CatalogCardHeadingLevel,
} from '@/components/catalog/CatalogEntityCard/CatalogEntityCard';
import { CartOrderLimitModal, FavoriteToggleButton } from '@/components/common';

import css from './ProductCard.module.css';

//===================================================================

export type ProductCardProps = Readonly<{
  product: ProductCardSummary;
  pharmacyId?: string;
  pharmacyName?: string;
  headingLevel?: CatalogCardHeadingLevel;
  onFavoriteChange?: (productId: string, isFavorite: boolean) => void;
}>;

//===================================================================

function ProductCard({
  product,
  pharmacyId,
  pharmacyName,
  headingLevel = 2,
  onFavoriteChange,
}: ProductCardProps) {
  const authCapabilities = useClientAuthCapabilities();
  const toast = useToast();
  const favoriteCopy = getFavoriteActionCopy('product');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isOrderLimitOpen, setIsOrderLimitOpen] = useState(false);

  const { cart, isLoaded, loadError, loadCart, retryCart, addProductToCart } =
    useCart();

  const { isFavorite, isFavoriteLoading, isFavoritePending, toggleFavorite } =
    useFavoriteActions({
      entityType: 'product',
      id: product.id,
      notifier: toast,
      ...favoriteCopy,
      onFavoriteChange: (productId, nextIsFavorite) => {
        onFavoriteChange?.(productId, nextIsFavorite);
      },
    });

  const productHref = buildProductPath(
    product.name,
    product.id,
    product.publicSlugId
  );

  const isAvailable = product.inStock && product.foundInPharmaciesCount > 0;
  const isPharmacyScoped = Boolean(pharmacyId);
  const cartItem = pharmacyId
    ? cart.items.find(
        (item) =>
          item.productId === product.id && item.pharmacyId === pharmacyId
      )
    : undefined;

  const isAlreadyInCart = Boolean(cartItem);
  const canAddToCart =
    authCapabilities.canUseClientFeatures &&
    isAvailable &&
    !isAlreadyInCart &&
    !isAddingToCart;

  const priceRangeLabel =
    product.minPrice !== null && product.maxPrice !== null
      ? (formatMoneyRange({ min: product.minPrice, max: product.maxPrice }) ??
        '—')
      : 'No pharmacy prices yet';

  const handleAddToCart = async (): Promise<void> => {
    if (!pharmacyId || !canAddToCart) return;

    setIsAddingToCart(true);

    try {
      if (!isLoaded || loadError) {
        const confirmedCart = loadError ? await retryCart() : await loadCart();

        if (!confirmedCart) {
          toast.error(APP_ERROR_MESSAGES.products.loadCart);
          return;
        }

        const alreadyAdded = confirmedCart.items.some(
          (item) =>
            item.productId === product.id && item.pharmacyId === pharmacyId
        );

        if (alreadyAdded) return;
      }

      const response = await addProductToCart({
        productId: product.id,
        pharmacyId,
        quantity: 1,
      });

      if (response) toast.success('Product was added to the cart.');
    } catch (error) {
      if (isCartOrderLimitError(error)) {
        setIsOrderLimitOpen(true);
      } else {
        toast.error(
          getUserFacingErrorMessage(error, {
            fallback: APP_ERROR_MESSAGES.products.addToCart,
          })
        );
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <>
      <CatalogEntityCard
        title={product.name}
        headingLevel={headingLevel}
        image={{
          src: product.imageUrl,
          alt: product.name,
          fallbackIcon: 'icon-shopping-cart',
          fit: 'cover',
          sizes: '(max-width: 767px) 100vw, (max-width: 1439px) 50vw, 33vw',
        }}
        favoriteAction={
          shouldRenderFavoriteControl(authCapabilities) ? (
            <FavoriteToggleButton
              isActive={isFavorite}
              disabled={isFavoriteLoading}
              isPending={isFavoritePending}
              onClick={toggleFavorite}
              activeLabel="Remove product from favorites"
              inactiveLabel="Add product to favorites"
            />
          ) : undefined
        }
        metaStart={
          <span className={css.category}>
            {PRODUCT_CATEGORY_LABELS[product.category]}
          </span>
        }
        metaEnd={
          <RatingSummary
            className={css.ratingSummary}
            rating={product.rating}
            reviewsCount={product.reviewsCount}
            size="sm"
          />
        }
        summaryItems={
          <>
            <div>
              <dt>Article</dt>
              <dd>{product.article}</dd>
            </div>

            {isPharmacyScoped ? (
              <div>
                <dt>Availability</dt>
                <dd>{isAvailable ? 'Available here' : 'Unavailable here'}</dd>
              </div>
            ) : isAvailable ? (
              <div>
                <dt>Found in pharmacies</dt>
                <dd>
                  {formatPharmaciesCount(product.foundInPharmaciesCount) ?? '—'}
                </dd>
              </div>
            ) : null}
          </>
        }
        footerClassName={css.footer}
        footer={
          <>
            {isAvailable ? (
              <p className={css.price}>{priceRangeLabel}</p>
            ) : (
              <p className={css.unavailableStatus}>
                {isPharmacyScoped
                  ? `Not available in ${pharmacyName ?? 'this pharmacy'}`
                  : 'Not available in pharmacies'}
              </p>
            )}

            <div className={css.actions}>
              {pharmacyId ? (
                <Button
                  className={css.cartButton}
                  type="button"
                  size="sm"
                  disabled={!canAddToCart}
                  isLoading={isAddingToCart}
                  loadingLabel="Adding"
                  iconLeft={<SvgIcon name="icon-shopping-cart" size={16} />}
                  aria-label={
                    isAlreadyInCart
                      ? `${product.name} from ${pharmacyName ?? 'the selected pharmacy'} is already in the cart`
                      : `Add ${product.name} from ${pharmacyName ?? 'the selected pharmacy'} to cart`
                  }
                  onClick={() => void handleAddToCart()}
                >
                  {isAlreadyInCart ? 'In cart' : 'Add to cart'}
                </Button>
              ) : null}

              <LinkButton
                className={css.detailsLink}
                href={productHref}
                size="sm"
              >
                Details
              </LinkButton>
            </div>
          </>
        }
      />

      {isOrderLimitOpen ? (
        <CartOrderLimitModal onClose={() => setIsOrderLimitOpen(false)} />
      ) : null}
    </>
  );
}

export default ProductCard;
