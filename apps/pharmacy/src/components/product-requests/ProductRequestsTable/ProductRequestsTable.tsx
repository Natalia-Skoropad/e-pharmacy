import { useMemo } from 'react';

import {
  DataTable,
  StatusBadge,
  TextActionButton,
  type DataTableColumn,
} from '@e-pharmacy/ui/common';

import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/types/products';
import { formatShortDate } from '@e-pharmacy/utils/formatters';

import {
  PRODUCT_REQUEST_STATUS_LABELS,
  type PharmacyProductRequestRow,
} from '@/lib/product-requests/product-requests';

import {
  getPharmacyAllProductPath,
  getPharmacyRequestPath,
} from '@/lib/layout/routes';

import css from './ProductRequestsTable.module.css';

//===================================================================

type ProductRequestsTableProps = Readonly<{
  requests: PharmacyProductRequestRow[];
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

function getProductHref(request: PharmacyProductRequestRow) {
  return request.status === 'approved' && request.productId
    ? getPharmacyAllProductPath(request.productId)
    : null;
}

//===================================================================

function ProductRequestsTable({
  requests,
  emptyMessage,
  isLoading = false,
}: ProductRequestsTableProps) {
  const columns = useMemo<Array<DataTableColumn<PharmacyProductRequestRow>>>(
    () => [
      {
        key: 'createdAt',
        title: <TableHeader parts={['Created', 'date']} />,
        render: (request) => (
          <time dateTime={request.createdAt}>
            {formatShortDate(request.createdAt)}
          </time>
        ),
      },
      {
        key: 'requestNumber',
        title: <TableHeader parts={['Request', 'number']} />,
        render: (request) => (
          <TextActionButton href={getPharmacyRequestPath(request.id)}>
            {request.requestNumber}
          </TextActionButton>
        ),
      },
      {
        key: 'productArticle',
        title: <TableHeader parts={['Product', 'article']} />,
        render: (request) => {
          const productHref = getProductHref(request);

          return productHref ? (
            <TextActionButton href={productHref}>
              {request.productArticle}
            </TextActionButton>
          ) : (
            <TextActionButton className={css.disabledAction} disabled>
              {request.productArticle}
            </TextActionButton>
          );
        },
      },
      {
        key: 'productName',
        title: <TableHeader parts={['Product', 'name']} />,
        render: (request) => {
          const productHref = getProductHref(request);

          return productHref ? (
            <TextActionButton href={productHref}>
              {request.productName}
            </TextActionButton>
          ) : (
            <TextActionButton className={css.disabledAction} disabled>
              {request.productName}
            </TextActionButton>
          );
        },
      },
      {
        key: 'category',
        title: <TableHeader parts={['Product', 'category']} />,
        render: (request) => PRODUCT_CATEGORY_LABELS[request.category],
      },
      {
        key: 'status',
        title: <TableHeader parts={['Request', 'status']} />,
        render: (request) => (
          <StatusBadge
            status={request.status}
            label={PRODUCT_REQUEST_STATUS_LABELS[request.status]}
          />
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      items={requests}
      getItemKey={(request) => String(request.id)}
      isLoading={isLoading}
      minWidth={0}
      labels={{
        loading: 'Loading requests...',
        empty: emptyMessage,
      }}
    />
  );
}

export default ProductRequestsTable;
export { ProductRequestsTable };
export type { PharmacyProductRequestRow };
