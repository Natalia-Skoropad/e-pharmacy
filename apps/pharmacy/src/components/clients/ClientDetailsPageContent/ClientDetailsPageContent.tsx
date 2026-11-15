'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  Building2,
  MessageSquareText,
  Boxes,
  ShoppingBag,
  UserRound,
  Users,
} from 'lucide-react';

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

import { type OwnedPharmacyListUrlState } from '@/lib/pharmacies/owned-pharmacy-url';

import {
  createPharmacyNote,
  deletePharmacyNote,
  getPharmacyNotes,
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

import { getClientDisplayName } from '@/lib/clients/client-display-name';
import { dispatchPharmacyBreadcrumbLabel } from '@/lib/layout/breadcrumbs';
import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';

import { EntityComments } from '@/components/comments/EntityComments';
import { ClientPharmaciesTab } from '@/components/clients/ClientPharmaciesTab/ClientPharmaciesTab';
import { OrdersPageContent } from '@/components/orders/OrdersPageContent/OrdersPageContent';

import {
  shouldLoadClientProducts,
  type ClientDetailTab,
} from '@/components/clients/client-detail-resource-policy';

import {
  ClientProductsFiltersDrawer,
  DEFAULT_PRODUCT_FILTERS,
  type ClientProductFilters,
} from './ClientDetailFilters';

import { ClientInformationTab } from './ClientInformationTab';
import { ClientOrderStatistics } from './ClientOrderStatistics';
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
  { value: 'orders', label: 'Orders', icon: <ShoppingBag size={17} /> },
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

  const productsRoute = parseClientPurchasedProductsPath(pathname, clientId);
  const productsPagination = productsRoute.pagination;

  const navigateProductsTable = useCallback(
    (page: number, perPage: RowsPerPageValue, replace = false) => {
      const nextPath = buildClientPurchasedProductsPath(
        clientId,
        parseClientPurchasedProductsPath(pathname, clientId).filters,
        { page, perPage }
      );

      if (nextPath === pathname) return;
      if (replace) router.replace(nextPath, { scroll: false });
      else router.push(nextPath, { scroll: false });
    },
    [clientId, pathname, router]
  );

  const [client, setClient] = useState<PharmacyClientRow | null>(null);
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
          navigateProductsTable(response.page, productsRowsPerPage, true);
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
    navigateProductsTable,
  ]);

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
            items={CLIENT_TABS}
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

          {activeTab === 'pharmacies' ? (
            <ClientPharmaciesTab
              clientId={clientId}
              initialState={initialPharmacyFilters}
            />
          ) : null}

          {activeTab === 'orders' && clientStatus !== 'error' ? (
            <OrdersPageContent embeddedClientId={clientId} />
          ) : null}
          {activeTab === 'orders' && clientStatus === 'error' ? (
            <ProfileResourceState
              variant="error"
              title={error?.title ?? 'Client unavailable'}
              description={error?.message ?? 'Could not load client orders.'}
              retryLabel="Try again"
              onRetry={() => setClientRetryVersion((n) => n + 1)}
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
                navigateProductsTable(1, perPage)
              }
              onPageChange={(page) =>
                navigateProductsTable(page, productsRowsPerPage)
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
