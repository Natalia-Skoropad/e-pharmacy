import type { DataTableColumn } from '@e-pharmacy/ui/data-display';

import {
  DataTable,
  TableDateTime,
  TableHeaderTitle,
  formatInitials,
} from '@e-pharmacy/ui/data-display';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { formatAmount } from '@e-pharmacy/utils/money';
import { PharmacyBlockSourceBadge } from '@e-pharmacy/ui/statistics';

import { buildOwnedPharmacyDetailUrl } from '@/lib/pharmacies/owned-pharmacy-url';
import type { ProductPharmacyRow } from '@/lib/products/own-product-pharmacies-data';

import css from './OwnProductPharmaciesTab.module.css';

//===================================================================

export function OwnProductPharmaciesTable({
  rows,
  loading,
  hasFilters,
}: Readonly<{
  rows: readonly ProductPharmacyRow[];
  loading: boolean;
  hasFilters: boolean;
}>) {
  const columns: DataTableColumn<ProductPharmacyRow>[] = [
    {
      key: 'date',
      title: <TableHeaderTitle parts={['Date', 'added']} />,
      render: ({ offer }) => <TableDateTime value={offer.createdAt} />,
    },
    {
      key: 'photo',
      title: <TableHeaderTitle parts={['Pharmacy', 'photo']} />,

      render: ({ pharmacy }) => (
        <TableImagePreview
          src={pharmacy.imageUrl}
          alt={`${pharmacy.name} photo`}
          fallback={formatInitials(pharmacy.name, 'P')}
          size={34}
        />
      ),
    },
    {
      key: 'id',
      title: <TableHeaderTitle parts={['Pharmacy', 'ID']} />,
      width: '116px',

      render: ({ pharmacy }) => (
        <TextActionButton
          className={css.pharmacyIdLink}
          href={buildOwnedPharmacyDetailUrl(pharmacy.id)}
        >
          {pharmacy.id}
        </TextActionButton>
      ),
    },
    {
      key: 'name',
      title: <TableHeaderTitle parts={['Pharmacy', 'name']} />,

      render: ({ pharmacy }) => (
        <TextActionButton
          className={css.pharmacyNameLink}
          href={buildOwnedPharmacyDetailUrl(pharmacy.id)}
        >
          {pharmacy.name}
        </TextActionButton>
      ),
    },
    {
      key: 'price',
      title: <TableHeaderTitle parts={['Current', 'price, ₴']} />,
      render: ({ offer }) => formatAmount(offer.price) ?? '—',
    },
    {
      key: 'updated',
      title: <TableHeaderTitle parts={['Last', 'updated']} />,
      render: ({ offer }) => <TableDateTime value={offer.updatedAt} />,
    },
    {
      key: 'inStock',
      title: 'In stock',
      render: ({ offer }) => offer.totalQuantity ?? '—',
    },
    {
      key: 'reserved',
      title: 'Reserved',
      render: ({ offer }) => offer.reservedQuantity ?? '—',
    },
    {
      key: 'available',
      title: 'Available',
      render: ({ offer }) => offer.availableQuantity,
    },
    {
      key: 'status',
      title: <TableHeaderTitle parts={['Pharmacy', 'status']} />,

      render: ({ pharmacy }) => (
        <span className={css.pharmacyStatusBadges}>
          <StatusBadge {...PHARMACY_STATUS_PRESENTATION[pharmacy.status]} />
          <PharmacyBlockSourceBadge
            status={pharmacy.status}
            blockSource={pharmacy.blockSource}
          />
          {pharmacy.reviewState === 'changes_requested' &&
          ['on_verification', 'on_moderation', 'on_reactivation'].includes(
            pharmacy.status
          ) ? (
            <StatusBadge label="Needs changes" tone="neutral" />
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      items={rows}
      isLoading={loading}
      getItemKey={({ pharmacy }) => pharmacy.id}
      minWidth={960}
      ariaLabel="Pharmacies with this product"
      labels={{
        loading: 'Loading product pharmacies...',
        empty: hasFilters
          ? 'No pharmacies match the selected filters.'
          : 'This product has not been added to your pharmacies yet.',
      }}
    />
  );
}
