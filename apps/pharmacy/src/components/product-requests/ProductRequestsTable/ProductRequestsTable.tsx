import Link from 'next/link';
import { useMemo } from 'react';

import {
  DataTable,
  StatusBadge,
  type DataTableColumn,
} from '@e-pharmacy/ui/common';

import { formatShortDate } from '@e-pharmacy/utils/formatters';

import {
  PRODUCT_REQUEST_CATEGORY_LABELS,
  PRODUCT_REQUEST_STATUS_LABELS,
  type PharmacyProductRequestRow,
} from '@/lib/pharmacy/product-requests';

import { getPharmacyRequestPath } from '@/lib/pharmacy/routes';

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
        key: 'article',
        title: 'Article',
        render: (request) => request.article,
      },
      {
        key: 'name',
        title: 'Name',
        render: (request) => (
          <Link
            className={css.nameLink}
            href={getPharmacyRequestPath(request.id)}
          >
            {request.name}
          </Link>
        ),
      },
      {
        key: 'category',
        title: 'Category',
        render: (request) => PRODUCT_REQUEST_CATEGORY_LABELS[request.category],
      },
      {
        key: 'status',
        title: 'Status',
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
      minWidth={760}
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
