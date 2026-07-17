'use client';

import Link from 'next/link';
import {
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  UserRound,
  Users,
} from 'lucide-react';

import { useEffect, useMemo, useState, type MouseEventHandler } from 'react';

import {
  ButtonLink,
  CloseIconButton,
  CountLabel,
  DataTable,
  DateFilter,
  FiltersButton,
  formatInitials,
  InfoTooltip,
  LoadingSpinner,
  Pagination,
  ResetFiltersButton,
  RowsPerPageSelect,
  SearchInput,
  SelectField,
  ShimmerImage,
  TableDateTime,
  TableHeaderTitle,
  TableImagePreview,
  Tabs,
  TextActionButton,
  type DataTableColumn,
  type DateFilterValue,
  type RowsPerPageValue,
  type SelectOption,
  type TabItem,
} from '@e-pharmacy/ui/common';

import { EntityComments } from '@e-pharmacy/ui/feedback';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { OrderStatistics, StatusBadge } from '@e-pharmacy/ui/statistics';

import {
  DEFAULT_ORDER_STATISTICS,
  type OrderStatisticsCounts,
} from '@e-pharmacy/types/orders';

import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types';

import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  type ProductCategory,
  type ProductStatus,
} from '@e-pharmacy/types/products';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
} from '@e-pharmacy/hooks';

import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';

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

import {
  getPharmacyClientPath,
  getPharmacyClientsPath,
  getPharmacyOrderPath,
  getPharmacyProductPath,
} from '@/lib/layout/routes';

import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type PharmacyOrderRow,
} from '@/lib/orders/orders';

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
};

const ORDER_STATUS_OPTIONS: Array<SelectOption<ClientOrderFilters['status']>> =
  [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'successful', label: 'Successful' },
    { value: 'rejected', label: 'Rejected' },
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
  { value: 'new', label: 'New' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
];

const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  new: 'New',
  active: 'Active',
  blocked: 'Blocked',
};

//===================================================================

function formatClientDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Not specified'
    : formatShortDate(value);
}

//===================================================================

function formatAmount(value: number): string {
  return formatPrice(value).replace(/\sUAH$/, '');
}

//===================================================================

type ClientOrdersFiltersDrawerProps = Readonly<{
  filters: ClientOrderFilters;
  hasActiveFilters: boolean;
  minDate?: string;
  resetHref: string;
  onBackdropMouseDown: MouseEventHandler<HTMLDivElement>;
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
  onBackdropMouseDown,
  onChange,
  onClose,
  onReset,
}: ClientOrdersFiltersDrawerProps) {
  return (
    <div
      className={css.filtersBackdrop}
      role="presentation"
      onMouseDown={onBackdropMouseDown}
    >
      <aside
        className={css.filtersPanel}
        id="client-orders-filters-panel"
        aria-labelledby="client-orders-filters-title"
        aria-modal="true"
        role="dialog"
      >
        <div className={css.filtersHeader}>
          <div>
            <p className={css.filtersKicker}>Client orders</p>
            <h2 className={css.filtersTitle} id="client-orders-filters-title">
              Filters
            </h2>
          </div>

          <CloseIconButton label="Close filters" onClick={onClose} />
        </div>

        <div className={css.filtersControls}>
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
            onChange={(deliveryMethod) =>
              onChange({ ...filters, deliveryMethod })
            }
          />

          <SelectField
            id="client-orders-payment"
            label="Payment method"
            value={filters.paymentMethod}
            options={PAYMENT_METHOD_OPTIONS}
            isActive={filters.paymentMethod !== 'all'}
            onChange={(paymentMethod) =>
              onChange({ ...filters, paymentMethod })
            }
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
        </div>

        {hasActiveFilters ? (
          <ResetFiltersButton
            className={css.resetButton}
            href={resetHref}
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

type ClientProductsFiltersDrawerProps = Readonly<{
  filters: ClientProductFilters;
  hasActiveFilters: boolean;
  minDate?: string;
  resetHref: string;
  onBackdropMouseDown: MouseEventHandler<HTMLDivElement>;
  onChange: (filters: ClientProductFilters) => void;
  onClose: () => void;
  onReset: () => void;
}>;

function ClientProductsFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  resetHref,
  onBackdropMouseDown,
  onChange,
  onClose,
  onReset,
}: ClientProductsFiltersDrawerProps) {
  return (
    <div
      className={css.filtersBackdrop}
      role="presentation"
      onMouseDown={onBackdropMouseDown}
    >
      <aside
        className={css.filtersPanel}
        id="client-products-filters-panel"
        aria-labelledby="client-products-filters-title"
        aria-modal="true"
        role="dialog"
      >
        <div className={css.filtersHeader}>
          <div>
            <p className={css.filtersKicker}>Client products</p>
            <h2 className={css.filtersTitle} id="client-products-filters-title">
              Filters
            </h2>
          </div>

          <CloseIconButton label="Close filters" onClick={onClose} />
        </div>

        <div className={css.filtersControls}>
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
        </div>

        {hasActiveFilters ? (
          <ResetFiltersButton
            className={css.resetButton}
            href={resetHref}
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

  useBodyScrollLock(isProductsFiltersOpen || isOrdersFiltersOpen);

  useEscapeToClose({
    isOpen: isProductsFiltersOpen,
    onClose: () => setIsProductsFiltersOpen(false),
  });

  useEscapeToClose({
    isOpen: isOrdersFiltersOpen,
    onClose: () => setIsOrdersFiltersOpen(false),
  });

  const handleProductsFiltersBackdrop = useBackdropClick({
    onClose: () => setIsProductsFiltersOpen(false),
  });

  const handleOrdersFiltersBackdrop = useBackdropClick({
    onClose: () => setIsOrdersFiltersOpen(false),
  });

  useEffect(() => {
    let mounted = true;

    async function loadClient() {
      await Promise.resolve();

      setLoading(true);
      setError('');

      try {
        const [loadedClient, ordersResponse, commentsResponse] =
          await Promise.all([
            getPharmacyClientDetails(clientId),
            getPharmacyOrders({ page: 1, perPage: 1, clientId }),
            getPharmacyNotes('client', clientId, 1).catch(() => null),
          ]);

        if (!mounted) return;

        setClient(loadedClient);
        setOrdersOverallTotal(ordersResponse.total);
        setOrdersEarliestCreatedAt(ordersResponse.earliestCreatedAt);
        setOrderStatistics(ordersResponse.statistics);
        setCommentsTotal(commentsResponse?.total ?? 0);
      } catch {
        if (mounted) setError('Could not load client details.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadClient();

    return () => {
      mounted = false;
    };
  }, [clientId]);

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      await Promise.resolve();
      setOrdersLoading(true);
      setOrdersError('');

      try {
        const response = await getPharmacyOrders({
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
        });

        if (!mounted) return;

        setOrders(response.items);
        setOrdersTotal(response.total);
        setOrdersTotalPages(Math.ceil(response.total / ordersRowsPerPage));
        setOrdersEarliestCreatedAt(response.earliestCreatedAt);

        const hasSearchOrFilters = Boolean(
          orderNumberSearch.trim() ||
          orderCommentSearch.trim() ||
          orderFilters.date.from ||
          orderFilters.date.to ||
          orderFilters.status !== 'all' ||
          orderFilters.deliveryMethod !== 'all' ||
          orderFilters.paymentMethod !== 'all' ||
          orderFilters.clientCommentPresence !== 'all'
        );

        if (!hasSearchOrFilters) {
          setOrdersOverallTotal(response.total);
          setOrderStatistics(response.statistics);
        }
      } catch (loadOrdersError) {
        if (!mounted) return;
        setOrders([]);
        setOrdersTotal(0);
        setOrdersTotalPages(0);
        setOrdersError(
          loadOrdersError instanceof Error && loadOrdersError.message
            ? loadOrdersError.message
            : 'Could not load client orders.'
        );
      } finally {
        if (mounted) setOrdersLoading(false);
      }
    }

    void loadOrders();

    return () => {
      mounted = false;
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
    let mounted = true;

    async function loadProducts() {
      await Promise.resolve();

      setProductsLoading(true);
      setProductsError('');

      try {
        const response = await getPharmacyClientProducts(clientId, {
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
            productFilters.status === 'all' ? undefined : productFilters.status,
        });

        if (!mounted) return;

        setProducts(response.items);
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
        if (!mounted) return;

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
        if (mounted) setProductsLoading(false);
      }
    }

    void loadProducts();

    return () => {
      mounted = false;
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

  const orderFiltersCount = [
    orderFilters.date.from || orderFilters.date.to,
    orderFilters.status !== 'all',
    orderFilters.deliveryMethod !== 'all',
    orderFilters.paymentMethod !== 'all',
    orderFilters.clientCommentPresence !== 'all',
  ].filter(Boolean).length;

  const hasOrderFilters = orderFiltersCount > 0;

  const productFiltersCount = [
    productFilters.date.from || productFilters.date.to,
    productFilters.category !== 'all',
    productFilters.status !== 'all',
  ].filter(Boolean).length;

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
        title: <TableHeaderTitle parts={['Order amount,', 'UAH']} />,
        render: (order) => formatAmount(order.totalAmount),
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Order', 'status']} />,
        render: (order) => (
          <StatusBadge
            status={order.status}
            label={ORDER_STATUS_LABELS[order.status]}
          />
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
        render: (item) => formatAmount(item.totalAmount),
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Product', 'status']} />,
        render: (item) => (
          <StatusBadge
            status={item.status}
            label={PRODUCT_STATUS_LABELS[item.status]}
          />
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
          <ButtonLink
            href={getPharmacyClientsPath()}
            renderLink={({ href, className, children, ...props }) => (
              <Link href={href} className={className} {...props}>
                {children}
              </Link>
            )}
          >
            Back to clients
          </ButtonLink>
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
                        status={client.status}
                        label={
                          client.status === 'active' ? 'Active' : 'Blocked'
                        }
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

                  <Pagination
                    currentPage={ordersPage}
                    totalPages={ordersTotalPages}
                    getPageHref={(page) => String(page)}
                    ariaLabel="Client orders pagination"
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
                        disabled={ordersLoading}
                        onClick={() => setOrdersPage(Number(href))}
                      >
                        {children}
                      </button>
                    )}
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

                  <Pagination
                    currentPage={productsPage}
                    totalPages={productsTotalPages}
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
                        onClick={() => setProductsPage(Number(href))}
                      >
                        {children}
                      </button>
                    )}
                  />
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === 'comments' ? (
            <EntityComments
              entityKey={`client:${clientId}`}
              initialTotal={commentsTotal}
              load={(page) => getPharmacyNotes('client', clientId, page)}
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
          onBackdropMouseDown={handleOrdersFiltersBackdrop}
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
          onBackdropMouseDown={handleProductsFiltersBackdrop}
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
