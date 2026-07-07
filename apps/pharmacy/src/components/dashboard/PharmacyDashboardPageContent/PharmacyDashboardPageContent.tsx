'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';

import {
  Ban,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

import {
  AllProductStatistics,
  ButtonLink,
  LoadingSpinner,
  OrderStatistics,
  OwnProductStatistics,
  ProductRequestStatistics,
  SelectField,
  StatusBanner,
} from '@e-pharmacy/ui/common';

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
  DEFAULT_ORDER_STATISTICS,
  type OrderStatisticsCounts,
} from '@e-pharmacy/types/orders';

import {
  DEFAULT_PRODUCT_REQUEST_STATISTICS,
  type ProductRequestStatisticsCounts,
} from '@e-pharmacy/types/product-requests';

import { formatPrice } from '@e-pharmacy/utils/formatters';

import {
  getMyPharmacyProfile,
  getPharmacyClients,
  getPharmacyOrders,
  getPharmacyProducts,
} from '@/lib/api/browser';

import type { ClientStatus, PharmacyClientRow } from '@/lib/clients/clients';
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
  getPharmacyNewRequestPath,
  getPharmacyOrdersFilterPath,
  getPharmacyProductsFilterPath,
  getPharmacyProductsPath,
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

type DashboardTone = 'blue' | 'yellow' | 'green' | 'red' | 'gray' | 'accent';

//===================================================================

type StatusCardConfig = Readonly<{
  title: string;
  value: number;
  amount?: number;
  tone: DashboardTone;
  icon: LucideIcon;
  href?: string;
}>;

//===================================================================

type DashboardData = Readonly<{
  pharmacyStatus: PharmacyStatus;
  overview: {
    orders: number;
    revenue: number;
    products: number;
    clients: number;
  };

  orders: OrderStatisticsCounts;

  clients: {
    total: number;
    repeat: number;
    active: number;
    blocked: number;
  };

  products: OwnProductStatisticsCounts;
  allProducts: typeof DEFAULT_ALL_PRODUCT_STATISTICS;
  requests: ProductRequestStatisticsCounts;
}>;

//===================================================================

const CURRENT_YEAR = new Date().getFullYear();

//===================================================================

const DEFAULT_DATA: DashboardData = {
  pharmacyStatus: 'new',
  overview: {
    orders: 0,
    revenue: 0,
    products: 0,
    clients: 0,
  },
  orders: DEFAULT_ORDER_STATISTICS,

  clients: {
    total: 0,
    repeat: 0,
    active: 0,
    blocked: 0,
  },

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

function getPharmacyBanner(status: PharmacyStatus) {
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

  return {
    status: 'new' as const,
    label: status === 'on_verification' ? 'On verification' : 'New',
    title:
      status === 'on_verification'
        ? 'Your pharmacy is waiting for Admin review'
        : 'Your pharmacy is not activated yet',
    message:
      'After Admin review, you will be able to sell products, add products, and create product requests.',
  };
}

//===================================================================

async function getClientStatusTotal(status?: ClientStatus): Promise<number> {
  const response = await getPharmacyClients({
    page: 1,
    perPage: 100,
    status,
  });

  return response.total;
}

//===================================================================

async function loadDashboardData(
  selectedYear: string,
  selectedMonth: MonthFilterValue
): Promise<DashboardData> {
  const dateRange = getDateRange(selectedYear, selectedMonth);
  const profileResponse = await getMyPharmacyProfile();
  const pharmacyId = profileResponse.pharmacy.id;

  const [
    ordersResponse,
    allClients,
    activeClients,
    blockedClients,
    allProducts,
    requestStatistics,
    productStatistics,
    allProductStatistics,
  ] = await Promise.all([
    getPharmacyOrders({ page: 1, perPage: 1, ...dateRange }),
    getPharmacyClients({ page: 1, perPage: 100 }),
    getClientStatusTotal('active'),
    getClientStatusTotal('blocked'),
    getPharmacyProducts({ page: 1, perPage: 100, pharmacyId }),
    getPharmacyProductRequestStatistics(),
    getPharmacyOwnProductStatistics(pharmacyId),
    getPharmacyAllProductStatistics(pharmacyId),
  ]);

  const repeatClients = (allClients.items as PharmacyClientRow[]).filter(
    (client) => client.successfulOrdersCount > 1
  ).length;

  return {
    pharmacyStatus: profileResponse.pharmacy.status,
    overview: {
      orders: ordersResponse.total,
      revenue: ordersResponse.statistics.successful.amount,
      products: allProducts.total,
      clients: allClients.total,
    },

    orders: ordersResponse.statistics,

    clients: {
      total: allClients.total,
      repeat: repeatClients,
      active: activeClients,
      blocked: blockedClients,
    },

    products: productStatistics,
    allProducts: allProductStatistics,

    requests: requestStatistics,
  };
}

//===================================================================

function StatusStatCard({
  title,
  value,
  amount,
  tone,
  icon: Icon,
  href,
}: StatusCardConfig) {
  const content = (
    <>
      <div className={css.statusCardHeader}>
        <h3 className={css.statusCardTitle}>{title}</h3>
        <div className={css.statusIconWrap}>
          <Icon className={css.statusIcon} size={28} aria-hidden="true" />
        </div>
      </div>

      <div className={css.statusCardValues}>
        <p className={css.statusCardValue}>{value}</p>
        {typeof amount === 'number' ? (
          <p className={css.statusCardAmount}>{formatPrice(amount)}</p>
        ) : null}
      </div>
    </>
  );

  const className = `${css.statusCard} ${css[tone]}`;

  if (href) {
    return (
      <Link className={className} href={href}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
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

  const clientCards: StatusCardConfig[] = [
    {
      title: 'Total clients',
      value: dashboardData.clients.total,
      tone: 'accent',
      icon: UsersRound,
      href: getPharmacyClientsPath(),
    },
    {
      title: 'Repeat clients',
      value: dashboardData.clients.repeat,
      tone: 'blue',
      icon: RefreshCw,
      href: getPharmacyClientsPath(),
    },
    {
      title: 'Active clients',
      value: dashboardData.clients.active,
      tone: 'green',
      icon: ShieldCheck,
      href: getPharmacyClientsFilterPath({ status: 'active' }),
    },
    {
      title: 'Blocked clients',
      value: dashboardData.clients.blocked,
      tone: 'red',
      icon: Ban,
      href: getPharmacyClientsFilterPath({ status: 'blocked' }),
    },
  ];

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
      <div className={css.contentCard}>
        <div className={css.stack}>
          <PageHeader
            title="Dashboard"
            titleId="dashboard-page-title"
            icon={<LayoutDashboard size={23} aria-hidden="true" />}
          />

          {banner ? (
            <StatusBanner
              status={banner.status}
              title={banner.title}
              label={banner.label}
              message={banner.message}
            />
          ) : null}

          {isLoading ? (
            <div className={css.loaderBox}>
              <LoadingSpinner label="Loading dashboard statistics..." />
            </div>
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

                  <div
                    className={css.filters}
                    aria-label="Order statistics filters"
                  >
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
                aria-labelledby="clients-stats-title"
              >
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

                <div className={css.cardGrid}>
                  {clientCards.map((card) => (
                    <StatusStatCard key={card.title} {...card} />
                  ))}
                </div>

                {dashboardData.clients.total === 0 ? (
                  <EmptyState
                    title="Your pharmacy has no clients yet."
                    message="Clients will appear after the first orders in your pharmacy."
                  />
                ) : null}
              </section>

              <section
                className={css.section}
                aria-labelledby="products-stats-title"
              >
                <div className={css.sectionTopline}>
                  <div className={css.sectionHeader}>
                    <p className={css.sectionKicker}>Products</p>
                    <h2 className={css.sectionTitle} id="products-stats-title">
                      Own products
                    </h2>
                    <p className={css.sectionDescription}>
                      Analytics includes only products added to the current
                      pharmacy.
                    </p>
                  </div>
                  <ButtonLink
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

                <OwnProductStatistics
                  counts={dashboardData.products}
                  getStatisticHref={getProductStatisticHref}
                />

                <AllProductStatistics
                  counts={dashboardData.allProducts}
                  getStatisticHref={getAllProductStatisticHref}
                />

                {Object.values(dashboardData.products).every(
                  (value) => value.quantity === 0
                ) ? (
                  <EmptyState
                    title="Your pharmacy has no added products yet."
                    message="Browse active Admin products and add them after verification."
                  />
                ) : null}
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
                    href={getPharmacyNewRequestPath()}
                    variant="primary"
                    renderLink={({ href, className, children, ...props }) => (
                      <Link href={href} className={className} {...props}>
                        {children}
                      </Link>
                    )}
                  >
                    Create request
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
      </div>
    </main>
  );
}

export default PharmacyDashboardPageContent;
export { PharmacyDashboardPageContent };
