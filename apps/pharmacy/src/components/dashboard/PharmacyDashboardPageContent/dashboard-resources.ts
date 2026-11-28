'use client';

import { useEffect, useState } from 'react';

import {
  getSalesPeriodDateRange,
  type SalesPeriodMonth,
} from '@e-pharmacy/ui/charts';

import {
  getPharmacyOrders,
  getPharmacyClients,
  getPharmacyOrderSalesStatistics,
} from '@/lib/api/browser';

import { getOwnerOwnProducts } from '@/lib/api/browser/owner-own-products.api';
import { getOwnerCatalogStatistics } from '@/lib/api/browser/owner-all-products.api';
import { getPharmacyProductRequestStatistics } from '@/lib/product-requests/product-request-statistics';

//===================================================================

export const CURRENT_YEAR = String(new Date().getFullYear());

//===================================================================

type Loader<T> = (
  pharmacyId: string,
  year: string,
  month: SalesPeriodMonth,
  signal: AbortSignal
) => Promise<T>;

//===================================================================

// Each block owns its request, retry and keyed snapshot. An old pharmacy or
// period response cannot replace the current selection, even after navigation.
export function useDashboardResource<T>(
  loader: Loader<T>,
  pharmacyId: string,
  year = CURRENT_YEAR,
  month: SalesPeriodMonth = 'all'
) {
  const [retry, setRetry] = useState(0);

  const [snapshot, setSnapshot] = useState<{
    key: string;
    data: T | null;
    error: boolean;
  } | null>(null);

  const key = JSON.stringify([pharmacyId, year, month, retry]);
  const current = snapshot?.key === key ? snapshot : null;

  useEffect(() => {
    const controller = new AbortController();

    void loader(pharmacyId, year, month, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setSnapshot({ key, data, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setSnapshot({ key, data: null, error: true });
      });

    return () => controller.abort();
  }, [loader, pharmacyId, year, month, key]);

  return {
    data: current?.data ?? null,
    isLoading: !current,
    error: current?.error ?? false,
    retry: () => setRetry((value) => value + 1),
  };
}

//===================================================================

function ownerScope(pharmacyId: string) {
  return { scope: 'owner' as const, pharmacyId: pharmacyId || undefined };
}

//===================================================================

export async function loadOrders(
  pharmacyId: string,
  year: string,
  month: SalesPeriodMonth,
  signal: AbortSignal
) {
  const { dateFrom, dateTo } = getSalesPeriodDateRange(year, month);

  return (
    await getPharmacyOrders(
      { ...ownerScope(pharmacyId), page: 1, perPage: 1, dateFrom, dateTo },
      { signal }
    )
  ).statistics;
}

//===================================================================

export async function loadSales(
  pharmacyId: string,
  year: string,
  month: SalesPeriodMonth,
  signal: AbortSignal
) {
  return getPharmacyOrderSalesStatistics(
    { ...ownerScope(pharmacyId), ...getSalesPeriodDateRange(year, month) },
    { signal }
  );
}

//===================================================================

export async function loadClients(
  pharmacyId: string,
  _year: string,
  _month: SalesPeriodMonth,
  signal: AbortSignal
) {
  return (
    await getPharmacyClients(
      { ...ownerScope(pharmacyId), page: 1, perPage: 1 },
      { signal }
    )
  ).statistics;
}

//===================================================================

export async function loadOwnProducts(
  pharmacyId: string,
  _year: string,
  _month: SalesPeriodMonth,
  signal: AbortSignal
) {
  return (
    await getOwnerOwnProducts(
      { pharmacyId: pharmacyId || undefined, page: 1, perPage: 1 },
      { signal }
    )
  ).statistics;
}

//===================================================================

export async function loadAllProducts(
  _pharmacyId: string,
  _year: string,
  _month: SalesPeriodMonth,
  signal: AbortSignal
) {
  return getOwnerCatalogStatistics({ signal });
}

//===================================================================

export async function loadRequests(
  _pharmacyId: string,
  _year: string,
  _month: SalesPeriodMonth,
  signal: AbortSignal
) {
  return getPharmacyProductRequestStatistics({ signal });
}
