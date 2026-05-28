'use client';

import { useEffect, useMemo, useState } from 'react';
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
  StockAvailability,
  SearchInput,
  SearchableSelect,
  SelectField,
  ShimmerImage,
  SvgIcon,
  Tabs,
  type TabItem,
} from '@/components/common';

import { CartInvoiceLimitModal } from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { useAuth } from '@/providers';
import { useFavoriteToggle, useReviewForm, useToast } from '@/hooks';

import { ROUTES } from '@/lib/constants/routes';
import { CATALOG_SEARCH_MAX_LENGTH } from '@/lib/constants/catalog-controls';
import { isCartInvoiceLimitError } from '@/lib/cart/invoice-limit';

import {
  formatPharmaciesCount,
  formatPrice,
  formatPriceRange,
  formatReviewsCount,
} from '@/lib/formatters';

import { formatProductCategoryLabel } from '@/lib/catalog/product-category-labels';
import { sanitizeCatalogTextSearch } from '@/lib/catalog/search-sanitizers';

import {
  PRODUCT_OFFER_SORT_OPTIONS,
  PRODUCT_OFFERS_PER_PAGE,
  type ProductOfferSort,
} from '@/lib/catalog/product-offers';

import { buildStorePath } from '@/lib/routes';
import { REVIEW_MAX_LENGTH } from '@/lib/reviews';

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

type ProductDetailsPageContentProps = {
  product: Product;
  reviews: ProductReview[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
  contextStoreId?: string;
};

//===================================================================

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
  const toast = useToast();
  const [updatingStoreId, setUpdatingStoreId] = useState<string | null>(null);
  const [pendingRemoveOffer, setPendingRemoveOffer] =
    useState<ProductOffer | null>(null);
  const [invoiceLimitMessage, setInvoiceLimitMessage] = useState('');

  const [storeNameQuery, setStoreNameQuery] = useState('');
  const [storeAddressQuery, setStoreAddressQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [offerSort, setOfferSort] = useState<ProductOfferSort>('newest');
  const [visibleOffersCount, setVisibleOffersCount] = useState(
    PRODUCT_OFFERS_PER_PAGE
  );
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

  const reviewsCountLabel = formatReviewsCount(reviewsTotal);
  const storesCountLabel = formatPharmaciesCount(
    productDetails.foundInStoresCount
  );

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

  const handleStoreNameQueryChange = (value: string) => {
    setStoreNameQuery(value);
    setVisibleOffersCount(PRODUCT_OFFERS_PER_PAGE);
  };

  const handleStoreAddressQueryChange = (value: string) => {
    setStoreAddressQuery(value);
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

  const handleLoadMoreOffers = () => {
    setIsOffersLoadingMore(true);

    window.setTimeout(() => {
      setVisibleOffersCount((count) => count + PRODUCT_OFFERS_PER_PAGE);
      setIsOffersLoadingMore(false);
    }, 250);
  };

  const { isFavorite, isFavoriteLoading, handleFavoriteClick, setIsFavorite } =
    useFavoriteToggle({
      id: productDetails.id,
      initialIsFavorite: Boolean(product.isFavorite),
      notifier: toast,
      loginMessage: 'Please log in to add products to favorites.',
      addedMessage: 'Product was added to favorites.',
      removedMessage: 'Product was removed from favorites.',
      errorMessage: 'Could not update favorites.',
      toggleFavorite: toggleFavoriteProduct,
    });

  const {
    reviewText,
    reviewRating,
    isReviewValid,
    isReviewSubmitting,
    handleReviewTextChange,
    handleReviewRatingChange,
    handleReviewSubmit,
  } = useReviewForm({
    createReview: (payload, currentToken) =>
      createProductReview(productDetails.id, payload, currentToken),
    notifier: toast,
  });

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
        if (isMounted) toast.error('Could not load cart data.');
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, productDetails.id, setIsFavorite, toast, token]);

  const handleAddUnit = async (offer: ProductOffer) => {
    if (!isAuthenticated || !token) return;

    try {
      setUpdatingStoreId(offer.storeId);
      const cartItem = getOfferCartItem(cart, productDetails.id, offer.storeId);

      const response = cartItem
        ? await updateCartItem(
            cartItem.id,
            { quantity: cartItem.quantity + 1 },
            token
          )
        : await addCartItem(
            {
              productId: productDetails.id,
              storeId: offer.storeId,
              quantity: 1,
            },
            token
          );

      setCart(response.cart);
      toast.success('One product unit was added to the order.');
    } catch (error) {
      if (isCartInvoiceLimitError(error)) {
        setInvoiceLimitMessage('limit');
      } else {
        toast.error('Could not add product to the order.');
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

      const response =
        cartItem.quantity === 1
          ? await removeCartItem(cartItem.id, token)
          : await updateCartItem(
              cartItem.id,
              { quantity: cartItem.quantity - 1 },
              token
            );

      setCart(response.cart);
      toast.success('One product unit was removed from the order.');
    } catch {
      toast.error('Could not remove product from the order.');
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
          <StockAvailability
            className={css.stockLine}
            stockQuantity={offer.activeQuantity}
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
              { label: 'Medicines catalog', href: ROUTES.MEDICINES_CATALOG },
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
                    {formatProductCategoryLabel(productDetails.category)}
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
                    maxLength={CATALOG_SEARCH_MAX_LENGTH}
                    sanitizeValue={sanitizeCatalogTextSearch}
                    onChange={handleStoreNameQueryChange}
                  />

                  <SearchInput
                    id="pharmacy-address-search"
                    label="Search by address"
                    value={storeAddressQuery}
                    placeholder="Enter city or address"
                    maxLength={CATALOG_SEARCH_MAX_LENGTH}
                    sanitizeValue={sanitizeCatalogTextSearch}
                    onChange={handleStoreAddressQueryChange}
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
                    <dd>
                      {formatProductCategoryLabel(productDetails.category)}
                    </dd>
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
                  onReviewRatingChange={handleReviewRatingChange}
                  onReviewSubmit={() => void handleReviewSubmit()}
                />
              </div>
            ) : null}
          </Container>
        </section>
      ) : null}
      {invoiceLimitMessage ? (
        <CartInvoiceLimitModal onClose={() => setInvoiceLimitMessage('')} />
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
