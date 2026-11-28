'use client';

import { useState } from 'react';

import {
  SalesPeriodFilters,
  SalesValueChart,
  type SalesPeriodMonth,
} from '@e-pharmacy/ui/charts';

import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import { DEFAULT_ORDER_SALES_STATISTICS } from '@/lib/statistics/defaults';

import { SalesChartFilterToolbar } from '@/components/statistics/SalesChartFilterToolbar';

import {
  CURRENT_YEAR,
  loadSales,
  useDashboardResource,
} from './dashboard-resources';

//===================================================================

export function DashboardSalesChart({
  pharmacyId,
}: Readonly<{ pharmacyId: string }>) {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState<SalesPeriodMonth>('all');
  const resource = useDashboardResource(loadSales, pharmacyId, year, month);

  const contentState = resource.isLoading ? (
    <ProfileResourceState
      variant="loading"
      title="Loading sales statistics"
      description="Sales by product category are being loaded."
    />
  ) : resource.error ? (
    <ProfileResourceState
      variant="error"
      title="Sales statistics could not be loaded"
      description="The chart is temporarily unavailable. Please try again."
      retryLabel="Try again"
      sideActionOnDesktop
      onRetry={resource.retry}
    />
  ) : null;

  return (
    <SalesValueChart
      data={resource.data ?? DEFAULT_ORDER_SALES_STATISTICS}
      contentState={contentState}
      headerContent={
        <SalesChartFilterToolbar
          hasFilters={year !== CURRENT_YEAR || month !== 'all'}
          onReset={() => {
            setYear(CURRENT_YEAR);
            setMonth('all');
          }}
        >
          <SalesPeriodFilters
            idPrefix="dashboard-sales"
            year={year}
            month={month}
            onYearChange={setYear}
            onMonthChange={setMonth}
          />
        </SalesChartFilterToolbar>
      }
    />
  );
}
