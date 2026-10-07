'use client';

import { useMemo } from 'react';

import { USER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { AdminPharmacyOwnerListItem } from '@e-pharmacy/types/admin';

import {
  DataTable,
  formatInitials,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { buildAdminPharmacyOwnerDetailUrl } from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

import css from './PharmacyOwnersTable.module.css';

//===================================================================

type PharmacyOwnersTableProps = Readonly<{
  owners: readonly AdminPharmacyOwnerListItem[];
  emptyMessage: string;
  isLoading?: boolean;
}>;

//===================================================================

export function PharmacyOwnersTable({
  owners,
  emptyMessage,
  isLoading = false,
}: PharmacyOwnersTableProps) {
  const columns = useMemo<Array<DataTableColumn<AdminPharmacyOwnerListItem>>>(
    () => [
      {
        key: 'registeredAt',
        title: <TableHeaderTitle parts={['Registration', 'date']} />,
        width: '11%',
        render: (owner) => <TableDateTime value={owner.registeredAt} />,
      },
      {
        key: 'photo',
        title: <TableHeaderTitle parts={["Owner's", 'photo']} />,
        width: '7%',
        render: (owner) => (
          <TableImagePreview
            src={owner.pictureUrl}
            alt={`${owner.name} photo`}
            fallback={formatInitials(owner.name, 'O')}
          />
        ),
      },
      {
        key: 'id',
        title: <TableHeaderTitle parts={['Owner', 'ID']} />,
        width: '15%',
        render: (owner) => (
          <TextActionButton
            className={css.breakableLink}
            href={buildAdminPharmacyOwnerDetailUrl(owner.id)}
          >
            {owner.id}
          </TextActionButton>
        ),
      },
      {
        key: 'name',
        title: <TableHeaderTitle parts={["Owner's", 'name']} />,
        width: '13%',
        render: (owner) => (
          <TextActionButton href={buildAdminPharmacyOwnerDetailUrl(owner.id)}>
            {owner.name}
          </TextActionButton>
        ),
      },
      {
        key: 'email',
        title: 'Email',
        width: '13%',
        render: (owner) => (
          <span className={css.breakableText}>{owner.email}</span>
        ),
      },
      {
        key: 'phone',
        title: 'Phone',
        width: '10%',
        render: (owner) => owner.phone,
      },
      {
        key: 'operatingPharmaciesCount',
        title: <TableHeaderTitle parts={['Operating', 'pharmacies']} />,
        width: '10%',
        align: 'center',
        render: (owner) => owner.operatingPharmaciesCount,
      },
      {
        key: 'nonWorkingPharmaciesCount',
        title: <TableHeaderTitle parts={['Non-working', 'pharmacies']} />,
        width: '11%',
        align: 'center',
        render: (owner) => owner.nonWorkingPharmaciesCount,
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Account', 'status']} />,
        width: '10%',
        render: (owner) => (
          <StatusBadge {...USER_STATUS_PRESENTATION[owner.status]} />
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      items={owners}
      getItemKey={(owner) => owner.id}
      isLoading={isLoading}
      minWidth={1120}
      ariaLabel="Pharmacy owners"
      labels={{
        loading: 'Loading pharmacy owners...',
        empty: emptyMessage,
      }}
    />
  );
}

export default PharmacyOwnersTable;
