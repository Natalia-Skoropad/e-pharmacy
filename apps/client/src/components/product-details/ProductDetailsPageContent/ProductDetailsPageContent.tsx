'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Filter, Star } from 'lucide-react';

import {
  Button,
  ButtonLink,
  Container,
  DeliveryInfoCard,
  FavoriteToggleButton,
  LazyLoadButton,
  PaymentInfoCard,
  QuantityCounter,
  RatingSummary,
  SearchInput,
  SelectField,
  SvgIcon,
  Tabs,
  Toast,
  type TabItem,
} from '@/components/common';

import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ProductReviewsList from '@/components/product-details/ProductReviewsList';
import { useAuth } from '@/components/providers';

import { ROUTES } from '@/lib/constants/routes';

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
type OfferSort = 'price-asc' | 'price-desc' | 'rating-desc' | 'rating-asc';

type ProductDetailsPageContentProps = {
  product: Product;
  reviews: ProductReview[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
  contextStoreId?: string;
};

//===================================================================

const REVIEW_MAX_LENGTH = 200;
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
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating-desc', label: 'Rating: high to low' },
  { value: 'rating-asc', label: 'Rating: low to high' },
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

function getStoreHref(storeId: string): string {
  return `${ROUTES.MEDICINES_CATALOG}?storeId=${storeId}`;
}

function getOfferAddress(offer: ProductOffer): string {
  return [offer.storeCity, offer.storeAddress].filter(Boolean).join(', ');
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

  const [activeTab, setActiveTab] = useState<ProductTab>('about');
  const [cart, setCart] = useState<Cart | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isFavorite, setIsFavorite] = useState(Boolean(product.isFavorite));
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [updatingStoreId, setUpdatingStoreId] = useState<string | null>(null);

  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  const [storeNameQuery, setStoreNameQuery] = useState('');
  const [storeAddressQuery, setStoreAddressQuery] = useState('');
  const [offerSort, setOfferSort] = useState<OfferSort>('price-asc');
  const [visibleOffersCount, setVisibleOffersCount] = useState(OFFERS_PER_PAGE);
  const [isOffersLoadingMore, setIsOffersLoadingMore] = useState(false);
  const [areOfferFiltersOpen, setAreOfferFiltersOpen] = useState(false);

  const tabs = useMemo<TabItem<ProductTab>[]>(
    () => [
      { value: 'about', label: 'About product' },
      {
        value: 'prices',
        label: `Prices in pharmacies (${product.foundInStoresCount})`,
      },
      { value: 'characteristics', label: 'Characteristics' },
      { value: 'reviews', label: `Reviews (${reviewsTotal})` },
    ],
    [product.foundInStoresCount, reviewsTotal]
  );

  const reviewsCountLabel =
    reviewsTotal === 1 ? '1 review' : `${reviewsTotal} reviews`;

  const storesCountLabel = `${product.foundInStoresCount} ${
    product.foundInStoresCount === 1 ? 'pharmacy' : 'pharmacies'
  }`;

  const priceRangeLabel = formatPriceRange(product.offers);
  const longDescription = getLongDescription(product);

  const filteredOffers = useMemo(() => {
    const normalizedNameQuery = storeNameQuery.trim().toLowerCase();
    const normalizedAddressQuery = storeAddressQuery.trim().toLowerCase();

    return [...product.offers]
      .filter((offer) => {
        const nameMatches = offer.storeName
          .toLowerCase()
          .includes(normalizedNameQuery);

        const addressMatches = getOfferAddress(offer)
          .toLowerCase()
          .includes(normalizedAddressQuery);

        return nameMatches && addressMatches;
      })
      .sort((a, b) => {
        if (contextStoreId) {
          if (a.storeId === contextStoreId) return -1;
          if (b.storeId === contextStoreId) return 1;
        }

        if (offerSort === 'price-asc') {
          return a.price - b.price;
        }

        if (offerSort === 'price-desc') {
          return b.price - a.price;
        }

        if (offerSort === 'rating-desc') {
          return (b.storeRating ?? 0) - (a.storeRating ?? 0);
        }

        return (a.storeRating ?? 0) - (b.storeRating ?? 0);
      });
  }, [
    contextStoreId,
    offerSort,
    product.offers,
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

    getProductDetails(product.id, token)
      .then((response) => {
        if (isMounted) setIsFavorite(Boolean(response.product.isFavorite));
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
  }, [isAuthenticated, product.id, showToast, token]);

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
      const response = await toggleFavoriteProduct(product.id, token);

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
      const cartItem = getOfferCartItem(cart, product.id, offer.storeId);

      if (cartItem) {
        await updateCartItem(
          cartItem.id,
          { quantity: cartItem.quantity + 1 },
          token
        );
      } else {
        await addCartItem(
          { productId: product.id, storeId: offer.storeId, quantity: 1 },
          token
        );
      }

      await refreshCart();
      showToast('One product unit was added to the order.');
    } catch {
      showToast('Could not add product to the order.');
    } finally {
      setUpdatingStoreId(null);
    }
  };

  const handleRemoveUnit = async (offer: ProductOffer) => {
    if (!isAuthenticated || !token) return;

    const cartItem = getOfferCartItem(cart, product.id, offer.storeId);

    if (!cartItem) return;

    const shouldRemove =
      cartItem.quantity === 1
        ? window.confirm(
            'Are you sure you want to remove this product from the order?'
          )
        : true;

    if (!shouldRemove) return;

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

      await createProductReview(
        product.id,
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
    const cartItem = getOfferCartItem(cart, product.id, offer.storeId);
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
              { label: product.name },
            ]}
          />

          <h1 className="visually-hidden" id="product-title">
            Buy {product.name} online — compare pharmacy prices and product
            details
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
                {product.imageUrl ? (
                  <Image
                    className={css.image}
                    src={product.imageUrl}
                    alt={product.name}
                    fill
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
                    {CATEGORY_LABELS[product.category]}
                  </p>

                  <FavoriteToggleButton
                    isActive={isFavorite}
                    disabled={isFavoriteLoading || !isAuthReady}
                    onClick={handleFavoriteClick}
                    activeLabel="Remove product from favorites"
                    inactiveLabel="Add product to favorites"
                  />
                </div>

                <h2 className={css.title}>{product.name}</h2>

                <RatingSummary
                  className={css.ratingRow}
                  rating={product.rating}
                  reviewsCount={reviewsTotal}
                />

                <dl className={css.summaryList}>
                  <div className={css.summaryItem}>
                    <dt>Article</dt>
                    <dd>{product.article}</dd>
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
                      Pharmacies ({product.foundInStoresCount})
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
                    {areOfferFiltersOpen
                      ? 'Сховати фільтри'
                      : 'Показати фільтри'}
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

                  <SelectField
                    id="pharmacy-sort"
                    label="Sort pharmacies"
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
                              {offer.storeImageUrl ? (
                                <Image
                                  className={css.offerImage}
                                  src={offer.storeImageUrl}
                                  alt={`${offer.storeName} pharmacy`}
                                  fill
                                  sizes="380px"
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
                              href={getStoreHref(offer.storeId)}
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
                  {product.manufacturer ? (
                    <div className={css.detailItem}>
                      <dt>Manufacturer</dt>
                      <dd>{product.manufacturer}</dd>
                    </div>
                  ) : null}

                  {product.dosage ? (
                    <div className={css.detailItem}>
                      <dt>Dosage</dt>
                      <dd>{product.dosage}</dd>
                    </div>
                  ) : null}

                  {product.packageQuantity ? (
                    <div className={css.detailItem}>
                      <dt>Package</dt>
                      <dd>{product.packageQuantity}</dd>
                    </div>
                  ) : null}

                  <div className={css.detailItem}>
                    <dt>Category</dt>
                    <dd>{CATEGORY_LABELS[product.category]}</dd>
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

                <form
                  className={css.reviewForm}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleReviewSubmit();
                  }}
                >
                  <div>
                    <label className={css.reviewLabel} htmlFor="product-review">
                      Your review
                    </label>

                    <textarea
                      id="product-review"
                      className={css.reviewTextarea}
                      value={reviewText}
                      maxLength={REVIEW_MAX_LENGTH}
                      placeholder="Write 10–200 characters using latin letters."
                      onChange={(event) =>
                        handleReviewTextChange(event.target.value)
                      }
                    />

                    <p className={css.counter}>
                      {reviewText.length}/{REVIEW_MAX_LENGTH}
                    </p>
                  </div>

                  <fieldset className={css.ratingFieldset}>
                    <legend className={css.reviewLabel}>Rating</legend>

                    <div className={css.ratingButtons}>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          className={
                            reviewRating >= rating
                              ? css.starButtonActive
                              : css.starButton
                          }
                          key={rating}
                          type="button"
                          onClick={() => setReviewRating(rating)}
                          aria-label={`Set rating ${rating}`}
                        >
                          <Star size={20} aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className={css.reviewActions}>
                    <Button
                      type="submit"
                      className={css.reviewSubmitButton}
                      disabled={
                        !isReviewValid ||
                        isReviewSubmitting ||
                        !isAuthenticated ||
                        !isAuthReady
                      }
                    >
                      {isReviewSubmitting ? 'Sending...' : 'Send review'}
                    </Button>

                    {!isAuthenticated && isAuthReady ? (
                      <p className={css.authNote}>
                        Only logged-in users can submit reviews.
                      </p>
                    ) : null}
                  </div>
                </form>

                {areReviewsUnavailable ? (
                  <div className={css.notice} role="status">
                    Reviews are temporarily unavailable. Please check that the
                    backend API is running.
                  </div>
                ) : null}

                <ProductReviewsList reviews={reviews} />
              </div>
            ) : null}
          </Container>
        </section>
      ) : null}
    </main>
  );
}

export default ProductDetailsPageContent;
