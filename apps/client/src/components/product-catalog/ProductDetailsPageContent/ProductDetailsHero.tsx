'use client';

import { useMemo } from 'react';

import { Button, SvgIcon } from '@e-pharmacy/ui/primitives';
import { RatingSummary } from '@e-pharmacy/ui/data-display';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { useToast } from '@e-pharmacy/ui/feedback';

import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/presentation';
import { formatPharmaciesCount } from '@e-pharmacy/utils/numbers';
import { formatMoneyRange, getNumericRange } from '@e-pharmacy/utils/money';

import type { ProductDetails } from '@e-pharmacy/types/products';

import {
  useClientAuthCapabilities,
  useFavoriteActions,
} from '@/hooks';

import {
  getFavoriteActionCopy,
  shouldRenderFavoriteControl,
} from '@/lib/favorites/favorite-presentation';

import { FavoriteToggleButton } from '@/components/common';

import { ProductOrderInformationPanel } from './ProductOrderInformationPanel';
import css from './ProductDetailsHero.module.css';

//===================================================================

export type ProductDetailsHeroProps = Readonly<{
  product: ProductDetails;
  reviewsTotal: number;
  onOpenOffers: () => void;
}>;

//===================================================================

export function ProductDetailsHero({
  product,
  reviewsTotal,
  onOpenOffers,
}: ProductDetailsHeroProps) {
  const toast = useToast();
  const {
    isAuthenticated,
    isBootstrapping,
    canUseClientFeatures,
  } = useClientAuthCapabilities();

  const { isFavorite, isFavoriteLoading, isFavoritePending, toggleFavorite } =
    useFavoriteActions({
      entityType: 'product',
      id: product.id,
      notifier: toast,
      ...getFavoriteActionCopy('product'),
    });

  const availableOffers = useMemo(
    () => product.offers.filter((offer) => offer.inStock),
    [product.offers]
  );

  const pharmaciesCountLabel =
    formatPharmaciesCount(availableOffers.length) ?? '—';

  const priceRange = getNumericRange(
    availableOffers.map((offer) => offer.price)
  );

  const priceRangeLabel = priceRange
    ? (formatMoneyRange(priceRange) ?? '—')
    : 'No pharmacy prices yet';

  return (
    <div className={css.grid}>
      <div className={css.imageCard}>
        {product.imageUrl ? (
          <ShimmerImage
            className={css.image}
            src={product.imageUrl}
            alt={product.name}
            priority
            fetchPriority="high"
            sizes="(max-width: 767px) 100vw, (max-width: 1439px) 50vw, 520px"
          />
        ) : (
          <div className={css.imageFallback} aria-hidden="true">
            <SvgIcon name="icon-shopping-cart" size={52} />
          </div>
        )}
      </div>

      <div className={css.content}>
        <div className={css.topLine}>
          <p className={css.category}>
            {PRODUCT_CATEGORY_LABELS[product.category]}
          </p>

          {shouldRenderFavoriteControl({
            isAuthenticated,
            isBootstrapping,
            canUseClientFeatures,
          }) ? (
            <FavoriteToggleButton
              isActive={isFavorite}
              disabled={isFavoriteLoading}
              isPending={isFavoritePending}
              onClick={toggleFavorite}
              activeLabel="Remove product from favorites"
              inactiveLabel="Add product to favorites"
            />
          ) : null}
        </div>

        <h1 className={css.title}>{product.name}</h1>

        <RatingSummary
          className={css.ratingRow}
          rating={product.rating}
          reviewsCount={reviewsTotal}
        />

        <dl className={css.summaryList}>
          <div className={css.summaryItem}>
            <dt>Article</dt>
            <dd>{product.article}</dd>
          </div>

          {availableOffers.length > 0 ? (
            <>
              <div className={css.summaryItem}>
                <dt>Found in pharmacies</dt>
                <dd>{pharmaciesCountLabel}</dd>
              </div>

              <div className={css.summaryItem}>
                <dt>Price</dt>
                <dd>{priceRangeLabel}</dd>
              </div>
            </>
          ) : (
            <div className={css.summaryItem}>
              <dt>Availability</dt>
              <dd>Not available in pharmacies</dd>
            </div>
          )}
        </dl>

        <ProductOrderInformationPanel />

        <Button
          className={css.action}
          type="button"
          onClick={onOpenOffers}
        >
          Find pharmacy offers
        </Button>
      </div>
    </div>
  );
}
