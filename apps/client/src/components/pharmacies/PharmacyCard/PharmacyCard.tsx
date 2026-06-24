'use client';

import {
  ButtonLink,
  RatingSummary,
  ShimmerImage,
  SvgIcon,
} from '@e-pharmacy/ui/common';

import { useToast } from '@e-pharmacy/ui/feedback';
import { formatAvailableProductsCount } from '@e-pharmacy/utils/formatters';
import { useAuth } from '@e-pharmacy/auth/core';
import type { Pharmacy } from '@e-pharmacy/types';

import { addFavoritePharmacy, removeFavoritePharmacy } from '@/lib/api/browser';
import { buildProductCatalogPath } from '@/lib/catalog/product-catalog';
import { buildPharmacyPath } from '@/lib/routes';

import {
  invalidateFavoritePharmacyIdsCache,
  useFavoriteActions,
  usePharmacyFavoriteRefresh,
} from '@/hooks';

import { FavoriteToggleButton } from '@/components/common';

import css from './PharmacyCard.module.css';

//===================================================================

type PharmacyCardProps = {
  pharmacy: Pharmacy;
  skipFavoriteRefresh?: boolean;
  onFavoriteChange?: (pharmacyId: string, isFavorite: boolean) => void;
};

//===================================================================

function PharmacyCard({
  pharmacy,
  skipFavoriteRefresh = false,
  onFavoriteChange,
}: PharmacyCardProps) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const {
    isAuthReady,
    isFavorite,
    isFavoriteLoading,
    handleFavoriteClick,
    setIsFavorite,
  } = useFavoriteActions({
    id: pharmacy.id,
    initialIsFavorite: Boolean(pharmacy.isFavorite),
    notifier: toast,
    loginMessage: 'Please log in to add pharmacies to favorites.',
    addedMessage: 'Pharmacy was added to favorites.',
    removedMessage: 'Pharmacy was removed from favorites.',
    errorMessage: 'Could not update pharmacy favorites.',
    addFavorite: addFavoritePharmacy,
    removeFavorite: removeFavoritePharmacy,
    onFavoriteChange: (pharmacyId, nextIsFavorite) => {
      invalidateFavoritePharmacyIdsCache();
      onFavoriteChange?.(pharmacyId, nextIsFavorite);
    },
  });

  const productsHref = buildProductCatalogPath({ pharmacyId: pharmacy.id }, [
    pharmacy,
  ]);
  const pharmacyHref = buildPharmacyPath(pharmacy.name, pharmacy.id);

  usePharmacyFavoriteRefresh({
    id: pharmacy.id,
    isEnabled: !skipFavoriteRefresh && isAuthReady && isAuthenticated,
    onRefresh: setIsFavorite,
  });

  return (
    <article
      className={css.card}
      aria-labelledby={`pharmacy-${pharmacy.id}-title`}
    >
      <div className={css.imageWrap}>
        {pharmacy.imageUrl ? (
          <ShimmerImage
            className={css.image}
            src={pharmacy.imageUrl}
            alt={`${pharmacy.name} pharmacy storefront`}
            sizes="(max-width: 767px) 100vw, (max-width: 1439px) 50vw, 33vw"
          />
        ) : (
          <div className={css.imageFallback} aria-hidden="true">
            <SvgIcon name="icon-map-pin" size={34} />
          </div>
        )}

        <div className={css.favoriteWrap}>
          <FavoriteToggleButton
            isActive={isFavorite}
            disabled={isFavoriteLoading}
            onClick={handleFavoriteClick}
            activeLabel="Remove pharmacy from favorites"
            inactiveLabel="Add pharmacy to favorites"
          />
        </div>
      </div>

      <div className={css.content}>
        <div className={css.metaRow}>
          {pharmacy.city ? (
            <span className={css.city}>{pharmacy.city}</span>
          ) : null}

          <RatingSummary
            className={css.ratingSummary}
            rating={pharmacy.rating}
            reviewsCount={pharmacy.reviewsCount ?? 0}
            size="sm"
          />
        </div>

        <h2 className={css.title} id={`pharmacy-${pharmacy.id}-title`}>
          {pharmacy.name}
        </h2>

        <dl className={css.summaryList}>
          <div className={css.summaryItem}>
            <dt>Address</dt>
            <dd>{pharmacy.address}</dd>
          </div>

          {pharmacy.phone ? (
            <div className={css.summaryItem}>
              <dt>Phone</dt>
              <dd>
                <a className={css.phoneLink} href={`tel:${pharmacy.phone}`}>
                  {pharmacy.phone}
                </a>
              </dd>
            </div>
          ) : null}

          <div className={css.summaryItem}>
            <dt>Products</dt>
            <dd>
              {formatAvailableProductsCount(pharmacy.availableProductsCount)}
            </dd>
          </div>
        </dl>

        <div className={css.footer}>
          <ButtonLink
            className={css.detailsLink}
            href={pharmacyHref}
            size="sm"
            variant="secondary"
          >
            View details
          </ButtonLink>

          <ButtonLink className={css.detailsLink} href={productsHref} size="sm">
            Products
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

export default PharmacyCard;
