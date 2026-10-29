import { isCalendarDateString } from '@e-pharmacy/validation/dates';
import { isValidObjectId } from '@e-pharmacy/validation/url';

import { PHARMACY_ROUTES } from '@/lib/routes';

//===================================================================

export const OWNED_PHARMACY_STATUSES = [
  'new',
  'on_verification',
  'active',
  'on_moderation',
  'on_reactivation',
  'blocked',
] as const;

export const OWNED_PHARMACY_RATINGS = [
  '0-0.9',
  '1-1.9',
  '2-2.9',
  '3-3.9',
  '4-5',
] as const;

//===================================================================

export type OwnedPharmacyStatus = (typeof OWNED_PHARMACY_STATUSES)[number];
export type OwnedPharmacyRating = (typeof OWNED_PHARMACY_RATINGS)[number];

//===================================================================

export type OwnedPharmacyListUrlState = Readonly<{
  pharmacyId: string;
  settlement: string;
  region: string;
  status: OwnedPharmacyStatus | 'all';
  createdFrom: string;
  createdTo: string;
  rating: OwnedPharmacyRating | 'all';
  sort: 'created_desc' | 'created_asc';
  page: number;
  perPage: 20 | 50 | 100;
}>;

//===================================================================

export type OwnedPharmacySearchParam = string | string[] | undefined;

export type OwnedPharmacySearchParams = Readonly<
  Record<string, OwnedPharmacySearchParam>
>;

//===================================================================

export const OWNED_PHARMACY_DETAIL_TABS = [
  'information',
  'data',
  'about',
  'payment',
  'documents',
  'comments',
  'reviews',
  'orders',
  'clients',
  'products',
  'product-requests',
  'activity',
] as const;

//===================================================================

export type OwnedPharmacyDetailTab =
  (typeof OWNED_PHARMACY_DETAIL_TABS)[number];

export type OwnedPharmacyRouteResolution =
  | Readonly<{ kind: 'list'; filters: readonly string[] }>
  | Readonly<{
      kind: 'detail';
      pharmacyId: string;
      tab: OwnedPharmacyDetailTab;
    }>
  | Readonly<{ kind: 'invalid' }>;

//===================================================================

const DEFAULTS: OwnedPharmacyListUrlState = {
  pharmacyId: '',
  settlement: '',
  region: '',
  status: 'all',
  createdFrom: '',
  createdTo: '',
  rating: 'all',
  sort: 'created_desc',
  page: 1,
  perPage: 20,
};

//===================================================================

function single(value: OwnedPharmacySearchParam): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

//===================================================================

function select<T extends string>(
  value: string | undefined,
  options: readonly T[],
  fallback: T
): T {
  return value && options.includes(value as T) ? (value as T) : fallback;
}

//===================================================================

function date(value: string | undefined): string {
  return value && isCalendarDateString(value) ? value : '';
}

//===================================================================

function id(value: string | undefined): string {
  return value && isValidObjectId(value) ? value.toLowerCase() : '';
}

//===================================================================

function page(value: string | undefined): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const number = Number(value);

  return Number.isSafeInteger(number) ? number : 1;
}

//===================================================================

function perPage(value: string | undefined): 20 | 50 | 100 {
  return value === '50' ? 50 : value === '100' ? 100 : 20;
}

//===================================================================

function status(value?: string): OwnedPharmacyStatus | 'all' {
  const canonical = value?.replaceAll('-', '_').toLowerCase();

  return select(canonical, OWNED_PHARMACY_STATUSES, 'all' as const);
}

//===================================================================

function locationText(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 120) : '';
}

//===================================================================

function locationSegment(value: string): string {
  return encodeURIComponent(value.trim().toLowerCase().replace(/\s+/g, '-'));
}

//===================================================================

function readRegionSegment(value: string): string {
  const decoded = readLocationSegment(value);

  return decoded.includes(' ')
    ? decoded
    : decoded.replace(/-(region|oblast)$/i, ' $1');
}

//===================================================================

function readLocationSegment(value: string): string {
  try {
    return locationText(decodeURIComponent(value));
  } catch {
    return '';
  }
}

//===================================================================

function normalize(
  state: Partial<Record<keyof OwnedPharmacyListUrlState, unknown>>
): OwnedPharmacyListUrlState {
  let createdFrom = date(
    typeof state.createdFrom === 'string' ? state.createdFrom : undefined
  );

  let createdTo = date(
    typeof state.createdTo === 'string' ? state.createdTo : undefined
  );

  if (createdFrom && createdTo && createdFrom > createdTo) {
    createdFrom = '';
    createdTo = '';
  }

  return {
    pharmacyId: id(
      typeof state.pharmacyId === 'string' ? state.pharmacyId : undefined
    ),

    settlement: locationText(state.settlement),
    region: locationText(state.region),
    status: status(typeof state.status === 'string' ? state.status : undefined),
    createdFrom,
    createdTo,

    rating: select(
      typeof state.rating === 'string' ? state.rating : undefined,
      OWNED_PHARMACY_RATINGS,
      'all' as const
    ),

    sort:
      state.sort === 'created_asc' || state.sort === 'created-asc'
        ? 'created_asc'
        : 'created_desc',

    page: page(String(state.page ?? '')),
    perPage: perPage(String(state.perPage ?? '')),
  };
}

//===================================================================

/** For existing search-param integrations; filters in canonical URLs use paths. */
export function parseOwnedPharmaciesListSearchParams(
  params: OwnedPharmacySearchParams = {}
): OwnedPharmacyListUrlState {
  return normalize({
    pharmacyId: single(params.pharmacyId),
    settlement: single(params.settlement),
    region: single(params.region),
    status: single(params.status),
    createdFrom: single(params.createdFrom),
    createdTo: single(params.createdTo),
    rating: single(params.rating),
    sort: single(params.sort),
    page: single(params.page),
    perPage: single(params.perPage),
  });
}

//===================================================================

const FILTERS = [
  ['pharmacy-id-', 'pharmacyId'],
  ['settlement-', 'settlement'],
  ['region-', 'region'],
  ['status-', 'status'],
  ['created-from-', 'createdFrom'],
  ['created-to-', 'createdTo'],
  ['rating-', 'rating'],
  ['sort-', 'sort'],
  ['page-', 'page'],
  ['per-page-', 'perPage'],
] as const;

//===================================================================

function parseListFilters(
  filters: readonly string[]
): OwnedPharmacyListUrlState {
  const raw: Record<string, string> = {};

  for (const segment of filters) {
    const found = FILTERS.find(([prefix]) => segment.startsWith(prefix));

    if (!found) throw new TypeError('Unknown pharmacy filter.');

    const [prefix, key] = found;

    if (key in raw) throw new TypeError('Duplicate pharmacy filter.');

    raw[key] =
      key === 'settlement'
        ? readLocationSegment(segment.slice(prefix.length))
        : key === 'region'
          ? readRegionSegment(segment.slice(prefix.length))
          : segment.slice(prefix.length);
  }

  return normalize(raw);
}

//===================================================================

/** Guards list filters against detail IDs and detail tabs before routing. */
export function resolveOwnedPharmaciesRoute(
  segments?: readonly string[]
): OwnedPharmacyRouteResolution {
  if (!segments?.length) return { kind: 'list', filters: [] };

  if (isValidObjectId(segments[0])) {
    const tab = segments[1] ?? 'information';

    if (!OWNED_PHARMACY_DETAIL_TABS.includes(tab as OwnedPharmacyDetailTab)) {
      return { kind: 'invalid' };
    }

    if (segments.length > 2) {
      return { kind: 'invalid' };
    }

    return {
      kind: 'detail',
      pharmacyId: segments[0].toLowerCase(),
      tab: tab as OwnedPharmacyDetailTab,
    };
  }

  try {
    parseListFilters(segments);

    return { kind: 'list', filters: [...segments] };
  } catch {
    return { kind: 'invalid' };
  }
}

//===================================================================

export function parseOwnedPharmaciesListSegments(
  filters: readonly string[] = []
): OwnedPharmacyListUrlState {
  return parseListFilters(filters);
}

//===================================================================

/** No personal data in URL: registry search uses selected pharmacy IDs. */
export function buildOwnedPharmaciesListUrl(
  state: OwnedPharmacyListUrlState
): string {
  const value = normalize(state);
  const result: string[] = [];

  if (value.pharmacyId) result.push(`pharmacy-id-${value.pharmacyId}`);

  if (value.settlement)
    result.push(`settlement-${locationSegment(value.settlement)}`);

  if (value.region) result.push(`region-${locationSegment(value.region)}`);

  if (value.status !== 'all')
    result.push(`status-${value.status.replaceAll('_', '-')}`);

  if (value.createdFrom) result.push(`created-from-${value.createdFrom}`);
  if (value.createdTo) result.push(`created-to-${value.createdTo}`);
  if (value.rating !== 'all') result.push(`rating-${value.rating}`);
  if (value.sort !== 'created_desc') result.push('sort-created-asc');
  if (value.page !== 1) result.push(`page-${value.page}`);
  if (value.perPage !== 20) result.push(`per-page-${value.perPage}`);

  return [PHARMACY_ROUTES.PHARMACIES, ...result].join('/');
}

//===================================================================

export function assertOwnedPharmacyId(value: string): string {
  if (!isValidObjectId(value)) throw new TypeError('Invalid pharmacy ID.');

  return value.toLowerCase();
}

//===================================================================

export function buildOwnedPharmacyDetailUrl(
  rawPharmacyId: string,
  tab: OwnedPharmacyDetailTab = 'information'
): string {
  const pharmacyId = assertOwnedPharmacyId(rawPharmacyId);

  if (!OWNED_PHARMACY_DETAIL_TABS.includes(tab))
    throw new TypeError('Invalid pharmacy detail tab.');

  const base = `${PHARMACY_ROUTES.PHARMACIES}/${pharmacyId}`;

  return tab === 'information' ? base : `${base}/${tab}`;
}

//===================================================================

export function buildOwnedPharmaciesListApiParams(
  state: OwnedPharmacyListUrlState
) {
  const value = normalize(state);

  return {
    pharmacyId: value.pharmacyId || undefined,
    settlement: value.settlement || undefined,
    region: value.region || undefined,
    status: value.status === 'all' ? undefined : value.status,
    createdFrom: value.createdFrom || undefined,
    createdTo: value.createdTo || undefined,
    rating: value.rating === 'all' ? undefined : value.rating,
    sort: value.sort,
    page: value.page,
    perPage: value.perPage,
  } as const;
}

//===================================================================

export const OWNED_PHARMACIES_LIST_URL_DEFAULTS = DEFAULTS;
