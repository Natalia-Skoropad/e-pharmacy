'use client';

import { useMemo } from 'react';

import { SvgIcon } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { RatingSummary } from '@e-pharmacy/ui/data-display';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/presentation';
import { formatPharmaciesCount } from '@e-pharmacy/utils/numbers';
import { formatMoneyRange, getNumericRange } from '@e-pharmacy/utils/money';
import { useToast } from '@e-pharmacy/ui/feedback';
import type { ProductDetails } from '@e-pharmacy/types/products';

import { useClientAuthCapabilities, useFavoriteActions } from '@/hooks';
import { buildProductPath } from '@/lib/routes';

import { FavoriteToggleButton } from '@/components/common';

import css from './ProductCard.module.css';

//===================================================================

type ProductCardProps = {
  product: ProductDetails;
  onFavoriteChange?: (productId: string, isFavorite: boolean) => void;
};

//===================================================================

function ProductCard({ product, onFavoriteChange }: ProductCardProps) {
  const { isAuthenticated, isBootstrapping, canUseClientFeatures } =
    useClientAuthCapabilities();
  const toast = useToast();

  const { isFavorite, isFavoriteLoading, toggleFavorite } = useFavoriteActions({
    entityType: 'product',
    id: product.id,
    notifier: toast,
    loginMessage: 'Please log in to add products to favorites.',

    unavailableMessage:
      'We could not verify your session. Please try again shortly.',

    clientAccountRequiredMessage:
      'Favorites are available only for active client accounts.',

    addedMessage: 'Product was added to favorites.',
    removedMessage: 'Product was removed from favorites.',
    errorMessage: 'Could not update favorites.',

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

  const priceRangeLabel = useMemo(() => {
    const priceRange = getNumericRange(
      product.offers
        .filter((offer) => offer.inStock)
        .map((offer) => offer.price)
    );

    return priceRange
      ? (formatMoneyRange(priceRange) ?? '—')
      : 'No pharmacy prices yet';
  }, [product.offers]);

  return (
    <article
      className={css.card}
      aria-labelledby={`product-${product.id}-title`}
    >
      <div className={css.imageWrap}>
        {product.imageUrl ? (
          <ShimmerImage
            className={css.image}
            src={product.imageUrl}
            alt={product.name}
            sizes="(max-width: 767px) 100vw, (max-width: 1439px) 50vw, 33vw"
          />
        ) : (
          <div className={css.imageFallback} aria-hidden="true">
            <SvgIcon name="icon-shopping-cart" size={34} />
          </div>
        )}

        {!isBootstrapping && (!isAuthenticated || canUseClientFeatures) ? (
          <div className={css.favoriteWrap}>
            <FavoriteToggleButton
              isActive={isFavorite}
              disabled={isFavoriteLoading}
              onClick={() => void toggleFavorite()}
              activeLabel="Remove product from favorites"
              inactiveLabel="Add product to favorites"
            />
          </div>
        ) : null}
      </div>

      <div className={css.content}>
        <div className={css.metaRow}>
          <span className={css.category}>
            {PRODUCT_CATEGORY_LABELS[product.category]}
          </span>

          <RatingSummary
            className={css.ratingSummary}
            rating={product.rating}
            reviewsCount={product.reviewsCount ?? 0}
            size="sm"
          />
        </div>

        <h2 className={css.title} id={`product-${product.id}-title`}>
          {product.name}
        </h2>

        <dl className={css.summaryList}>
          <div className={css.summaryItem}>
            <dt>Article</dt>
            <dd>{product.article}</dd>
          </div>

          {isAvailable ? (
            <div className={css.summaryItem}>
              <dt>Found in pharmacies</dt>
              <dd>
                {formatPharmaciesCount(product.foundInPharmaciesCount) ?? '—'}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className={css.footer}>
          {isAvailable ? (
            <p className={css.price}>{priceRangeLabel}</p>
          ) : (
            <p className={css.unavailableStatus}>Not available in pharmacies</p>
          )}

          <LinkButton className={css.detailsLink} href={productHref} size="sm">
            Details
          </LinkButton>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
