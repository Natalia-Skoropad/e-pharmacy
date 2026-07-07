import { useMemo } from 'react';

import {
  DataTable,
  formatInitials,
  TableHeaderTitle,
  TableImagePreview,
  TextActionButton,
  type DataTableColumn,
} from '@e-pharmacy/ui/common';

import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';

import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  type PharmacyOrderRow,
} from '@/lib/orders/orders';

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
        render: (order) => (
          <time dateTime={order.orderDate}>
            {formatShortDate(order.orderDate)}
          </time>
        ),
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
            src={order.clientPhotoUrl ?? undefined}
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
        render: (order) => order.clientComment || '—',
      },
      {
        key: 'totalQuantity',
        title: <TableHeaderTitle parts={['Total', 'quantity']} />,
        render: (order) => order.totalQuantity,
      },
      {
        key: 'totalAmount',
        title: <TableHeaderTitle parts={['Total', 'amount']} />,
        render: (order) => formatPrice(order.totalAmount),
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
