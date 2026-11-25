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

import type { ProductRequestRowViewModel } from '@/lib/product-requests/admin-product-requests';
import { getProductRequestImageSrc } from '@/lib/product-requests/product-request-images';
import { buildAdminPharmacyOwnerDetailUrl } from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

import { useAdminAuthorization } from '@/providers/AdminAuthorizationProvider';
import { ADMIN_ROUTES } from '@/lib/routes';

import { canAdmin } from '@/lib/permissions/can-admin';
import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import { AdminProductRequestCategory } from './AdminProductRequestCategory';

import css from './AdminProductRequestsList.module.css';

//===================================================================

type ProductRequestsTableProps = Readonly<{
  requests: ProductRequestRowViewModel[];
  emptyMessage: string;
  isLoading?: boolean;
}>;

//===================================================================

function ProductRequestsTable({
  requests,
  emptyMessage,
  isLoading = false,
}: ProductRequestsTableProps) {
  const { access } = useAdminAuthorization();
  const mayViewOwner = canAdmin(access, ADMIN_PERMISSIONS.pharmacyOwners.view);

  const columns = useMemo<Array<DataTableColumn<ProductRequestRowViewModel>>>(
    () => [
      {
        key: 'createdAt',
        title: <TableHeaderTitle parts={['Created', 'date']} />,
        render: (request) => <TableDateTime value={request.createdAt} />,
      },
      {
        key: 'owner',
        width: '15%',
        title: <TableHeaderTitle parts={['Pharmacy', 'owner']} />,

        render: (request) =>
          request.owner ? (
            mayViewOwner ? (
              <TextActionButton
                className={css.breakableLink}
                href={buildAdminPharmacyOwnerDetailUrl(request.owner.id)}
              >
                {request.owner.name}
              </TextActionButton>
            ) : (
              <span className={css.breakableLink}>{request.owner.name}</span>
            )
          ) : (
            '—'
          ),
      },
      {
        key: 'requestNumber',
        title: <TableHeaderTitle parts={['Request', 'number']} />,
        width: '15%',

        render: (request) => (
          <TextActionButton
            className={css.breakableLink}
            href={`${ADMIN_ROUTES.PRODUCT_REQUESTS}/${request.id}`}
          >
            {request.requestNumber}
          </TextActionButton>
        ),
      },
      {
        key: 'productPhoto',
        title: <TableHeaderTitle parts={['Product', 'photo']} />,

        render: (request) => (
          <TableImagePreview
            src={getProductRequestImageSrc(request.productImageUrl)}
            alt={`${request.productName} photo`}
            fallback={request.productName.charAt(0)}
          />
        ),
      },
      {
        key: 'productArticle',
        title: <TableHeaderTitle parts={['Product', 'article']} />,

        render: (request) => (
          <span className={css.breakableLink}>
            {request.productArticle || '—'}
          </span>
        ),
      },
      {
        key: 'productName',
        width: '22%',
        title: <TableHeaderTitle parts={['Product', 'name']} />,

        render: (request) => (
          <span className={css.breakableLink}>{request.productName}</span>
        ),
      },
      {
        key: 'category',
        title: <TableHeaderTitle parts={['Product', 'category']} />,

        render: (request) => <AdminProductRequestCategory request={request} />,
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Request', 'status']} />,

        render: (request) => (
          <span className={css.statusCell}>
            <StatusBadge
              {...PRODUCT_REQUEST_STATUS_PRESENTATION[request.status]}
            />
            {request.status === 'on_moderation' &&
            request.reviewState === 'changes_requested' ? (
              <StatusBadge label="Needs changes" tone="neutral" />
            ) : null}
            {request.status === 'rejected' && request.cancelledBy ? (
              <StatusBadge
                label={
                  request.cancelledBy === 'owner'
                    ? 'Cancelled by owner'
                    : 'Cancelled by Admin'
                }
                tone="neutral"
              />
            ) : null}
          </span>
        ),
      },
    ],
    [mayViewOwner]
  );

  return (
    <DataTable
      className={css.requestTable}
      columns={columns}
      items={requests}
      getItemKey={(request) => String(request.id)}
      isLoading={isLoading}
      minWidth={960}
      ariaLabel="Product requests"
      labels={{
        loading: 'Loading requests...',
        empty: emptyMessage,
      }}
    />
  );
}

export default ProductRequestsTable;
export { ProductRequestsTable };
