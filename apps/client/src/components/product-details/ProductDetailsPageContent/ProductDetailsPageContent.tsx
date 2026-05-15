'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';

import {
  Button,
  ButtonLink,
  ConfirmActionModal,
  Container,
  DeliveryInfoCard,
  FavoriteToggleButton,
  LazyLoadButton,
  PaymentInfoCard,
  QuantityCounter,
  RatingSummary,
  ReviewsSection,
  SearchInput,
  SearchableSelect,
  SelectField,
  ShimmerImage,
  SvgIcon,
  Tabs,
  Toast,
  type TabItem,
} from '@/components/common';

import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/components/providers';

import { ROUTES } from '@/lib/constants/routes';
import { buildStorePath } from '@/lib/routes';

import {
  addCartItem,
  createProductReview,
  getCart,
  getProductDetails,
  removeCartItem,
  toggleFavoriteProduct,
  updateCartItem,
} from '@/services';

import type {
  Cart,
  CartItem,
  Product,
  ProductOffer,
  ProductReview,
} from '@/types';

import css from './ProductDetailsPageContent.module.css';

//===================================================================

type ProductTab = 'about' | 'prices' | 'characteristics' | 'reviews';
type OfferSort =
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc'
  | 'rating-asc'
  | 'name-asc'
  | 'name-desc';

type ProductDetailsPageContentProps = {
  product: Product;
  reviews: ProductReview[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
  contextStoreId?: string;
};

//===================================================================

const REVIEW_MAX_LENGTH = 500;
const REVIEW_MIN_LENGTH = 10;
const OFFERS_PER_PAGE = 10;
const SEARCH_MAX_LENGTH = 80;

const REVIEW_REGEX = /^[A-Za-z0-9\s.,!?;:'"()\-]+$/;

const CATEGORY_LABELS: Record<Product['category'], string> = {
  medicine: 'Medicine',
  vitamins: 'Vitamins',
  beauty: 'Beauty',
  hygiene: 'Hygiene',
  'medical-devices': 'Medical devices',
  other: 'Other',
};

const OFFER_SORT_OPTIONS: { value: OfferSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'rating-desc', label: 'Rating: highest first' },
  { value: 'rating-asc', label: 'Rating: lowest first' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

//===================================================================

function sanitizeOfferSearch(value: string): string {
  return value.replace(/[^A-Za-z0-9 .-]/g, '');
}

//===================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatPriceRange(offers: ProductOffer[]): string {
  if (offers.length === 0) return 'No pharmacy prices yet';

  const prices = offers.map((offer) => offer.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) return formatPrice(minPrice);

  return `${formatPrice(minPrice)} — ${formatPrice(maxPrice)}`;
}

function getOfferCartItem(
  cart: Cart | null,
  productId: string,
  storeId: string
) {
  return (
    cart?.items.find(
      (item) => item.productId === productId && item.storeId === storeId
    ) ?? null
  );
}

function getOfferTotal(cartItem: CartItem | null, offer: ProductOffer): number {
  return (cartItem?.quantity ?? 0) * offer.price;
}

function formatAvailableQuantity(quantity: number): string {
  return quantity === 1
    ? '1 item available in this pharmacy'
    : `${quantity} items available in this pharmacy`;
}

function getStoreHref(offer: ProductOffer): string {
  return buildStorePath(offer.storeName, offer.storeId);
}

function getOfferAddress(offer: ProductOffer): string {
  return [offer.storeCity, offer.storeAddress].filter(Boolean).join(', ');
}

function sortOfferCities(cities: string[]): string[] {
  return [...cities].sort((a, b) => a.localeCompare(b, 'en'));
}

function getUniqueOfferCities(offers: ProductOffer[]): string[] {
  const cities = offers
    .map((offer) => offer.storeCity?.trim())
    .filter((city): city is string => Boolean(city));

  return sortOfferCities([...new Set(cities)]);
}

function getLongDescription(product: Product): string {
  return (
    product.description ??
    `${product.name} is available in the E-PHARMACY catalog with clear information about dosage, manufacturer, package details, pharmacy prices, customer reviews, and availability. Use this page to compare offers from different pharmacies, check the product characteristics, and choose the most suitable pharmacy before adding the product to your cart.`
  );
}

//===================================================================

function ProductDetailsPageContent({
  product,
  reviews,
  reviewsTotal,
  areReviewsUnavailable = false,
  contextStoreId,
}: ProductDetailsPageContentProps) {
  const { token, isAuthenticated, isAuthReady } = useAuth();

  const [productDetails, setProductDetails] = useState(product);
  const [activeTab, setActiveTab] = useState<ProductTab>('about');
  const [cart, setCart] = useState<Cart | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isFavorite, setIsFavorite] = useState(Boolean(product.isFavorite));
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [updatingStoreId, setUpdatingStoreId] = useState<string | null>(null);
  const [pendingRemoveOffer, setPendingRemoveOffer] =
    useState<ProductOffer | null>(null);
  const [invoiceLimitMessage, setInvoiceLimitMessage] = useState('');

  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  const [storeNameQuery, setStoreNameQuery] = useState('');
  const [storeAddressQuery, setStoreAddressQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [offerSort, setOfferSort] = useState<OfferSort>('newest');
  const [visibleOffersCount, setVisibleOffersCount] = useState(OFFERS_PER_PAGE);
  const [isOffersLoadingMore, setIsOffersLoadingMore] = useState(false);
  const [areOfferFiltersOpen, setAreOfferFiltersOpen] = useState(false);

  const tabs = useMemo<TabItem<ProductTab>[]>(
    () => [
      { value: 'about', label: 'About product' },
      {
        value: 'prices',
        label: `Prices in pharmacies (${productDetails.foundInStoresCount})`,
      },
      { value: 'characteristics', label: 'Characteristics' },
      { value: 'reviews', label: `Reviews (${reviewsTotal})` },
    ],
    [productDetails.foundInStoresCount, reviewsTotal]
  );

  const reviewsCountLabel =
    reviewsTotal === 1 ? '1 review' : `${reviewsTotal} reviews`;

  const storesCountLabel = `${productDetails.foundInStoresCount} ${
    productDetails.foundInStoresCount === 1 ? 'pharmacy' : 'pharmacies'
  }`;

  const priceRangeLabel = formatPriceRange(productDetails.offers);
  const longDescription = getLongDescription(productDetails);

  const cityOptions = useMemo(
    () => [
      { value: 'all', label: 'All cities' },
      ...getUniqueOfferCities(productDetails.offers).map((city) => ({
        value: city,
        label: city,
      })),
    ],
    [productDetails.offers]
  );

  const filteredOffers = useMemo(() => {
    const normalizedNameQuery = storeNameQuery.trim().toLowerCase();
    const normalizedAddressQuery = storeAddressQuery.trim().toLowerCase();

    return productDetails.offers
      .map((offer, index) => ({ offer, index }))
      .filter(({ offer }) => {
        const nameMatches = offer.storeName
          .toLowerCase()
          .includes(normalizedNameQuery);

        const addressMatches = getOfferAddress(offer)
          .toLowerCase()
          .includes(normalizedAddressQuery);

        const cityMatches =
          cityFilter === 'all' || offer.storeCity?.trim() === cityFilter;

        return nameMatches && addressMatches && cityMatches;
      })
      .sort((a, b) => {
        if (a.offer.storeIsFavorite !== b.offer.storeIsFavorite) {
          return a.offer.storeIsFavorite ? -1 : 1;
        }

        if (contextStoreId) {
          if (a.offer.storeId === contextStoreId) return -1;
          if (b.offer.storeId === contextStoreId) return 1;
        }

        if (offerSort === 'price-asc') {
          return a.offer.price - b.offer.price;
        }

        if (offerSort === 'price-desc') {
          return b.offer.price - a.offer.price;
        }

        if (offerSort === 'rating-desc') {
          return (b.offer.storeRating ?? 0) - (a.offer.storeRating ?? 0);
        }

        if (offerSort === 'rating-asc') {
          return (a.offer.storeRating ?? 0) - (b.offer.storeRating ?? 0);
        }

        if (offerSort === 'name-asc') {
          return a.offer.storeName.localeCompare(b.offer.storeName, 'en');
        }

        if (offerSort === 'name-desc') {
          return b.offer.storeName.localeCompare(a.offer.storeName, 'en');
        }

        return a.index - b.index;
      })
      .map(({ offer }) => offer);
  }, [
    cityFilter,
    contextStoreId,
    offerSort,
    productDetails.offers,
    storeAddressQuery,
    storeNameQuery,
  ]);

  const visibleOffers = filteredOffers.slice(0, visibleOffersCount);

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

  const handleStoreNameQueryChange = (value: string) => {
    setStoreNameQuery(value);
    setVisibleOffersCount(OFFERS_PER_PAGE);
  };

  const handleStoreAddressQueryChange = (value: string) => {
    setStoreAddressQuery(value);
    setVisibleOffersCount(OFFERS_PER_PAGE);
  };

  const handleCityFilterChange = (value: string) => {
    setCityFilter(value);
    setVisibleOffersCount(OFFERS_PER_PAGE);
  };

  const handleOfferSortChange = (value: OfferSort) => {
    setOfferSort(value);
    setVisibleOffersCount(OFFERS_PER_PAGE);
  };

  const handleLoadMoreOffers = () => {
    setIsOffersLoadingMore(true);

    window.setTimeout(() => {
      setVisibleOffersCount((count) => count + OFFERS_PER_PAGE);
      setIsOffersLoadingMore(false);
    }, 250);
  };

  useEffect(() => {
    if (!toastMessage) return;

    const timeoutId = window.setTimeout(() => {
      setToastMessage('');
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let isMounted = true;

    getProductDetails(productDetails.id, token)
      .then((response) => {
        if (isMounted) {
          setProductDetails(response.product);
          setIsFavorite(Boolean(response.product.isFavorite));
        }
      })
      .catch(() => undefined);

    getCart(token)
      .then((response) => {
        if (isMounted) setCart(response.cart);
      })
      .catch(() => {
        if (isMounted) showToast('Could not load cart data.');
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, productDetails.id, showToast, token]);

  const refreshCart = async () => {
    if (!token) return;

    const response = await getCart(token);
    setCart(response.cart);
  };

  const handleFavoriteClick = async () => {
    if (!isAuthReady) return;

    if (!isAuthenticated || !token) {
      showToast('Please log in to add products to favorites.');
      return;
    }

    try {
      setIsFavoriteLoading(true);
      const response = await toggleFavoriteProduct(productDetails.id, token);

      setIsFavorite(response.isFavorite);
      showToast(
        response.isFavorite
          ? 'Product was added to favorites.'
          : 'Product was removed from favorites.'
      );
    } catch {
      showToast('Could not update favorites.');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleAddUnit = async (offer: ProductOffer) => {
    if (!isAuthenticated || !token) return;

    try {
      setUpdatingStoreId(offer.storeId);
      const cartItem = getOfferCartItem(cart, productDetails.id, offer.storeId);

      if (cartItem) {
        await updateCartItem(
          cartItem.id,
          { quantity: cartItem.quantity + 1 },
          token
        );
      } else {
        await addCartItem(
          { productId: productDetails.id, storeId: offer.storeId, quantity: 1 },
          token
        );
      }

      await refreshCart();
      showToast('One product unit was added to the order.');
    } catch (error) {
      if (error instanceof ApiError && error.message.includes('15 invoices')) {
        setInvoiceLimitMessage(
          'You cannot add more than 15 invoices to your cart. Please confirm the previous ones to continue shopping'
        );
      } else {
        showToast('Could not add product to the order.');
      }
    } finally {
      setUpdatingStoreId(null);
    }
  };

  const removeOfferUnit = async (offer: ProductOffer) => {
    if (!isAuthenticated || !token) return;

    const cartItem = getOfferCartItem(cart, productDetails.id, offer.storeId);

    if (!cartItem) return;

    try {
      setUpdatingStoreId(offer.storeId);

      if (cartItem.quantity === 1) {
        await removeCartItem(cartItem.id, token);
      } else {
        await updateCartItem(
          cartItem.id,
          { quantity: cartItem.quantity - 1 },
          token
        );
      }

      await refreshCart();
      showToast('One product unit was removed from the order.');
    } catch {
      showToast('Could not remove product from the order.');
    } finally {
      setUpdatingStoreId(null);
      setPendingRemoveOffer(null);
    }
  };

  const handleRemoveUnit = (offer: ProductOffer) => {
    if (!isAuthenticated || !token) return;

    const cartItem = getOfferCartItem(cart, productDetails.id, offer.storeId);

    if (!cartItem) return;

    if (cartItem.quantity === 1) {
      setPendingRemoveOffer(offer);
      return;
    }

    void removeOfferUnit(offer);
  };

  const handleReviewTextChange = (value: string) => {
    if (value.length > REVIEW_MAX_LENGTH) return;

    setReviewText(value);
  };

  const handleReviewSubmit = async () => {
    if (!isReviewValid || !isAuthenticated || !token) return;

    try {
      setIsReviewSubmitting(true);

      await createProductReview(
        productDetails.id,
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

  const renderQuantityControl = (offer: ProductOffer) => {
    const cartItem = getOfferCartItem(cart, productDetails.id, offer.storeId);
    const quantity = cartItem?.quantity ?? 0;
    const isDisabled =
      !isAuthReady ||
      !isAuthenticated ||
      !offer.inStock ||
      updatingStoreId === offer.storeId;

    return (
      <div className={css.quantityBlock}>
        <QuantityCounter
          value={quantity}
          max={offer.activeQuantity}
          disabled={isDisabled}
          isLoading={updatingStoreId === offer.storeId}
          ariaLabel="Product quantity controls"
          onIncrement={() => handleAddUnit(offer)}
          onDecrement={() => handleRemoveUnit(offer)}
        />

        <p className={css.totalLine}>
          Total: <b>{formatPrice(getOfferTotal(cartItem, offer))}</b>
        </p>

        {isAuthenticated ? (
          <p className={css.stockLine}>
            {formatAvailableQuantity(offer.activeQuantity)}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <main className={css.page}>
      <Toast message={toastMessage} isVisible={Boolean(toastMessage)} />

      <section className={css.hero} aria-labelledby="product-title">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Medicines catalog', href: ROUTES.MEDICINES_CATALOG },
              { label: productDetails.name },
            ]}
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
                    {CATEGORY_LABELS[productDetails.category]}
                  </p>

                  <FavoriteToggleButton
                    isActive={isFavorite}
                    disabled={isFavoriteLoading || !isAuthReady}
                    onClick={handleFavoriteClick}
                    activeLabel="Remove product from favorites"
                    inactiveLabel="Add product to favorites"
                  />
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

                  <div className={css.summaryItem}>
                    <dt>Found in pharmacies</dt>
                    <dd>{storesCountLabel}</dd>
                  </div>

                  <div className={css.summaryItem}>
                    <dt>Price</dt>
                    <dd>{priceRangeLabel}</dd>
                  </div>
                </dl>

                <div className={css.infoGrid}>
                  <DeliveryInfoCard />
                  <PaymentInfoCard />
                </div>

                <Button
                  className={css.buyButton}
                  type="button"
                  onClick={() => setActiveTab('prices')}
                >
                  Buy product
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
                  <div>
                    <h2 className={css.panelTitle}>
                      Pharmacies ({productDetails.foundInStoresCount})
                    </h2>

                    <p className={css.resultCount}>
                      {filteredOffers.length > 0
                        ? `Showing ${visibleOffers.length} of ${filteredOffers.length} pharmacies`
                        : 'No pharmacies match your search'}
                    </p>

                    {!isAuthenticated && isAuthReady ? (
                      <p className={css.authNote}>
                        Only logged-in users can order and buy products.
                      </p>
                    ) : null}
                  </div>
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
                    value={storeNameQuery}
                    placeholder="Enter pharmacy name"
                    maxLength={SEARCH_MAX_LENGTH}
                    sanitizeValue={sanitizeOfferSearch}
                    onChange={handleStoreNameQueryChange}
                  />

                  <SearchInput
                    id="pharmacy-address-search"
                    label="Search by address"
                    value={storeAddressQuery}
                    placeholder="Enter city or address"
                    maxLength={SEARCH_MAX_LENGTH}
                    sanitizeValue={sanitizeOfferSearch}
                    onChange={handleStoreAddressQueryChange}
                  />

                  <SearchableSelect
                    id="pharmacy-city-filter"
                    label="City"
                    value={cityFilter}
                    options={cityOptions}
                    placeholder="All cities"
                    isActive={cityFilter !== 'all'}
                    sanitizeQuery={sanitizeOfferSearch}
                    onChange={handleCityFilterChange}
                  />

                  <SelectField
                    id="pharmacy-sort"
                    label="Sort by"
                    value={offerSort}
                    options={OFFER_SORT_OPTIONS}
                    onChange={handleOfferSortChange}
                  />
                </div>

                {visibleOffers.length > 0 ? (
                  <ul className={css.offersList}>
                    {visibleOffers.map((offer) => (
                      <li className={css.offerItem} key={offer.storeId}>
                        <article className={css.offerCard}>
                          <div className={css.offerMain}>
                            <div className={css.offerImageWrap}>
                              {offer.storeIsFavorite ? (
                                <span className={css.favoriteStoreBadge}>
                                  Favorite pharmacy
                                </span>
                              ) : null}

                              {offer.storeImageUrl ? (
                                <ShimmerImage
                                  className={css.offerImage}
                                  src={offer.storeImageUrl}
                                  alt={`${offer.storeName} pharmacy`}
                                  sizes="500px"
                                  quality={90}
                                />
                              ) : (
                                <SvgIcon name="icon-shopping-cart" size={32} />
                              )}
                            </div>

                            <div className={css.offerInfo}>
                              <h3 className={css.offerTitle}>
                                {offer.storeName}
                              </h3>

                              {getOfferAddress(offer) ? (
                                <p className={css.offerAddress}>
                                  {getOfferAddress(offer)}
                                </p>
                              ) : null}

                              {offer.storePhone ? (
                                <p className={css.offerPhone}>
                                  {offer.storePhone}
                                </p>
                              ) : null}

                              <RatingSummary
                                className={css.offerRating}
                                rating={offer.storeRating ?? 0}
                                reviewsCount={offer.storeReviewsCount ?? 0}
                                size="sm"
                              />
                            </div>
                          </div>

                          <div className={css.offerAside}>
                            <p className={css.offerPrice}>
                              {formatPrice(offer.price)}
                            </p>

                            {renderQuantityControl(offer)}

                            <p className={css.cartNote}>
                              Product stays in the cart for 3 days and is
                              removed if the order is not confirmed.
                            </p>

                            <ButtonLink
                              className={css.offerLink}
                              href={getStoreHref(offer)}
                              variant="secondary"
                            >
                              View pharmacy
                            </ButtonLink>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={css.emptyPanel}>
                    <h3 className={css.emptyTitle}>No pharmacies found</h3>
                    <p className={css.emptyText}>
                      Try changing the pharmacy name or address search.
                    </p>
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
                    <dd>{CATEGORY_LABELS[productDetails.category]}</dd>
                  </div>
                </dl>

                <div className={css.descriptionBlock}>
                  <p>{longDescription}</p>
                  <p>
                    Before purchasing, compare pharmacy prices, check the
                    available quantity, read customer reviews, and make sure the
                    selected offer matches your needs. Information on this page
                    helps customers quickly understand the product, its main
                    properties, and where it can be bought online.
                  </p>
                </div>
              </div>
            ) : null}

            {activeTab === 'reviews' ? (
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
                  emptyText="Product reviews will appear here after customers share their feedback."
                  textareaId="product-review"
                  maxLength={REVIEW_MAX_LENGTH}
                  onReviewTextChange={handleReviewTextChange}
                  onReviewRatingChange={setReviewRating}
                  onReviewSubmit={() => void handleReviewSubmit()}
                />
              </div>
            ) : null}
          </Container>
        </section>
      ) : null}
      {invoiceLimitMessage ? (
        <ConfirmActionModal
          title="Cart invoice limit"
          text={invoiceLimitMessage}
          confirmLabel="Got it"
          cancelLabel="Close"
          onConfirm={() => setInvoiceLimitMessage('')}
          onCancel={() => setInvoiceLimitMessage('')}
        />
      ) : null}

      {pendingRemoveOffer ? (
        <ConfirmActionModal
          title="Remove product from order?"
          text={`This is the last unit of ${productDetails.name} from ${pendingRemoveOffer.storeName}. It will be removed from the cart.`}
          isLoading={updatingStoreId === pendingRemoveOffer.storeId}
          onConfirm={() => void removeOfferUnit(pendingRemoveOffer)}
          onCancel={() => setPendingRemoveOffer(null)}
        />
      ) : null}
    </main>
  );
}

export default ProductDetailsPageContent;
