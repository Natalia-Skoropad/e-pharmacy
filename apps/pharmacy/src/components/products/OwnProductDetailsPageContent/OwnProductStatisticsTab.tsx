'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import type { OrderSalesStatistics } from '@e-pharmacy/types/orders';

import {
  SalesPeriodFilters,
  SalesValueChart,
  getSalesPeriodDateRange,
} from '@e-pharmacy/ui/charts';

import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import { getPharmacyOrderSalesStatistics } from '@/lib/api/browser';
import { DEFAULT_ORDER_SALES_STATISTICS } from '@/lib/statistics/defaults';
import { getOwnProductDetailTabPath } from '@/lib/products/own-product-detail-tabs';

import {
  buildSalesChartPath,
  getSalesChartYear,
  parseSalesChartSegments,
} from '@/lib/statistics/sales-chart-paths';

import { OwnedPharmacySearch } from '@/components/pharmacies/OwnedPharmacySearch/OwnedPharmacySearch';
import { SalesChartFilterToolbar } from '@/components/statistics/SalesChartFilterToolbar';

import css from './OwnProductDetailsPageContent.module.css';

//===================================================================

type SalesSnapshot = Readonly<{
  key: string;
  data: OrderSalesStatistics | null;
  error: boolean;
}>;

//===================================================================

type OwnProductStatisticsTabProps = Readonly<{ productId: string }>;

//===================================================================

export function OwnProductStatisticsTab({
  productId,
}: OwnProductStatisticsTabProps) {
  const pathname = usePathname();
  const router = useRouter();
  const base = getOwnProductDetailTabPath(productId, 'statistics');

  const segments = pathname.startsWith(`${base}/`)
    ? pathname.slice(base.length + 1).split('/')
    : [];

  const filters = parseSalesChartSegments(segments, { allowPharmacy: true });
  const pharmacyId = filters.pharmacyId;
  const year = getSalesChartYear(filters);
  const month = filters.month;

  const updateFilters = (next: Partial<typeof filters>) => {
    router.push(
      buildSalesChartPath(
        base,
        { ...filters, ...next },
        { allowPharmacy: true }
      ),
      { scroll: false }
    );
  };

  const [retry, setRetry] = useState(0);
  const [snapshot, setSnapshot] = useState<SalesSnapshot | null>(null);

  // Keyed snapshots prevent an old pharmacy/period from flashing when a filter changes.
  const requestKey = `${productId}:${pharmacyId || 'all'}:${year}:${month}:${retry}`;
  const current = snapshot?.key === requestKey ? snapshot : null;

  useEffect(() => {
    const controller = new AbortController();

    void getPharmacyOrderSalesStatistics(
      {
        ...getSalesPeriodDateRange(year, month),
        productId,
        pharmacyId: pharmacyId || undefined,
        scope: 'owner',
      },
      { signal: controller.signal }
    )
      .then((data) => {
        if (!controller.signal.aborted)
          setSnapshot({ key: requestKey, data, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setSnapshot({ key: requestKey, data: null, error: true });
      });

    return () => controller.abort();
  }, [productId, pharmacyId, year, month, retry, requestKey]);

  const contentState = !current ? (
    <ProfileResourceState
      variant="loading"
      title="Loading product sales"
      description="Sales for the selected product and pharmacies are being loaded."
    />
  ) : current.error || !current.data ? (
    <ProfileResourceState
      variant="error"
      title="Product sales could not be loaded"
      description="Sales are temporarily unavailable for the selected pharmacies."
      retryLabel="Retry product sales"
      onRetry={() => setRetry((value) => value + 1)}
    />
  ) : null;

  return (
    <div className={css.sectionStack}>
      <div className={css.pharmacySelector}>
        <OwnedPharmacySearch
          id="own-product-statistics-pharmacy-search"
          label="Select pharmacy"
          value={pharmacyId}
          onChange={(value) => updateFilters({ pharmacyId: value })}
          explainStatistics
        />
      </div>

      <SalesValueChart
        data={current?.data ?? DEFAULT_ORDER_SALES_STATISTICS}
        kicker="Sales chart"
        title="Product sales across your pharmacies"
        description="Successful sales of this product for the selected pharmacies and period, including historical orders."
        contentState={contentState}
        headerContent={
          <SalesChartFilterToolbar
            hasFilters={Boolean(
              filters.year || filters.month !== 'all' || filters.pharmacyId
            )}
            onReset={() => router.push(base, { scroll: false })}
          >
            <SalesPeriodFilters
              idPrefix={`product-${productId}-sales`}
              year={year}
              month={month}
              onYearChange={(value) => updateFilters({ year: value })}
              onMonthChange={(value) => updateFilters({ year, month: value })}
            />
          </SalesChartFilterToolbar>
        }
      />
    </div>
  );
}
