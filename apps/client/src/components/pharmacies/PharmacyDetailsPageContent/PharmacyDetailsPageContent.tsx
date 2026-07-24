'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Clock, Mail, MapPin, Phone, ShoppingBag } from 'lucide-react';

import {
  DEFAULT_VISIBLE_REVIEWS_COUNT,
  CountLabel,
  RatingSummary,
} from '@e-pharmacy/ui/data-display';

import { SvgIcon } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { Tabs } from '@e-pharmacy/ui/navigation';
import { type TabItem } from '@e-pharmacy/ui/navigation';
import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs } from '@e-pharmacy/ui/navigation';
import { useToast } from '@e-pharmacy/ui/feedback';
import { formatAvailableProductsCount } from '@e-pharmacy/utils/numbers';
import { getWorkingHoursDisplayItems } from '@e-pharmacy/validation/pharmacy';
import { USER_REVIEW_COMMENT_MAX_LENGTH } from '@e-pharmacy/validation/reviews';

import type {
  PublicPharmacy,
  PublicPaymentBankDetails,
} from '@e-pharmacy/types/pharmacies';

import type { Review } from '@e-pharmacy/types/reviews';

import {
  useClientAuthCapabilities,
  useFavoriteActions,
  useReviewForm,
  usePharmacyFavoriteRefresh,
  invalidateFavoritePharmacyIdsCache,
} from '@/hooks';

import { buildProductCatalogPath } from '@/lib/catalog/product-catalog';
import { ROUTES } from '@/lib/routes';

import {
  createPharmacyReview,
  addFavoritePharmacy,
  removeFavoritePharmacy,
  getPharmacyCheckoutDetails,
} from '@/lib/api/browser';

import { FavoriteToggleButton, ReviewsSection } from '@/components/common';

import css from './PharmacyDetailsPageContent.module.css';

//===================================================================

type PharmacyTab = 'details' | 'payment' | 'about' | 'reviews';

//===================================================================

type PharmacyDetailsPageContentProps = {
  pharmacy: PublicPharmacy;
  reviews: Review[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
};

//===================================================================

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

//===================================================================

function normalizeDescriptionMarkdown(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\s+-\s+/g, '\n- ')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

//===================================================================

function renderDescriptionMarkdown(text: string) {
  const lines = normalizeDescriptionMarkdown(text);
  const nodes: ReactNode[] = [];
  let paragraphLines: string[] = [];
  let listLines: string[] = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;

    const content = paragraphLines.join(' ');
    nodes.push(
      <p className={css.descriptionParagraph} key={`paragraph-${nodes.length}`}>
        {renderInlineMarkdown(content)}
      </p>
    );
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listLines.length) return;

    nodes.push(
      <ul className={css.descriptionList} key={`list-${nodes.length}`}>
        {listLines.map((line, lineIndex) => (
          <li key={`${line}-${lineIndex}`}>
            {renderInlineMarkdown(line.slice(2).trim())}
          </li>
        ))}
      </ul>
    );
    listLines = [];
  };

  for (const line of lines) {
    if (line.startsWith('- ')) {
      flushParagraph();
      listLines.push(line);
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return nodes;
}

//===================================================================

function PharmacyDetailsPageContent({
  pharmacy,
  reviews,
  reviewsTotal,
  areReviewsUnavailable = false,
}: PharmacyDetailsPageContentProps) {
  const { isAuthenticated, isAuthReady, canUseClientFeatures } =
    useClientAuthCapabilities();

  const [activeTab, setActiveTab] = useState<PharmacyTab>('details');
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(
    DEFAULT_VISIBLE_REVIEWS_COUNT
  );
  const [bankDetails, setBankDetails] = useState<
    PublicPaymentBankDetails | null | undefined
  >(pharmacy.bankDetails);
  const bankDetailsRequestStatusRef = useRef<'idle' | 'loading' | 'done'>(
    pharmacy.bankDetails ? 'done' : 'idle'
  );
  const [isBankDetailsLoading, setIsBankDetailsLoading] = useState(false);
  const [areBankDetailsUnavailable, setAreBankDetailsUnavailable] =
    useState(false);
  const toast = useToast();

  const canShowBankDetailsTab = canUseClientFeatures;
  const currentTab: PharmacyTab =
    activeTab === 'payment' && !canShowBankDetailsTab ? 'details' : activeTab;

  const tabs = useMemo<TabItem<PharmacyTab>[]>(() => {
    const items: TabItem<PharmacyTab>[] = [
      { value: 'details', label: 'Details' },
    ];

    if (canShowBankDetailsTab) {
      items.push({ value: 'payment', label: 'Bank details' });
    }

    items.push(
      { value: 'about', label: 'About pharmacy' },
      { value: 'reviews', label: `Reviews (${reviewsTotal})` }
    );

    return items;
  }, [canShowBankDetailsTab, reviewsTotal]);

  const productsHref = buildProductCatalogPath({ pharmacyId: pharmacy.id }, [
    pharmacy,
  ]);

  const workingHours = pharmacy.workingHours?.trim() ?? '';
  const paymentDetails = bankDetails ?? pharmacy.bankDetails;
  const receiptEmail = pharmacy.email;

  useEffect(() => {
    if (currentTab !== 'payment') return;
    if (!canShowBankDetailsTab) return;
    if (paymentDetails || bankDetailsRequestStatusRef.current === 'done')
      return;

    let isCancelled = false;

    if (bankDetailsRequestStatusRef.current === 'idle') {
      bankDetailsRequestStatusRef.current = 'loading';

      queueMicrotask(() => {
        if (isCancelled) return;

        setIsBankDetailsLoading(true);
        setAreBankDetailsUnavailable(false);
      });
    }

    getPharmacyCheckoutDetails(pharmacy.id)
      .then((data) => {
        if (isCancelled) return;

        setBankDetails(data.pharmacy.bankDetails ?? null);
      })
      .catch(() => {
        if (isCancelled) return;

        setBankDetails(null);
        setAreBankDetailsUnavailable(true);
      })
      .finally(() => {
        if (isCancelled) return;

        bankDetailsRequestStatusRef.current = 'done';
        setIsBankDetailsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [canShowBankDetailsTab, currentTab, paymentDetails, pharmacy.id]);

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
      onFavoriteChange: () => invalidateFavoritePharmacyIdsCache(),
    });

  usePharmacyFavoriteRefresh({
    id: pharmacy.id,
    isEnabled: canUseClientFeatures,
    onRefresh: setIsFavorite,
  });

  const {
    reviewText,
    reviewRating,
    reviewErrors,
    reviewTouchedFields,
    isReviewValid,
    isReviewSubmitting,
    canSubmitReview,
    handleReviewTextChange,
    handleReviewRatingChange,
    handleReviewSubmit,
  } = useReviewForm({
    createReview: (payload) => createPharmacyReview(pharmacy.id, payload),
    notifier: toast,
    successMessage: 'Review was accepted and will be visible after moderation.',
    errorMessage: 'Could not submit review.',
    authRequiredMessage: 'Please log in to submit a review.',
  });

  const handleTabChange = (nextTab: PharmacyTab) => {
    if (nextTab === 'payment' && !canShowBankDetailsTab) {
      setActiveTab('details');
      return;
    }

    if (
      nextTab === 'payment' &&
      !paymentDetails &&
      bankDetailsRequestStatusRef.current === 'idle'
    ) {
      bankDetailsRequestStatusRef.current = 'loading';
      setIsBankDetailsLoading(true);
      setAreBankDetailsUnavailable(false);
    }

    setActiveTab(nextTab);
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  const handleEmailCopy = async () => {
    if (!receiptEmail) return;

    await handleCopy(receiptEmail, 'Email');
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
            activeValue={currentTab}
            ariaLabel="Pharmacy information tabs"
            onChange={handleTabChange}
          />

          {currentTab === 'details' ? (
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

                  {isAuthReady && (!isAuthenticated || canUseClientFeatures) ? (
                    <FavoriteToggleButton
                      isActive={isFavorite}
                      disabled={isFavoriteLoading}
                      onClick={handleFavoriteClick}
                      activeLabel="Remove pharmacy from favorites"
                      inactiveLabel="Add pharmacy to favorites"
                    />
                  ) : null}
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

                  {receiptEmail ? (
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
                          {receiptEmail}
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
                      <dd className={css.workingHoursValue}>
                        {getWorkingHoursDisplayItems(workingHours)?.map(
                          (item) => (
                            <span key={item.day}>
                              <strong>{item.label}</strong>: {item.hours}
                            </span>
                          )
                        )}
                      </dd>
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

                <LinkButton className={css.link} href={productsHref}>
                  View products from this pharmacy
                </LinkButton>
              </div>
            </div>
          ) : null}
        </Container>
      </section>

      {currentTab === 'payment' ? (
        <section className={css.tabSection} aria-live="polite">
          <Container>
            <div className={css.panel}>
              <div className={css.sectionHeader}>
                <h2 className={css.panelTitle}>Bank details</h2>
              </div>

              {isBankDetailsLoading ? (
                <p className={css.notice}>Loading bank details...</p>
              ) : areBankDetailsUnavailable ? (
                <p className={css.notice}>
                  Bank details are temporarily unavailable. Please try again
                  later.
                </p>
              ) : paymentDetails ? (
                <dl className={css.paymentList}>
                  <div>
                    <dt>Recipient name</dt>
                    <dd>{paymentDetails.recipientName}</dd>
                  </div>

                  <div>
                    <dt>Tax ID / EDRPOU</dt>
                    <dd>{paymentDetails.taxId}</dd>
                  </div>

                  <div>
                    <dt>IBAN</dt>
                    <dd>
                      <button
                        className={css.copyValueButton}
                        type="button"
                        onClick={() =>
                          void handleCopy(paymentDetails.iban, 'IBAN')
                        }
                        aria-label="Copy IBAN"
                      >
                        {paymentDetails.iban}
                      </button>
                    </dd>
                  </div>

                  <div>
                    <dt>Bank name</dt>
                    <dd>{paymentDetails.bankName}</dd>
                  </div>

                  <div>
                    <dt>Payment purpose</dt>
                    <dd>{paymentDetails.paymentPurpose}</dd>
                  </div>

                  {receiptEmail ? (
                    <div>
                      <dt>Receipt email</dt>
                      <dd>
                        <button
                          className={css.copyValueButton}
                          type="button"
                          onClick={() => void handleCopy(receiptEmail, 'Email')}
                          aria-label="Copy receipt email"
                        >
                          {receiptEmail}
                        </button>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p className={css.notice}>
                  Bank details are not available for this pharmacy yet.
                </p>
              )}
            </div>
          </Container>
        </section>
      ) : null}

      {currentTab === 'about' ? (
        <section className={css.tabSection} aria-live="polite">
          <Container>
            <div className={css.panel}>
              <div className={css.sectionHeader}>
                <h2 className={css.panelTitle}>About {pharmacy.name}</h2>
              </div>

              <div className={css.descriptionText}>
                {renderDescriptionMarkdown(
                  pharmacy.description ??
                    `${pharmacy.name} is an active E-PHARMACY partner in ${pharmacy.city ?? 'your city'}, created for clients who want to compare products calmly before placing an order. The pharmacy page brings together the most useful details: address, phone, email, working hours, rating, client reviews, and a direct catalog link with products from this exact pharmacy. You can quickly check whether the needed product is available, compare offers, and decide whether pickup or delivery will be more convenient. The pharmacy keeps product information clear, so clients do not have to jump between random tabs, screenshots, and notes. Reviews help you understand service quality, while the catalog filter helps you move from pharmacy details straight to the right product list. It is a practical page for everyday orders, urgent purchases, planned family medicine refills, and simple price comparison. In short, ${pharmacy.name} works like a tidy digital pharmacy counter: all important information is visible, the next action is obvious, and the shopping flow stays friendly instead of turning into a mini quest with a white coat.`
                )}
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      {currentTab === 'reviews' ? (
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
                isAuthenticated={canSubmitReview}
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
