'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ButtonLink,
  FavoriteToggleButton,
  RatingSummary,
  ShimmerImage,
  SvgIcon,
  Toast,
} from '@/components/common';
import { useAuth } from '@/components/providers';

import { buildProductPath } from '@/lib/routes';

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

function formatPrice(price: number): string {
  return `${new Intl.NumberFormat('uk-UA', {
    maximumFractionDigits: 0,
  }).format(price)} грн`;
}

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

function getStoresCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'pharmacy' : 'pharmacies'}`;
}

//===================================================================

function ProductCard({
  product,
  skipFavoriteRefresh = false,
  onFavoriteChange,
}: ProductCardProps) {
  const { token, isAuthenticated, isAuthReady } = useAuth();

  const [toastMessage, setToastMessage] = useState('');
  const [isFavorite, setIsFavorite] = useState(Boolean(product.isFavorite));
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const productHref = buildProductPath(product.name, product.id);

  const priceRangeLabel = useMemo(
    () => formatPriceRange(product.offers),
    [product.offers]
  );

  const showToast = useCallback((message: string) => {
    setToastMessage('');
    window.setTimeout(() => setToastMessage(message), 0);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;

    const timeoutId = window.setTimeout(() => {
      setToastMessage('');
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  useEffect(() => {
    if (skipFavoriteRefresh || !isAuthenticated || !token) return;

    let isMounted = true;

    getProductDetails(product.id, token)
      .then((response) => {
        if (isMounted) setIsFavorite(Boolean(response.product.isFavorite));
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, product.id, skipFavoriteRefresh, token]);

  const handleFavoriteClick = async () => {
    if (!isAuthReady) return;

    if (!isAuthenticated || !token) {
      showToast('Please log in to add products to favorites.');
      return;
    }

    try {
      setIsFavoriteLoading(true);
      const response = await toggleFavoriteProduct(product.id, token);

      setIsFavorite(response.isFavorite);
      onFavoriteChange?.(product.id, response.isFavorite);
      showToast(
        response.isFavorite
          ? 'Product was added to favorites.'
          : 'Product was removed from favorites.'
      );
    } catch {
      showToast('Could not update favorites.');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  return (
    <article
      className={css.card}
      aria-labelledby={`product-${product.id}-title`}
    >
      <Toast message={toastMessage} isVisible={Boolean(toastMessage)} />

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

        <h3 className={css.title} id={`product-${product.id}-title`}>
          {product.name}
        </h3>

        <dl className={css.summaryList}>
          <div className={css.summaryItem}>
            <dt>Article</dt>
            <dd>{product.article}</dd>
          </div>

          <div className={css.summaryItem}>
            <dt>Found in pharmacies</dt>
            <dd>{getStoresCountLabel(product.foundInStoresCount)}</dd>
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
