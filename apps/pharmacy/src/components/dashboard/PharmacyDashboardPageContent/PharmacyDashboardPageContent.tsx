'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

import { LoadingSpinner } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatusBanner } from '@e-pharmacy/ui/statistics';
import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';
import type { JsonResponseRequestOptions } from '@e-pharmacy/api-client/transport';
import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import type {
  AllProductStatisticsKey,
  OwnProductStatisticsCounts,
  OwnProductStatisticsKey,
} from '@e-pharmacy/types/products';

import type {
  OrderSalesStatistics,
  OrderStatisticsCounts,
} from '@e-pharmacy/types/orders';

import {
  type ClientStatisticsCounts,
  type ClientStatisticsKey,
} from '@/lib/statistics/config';

import {
  DEFAULT_PRODUCT_REQUESTS_FILTERS,
  DEFAULT_PRODUCT_REQUEST_STATISTICS,
  type ProductRequestStatisticsCounts,
} from '@/lib/product-requests/product-requests';

import { PHARMACY_ROUTES } from '@/lib/routes';

import {
  getPharmacyOrderSalesStatistics,
  getPharmacyOrders,
  getPharmacyProducts,
} from '@/lib/api/browser';

import { getPharmacyClientStatistics } from '@/lib/clients/client-statistics';
import { getPharmacyProductRequestStatistics } from '@/lib/product-requests/product-request-statistics';
import { buildAllProductsPath } from '@/lib/products/all-product-paths';
import { buildOwnProductsPath } from '@/lib/products/own-product-paths';
import { DEFAULT_OWN_PRODUCTS_FILTERS } from '@/lib/products/own-products-filters';
import { buildOrdersPath } from '@/lib/orders/order-paths';
import { DEFAULT_ORDERS_FILTERS } from '@/lib/orders/orders-filters';

import {
  buildClientsPath,
  DEFAULT_CLIENTS_FILTERS,
} from '@/lib/clients/client-paths';

import { buildProductRequestsPath } from '@/lib/product-requests/product-request-paths';

import {
  getPharmacyAllProductStatistics,
  getPharmacyOwnProductStatistics,
} from '@/lib/products/product-statistics';

import { DEFAULT_OWN_PRODUCT_STATISTICS } from '@/lib/statistics/defaults';
import { DEFAULT_ALL_PRODUCT_STATISTICS } from '@/lib/statistics/defaults';
import { DEFAULT_ORDER_SALES_STATISTICS } from '@/lib/statistics/defaults';
import { DEFAULT_ORDER_STATISTICS } from '@/lib/statistics/defaults';
import { DEFAULT_CLIENT_STATISTICS } from '@/lib/statistics/defaults';

import {
  AllProductStatistics,
  ClientStatistics,
  OrderStatistics,
  OwnProductStatistics,
  ProductRequestStatistics,
} from '@/components/statistics';

import {
  SalesPeriodFilters,
  SalesValueChart,
  getSalesPeriodDateRange,
  type SalesPeriodMonth,
} from '@/components/sales';

import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';

import css from './PharmacyDashboardPageContent.module.css';

//===================================================================

type DashboardData = Readonly<{
  pharmacyStatus: PharmacyStatus | null;
  overview: {
    orders: number;
    revenue: number;
    products: number;
    clients: number;
  };

  orders: OrderStatisticsCounts;

  clients: ClientStatisticsCounts;

  products: OwnProductStatisticsCounts;
  allProducts: typeof DEFAULT_ALL_PRODUCT_STATISTICS;
  requests: ProductRequestStatisticsCounts;
}>;

type DashboardSnapshot = Readonly<{
  requestKey: string | null;
  data: DashboardData;
  isLoading: boolean;
  hasError: boolean;
}>;

//===================================================================

const CURRENT_YEAR = new Date().getFullYear();

//===================================================================

const DEFAULT_DATA: DashboardData = {
  pharmacyStatus: null,
  overview: {
    orders: 0,
    revenue: 0,
    products: 0,
    clients: 0,
  },
  orders: DEFAULT_ORDER_STATISTICS,

  clients: DEFAULT_CLIENT_STATISTICS,

  products: DEFAULT_OWN_PRODUCT_STATISTICS,
  allProducts: DEFAULT_ALL_PRODUCT_STATISTICS,

  requests: DEFAULT_PRODUCT_REQUEST_STATISTICS,
};

//===================================================================

function getPharmacyBanner(status: PharmacyStatus | null) {
  if (!status) return null;
  if (status === 'on_moderation') {
    return {
      status: 'on_moderation' as const,
      label: 'On moderation',
      title: 'Your changes are under moderation',
      message:
        'Until Admin reviews them, Client pages show the previous approved data.',
    };
  }

  if (status === 'active') {
    return null;
  }

  if (status === 'on_verification') {
    return {
      status: 'on_verification' as const,
      label: 'On verification',
      title: 'Your pharmacy is waiting for Admin review',
      message:
        'After Admin review, you will be able to sell products, add products, and create product requests.',
    };
  }

  return {
    status: 'new' as const,
    label: 'New',
    title: 'Your pharmacy is not activated yet',
    message:
      'After Admin review, you will be able to sell products, add products, and create product requests.',
  };
}

//===================================================================

async function loadDashboardData(
  pharmacyId: string,
  pharmacyStatus: PharmacyStatus,
  selectedYear: string,
  selectedMonth: SalesPeriodMonth,
  options?: JsonResponseRequestOptions
): Promise<DashboardData> {
  const { dateFrom, dateTo } = getSalesPeriodDateRange(
    selectedYear,
    selectedMonth
  );
  const dateRange = { dateFrom, dateTo };

  const [
    ordersResponse,
    clientStatistics,
    allProducts,
    requestStatistics,
    productStatistics,
    allProductStatistics,
  ] = await Promise.all([
    getPharmacyOrders({ page: 1, perPage: 1, ...dateRange }, options),
    getPharmacyClientStatistics(options),
    getPharmacyProducts({ page: 1, perPage: 100, pharmacyId }, options),
    getPharmacyProductRequestStatistics(options),
    getPharmacyOwnProductStatistics(pharmacyId, options),
    getPharmacyAllProductStatistics(pharmacyId, options),
  ]);

  return {
    pharmacyStatus,
    overview: {
      orders: ordersResponse.total,
      revenue: ordersResponse.statistics.successful.amount,
      products: allProducts.total,
      clients: clientStatistics.total,
    },

    orders: ordersResponse.statistics,

    clients: clientStatistics,

    products: productStatistics,
    allProducts: allProductStatistics,

    requests: requestStatistics,
  };
}

//===================================================================

function EmptyState({
  title,
  message,
  action,
}: Readonly<{
  title: string;
  message: string;
  action?: ReactNode;
}>) {
  return (
    <div className={css.emptyState}>
      <p className={css.emptyTitle}>{title}</p>
      <p className={css.emptyText}>{message}</p>
      {action ? <div className={css.emptyAction}>{action}</div> : null}
    </div>
  );
}

//===================================================================

function PharmacyDashboardPageContent() {
  const { profile: pharmacyProfile, isLoading: isProfileLoading } =
    usePharmacyProfile();
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [selectedMonth, setSelectedMonth] = useState<SalesPeriodMonth>('all');
  const [selectedSalesYear, setSelectedSalesYear] = useState(
    String(CURRENT_YEAR)
  );
  const [selectedSalesMonth, setSelectedSalesMonth] =
    useState<SalesPeriodMonth>('all');
  const [salesData, setSalesData] = useState<OrderSalesStatistics>(
    DEFAULT_ORDER_SALES_STATISTICS
  );
  const [isSalesLoading, setIsSalesLoading] = useState(true);
  const [isSalesUnavailable, setIsSalesUnavailable] = useState(false);
  const [dashboardSnapshot, setDashboardSnapshot] = useState<DashboardSnapshot>(
    {
      requestKey: null,
      data: DEFAULT_DATA,
      isLoading: false,
      hasError: false,
    }
  );

  const pharmacyId = pharmacyProfile?.id ?? null;
  const pharmacyStatus = pharmacyProfile?.status ?? null;
  const dashboardRequestKey =
    pharmacyId && pharmacyStatus
      ? `${pharmacyId}:${pharmacyStatus}:${selectedYear}:${selectedMonth}`
      : null;

  const hasCurrentDashboard =
    dashboardRequestKey !== null &&
    dashboardSnapshot.requestKey === dashboardRequestKey;

  const dashboardData = hasCurrentDashboard
    ? dashboardSnapshot.data
    : DEFAULT_DATA;

  const isLoading =
    isProfileLoading ||
    (dashboardRequestKey !== null &&
      (!hasCurrentDashboard || dashboardSnapshot.isLoading));

  const hasDashboardError = hasCurrentDashboard && dashboardSnapshot.hasError;

  useEffect(() => {
    if (
      isProfileLoading ||
      !pharmacyId ||
      !pharmacyStatus ||
      !dashboardRequestKey
    ) {
      return;
    }

    const controller = new AbortController();
    const currentPharmacyId = pharmacyId;
    const currentPharmacyStatus = pharmacyStatus;
    const currentRequestKey = dashboardRequestKey;

    async function loadDashboard() {
      try {
        const nextData = await loadDashboardData(
          currentPharmacyId,
          currentPharmacyStatus,
          selectedYear,
          selectedMonth,
          { signal: controller.signal }
        );

        if (!controller.signal.aborted) {
          setDashboardSnapshot({
            requestKey: currentRequestKey,
            data: nextData,
            isLoading: false,
            hasError: false,
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          setDashboardSnapshot({
            requestKey: currentRequestKey,
            data: DEFAULT_DATA,
            isLoading: false,
            hasError: true,
          });
        }
      }
    }

    void loadDashboard();

    return () => {
      controller.abort();
    };
  }, [
    dashboardRequestKey,
    isProfileLoading,
    pharmacyId,
    pharmacyStatus,
    selectedMonth,
    selectedYear,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSalesStatistics() {
      setIsSalesLoading(true);

      try {
        const period = getSalesPeriodDateRange(
          selectedSalesYear,
          selectedSalesMonth
        );
        const nextSalesData = await getPharmacyOrderSalesStatistics(period, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setSalesData(nextSalesData);
          setIsSalesUnavailable(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setIsSalesUnavailable(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsSalesLoading(false);
      }
    }

    void loadSalesStatistics();

    return () => {
      controller.abort();
    };
  }, [selectedSalesMonth, selectedSalesYear]);

  const banner = getPharmacyBanner(dashboardData.pharmacyStatus);

  const getClientStatisticHref = (key: ClientStatisticsKey) => {
    if (key === 'active') {
      return buildClientsPath({ ...DEFAULT_CLIENTS_FILTERS, status: 'active' });
    }

    if (key === 'blocked') {
      return buildClientsPath({
        ...DEFAULT_CLIENTS_FILTERS,
        status: 'blocked',
      });
    }

    if (key === 'repeat') {
      return buildClientsPath({
        ...DEFAULT_CLIENTS_FILTERS,
        successfulOrders: 'repeat',
      });
    }

    return PHARMACY_ROUTES.CLIENTS;
  };

  const getProductStatisticHref = (key: OwnProductStatisticsKey) => {
    if (key === 'reserved') {
      return buildOwnProductsPath({
        ...DEFAULT_OWN_PRODUCTS_FILTERS,
        stock: 'reserved',
      });
    }

    if (key === 'available') {
      return buildOwnProductsPath({
        ...DEFAULT_OWN_PRODUCTS_FILTERS,
        stock: 'available',
      });
    }

    if (key === 'outOfStock') {
      return buildOwnProductsPath({
        ...DEFAULT_OWN_PRODUCTS_FILTERS,
        stock: 'empty',
      });
    }

    if (key === 'inStock') {
      return buildOwnProductsPath({
        ...DEFAULT_OWN_PRODUCTS_FILTERS,
        stock: 'in-stock',
      });
    }

    return PHARMACY_ROUTES.PRODUCTS;
  };

  const getAllProductStatisticHref = (key: AllProductStatisticsKey) => {
    if (key === 'active') {
      return buildAllProductsPath({
        createdDate: { from: '', to: '' },
        name: '',
        article: '',
        category: 'all',
        status: 'active',
        addedToMyPharmacy: 'all',
      });
    }

    if (key === 'blocked') {
      return buildAllProductsPath({
        createdDate: { from: '', to: '' },
        name: '',
        article: '',
        category: 'all',
        status: 'blocked',
        addedToMyPharmacy: 'all',
      });
    }

    if (key === 'addedToPharmacy') {
      return buildAllProductsPath({
        createdDate: { from: '', to: '' },
        name: '',
        article: '',
        category: 'all',
        status: 'all',
        addedToMyPharmacy: 'yes',
      });
    }

    if (key === 'notAddedToPharmacy') {
      return buildAllProductsPath({
        createdDate: { from: '', to: '' },
        name: '',
        article: '',
        category: 'all',
        status: 'all',
        addedToMyPharmacy: 'no',
      });
    }

    return PHARMACY_ROUTES.ALL_PRODUCTS;
  };

  return (
    <main className={css.page} aria-labelledby="dashboard-page-title">
      <div className={css.stack}>
        <section className={css.section} aria-labelledby="orders-stats-title">
          <PageHeader
            title="Dashboard"
            titleId="dashboard-page-title"
            icon={<LayoutDashboard size={23} aria-hidden="true" />}
          />

          {!isLoading && banner ? (
            <StatusBanner
              {...PHARMACY_STATUS_PRESENTATION[banner.status]}
              title={banner.title}
              message={banner.message}
            />
          ) : null}
        </section>

        {isLoading ? (
          <section className={css.section} aria-labelledby="orders-stats-title">
            <LoadingSpinner label="Loading dashboard statistics..." />
          </section>
        ) : hasDashboardError ? (
          <section
            className={css.section}
            aria-label="Dashboard statistics unavailable"
          >
            <EmptyState
              title="Dashboard statistics are temporarily unavailable."
              message="The data could not be loaded. Please try again later."
            />
          </section>
        ) : (
          <>
            <section
              className={css.section}
              aria-labelledby="orders-stats-title"
            >
              <div className={css.sectionTopline}>
                <div className={css.sectionHeader}>
                  <p className={css.sectionKicker}>Orders</p>
                  <h2 className={css.sectionTitle} id="orders-stats-title">
                    Orders statistics
                  </h2>
                  <p className={css.sectionDescription}>
                    Counts and amounts are calculated from real order data for
                    the selected period.
                  </p>
                </div>

                <LinkButton
                  className={css.sectionButton}
                  href={PHARMACY_ROUTES.ORDERS}
                  variant="secondary"
                  renderLink={({ href, className, children, ...props }) => (
                    <Link href={href} className={className} {...props}>
                      {children}
                    </Link>
                  )}
                >
                  View orders
                </LinkButton>
              </div>

              <SalesPeriodFilters
                idPrefix="dashboard-order"
                year={selectedYear}
                month={selectedMonth}
                onYearChange={setSelectedYear}
                onMonthChange={setSelectedMonth}
                className={css.filters}
              />

              <OrderStatistics
                counts={dashboardData.orders}
                getStatusHref={(status) =>
                  buildOrdersPath({ ...DEFAULT_ORDERS_FILTERS, status })
                }
              />
            </section>

            <section
              className={css.section}
              aria-label="Sales value statistics"
            >
              {isSalesLoading ? (
                <LoadingSpinner label="Loading sales chart..." />
              ) : isSalesUnavailable ? (
                <EmptyState
                  title="Sales statistics are temporarily unavailable."
                  message="The sales chart could not be loaded. Please try again later."
                />
              ) : (
                <SalesValueChart
                  key={`${selectedSalesYear}-${selectedSalesMonth}`}
                  data={salesData}
                  headerContent={
                    <SalesPeriodFilters
                      idPrefix="dashboard-sales"
                      year={selectedSalesYear}
                      month={selectedSalesMonth}
                      onYearChange={setSelectedSalesYear}
                      onMonthChange={setSelectedSalesMonth}
                      showAppliedPeriod
                    />
                  }
                />
              )}
            </section>

            <section
              className={css.section}
              aria-labelledby="clients-stats-title"
            >
              <div className={css.sectionTopline}>
                <div className={css.sectionHeader}>
                  <p className={css.sectionKicker}>Clients</p>
                  <h2 className={css.sectionTitle} id="clients-stats-title">
                    Clients statistics
                  </h2>
                  <p className={css.sectionDescription}>
                    Only clients who created orders in this pharmacy are
                    included.
                  </p>
                </div>

                <LinkButton
                  className={css.sectionButton}
                  href={PHARMACY_ROUTES.CLIENTS}
                  variant="secondary"
                  renderLink={({ href, className, children, ...props }) => (
                    <Link href={href} className={className} {...props}>
                      {children}
                    </Link>
                  )}
                >
                  View clients
                </LinkButton>
              </div>

              <ClientStatistics
                counts={dashboardData.clients}
                getStatisticHref={getClientStatisticHref}
              />

              {dashboardData.clients.total === 0 ? (
                <EmptyState
                  title="Your pharmacy has no clients yet."
                  message="Clients will appear after the first orders in your pharmacy."
                />
              ) : null}
            </section>

            <section
              className={css.section}
              aria-labelledby="own-products-stats-title"
            >
              <div className={css.sectionTopline}>
                <div className={css.sectionHeader}>
                  <p className={css.sectionKicker}>Own products</p>
                  <h2
                    className={css.sectionTitle}
                    id="own-products-stats-title"
                  >
                    Own product statistics
                  </h2>
                  <p className={css.sectionDescription}>
                    Analytics includes only products added to the current
                    pharmacy.
                  </p>
                </div>

                <LinkButton
                  className={css.sectionButton}
                  href={PHARMACY_ROUTES.PRODUCTS}
                  variant="secondary"
                  renderLink={({ href, className, children, ...props }) => (
                    <Link href={href} className={className} {...props}>
                      {children}
                    </Link>
                  )}
                >
                  View own products
                </LinkButton>
              </div>

              <OwnProductStatistics
                counts={dashboardData.products}
                getStatisticHref={getProductStatisticHref}
              />

              {Object.values(dashboardData.products).every(
                (value) => value.quantity === 0
              ) ? (
                <EmptyState
                  title="Your pharmacy has no added products yet."
                  message={
                    dashboardData.pharmacyStatus === 'active' ||
                    dashboardData.pharmacyStatus === 'on_moderation'
                      ? 'Browse active Admin products and add them to your pharmacy.'
                      : 'Browse active Admin products and add them after verification.'
                  }
                />
              ) : null}
            </section>

            <section
              className={css.section}
              aria-labelledby="all-products-stats-title"
            >
              <div className={css.sectionTopline}>
                <div className={css.sectionHeader}>
                  <p className={css.sectionKicker}>All products</p>
                  <h2
                    className={css.sectionTitle}
                    id="all-products-stats-title"
                  >
                    All product statistics
                  </h2>
                  <p className={css.sectionDescription}>
                    Global catalog analytics shows Admin products and whether
                    they are added to the current pharmacy.
                  </p>
                </div>

                <LinkButton
                  className={css.sectionButton}
                  href={PHARMACY_ROUTES.ALL_PRODUCTS}
                  variant="secondary"
                  renderLink={({ href, className, children, ...props }) => (
                    <Link href={href} className={className} {...props}>
                      {children}
                    </Link>
                  )}
                >
                  View all products
                </LinkButton>
              </div>

              <AllProductStatistics
                counts={dashboardData.allProducts}
                getStatisticHref={getAllProductStatisticHref}
              />
            </section>

            <section
              className={css.section}
              aria-labelledby="requests-stats-title"
            >
              <div className={css.sectionTopline}>
                <div className={css.sectionHeader}>
                  <p className={css.sectionKicker}>Product requests</p>
                  <h2 className={css.sectionTitle} id="requests-stats-title">
                    Product request statistics
                  </h2>
                  <p className={css.sectionDescription}>
                    Requests created only by the current pharmacy are shown
                    here.
                  </p>
                </div>
                <LinkButton
                  className={css.sectionButton}
                  href={PHARMACY_ROUTES.PRODUCT_REQUESTS}
                  variant="secondary"
                  renderLink={({ href, className, children, ...props }) => (
                    <Link href={href} className={className} {...props}>
                      {children}
                    </Link>
                  )}
                >
                  View requests
                </LinkButton>
              </div>

              <ProductRequestStatistics
                counts={dashboardData.requests}
                getStatusHref={(status) =>
                  buildProductRequestsPath({
                    ...DEFAULT_PRODUCT_REQUESTS_FILTERS,
                    status,
                  })
                }
              />

              {Object.values(dashboardData.requests).every(
                (value) => value === 0
              ) ? (
                <EmptyState
                  title="Your pharmacy has no product creation requests yet."
                  message="Create a product request when you need to add a product that is absent from the global catalog."
                />
              ) : null}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default PharmacyDashboardPageContent;
export { PharmacyDashboardPageContent };
