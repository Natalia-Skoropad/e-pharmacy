'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { MapPin, MessageSquareText, Phone, ShoppingBag, Star } from 'lucide-react';

import { ButtonLink, FavoriteToggleButton, SvgIcon, Toast } from '@/components/common';
import { useAuth } from '@/components/providers';

import { buildMedicinesCatalogPath } from '@/lib/catalog/medicines-catalog';
import { ROUTES } from '@/lib/constants/routes';
import { getStoreDetails, toggleFavoriteStore } from '@/services';

import type { Store } from '@/types';

import css from './StoreCard.module.css';

//===================================================================

type StoreCardProps = {
  store: Store;
};

//===================================================================

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function getProductsCountLabel(count = 0): string {
  return `${count} ${count === 1 ? 'product' : 'products'} available`;
}

function getReviewsCountLabel(count = 0): string {
  return `${count} ${count === 1 ? 'review' : 'reviews'}`;
}

//===================================================================

function StoreCard({ store }: StoreCardProps) {
  const { token, isAuthenticated, isAuthReady } = useAuth();

  const [isFavorite, setIsFavorite] = useState(Boolean(store.isFavorite));
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const medicinesHref = buildMedicinesCatalogPath(
    { storeId: store.id },
    [store]
  );
  const storeHref = `${ROUTES.STORES}/${slugify(store.name)}-${store.id}`;
  const ratingLabel = store.rating ? store.rating.toFixed(1) : 'New';

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
    if (!isAuthenticated || !token) return;

    let isMounted = true;

    getStoreDetails(store.id, token)
      .then((response) => {
        if (isMounted) setIsFavorite(Boolean(response.store.isFavorite));
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, store.id, token]);

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
          <Image
            className={css.image}
            src={store.imageUrl}
            alt={`${store.name} pharmacy storefront`}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1439px) 50vw, 33vw"
          />
        ) : (
          <div className={css.imageFallback} aria-hidden="true">
            <SvgIcon name="icon-map-pin" size={34} />
          </div>
        )}
      </div>

      <div className={css.content}>
        <div className={css.metaRow}>
          {store.city ? <span className={css.city}>{store.city}</span> : null}

          <div className={css.actionsRow}>
            <span
              className={css.rating}
              aria-label={`Store rating ${ratingLabel}`}
            >
              <Star size={15} aria-hidden="true" />
              {ratingLabel}
            </span>

            <FavoriteToggleButton
              isActive={isFavorite}
              disabled={isFavoriteLoading || !isAuthReady}
              onClick={handleFavoriteClick}
              activeLabel="Remove pharmacy from favorites"
              inactiveLabel="Add pharmacy to favorites"
            />
          </div>
        </div>

        <h2 className={css.title} id={`store-${store.id}-title`}>
          {store.name}
        </h2>

        <dl className={css.summaryList}>
          <div className={css.summaryItem}>
            <dt>
              <MapPin size={18} aria-hidden="true" />
              <span>Address</span>
            </dt>
            <dd>{store.address}</dd>
          </div>

          {store.phone ? (
            <div className={css.summaryItem}>
              <dt>
                <Phone size={18} aria-hidden="true" />
                <span>Phone</span>
              </dt>
              <dd>
                <a className={css.phoneLink} href={`tel:${store.phone}`}>
                  {store.phone}
                </a>
              </dd>
            </div>
          ) : null}

          <div className={css.summaryItem}>
            <dt>
              <ShoppingBag size={18} aria-hidden="true" />
              <span>Medicines</span>
            </dt>
            <dd>{getProductsCountLabel(store.availableProductsCount)}</dd>
          </div>

          <div className={css.summaryItem}>
            <dt>
              <MessageSquareText size={18} aria-hidden="true" />
              <span>Reviews</span>
            </dt>
            <dd>{getReviewsCountLabel(store.reviewsCount)}</dd>
          </div>
        </dl>

        <div className={css.footer}>
          <ButtonLink className={css.detailsLink} href={storeHref} size="sm">
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
