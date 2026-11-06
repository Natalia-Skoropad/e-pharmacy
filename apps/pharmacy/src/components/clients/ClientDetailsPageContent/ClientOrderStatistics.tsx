'use client';

import { useEffect, useState } from 'react';

import type { OrderStatisticsCounts } from '@e-pharmacy/types/orders';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { StatsLoadingSkeleton } from '@e-pharmacy/ui/statistics';

import { getPharmacyClientOrderStatistics } from '@/lib/api/browser/clients.api';
import { OrderStatistics } from '@/components/statistics';

import css from './ClientDetailsPageContent.module.css';

//===================================================================

export function ClientOrderStatistics({
  clientId,
}: Readonly<{ clientId: string }>) {
  const [retry, setRetry] = useState(0);

  const [snapshot, setSnapshot] = useState<Readonly<{
    key: string;
    data: OrderStatisticsCounts | null;
    error: boolean;
  }> | null>(null);

  const key = `${clientId}:${retry}`;
  const current = snapshot?.key === key ? snapshot : null;

  useEffect(() => {
    const controller = new AbortController();

    void getPharmacyClientOrderStatistics(clientId, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted)
          setSnapshot({ key, data, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setSnapshot({ key, data: null, error: true });
      });

    return () => controller.abort();
  }, [clientId, key, retry]);

  if (!current) {
    return (
      <StatsLoadingSkeleton
        className={css.orderStatistics}
        count={4}
        columns={4}
        tabletColumns={2}
        label="Loading client order statistics"
      />
    );
  }

  if (current.error || !current.data) {
    return (
      <ProfileResourceState
        variant="error"
        title="Client order statistics could not be loaded"
        description="Order statistics are temporarily unavailable. Please try again."
        retryLabel="Try again"
        sideActionOnDesktop
        onRetry={() => setRetry((value) => value + 1)}
      />
    );
  }

  return (
    <OrderStatistics counts={current.data} className={css.orderStatistics} />
  );
}
