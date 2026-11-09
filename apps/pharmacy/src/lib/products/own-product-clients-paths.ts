import {
  isDateParam,
  isDateRangeValid,
  isValidObjectId,
} from '@e-pharmacy/validation/url';

//===================================================================

export type OwnProductClientsRouteState = Readonly<{
  pharmacyId: string;
  clientId: string;
  status: 'all' | 'active' | 'blocked';
  date: Readonly<{ from: string; to: string }>;
  perPage: 20 | 50 | 100;
  page: number;
}>;

//===================================================================

export const DEFAULT_OWN_PRODUCT_CLIENTS_ROUTE: OwnProductClientsRouteState = {
  pharmacyId: '',
  clientId: '',
  status: 'all',
  date: { from: '', to: '' },
  perPage: 20,
  page: 1,
};

//===================================================================

export function parseOwnProductClientsSegments(
  segments: readonly string[]
): OwnProductClientsRouteState {
  const route = {
    ...DEFAULT_OWN_PRODUCT_CLIENTS_ROUTE,
    date: { ...DEFAULT_OWN_PRODUCT_CLIENTS_ROUTE.date },
  };

  const seen = new Set<string>();

  for (const segment of segments) {
    const match =
      /^(pharmacy-id|client-id|status|date-from|date-to|per-page|page)-(.+)$/.exec(
        segment
      );

    if (!match) throw new TypeError('Unknown product clients filter');

    const [, field, raw] = match;

    if (!field || !raw || seen.has(field))
      throw new TypeError('Duplicate or invalid filter');

    seen.add(field);

    switch (field) {
      case 'pharmacy-id':

      case 'client-id':
        if (!isValidObjectId(raw)) throw new TypeError(`Invalid ${field}`);
        if (field === 'pharmacy-id') route.pharmacyId = raw.toLowerCase();
        else route.clientId = raw.toLowerCase();
        break;

      case 'status':
        if (raw !== 'active' && raw !== 'blocked')
          throw new TypeError('Invalid status');
        route.status = raw;
        break;

      case 'date-from':

      case 'date-to':
        if (!isDateParam(raw)) throw new TypeError('Invalid date');
        if (field === 'date-from') route.date.from = raw;
        else route.date.to = raw;
        break;

      case 'per-page':
        if (!['20', '50', '100'].includes(raw))
          throw new TypeError('Invalid page size');
        route.perPage = Number(raw) as OwnProductClientsRouteState['perPage'];
        break;

      case 'page':
        if (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
          throw new TypeError('Invalid page');
        }
        route.page = Number(raw);
        break;
    }
  }

  if (!isDateRangeValid(route.date)) throw new TypeError('Invalid date range');

  return route;
}

//===================================================================

export function buildOwnProductClientsPath(
  productId: string,
  state: OwnProductClientsRouteState
): string {
  if (!isValidObjectId(productId)) throw new TypeError('Invalid product');

  const segments: string[] = [];

  if (state.pharmacyId) segments.push(`pharmacy-id-${state.pharmacyId}`);
  if (state.clientId) segments.push(`client-id-${state.clientId}`);
  if (state.status !== 'all') segments.push(`status-${state.status}`);
  if (state.date.from) segments.push(`date-from-${state.date.from}`);
  if (state.date.to) segments.push(`date-to-${state.date.to}`);
  if (state.perPage !== 20) segments.push(`per-page-${state.perPage}`);
  if (state.page > 1) segments.push(`page-${state.page}`);

  parseOwnProductClientsSegments(segments);

  const base = `/pharmacy/products/${productId}/clients`;

  return segments.length ? `${base}/${segments.join('/')}` : base;
}
