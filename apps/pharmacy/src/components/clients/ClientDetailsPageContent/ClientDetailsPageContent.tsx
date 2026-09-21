'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  UserRound,
  Users,
} from 'lucide-react';

import { PRODUCT_CATEGORIES } from '@e-pharmacy/config/products';
import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
import type { OrderCreatedByType } from '@e-pharmacy/types/orders';
import { isApiError } from '@e-pharmacy/api-client/transport';

import {
  ORDER_CREATED_BY_TYPES,
  ORDER_STATUSES,
} from '@e-pharmacy/config/orders';

import {
  PRODUCT_STATUS_PRESENTATION,
  USER_STATUS_PRESENTATION,
} from '@e-pharmacy/config/presentation';

import {
  ORDER_CREATED_BY_LABELS,
  ORDER_STATUS_PRESENTATION,
  PAYMENT_METHOD_LABELS,
  DELIVERY_METHOD_LABELS,
} from '@e-pharmacy/config/presentation';

import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/presentation';

import {
  FiltersButton,
  LoadingSpinner,
  TextActionButton,
} from '@e-pharmacy/ui/primitives';

import {
  CountLabel,
  DataTable,
  formatInitials,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
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
import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatusBadge, StatusBanner } from '@e-pharmacy/ui/statistics';
import type { OrderStatisticsCounts } from '@e-pharmacy/types/orders';

import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types/orders';

import type {
  ProductCategory,
  ProductStatus,
} from '@e-pharmacy/types/products';

import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { formatAmount } from '@e-pharmacy/utils/money';
import { formatShortDate } from '@e-pharmacy/utils/date';

import {
  getPharmacyClientPath,
  getPharmacyOrderPath,
  getPharmacyProductPath,
} from '@/lib/routes';

import {
  createPharmacyNote,
  deletePharmacyNote,
  getPharmacyNotes,
  getPharmacyOrders,
} from '@/lib/api/browser';

import {
  getPharmacyClientDetails,
  getPharmacyClientProducts,
} from '@/lib/api/browser/clients.api';

import type {
  PharmacyClientPurchasedProduct,
  PharmacyClientRow,
} from '@/lib/clients/clients';

import { getProductImageSrc } from '@/lib/products/product-images';
import { type PharmacyOrderRow } from '@/lib/orders/orders';
import { dispatchPharmacyBreadcrumbLabel } from '@/lib/layout/breadcrumbs';
import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';

import { EntityComments } from '@/components/comments/EntityComments';
import { OrderStatistics } from '@/components/statistics';
import { useLastKnownStatistics } from '@/components/clients/useLastKnownStatistics';

import css from './ClientDetailsPageContent.module.css';

//===================================================================

type ClientDetailsPageContentProps = Readonly<{ clientId: string }>;

//===================================================================

type ClientTab = 'details' | 'orders' | 'products' | 'comments';

type ResourceStatus = 'idle' | 'loading' | 'success' | 'error';

//===================================================================

type ClientDetailsError = Readonly<{
  title: string;
  message: string;
}>;

//===================================================================

type ClientProductFilters = Readonly<{
  date: DateFilterValue;
  category: 'all' | ProductCategory;
  status: 'all' | ProductStatus;
}>;

type ClientOrderFilters = Readonly<{
  date: DateFilterValue;
  status: 'all' | OrderStatus;
  deliveryMethod: 'all' | DeliveryMethod;
  paymentMethod: 'all' | PaymentMethod;
  clientCommentPresence: 'all' | 'with' | 'without';
  createdByType: 'all' | OrderCreatedByType;
}>;

//===================================================================

const CLIENT_TABS: Array<TabItem<ClientTab>> = [
  { value: 'details', label: 'Details' },
  { value: 'orders', label: 'Client orders' },
  { value: 'products', label: 'Purchased products' },
  { value: 'comments', label: 'Comments' },
];

//===================================================================

const PRODUCT_ROWS_PER_PAGE_OPTIONS: RowsPerPageValue[] = [20, 50, 100];

//===================================================================

const DEFAULT_PRODUCT_FILTERS: ClientProductFilters = {
  date: { from: '', to: '' },
  category: 'all',
  status: 'all',
};

const DEFAULT_ORDER_FILTERS: ClientOrderFilters = {
  date: { from: '', to: '' },
  status: 'all',
  deliveryMethod: 'all',
  paymentMethod: 'all',
  clientCommentPresence: 'all',
  createdByType: 'all',
};

const ORDER_STATUS_OPTIONS: Array<SelectOption<ClientOrderFilters['status']>> =
  [
    { value: 'all', label: 'All' },
    ...ORDER_STATUSES.map((status) => ({
      value: status,
      label: ORDER_STATUS_PRESENTATION[status].label,
    })),
  ];

const DELIVERY_METHOD_OPTIONS: Array<
  SelectOption<ClientOrderFilters['deliveryMethod']>
> = [
  { value: 'all', label: 'All' },
  { value: 'pickup', label: DELIVERY_METHOD_LABELS.pickup },
  { value: 'postal_delivery', label: DELIVERY_METHOD_LABELS.postal_delivery },
];

const PAYMENT_METHOD_OPTIONS: Array<
  SelectOption<ClientOrderFilters['paymentMethod']>
> = [
  { value: 'all', label: 'All' },
  { value: 'cash', label: PAYMENT_METHOD_LABELS.cash },
  { value: 'bank_transfer', label: PAYMENT_METHOD_LABELS.bank_transfer },
];

const CLIENT_COMMENT_OPTIONS: Array<
  SelectOption<ClientOrderFilters['clientCommentPresence']>
> = [
  { value: 'all', label: 'All' },
  { value: 'with', label: 'With client comment' },
  { value: 'without', label: 'Without client comment' },
];

const ORDER_CREATED_BY_OPTIONS: Array<
  SelectOption<ClientOrderFilters['createdByType']>
> = [
  { value: 'all', label: 'All' },
  ...ORDER_CREATED_BY_TYPES.map((createdByType) => ({
    value: createdByType,
    label: ORDER_CREATED_BY_LABELS[createdByType],
  })),
];

const PRODUCT_CATEGORY_OPTIONS: Array<
  SelectOption<ClientProductFilters['category']>
> = [
  { value: 'all', label: 'All' },
  ...PRODUCT_CATEGORIES.map((category) => ({
    value: category,
    label: PRODUCT_CATEGORY_LABELS[category],
  })),
];

const PRODUCT_STATUS_OPTIONS: Array<
  SelectOption<ClientProductFilters['status']>
> = [
  { value: 'all', label: 'All' },
  ...(Object.keys(PRODUCT_STATUS_PRESENTATION) as ProductStatus[]).map(
    (status) => ({
      value: status,
      label: PRODUCT_STATUS_PRESENTATION[status].label,
    })
  ),
];

//===================================================================

function formatClientDate(value: string): string {
  return formatShortDate(value) ?? 'Not specified';
}

//===================================================================

function formatAmountValue(value: number): string {
  return formatAmount(value) ?? '—';
}

//===================================================================

type ClientOrdersFiltersDrawerProps = Readonly<{
  filters: ClientOrderFilters;
  hasActiveFilters: boolean;
  minDate?: string;
  resetHref: string;
  onChange: (filters: ClientOrderFilters) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

function ClientOrdersFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  resetHref,
  onChange,
  onClose,
  onReset,
}: ClientOrdersFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="client-orders-filters-panel"
      eyebrow="Client orders"
      hasActiveFilters={hasActiveFilters}
      resetHref={resetHref}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="client-orders-date"
        minDate={minDate}
        disabled={!minDate}
        label="Order date"
        value={filters.date}
        isActive={Boolean(filters.date.from || filters.date.to)}
        applyOnSubmit
        applyLabel="Apply"
        onChange={(date) => onChange({ ...filters, date })}
      />

      <SelectField
        id="client-orders-status"
        label="Order status"
        value={filters.status}
        options={ORDER_STATUS_OPTIONS}
        isActive={filters.status !== 'all'}
        onChange={(status) => onChange({ ...filters, status })}
      />

      <SelectField
        id="client-orders-delivery"
        label="Delivery method"
        value={filters.deliveryMethod}
        options={DELIVERY_METHOD_OPTIONS}
        isActive={filters.deliveryMethod !== 'all'}
        onChange={(deliveryMethod) => onChange({ ...filters, deliveryMethod })}
      />

      <SelectField
        id="client-orders-payment"
        label="Payment method"
        value={filters.paymentMethod}
        options={PAYMENT_METHOD_OPTIONS}
        isActive={filters.paymentMethod !== 'all'}
        onChange={(paymentMethod) => onChange({ ...filters, paymentMethod })}
      />

      <SelectField
        id="client-orders-comment-presence"
        label="Client comment"
        value={filters.clientCommentPresence}
        options={CLIENT_COMMENT_OPTIONS}
        isActive={filters.clientCommentPresence !== 'all'}
        onChange={(clientCommentPresence) =>
          onChange({ ...filters, clientCommentPresence })
        }
      />

      <SelectField
        id="client-orders-created-by"
        label="Created by"
        value={filters.createdByType}
        options={ORDER_CREATED_BY_OPTIONS}
        isActive={filters.createdByType !== 'all'}
        onChange={(createdByType) => onChange({ ...filters, createdByType })}
      />
    </FilterDrawer>
  );
}

//===================================================================

type ClientProductsFiltersDrawerProps = Readonly<{
  filters: ClientProductFilters;
  hasActiveFilters: boolean;
  minDate?: string;
  resetHref: string;
  onChange: (filters: ClientProductFilters) => void;
  onClose: () => void;
  onReset: () => void;
}>;

function ClientProductsFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  resetHref,
  onChange,
  onClose,
  onReset,
}: ClientProductsFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="client-products-filters-panel"
      eyebrow="Client products"
      hasActiveFilters={hasActiveFilters}
      resetHref={resetHref}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="client-products-order-date"
        minDate={minDate}
        disabled={!minDate}
        label="First order date"
        value={filters.date}
        isActive={Boolean(filters.date.from || filters.date.to)}
        applyOnSubmit
        applyLabel="Apply"
        onChange={(date) => onChange({ ...filters, date })}
      />

      <SelectField
        id="client-products-category"
        label="Product category"
        value={filters.category}
        options={PRODUCT_CATEGORY_OPTIONS}
        isActive={filters.category !== 'all'}
        onChange={(category) => onChange({ ...filters, category })}
      />

      <SelectField
        id="client-products-status"
        label="Product status"
        value={filters.status}
        options={PRODUCT_STATUS_OPTIONS}
        isActive={filters.status !== 'all'}
        onChange={(status) => onChange({ ...filters, status })}
      />
    </FilterDrawer>
  );
}

//===================================================================

function getClientDetailsError(error: unknown): ClientDetailsError {
  if (isApiError(error) && [400, 404, 422].includes(error.httpStatus ?? 0)) {
    return {
      title: 'Client not found',
      message: 'This client does not exist or the link is invalid.',
    };
  }

  if (isApiError(error) && error.httpStatus === 403) {
    return {
      title: 'Client is unavailable',
      message: 'You do not have access to this client.',
    };
  }

  return {
    title: 'Client could not be loaded',
    message: getSafeApiErrorMessage(
      error,
      'Could not load client details. Please try again.'
    ),
  };
}

//===================================================================

function ClientDetailsPageContentState({
  clientId,
}: ClientDetailsPageContentProps) {
  const [client, setClient] = useState<PharmacyClientRow | null>(null);
  const [orders, setOrders] = useState<PharmacyOrderRow[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);

  const [ordersOverallTotal, setOrdersOverallTotal] = useState<number | null>(
    null
  );

  const [ordersTotalPages, setOrdersTotalPages] = useState(0);

  const [ordersRowsPerPage, setOrdersRowsPerPage] =
    useState<RowsPerPageValue>(20);

  const [ordersEarliestCreatedAt, setOrdersEarliestCreatedAt] = useState<
    string | null
  >(null);

  const [orderNumberSearch, setOrderNumberSearch] = useState('');
  const [orderCommentSearch, setOrderCommentSearch] = useState('');
  const debouncedOrderNumberSearch = useDebouncedValue(orderNumberSearch, 450);

  const debouncedOrderCommentSearch = useDebouncedValue(
    orderCommentSearch,
    450
  );

  const orderSearchKey = `${debouncedOrderNumberSearch}\u0000${debouncedOrderCommentSearch}`;

  const [ordersPageState, setOrdersPageState] = useState(() => ({
    searchKey: orderSearchKey,
    page: 1,
  }));

  const ordersPage =
    ordersPageState.searchKey === orderSearchKey ? ordersPageState.page : 1;

  const [orderFilters, setOrderFilters] = useState<ClientOrderFilters>(
    DEFAULT_ORDER_FILTERS
  );

  const [ordersStatus, setOrdersStatus] = useState<ResourceStatus>('idle');
  const [ordersError, setOrdersError] = useState('');
  const [isOrdersFiltersOpen, setIsOrdersFiltersOpen] = useState(false);

  const {
    data: orderStatistics,
    status: orderStatisticsStatus,
    startLoading: startOrderStatisticsLoading,
    setSuccess: setOrderStatisticsSuccess,
    setFailure: setOrderStatisticsFailure,
  } = useLastKnownStatistics<OrderStatisticsCounts>();

  const [commentsTotal, setCommentsTotal] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ClientTab>('details');
  const [clientStatus, setClientStatus] = useState<ResourceStatus>('loading');
  const [error, setError] = useState<ClientDetailsError | null>(null);

  const [products, setProducts] = useState<PharmacyClientPurchasedProduct[]>(
    []
  );

  const [productsTotal, setProductsTotal] = useState(0);

  const [productsEarliestCreatedAt, setProductsEarliestCreatedAt] = useState<
    string | null
  >(null);

  const [productsOverallTotal, setProductsOverallTotal] = useState<
    number | null
  >(null);

  const [productsTotalPages, setProductsTotalPages] = useState(0);

  const [productsRowsPerPage, setProductsRowsPerPage] =
    useState<RowsPerPageValue>(20);

  const [productArticleSearch, setProductArticleSearch] = useState('');
  const [productNameSearch, setProductNameSearch] = useState('');
  const debouncedProductArticleSearch = useDebouncedValue(
    productArticleSearch,
    450
  );
  const debouncedProductNameSearch = useDebouncedValue(productNameSearch, 450);

  const productSearchKey = `${debouncedProductArticleSearch}\u0000${debouncedProductNameSearch}`;
  const [productsPageState, setProductsPageState] = useState(() => ({
    searchKey: productSearchKey,
    page: 1,
  }));

  const productsPage =
    productsPageState.searchKey === productSearchKey
      ? productsPageState.page
      : 1;

  const [productFilters, setProductFilters] = useState<ClientProductFilters>(
    DEFAULT_PRODUCT_FILTERS
  );

  const [productsStatus, setProductsStatus] = useState<ResourceStatus>('idle');
  const [productsError, setProductsError] = useState('');
  const [isProductsFiltersOpen, setIsProductsFiltersOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadClient() {
      setClientStatus('loading');
      setError(null);

      try {
        const loadedClient = await getPharmacyClientDetails(clientId, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;
        setClient(loadedClient);
        setClientStatus('success');
      } catch (loadError) {
        if (controller.signal.aborted) return;

        setClient(null);
        setError(getClientDetailsError(loadError));
        setClientStatus('error');
      }
    }

    void loadClient();

    return () => {
      controller.abort();
    };
  }, [clientId]);

  useEffect(() => {
    dispatchPharmacyBreadcrumbLabel(`Client #${clientId}`);
  }, [clientId]);

  useEffect(() => {
    if (!client?.name) return;

    dispatchPharmacyBreadcrumbLabel(client.name);
  }, [client?.name]);

  useEffect(() => {
    if (clientStatus !== 'success') return;

    const controller = new AbortController();

    async function loadOrders() {
      setOrdersStatus('loading');
      setOrdersError('');
      startOrderStatisticsLoading();

      try {
        const response = await getPharmacyOrders(
          {
            page: ordersPage,
            perPage: ordersRowsPerPage,
            clientId,
            orderNumber: debouncedOrderNumberSearch.trim() || undefined,
            clientComment: debouncedOrderCommentSearch.trim() || undefined,
            dateFrom: orderFilters.date.from || undefined,
            dateTo: orderFilters.date.to || undefined,
            status:
              orderFilters.status === 'all' ? undefined : orderFilters.status,
            deliveryMethod:
              orderFilters.deliveryMethod === 'all'
                ? undefined
                : orderFilters.deliveryMethod,
            paymentMethod:
              orderFilters.paymentMethod === 'all'
                ? undefined
                : orderFilters.paymentMethod,
            clientCommentPresence:
              orderFilters.clientCommentPresence === 'all'
                ? undefined
                : orderFilters.clientCommentPresence,
            createdByType:
              orderFilters.createdByType === 'all'
                ? undefined
                : orderFilters.createdByType,
          },
          { signal: controller.signal }
        );

        if (controller.signal.aborted) return;

        setOrders([...response.items]);
        setOrdersTotal(response.total);
        setOrdersTotalPages(response.totalPages);
        setOrdersPageState({
          searchKey: orderSearchKey,
          page: response.page,
        });
        setOrdersEarliestCreatedAt(response.earliestCreatedAt);

        const hasSearchOrFilters = Boolean(
          debouncedOrderNumberSearch.trim() ||
          debouncedOrderCommentSearch.trim() ||
          orderFilters.date.from ||
          orderFilters.date.to ||
          orderFilters.status !== 'all' ||
          orderFilters.deliveryMethod !== 'all' ||
          orderFilters.paymentMethod !== 'all' ||
          orderFilters.clientCommentPresence !== 'all' ||
          orderFilters.createdByType !== 'all'
        );

        if (!hasSearchOrFilters) {
          setOrdersOverallTotal(response.total);
        }

        setOrderStatisticsSuccess(response.statistics);
        setOrdersStatus('success');
      } catch (loadOrdersError) {
        if (controller.signal.aborted) return;

        setOrdersError(
          getSafeApiErrorMessage(
            loadOrdersError,
            'Could not load client orders. Please try again.'
          )
        );
        setOrderStatisticsFailure();
        setOrdersStatus('error');
      }
    }

    void loadOrders();

    return () => {
      controller.abort();
    };
  }, [
    clientId,
    clientStatus,
    debouncedOrderCommentSearch,
    debouncedOrderNumberSearch,
    orderFilters,
    orderSearchKey,
    ordersPage,
    ordersRowsPerPage,
    setOrderStatisticsFailure,
    setOrderStatisticsSuccess,
    startOrderStatisticsLoading,
  ]);

  useEffect(() => {
    if (clientStatus !== 'success') return;

    const controller = new AbortController();

    async function loadProducts() {
      setProductsStatus('loading');
      setProductsError('');

      try {
        const response = await getPharmacyClientProducts(
          clientId,
          {
            page: productsPage,
            perPage: productsRowsPerPage,
            article: debouncedProductArticleSearch.trim() || undefined,
            name: debouncedProductNameSearch.trim() || undefined,
            dateFrom: productFilters.date.from || undefined,
            dateTo: productFilters.date.to || undefined,
            category:
              productFilters.category === 'all'
                ? undefined
                : productFilters.category,
            status:
              productFilters.status === 'all'
                ? undefined
                : productFilters.status,
          },
          { signal: controller.signal }
        );

        if (controller.signal.aborted) return;

        setProducts([...response.items]);
        setProductsTotal(response.total);
        setProductsEarliestCreatedAt(response.earliestCreatedAt);
        setProductsTotalPages(response.totalPages);
        setProductsPageState({
          searchKey: productSearchKey,
          page: response.page,
        });

        const hasSearchOrFilters = Boolean(
          debouncedProductArticleSearch.trim() ||
          debouncedProductNameSearch.trim() ||
          productFilters.date.from ||
          productFilters.date.to ||
          productFilters.category !== 'all' ||
          productFilters.status !== 'all'
        );

        if (!hasSearchOrFilters) {
          setProductsOverallTotal(response.total);
        }

        setProductsStatus('success');
      } catch (loadProductsError) {
        if (controller.signal.aborted) return;

        setProductsError(
          getSafeApiErrorMessage(
            loadProductsError,
            'Could not load purchased products. Please try again.'
          )
        );
        setProductsStatus('error');
      }
    }

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [
    clientId,
    clientStatus,
    debouncedProductArticleSearch,
    debouncedProductNameSearch,
    productFilters,
    productSearchKey,
    productsPage,
    productsRowsPerPage,
  ]);

  const tabs = useMemo(
    () =>
      CLIENT_TABS.map((tab) => {
        if (tab.value === 'orders') {
          return {
            ...tab,
            label:
              ordersOverallTotal === null
                ? 'Orders'
                : `Orders (${ordersOverallTotal})`,
          };
        }

        if (tab.value === 'products') {
          return {
            ...tab,
            label:
              productsOverallTotal === null
                ? 'Products'
                : `Products (${productsOverallTotal})`,
          };
        }

        if (tab.value === 'comments') {
          return {
            ...tab,
            label:
              commentsTotal === null
                ? 'Comments'
                : `Comments (${commentsTotal})`,
          };
        }

        return tab;
      }),
    [commentsTotal, ordersOverallTotal, productsOverallTotal]
  );

  const orderFiltersCount = countTrueConditions(
    Boolean(orderFilters.date.from || orderFilters.date.to),
    orderFilters.status !== 'all',
    orderFilters.deliveryMethod !== 'all',
    orderFilters.paymentMethod !== 'all',
    orderFilters.clientCommentPresence !== 'all',
    orderFilters.createdByType !== 'all'
  );

  const hasOrderFilters = orderFiltersCount > 0;

  const productFiltersCount = countTrueConditions(
    Boolean(productFilters.date.from || productFilters.date.to),
    productFilters.category !== 'all',
    productFilters.status !== 'all'
  );

  const hasProductFilters = productFiltersCount > 0;

  const orderColumns = useMemo<Array<DataTableColumn<PharmacyOrderRow>>>(
    () => [
      {
        key: 'date',
        title: <TableHeaderTitle parts={['Order', 'date']} />,
        render: (order) => <TableDateTime value={order.orderDate} />,
      },
      {
        key: 'number',
        title: <TableHeaderTitle parts={['Order', 'number']} />,
        render: (order) => (
          <TextActionButton href={getPharmacyOrderPath(order.id)}>
            {order.orderNumber}
          </TextActionButton>
        ),
      },
      {
        key: 'delivery',
        title: <TableHeaderTitle parts={['Delivery', 'method']} />,
        render: (order) => DELIVERY_METHOD_LABELS[order.deliveryMethod],
      },
      {
        key: 'payment',
        title: <TableHeaderTitle parts={['Payment', 'method']} />,
        render: (order) => PAYMENT_METHOD_LABELS[order.paymentMethod],
      },
      {
        key: 'comment',
        title: <TableHeaderTitle parts={['Client', 'comment']} />,
        render: (order) => order.clientComment || '—',
      },
      {
        key: 'quantity',
        title: <TableHeaderTitle parts={['Order', 'quantity']} />,
        render: (order) => order.totalQuantity,
      },
      {
        key: 'amount',
        title: <TableHeaderTitle parts={['Order', ' amount, ₴']} />,
        render: (order) => formatAmountValue(order.totalAmount),
      },
      {
        key: 'createdByType',
        title: <TableHeaderTitle parts={['Created', 'by']} />,
        render: (order) => ORDER_CREATED_BY_LABELS[order.createdByType],
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Order', 'status']} />,
        render: (order) => (
          <StatusBadge {...ORDER_STATUS_PRESENTATION[order.status]} />
        ),
      },
    ],
    []
  );

  const productColumns = useMemo<
    Array<DataTableColumn<PharmacyClientPurchasedProduct>>
  >(
    () => [
      {
        key: 'firstOrderDate',
        title: <TableHeaderTitle parts={['First order', 'date']} />,
        render: (item) => <TableDateTime value={item.firstOrderDate} />,
      },
      {
        key: 'photo',
        title: <TableHeaderTitle parts={['Product', 'photo']} />,
        render: (item) => (
          <TableImagePreview
            src={getProductImageSrc(item.photoUrl ?? undefined)}
            alt={`${item.name} photo`}
            fallback={formatInitials(item.name, 'P')}
          />
        ),
      },
      {
        key: 'article',
        title: <TableHeaderTitle parts={['Product', 'article']} />,
        render: (item) =>
          item.currentProductExists ? (
            <TextActionButton href={getPharmacyProductPath(item.productId)}>
              {item.article}
            </TextActionButton>
          ) : (
            item.article
          ),
      },
      {
        key: 'name',
        title: <TableHeaderTitle parts={['Product', 'name']} />,
        render: (item) =>
          item.currentProductExists ? (
            <TextActionButton href={getPharmacyProductPath(item.productId)}>
              {item.name}
            </TextActionButton>
          ) : (
            item.name
          ),
      },
      {
        key: 'category',
        title: <TableHeaderTitle parts={['Product', 'category']} />,
        render: (item) => PRODUCT_CATEGORY_LABELS[item.category],
      },
      {
        key: 'quantity',
        title: <TableHeaderTitle parts={['Purchased', 'quantity']} />,
        render: (item) => item.quantity,
      },
      {
        key: 'amount',
        title: <TableHeaderTitle parts={['Purchased ', 'amount, ₴']} />,
        render: (item) => formatAmountValue(item.totalAmount),
      },
      {
        key: 'ordersCount',
        title: <TableHeaderTitle parts={['Orders', 'count']} />,
        render: (item) => item.ordersCount,
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Product', 'status']} />,
        render: (item) =>
          item.currentStatus ? (
            <StatusBadge {...PRODUCT_STATUS_PRESENTATION[item.currentStatus]} />
          ) : (
            'Unavailable'
          ),
      },
    ],
    []
  );

  if (clientStatus === 'idle' || clientStatus === 'loading') {
    return (
      <main className={css.page} aria-label="Loading client">
        <section className={css.contentCard}>
          <div className={css.loaderBox}>
            <LoadingSpinner label="Loading client..." />
          </div>
        </section>
      </main>
    );
  }

  if (clientStatus === 'error' || !client) {
    const clientError = error ?? {
      title: 'Client not found',
      message: 'This client does not exist or the link is invalid.',
    };

    return (
      <main className={css.page} aria-labelledby="client-details-error-title">
        <section className={css.contentCard}>
          <div className={css.headerStack}>
            <PageHeader
              title={clientError.title}
              titleId="client-details-error-title"
              icon={<Users size={23} aria-hidden="true" />}
            />

            <StatusBanner
              tone="danger"
              label="Error"
              title={clientError.title}
              message={clientError.message}
            />
          </div>
        </section>
      </main>
    );
  }

  const clientImageSrc = getProductImageSrc(client.photoUrl ?? undefined);

  return (
    <main className={css.page} aria-labelledby="client-details-page-title">
      <section className={css.contentCard}>
        <div className={css.headerStack}>
          <PageHeader
            title={client.name}
            titleId="client-details-page-title"
            icon={<Users size={23} aria-hidden="true" />}
          />

          {orderStatistics ? (
            <OrderStatistics
              counts={orderStatistics}
              className={css.orderStatistics}
            />
          ) : orderStatisticsStatus === 'error' ? (
            <p className={css.statisticsState} role="alert">
              Order statistics are temporarily unavailable.
            </p>
          ) : (
            <p className={css.statisticsState} role="status">
              Loading order statistics...
            </p>
          )}
        </div>
      </section>

      <section className={css.contentCard}>
        <div className={css.tabsSection}>
          <Tabs
            items={tabs}
            activeValue={activeTab}
            ariaLabel="Client details tabs"
            mobileVisibleCount={1}
            tabletVisibleCount={3}
            onChange={setActiveTab}
          />

          {activeTab === 'details' ? (
            <div className={css.detailsGrid}>
              <section className={css.visualCard} aria-label="Client photo">
                {clientImageSrc ? (
                  <span className={css.imageFrame}>
                    <ShimmerImage
                      src={clientImageSrc}
                      alt={client.name}
                      className={css.clientImage}
                      sizes="(max-width: 767px) calc(100vw - 72px), (max-width: 1439px) 360px, 44vw"
                      unoptimized
                    />
                  </span>
                ) : (
                  <div className={css.imagePlaceholder} aria-hidden="true">
                    <UserRound size={72} />
                  </div>
                )}
              </section>

              <section className={css.detailsCard}>
                <h2>Client information</h2>

                <dl className={css.detailsList}>
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <StatusBadge
                        {...USER_STATUS_PRESENTATION[client.status]}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt>Client ID</dt>
                    <dd>{client.id}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>
                      {client.email ? (
                        <a href={`mailto:${client.email}`}>
                          <Mail size={17} aria-hidden="true" />
                          {client.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>
                      {client.phone ? (
                        <a href={`tel:${client.phone}`}>
                          <Phone size={17} aria-hidden="true" />
                          {client.phone}
                        </a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Address</dt>
                    <dd>
                      {client.address ? (
                        <span className={css.detailValueWithIcon}>
                          <MapPin size={17} aria-hidden="true" />
                          {client.address}
                        </span>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>First order</dt>
                    <dd>{formatClientDate(client.firstOrderAt)}</dd>
                  </div>
                </dl>

                {client.status === 'blocked' && client.statusReason ? (
                  <div className={css.statusReason}>
                    <strong>Inactive reason</strong>
                    <p>{client.statusReason}</p>
                  </div>
                ) : client.status === 'active' ? (
                  <div
                    className={`${css.statusReason} ${css.statusReasonActive}`}
                  >
                    <strong>Active client</strong>
                    <p>
                      The client account is active and can place orders without
                      additional account restrictions.
                    </p>
                  </div>
                ) : null}
              </section>
            </div>
          ) : null}

          {activeTab === 'orders' ? (
            <div className={css.sectionStack}>
              <section className={css.sectionCard}>
                <h2>Client orders</h2>

                <div className={css.searchGrid}>
                  <SearchInput
                    id="client-order-number-search"
                    label="Order number search"
                    value={orderNumberSearch}
                    placeholder="Order number"
                    isActive={Boolean(orderNumberSearch)}
                    onChange={setOrderNumberSearch}
                  />

                  <SearchInput
                    id="client-order-comment-search"
                    label="Client comment search"
                    value={orderCommentSearch}
                    placeholder="Client comment"
                    isActive={Boolean(orderCommentSearch)}
                    onChange={setOrderCommentSearch}
                  />

                  <div className={css.searchAction}>
                    <FiltersButton
                      activeCount={orderFiltersCount}
                      controlsId="client-orders-filters-panel"
                      isExpanded={isOrdersFiltersOpen}
                      className={css.filterButton}
                      onClick={() => setIsOrdersFiltersOpen(true)}
                    />
                  </div>
                </div>
              </section>

              <section className={css.sectionCard}>
                <div className={css.tableStack}>
                  <div className={css.tableToolbar}>
                    <div className={css.rowsControl}>
                      <RowsPerPageSelect
                        id="client-orders-rows-per-page"
                        value={ordersRowsPerPage}
                        options={PRODUCT_ROWS_PER_PAGE_OPTIONS}
                        onChange={(value) => {
                          setOrdersRowsPerPage(value);
                          setOrdersPageState({
                            searchKey: orderSearchKey,
                            page: 1,
                          });
                        }}
                      />
                    </div>

                    {ordersStatus === 'success' ? (
                      <CountLabel
                        className={css.countLabel}
                        shown={orders.length}
                        total={ordersTotal}
                        label="orders"
                      />
                    ) : null}
                  </div>

                  {ordersStatus === 'error' ? (
                    <p className={css.errorText} role="alert">
                      {ordersError}
                    </p>
                  ) : (
                    <DataTable
                      columns={orderColumns}
                      items={orders}
                      getItemKey={(order) => String(order.id)}
                      isLoading={
                        ordersStatus === 'idle' || ordersStatus === 'loading'
                      }
                      minWidth={0}
                      labels={{
                        loading: 'Loading client orders...',
                        empty: 'No orders match the selected filters.',
                      }}
                    />
                  )}

                  {ordersStatus === 'success' ? (
                    <PaginationView
                      currentPage={ordersPage}
                      totalPages={ordersTotalPages}
                      ariaLabel="Client orders pagination"
                      onPageChange={(page) =>
                        setOrdersPageState({ searchKey: orderSearchKey, page })
                      }
                    />
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === 'products' ? (
            <div className={css.sectionStack}>
              <section className={css.sectionCard}>
                <div className={css.titleWithTooltip}>
                  <h2>Purchased products</h2>
                  <InfoTooltip
                    label="About purchased products"
                    title="Successful purchases"
                    icon={<PackageCheck size={20} aria-hidden="true" />}
                    escapeOverflow
                    items={[
                      {
                        title: 'Purchased quantity and amount',
                        description:
                          'Totals across all successful orders containing the product.',
                      },
                      {
                        title: 'First order date',
                        description:
                          'The earliest successful order in which this product appeared.',
                      },
                      {
                        title: 'Orders count',
                        description:
                          'How many successful orders included this product. Each product appears only once in this table.',
                      },
                    ]}
                  />
                </div>

                <div className={css.searchGrid}>
                  <SearchInput
                    id="client-product-article-search"
                    label="Product article search"
                    value={productArticleSearch}
                    placeholder="Product article"
                    isActive={Boolean(productArticleSearch)}
                    onChange={setProductArticleSearch}
                  />

                  <SearchInput
                    id="client-product-name-search"
                    label="Product name search"
                    value={productNameSearch}
                    placeholder="Product name"
                    isActive={Boolean(productNameSearch)}
                    onChange={setProductNameSearch}
                  />

                  <div className={css.searchAction}>
                    <FiltersButton
                      activeCount={productFiltersCount}
                      controlsId="client-products-filters-panel"
                      isExpanded={isProductsFiltersOpen}
                      className={css.filterButton}
                      onClick={() => setIsProductsFiltersOpen(true)}
                    />
                  </div>
                </div>
              </section>

              <section className={css.sectionCard}>
                <div className={css.tableStack}>
                  <div className={css.tableToolbar}>
                    <div className={css.rowsControl}>
                      <RowsPerPageSelect
                        id="client-products-rows-per-page"
                        value={productsRowsPerPage}
                        options={PRODUCT_ROWS_PER_PAGE_OPTIONS}
                        onChange={(value) => {
                          setProductsRowsPerPage(value);
                          setProductsPageState({
                            searchKey: productSearchKey,
                            page: 1,
                          });
                        }}
                      />
                    </div>
                    {productsStatus === 'success' ? (
                      <CountLabel
                        className={css.countLabel}
                        shown={products.length}
                        total={productsTotal}
                        label="products"
                      />
                    ) : null}
                  </div>

                  {productsStatus === 'error' ? (
                    <p className={css.errorText} role="alert">
                      {productsError}
                    </p>
                  ) : (
                    <DataTable
                      columns={productColumns}
                      items={products}
                      getItemKey={(item) => item.id}
                      isLoading={
                        productsStatus === 'idle' ||
                        productsStatus === 'loading'
                      }
                      minWidth={0}
                      labels={{
                        loading: 'Loading purchased products...',
                        empty:
                          'No successful-order products match the filters.',
                      }}
                    />
                  )}

                  {productsStatus === 'success' ? (
                    <PaginationView
                      currentPage={productsPage}
                      totalPages={productsTotalPages}
                      onPageChange={(page) =>
                        setProductsPageState({
                          searchKey: productSearchKey,
                          page,
                        })
                      }
                    />
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}

          <div hidden={activeTab !== 'comments'}>
            <EntityComments
              entityKey={`client:${clientId}`}
              initialTotal={commentsTotal ?? undefined}
              load={(page, options) =>
                getPharmacyNotes('client', clientId, page, options)
              }
              create={(text, options) =>
                createPharmacyNote(
                  'client',
                  clientId,
                  text,
                  options.clientRequestId,
                  options
                )
              }
              remove={(id, options) =>
                deletePharmacyNote('client', clientId, id, options)
              }
              onTotalChange={setCommentsTotal}
            />
          </div>
        </div>
      </section>

      {isOrdersFiltersOpen ? (
        <ClientOrdersFiltersDrawer
          filters={orderFilters}
          hasActiveFilters={hasOrderFilters}
          minDate={ordersEarliestCreatedAt ?? undefined}
          resetHref={getPharmacyClientPath(clientId)}
          onChange={(filters) => {
            setOrderFilters(filters);
            setOrdersPageState({
              searchKey: orderSearchKey,
              page: 1,
            });
          }}
          onClose={() => setIsOrdersFiltersOpen(false)}
          onReset={() => {
            setOrderFilters(DEFAULT_ORDER_FILTERS);
            setOrdersPageState({
              searchKey: orderSearchKey,
              page: 1,
            });
          }}
        />
      ) : null}

      {isProductsFiltersOpen ? (
        <ClientProductsFiltersDrawer
          filters={productFilters}
          hasActiveFilters={hasProductFilters}
          minDate={productsEarliestCreatedAt ?? undefined}
          resetHref={getPharmacyClientPath(clientId)}
          onChange={(filters) => {
            setProductFilters(filters);
            setProductsPageState({ searchKey: productSearchKey, page: 1 });
          }}
          onClose={() => setIsProductsFiltersOpen(false)}
          onReset={() => {
            setProductFilters(DEFAULT_PRODUCT_FILTERS);
            setProductsPageState({ searchKey: productSearchKey, page: 1 });
          }}
        />
      ) : null}
    </main>
  );
}

//===================================================================

function ClientDetailsPageContent(props: ClientDetailsPageContentProps) {
  return <ClientDetailsPageContentState key={props.clientId} {...props} />;
}

//===================================================================

export default ClientDetailsPageContent;
export { ClientDetailsPageContent };
