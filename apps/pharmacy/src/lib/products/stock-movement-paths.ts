import {
  isDateParam,
  isDateRangeValid,
  isValidObjectId,
} from '@e-pharmacy/validation/url';

import type { OrderStatus } from '@e-pharmacy/types/orders';

import type {
  StockMovementEventType,
  StockMovementSource,
} from '@e-pharmacy/types/products';

//===================================================================

export type StockMovementRouteState = Readonly<{
  pharmacyId: string;
  orderId: string;
  eventType: 'all' | StockMovementEventType;
  source: 'all' | StockMovementSource;
  orderStatus: 'all' | OrderStatus;
  date: Readonly<{ from: string; to: string }>;
  perPage: 20 | 50 | 100;
  page: number;
}>;

//===================================================================

export const DEFAULT_STOCK_MOVEMENT_ROUTE: StockMovementRouteState = {
  pharmacyId: '',
  orderId: '',
  eventType: 'all',
  source: 'all',
  orderStatus: 'all',
  date: { from: '', to: '' },
  perPage: 20,
  page: 1,
};

//===================================================================

const EVENTS = ['arrival', 'reserve', 'write_off', 'release', 'adjustment'];
const SOURCES = ['pharmacy_stock', 'client_order'];
const ORDER_STATUSES = ['new', 'in_progress', 'successful', 'rejected'];

//===================================================================

/** Validate URL-backed filters before rendering or canonicalizing them. */
export function parseStockMovementSegments(
  segments: readonly string[]
): StockMovementRouteState {
  const value = {
    ...DEFAULT_STOCK_MOVEMENT_ROUTE,
    date: { ...DEFAULT_STOCK_MOVEMENT_ROUTE.date },
  };

  const seen = new Set<string>();

  for (const segment of segments) {
    let field = '';
    let raw = '';

    const match =
      /^(pharmacy-id|order-id|event|source|status|date-from|date-to|per-page|page)-(.+)$/.exec(
        segment
      );

    if (!match) throw new TypeError('Unknown stock movement filter');
    [, field, raw] = match;

    if (seen.has(field)) throw new TypeError(`Duplicate ${field} filter`);

    seen.add(field);

    switch (field) {
      case 'pharmacy-id':

      case 'order-id':
        if (!isValidObjectId(raw)) throw new TypeError(`Invalid ${field}`);
        if (field === 'pharmacy-id') value.pharmacyId = raw.toLowerCase();
        else value.orderId = raw.toLowerCase();
        break;

      case 'event': {
        const name = raw.replace(/-/g, '_') as StockMovementEventType;

        if (!EVENTS.includes(name)) throw new TypeError('Invalid event type');
        value.eventType = name;
        break;
      }

      case 'source': {
        const name = raw.replace(/-/g, '_') as StockMovementSource;

        if (!SOURCES.includes(name)) throw new TypeError('Invalid source');
        value.source = name;
        break;
      }

      case 'status': {
        const name = raw.replace(/-/g, '_') as OrderStatus;

        if (!ORDER_STATUSES.includes(name))
          throw new TypeError('Invalid order status');
        value.orderStatus = name;
        break;
      }
      case 'date-from':

      case 'date-to':
        if (!isDateParam(raw)) throw new TypeError('Invalid date');
        if (field === 'date-from') value.date.from = raw;
        else value.date.to = raw;
        break;

      case 'per-page':
        if (!['20', '50', '100'].includes(raw))
          throw new TypeError('Invalid per-page');
        value.perPage = Number(raw) as StockMovementRouteState['perPage'];
        break;

      case 'page':
        if (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(Number(raw)))
          throw new TypeError('Invalid page');
        value.page = Number(raw);
        break;
    }
  }

  if (!isDateRangeValid(value.date)) throw new TypeError('Invalid date range');
  if (!value.pharmacyId && segments.length > 0)
    throw new TypeError('Select a pharmacy first');

  return value;
}

//===================================================================

/** All filter updates use the same stable order as owner registry URLs. */
export function buildStockMovementPath(
  productId: string,
  value: StockMovementRouteState
): string {
  if (!isValidObjectId(productId)) throw new TypeError('Invalid product');

  const segments: string[] = [];

  if (value.pharmacyId) segments.push(`pharmacy-id-${value.pharmacyId}`);
  if (value.orderId) segments.push(`order-id-${value.orderId}`);

  if (value.eventType !== 'all')
    segments.push(`event-${value.eventType.replace(/_/g, '-')}`);

  if (value.source !== 'all')
    segments.push(`source-${value.source.replace(/_/g, '-')}`);

  if (value.orderStatus !== 'all')
    segments.push(`status-${value.orderStatus.replace(/_/g, '-')}`);

  if (value.date.from) segments.push(`date-from-${value.date.from}`);
  if (value.date.to) segments.push(`date-to-${value.date.to}`);
  if (value.perPage !== 20) segments.push(`per-page-${value.perPage}`);
  if (value.page !== 1) segments.push(`page-${value.page}`);

  // Keep the generator as strict as the parser (including when called from UI).
  parseStockMovementSegments(segments);

  const base = `/pharmacy/products/${productId}/stock-movement`;

  return segments.length ? `${base}/${segments.join('/')}` : base;
}
