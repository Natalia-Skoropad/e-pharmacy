'use client';

import { useMemo } from 'react';

import {
  ButtonLink,
  RatingSummary,
  ShimmerImage,
  SvgIcon,
} from '@e-pharmacy/ui/common';

import { FavoriteToggleButton } from '@/components/common';
import { useToast } from '@e-pharmacy/ui/feedback';

import {
  invalidateFavoriteProductIdsCache,
  useFavoriteActions,
  useProductFavoriteRefresh,
} from '@/hooks';

import {
  formatPharmaciesCount,
  formatPriceRange,
} from '@e-pharmacy/utils/formatters';

import { formatProductCategoryLabel } from '@/lib/catalog/product-category-labels';
import { buildProductPath } from '@/lib/routes';
import { useAuth } from '@e-pharmacy/auth/core';

import { addFavoriteProduct, removeFavoriteProduct } from '@/lib/api/browser';

import type { Product } from '@e-pharmacy/types';

import css from './ProductCard.module.css';

//===================================================================

type ProductCardProps = {
  product: Product;
  skipFavoriteRefresh?: boolean;
  onFavoriteChange?: (productId: string, isFavorite: boolean) => void;
};

//===================================================================

function ProductCard({
  product,
  skipFavoriteRefresh = false,
  onFavoriteChange,
}: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const {
    isAuthReady,
    isFavorite,
    isFavoriteLoading,
    handleFavoriteClick,
    setIsFavorite,
  } = useFavoriteActions({
    id: product.id,
    initialIsFavorite: Boolean(product.isFavorite),
    notifier: toast,
    loginMessage: 'Please log in to add products to favorites.',
    addedMessage: 'Product was added to favorites.',
    removedMessage: 'Product was removed from favorites.',
    errorMessage: 'Could not update favorites.',
    addFavorite: addFavoriteProduct,
    removeFavorite: removeFavoriteProduct,
    onFavoriteChange: (productId, nextIsFavorite) => {
      invalidateFavoriteProductIdsCache();
      onFavoriteChange?.(productId, nextIsFavorite);
    },
  });

  const productHref = buildProductPath(product.name, product.id);

  const priceRangeLabel = useMemo(
    () => formatPriceRange(product.offers),
    [product.offers]
  );

  useProductFavoriteRefresh({
    id: product.id,
    isEnabled: !skipFavoriteRefresh && isAuthReady && isAuthenticated,
    onRefresh: setIsFavorite,
  });

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

        <div className={css.favoriteWrap}>
          <FavoriteToggleButton
            isActive={isFavorite}
            disabled={isFavoriteLoading}
            onClick={handleFavoriteClick}
            activeLabel="Remove product from favorites"
            inactiveLabel="Add product to favorites"
          />
        </div>
      </div>

      <div className={css.content}>
        <div className={css.metaRow}>
          <span className={css.category}>
            {formatProductCategoryLabel(product.category)}
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

          <div className={css.summaryItem}>
            <dt>Found in pharmacies</dt>
            <dd>{formatPharmaciesCount(product.foundInPharmaciesCount)}</dd>
          </div>
        </dl>

        <div className={css.footer}>
          <p className={css.price}>{priceRangeLabel}</p>

          <ButtonLink className={css.detailsLink} href={productHref} size="sm">
            Details
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
