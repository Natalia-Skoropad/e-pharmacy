import { useMemo } from 'react';

import {
  DataTable,
  TableHeaderTitle,
  TableImagePreview,
  TextActionButton,
  type DataTableColumn,
} from '@e-pharmacy/ui/common';

import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/types/products';
import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';

import {
  PRODUCT_STATUS_LABELS,
  type PharmacyProductRow,
} from '@/lib/products/products';

import { getPharmacyProductPath } from '@/lib/layout/routes';
import { getProductImageSrc } from '@/lib/products/product-images';

//===================================================================

type OwnProductsTableProps = Readonly<{
  products: PharmacyProductRow[];
  emptyMessage: string;
  isLoading?: boolean;
}>;

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
        key: 'productPhoto',
        width: '80px',
        title: <TableHeaderTitle parts={['Product', 'photo']} />,
        render: (product) => (
          <TableImagePreview
            src={getProductImageSrc(product.imageUrl)}
            alt={`${product.name} photo`}
            fallback={product.name.charAt(0)}
          />
        ),
      },
      {
        key: 'article',
        width: '110px',
        title: <TableHeaderTitle parts={['Product', 'article']} />,
        render: (product) => (
          <TextActionButton href={getPharmacyProductPath(product.id)}>
            {product.article}
          </TextActionButton>
        ),
      },
      {
        key: 'name',
        width: '250px',
        title: <TableHeaderTitle parts={['Product', 'name']} />,
        render: (product) => (
          <TextActionButton href={getPharmacyProductPath(product.id)}>
            {product.name}
          </TextActionButton>
        ),
      },
      {
        key: 'category',
        width: '110px',
        title: <TableHeaderTitle parts={['Product', 'category']} />,
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
        width: '100px',
        title: <TableHeaderTitle parts={['Product', 'status']} />,
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
