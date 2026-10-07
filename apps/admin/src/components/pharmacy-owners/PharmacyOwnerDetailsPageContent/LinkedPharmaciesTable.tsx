'use client';

import { useMemo } from 'react';

import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { AdminPharmacyOwnerPharmacySummary } from '@e-pharmacy/types/admin';

import {
  DataTable,
  formatInitials,
  RatingSummary,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { formatMoney, formatPharmacyLocation } from '@e-pharmacy/utils';

import { ADMIN_ROUTES } from '@/lib/routes';

import css from './PharmacyOwnerDetailsPageContent.module.css';

//===================================================================

type LinkedPharmaciesTableProps = Readonly<{
  pharmacies: readonly AdminPharmacyOwnerPharmacySummary[];
  emptyMessage: string;
  isLoading?: boolean;
}>;

//===================================================================

function buildPharmacyDetailsHref(pharmacyId: string): string {
  return `${ADMIN_ROUTES.PHARMACIES}/${encodeURIComponent(pharmacyId)}`;
}

//===================================================================

export function LinkedPharmaciesTable({
  pharmacies,
  emptyMessage,
  isLoading = false,
}: LinkedPharmaciesTableProps) {
  const columns = useMemo<
    Array<DataTableColumn<AdminPharmacyOwnerPharmacySummary>>
  >(
    () => [
      {
        key: 'createdAt',
        title: <TableHeaderTitle parts={['Created', 'date']} />,
        render: (pharmacy) => <TableDateTime value={pharmacy.createdAt} />,
      },
      {
        key: 'photo',
        title: <TableHeaderTitle parts={['Pharmacy', 'photo']} />,
        render: (pharmacy) => (
          <TableImagePreview
            src={pharmacy.imageUrl}
            alt={`${pharmacy.name} photo`}
            fallback={formatInitials(pharmacy.name, 'P')}
          />
        ),
      },
      {
        key: 'id',
        title: <TableHeaderTitle parts={['Pharmacy', 'ID']} />,
        render: (pharmacy) => (
          <TextActionButton
            className={css.breakableLink}
            href={buildPharmacyDetailsHref(pharmacy.id)}
          >
            {pharmacy.id}
          </TextActionButton>
        ),
      },
      {
        key: 'name',
        title: <TableHeaderTitle parts={['Pharmacy', 'name']} />,
        render: (pharmacy) => (
          <TextActionButton href={buildPharmacyDetailsHref(pharmacy.id)}>
            {pharmacy.name}
          </TextActionButton>
        ),
      },
      {
        key: 'email',
        title: 'Email',
        render: (pharmacy) => (
          <span className={css.breakableText}>{pharmacy.email || '—'}</span>
        ),
      },
      {
        key: 'phone',
        title: 'Phone',
        render: (pharmacy) => pharmacy.phone || '—',
      },
      {
        key: 'address',
        title: 'Address',
        render: (pharmacy) => (
          <span className={css.addressCell}>
            {formatPharmacyLocation(pharmacy.location) || '—'}
          </span>
        ),
      },
      {
        key: 'activeClientsCount',
        title: <TableHeaderTitle parts={['Active', 'clients']} />,
        render: (pharmacy) => pharmacy.activeClientsCount,
      },
      {
        key: 'successfulOrdersCount',
        title: <TableHeaderTitle parts={['Successful', 'orders']} />,
        render: (pharmacy) => pharmacy.successfulOrdersCount,
      },
      {
        key: 'successfulRevenue',
        title: <TableHeaderTitle parts={['Successful', 'revenue']} />,
        render: (pharmacy) => formatMoney(pharmacy.successfulRevenue) ?? '—',
      },
      {
        key: 'rating',
        title: <TableHeaderTitle parts={['Rating /', 'reviews']} />,
        render: (pharmacy) => (
          <RatingSummary
            rating={pharmacy.rating}
            reviewsCount={pharmacy.reviewsCount}
            size="sm"
          />
        ),
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Pharmacy', 'status']} />,
        render: (pharmacy) => (
          <StatusBadge {...PHARMACY_STATUS_PRESENTATION[pharmacy.status]} />
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      items={pharmacies}
      getItemKey={(pharmacy) => pharmacy.id}
      isLoading={isLoading}
      minWidth={0}
      ariaLabel="Linked pharmacies"
      labels={{
        loading: 'Loading linked pharmacies...',
        empty: emptyMessage,
      }}
    />
  );
}

export default LinkedPharmaciesTable;
