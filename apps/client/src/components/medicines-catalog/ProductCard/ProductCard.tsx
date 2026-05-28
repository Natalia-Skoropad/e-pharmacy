'use client';

import { useCallback, useMemo } from 'react';

import {
  ButtonLink,
  FavoriteToggleButton,
  RatingSummary,
  ShimmerImage,
  SvgIcon,
} from '@/components/common';

import { useFavoriteRefresh, useFavoriteToggle, useToast } from '@/hooks';

import { formatPharmaciesCount, formatPrice } from '@/lib/formatters';
import { buildProductPath } from '@/lib/routes';

import { useAuth } from '@/providers';
import { getProductDetails, toggleFavoriteProduct } from '@/services';
import type { Product, ProductOffer } from '@/types';

import css from './ProductCard.module.css';

//===================================================================

type ProductCardProps = {
  product: Product;
  skipFavoriteRefresh?: boolean;
  onFavoriteChange?: (productId: string, isFavorite: boolean) => void;
};

//===================================================================

const CATEGORY_LABELS: Record<Product['category'], string> = {
  medicine: 'Medicine',
  vitamins: 'Vitamins',
  beauty: 'Beauty',
  hygiene: 'Hygiene',
  'medical-devices': 'Medical devices',
  other: 'Other',
};

//===================================================================

function formatPriceRange(offers: ProductOffer[]): string {
  const availableOffers = offers.filter(
    (offer) => offer.inStock && Number.isFinite(offer.price)
  );

  if (availableOffers.length === 0) return 'No pharmacy prices yet';

  const prices = availableOffers.map((offer) => offer.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) return formatPrice(minPrice);

  return `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`;
}

//===================================================================

function ProductCard({
  product,
  skipFavoriteRefresh = false,
  onFavoriteChange,
}: ProductCardProps) {
  const { token, isAuthenticated } = useAuth();
  const toast = useToast();

  const {
    isAuthReady,
    isFavorite,
    isFavoriteLoading,
    handleFavoriteClick,
    setIsFavorite,
  } = useFavoriteToggle({
    id: product.id,
    initialIsFavorite: Boolean(product.isFavorite),
    notifier: toast,
    loginMessage: 'Please log in to add products to favorites.',
    addedMessage: 'Product was added to favorites.',
    removedMessage: 'Product was removed from favorites.',
    errorMessage: 'Could not update favorites.',
    toggleFavorite: toggleFavoriteProduct,
    onFavoriteChange,
  });

  const productHref = buildProductPath(product.name, product.id);

  const priceRangeLabel = useMemo(
    () => formatPriceRange(product.offers),
    [product.offers]
  );

  const refreshFavorite = useCallback(
    async (currentToken: string) => {
      const response = await getProductDetails(product.id, currentToken);

      return Boolean(response.product.isFavorite);
    },
    [product.id]
  );

  useFavoriteRefresh({
    isEnabled: !skipFavoriteRefresh && isAuthenticated,
    token,
    refreshFavorite,
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
            disabled={isFavoriteLoading || !isAuthReady}
            onClick={handleFavoriteClick}
            activeLabel="Remove product from favorites"
            inactiveLabel="Add product to favorites"
          />
        </div>
      </div>

      <div className={css.content}>
        <div className={css.metaRow}>
          <span className={css.category}>
            {CATEGORY_LABELS[product.category]}
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
            <dd>{formatPharmaciesCount(product.foundInStoresCount)}</dd>
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
