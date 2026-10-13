'use client';

import { useEffect, useState } from 'react';

import type { OrderSalesStatistics } from '@e-pharmacy/types/orders';

import {
  getSalesPeriodDateRange,
  SalesPeriodFilters,
  SalesValueChart,
  type SalesPeriodMonth,
} from '@e-pharmacy/ui/charts';

import { Button, LoadingSpinner } from '@e-pharmacy/ui/primitives';

import { getAdminPharmacySalesStatistics } from '@/lib/api/browser/admin-pharmacy-detail.api';

import css from './PharmacyInformationTab.module.css';

//===================================================================

type SalesSnapshot = Readonly<{
  key: string;
  data: OrderSalesStatistics | null;
  error: boolean;
}>;

//===================================================================

/** Only the active Pharmacy information tab mounts this chart. */
export function PharmacySalesChart({ pharmacyId }: { pharmacyId: string }) {
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [month, setMonth] = useState<SalesPeriodMonth>('all');
  const [retry, setRetry] = useState(0);
  const [snapshot, setSnapshot] = useState<SalesSnapshot | null>(null);

  const key = `${pharmacyId}:${year}:${month}:${retry}`;
  const current = snapshot?.key === key ? snapshot : null;

  useEffect(() => {
    const controller = new AbortController();

    void getAdminPharmacySalesStatistics(
      pharmacyId,
      getSalesPeriodDateRange(year, month),
      { signal: controller.signal }
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
  }, [pharmacyId, year, month, retry, key]);

  if (!current) {
    return (
      <section
        className={css.salesLoading}
        aria-label="Sales value by product category"
      >
        <LoadingSpinner label="Loading sales chart" hideLabel />
      </section>
    );
  }

  if (current.error || !current.data) {
    return (
      <section
        className={css.salesError}
        aria-label="Sales value by product category"
      >
        <p>Sales statistics could not be loaded.</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setRetry((v) => v + 1)}
        >
          Retry sales statistics
        </Button>
      </section>
    );
  }

  return (
    <SalesValueChart
      key={`${pharmacyId}:${year}:${month}`}
      data={current.data}
      headerContent={
        <SalesPeriodFilters
          idPrefix="admin-pharmacy-sales"
          year={year}
          month={month}
          onYearChange={setYear}
          onMonthChange={setMonth}
          showAppliedPeriod
        />
      }
    />
  );
}
