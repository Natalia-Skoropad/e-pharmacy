'use client';

import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageCircleQuestion } from 'lucide-react';

import { PageHeader } from '@e-pharmacy/ui/layout';
import { SearchableSelect } from '@e-pharmacy/ui/forms';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { SalesPeriodFilters, SalesValueChart } from '@e-pharmacy/ui/charts';

import { DEFAULT_ORDER_SALES_STATISTICS } from '@/lib/statistics/defaults';

import { SalesChartFilterToolbar } from '@/components/statistics/SalesChartFilterToolbar';

import {
  DASHBOARD_SECTIONS,
  DashboardStatisticsSection,
} from './DashboardStatisticsSection';

import css from './PharmacyDashboardPageContent.module.css';

//===================================================================

// Public static placeholders: no private data or navigation before auth.
const LOADING_RESOURCE = {
  data: null,
  isLoading: true,
  error: false,
  retry: () => undefined,
};

//===================================================================

function PeriodSkeleton({ id }: Readonly<{ id: string }>) {
  return (
    <SalesChartFilterToolbar hasFilters={false} onReset={() => undefined}>
      <SalesPeriodFilters
        idPrefix={id}
        year={String(new Date().getFullYear())}
        month="all"
        disabled
        onYearChange={() => undefined}
        onMonthChange={() => undefined}
      />
    </SalesChartFilterToolbar>
  );
}

//===================================================================

export function DashboardPageSkeleton() {
  const pathname = usePathname();

  const filtered = /^\/pharmacy\/dashboard\/pharmacy-id-[a-f0-9]{24}$/i.test(
    pathname
  );

  const sections = [
    DASHBOARD_SECTIONS.clients,
    DASHBOARD_SECTIONS.ownProducts,

    ...(!filtered
      ? [DASHBOARD_SECTIONS.allProducts, DASHBOARD_SECTIONS.requests]
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
          labelAccessory={
            <MessageCircleQuestion
              size={20}
              strokeWidth={2.2}
              className={css.loadingHelp}
              aria-hidden="true"
            />
          }
          value=""
          options={[]}
          isOptionsLoading
          disabled
          onChange={() => undefined}
        />
      </section>

      <DashboardStatisticsSection
        {...DASHBOARD_SECTIONS.orders}
        resource={LOADING_RESOURCE}
        filters={<PeriodSkeleton id="dashboard-loading-order" />}
      >
        {() => null}
      </DashboardStatisticsSection>

      <SalesValueChart
        data={DEFAULT_ORDER_SALES_STATISTICS}
        headerContent={<PeriodSkeleton id="dashboard-loading-sales" />}
        contentState={
          <ProfileResourceState
            variant="loading"
            title="Loading sales statistics"
            description="Sales by product category are being loaded."
          />
        }
      />

      {sections.map((section) => (
        <DashboardStatisticsSection
          key={section.id}
          {...section}
          resource={LOADING_RESOURCE}
        >
          {() => null}
        </DashboardStatisticsSection>
      ))}
    </main>
  );
}
