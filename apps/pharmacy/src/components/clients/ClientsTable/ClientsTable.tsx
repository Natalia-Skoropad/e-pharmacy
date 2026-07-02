import Link from 'next/link';
import { useMemo } from 'react';

import {
  DataTable,
  PictureUpload,
  StatusBadge,
  type DataTableColumn,
} from '@e-pharmacy/ui/common';

import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';

import type { PharmacyClientRow } from '@/lib/clients/clients';
import { getPharmacyClientPath } from '@/lib/layout/routes';

import css from './ClientsTable.module.css';

//===================================================================

type ClientsTableProps = Readonly<{
  clients: PharmacyClientRow[];
  emptyMessage: string;
  isLoading?: boolean;
}>;

//===================================================================

function TableHeader({ parts }: Readonly<{ parts: string[] }>) {
  return (
    <span className={css.headerTitle}>
      {parts.map((part) => (
        <span key={part}>{part}</span>
      ))}
    </span>
  );
}

//===================================================================

function formatInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'C';
}

//===================================================================

function ClientPhoto({ client }: Readonly<{ client: PharmacyClientRow }>) {
  return (
    <span className={css.photo} aria-label={`${client.name} photo`}>
      {client.photoUrl ? (
        <PictureUpload src={client.photoUrl} alt="" />
      ) : (
        <span aria-hidden="true">{formatInitials(client.name)}</span>
      )}
    </span>
  );
}

//===================================================================

function FirstOrderDate({ value }: Readonly<{ value: string }>) {
  if (!value) return 'Not specified';

  return <time dateTime={value}>{formatShortDate(value)}</time>;
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
        key: 'clientId',
        title: <TableHeader parts={['Client', 'ID']} />,
        render: (client) => client.id,
      },
      {
        key: 'photo',
        title: 'Photo',
        render: (client) => <ClientPhoto client={client} />,
      },
      {
        key: 'firstOrderAt',
        title: <TableHeader parts={['Order', 'date']} />,
        render: (client) => <FirstOrderDate value={client.firstOrderAt} />,
      },
      {
        key: 'name',
        title: 'Name',
        render: (client) => (
          <Link
            className={css.nameLink}
            href={getPharmacyClientPath(client.id)}
          >
            {client.name}
          </Link>
        ),
      },
      {
        key: 'email',
        title: 'Email',
        render: (client) => client.email,
      },
      {
        key: 'phone',
        title: 'Phone',
        render: (client) => client.phone,
      },
      {
        key: 'address',
        title: 'Address',
        render: (client) => client.address,
      },
      {
        key: 'successfulOrdersCount',
        title: <TableHeader parts={['Orders', 'count']} />,
        render: (client) => client.successfulOrdersCount,
      },
      {
        key: 'successfulOrdersAmount',
        title: <TableHeader parts={['Orders', 'amount']} />,
        render: (client) => formatPrice(client.successfulOrdersAmount),
      },
      {
        key: 'status',
        title: 'Status',
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
