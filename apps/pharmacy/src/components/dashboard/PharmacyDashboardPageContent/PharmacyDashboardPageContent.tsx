'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';

import {
  Ban,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import {
  ButtonLink,
  LoadingSpinner,
  OwnProductStatistics,
  ProductRequestStatistics,
  SelectField,
  StatusBanner,
} from '@e-pharmacy/ui/common';

import { PageHeader } from '@e-pharmacy/ui/layout';
import type { OrderStatus, PharmacyStatus } from '@e-pharmacy/types';

import {
  DEFAULT_OWN_PRODUCT_STATISTICS,
  type OwnProductStatisticsCounts,
  type OwnProductStatisticsKey,
} from '@e-pharmacy/types/products';

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

import type { ClientStatus } from '@/lib/clients/clients';
import { getPharmacyProductRequestStatistics } from '@/lib/product-requests/product-request-statistics';

import {
  getPharmacyOwnProductStatistics,
  getProductFinancialStats,
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

  orders: {
    new: { count: number; amount: number };
    inProgress: { count: number; amount: number };
    successful: { count: number; amount: number };
    rejected: { count: number; amount: number };
  };

  clients: {
    total: number;
    repeat: number;
    active: number;
    blocked: number;
  };

  products: OwnProductStatisticsCounts & {
    stockValue: number;
    reservedValue: number;
    availableValue: number;
  };

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
  orders: {
    new: { count: 0, amount: 0 },
    inProgress: { count: 0, amount: 0 },
    successful: { count: 0, amount: 0 },
    rejected: { count: 0, amount: 0 },
  },

  clients: {
    total: 0,
    repeat: 0,
    active: 0,
    blocked: 0,
  },

  products: {
    ...DEFAULT_OWN_PRODUCT_STATISTICS,
    stockValue: 0,
    reservedValue: 0,
    availableValue: 0,
  },

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

function sumOrderAmount(
  orders: Array<{ totalAmount: number }>,
  fallback = 0
): number {
  const amount = orders.reduce((total, order) => total + order.totalAmount, 0);

  return amount || fallback;
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

async function getOrderStatusStat(
  status: OrderStatus,
  dateRange: { dateFrom: string; dateTo: string }
) {
  const response = await getPharmacyOrders({
    page: 1,
    perPage: 100,
    status,
    ...dateRange,
  });

  return {
    count: response.total,
    amount: sumOrderAmount(response.items),
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
    newOrders,
    inProgressOrders,
    successfulOrders,
    rejectedOrders,
    allClients,
    activeClients,
    blockedClients,
    allProducts,
    requestStatistics,
    productStatistics,
  ] = await Promise.all([
    getOrderStatusStat('new', dateRange),
    getOrderStatusStat('in_progress', dateRange),
    getOrderStatusStat('successful', dateRange),
    getOrderStatusStat('rejected', dateRange),
    getPharmacyClients({ page: 1, perPage: 100 }),
    getClientStatusTotal('active'),
    getClientStatusTotal('blocked'),
    getPharmacyProducts({ page: 1, perPage: 100, pharmacyId }),
    getPharmacyProductRequestStatistics(),
    getPharmacyOwnProductStatistics(pharmacyId),
  ]);

  const financialStats = getProductFinancialStats(allProducts.items);
  const repeatClients = allClients.items.filter(
    (client) => client.successfulOrdersCount > 1
  ).length;

  return {
    pharmacyStatus: profileResponse.pharmacy.status,
    overview: {
      orders:
        newOrders.count +
        inProgressOrders.count +
        successfulOrders.count +
        rejectedOrders.count,
      revenue: successfulOrders.amount,
      products: allProducts.total,
      clients: allClients.total,
    },

    orders: {
      new: newOrders,
      inProgress: inProgressOrders,
      successful: successfulOrders,
      rejected: rejectedOrders,
    },

    clients: {
      total: allClients.total,
      repeat: repeatClients,
      active: activeClients,
      blocked: blockedClients,
    },

    products: {
      ...productStatistics,
      total: allProducts.total,
      reserved: financialStats.reservedProducts,
      stockValue: financialStats.stockValue,
      reservedValue: financialStats.reservedValue,
      availableValue: financialStats.availableValue,
    },

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

function ValueCard({
  title,
  value,
  description,
}: Readonly<{
  title: string;
  value: number;
  description: string;
}>) {
  return (
    <article className={css.valueCard}>
      <p className={css.valueCardTitle}>{title}</p>
      <p className={css.valueCardValue}>{formatPrice(value)}</p>
      <p className={css.valueCardDescription}>{description}</p>
    </article>
  );
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

  const orderCards: StatusCardConfig[] = [
    {
      title: 'New orders',
      value: dashboardData.orders.new.count,
      amount: dashboardData.orders.new.amount,
      tone: 'blue',
      icon: ClipboardList,
      href: getPharmacyOrdersFilterPath({ status: 'new' }),
    },
    {
      title: 'In work',
      value: dashboardData.orders.inProgress.count,
      amount: dashboardData.orders.inProgress.amount,
      tone: 'yellow',
      icon: Clock3,
      href: getPharmacyOrdersFilterPath({ status: 'in_progress' }),
    },
    {
      title: 'Successful',
      value: dashboardData.orders.successful.count,
      amount: dashboardData.orders.successful.amount,
      tone: 'green',
      icon: CheckCircle2,
      href: getPharmacyOrdersFilterPath({ status: 'successful' }),
    },
    {
      title: 'Rejected',
      value: dashboardData.orders.rejected.count,
      amount: dashboardData.orders.rejected.amount,
      tone: 'red',
      icon: XCircle,
      href: getPharmacyOrdersFilterPath({ status: 'rejected' }),
    },
  ];

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
    if (key === 'active' || key === 'blocked') {
      return getPharmacyProductsFilterPath({ status: key });
    }

    if (key === 'inStock') {
      return getPharmacyProductsFilterPath({ stock: 'available' });
    }

    if (key === 'outOfStock') {
      return getPharmacyProductsFilterPath({ stock: 'empty' });
    }

    return getPharmacyProductsPath();
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

                <div className={css.cardGrid}>
                  {orderCards.map((card) => (
                    <StatusStatCard key={card.title} {...card} />
                  ))}
                </div>
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

                <div
                  className={css.valueGrid}
                  aria-label="Product stock value statistics"
                >
                  <ValueCard
                    title="Total stock value"
                    value={dashboardData.products.stockValue}
                    description="Stock quantity × current price."
                  />
                  <ValueCard
                    title="Reserved stock value"
                    value={dashboardData.products.reservedValue}
                    description="Reserved quantity × current price."
                  />
                  <ValueCard
                    title="Available stock value"
                    value={dashboardData.products.availableValue}
                    description="Available quantity × current price."
                  />
                </div>

                {dashboardData.products.total === 0 ? (
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
