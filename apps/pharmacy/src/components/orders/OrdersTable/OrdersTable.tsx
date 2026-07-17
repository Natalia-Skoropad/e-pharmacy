import { useMemo } from 'react';

import {
  DataTable,
  formatInitials,
  TableDateTime,
  TableHeaderTitle,
  TableImagePreview,
  TextActionButton,
  type DataTableColumn,
} from '@e-pharmacy/ui/common';

import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { formatPrice } from '@e-pharmacy/utils/formatters';

import {
  DELIVERY_METHOD_LABELS,
  ORDER_CREATED_BY_LABELS,
  PAYMENT_METHOD_LABELS,
  type PharmacyOrderRow,
} from '@/lib/orders/orders';

import { getProductImageSrc } from '@/lib/products/product-images';

import {
  getPharmacyClientPath,
  getPharmacyOrderPath,
} from '@/lib/layout/routes';

//===================================================================

type OrdersTableProps = Readonly<{
  orders: PharmacyOrderRow[];
  emptyMessage: string;
  isLoading?: boolean;
}>;

//===================================================================

function truncateComment(value: string): string {
  const normalized = value.trim();

  if (!normalized) return '—';
  if (normalized.length <= 50) return normalized;

  return `${normalized.slice(0, 50)}...`;
}

//===================================================================

function OrdersTable({
  orders,
  emptyMessage,
  isLoading = false,
}: OrdersTableProps) {
  const columns = useMemo<Array<DataTableColumn<PharmacyOrderRow>>>(
    () => [
      {
        key: 'orderDate',
        title: <TableHeaderTitle parts={['Order', 'date']} />,
        render: (order) => <TableDateTime value={order.orderDate} />,
      },
      {
        key: 'orderNumber',
        title: <TableHeaderTitle parts={['Order', 'number']} />,
        render: (order) => (
          <TextActionButton href={getPharmacyOrderPath(order.id)}>
            {order.orderNumber}
          </TextActionButton>
        ),
      },
      {
        key: 'clientPhoto',
        title: <TableHeaderTitle parts={['Client', 'photo']} />,
        render: (order) => (
          <TableImagePreview
            src={getProductImageSrc(order.clientPhotoUrl ?? undefined)}
            alt={`${order.client} photo`}
            fallback={formatInitials(order.client, 'C')}
          />
        ),
      },
      {
        key: 'client',
        title: <TableHeaderTitle parts={['Client', 'name']} />,
        render: (order) =>
          order.clientId ? (
            <TextActionButton href={getPharmacyClientPath(order.clientId)}>
              {order.client}
            </TextActionButton>
          ) : (
            order.client
          ),
      },
      {
        key: 'deliveryMethod',
        title: <TableHeaderTitle parts={['Delivery', 'method']} />,
        render: (order) => DELIVERY_METHOD_LABELS[order.deliveryMethod],
      },
      {
        key: 'paymentMethod',
        title: <TableHeaderTitle parts={['Payment', 'method']} />,
        render: (order) => PAYMENT_METHOD_LABELS[order.paymentMethod],
      },
      {
        key: 'clientComment',
        title: <TableHeaderTitle parts={['Client', 'comment']} />,
        render: (order) => truncateComment(order.clientComment),
      },
      {
        key: 'totalQuantity',
        title: <TableHeaderTitle parts={['Total', 'quantity']} />,
        render: (order) => order.totalQuantity,
      },
      {
        key: 'totalAmount',
        title: <TableHeaderTitle parts={['Total ', 'amount, ', 'UAH']} />,
        render: (order) => formatPrice(order.totalAmount).replace(' UAH', ''),
      },
      {
        key: 'createdByType',
        title: <TableHeaderTitle parts={['Created', 'by']} />,
        render: (order) => ORDER_CREATED_BY_LABELS[order.createdByType],
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Order', 'status']} />,
        render: (order) => <StatusBadge status={order.status} />,
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      items={orders}
      getItemKey={(order) => String(order.id)}
      isLoading={isLoading}
      minWidth={0}
      labels={{
        loading: 'Loading orders...',
        empty: emptyMessage,
      }}
    />
  );
}

export default OrdersTable;
export { OrdersTable };
export type { PharmacyOrderRow };
