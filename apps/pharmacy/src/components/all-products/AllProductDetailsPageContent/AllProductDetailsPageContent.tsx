'use client';

import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  Button,
  ButtonLink,
  CloseIconButton,
  CountLabel,
  DataTable,
  DateFilter,
  FiltersButton,
  formatInitials,
  LoadingSpinner,
  ShimmerImage,
  RatingSummary,
  ReviewsList,
  Pagination,
  ResetFiltersButton,
  RowsPerPageSelect,
  SearchInput,
  SelectField,
  TableHeaderTitle,
  TableImagePreview,
  Tabs,
  TextActionButton,
  type DataTableColumn,
  type DateFilterValue,
  type ReviewsListItem,
  type RowsPerPageValue,
  type SelectOption,
  type TabItem,
} from '@e-pharmacy/ui/common';

import {
  OrderStatistics,
  OwnProductStatistics,
  StatusBadge,
  StatusBanner,
} from '@e-pharmacy/ui/statistics';

import { ConfirmationModal } from '@e-pharmacy/ui/modals';
import { useToast } from '@e-pharmacy/ui/feedback';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { isApiError } from '@e-pharmacy/api-client/core';

import {
  PRODUCT_CATEGORY_LABELS,
  type OwnProductStatisticsCounts,
} from '@e-pharmacy/types/products';

import type {
  EntityId,
  PharmacyStatus,
  Product,
  ProductOffer,
  ProductReview,
  OrderStatus,
  ProductStockBalance,
  ProductStockMovement,
  StockMovementEventType,
  StockMovementSource,
} from '@e-pharmacy/types';

import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';
import type { OrderStatisticsCounts } from '@e-pharmacy/types/orders';

import {
  addProductToMyPharmacy,
  removeProductFromMyPharmacy,
  getMyPharmacyProfile,
  getPharmacyOrders,
  getProductDetails,
  getProductReviews,
  getProductStockMovements,
} from '@/lib/api/browser';

import {
  getPharmacyAllProductsPath,
  getPharmacyClientPath,
  getPharmacyOrderPath,
} from '@/lib/layout/routes';

import {
  ORDER_STATUS_LABELS,
  type PharmacyOrderRow,
} from '@/lib/orders/orders';

import {
  getLockedFeatureBannerLabel,
  getLockedFeatureBannerStatus,
} from '@/lib/pharmacies/current-pharmacy-status';

import { getProductImageSrc } from '@/lib/products/product-images';

import css from './AllProductDetailsPageContent.module.css';

//===================================================================

type ProductDetailsTab =
  | 'details'
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
  showRemoveAction?: boolean;
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

type ProductTabDateFilter = DateFilterValue;

type StockMovementFilters = Readonly<{
  date: ProductTabDateFilter;
  eventType: 'all' | StockMovementEventType;
  source: 'all' | StockMovementSource;
  orderStatus: 'all' | OrderStatus;
}>;

type RelatedOrdersFilters = Readonly<{
  date: ProductTabDateFilter;
  orderStatus: 'all' | OrderStatus;
}>;

type StockMovementRow = Readonly<{
  id: string;
  orderId?: string;
  date: string;
  dateValue: string;
  eventType: string;
  eventTypeValue: StockMovementEventType;
  quantity: string;
  quantityValue: number;
  price: string;
  totalAmount: string;
  orderNumber: string;
  orderStatus?: OrderStatus;
  source: string;
  sourceValue: StockMovementSource;
  comment: string;
}>;

type RelatedOrderRow = Readonly<{
  id: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  orderDateValue: string;
  client: string;
  clientId: EntityId | null;
  clientPhotoUrl: string | null;
  quantity: string;
  quantityValue: number;
  fixedUnitPrice: string;
  unitPriceValue: number;
  amount: string;
  amountValue: number;
  status: OrderStatus;
}>;

//===================================================================

const PRODUCT_DETAILS_TABS: Array<TabItem<ProductDetailsTab>> = [
  { value: 'details', label: 'Details' },
  { value: 'stock-movement', label: 'Stock movement' },
  { value: 'related-orders', label: 'Related orders' },
  { value: 'characteristics', label: 'Characteristics' },
  { value: 'reviews', label: 'Reviews' },
];

//===================================================================

const DEFAULT_PRODUCT_TAB_DATE_FILTER: ProductTabDateFilter = {
  from: '',
  to: '',
};

const DEFAULT_STOCK_MOVEMENT_FILTERS: StockMovementFilters = {
  date: DEFAULT_PRODUCT_TAB_DATE_FILTER,
  eventType: 'all',
  source: 'all',
  orderStatus: 'all',
};

const DEFAULT_RELATED_ORDERS_FILTERS: RelatedOrdersFilters = {
  date: DEFAULT_PRODUCT_TAB_DATE_FILTER,
  orderStatus: 'all',
};

const ORDER_STATUS_OPTIONS: Array<SelectOption<'all' | OrderStatus>> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: ORDER_STATUS_LABELS.new },
  { value: 'in_progress', label: ORDER_STATUS_LABELS.in_progress },
  { value: 'successful', label: ORDER_STATUS_LABELS.successful },
  { value: 'rejected', label: ORDER_STATUS_LABELS.rejected },
];

const STOCK_EVENT_TYPE_OPTIONS: Array<
  SelectOption<'all' | StockMovementEventType>
> = [
  { value: 'all', label: 'All' },
  { value: 'arrival', label: 'Stock arrival' },
  { value: 'reserve', label: 'Reserved in order' },
  { value: 'write_off', label: 'Stock write-off' },
  { value: 'release', label: 'Reserve released' },
  { value: 'adjustment', label: 'Stock adjustment' },
];

const STOCK_SOURCE_OPTIONS: Array<SelectOption<'all' | StockMovementSource>> = [
  { value: 'all', label: 'All' },
  { value: 'pharmacy_stock', label: 'Pharmacy stock' },
  { value: 'client_order', label: 'Client order' },
];

const PRODUCT_TAB_ROWS_PER_PAGE_OPTIONS: RowsPerPageValue[] = [20, 50, 100];

const STOCK_EVENT_LABELS: Record<StockMovementEventType, string> = {
  arrival: 'Stock arrival',
  reserve: 'Reserved in order',
  release: 'Reserve released',
  write_off: 'Stock write-off',
  adjustment: 'Stock adjustment',
};

const STOCK_SOURCE_LABELS: Record<StockMovementSource, string> = {
  pharmacy_stock: 'Pharmacy stock',
  client_order: 'Client order',
};

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

function getProductActionErrorMessage(error: unknown): string {
  if (isApiError(error) && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;

  return 'Product action could not be completed. Please try again.';
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
    { label: 'Category', value: PRODUCT_CATEGORY_LABELS[product.category] },
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
    { label: 'Category', value: PRODUCT_CATEGORY_LABELS[product.category] },
  ].filter((item): item is CharacteristicItem => Boolean(item));
}

//===================================================================

function getSingleProductStatisticsCounts(
  offer: ProductOffer | null,
  stockBalance?: ProductStockBalance | null,
  activeOrdersReservedQuantity?: number
): OwnProductStatisticsCounts {
  const stockQuantity = stockBalance?.stockQuantity ?? getStockQuantity(offer);
  const reservedQuantity =
    activeOrdersReservedQuantity ??
    stockBalance?.reservedQuantity ??
    getReservedQuantity(offer);
  const availableQuantity = Math.max(0, stockQuantity - reservedQuantity);
  const currentPrice = offer?.price ?? 0;

  return {
    inStock: {
      quantity: stockQuantity,
      amount: currentPrice ? stockQuantity * currentPrice : 0,
    },

    reserved: {
      quantity: reservedQuantity,
      amount: currentPrice ? reservedQuantity * currentPrice : 0,
    },

    available: {
      quantity: availableQuantity,
      amount: currentPrice ? availableQuantity * currentPrice : 0,
    },

    outOfStock: { quantity: offer && availableQuantity === 0 ? 1 : 0 },
  };
}

//===================================================================

function getMovementQuantity(movement: ProductStockMovement): number {
  if (movement.eventType === 'release') return -movement.quantity;
  if (movement.eventType === 'write_off') return -movement.quantity;

  return movement.quantity;
}

//===================================================================

function getStockMovementRows(
  movements: ProductStockMovement[],
  filters: StockMovementFilters,
  orderNumberSearch: string,
  commentSearch: string
): StockMovementRow[] {
  const normalizedOrderNumber = orderNumberSearch.trim().toLowerCase();
  const normalizedComment = commentSearch.trim().toLowerCase();

  return movements
    .map((movement): StockMovementRow => {
      const quantityValue = getMovementQuantity(movement);
      return {
        id: movement.id,
        ...(movement.orderId ? { orderId: movement.orderId } : {}),
        date: formatShortDate(movement.occurredAt),
        dateValue: movement.occurredAt,
        eventType: STOCK_EVENT_LABELS[movement.eventType],
        eventTypeValue: movement.eventType,
        quantity: `${quantityValue > 0 ? '+' : ''}${quantityValue}`,
        quantityValue,
        price: formatPrice(movement.unitPrice),
        totalAmount: formatPrice(movement.movementValue),
        orderNumber: movement.orderNumber ?? '—',
        ...(movement.orderStatus ? { orderStatus: movement.orderStatus } : {}),
        source: STOCK_SOURCE_LABELS[movement.source],
        sourceValue: movement.source,
        comment: movement.comment,
      };
    })
    .filter((row) => {
      if (
        filters.eventType !== 'all' &&
        row.eventTypeValue !== filters.eventType
      ) {
        return false;
      }

      if (filters.source !== 'all' && row.sourceValue !== filters.source) {
        return false;
      }

      if (
        filters.orderStatus !== 'all' &&
        row.orderStatus !== filters.orderStatus
      ) {
        return false;
      }

      if (filters.date.from && row.dateValue < filters.date.from) {
        return false;
      }

      if (
        filters.date.to &&
        row.dateValue > `${filters.date.to}T23:59:59.999Z`
      ) {
        return false;
      }

      if (
        normalizedOrderNumber &&
        !row.orderNumber.toLowerCase().includes(normalizedOrderNumber)
      ) {
        return false;
      }

      if (
        normalizedComment &&
        !row.comment.toLowerCase().includes(normalizedComment)
      ) {
        return false;
      }

      return true;
    })
    .sort(
      (first, second) =>
        new Date(second.dateValue).getTime() -
        new Date(first.dateValue).getTime()
    );
}

//===================================================================

function getRelatedOrderRows(
  productId: EntityId,
  orders: PharmacyOrderRow[]
): RelatedOrderRow[] {
  return orders.flatMap((order) => {
    const item = order.items.find(
      (orderItem) => String(orderItem.productId) === String(productId)
    );

    if (!item) return [];

    return [
      {
        id: `${order.id}-${item.id}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderDate: formatShortDate(order.orderDate),
        orderDateValue: order.orderDate,
        client: order.client,
        clientId: order.clientId,
        clientPhotoUrl: order.clientPhotoUrl,
        quantity: String(item.quantity),
        quantityValue: item.quantity,
        fixedUnitPrice: formatPrice(item.unitPrice),
        unitPriceValue: item.unitPrice,
        amount: formatPrice(item.totalPrice),
        amountValue: item.totalPrice,
        status: order.status,
      },
    ];
  });
}

//===================================================================

function getActiveOrdersReservedQuantity(
  rows: RelatedOrderRow[]
): number | undefined {
  if (rows.length === 0) return undefined;

  return rows.reduce(
    (total, row) =>
      row.status === 'new' || row.status === 'in_progress'
        ? total + row.quantityValue
        : total,
    0
  );
}

//===================================================================

function getRelatedOrderStatistics(
  rows: RelatedOrderRow[]
): OrderStatisticsCounts {
  return rows.reduce<OrderStatisticsCounts>(
    (acc, row) => ({
      ...acc,
      [row.status]: {
        count: acc[row.status].count + row.quantityValue,
        amount: acc[row.status].amount + row.amountValue,
      },
    }),
    {
      new: { count: 0, amount: 0 },
      in_progress: { count: 0, amount: 0 },
      successful: { count: 0, amount: 0 },
      rejected: { count: 0, amount: 0 },
    }
  );
}

//===================================================================

function paginateRows<TRow>(
  rows: TRow[],
  page: number,
  perPage: number
): TRow[] {
  return rows.slice((page - 1) * perPage, page * perPage);
}

//===================================================================

function getTotalPages(total: number, perPage: number): number {
  return Math.ceil(total / perPage);
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

type ProductTabFiltersDrawerProps = Readonly<{
  id: string;
  title: string;
  children: ReactNode;
  hasActiveFilters: boolean;
  onReset: () => void;
  onClose: () => void;
}>;

function ProductTabFiltersDrawer({
  id,
  title,
  children,
  hasActiveFilters,
  onReset,
  onClose,
}: ProductTabFiltersDrawerProps) {
  return (
    <div className={css.filtersBackdrop} role="presentation">
      <aside
        id={id}
        className={css.filtersPanel}
        aria-labelledby={`${id}-title`}
        aria-modal="true"
        role="dialog"
      >
        <div className={css.filtersHeader}>
          <div>
            <p className={css.filtersKicker}>Product details</p>
            <h2 className={css.filtersTitle} id={`${id}-title`}>
              {title}
            </h2>
          </div>

          <CloseIconButton label="Close filters" onClick={onClose} />
        </div>

        <div className={css.filtersControls}>{children}</div>

        {hasActiveFilters ? (
          <ResetFiltersButton
            className={css.resetButton}
            href="#"
            onClick={() => {
              onReset();
              onClose();
            }}
          />
        ) : null}
      </aside>
    </div>
  );
}

//===================================================================

function AllProductDetailsPageContent({
  productId,
  backHref = getPharmacyAllProductsPath(),
  backLabel = 'Back to all products',
  bannerTitle = DEFAULT_BANNER_TITLE,
  bannerMessage = DEFAULT_BANNER_MESSAGE,
  showAddAction = true,
  showRemoveAction = false,
}: AllProductDetailsPageContentProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [relatedOrders, setRelatedOrders] = useState<PharmacyOrderRow[]>([]);
  const [stockMovements, setStockMovements] = useState<ProductStockMovement[]>(
    []
  );
  const [stockBalance, setStockBalance] = useState<ProductStockBalance | null>(
    null
  );

  const [currentPharmacyId, setCurrentPharmacyId] = useState<EntityId | null>(
    null
  );

  const [pharmacyStatus, setPharmacyStatus] = useState<PharmacyStatus | null>(
    null
  );

  const [activeTab, setActiveTab] = useState<ProductDetailsTab>('details');
  const [stockOrderNumberSearch, setStockOrderNumberSearch] = useState('');
  const [stockCommentSearch, setStockCommentSearch] = useState('');

  const [stockRowsPerPage, setStockRowsPerPage] =
    useState<RowsPerPageValue>(20);

  const [stockCurrentPage, setStockCurrentPage] = useState(1);

  const [stockFilters, setStockFilters] = useState<StockMovementFilters>(
    DEFAULT_STOCK_MOVEMENT_FILTERS
  );
  const [isStockFiltersOpen, setIsStockFiltersOpen] = useState(false);

  const [relatedOrderNumberSearch, setRelatedOrderNumberSearch] = useState('');
  const [relatedClientSearch, setRelatedClientSearch] = useState('');

  const [relatedRowsPerPage, setRelatedRowsPerPage] =
    useState<RowsPerPageValue>(20);

  const [relatedCurrentPage, setRelatedCurrentPage] = useState(1);

  const [relatedFilters, setRelatedFilters] = useState<RelatedOrdersFilters>(
    DEFAULT_RELATED_ORDERS_FILTERS
  );

  const [isRelatedFiltersOpen, setIsRelatedFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isRemovingProduct, setIsRemovingProduct] = useState(false);
  const [error, setError] = useState<ProductDetailsError | null>(null);
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadProductData() {
      setIsLoading(true);
      setError(null);

      try {
        const [
          productResponse,
          profileResponse,
          reviewsResponse,
          ordersResponse,
          stockMovementsResponse,
        ] = await Promise.all([
          getProductDetails(productId),
          getMyPharmacyProfile().catch(() => null),
          getProductReviews(productId).catch(() => null),
          getPharmacyOrders({ page: 1, perPage: 200, productId }).catch(
            () => null
          ),
          getProductStockMovements(productId).catch(() => null),
        ]);

        if (!isMounted) return;

        setProduct(productResponse.product);
        setReviews(reviewsResponse?.items ?? []);
        setReviewsTotal(
          reviewsResponse?.total ?? productResponse.product.reviewsCount ?? 0
        );
        setRelatedOrders(ordersResponse?.items ?? []);
        setStockMovements(stockMovementsResponse?.items ?? []);
        setStockBalance(stockMovementsResponse?.stock ?? null);
        setCurrentPharmacyId(profileResponse?.pharmacy.id ?? null);
        setPharmacyStatus(profileResponse?.pharmacy.status ?? 'new');
      } catch (loadError) {
        if (!isMounted) return;

        setProduct(null);
        setReviews([]);
        setReviewsTotal(0);
        setRelatedOrders([]);
        setStockMovements([]);
        setStockBalance(null);
        setPharmacyStatus('new');
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

  useEffect(() => {
    if (!product || !currentPharmacyId) return;

    const currentProductId = product.id;
    let isMounted = true;

    async function loadRelatedOrders() {
      const response = await getPharmacyOrders({
        page: 1,
        perPage: 200,
        productId: currentProductId,
        orderNumber: relatedOrderNumberSearch.trim() || undefined,
        client: relatedClientSearch.trim() || undefined,
        status:
          relatedFilters.orderStatus === 'all'
            ? undefined
            : relatedFilters.orderStatus,
        dateFrom: relatedFilters.date.from || undefined,
        dateTo: relatedFilters.date.to || undefined,
      });

      if (isMounted) setRelatedOrders(response.items);
    }

    void loadRelatedOrders().catch(() => {
      if (isMounted) setRelatedOrders([]);
    });

    return () => {
      isMounted = false;
    };
  }, [
    currentPharmacyId,
    product,
    relatedClientSearch,
    relatedFilters,
    relatedOrderNumberSearch,
  ]);

  const currentOffer = product
    ? getProductOffer(product, currentPharmacyId)
    : null;

  const isAddedToPharmacy = Boolean(currentOffer);
  const productImageSrc = getProductImageSrc(product?.imageUrl);
  const bannerStatus = getLockedFeatureBannerStatus(pharmacyStatus);
  const bannerLabel = bannerStatus
    ? getLockedFeatureBannerLabel(bannerStatus)
    : null;

  const canAddToPharmacy = Boolean(
    product &&
    product.status === 'active' &&
    currentPharmacyId &&
    !currentOffer &&
    !bannerStatus
  );

  const canRemoveFromPharmacy = Boolean(
    product &&
    currentOffer &&
    currentPharmacyId &&
    !bannerStatus &&
    !currentOffer.hasRelatedOrders
  );

  const tabs = PRODUCT_DETAILS_TABS.map((tab) =>
    tab.value === 'reviews'
      ? { ...tab, label: `Reviews (${reviewsTotal})` }
      : tab
  );

  const summaryItems = product
    ? getProductSummaryItems(product, currentOffer)
    : [];

  const characteristics = product ? getProductCharacteristics(product) : [];
  const relatedOrderRows = product
    ? getRelatedOrderRows(product.id, relatedOrders)
    : [];
  const activeOrdersReservedQuantity =
    getActiveOrdersReservedQuantity(relatedOrderRows);
  const singleProductStatistics = getSingleProductStatisticsCounts(
    bannerStatus ? null : currentOffer,
    bannerStatus ? null : stockBalance,
    bannerStatus ? undefined : activeOrdersReservedQuantity
  );

  const stockMovementRows = getStockMovementRows(
    stockMovements,
    stockFilters,
    stockOrderNumberSearch,
    stockCommentSearch
  );

  const paginatedStockMovementRows = paginateRows(
    stockMovementRows,
    stockCurrentPage,
    stockRowsPerPage
  );

  const paginatedRelatedOrderRows = paginateRows(
    relatedOrderRows,
    relatedCurrentPage,
    relatedRowsPerPage
  );

  const relatedOrderStatistics = getRelatedOrderStatistics(relatedOrderRows);

  const handleRelatedStatisticsClick = (status: OrderStatus) => {
    setRelatedFilters((currentFilters) => ({
      ...currentFilters,
      orderStatus: currentFilters.orderStatus === status ? 'all' : status,
    }));
    setRelatedCurrentPage(1);
  };

  const stockMovementTotalPages = getTotalPages(
    stockMovementRows.length,
    stockRowsPerPage
  );

  const relatedOrdersTotalPages = getTotalPages(
    relatedOrderRows.length,
    relatedRowsPerPage
  );

  const stockActiveFiltersCount = [
    stockFilters.date.from || stockFilters.date.to,
    stockFilters.eventType !== 'all',
    stockFilters.source !== 'all',
    stockFilters.orderStatus !== 'all',
    stockOrderNumberSearch.trim(),
    stockCommentSearch.trim(),
  ].filter(Boolean).length;

  const relatedActiveFiltersCount = [
    relatedFilters.date.from || relatedFilters.date.to,
    relatedFilters.orderStatus !== 'all',
    relatedOrderNumberSearch.trim(),
    relatedClientSearch.trim(),
  ].filter(Boolean).length;

  const reviewItems = mapReviewsToListItems(reviews);

  const stockMovementColumns = useMemo<
    Array<DataTableColumn<StockMovementRow>>
  >(
    () => [
      {
        key: 'date',
        title: <TableHeaderTitle parts={['Last', 'changed']} />,
        render: (row: StockMovementRow) => row.date,
      },
      {
        key: 'eventType',
        title: <TableHeaderTitle parts={['Event', 'type']} />,
        render: (row: StockMovementRow) => (
          <strong
            className={
              row.eventTypeValue === 'reserve'
                ? css.valueReserve
                : row.eventTypeValue === 'release'
                  ? css.valueRelease
                  : row.quantityValue < 0
                    ? css.valueOut
                    : css.valueIn
            }
          >
            {row.eventType}
          </strong>
        ),
      },
      {
        key: 'quantity',
        title: 'Quantity',
        render: (row: StockMovementRow) => (
          <strong
            className={
              row.eventTypeValue === 'reserve'
                ? css.valueReserve
                : row.eventTypeValue === 'release'
                  ? css.valueRelease
                  : row.quantityValue < 0
                    ? css.valueOut
                    : css.valueIn
            }
          >
            {row.quantity}
          </strong>
        ),
      },
      {
        key: 'price',
        title: 'Price',
        render: (row: StockMovementRow) => row.price,
      },
      {
        key: 'totalAmount',
        title: <TableHeaderTitle parts={['Total', 'amount']} />,
        render: (row: StockMovementRow) => row.totalAmount,
      },
      {
        key: 'orderNumber',
        title: <TableHeaderTitle parts={['Order', 'number']} />,
        render: (row: StockMovementRow) =>
          row.orderId ? (
            <TextActionButton href={getPharmacyOrderPath(row.orderId)}>
              {row.orderNumber}
            </TextActionButton>
          ) : (
            '—'
          ),
      },
      {
        key: 'orderStatus',
        title: <TableHeaderTitle parts={['Order', 'status']} />,
        render: (row: StockMovementRow) =>
          row.orderStatus ? (
            <StatusBadge
              status={row.orderStatus}
              label={ORDER_STATUS_LABELS[row.orderStatus]}
            />
          ) : (
            '—'
          ),
      },
      {
        key: 'source',
        title: 'Source',
        render: (row: StockMovementRow) => row.source,
      },
      {
        key: 'comment',
        title: 'Comment',
        render: (row: StockMovementRow) => row.comment,
      },
    ],
    []
  );

  const relatedOrderColumns = useMemo<Array<DataTableColumn<RelatedOrderRow>>>(
    () => [
      {
        key: 'orderDate',
        title: <TableHeaderTitle parts={['Order', 'date']} />,
        render: (row: RelatedOrderRow) => row.orderDate,
      },
      {
        key: 'orderNumber',
        title: <TableHeaderTitle parts={['Order', 'number']} />,
        render: (row: RelatedOrderRow) => (
          <TextActionButton href={getPharmacyOrderPath(row.orderId)}>
            {row.orderNumber}
          </TextActionButton>
        ),
      },
      {
        key: 'clientPhoto',
        title: <TableHeaderTitle parts={['Client', 'photo']} />,
        render: (row: RelatedOrderRow) => (
          <TableImagePreview
            src={row.clientPhotoUrl ?? undefined}
            alt={`${row.client} photo`}
            fallback={formatInitials(row.client)}
          />
        ),
      },
      {
        key: 'client',
        title: <TableHeaderTitle parts={['Client', 'name']} />,
        render: (row: RelatedOrderRow) =>
          row.clientId ? (
            <TextActionButton href={getPharmacyClientPath(row.clientId)}>
              {row.client}
            </TextActionButton>
          ) : (
            row.client
          ),
      },
      {
        key: 'quantity',
        title: <TableHeaderTitle parts={['Order', 'quantity']} />,
        render: (row: RelatedOrderRow) => row.quantity,
      },
      {
        key: 'fixedUnitPrice',
        title: <TableHeaderTitle parts={['Fixed unit', 'price']} />,
        render: (row: RelatedOrderRow) => row.fixedUnitPrice,
      },
      {
        key: 'amount',
        title: <TableHeaderTitle parts={['Order', 'amount']} />,
        render: (row: RelatedOrderRow) => row.amount,
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Order', 'status']} />,
        render: (row: RelatedOrderRow) => (
          <StatusBadge
            status={row.status}
            label={ORDER_STATUS_LABELS[row.status]}
          />
        ),
      },
    ],
    []
  );

  const handleAddProductConfirm = async () => {
    if (!product || !canAddToPharmacy) return;

    setIsAddingProduct(true);

    try {
      const response = await addProductToMyPharmacy(product.id);
      const stockResponse = await getProductStockMovements(product.id);

      setProduct(response.product);
      setStockMovements(stockResponse.items);
      setStockBalance(stockResponse.stock);
      setIsAddModalOpen(false);
      toast.success(response.message || 'Product added to your pharmacy.');
    } catch (addError) {
      toast.error(getProductActionErrorMessage(addError));
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleRemoveProductConfirm = async () => {
    if (!product || !canRemoveFromPharmacy) return;

    setIsRemovingProduct(true);

    try {
      const response = await removeProductFromMyPharmacy(product.id);

      setProduct(response.product);
      setStockMovements([]);
      setStockBalance(null);
      setIsRemoveModalOpen(false);
      toast.success(
        response.message || 'Product was removed from your pharmacy.'
      );
    } catch (removeError) {
      toast.error(getProductActionErrorMessage(removeError));
    } finally {
      setIsRemovingProduct(false);
    }
  };

  if (isLoading) {
    return (
      <main className={css.page} aria-label="Loading global product">
        <div className={css.contentCard}>
          <div className={css.loaderBox}>
            <LoadingSpinner label="Loading product data..." />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={css.page} aria-labelledby="global-product-page-title">
      <section className={css.contentCard}>
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
            <OwnProductStatistics
              counts={singleProductStatistics}
              visibleKeys={['inStock', 'reserved', 'available']}
              className={css.singleProductStatistics}
            />
          ) : null}
        </div>
      </section>

      {product ? (
        <section className={css.contentCard} aria-label="Product data">
          <div className={css.tabsSection}>
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
                {bannerStatus ? (
                  <StatusBanner
                    status={bannerStatus}
                    label={bannerLabel ?? undefined}
                    title={bannerTitle}
                    message={bannerMessage}
                  />
                ) : null}

                <section
                  className={css.detailsGrid}
                  aria-labelledby="product-summary-title"
                >
                  <div className={css.visualCard}>
                    {productImageSrc ? (
                      <span className={css.imageFrame}>
                        <ShimmerImage
                          className={css.image}
                          src={productImageSrc}
                          alt={product.name}
                          sizes="(min-width: 1440px) 420px, 90vw"
                          unoptimized
                        />
                      </span>
                    ) : (
                      <div className={css.imagePlaceholder} aria-hidden="true">
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
                          disabled={!canAddToPharmacy}
                          isLoading={isAddingProduct}
                          loadingLabel="Adding product..."
                          onClick={() => setIsAddModalOpen(true)}
                        >
                          {product.status === 'blocked'
                            ? 'Unavailable'
                            : isAddedToPharmacy
                              ? 'Added to your pharmacy'
                              : bannerStatus || !currentPharmacyId
                                ? 'Add to my pharmacy after verification'
                                : 'Add to my pharmacy'}
                        </Button>
                      ) : null}

                      {showRemoveAction && isAddedToPharmacy ? (
                        <Button
                          className={`${css.actionButton} ${css.removeButton}`}
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={!canRemoveFromPharmacy}
                          isLoading={isRemovingProduct}
                          loadingLabel="Removing product..."
                          onClick={() => setIsRemoveModalOpen(true)}
                        >
                          Remove from my pharmacy
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
              <div>
                {activeTab === 'stock-movement' ? (
                  <>
                    {isAddedToPharmacy ? (
                      <div className={css.sectionStack}>
                        <section
                          className={css.sectionCard}
                          aria-labelledby="stock-movement-title"
                        >
                          <h3
                            className={css.panelTitle}
                            id="stock-movement-title"
                          >
                            Stock movement
                          </h3>

                          <div className={css.searchGrid}>
                            <SearchInput
                              id="stock-movement-order-number-search"
                              label="Order number search"
                              value={stockOrderNumberSearch}
                              placeholder="Order number"
                              isActive={Boolean(stockOrderNumberSearch)}
                              onChange={(value) => {
                                setStockOrderNumberSearch(value);
                                setStockCurrentPage(1);
                              }}
                            />

                            <SearchInput
                              id="stock-movement-comment-search"
                              label="Comment search"
                              value={stockCommentSearch}
                              placeholder="Comment"
                              isActive={Boolean(stockCommentSearch)}
                              onChange={(value) => {
                                setStockCommentSearch(value);
                                setStockCurrentPage(1);
                              }}
                            />

                            <div className={css.searchAction}>
                              <FiltersButton
                                activeCount={stockActiveFiltersCount}
                                controlsId="stock-movement-filters-panel"
                                isExpanded={isStockFiltersOpen}
                                className={css.filterButton}
                                onClick={() => setIsStockFiltersOpen(true)}
                              />
                            </div>
                          </div>
                        </section>

                        <section
                          className={css.sectionCard}
                          aria-label="Stock movement table"
                        >
                          <div className={css.tableStack}>
                            <div className={css.tableToolbar}>
                              <CountLabel
                                className={css.countLabel}
                                shown={paginatedStockMovementRows.length}
                                total={stockMovementRows.length}
                                label="records"
                              />

                              <div className={css.rowsControl}>
                                <RowsPerPageSelect
                                  id="stock-movement-rows-per-page"
                                  value={stockRowsPerPage}
                                  options={PRODUCT_TAB_ROWS_PER_PAGE_OPTIONS}
                                  onChange={(value) => {
                                    setStockRowsPerPage(value);
                                    setStockCurrentPage(1);
                                  }}
                                />
                              </div>
                            </div>

                            <DataTable
                              columns={stockMovementColumns}
                              items={paginatedStockMovementRows}
                              getItemKey={(row) => row.id}
                              minWidth={0}
                              newestFirst={false}
                              labels={{
                                empty: 'Stock movement history is empty.',
                              }}
                            />

                            <Pagination
                              currentPage={stockCurrentPage}
                              totalPages={stockMovementTotalPages}
                              getPageHref={(page) => String(page)}
                              renderLink={({
                                href,
                                className,
                                children,
                                'aria-label': ariaLabel,
                              }) => (
                                <button
                                  className={className}
                                  type="button"
                                  aria-label={ariaLabel}
                                  onClick={() =>
                                    setStockCurrentPage(Number(href))
                                  }
                                >
                                  {children}
                                </button>
                              )}
                            />
                          </div>
                        </section>
                      </div>
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
                    {isAddedToPharmacy ? (
                      <div className={css.sectionStack}>
                        <section
                          className={css.sectionCard}
                          aria-labelledby="related-orders-title"
                        >
                          <h3
                            className={css.panelTitle}
                            id="related-orders-title"
                          >
                            Related orders
                          </h3>

                          <OrderStatistics
                            counts={relatedOrderStatistics}
                            className={css.relatedStatistics}
                            onStatusClick={handleRelatedStatisticsClick}
                          />
                        </section>

                        <section
                          className={css.sectionCard}
                          aria-label="Related orders filters"
                        >
                          <div className={css.searchGrid}>
                            <SearchInput
                              id="related-orders-order-number-search"
                              label="Order number search"
                              value={relatedOrderNumberSearch}
                              placeholder="Order number"
                              isActive={Boolean(relatedOrderNumberSearch)}
                              onChange={(value) => {
                                setRelatedOrderNumberSearch(value);
                                setRelatedCurrentPage(1);
                              }}
                            />

                            <SearchInput
                              id="related-orders-client-search"
                              label="Client search"
                              value={relatedClientSearch}
                              placeholder="Client"
                              isActive={Boolean(relatedClientSearch)}
                              onChange={(value) => {
                                setRelatedClientSearch(value);
                                setRelatedCurrentPage(1);
                              }}
                            />

                            <div className={css.searchAction}>
                              <FiltersButton
                                activeCount={relatedActiveFiltersCount}
                                controlsId="related-orders-filters-panel"
                                isExpanded={isRelatedFiltersOpen}
                                className={css.filterButton}
                                onClick={() => setIsRelatedFiltersOpen(true)}
                              />
                            </div>
                          </div>
                        </section>

                        <section
                          className={css.sectionCard}
                          aria-label="Related orders table"
                        >
                          <div className={css.tableStack}>
                            <div className={css.tableToolbar}>
                              <CountLabel
                                className={css.countLabel}
                                shown={paginatedRelatedOrderRows.length}
                                total={relatedOrderRows.length}
                                label="orders"
                              />

                              <div className={css.rowsControl}>
                                <RowsPerPageSelect
                                  id="related-orders-rows-per-page"
                                  value={relatedRowsPerPage}
                                  options={PRODUCT_TAB_ROWS_PER_PAGE_OPTIONS}
                                  onChange={(value) => {
                                    setRelatedRowsPerPage(value);
                                    setRelatedCurrentPage(1);
                                  }}
                                />
                              </div>
                            </div>

                            <DataTable
                              columns={relatedOrderColumns}
                              items={paginatedRelatedOrderRows}
                              getItemKey={(row) => row.id}
                              minWidth={0}
                              labels={{
                                empty:
                                  'There are no orders with this product yet.',
                              }}
                            />

                            <Pagination
                              currentPage={relatedCurrentPage}
                              totalPages={relatedOrdersTotalPages}
                              getPageHref={(page) => String(page)}
                              renderLink={({
                                href,
                                className,
                                children,
                                'aria-label': ariaLabel,
                              }) => (
                                <button
                                  className={className}
                                  type="button"
                                  aria-label={ariaLabel}
                                  onClick={() =>
                                    setRelatedCurrentPage(Number(href))
                                  }
                                >
                                  {children}
                                </button>
                              )}
                            />
                          </div>
                        </section>
                      </div>
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
                        this page helps clients quickly understand the product,
                        its main properties, and where it can be bought online.
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
          </div>
        </section>
      ) : null}

      {isStockFiltersOpen ? (
        <ProductTabFiltersDrawer
          id="stock-movement-filters-panel"
          title="Stock movement filters"
          hasActiveFilters={stockActiveFiltersCount > 0}
          onReset={() => {
            setStockFilters(DEFAULT_STOCK_MOVEMENT_FILTERS);
            setStockOrderNumberSearch('');
            setStockCommentSearch('');
            setStockCurrentPage(1);
          }}
          onClose={() => setIsStockFiltersOpen(false)}
        >
          <DateFilter
            id="stock-movement-date-filter"
            label="Last changed date"
            value={stockFilters.date}
            isActive={Boolean(stockFilters.date.from || stockFilters.date.to)}
            applyOnSubmit
            applyLabel="Apply"
            onChange={(date) => {
              setStockFilters((currentFilters) => ({
                ...currentFilters,
                date,
              }));
              setStockCurrentPage(1);
            }}
          />

          <SelectField
            id="stock-event-type-filter"
            label="Event type"
            value={stockFilters.eventType}
            options={STOCK_EVENT_TYPE_OPTIONS}
            onChange={(eventType) => {
              setStockFilters((currentFilters) => ({
                ...currentFilters,
                eventType,
              }));
              setStockCurrentPage(1);
            }}
          />

          <SelectField
            id="stock-source-filter"
            label="Source"
            value={stockFilters.source}
            options={STOCK_SOURCE_OPTIONS}
            onChange={(source) => {
              setStockFilters((currentFilters) => ({
                ...currentFilters,
                source,
              }));
              setStockCurrentPage(1);
            }}
          />

          <SelectField
            id="stock-order-status-filter"
            label="Order status"
            value={stockFilters.orderStatus}
            options={ORDER_STATUS_OPTIONS}
            onChange={(orderStatus) => {
              setStockFilters((currentFilters) => ({
                ...currentFilters,
                orderStatus,
              }));
              setStockCurrentPage(1);
            }}
          />
        </ProductTabFiltersDrawer>
      ) : null}

      {isRelatedFiltersOpen ? (
        <ProductTabFiltersDrawer
          id="related-orders-filters-panel"
          title="Related orders filters"
          hasActiveFilters={relatedActiveFiltersCount > 0}
          onReset={() => {
            setRelatedFilters(DEFAULT_RELATED_ORDERS_FILTERS);
            setRelatedOrderNumberSearch('');
            setRelatedClientSearch('');
            setRelatedCurrentPage(1);
          }}
          onClose={() => setIsRelatedFiltersOpen(false)}
        >
          <DateFilter
            id="related-orders-date-filter"
            label="Order date"
            value={relatedFilters.date}
            isActive={Boolean(
              relatedFilters.date.from || relatedFilters.date.to
            )}
            applyOnSubmit
            applyLabel="Apply"
            onChange={(date) => {
              setRelatedFilters((currentFilters) => ({
                ...currentFilters,
                date,
              }));
              setRelatedCurrentPage(1);
            }}
          />

          <SelectField
            id="related-order-status-filter"
            label="Order status"
            value={relatedFilters.orderStatus}
            options={ORDER_STATUS_OPTIONS}
            onChange={(orderStatus) => {
              setRelatedFilters((currentFilters) => ({
                ...currentFilters,
                orderStatus,
              }));
              setRelatedCurrentPage(1);
            }}
          />
        </ProductTabFiltersDrawer>
      ) : null}

      <ConfirmationModal
        isOpen={isAddModalOpen}
        title="Add product to pharmacy?"
        description="Are you sure you want to add this product to your pharmacy?"
        confirmLabel="Add to pharmacy"
        isLoading={isAddingProduct}
        onConfirm={() => void handleAddProductConfirm()}
        onCancel={() => {
          if (!isAddingProduct) setIsAddModalOpen(false);
        }}
      />

      <ConfirmationModal
        isOpen={isRemoveModalOpen}
        title="Remove product from pharmacy?"
        description="This product will be removed from your own products only if no orders were created for it."
        confirmLabel="Remove product"
        isLoading={isRemovingProduct}
        onConfirm={() => void handleRemoveProductConfirm()}
        onCancel={() => {
          if (!isRemovingProduct) setIsRemoveModalOpen(false);
        }}
      />
    </main>
  );
}

export default AllProductDetailsPageContent;
export { AllProductDetailsPageContent };
