import { useMemo } from 'react';

import {
  DataTable,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { PRODUCT_REQUEST_STATUS_LABELS } from '@e-pharmacy/config/product-requests';
import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/products';
import type { ProductRequestRowViewModel } from '@/lib/product-requests/product-requests';

import {
  getPharmacyAllProductPath,
  getPharmacyRequestPath,
} from '@e-pharmacy/config/pharmacy';

import { getProductImageSrc } from '@/lib/products/product-images';

import { StatusBadge } from '@/components/common/StatusPresentation';

import css from './ProductRequestsTable.module.css';

//===================================================================

type ProductRequestsTableProps = Readonly<{
  requests: ProductRequestRowViewModel[];
  emptyMessage: string;
  isLoading?: boolean;
}>;

//===================================================================

function getProductHref(request: ProductRequestRowViewModel) {
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
  const columns = useMemo<Array<DataTableColumn<ProductRequestRowViewModel>>>(
    () => [
      {
        key: 'createdAt',
        title: <TableHeaderTitle parts={['Created', 'date']} />,
        render: (request) => <TableDateTime value={request.createdAt} />,
      },
      {
        key: 'requestNumber',
        title: <TableHeaderTitle parts={['Request', 'number']} />,
        render: (request) => (
          <TextActionButton href={getPharmacyRequestPath(request.id)}>
            {request.requestNumber}
          </TextActionButton>
        ),
      },
      {
        key: 'productPhoto',
        title: <TableHeaderTitle parts={['Product', 'photo']} />,
        render: (request) => (
          <TableImagePreview
            src={getProductImageSrc(request.productImageUrl)}
            alt={`${request.productName} photo`}
            fallback={request.productName.charAt(0)}
          />
        ),
      },
      {
        key: 'productArticle',
        title: <TableHeaderTitle parts={['Product', 'article']} />,
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
        title: <TableHeaderTitle parts={['Product', 'name']} />,
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
        title: <TableHeaderTitle parts={['Product', 'category']} />,
        render: (request) =>
          request.category === 'other' && request.customCategory
            ? request.customCategory
            : PRODUCT_CATEGORY_LABELS[request.category],
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Request', 'status']} />,
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
