'use client';

import { usePathname } from 'next/navigation';

import {
  Boxes,
  FilePlus2,
  LayoutDashboard,
  PackageSearch,
  ShoppingBag,
  Users,
} from 'lucide-react';

import { PageHeader } from '@e-pharmacy/ui/layout';
import { SearchableSelect } from '@e-pharmacy/ui/forms';
import { StatsLoadingSkeleton } from '@e-pharmacy/ui/statistics';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import { SalesValueChart } from '@e-pharmacy/ui/charts';

import { DEFAULT_ORDER_SALES_STATISTICS } from '@/lib/statistics/defaults';

import css from './PharmacyDashboardPageContent.module.css';

//===================================================================

// Route/auth fallbacks never request private data. The resolved page owns
// its requests and displays the same individual skeletons.
export function DashboardPageSkeleton() {
  const pathname = usePathname();

  const filtered = /^\/pharmacy\/dashboard\/pharmacy-id-[a-f0-9]{24}$/i.test(
    pathname
  );

  const blocks = [
    { title: 'Clients statistics', icon: Users, count: 3 },
    { title: 'Own product statistics', icon: Boxes, count: 4 },

    ...(!filtered
      ? [
          { title: 'All product statistics', icon: PackageSearch, count: 4 },
          { title: 'Product request statistics', icon: FilePlus2, count: 4 },
        ]
      : []),
  ];

  return (
    <main className={css.page} aria-label="Loading dashboard" aria-busy="true">
      <section className={css.section}>
        <PageHeader
          title="Dashboard"
          icon={<LayoutDashboard size={23} aria-hidden="true" />}
        />

        <SearchableSelect
          id="dashboard-loading-pharmacy"
          label="Select pharmacy"
          value=""
          options={[]}
          isOptionsLoading
          disabled
          onChange={() => undefined}
        />
      </section>

      <section className={css.section}>
        <ProfileSectionHeader
          title="Orders statistics"
          icon={<ShoppingBag size={23} />}
        />

        <StatsLoadingSkeleton
          count={4}
          columns={4}
          tabletColumns={2}
          label="Loading order statistics"
        />
      </section>

      <SalesValueChart
        data={DEFAULT_ORDER_SALES_STATISTICS}
        contentState={
          <ProfileResourceState
            variant="loading"
            title="Loading sales statistics"
            description="Sales by product category are being loaded."
          />
        }
      />
      {blocks.map(({ title, icon: Icon, count }) => (
        <section className={css.section} key={title}>
          <ProfileSectionHeader title={title} icon={<Icon size={23} />} />

          <StatsLoadingSkeleton
            count={count}
            columns={count}
            tabletColumns={2}
            label={`Loading ${title.toLowerCase()}`}
          />
        </section>
      ))}
    </main>
  );
}
