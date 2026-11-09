'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  Building2,
  MessageSquareText,
  Boxes,
  ShoppingBag,
  UserRound,
  Users,
} from 'lucide-react';

import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
import { isApiError } from '@e-pharmacy/api-client/transport';
import { type RowsPerPageValue, type SelectOption } from '@e-pharmacy/ui/forms';
import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatsLoadingSkeleton } from '@e-pharmacy/ui/statistics';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import { countTrueConditions } from '@e-pharmacy/utils/collections';

import { getPharmacyClientPath } from '@/lib/routes';

import {
  buildClientPurchasedProductsPath,
  parseClientPurchasedProductsPath,
} from '@/lib/clients/client-purchased-products-paths';

import {
  buildClientDetailPaginationPath,
  parseClientDetailPaginationPath,
  type ClientDetailListTab,
} from '@/lib/clients/client-detail-pagination';

import { type OwnedPharmacyListUrlState } from '@/lib/pharmacies/owned-pharmacy-url';

import {
  createPharmacyNote,
  deletePharmacyNote,
  getPharmacyNotes,
  getPharmacyOrders,
  getProductCategories,
} from '@/lib/api/browser';

import {
  getPharmacyClientDetails,
  getPharmacyClientProducts,
} from '@/lib/api/browser/clients.api';

import type {
  PharmacyClientPurchasedProduct,
  PharmacyClientRow,
} from '@/lib/clients/clients';

import type { PharmacyOrderRow } from '@/lib/orders/orders';
import { getClientDisplayName } from '@/lib/clients/client-display-name';
import { dispatchPharmacyBreadcrumbLabel } from '@/lib/layout/breadcrumbs';
import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';

import { EntityComments } from '@/components/comments/EntityComments';
import { ClientPharmaciesTab } from '@/components/clients/ClientPharmaciesTab/ClientPharmaciesTab';

import {
  shouldLoadClientProducts,
  type ClientDetailTab,
} from '@/components/clients/client-detail-resource-policy';

import {
  ClientOrdersFiltersDrawer,
  ClientProductsFiltersDrawer,
  DEFAULT_ORDER_FILTERS,
  DEFAULT_PRODUCT_FILTERS,
  type ClientOrderFilters,
  type ClientProductFilters,
} from './ClientDetailFilters';

import { ClientInformationTab } from './ClientInformationTab';
import { ClientOrderStatistics } from './ClientOrderStatistics';
import { ClientOrdersTab } from './ClientOrdersTab';
import { ClientProductsTab } from './ClientProductsTab';

import css from './ClientDetailsPageContent.module.css';

//===================================================================

type ClientDetailsPageContentProps = Readonly<{
  clientId: string;
  initialTab?: ClientDetailTab;
  initialPharmacyFilters?: OwnedPharmacyListUrlState;
}>;

//===================================================================

type ResourceStatus = 'idle' | 'loading' | 'success' | 'error';

//===================================================================

type ClientDetailsError = Readonly<{
  title: string;
  message: string;
}>;

//===================================================================

const CLIENT_TABS: Array<TabItem<ClientDetailTab>> = [
  { value: 'details', label: 'Details', icon: <UserRound size={17} /> },
  { value: 'orders', label: 'Client orders', icon: <ShoppingBag size={17} /> },
  { value: 'pharmacies', label: 'Pharmacies', icon: <Building2 size={17} /> },
  {
    value: 'products',
    label: 'Products',
    icon: <Boxes size={17} />,
  },
  {
    value: 'comments',
    label: 'Comments',
    icon: <MessageSquareText size={17} />,
  },
];

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
  initialTab = 'details',
  initialPharmacyFilters,
}: ClientDetailsPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  const ordersPagination = parseClientDetailPaginationPath(
    pathname,
    clientId,
    'orders'
  );

  const productsRoute = parseClientPurchasedProductsPath(pathname, clientId);
  const productsPagination = productsRoute.pagination;

  const navigateTable = useCallback(
    (
      tab: ClientDetailListTab,
      page: number,
      perPage: RowsPerPageValue,
      replace = false
    ) => {
      const nextPath =
        tab === 'products'
          ? buildClientPurchasedProductsPath(
              clientId,
              parseClientPurchasedProductsPath(pathname, clientId).filters,
              { page, perPage }
            )
          : buildClientDetailPaginationPath(clientId, tab, { page, perPage });

      if (nextPath === pathname) return;

      if (replace) router.replace(nextPath, { scroll: false });
      else router.push(nextPath, { scroll: false });
    },
    [clientId, pathname, router]
  );

  const [client, setClient] = useState<PharmacyClientRow | null>(null);
  const [orders, setOrders] = useState<PharmacyOrderRow[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);

  const [ordersOverallTotal, setOrdersOverallTotal] = useState<number | null>(
    null
  );

  const [ordersTotalPages, setOrdersTotalPages] = useState(0);
  const ordersRowsPerPage = ordersPagination.perPage;

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
  const ordersPage = ordersPagination.page;

  const [orderFilters, setOrderFilters] = useState<ClientOrderFilters>(
    DEFAULT_ORDER_FILTERS
  );

  const [ordersStatus, setOrdersStatus] = useState<ResourceStatus>('idle');
  const [ordersError, setOrdersError] = useState('');
  const [ordersRetryVersion, setOrdersRetryVersion] = useState(0);
  const [isOrdersFiltersOpen, setIsOrdersFiltersOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<ClientDetailTab>(initialTab);
  const [clientStatus, setClientStatus] = useState<ResourceStatus>('loading');
  const [clientRetryVersion, setClientRetryVersion] = useState(0);
  const [error, setError] = useState<ClientDetailsError | null>(null);

  const [products, setProducts] = useState<PharmacyClientPurchasedProduct[]>(
    []
  );

  const [productsTotal, setProductsTotal] = useState(0);

  const [
    productsAvailableFirstOrderDates,
    setProductsAvailableFirstOrderDates,
  ] = useState<readonly string[]>([]);

  const [productsTotalPages, setProductsTotalPages] = useState(0);
  const productsRowsPerPage = productsPagination.perPage;
  const productsPage = productsPagination.page;

  const productFilters = productsRoute.filters;

  const changeProductFilters = (nextFilters: ClientProductFilters) => {
    const nextPath = buildClientPurchasedProductsPath(clientId, nextFilters, {
      page: 1,
      perPage: productsRowsPerPage,
    });

    if (nextPath !== pathname) router.push(nextPath, { scroll: false });
  };

  const [productCategoryOptions, setProductCategoryOptions] = useState<
    readonly (SelectOption<ClientProductFilters['category']> & {
      icon?: string;
      categoryId?: string;
    })[]
  >([{ value: 'all', label: 'All categories' }]);

  const [productsStatus, setProductsStatus] = useState<ResourceStatus>('idle');
  const [productsError, setProductsError] = useState('');
  const [productsRetryVersion, setProductsRetryVersion] = useState(0);

  const [loadedProductsRequestKey, setLoadedProductsRequestKey] = useState<
    string | null
  >(null);

  const [isProductsFiltersOpen, setIsProductsFiltersOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProductCategoryOptions() {
      try {
        const categories = await getProductCategories({
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setProductCategoryOptions([
            { value: 'all', label: 'All categories' },

            ...categories.map((category) => ({
              value: category.slug,
              label: category.name,
              icon: category.icon,
              categoryId: category.id,
            })),
          ]);
        }
      } catch {
        // Keep the neutral fallback; the products resource reports its own state.
      }
    }

    void loadProductCategoryOptions();

    return () => controller.abort();
  }, []);

  const productsRequestKey = JSON.stringify({
    clientId,
    productId: productFilters.productId,
    page: productsPage,
    perPage: productsRowsPerPage,
    dateFrom: productFilters.date.from,
    dateTo: productFilters.date.to,
    category: productFilters.category,
    status: productFilters.status,
    retryVersion: productsRetryVersion,
  });

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
  }, [clientId, clientRetryVersion]);

  useEffect(() => {
    dispatchPharmacyBreadcrumbLabel(`Client #${clientId}`);
  }, [clientId]);

  const clientDisplayName = client ? getClientDisplayName(client) : null;

  useEffect(() => {
    if (!clientDisplayName) return;

    dispatchPharmacyBreadcrumbLabel(clientDisplayName);
  }, [clientDisplayName]);

  useEffect(() => {
    // Orders use the selected operational pharmacy. Owner-wide counters are
    // fetched independently, so the overview must not trigger this request.
    if (clientStatus !== 'success' || activeTab !== 'orders') return;

    const controller = new AbortController();

    async function loadOrders() {
      setOrdersStatus('loading');
      setOrdersError('');

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

        if (response.page !== ordersPage) {
          navigateTable('orders', response.page, ordersRowsPerPage, true);
        }

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

        setOrdersStatus('success');
      } catch (loadOrdersError) {
        if (controller.signal.aborted) return;

        setOrdersError(
          getSafeApiErrorMessage(
            loadOrdersError,
            'Could not load client orders. Please try again.'
          )
        );

        setOrdersStatus('error');
      }
    }

    void loadOrders();

    return () => {
      controller.abort();
    };
  }, [
    activeTab,
    clientId,
    clientStatus,
    debouncedOrderCommentSearch,
    debouncedOrderNumberSearch,
    orderFilters,
    orderSearchKey,
    ordersPage,
    ordersRetryVersion,
    ordersRowsPerPage,
    navigateTable,
  ]);

  useEffect(() => {
    if (clientStatus !== 'success') return;

    if (
      !shouldLoadClientProducts(
        activeTab,
        loadedProductsRequestKey,
        productsRequestKey
      )
    ) {
      return;
    }

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
            scope: 'owner',
            productId: productFilters.productId || undefined,
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
        setProductsAvailableFirstOrderDates(response.availableFirstOrderDates);
        setProductsTotalPages(response.totalPages);

        if (response.page !== productsPage) {
          navigateTable('products', response.page, productsRowsPerPage, true);
        }

        setLoadedProductsRequestKey(productsRequestKey);
        setProductsStatus('success');
      } catch (loadProductsError) {
        if (controller.signal.aborted) return;

        setProductsError(
          getSafeApiErrorMessage(
            loadProductsError,
            'Could not load purchased products. Please try again.'
          )
        );

        // Keep error distinct from an unresolved request after a filter change.
        setLoadedProductsRequestKey(productsRequestKey);
        setProductsStatus('error');
      }
    }

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [
    activeTab,
    clientId,
    clientStatus,
    loadedProductsRequestKey,
    productFilters,
    productsPage,
    productsRequestKey,
    productsRowsPerPage,
    navigateTable,
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

        return tab;
      }),
    [ordersOverallTotal]
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
    Boolean(productFilters.productId),
    Boolean(productFilters.date.from || productFilters.date.to),
    productFilters.category !== 'all',
    productFilters.status !== 'all'
  );

  const hasProductFilters = productFiltersCount > 0;

  return (
    <main className={css.page} aria-labelledby="client-details-page-title">
      <section className={css.contentCard}>
        <div className={css.headerStack}>
          <PageHeader
            title={clientDisplayName ?? 'Client details'}
            titleId="client-details-page-title"
            icon={<Users size={23} aria-hidden="true" />}
          />

          <div className={css.statisticsBlock}>
            {clientStatus === 'error' ? null : clientStatus === 'success' &&
              client ? (
              <ClientOrderStatistics clientId={clientId} />
            ) : (
              <StatsLoadingSkeleton
                className={css.orderStatistics}
                count={4}
                columns={4}
                tabletColumns={2}
                label="Loading client order statistics"
              />
            )}
          </div>
        </div>
      </section>

      <section className={css.contentCard}>
        <div className={css.tabsSection}>
          <Tabs
            items={tabs}
            activeValue={activeTab}
            ariaLabel="Client details tabs"
            mobileVisibleCount={1}
            tabletVisibleCount={5}
            onChange={(tab) => {
              setActiveTab(tab);
              const base = getPharmacyClientPath(clientId);
              router.push(tab === 'details' ? base : `${base}/${tab}`, {
                scroll: false,
              });
            }}
          />

          {activeTab === 'details' ? (
            <div className={css.sectionStack}>
              <ProfileSectionHeader
                title="Client information"
                description="Review the client profile and purchasing history."
                icon={<UserRound size={21} />}
              />
              {clientStatus === 'loading' || clientStatus === 'idle' ? (
                <ProfileResourceState
                  variant="loading"
                  title="Loading client details"
                  description="The client information is being loaded."
                />
              ) : clientStatus === 'error' || !client ? (
                <ProfileResourceState
                  variant="error"
                  title={error?.title ?? 'Client not found'}
                  description={
                    error?.message ?? 'The client could not be loaded.'
                  }
                  retryLabel="Try again"
                  sideActionOnDesktop
                  onRetry={() => setClientRetryVersion((n) => n + 1)}
                />
              ) : (
                <ClientInformationTab client={client} />
              )}
            </div>
          ) : null}

          {activeTab !== 'details' &&
          activeTab !== 'pharmacies' &&
          activeTab !== 'products' &&
          activeTab !== 'comments' &&
          clientStatus !== 'success' ? (
            <ProfileResourceState
              variant={clientStatus === 'error' ? 'error' : 'loading'}
              title={
                clientStatus === 'error'
                  ? (error?.title ?? 'Client unavailable')
                  : 'Loading client details'
              }
              description={
                clientStatus === 'error'
                  ? (error?.message ?? 'Please try again.')
                  : 'The client information is being loaded.'
              }
              {...(clientStatus === 'error'
                ? {
                    retryLabel: 'Try again',
                    onRetry: () => setClientRetryVersion((n) => n + 1),
                  }
                : {})}
            />
          ) : null}

          {activeTab === 'pharmacies' ? (
            <ClientPharmaciesTab
              clientId={clientId}
              initialState={initialPharmacyFilters}
            />
          ) : null}

          {clientStatus === 'success' && activeTab === 'orders' ? (
            <ClientOrdersTab
              orderNumberSearch={orderNumberSearch}
              setOrderNumberSearch={(value) => {
                setOrderNumberSearch(value);

                if (ordersPage !== 1)
                  navigateTable('orders', 1, ordersRowsPerPage, true);
              }}
              orderCommentSearch={orderCommentSearch}
              setOrderCommentSearch={(value) => {
                setOrderCommentSearch(value);

                if (ordersPage !== 1)
                  navigateTable('orders', 1, ordersRowsPerPage, true);
              }}
              orderFiltersCount={orderFiltersCount}
              isOrdersFiltersOpen={isOrdersFiltersOpen}
              setIsOrdersFiltersOpen={setIsOrdersFiltersOpen}
              ordersRowsPerPage={ordersRowsPerPage}
              onRowsPerPageChange={(perPage) =>
                navigateTable('orders', 1, perPage)
              }
              onPageChange={(page) =>
                navigateTable('orders', page, ordersRowsPerPage)
              }
              ordersStatus={ordersStatus}
              orders={orders}
              ordersTotal={ordersTotal}
              ordersError={ordersError}
              setOrdersRetryVersion={setOrdersRetryVersion}
              ordersPage={ordersPage}
              ordersTotalPages={ordersTotalPages}
            />
          ) : null}

          {activeTab === 'products' && clientStatus === 'error' ? (
            <div className={css.sectionStack}>
              <ProfileSectionHeader
                title="Purchased products"
                description="Products in this client's successful orders across your pharmacies."
                icon={<Boxes size={21} aria-hidden="true" />}
              />

              <ProfileResourceState
                variant="error"
                title={error?.title ?? 'Client unavailable'}
                description={error?.message ?? 'Please try again.'}
                retryLabel="Try again"
                onRetry={() => setClientRetryVersion((version) => version + 1)}
              />
            </div>
          ) : null}

          {activeTab === 'products' && clientStatus !== 'error' ? (
            <ClientProductsTab
              clientId={clientId}
              categoryOptions={productCategoryOptions}
              productId={productFilters.productId}
              onProductIdChange={(productId) =>
                changeProductFilters({ ...productFilters, productId })
              }
              productFiltersCount={productFiltersCount}
              isProductsFiltersOpen={isProductsFiltersOpen}
              setIsProductsFiltersOpen={setIsProductsFiltersOpen}
              productsRowsPerPage={productsRowsPerPage}
              onRowsPerPageChange={(perPage) =>
                navigateTable('products', 1, perPage)
              }
              onPageChange={(page) =>
                navigateTable('products', page, productsRowsPerPage)
              }
              productsStatus={
                loadedProductsRequestKey === productsRequestKey
                  ? productsStatus
                  : 'loading'
              }
              products={products}
              productsTotal={productsTotal}
              productsError={productsError}
              setProductsRetryVersion={setProductsRetryVersion}
              productsPage={productsPage}
              productsTotalPages={productsTotalPages}
            />
          ) : null}

          {activeTab === 'comments' ? (
            <EntityComments
              entityKey={`client:${clientId}`}
              presentation="profile"
              title="Comments"
              description="Private working notes about this client, visible to authorized pharmacy staff."
              emptyTitle="No internal comments yet"
              emptyText="Internal client comments will appear here."
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

            if (ordersPage !== 1)
              navigateTable('orders', 1, ordersRowsPerPage, true);
          }}
          onClose={() => setIsOrdersFiltersOpen(false)}
          onReset={() => {
            setOrderFilters(DEFAULT_ORDER_FILTERS);

            if (ordersPage !== 1)
              navigateTable('orders', 1, ordersRowsPerPage, true);
          }}
        />
      ) : null}

      {isProductsFiltersOpen ? (
        <ClientProductsFiltersDrawer
          filters={productFilters}
          hasActiveFilters={hasProductFilters}
          availableDates={productsAvailableFirstOrderDates}
          categoryOptions={productCategoryOptions}
          onChange={(filters) => {
            changeProductFilters(filters);
          }}
          onClose={() => setIsProductsFiltersOpen(false)}
          onReset={() => {
            changeProductFilters(DEFAULT_PRODUCT_FILTERS);
          }}
        />
      ) : null}
    </main>
  );
}

//===================================================================

function ClientDetailsPageContent(props: ClientDetailsPageContentProps) {
  return (
    <ClientDetailsPageContentState
      key={`${props.clientId}:${props.initialTab ?? 'details'}`}
      {...props}
    />
  );
}

//===================================================================

export default ClientDetailsPageContent;
export { ClientDetailsPageContent };
