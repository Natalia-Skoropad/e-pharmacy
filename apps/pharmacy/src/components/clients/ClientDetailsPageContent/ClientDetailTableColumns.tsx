import {
  PRODUCT_STATUS_PRESENTATION,
  ORDER_CREATED_BY_LABELS,
  ORDER_STATUS_PRESENTATION,
  PAYMENT_METHOD_LABELS,
  DELIVERY_METHOD_LABELS,
} from '@e-pharmacy/config/presentation';

import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { CategoryIcon } from '@e-pharmacy/ui/forms';

import {
  formatInitials,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { formatAmount } from '@e-pharmacy/utils/money';

import { getPharmacyOrderPath, getPharmacyProductPath } from '@/lib/routes';
import { getProductImageSrc } from '@/lib/products/product-images';
import type { PharmacyOrderRow } from '@/lib/orders/orders';
import type { PharmacyClientPurchasedProduct } from '@/lib/clients/clients';

import css from './ClientDetailsPageContent.module.css';

//===================================================================

const formatAmountValue = (value: number) => formatAmount(value) ?? '—';

//===================================================================

export const ORDER_COLUMNS: Array<DataTableColumn<PharmacyOrderRow>> = [
  {
    key: 'date',
    title: <TableHeaderTitle parts={['Order', 'date']} />,
    render: (order) => <TableDateTime value={order.orderDate} />,
  },
  {
    key: 'number',
    title: <TableHeaderTitle parts={['Order', 'number']} />,

    render: (order) => (
      <TextActionButton href={getPharmacyOrderPath(order.id)}>
        {order.orderNumber}
      </TextActionButton>
    ),
  },
  {
    key: 'delivery',
    title: <TableHeaderTitle parts={['Delivery', 'method']} />,
    render: (order) => DELIVERY_METHOD_LABELS[order.deliveryMethod],
  },
  {
    key: 'payment',
    title: <TableHeaderTitle parts={['Payment', 'method']} />,
    render: (order) => PAYMENT_METHOD_LABELS[order.paymentMethod],
  },
  {
    key: 'comment',
    title: <TableHeaderTitle parts={['Client', 'comment']} />,
    render: (order) => order.clientComment || '—',
  },
  {
    key: 'quantity',
    title: <TableHeaderTitle parts={['Order', 'quantity']} />,
    render: (order) => order.totalQuantity,
  },
  {
    key: 'amount',
    title: <TableHeaderTitle parts={['Order', ' amount, ₴']} />,
    render: (order) => formatAmountValue(order.totalAmount),
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
      <StatusBadge {...ORDER_STATUS_PRESENTATION[order.status]} />
    ),
  },
];

//===================================================================

export const PRODUCT_COLUMNS: Array<
  DataTableColumn<PharmacyClientPurchasedProduct>
> = [
  {
    key: 'firstOrderDate',
    title: <TableHeaderTitle parts={['First order', 'date']} />,
    render: (item) => <TableDateTime value={item.firstOrderDate} />,
  },
  {
    key: 'photo',
    title: <TableHeaderTitle parts={['Product', 'photo']} />,

    render: (item) => (
      <TableImagePreview
        src={getProductImageSrc(item.photoUrl ?? undefined)}
        alt={`${item.name} photo`}
        fallback={formatInitials(item.name, 'P')}
      />
    ),
  },
  {
    key: 'productId',
    width: '126px',
    title: <TableHeaderTitle parts={['Product', 'ID']} />,

    render: (item) =>
      item.currentProductExists ? (
        <TextActionButton
          className={css.breakableLink}
          href={getPharmacyProductPath(item.productId)}
        >
          {item.productId}
        </TextActionButton>
      ) : (
        <span className={css.breakableLink}>{item.productId}</span>
      ),
  },
  {
    key: 'article',
    title: <TableHeaderTitle parts={['Product', 'article']} />,

    render: (item) =>
      item.currentProductExists ? (
        <TextActionButton href={getPharmacyProductPath(item.productId)}>
          {item.article}
        </TextActionButton>
      ) : (
        item.article
      ),
  },
  {
    key: 'name',
    title: <TableHeaderTitle parts={['Product', 'name']} />,

    render: (item) =>
      item.currentProductExists ? (
        <TextActionButton href={getPharmacyProductPath(item.productId)}>
          {item.name}
        </TextActionButton>
      ) : (
        item.name
      ),
  },
  {
    key: 'category',
    title: <TableHeaderTitle parts={['Product', 'category']} />,
    render: (item) => item.category?.name ?? '—',
  },
  {
    key: 'quantity',
    title: <TableHeaderTitle parts={['Purchased', 'quantity']} />,
    render: (item) => item.quantity,
  },
  {
    key: 'amount',
    title: <TableHeaderTitle parts={['Purchased ', 'amount, ₴']} />,
    render: (item) => formatAmountValue(item.totalAmount),
  },
  {
    key: 'ordersCount',
    title: <TableHeaderTitle parts={['Orders', 'count']} />,
    render: (item) => item.ordersCount,
  },
  {
    key: 'status',
    title: <TableHeaderTitle parts={['Product', 'status']} />,

    render: (item) =>
      item.currentStatus && item.currentStatus !== 'new' ? (
        <StatusBadge {...PRODUCT_STATUS_PRESENTATION[item.currentStatus]} />
      ) : (
        'Unavailable'
      ),
  },
];

//===================================================================

/** Snapshot categories have no icon; resolve it against live Admin settings. */
export function buildClientProductColumns(
  iconByCategory: ReadonlyMap<string, string | undefined>
): Array<DataTableColumn<PharmacyClientPurchasedProduct>> {
  return PRODUCT_COLUMNS.map((column) =>
    column.key === 'category'
      ? {
          ...column,

          render: (item) =>
            item.category ? (
              <span className={css.categoryDisplay}>
                <span className={css.categoryIcon}>
                  <CategoryIcon
                    name={
                      iconByCategory.get(item.category.id ?? '') ??
                      iconByCategory.get(item.category.slug)
                    }
                    size={16}
                  />
                </span>
                <span>{item.category.name}</span>
              </span>
            ) : (
              '—'
            ),
        }
      : column
  );
}
