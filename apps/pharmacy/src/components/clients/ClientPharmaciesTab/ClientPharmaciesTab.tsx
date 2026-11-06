'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';

import {
  TableDateTime,
  DataTable,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { formatAmount } from '@e-pharmacy/utils/money';

import { getOwnedPharmacyPath } from '@/lib/routes';

import {
  getClientPharmacies,
  type ClientPharmacyOrderSummary,
} from '@/lib/api/browser/clients.api';

//===================================================================

export function ClientPharmaciesTab({
  clientId,
}: Readonly<{ clientId: string }>) {
  const [resource, setResource] = useState<
    Readonly<{
      items: readonly ClientPharmacyOrderSummary[];
      status: 'loading' | 'success' | 'error';
    }>
  >({ items: [], status: 'loading' });

  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getClientPharmacies(clientId, { signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted)
          setResource({ items, status: 'success' });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResource({ items: [], status: 'error' });
      });

    return () => controller.abort();
  }, [clientId, retry]);

  const columns = useMemo<Array<DataTableColumn<ClientPharmacyOrderSummary>>>(
    () => [
      {
        key: 'name',
        title: <TableHeaderTitle parts={['Pharmacy', 'name']} />,

        render: (item) => (
          <TextActionButton href={getOwnedPharmacyPath(item.pharmacyId)}>
            {item.pharmacyName}
          </TextActionButton>
        ),
      },
      {
        key: 'pharmacyId',
        title: <TableHeaderTitle parts={['Pharmacy', 'ID']} />,

        render: (item) => (
          <TextActionButton href={getOwnedPharmacyPath(item.pharmacyId)}>
            {item.pharmacyId}
          </TextActionButton>
        ),
      },
      {
        key: 'firstOrderAt',
        title: <TableHeaderTitle parts={['First', 'order']} />,
        render: (item) => <TableDateTime value={item.firstOrderAt} />,
      },
      {
        key: 'lastOrderAt',
        title: <TableHeaderTitle parts={['Last', 'order']} />,
        render: (item) => <TableDateTime value={item.lastOrderAt} />,
      },
      {
        key: 'ordersCount',
        title: <TableHeaderTitle parts={['Orders', 'count']} />,
        render: (item) => item.ordersCount,
      },
      {
        key: 'successfulOrdersCount',
        title: <TableHeaderTitle parts={['Successful', 'orders']} />,
        render: (item) => item.successfulOrdersCount,
      },
      {
        key: 'successfulOrdersAmount',
        title: <TableHeaderTitle parts={['Orders', 'amount, ₴']} />,
        render: (item) => formatAmount(item.successfulOrdersAmount) ?? '—',
      },
    ],
    []
  );

  if (resource.status === 'error') {
    return (
      <ProfileResourceState
        variant="error"
        title="Client pharmacies could not be loaded"
        description="Try again to view pharmacies where this client placed orders."
        retryLabel="Try again"
        sideActionOnDesktop
        onRetry={() => {
          setResource({ items: [], status: 'loading' });
          setRetry((value) => value + 1);
        }}
      />
    );
  }

  if (resource.status === 'success' && resource.items.length === 0) {
    return (
      <ProfileResourceState
        variant="empty"
        icon={<Building2 size={28} aria-hidden="true" />}
        title="No pharmacies with orders"
        description="This client has not placed any orders in your pharmacies yet."
      />
    );
  }

  return (
    <DataTable
      ariaLabel="Pharmacies where this client placed orders"
      columns={columns}
      items={resource.items}
      getItemKey={(item) => item.pharmacyId}
      isLoading={resource.status === 'loading'}
      minWidth={900}
      labels={{
        loading: 'Loading client pharmacies...',
        empty: 'No pharmacies with orders',
      }}
    />
  );
}
