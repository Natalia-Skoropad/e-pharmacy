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

import {
  DEFAULT_VISIBLE_REVIEWS_COUNT,
  FavoriteToggleButton,
  ReviewsSection,
} from '@/components/common';

import { Breadcrumbs } from '@e-pharmacy/ui/layout';
import { useToast } from '@e-pharmacy/ui/feedback';

import {
  useFavoriteActions,
  useReviewForm,
  usePharmacyFavoriteRefresh,
} from '@/hooks';

import { buildProductCatalogPath } from '@/lib/catalog/product-catalog';
import { ROUTES } from '@e-pharmacy/config/routes';
import { formatAvailableProductsCount } from '@e-pharmacy/utils/formatters';
import { USER_REVIEW_COMMENT_MAX_LENGTH } from '@e-pharmacy/validation';
import { useAuth } from '@e-pharmacy/auth/core';

import {
  createPharmacyReview,
  addFavoritePharmacy,
  removeFavoritePharmacy,
} from '@e-pharmacy/api-client/client';

import type { Pharmacy, PharmacyReview } from '@e-pharmacy/types';

import css from './PharmacyDetailsPageContent.module.css';

//===================================================================

type PharmacyTab = 'details' | 'payment' | 'about' | 'reviews';

//===================================================================

type PharmacyDetailsPageContentProps = {
  pharmacy: Pharmacy;
  reviews: PharmacyReview[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
};

//===================================================================

function PharmacyDetailsPageContent({
  pharmacy,
  reviews,
  reviewsTotal,
  areReviewsUnavailable = false,
}: PharmacyDetailsPageContentProps) {
  const { isAuthenticated, isAuthReady } = useAuth();

  const [activeTab, setActiveTab] = useState<PharmacyTab>('details');
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(
    DEFAULT_VISIBLE_REVIEWS_COUNT
  );
  const toast = useToast();

  const tabs = useMemo<TabItem<PharmacyTab>[]>(
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

  const productsHref = buildProductCatalogPath({ pharmacyId: pharmacy.id }, [
    pharmacy,
  ]);

  const bankDetails = pharmacy.bankDetails ?? null;
  const workingHours = pharmacy.workingHours?.trim() ?? '';

  const { isFavorite, isFavoriteLoading, handleFavoriteClick, setIsFavorite } =
    useFavoriteActions({
      id: pharmacy.id,
      initialIsFavorite: Boolean(pharmacy.isFavorite),
      notifier: toast,
      loginMessage: 'Please log in to add pharmacies to favorites.',
      addedMessage: 'Pharmacy was added to favorites.',
      removedMessage: 'Pharmacy was removed from favorites.',
      errorMessage: 'Could not update pharmacy favorites.',
      addFavorite: addFavoritePharmacy,
      removeFavorite: removeFavoritePharmacy,
    });

  usePharmacyFavoriteRefresh({
    id: pharmacy.id,
    isEnabled: isAuthReady && isAuthenticated,
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
    createReview: (payload) => createPharmacyReview(pharmacy.id, payload),
    notifier: toast,
  });

  const handleEmailCopy = async () => {
    if (!pharmacy.email) return;

    try {
      await navigator.clipboard.writeText(pharmacy.email);
      toast.success('Email copied.');
    } catch {
      toast.error('Could not copy email.');
    }
  };

  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby="pharmacy-title">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Pharmacies', href: ROUTES.PHARMACIES },
              { label: pharmacy.name },
            ]}
            includeStructuredData
          />

          <h1 className="visually-hidden" id="pharmacy-title">
            {pharmacy.name} pharmacy pharmacy — address, products and reviews
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
                {pharmacy.imageUrl ? (
                  <ShimmerImage
                    className={css.image}
                    src={pharmacy.imageUrl}
                    alt={`${pharmacy.name} pharmacy storefront`}
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
                  <p className={css.kicker}>
                    {pharmacy.city ?? 'Pharmacy pharmacy'}
                  </p>

                  <FavoriteToggleButton
                    isActive={isFavorite}
                    disabled={isFavoriteLoading || !isAuthReady}
                    onClick={handleFavoriteClick}
                    activeLabel="Remove pharmacy from favorites"
                    inactiveLabel="Add pharmacy to favorites"
                  />
                </div>

                <h2 className={css.title}>{pharmacy.name}</h2>

                <RatingSummary
                  className={css.ratingRow}
                  rating={pharmacy.rating}
                  reviewsCount={reviewsTotal}
                />

                <dl className={css.summaryList}>
                  <div className={css.summaryItem}>
                    <dt>
                      <MapPin size={18} aria-hidden="true" />
                      Address
                    </dt>
                    <dd>{pharmacy.address}</dd>
                  </div>

                  {pharmacy.phone ? (
                    <div className={css.summaryItem}>
                      <dt>
                        <Phone size={18} aria-hidden="true" />
                        Phone
                      </dt>
                      <dd>
                        <a href={`tel:${pharmacy.phone}`}>{pharmacy.phone}</a>
                      </dd>
                    </div>
                  ) : null}

                  {pharmacy.email ? (
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
                          {pharmacy.email}
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
                      Products
                    </dt>
                    <dd>
                      {formatAvailableProductsCount(
                        pharmacy.availableProductsCount
                      )}
                    </dd>
                  </div>
                </dl>

                <ButtonLink className={css.link} href={productsHref}>
                  View products from this pharmacy
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
                <h2 className={css.panelTitle}>About {pharmacy.name}</h2>
              </div>

              <p className={css.descriptionText}>
                {pharmacy.description ??
                  `${pharmacy.name} is an active E-PHARMACY partner in ${pharmacy.city ?? 'your city'}, created for clients who want to compare products calmly before placing an order. The pharmacy page brings together the most useful details: address, phone, email, working hours, rating, client reviews, and a direct catalog link with products from this exact pharmacy. You can quickly check whether the needed product is available, compare offers, and decide whether pickup or delivery will be more convenient. The pharmacy keeps product information clear, so clients do not have to jump between random tabs, screenshots, and notes. Reviews help you understand service quality, while the catalog filter helps you move from pharmacy details straight to the right product list. It is a practical page for everyday orders, urgent purchases, planned family medicine refills, and simple price comparison. In short, ${pharmacy.name} works like a tidy digital pharmacy counter: all important information is visible, the next action is obvious, and the shopping flow stays friendly instead of turning into a mini quest with a white coat.`}
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
                  shown={Math.min(visibleReviewsCount, reviews.length)}
                  total={reviewsTotal}
                  label="reviews"
                />
              </div>

              <ReviewsSection
                reviews={reviews}
                visibleCount={visibleReviewsCount}
                onVisibleCountChange={setVisibleReviewsCount}
                reviewText={reviewText}
                reviewRating={reviewRating}
                isReviewValid={isReviewValid}
                reviewError={reviewErrors.comment}
                reviewTouchedFields={reviewTouchedFields}
                isReviewSubmitting={isReviewSubmitting}
                isAuthenticated={isAuthenticated}
                isAuthReady={isAuthReady}
                isUnavailable={areReviewsUnavailable}
                emptyText="Pharmacy reviews will appear here after clients share their feedback."
                textareaId="pharmacy-review"
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

export default PharmacyDetailsPageContent;
