'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import type { OrderSalesStatistics } from '@e-pharmacy/types/orders';

import {
  getSalesPeriodDateRange,
  SalesPeriodFilters,
  SalesValueChart,
  type SalesPeriodMonth,
} from '@e-pharmacy/ui/charts';

import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import { getAdminPharmacySalesStatistics } from '@/lib/api/browser/admin-pharmacy-detail.api';

import {
  getAdminPharmacyOwnerPharmacies,
  getAdminPharmacyOwnerSalesStatistics,
} from '@/lib/api/browser/admin-pharmacy-owners.api';

import {
  buildSalesChartPath,
  getSalesChartYear,
  parseSalesChartSegments,
} from '@/lib/pharmacy-owners/owner-sales-chart-paths';

import { PharmacySearch } from '@/components/pharmacies/PharmacySearch/PharmacySearch';

import css from './PharmacyDetailsPageContent.module.css';

//===================================================================

type SalesSnapshot = Readonly<{
  key: string;
  data: OrderSalesStatistics | null;
  error: boolean;
}>;

//===================================================================

/** Only the active Statistics tab mounts this chart. */
export function PharmacySalesChart({
  pharmacyId,
  ownerId,
}: Readonly<{ pharmacyId?: string; ownerId?: string }>) {
  const pathname = usePathname();
  const router = useRouter();

  const base = ownerId
    ? `/admin/pharmacy-owners/${ownerId}/statistics`
    : `/admin/pharmacies/${pharmacyId}/statistics`;

  const segments = pathname.startsWith(`${base}/`)
    ? pathname.slice(base.length + 1).split('/')
    : [];

  const period = parseSalesChartSegments(segments, {
    allowPharmacy: Boolean(ownerId),
  });

  const year = getSalesChartYear(period);
  const month = period.month;

  const updatePeriod = (nextYear: string, nextMonth: SalesPeriodMonth) => {
    router.push(
      buildSalesChartPath(
        base,
        { ...period, year: nextYear, month: nextMonth },
        { allowPharmacy: Boolean(ownerId) }
      ),
      { scroll: false }
    );
  };

  const selectedPharmacyId = period.pharmacyId;

  const loadOwnerPharmacyOptions = useCallback(
    async (query: string, signal: AbortSignal, page = 1) => {
      if (!ownerId) return [];

      const result = await getAdminPharmacyOwnerPharmacies(
        ownerId,
        { ...(query ? { search: query } : {}), page, perPage: 20 },
        { signal }
      );

      return result.items;
    },
    [ownerId]
  );

  const [retry, setRetry] = useState(0);
  const [snapshot, setSnapshot] = useState<SalesSnapshot | null>(null);

  const key = `${ownerId ? `owner:${ownerId}` : `pharmacy:${pharmacyId}`}:${selectedPharmacyId ?? 'all'}:${year}:${month}:${retry}`;
  const current = snapshot?.key === key ? snapshot : null;

  useEffect(() => {
    const controller = new AbortController();

    void (
      ownerId
        ? getAdminPharmacyOwnerSalesStatistics(
            ownerId,
            {
              ...getSalesPeriodDateRange(year, month),
              pharmacyId: selectedPharmacyId,
            },
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
  }, [pharmacyId, ownerId, selectedPharmacyId, year, month, retry, key]);

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
      retryLabel="Try again"
      sideActionOnDesktop
      onRetry={() => setRetry((v) => v + 1)}
    />
  ) : null;

  return (
    <div className={css.salesChartStack}>
      {ownerId ? (
        <PharmacySearch
          id="owner-statistics-pharmacy"
          label="Select pharmacy"
          ownerId={ownerId}
          loadOptions={loadOwnerPharmacyOptions}
          statisticsScope
          value={selectedPharmacyId ?? ''}
          onChange={(id) =>
            router.push(
              buildSalesChartPath(
                base,
                { ...period, pharmacyId: id },
                { allowPharmacy: true }
              ),
              { scroll: false }
            )
          }
        />
      ) : null}
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
            onYearChange={(value) => updatePeriod(value, month)}
            onMonthChange={(value) => updatePeriod(year, value)}
            onReset={
              period.year || period.month !== 'all' || selectedPharmacyId
                ? () => router.push(base, { scroll: false })
                : undefined
            }
          />
        }
      />
    </div>
  );
}
