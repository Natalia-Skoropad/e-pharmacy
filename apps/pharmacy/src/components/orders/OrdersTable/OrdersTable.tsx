import { useMemo } from 'react';

import {
  DataTable,
  StatusBadge,
  type DataTableColumn,
} from '@e-pharmacy/ui/common';

import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';

//===================================================================

export type PharmacyOrderRow = Readonly<{
  id: string;
  orderNumber: string;
  orderDate: string;
  client: string;
  deliveryMethod: string;
  paymentMethod: string;
  clientComment: string;
  totalQuantity: number;
  totalAmount: number;
  status: 'new' | 'in_progress' | 'successful' | 'rejected';
}>;

type OrdersTableProps = Readonly<{
  orders: PharmacyOrderRow[];
  emptyMessage: string;
}>;

//===================================================================

function OrdersTable({ orders, emptyMessage }: OrdersTableProps) {
  const columns = useMemo<Array<DataTableColumn<PharmacyOrderRow>>>(
    () => [
      {
        key: 'orderNumber',
        title: 'Order number',
        render: (order) => order.orderNumber,
      },
      {
        key: 'orderDate',
        title: 'Order date',
        render: (order) => <time dateTime={order.orderDate}>{formatShortDate(order.orderDate)}</time>,
      },
      {
        key: 'client',
        title: 'Client',
        render: (order) => order.client,
      },
      {
        key: 'deliveryMethod',
        title: 'Delivery method',
        render: (order) => order.deliveryMethod,
      },
      {
        key: 'paymentMethod',
        title: 'Payment method',
        render: (order) => order.paymentMethod,
      },
      {
        key: 'clientComment',
        title: 'Client comment',
        render: (order) => order.clientComment || '—',
      },
      {
        key: 'totalQuantity',
        title: 'Total quantity',
        align: 'center',
        render: (order) => order.totalQuantity,
      },
      {
        key: 'totalAmount',
        title: 'Total amount',
        align: 'right',
        render: (order) => formatPrice(order.totalAmount),
      },
      {
        key: 'status',
        title: 'Status',
        render: (order) => <StatusBadge status={order.status} />,
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      items={orders}
      getItemKey={(order) => order.id}
      minWidth={1280}
      labels={{ empty: emptyMessage }}
    />
  );
}

export default OrdersTable;
export { OrdersTable };
