'use client';

import { LinkButton } from '@e-pharmacy/ui/navigation';
import { RatingSummary } from '@e-pharmacy/ui/data-display';
import { useToast } from '@e-pharmacy/ui/feedback';
import { formatAvailableProductsCount } from '@e-pharmacy/utils/numbers';
import type { PharmacyCardSummary } from '@e-pharmacy/types/pharmacies';

import { buildProductCatalogPath } from '@/lib/catalog/product-catalog';

import {
  getFavoriteActionCopy,
  shouldRenderFavoriteControl,
} from '@/lib/favorites/favorite-presentation';

import { buildPharmacyPath } from '@/lib/routes';

import { useClientAuthCapabilities, useFavoriteActions } from '@/hooks';

import CatalogEntityCard, {
  type CatalogCardHeadingLevel,
} from '@/components/catalog/CatalogEntityCard/CatalogEntityCard';

import { FavoriteToggleButton } from '@/components/common';

import css from './PharmacyCard.module.css';

//===================================================================

export type PharmacyCardProps = Readonly<{
  pharmacy: PharmacyCardSummary;
  headingLevel?: CatalogCardHeadingLevel;
  onFavoriteChange?: (pharmacyId: string, isFavorite: boolean) => void;
}>;

//===================================================================

function PharmacyCard({
  pharmacy,
  headingLevel = 2,
  onFavoriteChange,
}: PharmacyCardProps) {
  const authCapabilities = useClientAuthCapabilities();
  const toast = useToast();
  const favoriteCopy = getFavoriteActionCopy('pharmacy');

  const { isFavorite, isFavoriteLoading, isFavoritePending, toggleFavorite } =
    useFavoriteActions({
      entityType: 'pharmacy',
      id: pharmacy.id,
      notifier: toast,
      ...favoriteCopy,
      onFavoriteChange: (pharmacyId, nextIsFavorite) => {
        onFavoriteChange?.(pharmacyId, nextIsFavorite);
      },
    });

  const productsHref = buildProductCatalogPath({ pharmacyId: pharmacy.id }, [
    pharmacy,
  ]);

  const pharmacyHref = buildPharmacyPath(
    pharmacy.name,
    pharmacy.id,
    pharmacy.publicSlugId
  );

  return (
    <CatalogEntityCard
      title={pharmacy.name}
      headingLevel={headingLevel}
      image={{
        src: pharmacy.imageUrl,
        alt: `${pharmacy.name} image`,
        fallbackIcon: 'icon-map-pin',
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
            activeLabel="Remove pharmacy from favorites"
            inactiveLabel="Add pharmacy to favorites"
          />
        ) : undefined
      }
      metaStart={
        pharmacy.city ? <span className={css.city}>{pharmacy.city}</span> : null
      }
      metaEnd={
        <RatingSummary
          className={css.ratingSummary}
          rating={pharmacy.rating}
          reviewsCount={pharmacy.reviewsCount}
          size="sm"
        />
      }
      summaryItems={
        <>
          <div>
            <dt>Address</dt>
            <dd>{pharmacy.address ?? 'Not specified'}</dd>
          </div>

          {pharmacy.phone ? (
            <div>
              <dt>Phone</dt>
              <dd>
                <a className={css.phoneLink} href={`tel:${pharmacy.phone}`}>
                  {pharmacy.phone}
                </a>
              </dd>
            </div>
          ) : null}

          <div>
            <dt>Products</dt>
            <dd>
              {formatAvailableProductsCount(pharmacy.availableProductsCount) ??
                '—'}
            </dd>
          </div>
        </>
      }
      footer={
        <>
          <LinkButton
            className={css.detailsLink}
            href={pharmacyHref}
            size="sm"
            variant="secondary"
          >
            View details
          </LinkButton>

          <LinkButton className={css.detailsLink} href={productsHref} size="sm">
            Products
          </LinkButton>
        </>
      }
    />
  );
}

export default PharmacyCard;
