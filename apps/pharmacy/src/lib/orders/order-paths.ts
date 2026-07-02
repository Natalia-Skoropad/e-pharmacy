import { USER_SEARCH_MAX_LENGTH } from '@e-pharmacy/validation';

import { PHARMACY_ORDERS } from '@/lib/layout/routes';

import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types';

import type { OrdersFilterState } from '@/components/orders/OrdersPageContent';

//===================================================================

const URL_TEXT_PARAM_DISALLOWED_CHARS_PATTERN = /[^A-Za-z0-9 .-]/g;
const URL_ORDER_NUMBER_PARAM_DISALLOWED_CHARS_PATTERN = /[^A-Za-z0-9.-]/g;
const SLUG_SEGMENT_SEPARATOR_PATTERN = /[^a-z0-9]+/g;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

function sanitizeTextParam(value?: string): string {
  return (
    value
      ?.trim()
      .replace(URL_TEXT_PARAM_DISALLOWED_CHARS_PATTERN, '')
      .slice(0, USER_SEARCH_MAX_LENGTH) ?? ''
  );
}

//===================================================================

function sanitizeOrderNumberParam(value?: string): string {
  return (
    value
      ?.trim()
      .replace(URL_ORDER_NUMBER_PARAM_DISALLOWED_CHARS_PATTERN, '')
      .slice(0, USER_SEARCH_MAX_LENGTH) ?? ''
  );
}

//===================================================================

function slugifySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(SLUG_SEGMENT_SEPARATOR_PATTERN, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, USER_SEARCH_MAX_LENGTH);
}

//===================================================================

function deslugifyTextSegment(value: string): string {
  return sanitizeTextParam(value.replace(/-/g, ' '));
}

//===================================================================

function deslugifyOrderNumberSegment(value: string): string {
  return sanitizeOrderNumberParam(value);
}

//===================================================================

function isValidOrderDate(value?: string): boolean {
  return Boolean(value && DATE_PATTERN.test(value));
}

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

export function isOrdersFilterRoute(
  segments: string[] | undefined
): boolean {
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
      filters.client = deslugifyTextSegment(segment.replace('client-', ''));
      continue;
    }

    if (segment.startsWith('order-number-')) {
      filters.orderNumber = deslugifyOrderNumberSegment(
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

      if (isValidOrderDate(dateFrom)) {
        filters.date = {
          ...filters.date,
          from: dateFrom,
        };
      }

      continue;
    }

    if (segment.startsWith('date-to-')) {
      const dateTo = segment.replace('date-to-', '');

      if (isValidOrderDate(dateTo)) {
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
    segments.push(`delivery-${filters.deliveryMethod.replace(/_/g, '-')}`);
  }

  if (filters.paymentMethod !== 'all') {
    segments.push(`payment-${filters.paymentMethod.replace(/_/g, '-')}`);
  }

  if (filters.status !== 'all') {
    segments.push(`status-${filters.status.replace(/_/g, '-')}`);
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
