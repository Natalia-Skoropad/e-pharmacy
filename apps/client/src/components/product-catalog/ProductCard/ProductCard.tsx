'use client';

import { LinkButton } from '@e-pharmacy/ui/navigation';
import { RatingSummary } from '@e-pharmacy/ui/data-display';
import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/presentation';
import { formatPharmaciesCount } from '@e-pharmacy/utils/numbers';
import { formatMoneyRange } from '@e-pharmacy/utils/money';
import { useToast } from '@e-pharmacy/ui/feedback';
import type { ProductCardSummary } from '@e-pharmacy/types/products';

import { useClientAuthCapabilities, useFavoriteActions } from '@/hooks';

import {
  getFavoriteActionCopy,
  shouldRenderFavoriteControl,
} from '@/lib/favorites/favorite-presentation';

import { buildProductPath } from '@/lib/routes';

import CatalogEntityCard, {
  type CatalogCardHeadingLevel,
} from '@/components/catalog/CatalogEntityCard/CatalogEntityCard';

import { FavoriteToggleButton } from '@/components/common';

import css from './ProductCard.module.css';

//===================================================================

export type ProductCardProps = Readonly<{
  product: ProductCardSummary;
  headingLevel?: CatalogCardHeadingLevel;
  onFavoriteChange?: (productId: string, isFavorite: boolean) => void;
}>;

//===================================================================

function ProductCard({
  product,
  headingLevel = 2,
  onFavoriteChange,
}: ProductCardProps) {
  const authCapabilities = useClientAuthCapabilities();
  const toast = useToast();
  const favoriteCopy = getFavoriteActionCopy('product');

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
  const priceRangeLabel =
    product.minPrice !== null && product.maxPrice !== null
      ? (formatMoneyRange({ min: product.minPrice, max: product.maxPrice }) ??
        '—')
      : 'No pharmacy prices yet';

  return (
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

          {isAvailable ? (
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
            <p className={css.unavailableStatus}>Not available in pharmacies</p>
          )}

          <LinkButton className={css.detailsLink} href={productHref} size="sm">
            Details
          </LinkButton>
        </>
      }
    />
  );
}

export default ProductCard;
