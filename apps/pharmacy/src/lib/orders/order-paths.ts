import {
  deslugifyArticleSegment,
  deslugifyNameSegment,
  isDateParam,
  slugifySegment,
  slugifyStatus,
} from '@e-pharmacy/validation';

import { PHARMACY_ORDERS } from '@/lib/layout/routes';

import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types';

import type { OrdersFilterState } from '@/components/orders/OrdersPageContent';

//===================================================================

const DELIVERY_METHODS: DeliveryMethod[] = ['pickup', 'postal_delivery'];
const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'bank_transfer'];

const ORDER_STATUSES: OrderStatus[] = [
  'new',
  'in_progress',
  'successful',
  'rejected',
];

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
};

//===================================================================

function normalizeDeliveryMethodSegment(value: string): DeliveryMethod | null {
  const normalized = value.replace(/-/g, '_');

  return DELIVERY_METHODS.includes(normalized as DeliveryMethod)
    ? (normalized as DeliveryMethod)
    : null;
}

//===================================================================

function normalizePaymentMethodSegment(value: string): PaymentMethod | null {
  const normalized = value.replace(/-/g, '_');

  return PAYMENT_METHODS.includes(normalized as PaymentMethod)
    ? (normalized as PaymentMethod)
    : null;
}

//===================================================================

function normalizeStatusSegment(value: string): OrderStatus | null {
  const normalized = value.replace(/-/g, '_');

  return ORDER_STATUSES.includes(normalized as OrderStatus)
    ? (normalized as OrderStatus)
    : null;
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
    date: {
      from: '',
      to: '',
    },
    client: '',
    orderNumber: '',
    deliveryMethod: 'all',
    paymentMethod: 'all',
    status: 'all',
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
      const status = normalizeStatusSegment(segment.replace('status-', ''));

      if (status) {
        filters.status = status;
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

  return filters;
}

//===================================================================

export function buildOrdersPath(filters: OrdersFilterState): string {
  const segments: string[] = [];
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

  if (filters.date.from) {
    segments.push(`date-from-${filters.date.from}`);
  }

  if (filters.date.to) {
    segments.push(`date-to-${filters.date.to}`);
  }

  return segments.length
    ? `${PHARMACY_ORDERS}/${segments.join('/')}`
    : PHARMACY_ORDERS;
}
