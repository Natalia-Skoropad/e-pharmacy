import {
  DELIVERY_METHODS,
  ORDER_CREATED_BY_TYPES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
} from '@e-pharmacy/config/orders';

import { isCalendarDateString } from '@e-pharmacy/validation/dates';

import type {
  DeliveryMethod,
  OrderCreatedByType,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types/orders';

//===================================================================

export type ClientOrdersUrlState = Readonly<{
  date: { from: string; to: string };
  pharmacy: string;
  orderNumber: string;
  deliveryMethod: 'all' | DeliveryMethod;
  paymentMethod: 'all' | PaymentMethod;
  status: 'all' | OrderStatus;
  createdByType: 'all' | OrderCreatedByType;
  page: number;
  perPage: 20 | 50 | 100;
}>;

export const DEFAULT_CLIENT_ORDERS_URL_STATE: ClientOrdersUrlState = {
  date: { from: '', to: '' },
  pharmacy: '',
  orderNumber: '',
  deliveryMethod: 'all',
  paymentMethod: 'all',
  status: 'all',
  createdByType: 'all',
  page: 1,
  perPage: 20,
};

//===================================================================

const slug = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replaceAll('_', '-')
    .toLowerCase();
const unslug = <T extends string>(
  value: string,
  allowed: readonly T[]
): T | null => allowed.find((item) => slug(item) === value) ?? null;

//===================================================================

// Encode free-form search values losslessly, including spaces, punctuation and Unicode.
const encode = (value: string) => encodeURIComponent(value.trim());

const decode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return '';
  }
};

//===================================================================

export function isClientOrdersFilterSegment(segment: string): boolean {
  return /^(status|delivery|payment|created-by|date-from|date-to|order-number|pharmacy|page|per-page)-/.test(
    segment
  );
}

//===================================================================

export function parseClientOrdersUrl(
  segments: readonly string[] = []
): ClientOrdersUrlState {
  const next = {
    ...DEFAULT_CLIENT_ORDERS_URL_STATE,
    date: { ...DEFAULT_CLIENT_ORDERS_URL_STATE.date },
  };

  for (const segment of segments) {
    if (segment.startsWith('status-'))
      next.status = unslug(segment.slice(7), ORDER_STATUSES) ?? 'all';
    else if (segment.startsWith('delivery-'))
      next.deliveryMethod = unslug(segment.slice(9), DELIVERY_METHODS) ?? 'all';
    else if (segment.startsWith('payment-'))
      next.paymentMethod = unslug(segment.slice(8), PAYMENT_METHODS) ?? 'all';
    else if (segment.startsWith('created-by-'))
      next.createdByType =
        unslug(segment.slice(11), ORDER_CREATED_BY_TYPES) ?? 'all';
    else if (segment.startsWith('pharmacy-id-')) {
      const id = segment.slice(12);
      if (/^[0-9a-f]{24}$/i.test(id)) next.pharmacy = id;
    } else if (segment.startsWith('pharmacy-'))
      next.pharmacy = decode(segment.slice(9)).slice(0, 80);
    else if (segment.startsWith('order-number-'))
      next.orderNumber = decode(segment.slice(13)).slice(0, 80);
    else if (segment.startsWith('date-from-')) {
      const value = segment.slice(10);
      if (isCalendarDateString(value)) next.date.from = value;
    } else if (segment.startsWith('date-to-')) {
      const value = segment.slice(8);
      if (isCalendarDateString(value)) next.date.to = value;
    } else if (/^page-[1-9]\d*$/.test(segment)) {
      const page = Number(segment.slice(5));
      if (Number.isSafeInteger(page)) next.page = page;
    } else if (segment === 'per-page-50') next.perPage = 50;
    else if (segment === 'per-page-100') next.perPage = 100;
  }

  if (next.date.from && next.date.to && next.date.from > next.date.to)
    next.date = { from: '', to: '' };

  return next;
}

//===================================================================

export function buildClientOrdersUrl(state: ClientOrdersUrlState): string {
  const result: string[] = [];

  if (state.pharmacy.trim())
    result.push(
      /^[0-9a-f]{24}$/i.test(state.pharmacy)
        ? `pharmacy-id-${state.pharmacy}`
        : `pharmacy-${encode(state.pharmacy)}`
    );

  if (state.orderNumber.trim())
    result.push(`order-number-${encode(state.orderNumber)}`);
  if (state.deliveryMethod !== 'all')
    result.push(`delivery-${slug(state.deliveryMethod)}`);
  if (state.paymentMethod !== 'all')
    result.push(`payment-${slug(state.paymentMethod)}`);
  if (state.status !== 'all') result.push(`status-${slug(state.status)}`);
  if (state.createdByType !== 'all')
    result.push(`created-by-${slug(state.createdByType)}`);
  if (isCalendarDateString(state.date.from))
    result.push(`date-from-${state.date.from}`);
  if (isCalendarDateString(state.date.to))
    result.push(`date-to-${state.date.to}`);
  if (state.page > 1 && Number.isSafeInteger(state.page))
    result.push(`page-${state.page}`);
  if (state.perPage !== 20) result.push(`per-page-${state.perPage}`);

  return `/profile/orders${result.length ? `/${result.join('/')}` : ''}`;
}
