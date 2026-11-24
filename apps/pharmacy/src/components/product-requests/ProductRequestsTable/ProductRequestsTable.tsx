import { useMemo } from 'react';

import {
  DataTable,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { PRODUCT_REQUEST_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';

import type { ProductRequestRowViewModel } from '@/lib/product-requests/product-requests';

import {
  getPharmacyAllProductPath,
  getPharmacyRequestPath,
} from '@/lib/routes';

import { getProductImageSrc } from '@/lib/products/product-images';

import { ProductRequestCategory } from '../ProductRequestCategory';

import css from './ProductRequestsTable.module.css';

//===================================================================

type ProductRequestsTableProps = Readonly<{
  requests: ProductRequestRowViewModel[];
  categoryDirectory: readonly ProductCategoryReference[];
  emptyMessage: string;
  isLoading?: boolean;
}>;

//===================================================================

function getProductHref(request: ProductRequestRowViewModel) {
  return request.productId
    ? getPharmacyAllProductPath(request.productId)
    : null;
}

//===================================================================

function ProductRequestsTable({
  requests,
  categoryDirectory,
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
          const href = getProductHref(request);

          return href ? (
            <TextActionButton href={href}>
              {request.productArticle || '—'}
            </TextActionButton>
          ) : (
            <TextActionButton className={css.disabledAction} disabled>
              {request.productArticle || '—'}
            </TextActionButton>
          );
        },
      },
      {
        key: 'productName',
        width: '25%',
        title: <TableHeaderTitle parts={['Product', 'name']} />,

        render: (request) => {
          const href = getProductHref(request);

          return href ? (
            <TextActionButton className={css.breakableLink} href={href}>
              {request.productName}
            </TextActionButton>
          ) : (
            <TextActionButton
              className={`${css.disabledAction} ${css.breakableLink}`}
              disabled
            >
              {request.productName}
            </TextActionButton>
          );
        },
      },
      {
        key: 'category',
        title: <TableHeaderTitle parts={['Product', 'category']} />,

        render: (request) => (
          <ProductRequestCategory
            request={request}
            categoryDirectory={categoryDirectory}
          />
        ),
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Request', 'status']} />,

        render: (request) => (
          <span className={css.statusCell}>
            <StatusBadge
              {...PRODUCT_REQUEST_STATUS_PRESENTATION[request.status]}
            />
            {request.status === 'rejected' ? (
              <StatusBadge
                label={
                  request.cancelledBy === 'owner'
                    ? 'Cancelled by owner'
                    : 'Cancelled by admin'
                }
                tone="neutral"
              />
            ) : null}
          </span>
        ),
      },
    ],
    [categoryDirectory]
  );

  return (
    <DataTable
      className={css.requestTable}
      columns={columns}
      items={requests}
      getItemKey={(request) => String(request.id)}
      isLoading={isLoading}
      minWidth={960}
      labels={{
        loading: 'Loading requests...',
        empty: emptyMessage,
      }}
    />
  );
}

export default ProductRequestsTable;
export { ProductRequestsTable };
