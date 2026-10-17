'use client';

import { useEffect, useState } from 'react';

import type { OrderSalesStatistics } from '@e-pharmacy/types/orders';

import {
  getSalesPeriodDateRange,
  SalesPeriodFilters,
  SalesValueChart,
  type SalesPeriodMonth,
} from '@e-pharmacy/ui/charts';

import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import { getAdminPharmacySalesStatistics } from '@/lib/api/browser/admin-pharmacy-detail.api';
import { getAdminPharmacyOwnerSalesStatistics } from '@/lib/api/browser/admin-pharmacy-owners.api';

//===================================================================

type SalesSnapshot = Readonly<{
  key: string;
  data: OrderSalesStatistics | null;
  error: boolean;
}>;

//===================================================================

/** Only the active Pharmacy information tab mounts this chart. */
export function PharmacySalesChart({
  pharmacyId,
  ownerId,
}: Readonly<{ pharmacyId?: string; ownerId?: string }>) {
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [month, setMonth] = useState<SalesPeriodMonth>('all');
  const [retry, setRetry] = useState(0);
  const [snapshot, setSnapshot] = useState<SalesSnapshot | null>(null);

  const key = `${ownerId ? `owner:${ownerId}` : `pharmacy:${pharmacyId}`}:${year}:${month}:${retry}`;
  const current = snapshot?.key === key ? snapshot : null;

  useEffect(() => {
    const controller = new AbortController();

    void (
      ownerId
        ? getAdminPharmacyOwnerSalesStatistics(
            ownerId,
            getSalesPeriodDateRange(year, month),
            { signal: controller.signal }
          )
        : getAdminPharmacySalesStatistics(
            pharmacyId!,
            getSalesPeriodDateRange(year, month),
            { signal: controller.signal }
          )
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setSnapshot({ key, data, error: false });
        }
      })

      .catch(() => {
        if (!controller.signal.aborted) {
          setSnapshot({ key, data: null, error: true });
        }
      });

    return () => controller.abort();
  }, [pharmacyId, ownerId, year, month, retry, key]);

  const contentState = !current ? (
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
      onRetry={() => setRetry((v) => v + 1)}
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
          idPrefix={ownerId ? 'admin-owner-sales' : 'admin-pharmacy-sales'}
          year={year}
          month={month}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />
      }
    />
  );
}
