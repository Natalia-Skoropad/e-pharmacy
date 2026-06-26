'use client';

import Link from 'next/link';
import { ClipboardList, PackageCheck, ReceiptText, UsersRound } from 'lucide-react';

import {
  ButtonLink,
  CabinetPage,
  PharmacyPageHeader,
  StatsCard,
  StatusBanner,
} from '@e-pharmacy/ui/common';

import { getDashboardBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';
import {
  getPharmacyAllProductsPath,
  getPharmacyProfilePath,
} from '@/lib/pharmacy/routes';

import css from './PharmacyDashboardPageContent.module.css';

//===================================================================

const ZERO_METRICS = [
  {
    title: 'Orders',
    value: '0',
    meta: 'From previous period',
    icon: ClipboardList,
  },
  {
    title: 'Revenue',
    value: '₴0',
    meta: 'From previous period',
    icon: ReceiptText,
  },
  {
    title: 'Products',
    value: '0',
    meta: 'Own pharmacy products',
    icon: PackageCheck,
  },
  {
    title: 'Clients',
    value: '0',
    meta: 'Real clients only',
    icon: UsersRound,
  },
];

const ORDER_STATS = [
  { title: 'New orders', value: 0, status: 'new' as const },
  { title: 'In progress', value: 0, status: 'in_progress' as const },
  { title: 'Successful', value: 0, status: 'successful' as const },
  { title: 'Rejected', value: 0, status: 'rejected' as const },
];

const PRODUCT_STATS = [
  { title: 'Own products', value: 0 },
  { title: 'Active products', value: 0, status: 'active' as const },
  { title: 'Empty stock', value: 0, status: 'empty' as const },
  { title: 'Product requests', value: 0, status: 'draft' as const },
];

//===================================================================

function PharmacyDashboardPageContent() {
  return (
    <CabinetPage
      title="Dashboard"
      description="Your new pharmacy cabinet starts with clean zero statistics. Only real orders, clients, products, and requests will be shown here."
      breadcrumbs={getDashboardBreadcrumbs()}
    >
      <div className={css.stack}>
        <StatusBanner
          status="new"
          title="Your pharmacy is new"
          label="New"
          message="Complete pharmacy data, about section, payment details, and then send the profile for Admin verification. Business features stay limited until verification is approved."
        />

        <section className={css.metricsGrid} aria-label="Main pharmacy statistics">
          {ZERO_METRICS.map(({ title, value, meta, icon: Icon }) => (
            <article className={css.metricCard} key={title}>
              <div className={css.metricHeader}>
                <h2 className={css.metricTitle}>{title}</h2>
                <Icon className={css.metricIcon} size={34} aria-hidden="true" />
              </div>
              <p className={css.metricValue}>{value}</p>
              <p className={css.metricMeta}>
                <span className={css.metricPill}>0%</span>
                {meta}
              </p>
            </article>
          ))}
        </section>

        <section className={css.section} aria-labelledby="order-stats-title">
          <PharmacyPageHeader
            title="Orders statistics"
            description="A new pharmacy has no orders yet. These cards update only from real order data."
            kicker="Current pharmacy"
          />
          <div className={css.grid} id="order-stats-title">
            {ORDER_STATS.map((item) => (
              <StatsCard
                key={item.title}
                title={item.title}
                value={item.value}
                status={item.status}
                description="No real orders yet."
              />
            ))}
          </div>
        </section>

        <section className={css.section} aria-labelledby="product-stats-title">
          <PharmacyPageHeader
            title="Products and requests"
            description="You can browse all active Admin products now. Adding products and creating requests unlock after verification."
            kicker="Catalog"
          />
          <div className={css.grid} id="product-stats-title">
            {PRODUCT_STATS.map((item) => (
              <StatsCard
                key={item.title}
                title={item.title}
                value={item.value}
                status={item.status}
                description="No real data yet."
              />
            ))}
          </div>
        </section>

        <div className={css.quickActions}>
          <ButtonLink
            href={getPharmacyProfilePath()}
            variant="primary"
            renderLink={({ href, className, children, ...props }) => (
              <Link href={href} className={className} {...props}>
                {children}
              </Link>
            )}
          >
            Complete profile
          </ButtonLink>

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
      </div>
    </CabinetPage>
  );
}

export default PharmacyDashboardPageContent;
export { PharmacyDashboardPageContent };
