import { useMemo } from 'react';

import {
  Button,
  DataTable,
  StatusBadge,
  TextActionButton,
  type DataTableColumn,
} from '@e-pharmacy/ui/common';

import type { EntityId, Product } from '@e-pharmacy/types';
import { formatShortDate } from '@e-pharmacy/utils/formatters';

import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
} from '@/lib/pharmacy/products';

import { getPharmacyAllProductPath } from '@/lib/pharmacy/routes';

import css from './AllProductsTable.module.css';

//===================================================================

type AllProductsTableProps = Readonly<{
  currentPharmacyId: EntityId | null;
  products: Product[];
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

function isProductAddedToCurrentPharmacy(
  product: Product,
  currentPharmacyId: EntityId | null
): boolean {
  if (!currentPharmacyId) return false;

  return product.offers.some(
    (offer) => String(offer.pharmacyId) === String(currentPharmacyId)
  );
}

//===================================================================

function getStatusLabel(product: Product): string {
  return product.status === 'new'
    ? 'New'
    : PRODUCT_STATUS_LABELS[product.status];
}

//===================================================================

function getActionLabel(product: Product, isAddedToCurrentPharmacy: boolean) {
  if (product.status === 'blocked') return 'Unavailable';
  if (isAddedToCurrentPharmacy) return 'Added to your pharmacy';

  return 'Add to pharmacy';
}

//===================================================================

function AllProductsTable({
  currentPharmacyId,
  products,
  emptyMessage,
  isLoading = false,
}: AllProductsTableProps) {
  const columns = useMemo<Array<DataTableColumn<Product>>>(
    () => [
      {
        key: 'createdAt',
        title: <TableHeader parts={['Created', 'date']} />,
        render: (product) =>
          product.createdAt ? (
            <time dateTime={product.createdAt}>
              {formatShortDate(product.createdAt)}
            </time>
          ) : (
            '—'
          ),
      },
      {
        key: 'article',
        title: 'Article',
        render: (product) => (
          <span className={css.muted}>{product.article}</span>
        ),
      },
      {
        key: 'name',
        title: 'Name',
        render: (product) => (
          <TextActionButton href={getPharmacyAllProductPath(product.id)}>
            {product.name}
          </TextActionButton>
        ),
      },
      {
        key: 'category',
        title: 'Category',
        render: (product) => PRODUCT_CATEGORY_LABELS[product.category],
      },
      {
        key: 'status',
        title: 'Status',
        render: (product) => (
          <StatusBadge
            status={product.status}
            label={getStatusLabel(product)}
          />
        ),
      },
      {
        key: 'addedToMyPharmacy',
        title: <TableHeader parts={['Added to', 'my pharmacy']} />,
        render: (product) =>
          isProductAddedToCurrentPharmacy(product, currentPharmacyId)
            ? 'Yes'
            : 'No',
      },
      {
        key: 'action',
        title: 'Action',
        render: (product) => {
          const isAddedToCurrentPharmacy = isProductAddedToCurrentPharmacy(
            product,
            currentPharmacyId
          );

          return (
            <Button type="button" size="sm" variant="secondary" disabled>
              {getActionLabel(product, isAddedToCurrentPharmacy)}
            </Button>
          );
        },
      },
    ],
    [currentPharmacyId]
  );

  return (
    <DataTable
      columns={columns}
      items={products}
      getItemKey={(product) => String(product.id)}
      isLoading={isLoading}
      minWidth={1120}
      labels={{
        loading: 'Loading products...',
        empty: emptyMessage,
      }}
    />
  );
}

export default AllProductsTable;
export { AllProductsTable };
export type { AllProductsTableProps };
