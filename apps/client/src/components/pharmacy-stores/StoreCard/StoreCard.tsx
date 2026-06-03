'use client';

import {
  ButtonLink,
  FavoriteToggleButton,
  RatingSummary,
  ShimmerImage,
  SvgIcon,
} from '@/components/common';

import { useToast } from '@e-pharmacy/hooks';

import { useFavoriteToggle, useStoreFavoriteRefresh } from '@/hooks';

import { buildMedicinesCatalogPath } from '@/lib/catalog/medicines-catalog';
import { buildStorePath } from '@/lib/routes';
import { formatAvailableProductsCount } from '@/lib/formatters';

import { useAuth } from '@/providers';
import { toggleFavoriteStore } from '@/services';
import type { Store } from '@/types';

import css from './StoreCard.module.css';

//===================================================================

type StoreCardProps = {
  store: Store;
  skipFavoriteRefresh?: boolean;
  onFavoriteChange?: (storeId: string, isFavorite: boolean) => void;
};

//===================================================================

function StoreCard({
  store,
  skipFavoriteRefresh = false,
  onFavoriteChange,
}: StoreCardProps) {
  const { sessionMarker, isAuthenticated } = useAuth();
  const toast = useToast();

  const {
    isAuthReady,
    isFavorite,
    isFavoriteLoading,
    handleFavoriteClick,
    setIsFavorite,
  } = useFavoriteToggle({
    id: store.id,
    initialIsFavorite: Boolean(store.isFavorite),
    notifier: toast,
    loginMessage: 'Please log in to add pharmacies to favorites.',
    addedMessage: 'Pharmacy was added to favorites.',
    removedMessage: 'Pharmacy was removed from favorites.',
    errorMessage: 'Could not update pharmacy favorites.',
    toggleFavorite: toggleFavoriteStore,
    onFavoriteChange,
  });

  const medicinesHref = buildMedicinesCatalogPath({ storeId: store.id }, [
    store,
  ]);
  const storeHref = buildStorePath(store.name, store.id);

  useStoreFavoriteRefresh({
    id: store.id,
    isEnabled: !skipFavoriteRefresh && isAuthenticated,
    sessionMarker,
    onRefresh: setIsFavorite,
  });

  return (
    <article className={css.card} aria-labelledby={`store-${store.id}-title`}>
      <div className={css.imageWrap}>
        {store.imageUrl ? (
          <ShimmerImage
            className={css.image}
            src={store.imageUrl}
            alt={`${store.name} pharmacy storefront`}
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
            disabled={isFavoriteLoading || !isAuthReady}
            onClick={handleFavoriteClick}
            activeLabel="Remove pharmacy from favorites"
            inactiveLabel="Add pharmacy to favorites"
          />
        </div>
      </div>

      <div className={css.content}>
        <div className={css.metaRow}>
          {store.city ? <span className={css.city}>{store.city}</span> : null}

          <RatingSummary
            className={css.ratingSummary}
            rating={store.rating}
            reviewsCount={store.reviewsCount ?? 0}
            size="sm"
          />
        </div>

        <h2 className={css.title} id={`store-${store.id}-title`}>
          {store.name}
        </h2>

        <dl className={css.summaryList}>
          <div className={css.summaryItem}>
            <dt>Address</dt>
            <dd>{store.address}</dd>
          </div>

          {store.phone ? (
            <div className={css.summaryItem}>
              <dt>Phone</dt>
              <dd>
                <a className={css.phoneLink} href={`tel:${store.phone}`}>
                  {store.phone}
                </a>
              </dd>
            </div>
          ) : null}

          <div className={css.summaryItem}>
            <dt>Medicines</dt>
            <dd>{formatAvailableProductsCount(store.availableProductsCount)}</dd>
          </div>
        </dl>

        <div className={css.footer}>
          <ButtonLink
            className={css.detailsLink}
            href={storeHref}
            size="sm"
            variant="secondary"
          >
            Store details
          </ButtonLink>

          <ButtonLink
            className={css.detailsLink}
            href={medicinesHref}
            size="sm"
          >
            Medicines
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

export default StoreCard;
