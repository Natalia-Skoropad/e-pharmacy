import { PRODUCT_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

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

import { getPharmacyProductPath } from '@/lib/routes';
import { getProductImageSrc } from '@/lib/products/product-images';
import type { PharmacyClientPurchasedProduct } from '@/lib/clients/clients';

import css from './ClientDetailsPageContent.module.css';

//===================================================================

const formatAmountValue = (value: number) => formatAmount(value) ?? '—';

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
