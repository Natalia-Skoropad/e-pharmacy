import type { OrderCreatedByType, OrderStatus } from '@e-pharmacy/types/orders';
import type { EntityId } from '@e-pharmacy/types/primitives';

import type {
  ProductStockMovement,
  StockMovementEventType,
  StockMovementSource,
} from '@e-pharmacy/types/products';

import type {
  DateFilterValue,
  SelectOption,
  RowsPerPageValue,
} from '@e-pharmacy/ui/forms';

import {
  ORDER_STATUS_PRESENTATION,
  ORDER_CREATED_BY_LABELS,
} from '@e-pharmacy/config/presentation';

import { ORDER_CREATED_BY_TYPES } from '@e-pharmacy/config/orders';
import { formatShortDate } from '@e-pharmacy/utils/date';
import { formatAmount } from '@e-pharmacy/utils/money';

import type { PharmacyOrderRow } from '@/lib/orders/orders';

//===================================================================

export type ResourceStatus = 'idle' | 'loading' | 'success' | 'error';

//===================================================================

export type StockMovementFilters = Readonly<{
  date: DateFilterValue;
  eventType: 'all' | StockMovementEventType;
  source: 'all' | StockMovementSource;
  orderStatus: 'all' | OrderStatus;
}>;

export type RelatedOrdersFilters = Readonly<{
  date: DateFilterValue;
  orderStatus: 'all' | OrderStatus;
  createdByType: 'all' | OrderCreatedByType;
}>;

//===================================================================

export type StockMovementRow = Readonly<{
  id: string;
  orderId?: string;
  date: string;
  dateValue: string;
  eventType: string;
  eventTypeValue: StockMovementEventType;
  quantity: string;
  quantityValue: number;
  price: string;
  totalAmount: string;
  orderNumber: string;
  orderStatus?: OrderStatus;
  source: string;
  sourceValue: StockMovementSource;
  comment: string;
}>;

//===================================================================

export type RelatedOrderRow = Readonly<{
  id: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  orderDateValue: string;
  client: string;
  clientId: EntityId | null;
  clientPhotoUrl: string | null;
  quantity: string;
  quantityValue: number;
  fixedUnitPrice: string;
  unitPriceValue: number;
  amount: string;
  amountValue: number;
  status: OrderStatus;
  createdByType: OrderCreatedByType;
}>;

//===================================================================

export const DEFAULT_STOCK_MOVEMENT_FILTERS: StockMovementFilters = {
  date: { from: '', to: '' },
  eventType: 'all',
  source: 'all',
  orderStatus: 'all',
};

export const DEFAULT_RELATED_ORDERS_FILTERS: RelatedOrdersFilters = {
  date: { from: '', to: '' },
  orderStatus: 'all',
  createdByType: 'all',
};

//===================================================================

export const ORDER_STATUS_OPTIONS: Array<SelectOption<'all' | OrderStatus>> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: ORDER_STATUS_PRESENTATION.new.label },
  { value: 'in_progress', label: ORDER_STATUS_PRESENTATION.in_progress.label },
  { value: 'successful', label: ORDER_STATUS_PRESENTATION.successful.label },
  { value: 'rejected', label: ORDER_STATUS_PRESENTATION.rejected.label },
];

//===================================================================

export const ORDER_CREATED_BY_OPTIONS: Array<
  SelectOption<'all' | OrderCreatedByType>
> = [
  { value: 'all', label: 'All' },

  ...ORDER_CREATED_BY_TYPES.map((value) => ({
    value,
    label: ORDER_CREATED_BY_LABELS[value],
  })),
];

//===================================================================

export const STOCK_EVENT_TYPE_OPTIONS: Array<
  SelectOption<'all' | StockMovementEventType>
> = [
  { value: 'all', label: 'All' },
  { value: 'arrival', label: 'Stock arrival' },
  { value: 'reserve', label: 'Reserved in order' },
  { value: 'write_off', label: 'Stock write-off' },
  { value: 'release', label: 'Reserve released' },
  { value: 'adjustment', label: 'Stock adjustment' },
];

//===================================================================

export const STOCK_SOURCE_OPTIONS: Array<
  SelectOption<'all' | StockMovementSource>
> = [
  { value: 'all', label: 'All' },
  { value: 'pharmacy_stock', label: 'Pharmacy stock' },
  { value: 'client_order', label: 'Client order' },
];

//===================================================================

export const PRODUCT_TAB_ROWS_PER_PAGE_OPTIONS: RowsPerPageValue[] = [
  20, 50, 100,
];

//===================================================================

const STOCK_EVENT_LABELS: Record<StockMovementEventType, string> = {
  arrival: 'Stock arrival',
  reserve: 'Reserved in order',
  release: 'Reserve released',
  write_off: 'Stock write-off',
  adjustment: 'Stock adjustment',
};

const STOCK_SOURCE_LABELS: Record<StockMovementSource, string> = {
  pharmacy_stock: 'Pharmacy stock',
  client_order: 'Client order',
};

//===================================================================

export function getStockMovementRows(
  movements: ProductStockMovement[],
  filters: StockMovementFilters,
  orderNumberSearch: string,
  commentSearch: string
): StockMovementRow[] {
  const normalizedOrderNumber = orderNumberSearch.trim().toLowerCase();
  const normalizedComment = commentSearch.trim().toLowerCase();

  return movements
    .map((movement): StockMovementRow => {
      const quantityValue = ['release', 'write_off'].includes(
        movement.eventType
      )
        ? -movement.quantity
        : movement.quantity;

      return {
        id: movement.id,
        ...(movement.orderId ? { orderId: movement.orderId } : {}),

        date: formatShortDate(movement.occurredAt) ?? '—',
        dateValue: movement.occurredAt,
        eventType: STOCK_EVENT_LABELS[movement.eventType],
        eventTypeValue: movement.eventType,
        quantity: `${quantityValue > 0 ? '+' : ''}${quantityValue}`,
        quantityValue,
        price: formatAmount(movement.unitPrice) ?? '—',
        totalAmount: formatAmount(movement.movementValue) ?? '—',
        orderNumber: movement.orderNumber ?? '—',

        ...(movement.orderStatus ? { orderStatus: movement.orderStatus } : {}),

        source: STOCK_SOURCE_LABELS[movement.source],
        sourceValue: movement.source,
        comment: movement.comment,
      };
    })
    .filter((row) => {
      if (
        filters.eventType !== 'all' &&
        row.eventTypeValue !== filters.eventType
      )
        return false;

      if (filters.source !== 'all' && row.sourceValue !== filters.source)
        return false;

      if (
        filters.orderStatus !== 'all' &&
        row.orderStatus !== filters.orderStatus
      )
        return false;

      if (filters.date.from && row.dateValue < filters.date.from) return false;

      if (filters.date.to && row.dateValue > `${filters.date.to}T23:59:59.999Z`)
        return false;

      if (
        normalizedOrderNumber &&
        !row.orderNumber.toLowerCase().includes(normalizedOrderNumber)
      )
        return false;

      if (
        normalizedComment &&
        !row.comment.toLowerCase().includes(normalizedComment)
      )
        return false;

      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.dateValue).getTime() - new Date(a.dateValue).getTime()
    );
}

//===================================================================

export function getRelatedOrderRows(
  productId: EntityId,
  orders: PharmacyOrderRow[]
): RelatedOrderRow[] {
  return orders.flatMap((order) => {
    const item = order.items.find(
      (entry) => String(entry.productId) === String(productId)
    );

    if (!item) return [];

    return [
      {
        id: `${order.id}-${item.id}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderDate: formatShortDate(order.orderDate) ?? '—',
        orderDateValue: order.orderDate,
        client: order.client,
        clientId: order.clientId,
        clientPhotoUrl: order.clientPhotoUrl,
        quantity: String(item.quantity),
        quantityValue: item.quantity,
        fixedUnitPrice: formatAmount(item.unitPrice) ?? '—',
        unitPriceValue: item.unitPrice,
        amount: formatAmount(item.totalPrice) ?? '—',
        amountValue: item.totalPrice,
        status: order.status,
        createdByType: order.createdByType,
      },
    ];
  });
}

//===================================================================

export function paginateRows<T>(rows: T[], page: number, perPage: number): T[] {
  return rows.slice((page - 1) * perPage, page * perPage);
}

//===================================================================

export function getTotalPages(total: number, perPage: number): number {
  return Math.ceil(total / perPage);
}
