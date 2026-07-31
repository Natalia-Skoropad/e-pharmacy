'use client';

import { SvgIcon } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { RatingSummary } from '@e-pharmacy/ui/data-display';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { useToast } from '@e-pharmacy/ui/feedback';
import { formatAvailableProductsCount } from '@e-pharmacy/utils/numbers';
import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';

import { buildProductCatalogPath } from '@/lib/catalog/product-catalog';
import { buildPharmacyPath } from '@/lib/routes';

import { useClientAuthCapabilities, useFavoriteActions } from '@/hooks';
import { FavoriteToggleButton } from '@/components/common';

import css from './PharmacyCard.module.css';

//===================================================================

type PharmacyCardProps = {
  pharmacy: PublicPharmacy;
  onFavoriteChange?: (pharmacyId: string, isFavorite: boolean) => void;
};

//===================================================================

function PharmacyCard({ pharmacy, onFavoriteChange }: PharmacyCardProps) {
  const { isAuthenticated, isBootstrapping, canUseClientFeatures } =
    useClientAuthCapabilities();
  const toast = useToast();

  const {
    isFavorite,
    isFavoriteLoading,
    isFavoritePending,
    toggleFavorite,
  } = useFavoriteActions({
    entityType: 'pharmacy',
    id: pharmacy.id,
    notifier: toast,
    loginMessage: 'Please log in to add pharmacies to favorites.',
    unavailableMessage:
      'We could not verify your session. Please try again shortly.',
    clientAccountRequiredMessage:
      'Favorites are available only for active client accounts.',
    addedMessage: 'Pharmacy was added to favorites.',
    removedMessage: 'Pharmacy was removed from favorites.',
    errorMessage: 'Could not update pharmacy favorites.',
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

        {!isBootstrapping && (!isAuthenticated || canUseClientFeatures) ? (
          <div className={css.favoriteWrap}>
            <FavoriteToggleButton
              isActive={isFavorite}
              disabled={isFavoriteLoading}
              isPending={isFavoritePending}
              onClick={toggleFavorite}
              activeLabel="Remove pharmacy from favorites"
              inactiveLabel="Add pharmacy to favorites"
            />
          </div>
        ) : null}
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
              {formatAvailableProductsCount(pharmacy.availableProductsCount) ??
                '—'}
            </dd>
          </div>
        </dl>

        <div className={css.footer}>
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
        </div>
      </div>
    </article>
  );
}

export default PharmacyCard;
