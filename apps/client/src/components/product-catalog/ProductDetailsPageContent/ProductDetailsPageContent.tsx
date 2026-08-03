'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Car, ChevronDown, ChevronUp, Filter, WalletCards } from 'lucide-react';

import {
  DEFAULT_VISIBLE_REVIEWS_COUNT,
  CountLabel,
  RatingSummary,
} from '@e-pharmacy/ui/data-display';

import { Button, LazyLoadButton, SvgIcon } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';

import {
  QuantityCounter,
  SearchInput,
  SearchableSelect,
  SelectField,
} from '@e-pharmacy/ui/forms';

import { ShimmerImage } from '@e-pharmacy/ui/media';
import { Tabs } from '@e-pharmacy/ui/navigation';

import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  PRODUCT_CATEGORY_LABELS,
} from '@e-pharmacy/config/presentation';

import { type TabItem } from '@e-pharmacy/ui/navigation';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs } from '@e-pharmacy/ui/navigation';
import { useToast } from '@e-pharmacy/ui/feedback';
import { USER_REVIEW_COMMENT_MAX_LENGTH } from '@e-pharmacy/validation/reviews';
import { formatPharmaciesCount } from '@e-pharmacy/utils/numbers';

import {
  formatMoney,
  formatMoneyRange,
  getNumericRange,
} from '@e-pharmacy/utils/money';

import type { Cart } from '@e-pharmacy/types/cart';
import type { ProductDetails, ProductOffer } from '@e-pharmacy/types/products';
import type { Review } from '@e-pharmacy/types/reviews';

import {
  useClientAuthCapabilities,
  useFavoriteActions,
  useReviewForm,
} from '@/hooks';

import { ROUTES, buildPharmacyPath } from '@/lib/routes';
import { USER_SEARCH_MAX_LENGTH } from '@e-pharmacy/validation/url';
import { isCartOrderLimitError } from '@/lib/cart/order-limit';
import { APP_ERROR_MESSAGES, getUserFacingErrorMessage } from '@/lib/errors';

import {
  normalizeCatalogSearchValue,
  sanitizeCatalogTextSearch,
} from '@/lib/catalog/search-sanitizers';

import { createProductReview, getProductDetails } from '@/lib/api/browser';

import {
  getFavoriteActionCopy,
  shouldRenderFavoriteControl,
} from '@/lib/favorites/favorite-presentation';

import { useCart } from '@/providers/CartProvider';

import {
  FavoriteToggleButton,
  ReviewsSection,
  StockAvailability,
  CartOrderLimitModal,
} from '@/components/common';

import {
  PRODUCT_OFFER_SORT_OPTIONS,
  PRODUCT_OFFERS_PER_PAGE,
  type ProductOfferSort,
} from '@/components/product-catalog/config/product-offers';

import { ProductOrderInfoCard } from './ProductOrderInfoCard';

import css from './ProductDetailsPageContent.module.css';

//===================================================================

type ProductTab = 'about' | 'prices' | 'characteristics' | 'reviews';

//===================================================================

type ProductDetailsPageContentProps = {
  product: ProductDetails;
  reviews: Review[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
  contextPharmacyId?: string;
};

//===================================================================

function getOfferCartItem(cart: Cart | null, productOfferId: string) {
  return (
    cart?.items.find((item) => item.productOfferId === productOfferId) ?? null
  );
}

//===================================================================

function getPharmacyHref(offer: ProductOffer): string {
  return buildPharmacyPath(offer.pharmacyName, offer.pharmacyId);
}

//===================================================================

function getOfferAddress(offer: ProductOffer): string {
  return [offer.pharmacyCity, offer.pharmacyAddress].filter(Boolean).join(', ');
}

//===================================================================

function sortOfferCities(cities: string[]): string[] {
  return [...cities].sort((a, b) => a.localeCompare(b, 'en'));
}

//===================================================================

function getUniqueOfferCities(offers: ProductOffer[]): string[] {
  const cities = offers
    .map((offer) => offer.pharmacyCity?.trim())
    .filter((city): city is string => Boolean(city));

  return sortOfferCities([...new Set(cities)]);
}

//===================================================================

function getLongDescription(product: ProductDetails): string {
  return (
    product.description ??
    `${product.name} is available in the E-PHARMACY catalog with clear information about dosage, manufacturer, package details, pharmacy prices, client reviews, and availability. Use this page to compare offers from different pharmacies, check the product characteristics, and choose the most suitable pharmacy before adding the product to your cart.`
  );
}

//===================================================================

function ProductDetailsPageContent({
  product,
  reviews,
  reviewsTotal,
  areReviewsUnavailable = false,
  contextPharmacyId,
}: ProductDetailsPageContentProps) {
  const {
    isAuthenticated,
    isBootstrapping,
    canUseClientFeatures,
    isActivePharmacyUser,
  } = useClientAuthCapabilities();
  const canUseCart = canUseClientFeatures;
  const {
    cart,
    loadCart,
    pendingItemIds,
    pendingOfferIds,
    addProductToCart,
    updateItemQuantity,
    removeItemFromCart,
  } = useCart();

  const [productDetails, setProductDetails] = useState(product);
  const [activeTab, setActiveTab] = useState<ProductTab>('about');
  const toast = useToast();

  const [pendingOfferQuantities, setPendingOfferQuantities] = useState<
    Record<string, number>
  >({});

  const [pendingRemoveOffer, setPendingRemoveOffer] =
    useState<ProductOffer | null>(null);

  const [orderLimitMessage, setOrderLimitMessage] = useState('');

  const [pharmacyNameQuery, setPharmacyNameQuery] = useState('');
  const [pharmacyAddressQuery, setPharmacyAddressQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [offerSort, setOfferSort] = useState<ProductOfferSort>('newest');

  const [visibleOffersCount, setVisibleOffersCount] = useState(
    PRODUCT_OFFERS_PER_PAGE
  );

  const [isOffersLoadingMore, setIsOffersLoadingMore] = useState(false);
  const offersLoadMoreTimerRef = useRef<number | null>(null);
  const [areOfferFiltersOpen, setAreOfferFiltersOpen] = useState(false);

  const [visibleReviewsCount, setVisibleReviewsCount] = useState(
    DEFAULT_VISIBLE_REVIEWS_COUNT
  );

  const availableOffers = useMemo(
    () => productDetails.offers.filter((offer) => offer.inStock),
    [productDetails.offers]
  );

  const isProductAvailable = availableOffers.length > 0;

  const tabs = useMemo<TabItem<ProductTab>[]>(
    () => [
      { value: 'about', label: 'About product' },
      {
        value: 'prices',
        label: `Prices in pharmacies (${availableOffers.length})`,
      },
      { value: 'characteristics', label: 'Characteristics' },
      { value: 'reviews', label: `Reviews (${reviewsTotal})` },
    ],
    [availableOffers.length, reviewsTotal]
  );

  const pharmaciesCountLabel =
    formatPharmaciesCount(availableOffers.length) ?? '—';

  const priceRange = getNumericRange(
    availableOffers.map((offer) => offer.price)
  );

  const priceRangeLabel = priceRange
    ? (formatMoneyRange(priceRange) ?? '—')
    : 'No pharmacy prices yet';

  const longDescription = getLongDescription(productDetails);

  const cityOptions = useMemo(
    () => [
      { value: 'all', label: 'All cities' },
      ...getUniqueOfferCities(availableOffers).map((city) => ({
        value: city,
        label: city,
      })),
    ],
    [availableOffers]
  );

  const filteredOffers = useMemo(() => {
    const normalizedNameQuery = normalizeCatalogSearchValue(pharmacyNameQuery);
    const normalizedAddressQuery =
      normalizeCatalogSearchValue(pharmacyAddressQuery);

    return availableOffers
      .map((offer, index) => ({ offer, index }))
      .filter(({ offer }) => {
        const nameMatches = normalizeCatalogSearchValue(
          offer.pharmacyName
        ).includes(normalizedNameQuery);

        const addressMatches = normalizeCatalogSearchValue(
          getOfferAddress(offer)
        ).includes(normalizedAddressQuery);

        const cityMatches =
          cityFilter === 'all' || offer.pharmacyCity?.trim() === cityFilter;

        return nameMatches && addressMatches && cityMatches;
      })
      .sort((a, b) => {
        if (a.offer.pharmacyIsFavorite !== b.offer.pharmacyIsFavorite) {
          return a.offer.pharmacyIsFavorite ? -1 : 1;
        }

        if (contextPharmacyId) {
          if (a.offer.pharmacyId === contextPharmacyId) return -1;
          if (b.offer.pharmacyId === contextPharmacyId) return 1;
        }

        if (offerSort === 'price-asc') {
          return a.offer.price - b.offer.price;
        }

        if (offerSort === 'price-desc') {
          return b.offer.price - a.offer.price;
        }

        if (offerSort === 'rating-desc') {
          return (b.offer.pharmacyRating ?? 0) - (a.offer.pharmacyRating ?? 0);
        }

        if (offerSort === 'rating-asc') {
          return (a.offer.pharmacyRating ?? 0) - (b.offer.pharmacyRating ?? 0);
        }

        if (offerSort === 'name-asc') {
          return a.offer.pharmacyName.localeCompare(b.offer.pharmacyName, 'en');
        }

        if (offerSort === 'name-desc') {
          return b.offer.pharmacyName.localeCompare(a.offer.pharmacyName, 'en');
        }

        return a.index - b.index;
      })
      .map(({ offer }) => offer);
  }, [
    cityFilter,
    contextPharmacyId,
    offerSort,
    availableOffers,
    pharmacyAddressQuery,
    pharmacyNameQuery,
  ]);

  const visibleOffers = filteredOffers.slice(0, visibleOffersCount);

  const hasActiveOfferFilters =
    Boolean(pharmacyNameQuery.trim()) ||
    Boolean(pharmacyAddressQuery.trim()) ||
    cityFilter !== 'all';

  const emptyOffersTitle = isProductAvailable
    ? 'No pharmacies found'
    : 'This product is currently unavailable in pharmacies.';

  const emptyOffersText = isProductAvailable
    ? hasActiveOfferFilters
      ? 'Try changing the pharmacy name or address search.'
      : 'No pharmacies match the current offers list.'
    : 'There are no pharmacies where this product is currently available.';

  const handlePharmacyNameQueryChange = (value: string) => {
    setPharmacyNameQuery(value);
    setVisibleOffersCount(PRODUCT_OFFERS_PER_PAGE);
  };

  const handlePharmacyAddressQueryChange = (value: string) => {
    setPharmacyAddressQuery(value);
    setVisibleOffersCount(PRODUCT_OFFERS_PER_PAGE);
  };

  const handleCityFilterChange = (value: string) => {
    setCityFilter(value);
    setVisibleOffersCount(PRODUCT_OFFERS_PER_PAGE);
  };

  const handleOfferSortChange = (value: ProductOfferSort) => {
    setOfferSort(value);
    setVisibleOffersCount(PRODUCT_OFFERS_PER_PAGE);
  };

  useEffect(
    () => () => {
      if (offersLoadMoreTimerRef.current !== null) {
        window.clearTimeout(offersLoadMoreTimerRef.current);
      }
    },
    []
  );

  const handleLoadMoreOffers = () => {
    if (offersLoadMoreTimerRef.current !== null) return;

    setIsOffersLoadingMore(true);

    offersLoadMoreTimerRef.current = window.setTimeout(() => {
      offersLoadMoreTimerRef.current = null;
      setVisibleOffersCount((count) => count + PRODUCT_OFFERS_PER_PAGE);
      setIsOffersLoadingMore(false);
    }, 250);
  };

  const { isFavorite, isFavoriteLoading, isFavoritePending, toggleFavorite } =
    useFavoriteActions({
      entityType: 'product',
      id: productDetails.id,
      notifier: toast,
      ...getFavoriteActionCopy('product'),
    });

  const {
    reviewText,
    reviewRating,
    reviewErrors,
    reviewTouchedFields,
    isReviewValid,
    isReviewSubmitting,
    canCreateReview,
    isAuthUnavailable,
    reviewAccessMessage,
    handleReviewTextChange,
    handleReviewRatingChange,
    handleReviewSubmit,
  } = useReviewForm({
    scopeKey: `product:${productDetails.id}`,
    createReview: (payload, options) =>
      createProductReview(productDetails.id, payload, options),
    notifier: toast,
    successMessage: 'Review was accepted and will be visible after moderation.',
    errorMessage: 'Could not submit review.',
    authRequiredMessage: 'Please log in to submit a review.',
    authUnavailableMessage:
      'We could not verify your session. Please try again shortly.',
    clientAccountRequiredMessage:
      'Reviews are available only for active client accounts.',
  });

  useEffect(() => {
    if (!canUseClientFeatures) return;

    const controller = new AbortController();

    getProductDetails(productDetails.id, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        setProductDetails(response.product);
      })
      .catch(() => undefined);

    loadCart().catch((error: unknown) => {
      if (controller.signal.aborted) return;

      toast.error(
        getUserFacingErrorMessage(error, {
          fallback: APP_ERROR_MESSAGES.products.loadCart,
        })
      );
    });

    return () => {
      controller.abort();
    };
  }, [canUseClientFeatures, loadCart, productDetails.id, toast]);

  const handleAddUnit = async (offer: ProductOffer) => {
    if (!canUseCart || !offer.inStock) return;
    if (pendingOfferIds.has(offer.id)) return;

    const cartItem = getOfferCartItem(cart, offer.id);
    const nextQuantity = (cartItem?.quantity ?? 0) + 1;

    if (!cartItem) {
      setPendingOfferQuantities((current) => ({
        ...current,
        [offer.id]: nextQuantity,
      }));
    }

    try {
      const response = cartItem
        ? await updateItemQuantity(
            cartItem.id,
            { quantity: nextQuantity },
            { offerId: offer.id }
          )
        : await addProductToCart(
            {
              productId: productDetails.id,
              pharmacyId: offer.pharmacyId,
              quantity: 1,
            },
            { offerId: offer.id }
          );

      if (response) {
        toast.success('One product unit was added to the order.');
      }
    } catch (error) {
      if (isCartOrderLimitError(error)) {
        setOrderLimitMessage('limit');
      } else {
        toast.error(
          getUserFacingErrorMessage(error, {
            fallback: APP_ERROR_MESSAGES.products.addToCart,
          })
        );
      }
    } finally {
      if (!cartItem) {
        setPendingOfferQuantities((current) => {
          const next = { ...current };
          delete next[offer.id];
          return next;
        });
      }
    }
  };

  const removeOfferUnit = async (offer: ProductOffer) => {
    if (!canUseCart || !offer.inStock) return;
    if (pendingOfferIds.has(offer.id)) return;

    const cartItem = getOfferCartItem(cart, offer.id);

    if (!cartItem) return;

    const nextQuantity = cartItem.quantity - 1;

    try {
      const response =
        cartItem.quantity === 1
          ? await removeItemFromCart(cartItem.id, { offerId: offer.id })
          : await updateItemQuantity(
              cartItem.id,
              { quantity: nextQuantity },
              { offerId: offer.id }
            );

      if (response) {
        toast.success('One product unit was removed from the order.');
      }
    } catch (error) {
      toast.error(
        getUserFacingErrorMessage(error, {
          fallback: APP_ERROR_MESSAGES.products.removeFromCart,
        })
      );
    } finally {
      setPendingRemoveOffer(null);
    }
  };

  const handleRemoveUnit = (offer: ProductOffer) => {
    if (!canUseCart || !offer.inStock) return;

    const cartItem = getOfferCartItem(cart, offer.id);

    if (!cartItem) return;

    if (cartItem.quantity === 1) {
      setPendingRemoveOffer(offer);
      return;
    }

    void removeOfferUnit(offer);
  };

  const renderQuantityControl = (offer: ProductOffer) => {
    if (!offer.inStock) {
      return (
        <p className={css.unavailableOffer}>
          Currently unavailable in this pharmacy.
        </p>
      );
    }

    const cartItem = getOfferCartItem(cart, offer.id);
    const pendingQuantity = pendingOfferQuantities[offer.id];
    const quantity = cartItem?.quantity ?? pendingQuantity ?? 0;
    const isOfferPending = pendingOfferIds.has(offer.id);
    const isDisabled = !canUseCart || !offer.inStock;

    return (
      <div className={css.quantityBlock}>
        <QuantityCounter
          value={quantity}
          max={offer.availableQuantity}
          disabled={isDisabled}
          isLoading={
            isOfferPending ||
            (cartItem ? pendingItemIds.has(cartItem.id) : false)
          }
          ariaLabel="Product quantity controls"
          onIncrement={() => handleAddUnit(offer)}
          onDecrement={() => handleRemoveUnit(offer)}
        />

        <p className={css.totalLine}>
          Total:{' '}
          <b>
            {formatMoney(
              (cartItem?.quantity ?? pendingQuantity ?? 0) * offer.price
            )}
          </b>
        </p>

        {canUseClientFeatures ? (
          <StockAvailability
            className={css.stockLine}
            stockQuantity={offer.availableQuantity}
          />
        ) : null}
      </div>
    );
  };

  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby="product-title">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Product catalog', href: ROUTES.PRODUCTS_CATALOG },
              { label: productDetails.name },
            ]}
            includeStructuredData
          />

          <h1 className="visually-hidden" id="product-title">
            Buy {productDetails.name} online — compare pharmacy prices and
            product details
          </h1>

          <Tabs
            items={tabs}
            activeValue={activeTab}
            ariaLabel="Product information tabs"
            onChange={setActiveTab}
          />

          {activeTab === 'about' ? (
            <div className={css.grid}>
              <div className={css.imageCard}>
                {productDetails.imageUrl ? (
                  <ShimmerImage
                    className={css.image}
                    src={productDetails.imageUrl}
                    alt={productDetails.name}
                    priority
                    fetchPriority="high"
                    sizes="(max-width: 767px) 100vw, (max-width: 1439px) 50vw, 520px"
                  />
                ) : (
                  <div className={css.imageFallback} aria-hidden="true">
                    <SvgIcon name="icon-shopping-cart" size={52} />
                  </div>
                )}
              </div>

              <div className={css.content}>
                <div className={css.topLine}>
                  <p className={css.category}>
                    {PRODUCT_CATEGORY_LABELS[productDetails.category]}
                  </p>

                  {shouldRenderFavoriteControl({
                    isAuthenticated,
                    isBootstrapping,
                    canUseClientFeatures,
                  }) ? (
                    <FavoriteToggleButton
                      isActive={isFavorite}
                      disabled={isFavoriteLoading}
                      isPending={isFavoritePending}
                      onClick={toggleFavorite}
                      activeLabel="Remove product from favorites"
                      inactiveLabel="Add product to favorites"
                    />
                  ) : null}
                </div>

                <h2 className={css.title}>{productDetails.name}</h2>

                <RatingSummary
                  className={css.ratingRow}
                  rating={productDetails.rating}
                  reviewsCount={reviewsTotal}
                />

                <dl className={css.summaryList}>
                  <div className={css.summaryItem}>
                    <dt>Article</dt>
                    <dd>{productDetails.article}</dd>
                  </div>

                  {isProductAvailable ? (
                    <>
                      <div className={css.summaryItem}>
                        <dt>Found in pharmacies</dt>
                        <dd>{pharmaciesCountLabel}</dd>
                      </div>

                      <div className={css.summaryItem}>
                        <dt>Price</dt>
                        <dd>{priceRangeLabel}</dd>
                      </div>
                    </>
                  ) : (
                    <div className={css.summaryItem}>
                      <dt>Availability</dt>
                      <dd>Not available in pharmacies</dd>
                    </div>
                  )}
                </dl>

                <div className={css.infoGrid}>
                  <ProductOrderInfoCard
                    icon={<Car size={22} />}
                    title="Delivery"
                    items={[
                      `${DELIVERY_METHOD_LABELS.pickup}.`,
                      `${DELIVERY_METHOD_LABELS.postal_delivery} after a pharmacy confirms the address.`,
                    ]}
                    notice="Delivery availability and price depend on pharmacy and carrier confirmation."
                  />
                  <ProductOrderInfoCard
                    icon={<WalletCards size={22} />}
                    title="Payment"
                    items={[
                      `${PAYMENT_METHOD_LABELS.cash}.`,
                      `${PAYMENT_METHOD_LABELS.bank_transfer}.`,
                    ]}
                  />
                </div>

                <Button
                  className={css.buyButton}
                  type="button"
                  onClick={() => setActiveTab('prices')}
                >
                  Find pharmacy offers
                </Button>
              </div>
            </div>
          ) : null}
        </Container>
      </section>

      {activeTab !== 'about' ? (
        <section className={css.tabSection} aria-live="polite">
          <Container>
            {activeTab === 'prices' ? (
              <div className={css.panel}>
                <div className={css.sectionHeader}>
                  <div className={css.sectionHeaderMain}>
                    <h2 className={css.panelTitle}>Pharmacies</h2>

                    {!isBootstrapping && !canUseClientFeatures ? (
                      <p className={css.authNote}>
                        {isActivePharmacyUser
                          ? 'Ordering is available only for client accounts.'
                          : 'Only logged-in clients can order and buy products.'}
                      </p>
                    ) : null}
                  </div>

                  <CountLabel
                    shown={visibleOffers.length}
                    total={filteredOffers.length}
                    label="pharmacies"
                  />
                </div>

                <button
                  className={css.filtersToggle}
                  type="button"
                  aria-expanded={areOfferFiltersOpen}
                  aria-controls="pharmacy-filters"
                  onClick={() => setAreOfferFiltersOpen((isOpen) => !isOpen)}
                >
                  <span className={css.filtersToggleText}>
                    <Filter size={18} aria-hidden="true" />
                    {areOfferFiltersOpen ? 'Hide filters' : 'Show filters'}
                  </span>

                  {areOfferFiltersOpen ? (
                    <ChevronUp size={20} aria-hidden="true" />
                  ) : (
                    <ChevronDown size={20} aria-hidden="true" />
                  )}
                </button>

                <div
                  className={
                    areOfferFiltersOpen
                      ? `${css.offerControls} ${css.offerControlsOpen}`
                      : css.offerControls
                  }
                  id="pharmacy-filters"
                >
                  <SearchInput
                    id="pharmacy-name-search"
                    label="Search by pharmacy"
                    value={pharmacyNameQuery}
                    placeholder="Enter pharmacy name"
                    maxLength={USER_SEARCH_MAX_LENGTH}
                    sanitizeValue={sanitizeCatalogTextSearch}
                    onChange={handlePharmacyNameQueryChange}
                  />

                  <SearchInput
                    id="pharmacy-address-search"
                    label="Search by address"
                    value={pharmacyAddressQuery}
                    placeholder="Enter city or address"
                    maxLength={USER_SEARCH_MAX_LENGTH}
                    sanitizeValue={sanitizeCatalogTextSearch}
                    onChange={handlePharmacyAddressQueryChange}
                  />

                  <SearchableSelect
                    id="pharmacy-city-filter"
                    label="City"
                    value={cityFilter}
                    options={cityOptions}
                    placeholder="All cities"
                    isActive={cityFilter !== 'all'}
                    sanitizeQuery={sanitizeCatalogTextSearch}
                    onChange={handleCityFilterChange}
                  />

                  <SelectField
                    id="pharmacy-sort"
                    label="Sort by"
                    value={offerSort}
                    options={PRODUCT_OFFER_SORT_OPTIONS}
                    onChange={handleOfferSortChange}
                  />
                </div>

                {visibleOffers.length > 0 ? (
                  <ul className={css.offersList}>
                    {visibleOffers.map((offer) => (
                      <li className={css.offerItem} key={offer.pharmacyId}>
                        <article className={css.offerCard}>
                          <div className={css.offerMain}>
                            <div className={css.offerImageWrap}>
                              {offer.pharmacyIsFavorite ? (
                                <span className={css.favoritePharmacyBadge}>
                                  Favorite pharmacy
                                </span>
                              ) : null}

                              {offer.pharmacyImageUrl ? (
                                <ShimmerImage
                                  className={css.offerImage}
                                  src={offer.pharmacyImageUrl}
                                  alt={`${offer.pharmacyName} pharmacy`}
                                  sizes="500px"
                                  quality={90}
                                />
                              ) : (
                                <SvgIcon name="icon-shopping-cart" size={32} />
                              )}
                            </div>

                            <div className={css.offerInfo}>
                              <h3 className={css.offerTitle}>
                                {offer.pharmacyName}
                              </h3>

                              {getOfferAddress(offer) ? (
                                <p className={css.offerAddress}>
                                  {getOfferAddress(offer)}
                                </p>
                              ) : null}

                              {offer.pharmacyPhone ? (
                                <p className={css.offerPhone}>
                                  {offer.pharmacyPhone}
                                </p>
                              ) : null}

                              <RatingSummary
                                className={css.offerRating}
                                rating={offer.pharmacyRating ?? 0}
                                reviewsCount={offer.pharmacyReviewsCount ?? 0}
                                size="sm"
                              />
                            </div>
                          </div>

                          <div className={css.offerAside}>
                            <p className={css.offerPrice}>
                              {formatMoney(offer.price) ?? '—'}
                            </p>

                            {renderQuantityControl(offer)}

                            <p className={css.cartNote}>
                              The product stays in the cart for 3 days and is
                              removed if the order is not confirmed.
                            </p>

                            <LinkButton
                              className={css.offerLink}
                              href={getPharmacyHref(offer)}
                              variant="secondary"
                            >
                              View pharmacy
                            </LinkButton>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={css.emptyPanel}>
                    <h3 className={css.emptyTitle}>{emptyOffersTitle}</h3>

                    <p className={css.emptyText}>{emptyOffersText}</p>
                  </div>
                )}

                <LazyLoadButton
                  visibleCount={visibleOffers.length}
                  totalCount={filteredOffers.length}
                  label="Show more pharmacies"
                  isLoading={isOffersLoadingMore}
                  onLoadMore={handleLoadMoreOffers}
                />
              </div>
            ) : null}

            {activeTab === 'characteristics' ? (
              <div className={css.panel}>
                <h2 className={css.panelTitle}>Characteristics</h2>

                <dl className={css.details}>
                  {productDetails.manufacturer ? (
                    <div className={css.detailItem}>
                      <dt>Manufacturer</dt>
                      <dd>{productDetails.manufacturer}</dd>
                    </div>
                  ) : null}

                  {productDetails.dosage ? (
                    <div className={css.detailItem}>
                      <dt>Dosage</dt>
                      <dd>{productDetails.dosage}</dd>
                    </div>
                  ) : null}

                  {productDetails.packageQuantity ? (
                    <div className={css.detailItem}>
                      <dt>Package</dt>
                      <dd>{productDetails.packageQuantity}</dd>
                    </div>
                  ) : null}

                  <div className={css.detailItem}>
                    <dt>Category</dt>
                    <dd>{PRODUCT_CATEGORY_LABELS[productDetails.category]}</dd>
                  </div>
                </dl>

                <div className={css.descriptionBlock}>
                  <p>{longDescription}</p>

                  <p>
                    Before purchasing, compare pharmacy prices, check the
                    available quantity, read client reviews, and make sure the
                    selected offer matches your needs. Information on this page
                    helps clients quickly understand the product, its main
                    properties, and which pharmacy offers can be included in an
                    order request.
                  </p>
                </div>
              </div>
            ) : null}

            {activeTab === 'reviews' ? (
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
                  commentError={reviewErrors.comment}
                  ratingError={reviewErrors.rating}
                  reviewTouchedFields={reviewTouchedFields}
                  isReviewSubmitting={isReviewSubmitting}
                  canCreateReview={canCreateReview}
                  reviewAccessMessage={reviewAccessMessage}
                  isAuthUnavailable={isAuthUnavailable}
                  isUnavailable={areReviewsUnavailable}
                  emptyText="Product reviews will appear here after clients share their feedback."
                  textareaId="product-review"
                  maxLength={USER_REVIEW_COMMENT_MAX_LENGTH}
                  onReviewTextChange={handleReviewTextChange}
                  onReviewRatingChange={handleReviewRatingChange}
                  onReviewSubmit={() => void handleReviewSubmit()}
                />
              </div>
            ) : null}
          </Container>
        </section>
      ) : null}

      {orderLimitMessage ? (
        <CartOrderLimitModal onClose={() => setOrderLimitMessage('')} />
      ) : null}

      {pendingRemoveOffer ? (
        <ConfirmationModal
          title="Remove product from order?"
          text={`This is the last unit of ${productDetails.name} from ${pendingRemoveOffer.pharmacyName}. It will be removed from the cart.`}
          isLoading={pendingOfferIds.has(pendingRemoveOffer.id)}
          onConfirm={() => void removeOfferUnit(pendingRemoveOffer)}
          onCancel={() => setPendingRemoveOffer(null)}
        />
      ) : null}
    </main>
  );
}

export default ProductDetailsPageContent;
