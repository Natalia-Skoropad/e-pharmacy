'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

import { ButtonLink, LoadingSpinner, SelectField } from '@e-pharmacy/ui/common';

import {
  AllProductStatistics,
  ClientStatistics,
  OrderStatistics,
  OwnProductStatistics,
  SalesValueChart,
  ProductRequestStatistics,
  StatusBanner,
} from '@e-pharmacy/ui/statistics';

import { PageHeader } from '@e-pharmacy/ui/layout';
import type { PharmacyStatus } from '@e-pharmacy/types';

import {
  DEFAULT_ALL_PRODUCT_STATISTICS,
  DEFAULT_OWN_PRODUCT_STATISTICS,
  type AllProductStatisticsKey,
  type OwnProductStatisticsCounts,
  type OwnProductStatisticsKey,
} from '@e-pharmacy/types/products';

import {
  DEFAULT_ORDER_SALES_STATISTICS,
  DEFAULT_ORDER_STATISTICS,
  type OrderSalesStatistics,
  type OrderStatisticsCounts,
} from '@e-pharmacy/types/orders';

import {
  DEFAULT_CLIENT_STATISTICS,
  type ClientStatisticsCounts,
  type ClientStatisticsKey,
} from '@e-pharmacy/types/clients';

import {
  DEFAULT_PRODUCT_REQUEST_STATISTICS,
  type ProductRequestStatisticsCounts,
} from '@e-pharmacy/types/product-requests';

import {
  getMyPharmacyProfile,
  getPharmacyOrderSalesStatistics,
  getPharmacyOrders,
  getPharmacyProducts,
} from '@/lib/api/browser';

import { getPharmacyClientStatistics } from '@/lib/clients/client-statistics';
import { getPharmacyProductRequestStatistics } from '@/lib/product-requests/product-request-statistics';
import { buildAllProductsPath } from '@/lib/products/all-product-paths';

import {
  getPharmacyAllProductStatistics,
  getPharmacyOwnProductStatistics,
} from '@/lib/products/product-statistics';

import {
  getPharmacyAllProductsPath,
  getPharmacyClientsFilterPath,
  getPharmacyClientsPath,
  getPharmacyOrdersFilterPath,
  getPharmacyOrdersPath,
  getPharmacyProductsFilterPath,
  getPharmacyProductsPath,
  getPharmacyProductRequestsPath,
  getPharmacyRequestsFilterPath,
} from '@/lib/layout/routes';

import css from './PharmacyDashboardPageContent.module.css';

//===================================================================

type MonthFilterValue =
  | 'all'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12';

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
  sales: OrderSalesStatistics;

  clients: ClientStatisticsCounts;

  products: OwnProductStatisticsCounts;
  allProducts: typeof DEFAULT_ALL_PRODUCT_STATISTICS;
  requests: ProductRequestStatisticsCounts;
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
  sales: DEFAULT_ORDER_SALES_STATISTICS,

  clients: DEFAULT_CLIENT_STATISTICS,

  products: DEFAULT_OWN_PRODUCT_STATISTICS,
  allProducts: DEFAULT_ALL_PRODUCT_STATISTICS,

  requests: DEFAULT_PRODUCT_REQUEST_STATISTICS,
};

//===================================================================

const YEAR_OPTIONS = [
  { value: String(CURRENT_YEAR), label: String(CURRENT_YEAR) },
  { value: String(CURRENT_YEAR - 1), label: String(CURRENT_YEAR - 1) },
  { value: String(CURRENT_YEAR - 2), label: String(CURRENT_YEAR - 2) },
];

//===================================================================

const MONTH_OPTIONS: Array<{ value: MonthFilterValue; label: string }> = [
  { value: 'all', label: 'All months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

//===================================================================

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

//===================================================================

function getDateRange(year: string, month: MonthFilterValue) {
  const parsedYear = Number(year) || CURRENT_YEAR;

  if (month === 'all') {
    return {
      dateFrom: `${parsedYear}-01-01`,
      dateTo: `${parsedYear}-12-31`,
    };
  }

  const parsedMonth = Number(month);
  const lastDay = new Date(parsedYear, parsedMonth, 0).getDate();
  const monthPart = padDatePart(parsedMonth);

  return {
    dateFrom: `${parsedYear}-${monthPart}-01`,
    dateTo: `${parsedYear}-${monthPart}-${padDatePart(lastDay)}`,
  };
}

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
  selectedYear: string,
  selectedMonth: MonthFilterValue
): Promise<DashboardData> {
  const dateRange = getDateRange(selectedYear, selectedMonth);
  const salesGroupBy = selectedMonth === 'all' ? 'month' : 'day';
  const profileResponse = await getMyPharmacyProfile();
  const pharmacyId = profileResponse.pharmacy.id;

  const [
    ordersResponse,
    clientStatistics,
    allProducts,
    requestStatistics,
    productStatistics,
    allProductStatistics,
    salesStatistics,
  ] = await Promise.all([
    getPharmacyOrders({ page: 1, perPage: 1, ...dateRange }),
    getPharmacyClientStatistics(),
    getPharmacyProducts({ page: 1, perPage: 100, pharmacyId }),
    getPharmacyProductRequestStatistics(),
    getPharmacyOwnProductStatistics(pharmacyId),
    getPharmacyAllProductStatistics(pharmacyId),
    getPharmacyOrderSalesStatistics({ ...dateRange, groupBy: salesGroupBy }),
  ]);

  return {
    pharmacyStatus: profileResponse.pharmacy.status,
    overview: {
      orders: ordersResponse.total,
      revenue: ordersResponse.statistics.successful.amount,
      products: allProducts.total,
      clients: clientStatistics.total,
    },

    orders: ordersResponse.statistics,
    sales: salesStatistics,

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
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [selectedMonth, setSelectedMonth] = useState<MonthFilterValue>('all');
  const [dashboardData, setDashboardData] =
    useState<DashboardData>(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const nextData = await loadDashboardData(selectedYear, selectedMonth);
        if (!isMounted) return;

        setDashboardData(nextData);
      } catch {
        if (!isMounted) return;

        setDashboardData(DEFAULT_DATA);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [selectedMonth, selectedYear]);

  const banner = getPharmacyBanner(dashboardData.pharmacyStatus);

  const getClientStatisticHref = (key: ClientStatisticsKey) => {
    if (key === 'active') {
      return getPharmacyClientsFilterPath({ status: 'active' });
    }

    if (key === 'blocked') {
      return getPharmacyClientsFilterPath({ status: 'blocked' });
    }

    if (key === 'repeat') {
      return getPharmacyClientsFilterPath({ 'successful-orders': 'repeat' });
    }

    return getPharmacyClientsPath();
  };

  const getProductStatisticHref = (key: OwnProductStatisticsKey) => {
    if (key === 'reserved') {
      return getPharmacyProductsFilterPath({ stock: 'reserved' });
    }

    if (key === 'available') {
      return getPharmacyProductsFilterPath({ stock: 'available' });
    }

    if (key === 'outOfStock') {
      return getPharmacyProductsFilterPath({ stock: 'empty' });
    }

    if (key === 'inStock') {
      return getPharmacyProductsFilterPath({ stock: 'in-stock' });
    }

    return getPharmacyProductsPath();
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

    return getPharmacyAllProductsPath();
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
              status={banner.status}
              title={banner.title}
              label={banner.label}
              message={banner.message}
            />
          ) : null}
        </section>

        {isLoading ? (
          <section className={css.section} aria-labelledby="orders-stats-title">
            <LoadingSpinner label="Loading dashboard statistics..." />
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

                <ButtonLink
                  className={css.sectionButton}
                  href={getPharmacyOrdersPath()}
                  variant="secondary"
                  renderLink={({ href, className, children, ...props }) => (
                    <Link href={href} className={className} {...props}>
                      {children}
                    </Link>
                  )}
                >
                  View orders
                </ButtonLink>
              </div>

              <div className={css.filters} aria-label="Order statistics filters">
                <SelectField
                  id="dashboard-order-year"
                  label="Year"
                  value={selectedYear}
                  options={YEAR_OPTIONS}
                  onChange={setSelectedYear}
                />
                <SelectField
                  id="dashboard-order-month"
                  label="Month"
                  value={selectedMonth}
                  options={MONTH_OPTIONS}
                  onChange={setSelectedMonth}
                />
              </div>

              <OrderStatistics
                counts={dashboardData.orders}
                getStatusHref={(status) =>
                  getPharmacyOrdersFilterPath({ status })
                }
              />
            </section>

            <section
              className={css.section}
              aria-labelledby="orders-stats-title"
            >
              <SalesValueChart data={dashboardData.sales} />
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

                <ButtonLink
                  className={css.sectionButton}
                  href={getPharmacyClientsPath()}
                  variant="secondary"
                  renderLink={({ href, className, children, ...props }) => (
                    <Link href={href} className={className} {...props}>
                      {children}
                    </Link>
                  )}
                >
                  View clients
                </ButtonLink>
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

                <ButtonLink
                  className={css.sectionButton}
                  href={getPharmacyProductsPath()}
                  variant="secondary"
                  renderLink={({ href, className, children, ...props }) => (
                    <Link href={href} className={className} {...props}>
                      {children}
                    </Link>
                  )}
                >
                  View own products
                </ButtonLink>
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

                <ButtonLink
                  className={css.sectionButton}
                  href={getPharmacyAllProductsPath()}
                  variant="secondary"
                  renderLink={({ href, className, children, ...props }) => (
                    <Link href={href} className={className} {...props}>
                      {children}
                    </Link>
                  )}
                >
                  View all products
                </ButtonLink>
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
                <ButtonLink
                  className={css.sectionButton}
                  href={getPharmacyProductRequestsPath()}
                  variant="secondary"
                  renderLink={({ href, className, children, ...props }) => (
                    <Link href={href} className={className} {...props}>
                      {children}
                    </Link>
                  )}
                >
                  View requests
                </ButtonLink>
              </div>

              <ProductRequestStatistics
                counts={dashboardData.requests}
                getStatusHref={(status) =>
                  getPharmacyRequestsFilterPath({ status })
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
