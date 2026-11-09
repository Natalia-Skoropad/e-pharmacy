import {
  isDateParam,
  isDateRangeValid,
  isValidObjectId,
} from '@e-pharmacy/validation/url';

import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';

//===================================================================

export type ProductPharmacyStockFilter =
  | 'all'
  | 'available'
  | 'reserved'
  | 'out-of-stock'
  | 'unavailable';

//===================================================================

export type OwnProductPharmaciesRouteState = Readonly<{
  pharmacyId: string;
  status: 'all' | PharmacyStatus;
  region: string;
  settlement: string;
  stock: ProductPharmacyStockFilter;
  date: Readonly<{ from: string; to: string }>;
  perPage: 20 | 50 | 100;
  page: number;
}>;

//===================================================================

export const DEFAULT_OWN_PRODUCT_PHARMACIES_ROUTE: OwnProductPharmaciesRouteState =
  {
    pharmacyId: '',
    status: 'all',
    region: '',
    settlement: '',
    stock: 'all',
    date: { from: '', to: '' },
    perPage: 20,
    page: 1,
  };

//===================================================================

const STATUSES = [
  'new',
  'on_verification',
  'active',
  'on_moderation',
  'on_reactivation',
  'blocked',
] as const;

const STOCK_FILTERS = [
  'available',
  'reserved',
  'out-of-stock',
  'unavailable',
] as const;

//===================================================================

/** Consistent readable location keys, shared by URL options and row filtering. */
export function getProductPharmacyLocationKey(value?: string): string {
  return value?.trim().toLocaleLowerCase().replace(/\s+/g, '-') ?? '';
}

//===================================================================

function readLocationKey(raw: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    throw new TypeError('Invalid location filter encoding');
  }
  if (
    decoded.length > 120 ||
    /[\/\\\u0000-\u001f\u007f]/.test(decoded) ||
    !decoded.trim()
  ) {
    throw new TypeError('Invalid location filter');
  }
  const canonical = getProductPharmacyLocationKey(decoded);
  // Next.js route params are decoded; pathname segments may remain encoded.
  if (canonical !== raw && encodeURIComponent(canonical) !== raw) {
    throw new TypeError('Invalid location filter');
  }
  return canonical;
}

//===================================================================

/** Only canonical, recognized segments may open the owner-wide route. */
export function parseOwnProductPharmaciesSegments(
  segments: readonly string[]
): OwnProductPharmaciesRouteState {
  const result = {
    ...DEFAULT_OWN_PRODUCT_PHARMACIES_ROUTE,
    date: { ...DEFAULT_OWN_PRODUCT_PHARMACIES_ROUTE.date },
  };

  const seen = new Set<string>();

  for (const segment of segments) {
    const match =
      /^(pharmacy-id|status|stock|region|settlement|date-from|date-to|per-page|page)-(.+)$/.exec(
        segment
      );

    if (!match) throw new TypeError('Unknown product pharmacies filter');

    const [, field, raw] = match;

    if (!field || !raw || seen.has(field))
      throw new TypeError('Duplicate product pharmacies filter');

    seen.add(field);

    switch (field) {
      case 'pharmacy-id':
        if (!isValidObjectId(raw)) throw new TypeError('Invalid pharmacy ID');
        result.pharmacyId = raw.toLowerCase();
        break;

      case 'status': {
        const status = raw.replaceAll('-', '_') as PharmacyStatus;

        if (!STATUSES.includes(status))
          throw new TypeError('Invalid pharmacy status');
        result.status = status;
        break;
      }

      case 'region':

      case 'settlement':
        result[field] = readLocationKey(raw);
        break;

      case 'stock':
        if (!STOCK_FILTERS.includes(raw as (typeof STOCK_FILTERS)[number])) {
          throw new TypeError('Invalid availability');
        }
        result.stock = raw as ProductPharmacyStockFilter;
        break;

      case 'date-from':

      case 'date-to':
        if (!isDateParam(raw)) throw new TypeError('Invalid date');
        if (field === 'date-from') result.date.from = raw;
        else result.date.to = raw;

        break;
      case 'per-page':
        if (!['20', '50', '100'].includes(raw))
          throw new TypeError('Invalid page size');
        result.perPage = Number(
          raw
        ) as OwnProductPharmaciesRouteState['perPage'];
        break;

      case 'page':
        if (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
          throw new TypeError('Invalid page');
        }
        result.page = Number(raw);
        break;
    }
  }

  if (result.settlement && !result.region)
    throw new TypeError('Region required for settlement');

  if (!isDateRangeValid(result.date)) throw new TypeError('Invalid date range');

  return result;
}

//===================================================================

export function buildOwnProductPharmaciesPath(
  productId: string,
  state: OwnProductPharmaciesRouteState
): string {
  if (!isValidObjectId(productId)) throw new TypeError('Invalid product');

  const segments: string[] = [];

  if (state.pharmacyId) segments.push(`pharmacy-id-${state.pharmacyId}`);

  if (state.status !== 'all')
    segments.push(`status-${state.status.replaceAll('_', '-')}`);

  if (state.stock !== 'all') segments.push(`stock-${state.stock}`);
  if (state.region) segments.push(`region-${encodeURIComponent(state.region)}`);

  if (state.settlement)
    segments.push(`settlement-${encodeURIComponent(state.settlement)}`);

  if (state.date.from) segments.push(`date-from-${state.date.from}`);
  if (state.date.to) segments.push(`date-to-${state.date.to}`);
  if (state.perPage !== 20) segments.push(`per-page-${state.perPage}`);
  if (state.page !== 1) segments.push(`page-${state.page}`);

  parseOwnProductPharmaciesSegments(segments);

  const base = `/pharmacy/products/${productId}/pharmacies`;

  return segments.length ? `${base}/${segments.join('/')}` : base;
}
