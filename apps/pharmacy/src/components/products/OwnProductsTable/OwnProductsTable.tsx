import { useMemo } from 'react';

import { Button, TextActionButton } from '@e-pharmacy/ui/primitives';

import {
  DataTable,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { getPharmacyProductPath } from '@e-pharmacy/config/pharmacy';
import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/products';
import type { EntityId } from '@e-pharmacy/types/primitives';
import { formatAmount } from '@e-pharmacy/utils/money';

import {
  PRODUCT_STATUS_LABELS,
  type PharmacyProductRow,
} from '@/lib/products/products';

import { getProductImageSrc } from '@/lib/products/product-images';

import { StatusBadge } from '@/components/common/StatusPresentation';

import css from './OwnProductsTable.module.css';

//===================================================================

type OwnProductsTableProps = Readonly<{
  products: PharmacyProductRow[];
  emptyMessage: string;
  isLoading?: boolean;
  removingProductId?: EntityId | null;
  onRemoveProduct?: (product: PharmacyProductRow) => void;
}>;

//===================================================================

function OwnProductsTable({
  products,
  emptyMessage,
  isLoading = false,
  removingProductId = null,
  onRemoveProduct,
}: OwnProductsTableProps) {
  const columns = useMemo<Array<DataTableColumn<PharmacyProductRow>>>(
    () => [
      {
        key: 'addedAt',
        width: '100px',
        title: <TableHeaderTitle parts={['Added', 'date']} />,
        render: (product) =>
          product.addedAt ? <TableDateTime value={product.addedAt} /> : '—',
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
        title: <TableHeaderTitle parts={['Current', ' price, ', 'UAH']} />,
        render: (product) => formatAmount(product.currentPrice) ?? '—',
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
      {
        key: 'action',
        width: '130px',
        title: 'Action',
        render: (product) => (
          <Button
            className={css.removeButton}
            type="button"
            variant="secondary"
            size="sm"
            disabled={
              !onRemoveProduct ||
              product.hasRelatedOrders ||
              removingProductId === product.id
            }
            isLoading={removingProductId === product.id}
            loadingLabel="Removing..."
            onClick={() => onRemoveProduct?.(product)}
          >
            Remove
          </Button>
        ),
      },
    ],
    [onRemoveProduct, removingProductId]
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
