import { useMemo, type CSSProperties } from 'react';

import {
  DELIVERY_METHOD_LABELS,
  ORDER_CREATED_BY_LABELS,
  ORDER_STATUS_PRESENTATION,
  PAYMENT_METHOD_LABELS,
} from '@e-pharmacy/config/presentation';

import {
  DataTable,
  formatInitials,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { formatAmount } from '@e-pharmacy/utils/money';

import {
  OrderRejectionSourceBadge,
  StatusBadge,
} from '@e-pharmacy/ui/statistics';

import {
  getPharmacyClientPath,
  getPharmacyOrderPath,
  getOwnedPharmacyPath,
} from '@/lib/routes';

import { type PharmacyOrderRow } from '@/lib/orders/orders';
import { getProductImageSrc } from '@/lib/products/product-images';

//===================================================================

type OrdersTableProps = Readonly<{
  orders: PharmacyOrderRow[];
  emptyMessage: string;
  isLoading?: boolean;
  showPharmacy?: boolean;
  productId?: string;
  hideClient?: boolean;
}>;

//===================================================================

const breakableNameStyle = {
  display: 'inline-block',
  minWidth: 0,
  maxWidth: '100%',
  overflowWrap: 'anywhere',
  whiteSpace: 'normal',
} satisfies CSSProperties;

//===================================================================

function truncateComment(value: string): string {
  const normalized = value.trim();

  if (!normalized) return '—';
  if (normalized.length <= 20) return normalized;

  return `${normalized.slice(0, 20)}…`;
}

//===================================================================

function OrdersTable({
  orders,
  emptyMessage,
  isLoading = false,
  showPharmacy = false,
  productId,
  hideClient = false,
}: OrdersTableProps) {
  const columns = useMemo<Array<DataTableColumn<PharmacyOrderRow>>>(() => {
    const allColumns: Array<DataTableColumn<PharmacyOrderRow>> = [
      {
        key: 'orderDate',
        title: <TableHeaderTitle parts={['Order', 'date']} />,
        render: (order) => <TableDateTime value={order.orderDate} />,
        width: '60px',
      },
      {
        key: 'orderNumber',
        title: <TableHeaderTitle parts={['Order', 'number']} />,
        width: '130px',

        render: (order) => (
          <TextActionButton href={getPharmacyOrderPath(order.id)}>
            {order.orderNumber}
          </TextActionButton>
        ),
      },

      ...(showPharmacy
        ? [
            {
              key: 'pharmacy',
              title: <TableHeaderTitle parts={['Pharmacy', 'name']} />,
              width: '120px',

              render: (order: PharmacyOrderRow) => (
                <span style={{ overflowWrap: 'anywhere' }}>
                  {order.pharmacyId ? (
                    <TextActionButton
                      href={getOwnedPharmacyPath(order.pharmacyId)}
                      style={breakableNameStyle}
                    >
                      {order.pharmacyName}
                    </TextActionButton>
                  ) : (
                    order.pharmacyName
                  )}
                </span>
              ),
            } satisfies DataTableColumn<PharmacyOrderRow>,
          ]
        : []),
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
        width: '110px',
        render: (order) => (
          <span style={{ overflowWrap: 'anywhere' }}>
            {order.clientId ? (
              <TextActionButton
                href={getPharmacyClientPath(order.clientId)}
                style={breakableNameStyle}
              >
                {order.client}
              </TextActionButton>
            ) : (
              order.client
            )}
          </span>
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

      ...(productId
        ? [
            {
              key: 'fixedUnitPrice',
              title: <TableHeaderTitle parts={['Fixed unit', 'price, ₴']} />,

              render: (order: PharmacyOrderRow) => {
                const item = order.items.find(
                  (entry) => entry.productId === productId
                );

                return item ? (formatAmount(item.unitPrice) ?? '—') : '—';
              },
            } satisfies DataTableColumn<PharmacyOrderRow>,
          ]
        : []),
      {
        key: 'totalQuantity',
        title: (
          <TableHeaderTitle
            parts={productId ? ['Product', 'quantity'] : ['Total', 'quantity']}
          />
        ),

        render: (order) =>
          productId
            ? (order.items.find((item) => item.productId === productId)
                ?.quantity ?? '—')
            : order.totalQuantity,
      },
      {
        key: 'totalAmount',

        title: (
          <TableHeaderTitle
            parts={
              productId ? ['Product', 'amount, ₴'] : ['Total', 'amount, ₴']
            }
          />
        ),

        render: (order) => {
          if (!productId) return formatAmount(order.totalAmount) ?? '—';

          const item = order.items.find(
            (entry) => entry.productId === productId
          );

          return item ? (formatAmount(item.totalPrice) ?? '—') : '—';
        },
      },
      {
        key: 'createdByType',
        title: <TableHeaderTitle parts={['Created', 'by']} />,
        render: (order) => ORDER_CREATED_BY_LABELS[order.createdByType],
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Order', 'status']} />,

        render: (order) => (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <StatusBadge {...ORDER_STATUS_PRESENTATION[order.status]} />
            <OrderRejectionSourceBadge
              status={order.status}
              rejectedByType={order.rejectedByType}
            />
          </span>
        ),
      },
    ];

    return allColumns.filter((column) => {
      const key = String(column.key);

      if (hideClient && (key === 'clientPhoto' || key === 'client'))
        return false;

      if (
        productId &&
        ['deliveryMethod', 'paymentMethod', 'createdByType'].includes(key)
      )
        return false;

      return true;
    });
  }, [hideClient, productId, showPharmacy]);

  return (
    <DataTable
      columns={columns}
      items={orders}
      getItemKey={(order) => String(order.id)}
      isLoading={isLoading}
      minWidth={960}
      labels={{
        loading: 'Loading orders...',
        empty: emptyMessage,
      }}
    />
  );
}

export default OrdersTable;
export { OrdersTable };
