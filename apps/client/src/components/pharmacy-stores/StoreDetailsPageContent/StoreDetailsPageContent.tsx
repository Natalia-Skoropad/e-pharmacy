'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin, Phone, ShoppingBag, Star } from 'lucide-react';

import {
  ButtonLink,
  Container,
  FavoriteToggleButton,
  RatingSummary,
  ReviewsSection,
  SvgIcon,
  Tabs,
  Toast,
  type TabItem,
} from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { useAuth } from '@/components/providers';

import { buildMedicinesCatalogPath } from '@/lib/catalog/medicines-catalog';
import { ROUTES } from '@/lib/constants/routes';
import { createStoreReview, getStoreDetails, toggleFavoriteStore } from '@/services';

import type { Store, StoreReview } from '@/types';

import css from './StoreDetailsPageContent.module.css';

//===================================================================

type StoreTab = 'about' | 'reviews';

type StoreDetailsPageContentProps = {
  store: Store;
  reviews: StoreReview[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
};

//===================================================================

const REVIEW_MAX_LENGTH = 500;
const REVIEW_MIN_LENGTH = 10;
const REVIEW_REGEX = /^[A-Za-z0-9\s.,!?;:'"()\-]+$/;

//===================================================================

function getProductsCountLabel(count = 0): string {
  return `${count} ${count === 1 ? 'product' : 'products'} available`;
}

function getReviewsCountLabel(count = 0): string {
  return count === 1 ? '1 review' : `${count} reviews`;
}

function getStoreDescription(store: Store): string {
  return (
    store.description ??
    `${store.name} is an online pharmacy store in the E-PHARMACY catalog. Customers can check address, phone number, rating, available medicines, and reviews before choosing where to reserve products.`
  );
}

//===================================================================

function StoreDetailsPageContent({
  store,
  reviews,
  reviewsTotal,
  areReviewsUnavailable = false,
}: StoreDetailsPageContentProps) {
  const { token, isAuthenticated, isAuthReady } = useAuth();

  const [activeTab, setActiveTab] = useState<StoreTab>('about');
  const [isFavorite, setIsFavorite] = useState(Boolean(store.isFavorite));
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  const tabs = useMemo<TabItem<StoreTab>[]>(
    () => [
      { value: 'about', label: 'About pharmacy' },
      { value: 'reviews', label: `Reviews (${reviewsTotal})` },
    ],
    [reviewsTotal]
  );

  const medicinesHref = buildMedicinesCatalogPath({ storeId: store.id }, [store]);
  const ratingLabel = store.rating ? store.rating.toFixed(1) : 'New';
  const reviewsCountLabel = getReviewsCountLabel(reviewsTotal);
  const isReviewValid =
    reviewText.trim().length >= REVIEW_MIN_LENGTH &&
    reviewText.trim().length <= REVIEW_MAX_LENGTH &&
    REVIEW_REGEX.test(reviewText.trim()) &&
    reviewRating >= 1 &&
    reviewRating <= 5;

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

  const handleReviewTextChange = (value: string) => {
    if (value.length > REVIEW_MAX_LENGTH) return;

    setReviewText(value);
  };

  const handleReviewSubmit = async () => {
    if (!isReviewValid || !isAuthenticated || !token) return;

    try {
      setIsReviewSubmitting(true);

      await createStoreReview(
        store.id,
        {
          rating: reviewRating,
          comment: reviewText.trim(),
        },
        token
      );

      setReviewText('');
      setReviewRating(0);
      showToast('Review was accepted and will be visible after moderation.');
    } catch {
      showToast('Could not submit review.');
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  return (
    <main className={css.page}>
      <Toast message={toastMessage} isVisible={Boolean(toastMessage)} />

      <section className={css.hero} aria-labelledby="store-title">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Pharmacy stores', href: ROUTES.STORES },
              { label: store.name },
            ]}
          />

          <h1 className="visually-hidden" id="store-title">
            {store.name} pharmacy store — address, medicines and reviews
          </h1>

          <Tabs
            items={tabs}
            activeValue={activeTab}
            ariaLabel="Pharmacy information tabs"
            onChange={setActiveTab}
          />

          {activeTab === 'about' ? (
            <div className={css.grid}>
              <div className={css.imageCard}>
                {store.imageUrl ? (
                  <Image
                    className={css.image}
                    src={store.imageUrl}
                    alt={`${store.name} pharmacy storefront`}
                    fill
                    priority
                    sizes="(max-width: 767px) 100vw, (max-width: 1439px) 50vw, 520px"
                  />
                ) : (
                  <div className={css.imageFallback} aria-hidden="true">
                    <SvgIcon name="icon-map-pin" size={52} />
                  </div>
                )}
              </div>

              <div className={css.content}>
                <div className={css.topLine}>
                  <p className={css.kicker}>{store.city ?? 'Pharmacy store'}</p>

                  <FavoriteToggleButton
                    isActive={isFavorite}
                    disabled={isFavoriteLoading || !isAuthReady}
                    onClick={handleFavoriteClick}
                    activeLabel="Remove pharmacy from favorites"
                    inactiveLabel="Add pharmacy to favorites"
                  />
                </div>

                <h2 className={css.title}>{store.name}</h2>

                <RatingSummary
                  className={css.ratingRow}
                  rating={store.rating}
                  reviewsCount={reviewsTotal}
                />

                <dl className={css.summaryList}>
                  <div className={css.summaryItem}>
                    <dt>
                      <MapPin size={18} aria-hidden="true" />
                      Address
                    </dt>
                    <dd>{store.address}</dd>
                  </div>

                  {store.phone ? (
                    <div className={css.summaryItem}>
                      <dt>
                        <Phone size={18} aria-hidden="true" />
                        Phone
                      </dt>
                      <dd>
                        <a href={`tel:${store.phone}`}>{store.phone}</a>
                      </dd>
                    </div>
                  ) : null}

                  <div className={css.summaryItem}>
                    <dt>
                      <ShoppingBag size={18} aria-hidden="true" />
                      Medicines
                    </dt>
                    <dd>{getProductsCountLabel(store.availableProductsCount)}</dd>
                  </div>

                  <div className={css.summaryItem}>
                    <dt>
                      <Star size={18} aria-hidden="true" />
                      Rating
                    </dt>
                    <dd>{ratingLabel}</dd>
                  </div>
                </dl>

                <p className={css.description}>{getStoreDescription(store)}</p>

                <ButtonLink className={css.link} href={medicinesHref}>
                  View medicines from this pharmacy
                </ButtonLink>
              </div>
            </div>
          ) : null}
        </Container>
      </section>

      {activeTab === 'reviews' ? (
        <section className={css.tabSection} aria-live="polite">
          <Container>
            <div className={css.panel}>
              <div className={css.sectionHeader}>
                <h2 className={css.panelTitle}>Reviews ({reviewsTotal})</h2>
                <p className={css.resultCount}>{reviewsCountLabel}</p>
              </div>

              <ReviewsSection
                reviews={reviews}
                reviewText={reviewText}
                reviewRating={reviewRating}
                isReviewValid={isReviewValid}
                isReviewSubmitting={isReviewSubmitting}
                isAuthenticated={isAuthenticated}
                isAuthReady={isAuthReady}
                isUnavailable={areReviewsUnavailable}
                emptyText="Pharmacy reviews will appear here after customers share their feedback."
                textareaId="store-review"
                maxLength={REVIEW_MAX_LENGTH}
                onReviewTextChange={handleReviewTextChange}
                onReviewRatingChange={setReviewRating}
                onReviewSubmit={() => void handleReviewSubmit()}
              />
            </div>
          </Container>
        </section>
      ) : null}
    </main>
  );
}

export default StoreDetailsPageContent;
