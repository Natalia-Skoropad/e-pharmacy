import Link from 'next/link';
import { useMemo } from 'react';

import {
  DataTable,
  StatusBadge,
  type DataTableColumn,
} from '@e-pharmacy/ui/common';

import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';

import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
  type PharmacyProductRow,
} from '@/lib/pharmacy/products';

import { getPharmacyProductPath } from '@/lib/pharmacy/routes';

import css from './OwnProductsTable.module.css';

//===================================================================

type OwnProductsTableProps = Readonly<{
  products: PharmacyProductRow[];
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
        title: <TableHeader parts={['Added', 'date']} />,
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
        title: 'Article',
        render: (product) => (
          <ProductLink product={product}>{product.article}</ProductLink>
        ),
      },
      {
        key: 'name',
        title: 'Name',
        render: (product) => (
          <ProductLink product={product}>{product.name}</ProductLink>
        ),
      },
      {
        key: 'category',
        title: 'Category',
        render: (product) => PRODUCT_CATEGORY_LABELS[product.category],
      },
      {
        key: 'stockQuantity',
        title: <TableHeader parts={['Stock', 'quantity']} />,
        render: (product) => product.stockQuantity,
      },
      {
        key: 'reservedQuantity',
        title: <TableHeader parts={['Reserved', 'quantity']} />,
        render: (product) => product.reservedQuantity,
      },
      {
        key: 'availableQuantity',
        title: <TableHeader parts={['Available', 'quantity']} />,
        render: (product) => product.availableQuantity,
      },
      {
        key: 'currentPrice',
        title: <TableHeader parts={['Current', 'price']} />,
        render: (product) => formatPrice(product.currentPrice),
      },
      {
        key: 'status',
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
      minWidth={1280}
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
