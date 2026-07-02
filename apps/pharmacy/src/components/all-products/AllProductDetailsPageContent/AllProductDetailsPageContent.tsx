'use client';

import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  Button,
  ButtonLink,
  DataTable,
  PictureUpload,
  RatingSummary,
  ReviewsList,
  StatusBadge,
  StatusBanner,
  Tabs,
  type DataTableColumn,
  type ReviewsListItem,
  type TabItem,
} from '@e-pharmacy/ui/common';
import { PageHeader } from '@e-pharmacy/ui/layout';

import { PageLoader } from '@e-pharmacy/ui/status-pages';
import { isApiError } from '@e-pharmacy/api-client/core';

import type {
  EntityId,
  Product,
  ProductOffer,
  ProductReview,
} from '@e-pharmacy/types';

import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';

import {
  getMyPharmacyProfile,
  getProductDetails,
  getProductReviews,
} from '@/lib/api/browser';

import { getPharmacyAllProductsPath } from '@/lib/layout/routes';

import css from './AllProductDetailsPageContent.module.css';

//===================================================================

type ProductDetailsTab =
  | 'details'
  | 'statistics'
  | 'stock-movement'
  | 'related-orders'
  | 'characteristics'
  | 'reviews';

//===================================================================

type AllProductDetailsPageContentProps = Readonly<{
  productId: string;
  backHref?: string;
  backLabel?: string;
  pageDescription?: string;
  bannerTitle?: string;
  bannerMessage?: string;
  productKicker?: string;
  showAddAction?: boolean;
}>;

type ProductDetailsError = Readonly<{
  title: string;
  message: string;
}>;

type SummaryItem = Readonly<{
  label: string;
  value: ReactNode;
}>;

type CharacteristicItem = Readonly<{
  label: string;
  value: string;
}>;

type StatisticCard = Readonly<{
  label: string;
  value: string | number;
  hint?: string;
}>;

type StockMovementRow = Readonly<{
  id: string;
  date: string;
  eventType: string;
  quantity: string;
  price: string;
  orderNumber: string;
  source: string;
  comment: string;
}>;

type RelatedOrderRow = Readonly<{
  id: string;
  orderNumber: string;
  orderDate: string;
  client: string;
  quantity: string;
  fixedUnitPrice: string;
  amount: string;
  status: string;
}>;

//===================================================================

const CATEGORY_LABELS = {
  medicine: 'Medicine',
  vitamins: 'Vitamins',
  beauty: 'Beauty',
  hygiene: 'Hygiene',
  medical_devices: 'Medical devices',
  other: 'Other',
} as const;

//===================================================================

const PRODUCT_DETAILS_TABS: Array<TabItem<ProductDetailsTab>> = [
  { value: 'details', label: 'Details' },
  { value: 'statistics', label: 'Statistics' },
  { value: 'stock-movement', label: 'Stock movement' },
  { value: 'related-orders', label: 'Related orders' },
  { value: 'characteristics', label: 'Characteristics' },
  { value: 'reviews', label: 'Reviews' },
];

//===================================================================

const STOCK_MOVEMENT_ROWS: StockMovementRow[] = [];
const RELATED_ORDER_ROWS: RelatedOrderRow[] = [];

//===================================================================

const DEFAULT_BANNER_TITLE = 'Adding this product is locked';

const DEFAULT_BANNER_MESSAGE =
  'You can review active Admin product details now. Add-to-my-pharmacy actions unlock after Admin verifies your pharmacy profile.';

const BREADCRUMB_LABEL_EVENT = 'pharmacy:breadcrumb-current-label';

//===================================================================

function getProductDetailsError(error: unknown): ProductDetailsError {
  if (isApiError(error) && [400, 404, 422].includes(error.status)) {
    return {
      title: 'Product not found',
      message: 'This product does not exist.',
    };
  }

  return {
    title: 'Product could not be loaded',
    message: 'Could not load product data. Please try again.',
  };
}

//===================================================================

function getProductOffer(
  product: Product,
  pharmacyId: EntityId | null
): ProductOffer | null {
  if (!pharmacyId) return null;

  return (
    product.offers.find(
      (offer) => String(offer.pharmacyId) === String(pharmacyId)
    ) ?? null
  );
}

//===================================================================

function getProductStatusLabel(product: Product): string {
  if (product.status === 'blocked') return 'Blocked';
  if (product.status === 'new') return 'New';

  return 'Active';
}

//===================================================================

function getProductPriceLabel(product: Product, offer: ProductOffer | null) {
  if (offer) return formatPrice(offer.price);

  return product.price > 0 ? formatPrice(product.price) : '—';
}

//===================================================================

function getStockQuantity(offer: ProductOffer | null): number {
  return offer?.totalQuantity ?? 0;
}

//===================================================================

function getReservedQuantity(offer: ProductOffer | null): number {
  return offer?.reservedQuantity ?? 0;
}

//===================================================================

function getAvailableQuantity(offer: ProductOffer | null): number {
  if (!offer) return 0;

  return (
    offer.availableQuantity ??
    Math.max(0, offer.totalQuantity - offer.reservedQuantity)
  );
}

//===================================================================

function getProductImageSrc(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;

  if (/^(https?:|data:|blob:)/i.test(imageUrl)) return imageUrl;

  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV !== 'production' ? 'http://localhost:4000' : '')
  ).replace(/\/$/, '');

  if (apiUrl && imageUrl.startsWith('/images/')) {
    return `${apiUrl}${imageUrl}`;
  }

  if (apiUrl && imageUrl.startsWith('images/')) {
    return `${apiUrl}/${imageUrl}`;
  }

  return imageUrl;
}

//===================================================================

function dispatchBreadcrumbLabel(label: string): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(BREADCRUMB_LABEL_EVENT, {
      detail: {
        pathname: window.location.pathname,
        label,
      },
    })
  );
}

//===================================================================

function getProductSummaryItems(
  product: Product,
  offer: ProductOffer | null
): SummaryItem[] {
  const items: SummaryItem[] = [
    { label: 'Article', value: product.article },
    { label: 'Category', value: CATEGORY_LABELS[product.category] },
    {
      label: 'Status',
      value: (
        <StatusBadge
          status={product.status}
          label={getProductStatusLabel(product)}
        />
      ),
    },
  ];

  if (product.createdAt) {
    items.push({
      label: 'Admin creation date',
      value: formatShortDate(product.createdAt),
    });
  }

  if (product.updatedAt) {
    items.push({
      label: 'Admin last update date',
      value: formatShortDate(product.updatedAt),
    });
  }

  if (offer) {
    items.push(
      { label: 'Current price', value: formatPrice(offer.price) },
      { label: 'Stock quantity', value: offer.totalQuantity },
      { label: 'Reserved quantity', value: offer.reservedQuantity },
      { label: 'Available quantity', value: getAvailableQuantity(offer) }
    );
  }

  if (offer?.createdAt) {
    items.push({
      label: 'Date added to pharmacy',
      value: formatShortDate(offer.createdAt),
    });
  }

  return items;
}

//===================================================================

function getProductCharacteristics(product: Product): CharacteristicItem[] {
  return [
    product.manufacturer
      ? { label: 'Manufacturer', value: product.manufacturer }
      : null,
    product.dosage ? { label: 'Dosage', value: product.dosage } : null,
    product.packageQuantity
      ? { label: 'Package', value: product.packageQuantity }
      : null,
    { label: 'Category', value: CATEGORY_LABELS[product.category] },
  ].filter((item): item is CharacteristicItem => Boolean(item));
}

//===================================================================

function getStatisticCards(offer: ProductOffer | null): StatisticCard[] {
  const stockQuantity = getStockQuantity(offer);
  const reservedQuantity = getReservedQuantity(offer);
  const availableQuantity = getAvailableQuantity(offer);
  const currentPrice = offer?.price ?? 0;

  return [
    {
      label: 'Stock quantity',
      value: stockQuantity,
      hint: currentPrice
        ? formatPrice(stockQuantity * currentPrice)
        : undefined,
    },
    {
      label: 'Reserved quantity',
      value: reservedQuantity,
      hint: currentPrice
        ? formatPrice(reservedQuantity * currentPrice)
        : undefined,
    },
    {
      label: 'Available quantity',
      value: availableQuantity,
      hint: currentPrice
        ? formatPrice(availableQuantity * currentPrice)
        : undefined,
    },
    { label: 'New orders', value: 0, hint: formatPrice(0) },
    { label: 'In work orders', value: 0, hint: formatPrice(0) },
    { label: 'Successful orders', value: 0, hint: formatPrice(0) },
    { label: 'Rejected orders', value: 0, hint: formatPrice(0) },
  ];
}

//===================================================================

function mapReviewsToListItems(reviews: ProductReview[]): ReviewsListItem[] {
  return reviews.map((review) => ({
    id: String(review.id),
    userName: review.userName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  }));
}

//===================================================================

function EmptyPanel({ children }: Readonly<{ children: string }>) {
  return <p className={css.emptyPanel}>{children}</p>;
}

//===================================================================

function AllProductDetailsPageContent({
  productId,
  backHref = getPharmacyAllProductsPath(),
  backLabel = 'Back to all products',
  bannerTitle = DEFAULT_BANNER_TITLE,
  bannerMessage = DEFAULT_BANNER_MESSAGE,
  showAddAction = true,
}: AllProductDetailsPageContentProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [currentPharmacyId, setCurrentPharmacyId] = useState<EntityId | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<ProductDetailsTab>('details');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ProductDetailsError | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProductData() {
      setIsLoading(true);
      setError(null);

      try {
        const [productResponse, profileResponse, reviewsResponse] =
          await Promise.all([
            getProductDetails(productId),
            getMyPharmacyProfile().catch(() => null),
            getProductReviews(productId).catch(() => null),
          ]);

        if (!isMounted) return;

        setProduct(productResponse.product);
        setReviews(reviewsResponse?.items ?? []);
        setReviewsTotal(
          reviewsResponse?.total ?? productResponse.product.reviewsCount ?? 0
        );
        setCurrentPharmacyId(profileResponse?.pharmacy.id ?? null);
      } catch (loadError) {
        if (!isMounted) return;

        setProduct(null);
        setReviews([]);
        setReviewsTotal(0);
        setError(getProductDetailsError(loadError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProductData();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!product?.name) return;

    dispatchBreadcrumbLabel(product.name);
  }, [product?.name]);

  const currentOffer = product
    ? getProductOffer(product, currentPharmacyId)
    : null;
  const isAddedToPharmacy = Boolean(currentOffer);
  const productImageSrc = getProductImageSrc(product?.imageUrl);
  const tabs = PRODUCT_DETAILS_TABS.map((tab) =>
    tab.value === 'reviews'
      ? { ...tab, label: `Reviews (${reviewsTotal})` }
      : tab
  );

  const summaryItems = product
    ? getProductSummaryItems(product, currentOffer)
    : [];
  const characteristics = product ? getProductCharacteristics(product) : [];
  const statisticCards = getStatisticCards(currentOffer);
  const reviewItems = mapReviewsToListItems(reviews);

  const stockMovementColumns = useMemo<
    Array<DataTableColumn<StockMovementRow>>
  >(
    () => [
      { key: 'date', title: 'Date', render: (row) => row.date },
      {
        key: 'eventType',
        title: 'Event type',
        render: (row) => row.eventType,
      },
      { key: 'quantity', title: 'Quantity', render: (row) => row.quantity },
      { key: 'price', title: 'Price', render: (row) => row.price },
      {
        key: 'orderNumber',
        title: 'Order number',
        render: (row) => row.orderNumber,
      },
      { key: 'source', title: 'Source', render: (row) => row.source },
      { key: 'comment', title: 'Comment', render: (row) => row.comment },
    ],
    []
  );

  const relatedOrderColumns = useMemo<Array<DataTableColumn<RelatedOrderRow>>>(
    () => [
      {
        key: 'orderNumber',
        title: 'Order number',
        render: (row) => row.orderNumber,
      },
      {
        key: 'orderDate',
        title: 'Order date',
        render: (row) => row.orderDate,
      },
      { key: 'client', title: 'Client', render: (row) => row.client },
      { key: 'quantity', title: 'Quantity', render: (row) => row.quantity },
      {
        key: 'fixedUnitPrice',
        title: 'Fixed unit price',
        render: (row) => row.fixedUnitPrice,
      },
      { key: 'amount', title: 'Amount', render: (row) => row.amount },
      { key: 'status', title: 'Order status', render: (row) => row.status },
    ],
    []
  );

  if (isLoading) {
    return (
      <main className={css.page} aria-label="Loading global product">
        <PageLoader label="Loading product data..." />
      </main>
    );
  }

  return (
    <main className={css.page} aria-labelledby="global-product-page-title">
      <div className={css.contentCard}>
        <div className={css.stack}>
          <div className={css.titleBlock}>
            <PageHeader
              title={
                product ? product.name : (error?.title ?? 'Global product')
              }
              titleId="global-product-page-title"
              icon={<PackageSearch size={23} aria-hidden="true" />}
            />

            {product ? (
              <RatingSummary
                className={css.titleRating}
                rating={product.rating}
                reviewsCount={reviewsTotal}
              />
            ) : null}
          </div>

          {error ? (
            <StatusBanner
              status="rejected"
              title={error.title}
              message={error.message}
            />
          ) : null}

          {product ? (
            <section className={css.tabsSection} aria-label="Product data">
              <Tabs
                items={tabs}
                activeValue={activeTab}
                ariaLabel="Product details tabs"
                mobileVisibleCount={1}
                tabletVisibleCount={3}
                onChange={setActiveTab}
              />

              {activeTab === 'details' ? (
                <div className={css.detailsTab}>
                  <StatusBanner
                    status="new"
                    label="New"
                    title={bannerTitle}
                    message={bannerMessage}
                  />

                  <section
                    className={css.detailsGrid}
                    aria-labelledby="product-summary-title"
                  >
                    <div className={css.visualCard}>
                      {productImageSrc ? (
                        <PictureUpload
                          className={css.image}
                          src={productImageSrc}
                          alt={product.name}
                        />
                      ) : (
                        <div
                          className={css.imagePlaceholder}
                          aria-hidden="true"
                        >
                          {product.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className={css.card}>
                      <p
                        className={
                          isAddedToPharmacy ? css.priceLine : css.productNotice
                        }
                      >
                        {isAddedToPharmacy
                          ? getProductPriceLabel(product, currentOffer)
                          : 'This product is not added to your pharmacy yet'}
                      </p>

                      <dl className={css.detailsList}>
                        {summaryItems.map((item) => (
                          <div key={item.label}>
                            <dt>{item.label}</dt>
                            <dd>{item.value}</dd>
                          </div>
                        ))}
                      </dl>

                      <div className={css.actions}>
                        {showAddAction ? (
                          <Button
                            className={css.actionButton}
                            type="button"
                            size="sm"
                            disabled
                          >
                            {product.status === 'blocked'
                              ? 'Unavailable'
                              : isAddedToPharmacy
                                ? 'Added to your pharmacy'
                                : 'Add to my pharmacy after verification'}
                          </Button>
                        ) : null}

                        <ButtonLink
                          className={css.actionButton}
                          href={backHref}
                          variant="secondary"
                          size="sm"
                          renderLink={({
                            href,
                            className,
                            children,
                            ...props
                          }) => (
                            <Link href={href} className={className} {...props}>
                              {children}
                            </Link>
                          )}
                        >
                          {backLabel}
                        </ButtonLink>
                      </div>
                    </div>
                  </section>
                </div>
              ) : (
                <div className={css.tabPanel}>
                  {activeTab === 'statistics' ? (
                    <>
                      <h3 className={css.panelTitle}>Statistics</h3>

                      {isAddedToPharmacy ? (
                        <ul className={css.statsGrid}>
                          {statisticCards.map((statistic) => (
                            <li className={css.statCard} key={statistic.label}>
                              <span>{statistic.label}</span>
                              <strong>{statistic.value}</strong>
                              {statistic.hint ? (
                                <small>{statistic.hint}</small>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <EmptyPanel>
                          This product is not added to your pharmacy, so
                          statistics are unavailable.
                        </EmptyPanel>
                      )}
                    </>
                  ) : null}

                  {activeTab === 'stock-movement' ? (
                    <>
                      <h3 className={css.panelTitle}>Stock movement</h3>

                      {isAddedToPharmacy ? (
                        <DataTable
                          columns={stockMovementColumns}
                          items={STOCK_MOVEMENT_ROWS}
                          getItemKey={(row) => row.id}
                          minWidth={980}
                          labels={{
                            empty: 'Stock movement history is empty.',
                          }}
                        />
                      ) : (
                        <EmptyPanel>
                          This product is not added to your pharmacy, so stock
                          movement is unavailable.
                        </EmptyPanel>
                      )}
                    </>
                  ) : null}

                  {activeTab === 'related-orders' ? (
                    <>
                      <h3 className={css.panelTitle}>Related orders</h3>

                      {isAddedToPharmacy ? (
                        <DataTable
                          columns={relatedOrderColumns}
                          items={RELATED_ORDER_ROWS}
                          getItemKey={(row) => row.id}
                          minWidth={1040}
                          labels={{
                            empty: 'There are no orders with this product yet.',
                          }}
                        />
                      ) : (
                        <EmptyPanel>
                          This product is not added to your pharmacy, so related
                          orders are unavailable.
                        </EmptyPanel>
                      )}
                    </>
                  ) : null}

                  {activeTab === 'characteristics' ? (
                    <>
                      <h3 className={css.panelTitle}>Characteristics</h3>

                      {characteristics.length > 0 ? (
                        <dl className={css.characteristicsList}>
                          {characteristics.map((item) => (
                            <div
                              className={css.characteristicItem}
                              key={item.label}
                            >
                              <dt>{item.label}</dt>
                              <dd>{item.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <EmptyPanel>
                          Characteristics for this product have not been added
                          yet.
                        </EmptyPanel>
                      )}

                      <div className={css.descriptionBlock}>
                        {product.description ? (
                          <p>{product.description}</p>
                        ) : null}

                        <p>
                          Before purchasing, compare pharmacy prices, check the
                          available quantity, read client reviews, and make sure
                          the selected offer matches your needs. Information on
                          this page helps clients quickly understand the
                          product, its main properties, and where it can be
                          bought online.
                        </p>
                      </div>
                    </>
                  ) : null}

                  {activeTab === 'reviews' ? (
                    <ReviewsList
                      reviews={reviewItems}
                      title="Reviews"
                      emptyTitle="This product has no reviews yet."
                      emptyText="Product reviews will appear here after clients share their feedback."
                    />
                  ) : null}
                </div>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default AllProductDetailsPageContent;
export { AllProductDetailsPageContent };
