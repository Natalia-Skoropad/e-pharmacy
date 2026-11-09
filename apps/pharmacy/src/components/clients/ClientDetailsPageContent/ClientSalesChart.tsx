'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import type { OrderSalesStatistics } from '@e-pharmacy/types/orders';

import {
  getSalesPeriodDateRange,
  SalesPeriodFilters,
  SalesValueChart,
  type SalesPeriodMonth,
} from '@e-pharmacy/ui/charts';

import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import { getPharmacyClientSalesStatistics } from '@/lib/api/browser/clients.api';
import { getPharmacyClientPath } from '@/lib/routes';

import {
  buildSalesChartPath,
  getSalesChartYear,
  parseSalesChartSegments,
} from '@/lib/statistics/sales-chart-paths';

//===================================================================

/** Owner-wide for ordinary clients, restricted to the default pharmacy for walk-ins. */
export function ClientSalesChart({ clientId }: Readonly<{ clientId: string }>) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `${getPharmacyClientPath(clientId)}/details`;

  const segments = pathname.startsWith(`${base}/`)
    ? pathname.slice(base.length + 1).split('/')
    : [];

  const period = parseSalesChartSegments(segments);
  const year = getSalesChartYear(period);
  const month = period.month;

  const updatePeriod = (next: { year: string; month: SalesPeriodMonth }) => {
    router.push(buildSalesChartPath(base, { ...period, ...next }), {
      scroll: false,
    });
  };

  const [retry, setRetry] = useState(0);

  const [snapshot, setSnapshot] = useState<Readonly<{
    key: string;
    data: OrderSalesStatistics | null;
    error: boolean;
  }> | null>(null);

  const key = `${clientId}:${year}:${month}:${retry}`;
  const current = snapshot?.key === key ? snapshot : null;

  useEffect(() => {
    const controller = new AbortController();

    void getPharmacyClientSalesStatistics(
      clientId,
      getSalesPeriodDateRange(year, month),
      { signal: controller.signal }
    )
      .then((data) => {
        if (!controller.signal.aborted)
          setSnapshot({ key, data, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setSnapshot({ key, data: null, error: true });
      });

    return () => controller.abort();
  }, [clientId, key, month, retry, year]);

  const contentState = !current ? (
    <ProfileResourceState
      variant="loading"
      title="Loading client sales statistics"
      description="Sales by product category are being loaded."
    />
  ) : current.error || !current.data ? (
    <ProfileResourceState
      variant="error"
      title="Client sales statistics could not be loaded"
      description="The chart is temporarily unavailable. Please try again."
      retryLabel="Try again"
      sideActionOnDesktop
      onRetry={() => setRetry((n) => n + 1)}
    />
  ) : null;

  return (
    <SalesValueChart
      data={
        current?.data ?? {
          currency: '₴',
          groupBy: 'month',
          categories: [],
          points: [],
        }
      }
      contentState={contentState}
      headerContent={
        <SalesPeriodFilters
          idPrefix="client-sales"
          year={year}
          month={month}
          onYearChange={(value) => updatePeriod({ year: value, month })}
          onMonthChange={(value) => updatePeriod({ year, month: value })}
        />
      }
    />
  );
}
