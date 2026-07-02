import { useMemo } from 'react';

import {
  DataTable,
  StatusBadge,
  type DataTableColumn,
} from '@e-pharmacy/ui/common';

import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';

import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  type PharmacyOrderRow,
} from '@/lib/orders/orders';

import css from './OrdersTable.module.css';

//===================================================================

type OrdersTableProps = Readonly<{
  orders: PharmacyOrderRow[];
  emptyMessage: string;
  isLoading?: boolean;
}>;

//===================================================================

function TableHeader({
  first,
  second,
}: Readonly<{ first: string; second?: string }>) {
  return (
    <span className={css.headerTitle}>
      <span>{first}</span>
      {second ? <span>{second}</span> : null}
    </span>
  );
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
        key: 'orderNumber',
        title: <TableHeader first="Order" second="number" />,
        render: (order) => order.orderNumber,
      },
      {
        key: 'orderDate',
        title: <TableHeader first="Order" second="date" />,
        render: (order) => (
          <time dateTime={order.orderDate}>
            {formatShortDate(order.orderDate)}
          </time>
        ),
      },
      {
        key: 'client',
        title: 'Client',
        render: (order) => order.client,
      },
      {
        key: 'deliveryMethod',
        title: <TableHeader first="Delivery" second="method" />,
        render: (order) => DELIVERY_METHOD_LABELS[order.deliveryMethod],
      },
      {
        key: 'paymentMethod',
        title: <TableHeader first="Payment" second="method" />,
        render: (order) => PAYMENT_METHOD_LABELS[order.paymentMethod],
      },
      {
        key: 'clientComment',
        title: <TableHeader first="Client" second="comment" />,
        render: (order) => order.clientComment || '—',
      },
      {
        key: 'totalQuantity',
        title: <TableHeader first="Total" second="quantity" />,
        render: (order) => order.totalQuantity,
      },
      {
        key: 'totalAmount',
        title: <TableHeader first="Total" second="amount" />,
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
      getItemKey={(order) => String(order.id)}
      isLoading={isLoading}
      minWidth={1180}
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
