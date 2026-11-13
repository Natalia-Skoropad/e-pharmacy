import {
  DELIVERY_METHODS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
} from '@e-pharmacy/config/orders';

import {
  deslugifyArticleSegment,
  isDateParam,
  isDateRangeValid,
  normalizeSlugEnumValue,
  slugifySegment,
  slugifyStatus,
} from '@e-pharmacy/validation/url';

import type { DeliveryMethod, PaymentMethod } from '@e-pharmacy/types/orders';

import { PHARMACY_ROUTES } from '@/lib/routes';

import {
  DEFAULT_ORDERS_FILTERS,
  type OrdersFilterState,
} from './orders-filters';

//===================================================================

const ID = /^[0-9a-f]{24}$/i;
const PER_PAGE_VALUES = [20, 50, 100] as const;

//===================================================================

export type OrdersPagination = Readonly<{
  page: number;
  perPage: 20 | 50 | 100;
}>;

export const DEFAULT_ORDERS_PAGINATION: OrdersPagination = {
  page: 1,
  perPage: 20,
};

//===================================================================

function normalizeDeliveryMethodSegment(value: string): DeliveryMethod | null {
  return normalizeSlugEnumValue(value, DELIVERY_METHODS);
}

//===================================================================

function normalizePaymentMethodSegment(value: string): PaymentMethod | null {
  return normalizeSlugEnumValue(value, PAYMENT_METHODS);
}

//===================================================================

export type OrdersRouteParams = Readonly<{ filters?: string[] }>;

//===================================================================

export function isOrdersFilterSegment(segment: string): boolean {
  return (
    /^(pharmacy-id-|client-id-|order-id-)[0-9a-f]{24}$/i.test(segment) ||
    /^page-[1-9]\d*$/.test(segment) ||
    /^per-page-(20|50|100)$/.test(segment) ||
    segment.startsWith('order-number-') ||
    segment.startsWith('delivery-') ||
    segment.startsWith('payment-') ||
    segment.startsWith('status-') ||
    segment.startsWith('created-by-') ||
    segment.startsWith('date-from-') ||
    segment.startsWith('date-to-')
  );
}

//===================================================================

export function isOrdersFilterRoute(segments: string[] | undefined): boolean {
  return !segments?.length || segments.every(isOrdersFilterSegment);
}

//===================================================================

export function parseOrdersSegments(
  params: OrdersRouteParams = {}
): OrdersFilterState {
  const filters: {
    -readonly [K in keyof OrdersFilterState]: OrdersFilterState[K];
  } = {
    ...DEFAULT_ORDERS_FILTERS,
    date: { ...DEFAULT_ORDERS_FILTERS.date },
  };

  for (const segment of params.filters ?? []) {
    if (segment.startsWith('pharmacy-id-') && ID.test(segment.slice(12))) {
      filters.pharmacyId = segment.slice(12).toLowerCase();
    } else if (segment.startsWith('client-id-') && ID.test(segment.slice(10))) {
      filters.clientId = segment.slice(10).toLowerCase();
    } else if (segment.startsWith('order-id-') && ID.test(segment.slice(9))) {
      filters.orderId = segment.slice(9).toLowerCase();
    } else if (segment.startsWith('order-number-')) {
      filters.orderNumber = deslugifyArticleSegment(segment.slice(13));
    } else if (segment.startsWith('delivery-')) {
      const value = normalizeDeliveryMethodSegment(segment.slice(9));

      if (value) filters.deliveryMethod = value;
    } else if (segment.startsWith('payment-')) {
      const value = normalizePaymentMethodSegment(segment.slice(8));

      if (value) filters.paymentMethod = value;
    } else if (segment.startsWith('status-')) {
      const value = normalizeSlugEnumValue(segment.slice(7), ORDER_STATUSES);

      if (value) filters.status = value;
    } else if (segment.startsWith('created-by-')) {
      const value = segment.slice(11);

      if (value === 'client' || value === 'manager')
        filters.createdByType = value;
    } else if (segment.startsWith('date-from-')) {
      const dateFrom = segment.slice(10);

      if (isDateParam(dateFrom)) filters.date.from = dateFrom;
    } else if (segment.startsWith('date-to-')) {
      const dateTo = segment.slice(8);

      if (isDateParam(dateTo)) filters.date.to = dateTo;
    }
  }
  if (!isDateRangeValid(filters.date))
    filters.date = { ...DEFAULT_ORDERS_FILTERS.date };

  return filters;
}

//===================================================================

export function parseOrdersPaginationSegments(
  params: OrdersRouteParams = {}
): OrdersPagination {
  let page = 1;
  let perPage: OrdersPagination['perPage'] = 20;

  for (const segment of params.filters ?? []) {
    if (/^page-[1-9]\d*$/.test(segment)) {
      const candidate = Number(segment.slice(5));

      if (Number.isSafeInteger(candidate)) page = candidate;
    }

    if (segment.startsWith('per-page-')) {
      const candidate = Number(segment.slice(9));

      if (PER_PAGE_VALUES.some((value) => value === candidate)) {
        perPage = candidate as OrdersPagination['perPage'];
      }
    }
  }

  return { page, perPage };
}

//===================================================================

export function buildOrdersPath(
  filters: OrdersFilterState,
  pagination: OrdersPagination = DEFAULT_ORDERS_PAGINATION,
  basePath: string = PHARMACY_ROUTES.ORDERS
): string {
  const segments: string[] = [];

  if (
    basePath === PHARMACY_ROUTES.ORDERS &&
    filters.pharmacyId &&
    ID.test(filters.pharmacyId)
  )
    segments.push(`pharmacy-id-${filters.pharmacyId.toLowerCase()}`);

  if (filters.clientId && ID.test(filters.clientId))
    segments.push(`client-id-${filters.clientId.toLowerCase()}`);

  if (filters.orderId && ID.test(filters.orderId))
    segments.push(`order-id-${filters.orderId.toLowerCase()}`);

  if (filters.orderNumber.trim() && !filters.orderId)
    segments.push(`order-number-${slugifySegment(filters.orderNumber.trim())}`);

  if (filters.deliveryMethod !== 'all')
    segments.push(`delivery-${slugifyStatus(filters.deliveryMethod)}`);

  if (filters.paymentMethod !== 'all')
    segments.push(`payment-${slugifyStatus(filters.paymentMethod)}`);

  if (filters.status !== 'all')
    segments.push(`status-${slugifyStatus(filters.status)}`);

  if (filters.createdByType !== 'all')
    segments.push(`created-by-${filters.createdByType}`);

  if (isDateRangeValid(filters.date)) {
    if (filters.date.from) segments.push(`date-from-${filters.date.from}`);
    if (filters.date.to) segments.push(`date-to-${filters.date.to}`);
  }

  if (pagination.perPage !== 20)
    segments.push(`per-page-${pagination.perPage}`);

  if (pagination.page > 1) segments.push(`page-${pagination.page}`);

  return segments.length ? `${basePath}/${segments.join('/')}` : basePath;
}

//===================================================================

/** A pharmacy detail tab keeps its own URL, never redirects to the owner registry. */
export function buildEmbeddedOrdersPath(
  pharmacyId: string,
  filters: OrdersFilterState,
  pagination: OrdersPagination = DEFAULT_ORDERS_PAGINATION
): string {
  if (!ID.test(pharmacyId)) throw new TypeError('Invalid pharmacy ID.');

  if (
    filters.pharmacyId &&
    filters.pharmacyId.toLowerCase() !== pharmacyId.toLowerCase()
  ) {
    throw new TypeError(
      'Order filter pharmacy does not match the detail route.'
    );
  }

  return buildOrdersPath(
    filters,
    pagination,
    `${PHARMACY_ROUTES.PHARMACIES}/${pharmacyId.toLowerCase()}/orders`
  );
}

//===================================================================

/** All related-order filters stay under the product, while the selected
 * pharmacy remains an optional filter within that product's order history. */
export function buildRelatedProductOrdersPath(
  productId: string,
  filters: OrdersFilterState,
  pagination: OrdersPagination = DEFAULT_ORDERS_PAGINATION
): string {
  if (!ID.test(productId)) throw new TypeError('Invalid product ID.');

  const registryPath = buildOrdersPath(filters, pagination);

  return `${PHARMACY_ROUTES.PRODUCTS}/${productId.toLowerCase()}/related-orders${registryPath.slice(PHARMACY_ROUTES.ORDERS.length)}`;
}
