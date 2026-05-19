'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  ButtonLink,
  FavoriteToggleButton,
  RatingSummary,
  ShimmerImage,
  SvgIcon,
  Toast,
} from '@/components/common';
import { useAuth } from '@/providers';

import { buildMedicinesCatalogPath } from '@/lib/catalog/medicines-catalog';
import { buildStorePath } from '@/lib/routes';
import { getStoreDetails, toggleFavoriteStore } from '@/services';

import type { Store } from '@/types';

import css from './StoreCard.module.css';

//===================================================================

type StoreCardProps = {
  store: Store;
  skipFavoriteRefresh?: boolean;
  onFavoriteChange?: (storeId: string, isFavorite: boolean) => void;
};

//===================================================================

function getProductsCountLabel(count = 0): string {
  return `${count} ${count === 1 ? 'product' : 'products'} available`;
}

//===================================================================

function StoreCard({
  store,
  skipFavoriteRefresh = false,
  onFavoriteChange,
}: StoreCardProps) {
  const { token, isAuthenticated, isAuthReady } = useAuth();

  const [isFavorite, setIsFavorite] = useState(Boolean(store.isFavorite));
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const medicinesHref = buildMedicinesCatalogPath({ storeId: store.id }, [
    store,
  ]);
  const storeHref = buildStorePath(store.name, store.id);

  const showToast = useCallback((message: string) => {
    setToastMessage('');
    window.setTimeout(() => setToastMessage(message), 0);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;

    const timeoutId = window.setTimeout(() => setToastMessage(''), 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  useEffect(() => {
    if (skipFavoriteRefresh || !isAuthenticated || !token) return;

    let isMounted = true;

    getStoreDetails(store.id, token)
      .then((response) => {
        if (isMounted) setIsFavorite(Boolean(response.store.isFavorite));
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, skipFavoriteRefresh, store.id, token]);

  const handleFavoriteClick = async () => {
    if (!isAuthReady) return;

    if (!isAuthenticated || !token) {
      showToast('Please log in to add pharmacies to favorites.');
      return;
    }

    try {
      setIsFavoriteLoading(true);
      const response = await toggleFavoriteStore(store.id, token);

      setIsFavorite(response.isFavorite);
      onFavoriteChange?.(store.id, response.isFavorite);
      showToast(
        response.isFavorite
          ? 'Pharmacy was added to favorites.'
          : 'Pharmacy was removed from favorites.'
      );
    } catch {
      showToast('Could not update pharmacy favorites.');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  return (
    <article className={css.card} aria-labelledby={`store-${store.id}-title`}>
      <Toast message={toastMessage} isVisible={Boolean(toastMessage)} />

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
            <dd>{getProductsCountLabel(store.availableProductsCount)}</dd>
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

          <ButtonLink className={css.detailsLink} href={medicinesHref} size="sm">
            View medicines
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

export default StoreCard;
