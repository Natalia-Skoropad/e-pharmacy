import { useMemo } from 'react';

import {
  DataTable,
  InfoTooltip,
  formatInitials,
  TableDateTime,
  TableHeaderTitle,
  TableImagePreview,
  TextActionButton,
  type DataTableColumn,
} from '@e-pharmacy/ui/common';

import { getPharmacyClientPath } from '@e-pharmacy/config/pharmacy';
import { formatAmount } from '@e-pharmacy/utils/money';

import type { PharmacyClientRow } from '@/lib/clients/clients';
import { getProductImageSrc } from '@/lib/products/product-images';

import { StatusBadge } from '@/components/common/StatusPresentation';

import css from './ClientsTable.module.css';

//===================================================================

type ClientsTableProps = Readonly<{
  clients: PharmacyClientRow[];
  emptyMessage: string;
  isLoading?: boolean;
}>;

//===================================================================

function FirstOrderDate({ value }: Readonly<{ value: string }>) {
  if (!value) return 'Not specified';

  return <TableDateTime value={value} />;
}

//===================================================================

function ClientsTable({
  clients,
  emptyMessage,
  isLoading = false,
}: ClientsTableProps) {
  const columns = useMemo<Array<DataTableColumn<PharmacyClientRow>>>(
    () => [
      {
        key: 'firstOrderAt',
        title: <TableHeaderTitle parts={['Client', 'added']} />,
        render: (client) => <FirstOrderDate value={client.firstOrderAt} />,
      },
      {
        key: 'photo',
        title: <TableHeaderTitle parts={['Client', 'photo']} />,
        render: (client) => (
          <TableImagePreview
            src={getProductImageSrc(client.photoUrl ?? undefined)}
            alt={`${client.name} photo`}
            fallback={formatInitials(client.name, 'C')}
          />
        ),
      },
      {
        key: 'clientId',
        title: <TableHeaderTitle parts={['Client', 'ID']} />,
        render: (client) => (
          <TextActionButton
            className={css.breakableLink}
            href={getPharmacyClientPath(client.id)}
          >
            {client.id}
          </TextActionButton>
        ),
      },
      {
        key: 'name',
        title: <TableHeaderTitle parts={['Client', 'name']} />,
        render: (client) => (
          <TextActionButton href={getPharmacyClientPath(client.id)}>
            {client.name}
          </TextActionButton>
        ),
      },
      {
        key: 'email',
        title: <TableHeaderTitle parts={['Client', 'email']} />,
        render: (client) => (
          <span className={css.breakableText}>{client.email || '—'}</span>
        ),
      },
      {
        key: 'phone',
        title: <TableHeaderTitle parts={['Client', 'phone']} />,
        render: (client) => client.phone || '—',
      },
      {
        key: 'address',
        title: <TableHeaderTitle parts={['Client', 'address']} />,
        render: (client) => client.address || '—',
      },
      {
        key: 'successfulOrdersCount',
        title: (
          <span className={css.headerWithHelp}>
            <TableHeaderTitle parts={['Orders', 'count']} />
            <InfoTooltip
              label="How are order totals calculated?"
              title="Successful orders only"
            >
              Orders count is the number of successful orders. Orders amount is
              the total value of all successful orders for this client.
            </InfoTooltip>
          </span>
        ),
        render: (client) => client.successfulOrdersCount,
      },
      {
        key: 'successfulOrdersAmount',
        title: <TableHeaderTitle parts={['Orders', ' amount, ', 'UAH']} />,
        render: (client) => formatAmount(client.successfulOrdersAmount) ?? '—',
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Client', 'status']} />,
        render: (client) => <StatusBadge status={client.status} />,
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      items={clients}
      getItemKey={(client) => String(client.id)}
      isLoading={isLoading}
      minWidth={0}
      labels={{
        loading: 'Loading clients...',
        empty: emptyMessage,
      }}
    />
  );
}

export default ClientsTable;
export { ClientsTable };
export type { PharmacyClientRow };
