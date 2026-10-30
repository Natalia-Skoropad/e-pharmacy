'use client';

import { useEffect, useState } from 'react';

import {
  normalizeOrderSalesStatistics,
  type OrderSalesStatisticsQueryParams,
  parseApiResponseData,
} from '@e-pharmacy/api-client/response';

import { appendQueryParams } from '@e-pharmacy/api-client/transport';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type { OrderSalesStatistics } from '@e-pharmacy/types/orders';
import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';

import {
  getSalesPeriodDateRange,
  SalesPeriodFilters,
  SalesValueChart,
  type SalesPeriodMonth,
} from '@e-pharmacy/ui/charts';

import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import { pharmacyApiRoutes } from '@/lib/api/routes/pharmacy-api-routes';

//===================================================================

async function getOwnedPharmacySales(
  pharmacyId: string,
  params: OrderSalesStatisticsQueryParams,
  signal: AbortSignal
): Promise<OrderSalesStatistics> {
  const url = appendQueryParams(
    pharmacyApiRoutes.pharmacies.ownedSalesStatistics(pharmacyId),
    params
  );

  return parseApiResponseData(
    await localApiRequest(url, { signal }),

    normalizeOrderSalesStatistics,
    { url, method: 'GET' }
  );
}

//===================================================================

/** Pharmacy-specific sales chart, mounted only on the information tab. */
export function OwnedPharmacySalesChart({
  pharmacyId,
  pharmacyStatus,
}: {
  pharmacyId: string;
  pharmacyStatus: PharmacyStatus;
}) {
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [month, setMonth] = useState<SalesPeriodMonth>('all');
  const [retry, setRetry] = useState(0);

  const [snapshot, setSnapshot] = useState<Readonly<{
    key: string;
    data: OrderSalesStatistics | null;
    error: boolean;
  }> | null>(null);

  const key = `${pharmacyId}:${year}:${month}:${retry}`;
  const current = snapshot?.key === key ? snapshot : null;

  const hasNeverBeenActive =
    pharmacyStatus === 'new' || pharmacyStatus === 'on_verification';

  useEffect(() => {
    if (hasNeverBeenActive) return;

    const controller = new AbortController();

    void getOwnedPharmacySales(
      pharmacyId,
      getSalesPeriodDateRange(year, month),
      controller.signal
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
  }, [hasNeverBeenActive, key, pharmacyId, year, month, retry]);

  const contentState = hasNeverBeenActive ? null : !current ? (
    <ProfileResourceState
      variant="loading"
      title="Loading pharmacy sales statistics"
      description="The pharmacy sales chart is being loaded."
    />
  ) : current.error || !current.data ? (
    <ProfileResourceState
      variant="error"
      title="Sales statistics could not be loaded"
      description="The chart is temporarily unavailable. Please try again."
      retryLabel="Retry sales statistics"
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
          idPrefix="owned-pharmacy-sales"
          year={year}
          month={month}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />
      }
    />
  );
}
