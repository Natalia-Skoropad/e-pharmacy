import type { Metadata } from 'next';
import Link from 'next/link';

import {
  getPharmacyAllProductsPath,
  getPharmacyOrdersFilterPath,
  getPharmacyProductsFilterPath,
  getPharmacyRequestsFilterPath,
  getPharmacyProductRequestsPath,
} from '@/lib/pharmacy/routes';

import { getDashboardBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';

import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';
import {
  ActionBar,
  PharmacyPageHeader,
  StatsCard,
  StatusBanner,
} from '@/components/pharmacy/ui';

import css from './Dashboard.module.css';

//===================================================================

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Pharmacy dashboard overview.',
};

//===================================================================

const orderStats = [
  {
    title: 'New orders',
    value: 12,
    description: 'Orders waiting for pharmacy review.',
    status: 'new' as const,
    href: getPharmacyOrdersFilterPath({ status: 'new' }),
  },
  {
    title: 'In work',
    value: 8,
    description: 'Orders currently being prepared.',
    status: 'in_work' as const,
    href: getPharmacyOrdersFilterPath({ status: 'in_progress' }),
  },
  {
    title: 'Successful',
    value: 134,
    description: 'Completed orders for the selected period.',
    status: 'successful' as const,
    href: getPharmacyOrdersFilterPath({ status: 'successful' }),
  },
  {
    title: 'Rejected',
    value: 3,
    description: 'Orders rejected by the pharmacy.',
    status: 'rejected' as const,
    href: getPharmacyOrdersFilterPath({ status: 'rejected' }),
  },
];

const clientStats = [
  {
    title: 'Total clients',
    value: 248,
    description: 'Clients who ordered from this pharmacy.',
  },
  {
    title: 'Active clients',
    value: 231,
    description: 'Clients available for future orders.',
    status: 'active' as const,
  },
  {
    title: 'New this month',
    value: 19,
    description: 'New clients for the current pharmacy.',
    status: 'new' as const,
  },
];

const productStats = [
  {
    title: 'Own products',
    value: 436,
    description: 'Products added to this pharmacy.',
  },
  {
    title: 'Active products',
    value: 421,
    description: 'Products visible for clients.',
    status: 'active' as const,
    href: getPharmacyProductsFilterPath({ status: 'active' }),
  },
  {
    title: 'Empty stock',
    value: 15,
    description: 'Products that need restocking.',
    status: 'empty' as const,
    href: getPharmacyProductsFilterPath({ stock: 'empty' }),
  },
  {
    title: 'Stock value',
    value: '₴128k',
    description: 'Current demo stock value.',
  },
];

const requestStats = [
  {
    title: 'Draft requests',
    value: 2,
    description: 'Product requests not sent yet.',
    status: 'draft' as const,
    href: getPharmacyRequestsFilterPath({ status: 'draft' }),
  },
  {
    title: 'On moderation',
    value: 4,
    description: 'Requests waiting for admin review.',
    status: 'on_moderation' as const,
    href: getPharmacyRequestsFilterPath({ status: 'on_moderation' }),
  },
  {
    title: 'Approved',
    value: 7,
    description: 'Requests approved by admin.',
    status: 'approved' as const,
    href: getPharmacyRequestsFilterPath({ status: 'approved' }),
  },
  {
    title: 'Rejected',
    value: 1,
    description: 'Requests rejected with admin comments.',
    status: 'rejected' as const,
    href: getPharmacyRequestsFilterPath({ status: 'rejected' }),
  },
];

//===================================================================

function DashboardPage() {
  return (
    <PharmacyPage
      title="Dashboard"
      description="Track pharmacy status, order flow, clients, stock, and product requests. Demo data is used until the pharmacy API is connected."
      breadcrumbs={getDashboardBreadcrumbs()}
    >
      <div className={css.stack}>
        <StatusBanner
          status="active"
          title="Green Cross Pharmacy is active"
          message="The cabinet is available in demo mode. All statistics below are scoped to the current pharmacy and ready to be replaced by API data."
          label="Active"
        />

        <section className={css.section} aria-labelledby="orders-statistics-title">
          <PharmacyPageHeader
            title="Orders statistics"
            description="Year and month filters are local to the dashboard and do not change the URL."
            kicker="Dashboard"
            actions={
              <div className={css.filterBar}>
                <div className={css.filterGroup}>
                  <span className={css.filterLabel}>Period</span>
                  <select className={css.select} aria-label="Orders statistics year" defaultValue="2026">
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                  <select className={css.select} aria-label="Orders statistics month" defaultValue="all">
                    <option value="all">All months</option>
                    <option value="06">June</option>
                    <option value="05">May</option>
                  </select>
                </div>
              </div>
            }
          />
          <div className={`${css.grid} ${css.gridWide}`} id="orders-statistics-title">
            {orderStats.map((item) => (
              <StatsCard key={item.title} {...item} meta="Open orders" />
            ))}
          </div>
        </section>

        <section className={css.section} aria-labelledby="clients-statistics-title">
          <PharmacyPageHeader
            title="Clients statistics"
            description="Only clients who ordered from this pharmacy are counted here."
            kicker="Current pharmacy"
          />
          <div className={css.grid} id="clients-statistics-title">
            {clientStats.map((item) => (
              <StatsCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section className={css.section} aria-labelledby="products-statistics-title">
          <PharmacyPageHeader
            title="Products statistics"
            description="Own product offers, stock state, and demo stock value."
            kicker="Stock"
          />
          <div className={`${css.grid} ${css.gridWide}`} id="products-statistics-title">
            {productStats.map((item) => (
              <StatsCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section className={css.section} aria-labelledby="requests-statistics-title">
          <PharmacyPageHeader
            title="Product requests"
            description="Request statistics are ready for the future backend endpoints."
            kicker="Moderation"
          />
          <div className={`${css.grid} ${css.gridWide}`} id="requests-statistics-title">
            {requestStats.map((item) => (
              <StatsCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <ActionBar>
          <Link className={css.actionLink} href={getPharmacyAllProductsPath()}>
            View all products
          </Link>
          <Link className={css.actionLink} href={getPharmacyProductRequestsPath()}>
            Product requests
          </Link>
        </ActionBar>
      </div>
    </PharmacyPage>
  );
}

export default DashboardPage;
