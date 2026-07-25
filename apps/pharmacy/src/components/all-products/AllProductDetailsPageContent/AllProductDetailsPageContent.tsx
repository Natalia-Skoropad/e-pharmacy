'use client';

import Link from 'next/link';
import { BarChart3, History, PackageSearch } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import type { OrderCreatedByType } from '@e-pharmacy/types/orders';
import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/products';

import {
  ORDER_STATUS_LABELS,
  ORDER_CREATED_BY_LABELS,
} from '@e-pharmacy/config/orders';

import {
  Button,
  FiltersButton,
  LoadingSpinner,
  TextActionButton,
} from '@e-pharmacy/ui/primitives';

import { LinkButton } from '@e-pharmacy/ui/navigation';

import {
  CountLabel,
  DataTable,
  formatInitials,
  RatingSummary,
  ReviewsList,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
  type ReviewsListItem,
} from '@e-pharmacy/ui/data-display';

import {
  DateFilter,
  RowsPerPageSelect,
  SearchInput,
  SelectField,
  type DateFilterValue,
  type RowsPerPageValue,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import { ShimmerImage, TableImagePreview } from '@e-pharmacy/ui/media';
import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { FilterDrawer } from '@e-pharmacy/ui/overlays';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { useToast } from '@e-pharmacy/ui/feedback';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { isApiError } from '@e-pharmacy/api-client/core';
import { OwnProductStatisticsCounts } from '@e-pharmacy/types/products';
import type { OrderStatus } from '@e-pharmacy/types/orders';

import type {
  ProductDetails,
  ProductOffer,
  ProductStockBalance,
  ProductStockMovement,
  StockMovementEventType,
  StockMovementSource,
} from '@e-pharmacy/types/products';

import type { Review } from '@e-pharmacy/types/reviews';
import type { EntityId } from '@e-pharmacy/types/primitives';
import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { formatAmount, formatMoney } from '@e-pharmacy/utils/money';
import { formatShortDate } from '@e-pharmacy/utils/date';

import {
  OrderSalesStatistics,
  OrderStatisticsCounts,
} from '@e-pharmacy/types/orders';

import {
  getPharmacyAllProductsPath,
  getPharmacyClientPath,
  getPharmacyOrderPath,
} from '@e-pharmacy/config/pharmacy';

import {
  addProductToMyPharmacy,
  removeProductFromMyPharmacy,
  getPharmacyOrders,
  getPharmacyOrderSalesStatistics,
  getProductDetails,
  getProductReviews,
  getProductStockMovements,
  getPharmacyNotes,
  createPharmacyNote,
  deletePharmacyNote,
} from '@/lib/api/browser';

import { dispatchPharmacyBreadcrumbLabel } from '@/lib/layout/breadcrumbs';
import { DEFAULT_ORDER_SALES_STATISTICS } from '@/lib/statistics/defaults';
import { DEFAULT_ORDER_STATISTICS } from '@/lib/statistics/defaults';

import {
  ORDER_CREATED_BY_TYPES,
  type PharmacyOrderRow,
} from '@/lib/orders/orders';

import {
  getLockedFeatureBannerLabel,
  getLockedFeatureBannerStatus,
} from '@/lib/pharmacies/current-pharmacy-status';

import { getProductImageSrc } from '@/lib/products/product-images';

import { OrderStatistics, OwnProductStatistics } from '@/components/statistics';

import {
  SalesPeriodFilters,
  SalesValueChart,
  getSalesPeriodDateRange,
  type SalesPeriodMonth,
} from '@/components/sales';

import { EntityComments } from '@/components/comments/EntityComments';
import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';

import {
  StatusBadge,
  StatusBanner,
} from '@/components/common/StatusPresentation';

import css from './AllProductDetailsPageContent.module.css';

//===================================================================

type ProductDetailsTab =
  | 'details'
  | 'stock-movement'
  | 'related-orders'
  | 'characteristics'
  | 'reviews'
  | 'comments';

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

//===================================================================

type StockMovementFilters = Readonly<{
  date: DateFilterValue;
  eventType: 'all' | StockMovementEventType;
  source: 'all' | StockMovementSource;
  orderStatus: 'all' | OrderStatus;
}>;

type RelatedOrdersFilters = Readonly<{
  date: DateFilterValue;
  orderStatus: 'all' | OrderStatus;
  createdByType: 'all' | OrderCreatedByType;
}>;

//===================================================================

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
  createdByType: OrderCreatedByType;
}>;

//===================================================================

const PRODUCT_DETAILS_TABS: Array<TabItem<ProductDetailsTab>> = [
  { value: 'details', label: 'Details' },
  { value: 'stock-movement', label: 'Stock movement' },
  { value: 'related-orders', label: 'Related orders' },
  { value: 'characteristics', label: 'Characteristics' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'comments', label: 'Comments' },
];

//===================================================================

const DEFAULT_PRODUCT_TAB_DATE_FILTER: DateFilterValue = {
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
  createdByType: 'all',
};

//===================================================================

const ORDER_STATUS_OPTIONS: Array<SelectOption<'all' | OrderStatus>> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: ORDER_STATUS_LABELS.new },
  { value: 'in_progress', label: ORDER_STATUS_LABELS.in_progress },
  { value: 'successful', label: ORDER_STATUS_LABELS.successful },
  { value: 'rejected', label: ORDER_STATUS_LABELS.rejected },
];

//===================================================================

const ORDER_CREATED_BY_OPTIONS: Array<
  SelectOption<'all' | OrderCreatedByType>
> = [
  { value: 'all', label: 'All' },
  ...ORDER_CREATED_BY_TYPES.map((createdByType) => ({
    value: createdByType,
    label: ORDER_CREATED_BY_LABELS[createdByType],
  })),
];

//===================================================================

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

//===================================================================

const STOCK_SOURCE_OPTIONS: Array<SelectOption<'all' | StockMovementSource>> = [
  { value: 'all', label: 'All' },
  { value: 'pharmacy_stock', label: 'Pharmacy stock' },
  { value: 'client_order', label: 'Client order' },
];

//===================================================================

const PRODUCT_TAB_ROWS_PER_PAGE_OPTIONS: RowsPerPageValue[] = [20, 50, 100];
const CURRENT_YEAR = new Date().getFullYear();

//===================================================================

const STOCK_EVENT_LABELS: Record<StockMovementEventType, string> = {
  arrival: 'Stock arrival',
  reserve: 'Reserved in order',
  release: 'Reserve released',
  write_off: 'Stock write-off',
  adjustment: 'Stock adjustment',
};

//===================================================================

const STOCK_SOURCE_LABELS: Record<StockMovementSource, string> = {
  pharmacy_stock: 'Pharmacy stock',
  client_order: 'Client order',
};

//===================================================================

const DEFAULT_BANNER_TITLE = 'Adding this product is locked';

const DEFAULT_BANNER_MESSAGE =
  'You can review active Admin product details now. Add-to-my-pharmacy actions unlock after Admin verifies your pharmacy profile.';

//===================================================================

function getProductDetailsError(error: unknown): ProductDetailsError {
  if (isApiError(error) && [400, 404, 422].includes(error.status)) {
    return {
      title: 'ProductDetails not found',
      message: 'This product does not exist.',
    };
  }

  return {
    title: 'ProductDetails could not be loaded',
    message: 'Could not load product data. Please try again.',
  };
}

//===================================================================

function getProductActionErrorMessage(error: unknown): string {
  if (isApiError(error) && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;

  return 'ProductDetails action could not be completed. Please try again.';
}

//===================================================================

function getProductOffer(
  product: ProductDetails,
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

function getProductStatusLabel(product: ProductDetails): string {
  if (product.status === 'blocked') return 'Blocked';
  if (product.status === 'new') return 'New';

  return 'Active';
}

//===================================================================

function getProductPriceLabel(
  product: ProductDetails,
  offer: ProductOffer | null
) {
  if (offer) return formatMoney(offer.price) ?? '—';

  return product.price > 0 ? (formatMoney(product.price) ?? '—') : '—';
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

function getProductSummaryItems(
  product: ProductDetails,
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
      value: formatShortDate(product.createdAt) ?? '—',
    });
  }

  if (product.updatedAt) {
    items.push({
      label: 'Admin last update date',
      value: formatShortDate(product.updatedAt) ?? '—',
    });
  }

  if (offer?.createdAt) {
    items.push({
      label: 'Date added to pharmacy',
      value: formatShortDate(offer.createdAt) ?? '—',
    });
  }

  return items;
}

//===================================================================

function getProductCharacteristics(
  product: ProductDetails
): CharacteristicItem[] {
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
        date: formatShortDate(movement.occurredAt) ?? '—',
        dateValue: movement.occurredAt,
        eventType: STOCK_EVENT_LABELS[movement.eventType],
        eventTypeValue: movement.eventType,
        quantity: `${quantityValue > 0 ? '+' : ''}${quantityValue}`,
        quantityValue,
        price: formatAmount(movement.unitPrice) ?? '—',
        totalAmount: formatAmount(movement.movementValue) ?? '—',
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
        orderDate: formatShortDate(order.orderDate) ?? '—',
        orderDateValue: order.orderDate,
        client: order.client,
        clientId: order.clientId,
        clientPhotoUrl: order.clientPhotoUrl,
        quantity: String(item.quantity),
        quantityValue: item.quantity,
        fixedUnitPrice: formatAmount(item.unitPrice) ?? '—',
        unitPriceValue: item.unitPrice,
        amount: formatAmount(item.totalPrice) ?? '—',
        amountValue: item.totalPrice,
        status: order.status,
        createdByType: order.createdByType,
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

function mapReviewsToListItems(reviews: Review[]): ReviewsListItem[] {
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
  const { profile: pharmacyProfile } = usePharmacyProfile();
  const currentPharmacyId = pharmacyProfile?.id ?? null;
  const pharmacyStatus = pharmacyProfile?.status ?? null;

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [relatedOrders, setRelatedOrders] = useState<PharmacyOrderRow[]>([]);

  const [relatedOrderStatistics, setRelatedOrderStatistics] =
    useState<OrderStatisticsCounts>(DEFAULT_ORDER_STATISTICS);

  const [productSalesYear, setProductSalesYear] = useState(
    String(CURRENT_YEAR)
  );

  const [productSalesMonth, setProductSalesMonth] =
    useState<SalesPeriodMonth>('all');

  const [productSalesData, setProductSalesData] =
    useState<OrderSalesStatistics>(DEFAULT_ORDER_SALES_STATISTICS);

  const [isProductSalesLoading, setIsProductSalesLoading] = useState(false);

  const [stockMovements, setStockMovements] = useState<ProductStockMovement[]>(
    []
  );

  const [stockEarliestCreatedAt, setStockEarliestCreatedAt] = useState<
    string | null
  >(null);

  const [relatedOrdersEarliestCreatedAt, setRelatedOrdersEarliestCreatedAt] =
    useState<string | null>(null);

  const [stockBalance, setStockBalance] = useState<ProductStockBalance | null>(
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
    const controller = new AbortController();
    const requestOptions = { signal: controller.signal };

    async function loadProductData() {
      setIsLoading(true);
      setError(null);

      try {
        const [
          productResponse,
          reviewsResponse,
          ordersResponse,
          stockMovementsResponse,
        ] = await Promise.all([
          getProductDetails(productId, requestOptions),
          getProductReviews(productId, requestOptions).catch(() => null),
          getPharmacyOrders(
            { page: 1, perPage: 200, productId },
            requestOptions
          ).catch(() => null),
          getProductStockMovements(productId, requestOptions).catch(
            () => null
          ),
        ]);

        if (controller.signal.aborted) return;

        setProduct(productResponse.product);
        setReviews([...(reviewsResponse?.items ?? [])]);
        setReviewsTotal(
          reviewsResponse?.total ?? productResponse.product.reviewsCount ?? 0
        );

        setRelatedOrders([...(ordersResponse?.items ?? [])]);
        setRelatedOrderStatistics(
          ordersResponse?.statistics ?? DEFAULT_ORDER_STATISTICS
        );

        setRelatedOrdersEarliestCreatedAt(
          ordersResponse?.earliestCreatedAt ?? null
        );

        setStockMovements([...(stockMovementsResponse?.items ?? [])]);
        setStockEarliestCreatedAt(
          stockMovementsResponse?.earliestCreatedAt ?? null
        );

        setStockBalance(stockMovementsResponse?.stock ?? null);
      } catch (loadError) {
        if (controller.signal.aborted) return;

        setProduct(null);
        setReviews([]);
        setReviewsTotal(0);
        setCommentsTotal(0);
        setRelatedOrders([]);
        setRelatedOrderStatistics(DEFAULT_ORDER_STATISTICS);
        setRelatedOrdersEarliestCreatedAt(null);
        setStockMovements([]);
        setStockEarliestCreatedAt(null);
        setStockBalance(null);
        setError(getProductDetailsError(loadError));
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadProductData();

    return () => {
      controller.abort();
    };
  }, [productId]);

  useEffect(() => {
    if (!product?.name) return;

    dispatchPharmacyBreadcrumbLabel(product.name);
  }, [product?.name]);

  useEffect(() => {
    if (!product || !currentPharmacyId) return;

    const controller = new AbortController();
    const currentProductId = product.id;

    async function loadRelatedOrders() {
      const response = await getPharmacyOrders(
        {
          page: 1,
          perPage: 200,
          productId: currentProductId,
          orderNumber: relatedOrderNumberSearch.trim() || undefined,
          client: relatedClientSearch.trim() || undefined,
          status:
            relatedFilters.orderStatus === 'all'
              ? undefined
              : relatedFilters.orderStatus,
          createdByType:
            relatedFilters.createdByType === 'all'
              ? undefined
              : relatedFilters.createdByType,
          dateFrom: relatedFilters.date.from || undefined,
          dateTo: relatedFilters.date.to || undefined,
        },
        { signal: controller.signal }
      );

      if (controller.signal.aborted) return;

      setRelatedOrders([...response.items]);
      setRelatedOrderStatistics(response.statistics);
      setRelatedOrdersEarliestCreatedAt(response.earliestCreatedAt);
    }

    void loadRelatedOrders().catch(() => {
      if (!controller.signal.aborted) {
        setRelatedOrders([]);
        setRelatedOrderStatistics(DEFAULT_ORDER_STATISTICS);
        setRelatedOrdersEarliestCreatedAt(null);
      }
    });

    return () => {
      controller.abort();
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

  useEffect(() => {
    if (!isAddedToPharmacy) return;

    const controller = new AbortController();

    async function loadProductSales() {
      setIsProductSalesLoading(true);

      try {
        const period = getSalesPeriodDateRange(
          productSalesYear,
          productSalesMonth
        );
        const response = await getPharmacyOrderSalesStatistics(
          {
            ...period,
            productId,
          },
          { signal: controller.signal }
        );

        if (!controller.signal.aborted) setProductSalesData(response);
      } catch {
        if (!controller.signal.aborted) {
          setProductSalesData(DEFAULT_ORDER_SALES_STATISTICS);
        }
      } finally {
        if (!controller.signal.aborted) setIsProductSalesLoading(false);
      }
    }

    void loadProductSales();

    return () => {
      controller.abort();
    };
  }, [isAddedToPharmacy, productId, productSalesMonth, productSalesYear]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCommentsTotal() {
      if (!product || !currentPharmacyId) return;

      const offer = getProductOffer(product, currentPharmacyId);

      if (!offer) {
        setCommentsTotal(0);
        return;
      }

      try {
        const response = await getPharmacyNotes(
          'product',
          productId,
          1,
          { signal: controller.signal }
        );
        if (!controller.signal.aborted) setCommentsTotal(response.total);
      } catch {
        if (!controller.signal.aborted) setCommentsTotal(0);
      }
    }

    void loadCommentsTotal();

    return () => {
      controller.abort();
    };
  }, [currentPharmacyId, product, productId]);

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

  const tabs = PRODUCT_DETAILS_TABS.map((tab) => {
    if (tab.value === 'reviews') {
      return { ...tab, label: `Reviews (${reviewsTotal})` };
    }

    if (tab.value === 'comments') {
      return {
        ...tab,
        label: `Comments (${isAddedToPharmacy ? commentsTotal : 0})`,
      };
    }

    return tab;
  });

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

  const stockActiveFiltersCount = countTrueConditions(
    Boolean(stockFilters.date.from || stockFilters.date.to),
    stockFilters.eventType !== 'all',
    stockFilters.source !== 'all',
    stockFilters.orderStatus !== 'all',
    Boolean(stockOrderNumberSearch.trim()),
    Boolean(stockCommentSearch.trim())
  );

  const relatedActiveFiltersCount = countTrueConditions(
    Boolean(relatedFilters.date.from || relatedFilters.date.to),
    relatedFilters.orderStatus !== 'all',
    relatedFilters.createdByType !== 'all',
    Boolean(relatedOrderNumberSearch.trim()),
    Boolean(relatedClientSearch.trim())
  );

  const reviewItems = mapReviewsToListItems(reviews);

  const stockMovementColumns = useMemo<
    Array<DataTableColumn<StockMovementRow>>
  >(
    () => [
      {
        key: 'date',
        title: <TableHeaderTitle parts={['Last', 'changed']} />,
        render: (row: StockMovementRow) => (
          <TableDateTime value={row.dateValue} />
        ),
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
        title: <TableHeaderTitle parts={['Price,', 'UAH']} />,
        render: (row: StockMovementRow) => row.price,
      },
      {
        key: 'totalAmount',
        title: <TableHeaderTitle parts={['Total', ' amount, ', 'UAH']} />,
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
        render: (row: RelatedOrderRow) => (
          <TableDateTime value={row.orderDateValue} />
        ),
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
            src={
              getProductImageSrc(row.clientPhotoUrl ?? undefined) ?? undefined
            }
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
        title: <TableHeaderTitle parts={['Fixed unit price,', 'UAH']} />,
        render: (row: RelatedOrderRow) => row.fixedUnitPrice,
      },
      {
        key: 'amount',
        title: <TableHeaderTitle parts={['Order amount,', 'UAH']} />,
        render: (row: RelatedOrderRow) => row.amount,
      },
      {
        key: 'createdByType',
        title: <TableHeaderTitle parts={['Created', 'by']} />,
        render: (row: RelatedOrderRow) =>
          ORDER_CREATED_BY_LABELS[row.createdByType],
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
      setStockMovements([...stockResponse.items]);
      setStockEarliestCreatedAt(stockResponse.earliestCreatedAt);
      setStockBalance(stockResponse.stock);
      setIsAddModalOpen(false);
      toast.success(
        response.message || 'ProductDetails added to your pharmacy.'
      );
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
      setStockEarliestCreatedAt(null);
      setStockBalance(null);
      setIsRemoveModalOpen(false);
      toast.success(
        response.message || 'ProductDetails was removed from your pharmacy.'
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
        <section className={css.contentCard} aria-label="ProductDetails data">
          <div className={css.tabsSection}>
            <Tabs
              items={tabs}
              activeValue={activeTab}
              ariaLabel="ProductDetails details tabs"
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

                    <div className={css.detailsColumns}>
                      {[summaryItems.slice(0, 3), summaryItems.slice(3)]
                        .filter((items) => items.length > 0)
                        .map((items, columnIndex) => (
                          <dl
                            className={css.detailsList}
                            key={`summary-column-${columnIndex}`}
                          >
                            {items.map((item) => (
                              <div key={item.label}>
                                <dt>{item.label}</dt>
                                <dd>{item.value}</dd>
                              </div>
                            ))}
                          </dl>
                        ))}
                    </div>

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

                      <LinkButton
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
                      </LinkButton>
                    </div>
                  </div>
                </section>

                {isAddedToPharmacy ? (
                  <section
                    className={css.productSalesSection}
                    aria-label="ProductDetails sales value"
                  >
                    <div className={css.productSalesToolbar}>
                      <div className={css.productSalesHeading}>
                        <BarChart3 size={22} aria-hidden="true" />
                        <div className={css.productSalesHeadingContent}>
                          <h3>ProductDetails sales analytics</h3>
                          <p>
                            Successful sales of this product for the selected
                            year or month.
                          </p>

                          <SalesPeriodFilters
                            idPrefix={`product-${productId}-sales`}
                            year={productSalesYear}
                            month={productSalesMonth}
                            onYearChange={setProductSalesYear}
                            onMonthChange={setProductSalesMonth}
                            className={css.productSalesFilters}
                            showAppliedPeriod
                          />
                        </div>
                      </div>
                    </div>

                    {isProductSalesLoading ? (
                      <LoadingSpinner label="Loading product sales chart..." />
                    ) : (
                      <SalesValueChart
                        key={`${productSalesYear}-${productSalesMonth}`}
                        data={productSalesData}
                        kicker="ProductDetails sales"
                        title="Sales value by product"
                        description="The line shows successful sales of this product for the selected period."
                        categoryControlsLabel="ProductDetails category shown on the chart"
                      />
                    )}
                  </section>
                ) : null}
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
                            className={`${css.panelTitle} ${css.panelTitleWithHelp}`}
                            id="stock-movement-title"
                          >
                            Stock movement
                            <InfoTooltip
                              label="How does the stock movement table work?"
                              title="How stock movement works"
                              icon={<History size={20} strokeWidth={2} />}
                            >
                              Stock arrivals increase physical and available
                              quantity.
                              <br />
                              <br />
                              New and In progress orders reserve available
                              units.
                              <br />
                              <br />
                              Rejected orders release their reserve, while
                              Successful orders write reserved units off the
                              physical stock.
                            </InfoTooltip>
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

                              <CountLabel
                                className={css.countLabel}
                                shown={paginatedStockMovementRows.length}
                                total={stockMovementRows.length}
                                label="records"
                              />
                            </div>

                            <DataTable
                              columns={stockMovementColumns}
                              items={paginatedStockMovementRows}
                              getItemKey={(row) => row.id}
                              minWidth={0}
                              labels={{
                                empty: 'Stock movement history is empty.',
                              }}
                            />

                            <PaginationView
                              currentPage={stockCurrentPage}
                              totalPages={stockMovementTotalPages}
                              onPageChange={setStockCurrentPage}
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

                              <CountLabel
                                className={css.countLabel}
                                shown={paginatedRelatedOrderRows.length}
                                total={relatedOrderRows.length}
                                label="orders"
                              />
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

                            <PaginationView
                              currentPage={relatedCurrentPage}
                              totalPages={relatedOrdersTotalPages}
                              onPageChange={setRelatedCurrentPage}
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
                    emptyText="ProductDetails reviews will appear here after clients share their feedback."
                  />
                ) : null}

                {activeTab === 'comments' ? (
                  isAddedToPharmacy ? (
                    <EntityComments
                      entityKey={`product:${product.id}`}
                      initialTotal={commentsTotal}
                      load={(page, options) =>
                        getPharmacyNotes('product', productId, page, options)
                      }
                      create={(text) =>
                        createPharmacyNote('product', productId, text)
                      }
                      remove={(id) =>
                        deletePharmacyNote('product', productId, id)
                      }
                      onTotalChange={setCommentsTotal}
                    />
                  ) : (
                    <EmptyPanel>
                      This product is not added to your pharmacy, so Comments
                      are unavailable.
                    </EmptyPanel>
                  )
                ) : null}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {isStockFiltersOpen ? (
        <FilterDrawer
          id="stock-movement-filters-panel"
          eyebrow="ProductDetails details"
          title="Stock movement filters"
          hasActiveFilters={stockActiveFiltersCount > 0}
          resetHref="#"
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
            minDate={stockEarliestCreatedAt ?? undefined}
            disabled={!stockEarliestCreatedAt}
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
        </FilterDrawer>
      ) : null}

      {isRelatedFiltersOpen ? (
        <FilterDrawer
          id="related-orders-filters-panel"
          eyebrow="ProductDetails details"
          title="Related orders filters"
          hasActiveFilters={relatedActiveFiltersCount > 0}
          resetHref="#"
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
            minDate={relatedOrdersEarliestCreatedAt ?? undefined}
            disabled={!relatedOrdersEarliestCreatedAt}
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

          <SelectField
            id="related-order-created-by-filter"
            label="Created by"
            value={relatedFilters.createdByType}
            options={ORDER_CREATED_BY_OPTIONS}
            onChange={(createdByType) => {
              setRelatedFilters((currentFilters) => ({
                ...currentFilters,
                createdByType,
              }));
              setRelatedCurrentPage(1);
            }}
          />
        </FilterDrawer>
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
