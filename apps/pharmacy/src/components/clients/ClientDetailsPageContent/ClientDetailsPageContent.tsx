'use client';

import Link from 'next/link';
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
import type { OrderCreatedByType } from '@e-pharmacy/types/orders';

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

import { LinkButton } from '@e-pharmacy/ui/navigation';

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

import { OrderStatisticsCounts } from '@e-pharmacy/types/orders';

import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types/orders';

import { ProductCategory, ProductStatus } from '@e-pharmacy/types/products';
import { countTrueConditions } from '@e-pharmacy/utils/collections';
import { formatAmount } from '@e-pharmacy/utils/money';
import { formatShortDate } from '@e-pharmacy/utils/date';

import {
  getPharmacyClientPath,
  PHARMACY_ROUTES,
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

import { DEFAULT_ORDER_STATISTICS } from '@/lib/statistics/defaults';
import { getProductImageSrc } from '@/lib/products/product-images';

import { type PharmacyOrderRow } from '@/lib/orders/orders';

import { dispatchPharmacyBreadcrumbLabel } from '@/lib/layout/breadcrumbs';

import { EntityComments } from '@/components/comments/EntityComments';
import { OrderStatistics } from '@/components/statistics';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import css from './ClientDetailsPageContent.module.css';

//===================================================================

type ClientDetailsPageContentProps = Readonly<{ clientId: string }>;

type ClientTab = 'details' | 'orders' | 'products' | 'comments';

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

const PRODUCT_ROWS_PER_PAGE_OPTIONS: RowsPerPageValue[] = [20, 50, 100];

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
        label="Order date"
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

function ClientDetailsPageContent({ clientId }: ClientDetailsPageContentProps) {
  const [client, setClient] = useState<PharmacyClientRow | null>(null);
  const [orders, setOrders] = useState<PharmacyOrderRow[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersOverallTotal, setOrdersOverallTotal] = useState(0);
  const [ordersTotalPages, setOrdersTotalPages] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);

  const [ordersRowsPerPage, setOrdersRowsPerPage] =
    useState<RowsPerPageValue>(20);

  const [ordersEarliestCreatedAt, setOrdersEarliestCreatedAt] = useState<
    string | null
  >(null);

  const [orderNumberSearch, setOrderNumberSearch] = useState('');
  const [orderCommentSearch, setOrderCommentSearch] = useState('');

  const [orderFilters, setOrderFilters] = useState<ClientOrderFilters>(
    DEFAULT_ORDER_FILTERS
  );

  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [isOrdersFiltersOpen, setIsOrdersFiltersOpen] = useState(false);

  const [orderStatistics, setOrderStatistics] = useState<OrderStatisticsCounts>(
    DEFAULT_ORDER_STATISTICS
  );

  const [commentsTotal, setCommentsTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<ClientTab>('details');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [products, setProducts] = useState<PharmacyClientPurchasedProduct[]>(
    []
  );

  const [productsTotal, setProductsTotal] = useState(0);

  const [productsEarliestCreatedAt, setProductsEarliestCreatedAt] = useState<
    string | null
  >(null);

  const [productsOverallTotal, setProductsOverallTotal] = useState(0);
  const [productsTotalPages, setProductsTotalPages] = useState(0);
  const [productsPage, setProductsPage] = useState(1);

  const [productsRowsPerPage, setProductsRowsPerPage] =
    useState<RowsPerPageValue>(20);

  const [productArticleSearch, setProductArticleSearch] = useState('');
  const [productNameSearch, setProductNameSearch] = useState('');

  const [productFilters, setProductFilters] = useState<ClientProductFilters>(
    DEFAULT_PRODUCT_FILTERS
  );

  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [isProductsFiltersOpen, setIsProductsFiltersOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const requestOptions = { signal: controller.signal };

    async function loadClient() {
      setLoading(true);
      setError('');

      try {
        const [loadedClient, ordersResponse, commentsResponse] =
          await Promise.all([
            getPharmacyClientDetails(clientId, requestOptions),
            getPharmacyOrders(
              { page: 1, perPage: 1, clientId },
              requestOptions
            ),
            getPharmacyNotes('client', clientId, 1, requestOptions).catch(
              () => null
            ),
          ]);

        if (controller.signal.aborted) return;

        setClient(loadedClient);
        setOrdersOverallTotal(ordersResponse.total);
        setOrdersEarliestCreatedAt(ordersResponse.earliestCreatedAt);
        setOrderStatistics(ordersResponse.statistics);
        setCommentsTotal(commentsResponse?.total ?? 0);
      } catch {
        if (!controller.signal.aborted) {
          setError('Could not load client details.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadClient();

    return () => {
      controller.abort();
    };
  }, [clientId]);

  useEffect(() => {
    if (!client?.name) return;

    dispatchPharmacyBreadcrumbLabel(client.name);
  }, [client?.name]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      setOrdersLoading(true);
      setOrdersError('');

      try {
        const response = await getPharmacyOrders(
          {
            page: ordersPage,
            perPage: ordersRowsPerPage,
            clientId,
            orderNumber: orderNumberSearch.trim() || undefined,
            clientComment: orderCommentSearch.trim() || undefined,
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
        setOrdersEarliestCreatedAt(response.earliestCreatedAt);

        const hasSearchOrFilters = Boolean(
          orderNumberSearch.trim() ||
          orderCommentSearch.trim() ||
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
          setOrderStatistics(response.statistics);
        }
      } catch (loadOrdersError) {
        if (controller.signal.aborted) return;
        setOrders([]);
        setOrdersTotal(0);
        setOrdersTotalPages(0);
        setOrdersError(
          loadOrdersError instanceof Error && loadOrdersError.message
            ? loadOrdersError.message
            : 'Could not load client orders.'
        );
      } finally {
        if (!controller.signal.aborted) setOrdersLoading(false);
      }
    }

    void loadOrders();

    return () => {
      controller.abort();
    };
  }, [
    clientId,
    orderCommentSearch,
    orderFilters,
    orderNumberSearch,
    ordersPage,
    ordersRowsPerPage,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setProductsLoading(true);
      setProductsError('');

      try {
        const response = await getPharmacyClientProducts(
          clientId,
          {
            page: productsPage,
            perPage: productsRowsPerPage,
            article: productArticleSearch.trim() || undefined,
            name: productNameSearch.trim() || undefined,
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

        const hasSearchOrFilters = Boolean(
          productArticleSearch.trim() ||
          productNameSearch.trim() ||
          productFilters.date.from ||
          productFilters.date.to ||
          productFilters.category !== 'all' ||
          productFilters.status !== 'all'
        );

        if (!hasSearchOrFilters) {
          setProductsOverallTotal(response.total);
        }
      } catch (loadProductsError) {
        if (controller.signal.aborted) return;

        setProducts([]);
        setProductsTotal(0);
        setProductsEarliestCreatedAt(null);
        setProductsTotalPages(0);
        setProductsError(
          loadProductsError instanceof Error && loadProductsError.message
            ? loadProductsError.message
            : 'Could not load purchased products.'
        );
      } finally {
        if (!controller.signal.aborted) setProductsLoading(false);
      }
    }

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [
    clientId,
    productArticleSearch,
    productFilters,
    productNameSearch,
    productsPage,
    productsRowsPerPage,
  ]);

  const tabs = useMemo(
    () =>
      CLIENT_TABS.map((tab) => {
        if (tab.value === 'orders') {
          return { ...tab, label: `Orders (${ordersOverallTotal})` };
        }

        if (tab.value === 'products') {
          return { ...tab, label: `Products (${productsOverallTotal})` };
        }

        if (tab.value === 'comments') {
          return { ...tab, label: `Comments (${commentsTotal})` };
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
        title: <TableHeaderTitle parts={['Order', ' amount, ', 'UAH']} />,
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
        key: 'date',
        title: <TableHeaderTitle parts={['Order', 'date']} />,
        render: (item) => <TableDateTime value={item.orderDate} />,
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
        render: (item) => (
          <TextActionButton href={getPharmacyProductPath(item.productId)}>
            {item.article}
          </TextActionButton>
        ),
      },
      {
        key: 'name',
        title: <TableHeaderTitle parts={['Product', 'name']} />,
        render: (item) => (
          <TextActionButton href={getPharmacyProductPath(item.productId)}>
            {item.name}
          </TextActionButton>
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
        title: <TableHeaderTitle parts={['Purchased amount,', 'UAH']} />,
        render: (item) => formatAmountValue(item.totalAmount),
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Product', 'status']} />,
        render: (item) => (
          <StatusBadge {...PRODUCT_STATUS_PRESENTATION[item.status]} />
        ),
      },
    ],
    []
  );

  if (loading) {
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

  if (error || !client) {
    return (
      <main className={css.page}>
        <section className={css.contentCard}>
          <p>{error || 'Client not found.'}</p>
          <LinkButton
            href={PHARMACY_ROUTES.CLIENTS}
            renderLink={({ href, className, children, ...props }) => (
              <Link href={href} className={className} {...props}>
                {children}
              </Link>
            )}
          >
            Back to clients
          </LinkButton>
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

          <OrderStatistics
            counts={orderStatistics}
            className={css.orderStatistics}
          />
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
                    onChange={(value) => {
                      setOrderNumberSearch(value);
                      setOrdersPage(1);
                    }}
                  />

                  <SearchInput
                    id="client-order-comment-search"
                    label="Client comment search"
                    value={orderCommentSearch}
                    placeholder="Client comment"
                    isActive={Boolean(orderCommentSearch)}
                    onChange={(value) => {
                      setOrderCommentSearch(value);
                      setOrdersPage(1);
                    }}
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
                          setOrdersPage(1);
                        }}
                      />
                    </div>

                    <CountLabel
                      className={css.countLabel}
                      shown={orders.length}
                      total={ordersTotal}
                      label="orders"
                    />
                  </div>

                  {ordersError ? (
                    <p className={css.errorText}>{ordersError}</p>
                  ) : null}

                  <DataTable
                    columns={orderColumns}
                    items={orders}
                    getItemKey={(order) => String(order.id)}
                    isLoading={ordersLoading}
                    minWidth={0}
                    labels={{
                      loading: 'Loading client orders...',
                      empty: 'No orders match the selected filters.',
                    }}
                  />

                  <PaginationView
                    currentPage={ordersPage}
                    totalPages={ordersTotalPages}
                    ariaLabel="Client orders pagination"
                    disabled={ordersLoading}
                    onPageChange={setOrdersPage}
                  />
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
                  >
                    This table contains products from this client’s successful
                    orders only. Quantities and amounts reflect what was
                    actually purchased in completed orders.
                  </InfoTooltip>
                </div>

                <div className={css.searchGrid}>
                  <SearchInput
                    id="client-product-article-search"
                    label="Product article search"
                    value={productArticleSearch}
                    placeholder="Product article"
                    isActive={Boolean(productArticleSearch)}
                    onChange={(value) => {
                      setProductArticleSearch(value);
                      setProductsPage(1);
                    }}
                  />

                  <SearchInput
                    id="client-product-name-search"
                    label="Product name search"
                    value={productNameSearch}
                    placeholder="Product name"
                    isActive={Boolean(productNameSearch)}
                    onChange={(value) => {
                      setProductNameSearch(value);
                      setProductsPage(1);
                    }}
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
                          setProductsPage(1);
                        }}
                      />
                    </div>
                    <CountLabel
                      className={css.countLabel}
                      shown={products.length}
                      total={productsTotal}
                      label="products"
                    />
                  </div>

                  {productsError ? (
                    <p className={css.errorText}>{productsError}</p>
                  ) : null}

                  <DataTable
                    columns={productColumns}
                    items={products}
                    getItemKey={(item) => item.id}
                    isLoading={productsLoading}
                    minWidth={0}
                    labels={{
                      loading: 'Loading purchased products...',
                      empty: 'No successful-order products match the filters.',
                    }}
                  />

                  <PaginationView
                    currentPage={productsPage}
                    totalPages={productsTotalPages}
                    onPageChange={setProductsPage}
                  />
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === 'comments' ? (
            <EntityComments
              entityKey={`client:${clientId}`}
              initialTotal={commentsTotal}
              load={(page, options) =>
                getPharmacyNotes('client', clientId, page, options)
              }
              create={(text) => createPharmacyNote('client', clientId, text)}
              remove={(id) => deletePharmacyNote('client', clientId, id)}
              onTotalChange={setCommentsTotal}
            />
          ) : null}
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
            setOrdersPage(1);
          }}
          onClose={() => setIsOrdersFiltersOpen(false)}
          onReset={() => {
            setOrderFilters(DEFAULT_ORDER_FILTERS);
            setOrdersPage(1);
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
            setProductsPage(1);
          }}
          onClose={() => setIsProductsFiltersOpen(false)}
          onReset={() => {
            setProductFilters(DEFAULT_PRODUCT_FILTERS);
            setProductsPage(1);
          }}
        />
      ) : null}
    </main>
  );
}

export default ClientDetailsPageContent;
export { ClientDetailsPageContent };
