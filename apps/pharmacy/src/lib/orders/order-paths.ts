import {
  DELIVERY_METHODS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
} from '@e-pharmacy/config/orders';

import {
  deslugifyArticleSegment,
  deslugifyNameSegment,
  isDateParam,
  isDateRangeValid,
  normalizeSlugEnumValue,
  slugifySegment,
  slugifyStatus,
} from '@e-pharmacy/validation/url';

import { PHARMACY_ROUTES } from '@/lib/routes';
import type { DeliveryMethod, PaymentMethod } from '@e-pharmacy/types/orders';

import {
  DEFAULT_ORDERS_FILTERS,
  type OrdersFilterState,
} from './orders-filters';

//===================================================================

type OrdersFilterDraft = {
  date: {
    from: string;
    to: string;
  };
  client: string;
  orderNumber: string;
  deliveryMethod: OrdersFilterState['deliveryMethod'];
  paymentMethod: OrdersFilterState['paymentMethod'];
  status: OrdersFilterState['status'];
  createdByType: OrdersFilterState['createdByType'];
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

export type OrdersRouteParams = Readonly<{
  filters?: string[];
}>;

//===================================================================

export function isOrdersFilterSegment(segment: string): boolean {
  return (
    segment.startsWith('client-') ||
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
  const filters: OrdersFilterDraft = {
    ...DEFAULT_ORDERS_FILTERS,
    date: { ...DEFAULT_ORDERS_FILTERS.date },
  };

  for (const segment of params.filters ?? []) {
    if (segment.startsWith('client-')) {
      filters.client = deslugifyNameSegment(segment.replace('client-', ''));
      continue;
    }

    if (segment.startsWith('order-number-')) {
      filters.orderNumber = deslugifyArticleSegment(
        segment.replace('order-number-', '')
      );
      continue;
    }

    if (segment.startsWith('delivery-')) {
      const deliveryMethod = normalizeDeliveryMethodSegment(
        segment.replace('delivery-', '')
      );

      if (deliveryMethod) {
        filters.deliveryMethod = deliveryMethod;
      }

      continue;
    }

    if (segment.startsWith('payment-')) {
      const paymentMethod = normalizePaymentMethodSegment(
        segment.replace('payment-', '')
      );

      if (paymentMethod) {
        filters.paymentMethod = paymentMethod;
      }

      continue;
    }

    if (segment.startsWith('status-')) {
      const status = normalizeSlugEnumValue(
        segment.replace('status-', ''),
        ORDER_STATUSES
      );

      if (status) {
        filters.status = status;
      }

      continue;
    }

    if (segment.startsWith('created-by-')) {
      const value = segment.replace('created-by-', '');
      if (value === 'client' || value === 'manager') {
        filters.createdByType = value;
      }
      continue;
    }

    if (segment.startsWith('date-from-')) {
      const dateFrom = segment.replace('date-from-', '');

      if (isDateParam(dateFrom)) {
        filters.date = {
          ...filters.date,
          from: dateFrom,
        };
      }

      continue;
    }

    if (segment.startsWith('date-to-')) {
      const dateTo = segment.replace('date-to-', '');

      if (isDateParam(dateTo)) {
        filters.date = {
          ...filters.date,
          to: dateTo,
        };
      }
    }
  }

  if (!isDateRangeValid(filters.date)) {
    filters.date = { ...DEFAULT_ORDERS_FILTERS.date };
  }

  return filters;
}

//===================================================================

export function buildOrdersPath(filters: OrdersFilterState): string {
  const segments: string[] = [];
  const dateRangeIsValid = isDateRangeValid(filters.date);
  const client = filters.client.trim();
  const orderNumber = filters.orderNumber.trim();

  if (client) {
    segments.push(`client-${slugifySegment(client)}`);
  }

  if (orderNumber) {
    segments.push(`order-number-${slugifySegment(orderNumber)}`);
  }

  if (filters.deliveryMethod !== 'all') {
    segments.push(`delivery-${slugifyStatus(filters.deliveryMethod)}`);
  }

  if (filters.paymentMethod !== 'all') {
    segments.push(`payment-${slugifyStatus(filters.paymentMethod)}`);
  }

  if (filters.status !== 'all') {
    segments.push(`status-${slugifyStatus(filters.status)}`);
  }

  if (filters.createdByType !== 'all') {
    segments.push(`created-by-${filters.createdByType}`);
  }

  if (dateRangeIsValid && filters.date.from) {
    segments.push(`date-from-${filters.date.from}`);
  }

  if (dateRangeIsValid && filters.date.to) {
    segments.push(`date-to-${filters.date.to}`);
  }

  return segments.length
    ? `${PHARMACY_ROUTES.ORDERS}/${segments.join('/')}`
    : PHARMACY_ROUTES.ORDERS;
}
