'use client';

import { useMemo, useState } from 'react';
import { Clock, Mail, MapPin, Phone, ShoppingBag } from 'lucide-react';

import {
  ButtonLink,
  Container,
  CountLabel,
  RatingSummary,
  ShimmerImage,
  SvgIcon,
  Tabs,
} from '@e-pharmacy/ui/common';

import { type TabItem } from '@e-pharmacy/ui/common';
import { FavoriteToggleButton, ReviewsSection } from '@/components/common';
import { Breadcrumbs } from '@e-pharmacy/ui/layout';
import { useToast } from '@e-pharmacy/ui/feedback';

import {
  useFavoriteToggle,
  useReviewForm,
  useStoreFavoriteRefresh,
} from '@/hooks';

import { buildMedicinesCatalogPath } from '@/lib/catalog/medicines-catalog';
import { ROUTES } from '@e-pharmacy/config/routes';

import { formatAvailableProductsCount } from '@e-pharmacy/utils/formatters';

import { USER_REVIEW_COMMENT_MAX_LENGTH } from '@e-pharmacy/validation';
import { useAuth } from '@/providers';

import {
  createStoreReview,
  toggleFavoriteStore,
} from '@e-pharmacy/api-client/client';

import type { Store, StoreReview } from '@e-pharmacy/types';

import css from './StoreDetailsPageContent.module.css';

//===================================================================

type StoreTab = 'details' | 'payment' | 'about' | 'reviews';

//===================================================================

type StoreDetailsPageContentProps = {
  store: Store;
  reviews: StoreReview[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
};

//===================================================================

function StoreDetailsPageContent({
  store,
  reviews,
  reviewsTotal,
  areReviewsUnavailable = false,
}: StoreDetailsPageContentProps) {
  const { sessionMarker, isAuthenticated, isAuthReady } = useAuth();

  const [activeTab, setActiveTab] = useState<StoreTab>('details');
  const toast = useToast();

  const tabs = useMemo<TabItem<StoreTab>[]>(
    () => [
      { value: 'details', label: 'Details' },
      ...(isAuthenticated
        ? [{ value: 'payment' as const, label: 'Payment details' }]
        : []),
      { value: 'about', label: 'About pharmacy' },
      { value: 'reviews', label: `Reviews (${reviewsTotal})` },
    ],
    [isAuthenticated, reviewsTotal]
  );

  const medicinesHref = buildMedicinesCatalogPath({ storeId: store.id }, [
    store,
  ]);

  const bankDetails = store.bankDetails ?? null;
  const workingHours = store.workingHours?.trim() ?? '';

  const { isFavorite, isFavoriteLoading, handleFavoriteClick, setIsFavorite } =
    useFavoriteToggle({
      id: store.id,
      initialIsFavorite: Boolean(store.isFavorite),
      notifier: toast,
      loginMessage: 'Please log in to add pharmacies to favorites.',
      addedMessage: 'Pharmacy was added to favorites.',
      removedMessage: 'Pharmacy was removed from favorites.',
      errorMessage: 'Could not update pharmacy favorites.',
      toggleFavorite: toggleFavoriteStore,
    });

  useStoreFavoriteRefresh({
    id: store.id,
    isEnabled: isAuthenticated,
    sessionMarker,
    onRefresh: setIsFavorite,
  });

  const {
    reviewText,
    reviewRating,
    reviewErrors,
    reviewTouchedFields,
    isReviewValid,
    isReviewSubmitting,
    handleReviewTextChange,
    handleReviewRatingChange,
    handleReviewSubmit,
  } = useReviewForm({
    createReview: (payload) => createStoreReview(store.id, payload),
    notifier: toast,
  });

  const handleEmailCopy = async () => {
    if (!store.email) return;

    try {
      await navigator.clipboard.writeText(store.email);
      toast.success('Email copied.');
    } catch {
      toast.error('Could not copy email.');
    }
  };

  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby="store-title">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Pharmacy stores', href: ROUTES.STORES },
              { label: store.name },
            ]}
            includeStructuredData
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

          {activeTab === 'details' ? (
            <div className={css.grid}>
              <div className={css.imageCard}>
                {store.imageUrl ? (
                  <ShimmerImage
                    className={css.image}
                    src={store.imageUrl}
                    alt={`${store.name} pharmacy storefront`}
                    priority
                    fetchPriority="high"
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

                  {store.email ? (
                    <div className={css.summaryItem}>
                      <dt>
                        <Mail size={18} aria-hidden="true" />
                        Email
                      </dt>
                      <dd>
                        <button
                          className={css.copyEmailButton}
                          type="button"
                          onClick={handleEmailCopy}
                        >
                          {store.email}
                        </button>
                      </dd>
                    </div>
                  ) : null}

                  {workingHours ? (
                    <div className={css.summaryItem}>
                      <dt>
                        <Clock size={18} aria-hidden="true" />
                        Working hours
                      </dt>
                      <dd>{workingHours}</dd>
                    </div>
                  ) : null}

                  <div className={css.summaryItem}>
                    <dt>
                      <ShoppingBag size={18} aria-hidden="true" />
                      Medicines
                    </dt>
                    <dd>
                      {formatAvailableProductsCount(
                        store.availableProductsCount
                      )}
                    </dd>
                  </div>
                </dl>

                <ButtonLink className={css.link} href={medicinesHref}>
                  View medicines from this pharmacy
                </ButtonLink>
              </div>
            </div>
          ) : null}
        </Container>
      </section>

      {activeTab === 'payment' && isAuthenticated ? (
        <section className={css.tabSection} aria-live="polite">
          <Container>
            <div className={css.panel}>
              <h2 className={css.panelTitle}>Payment details</h2>

              {bankDetails ? (
                <dl className={css.paymentList}>
                  <div>
                    <dt>Recipient</dt>
                    <dd>{bankDetails.recipientName}</dd>
                  </div>
                  <div>
                    <dt>EDRPOU / Tax ID</dt>
                    <dd>{bankDetails.taxId}</dd>
                  </div>
                  <div>
                    <dt>IBAN</dt>
                    <dd>{bankDetails.iban}</dd>
                  </div>
                  <div>
                    <dt>Bank</dt>
                    <dd>{bankDetails.bankName}</dd>
                  </div>
                  <div>
                    <dt>Payment purpose</dt>
                    <dd>{bankDetails.paymentPurpose}</dd>
                  </div>
                </dl>
              ) : (
                <p className={css.notice}>
                  Bank details are unavailable because the pharmacy has not
                  provided them yet.
                </p>
              )}
            </div>
          </Container>
        </section>
      ) : null}

      {activeTab === 'about' ? (
        <section className={css.tabSection} aria-live="polite">
          <Container>
            <div className={css.panel}>
              <div className={css.sectionHeader}>
                <h2 className={css.panelTitle}>About {store.name}</h2>
              </div>

              <p className={css.descriptionText}>
                {store.description ??
                  `${store.name} is an active E-PHARMACY partner in ${store.city ?? 'your city'}, created for customers who want to compare medicines calmly before placing an order. The pharmacy page brings together the most useful details: address, phone, email, working hours, rating, customer reviews, and a direct catalog link with medicines from this exact store. You can quickly check whether the needed product is available, compare offers, and decide whether pickup or delivery will be more convenient. The store keeps product information clear, so customers do not have to jump between random tabs, screenshots, and notes. Reviews help you understand service quality, while the catalog filter helps you move from pharmacy details straight to the right medicine list. It is a practical page for everyday orders, urgent purchases, planned family medicine refills, and simple price comparison. In short, ${store.name} works like a tidy digital pharmacy counter: all important information is visible, the next action is obvious, and the shopping flow stays friendly instead of turning into a mini quest with a white coat.`}
              </p>
            </div>
          </Container>
        </section>
      ) : null}

      {activeTab === 'reviews' ? (
        <section className={css.tabSection} aria-live="polite">
          <Container>
            <div className={css.panel}>
              <div className={css.sectionHeader}>
                <h2 className={css.panelTitle}>Reviews</h2>
                <CountLabel
                  visibleCount={reviews.length}
                  totalCount={reviewsTotal}
                  singularLabel="review"
                />
              </div>

              <ReviewsSection
                reviews={reviews}
                reviewText={reviewText}
                reviewRating={reviewRating}
                isReviewValid={isReviewValid}
                reviewError={reviewErrors.comment}
                reviewTouchedFields={reviewTouchedFields}
                isReviewSubmitting={isReviewSubmitting}
                isAuthenticated={isAuthenticated}
                isAuthReady={isAuthReady}
                isUnavailable={areReviewsUnavailable}
                emptyText="Pharmacy reviews will appear here after customers share their feedback."
                textareaId="store-review"
                maxLength={USER_REVIEW_COMMENT_MAX_LENGTH}
                onReviewTextChange={handleReviewTextChange}
                onReviewRatingChange={handleReviewRatingChange}
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
