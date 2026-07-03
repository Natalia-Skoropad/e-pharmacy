import Link from 'next/link';
import { useMemo } from 'react';

import {
  DataTable,
  StatusBadge,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/common';

import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/types/products';
import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';

import {
  PRODUCT_STATUS_LABELS,
  type PharmacyProductRow,
} from '@/lib/products/products';

import { getPharmacyProductPath } from '@/lib/layout/routes';

import css from './OwnProductsTable.module.css';

//===================================================================

type OwnProductsTableProps = Readonly<{
  products: PharmacyProductRow[];
  emptyMessage: string;
  isLoading?: boolean;
}>;

//===================================================================

function ProductLink({
  product,
  children,
}: Readonly<{
  product: PharmacyProductRow;
  children: string;
}>) {
  return (
    <Link className={css.productLink} href={getPharmacyProductPath(product.id)}>
      {children}
    </Link>
  );
}

//===================================================================

function OwnProductsTable({
  products,
  emptyMessage,
  isLoading = false,
}: OwnProductsTableProps) {
  const columns = useMemo<Array<DataTableColumn<PharmacyProductRow>>>(
    () => [
      {
        key: 'addedAt',
        width: '100px',
        title: <TableHeaderTitle parts={['Added', 'date']} />,
        render: (product) =>
          product.addedAt ? (
            <time dateTime={product.addedAt}>
              {formatShortDate(product.addedAt)}
            </time>
          ) : (
            '—'
          ),
      },
      {
        key: 'article',
        width: '80px',
        title: 'Article',
        render: (product) => (
          <ProductLink product={product}>{product.article}</ProductLink>
        ),
      },
      {
        key: 'name',
        width: '250px',
        title: 'Name',
        render: (product) => (
          <ProductLink product={product}>{product.name}</ProductLink>
        ),
      },
      {
        key: 'category',
        width: '70px',
        title: 'Category',
        render: (product) => PRODUCT_CATEGORY_LABELS[product.category],
      },
      {
        key: 'stockQuantity',
        width: '40px',
        title: <TableHeaderTitle parts={['Stock', 'quantity']} />,
        render: (product) => product.stockQuantity,
      },
      {
        key: 'reservedQuantity',
        width: '50px',
        title: <TableHeaderTitle parts={['Reserved', 'quantity']} />,
        render: (product) => product.reservedQuantity,
      },
      {
        key: 'availableQuantity',
        width: '50px',
        title: <TableHeaderTitle parts={['Available', 'quantity']} />,
        render: (product) => product.availableQuantity,
      },
      {
        key: 'currentPrice',
        width: '50px',
        title: <TableHeaderTitle parts={['Current', 'price']} />,
        render: (product) => formatPrice(product.currentPrice),
      },
      {
        key: 'status',
        width: '70px',
        title: 'Status',
        render: (product) => (
          <StatusBadge
            status={product.status}
            label={PRODUCT_STATUS_LABELS[product.status]}
          />
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      items={products}
      getItemKey={(product) => String(product.id)}
      isLoading={isLoading}
      minWidth={0}
      labels={{
        loading: 'Loading products...',
        empty: emptyMessage,
      }}
    />
  );
}

export default OwnProductsTable;
export { OwnProductsTable };
export type { PharmacyProductRow };
