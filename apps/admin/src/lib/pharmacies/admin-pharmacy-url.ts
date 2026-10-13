import { isCalendarDateString } from '@e-pharmacy/validation/dates';
import { isValidObjectId } from '@e-pharmacy/validation/url';

import { ADMIN_ROUTES } from '@/lib/routes/admin-routes';

import {
  ADMIN_PHARMACY_RATINGS,
  ADMIN_PHARMACY_STATUSES,
  assertAdminPharmacyId,
  type AdminPharmacyRating,
  type AdminPharmacyStatus,
} from './admin-pharmacy';

//===================================================================

export type AdminPharmacyListUrlState = Readonly<{
  pharmacyId: string;
  ownerId: string;
  status: AdminPharmacyStatus | 'all';
  createdFrom: string;
  createdTo: string;
  rating: AdminPharmacyRating | 'all';
  sort: 'created_desc' | 'created_asc';
  page: number;
  perPage: 20 | 50 | 100;
}>;

//===================================================================

export type AdminPharmacySearchParam = string | string[] | undefined;

export type AdminPharmacySearchParams = Readonly<
  Record<string, AdminPharmacySearchParam>
>;

//===================================================================

export const ADMIN_PHARMACY_DETAIL_TABS = [
  'information',
  'about-payment',
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

export type AdminPharmacyDetailTab =
  (typeof ADMIN_PHARMACY_DETAIL_TABS)[number];

export type AdminPharmacyRouteResolution =
  | Readonly<{ kind: 'list'; filters: readonly string[] }>
  | Readonly<{
      kind: 'detail';
      pharmacyId: string;
      tab: AdminPharmacyDetailTab;
      activitySegments?: readonly string[];
    }>
  | Readonly<{ kind: 'invalid' }>;

//===================================================================

const DEFAULTS: AdminPharmacyListUrlState = {
  pharmacyId: '',
  ownerId: '',
  status: 'all',
  createdFrom: '',
  createdTo: '',
  rating: 'all',
  sort: 'created_desc',
  page: 1,
  perPage: 20,
};

//===================================================================

function single(value: AdminPharmacySearchParam): string | undefined {
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

function status(value?: string): AdminPharmacyStatus | 'all' {
  const canonical = value?.replaceAll('-', '_').toLowerCase();

  return select(canonical, ADMIN_PHARMACY_STATUSES, 'all' as const);
}

//===================================================================

function normalize(
  state: Partial<Record<keyof AdminPharmacyListUrlState, unknown>>
): AdminPharmacyListUrlState {
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

    ownerId: id(typeof state.ownerId === 'string' ? state.ownerId : undefined),
    status: status(typeof state.status === 'string' ? state.status : undefined),
    createdFrom,
    createdTo,

    rating: select(
      typeof state.rating === 'string' ? state.rating : undefined,
      ADMIN_PHARMACY_RATINGS,
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
export function parseAdminPharmaciesListSearchParams(
  params: AdminPharmacySearchParams = {}
): AdminPharmacyListUrlState {
  return normalize({
    pharmacyId: single(params.pharmacyId),
    ownerId: single(params.ownerId),
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
  ['owner-id-', 'ownerId'],
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
): AdminPharmacyListUrlState {
  const raw: Record<string, string> = {};

  for (const segment of filters) {
    const found = FILTERS.find(([prefix]) => segment.startsWith(prefix));
    if (!found) throw new TypeError('Unknown pharmacy filter.');

    const [prefix, key] = found;
    if (key in raw) throw new TypeError('Duplicate pharmacy filter.');

    raw[key] = segment.slice(prefix.length);
  }

  return normalize(raw);
}

//===================================================================

/** Guards list filters against detail IDs and detail tabs before routing. */
export function resolveAdminPharmaciesRoute(
  segments?: readonly string[]
): AdminPharmacyRouteResolution {
  if (!segments?.length) return { kind: 'list', filters: [] };

  if (isValidObjectId(segments[0])) {
    const tab = segments[1] ?? 'information';

    if (!ADMIN_PHARMACY_DETAIL_TABS.includes(tab as AdminPharmacyDetailTab)) {
      return { kind: 'invalid' };
    }

    // Only Activity has nested URL-backed filters. Other tabs stay exact paths.
    if (segments.length > 2 && tab !== 'activity') {
      return { kind: 'invalid' };
    }

    return {
      kind: 'detail',
      pharmacyId: segments[0].toLowerCase(),
      tab: tab as AdminPharmacyDetailTab,
      ...(segments.length > 2 ? { activitySegments: segments.slice(2) } : {}),
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

export function parseAdminPharmaciesListSegments(
  filters: readonly string[] = []
): AdminPharmacyListUrlState {
  return parseListFilters(filters);
}

//===================================================================

/** No emails/names/phones in URL: searches use selected pharmacy/owner IDs. */
export function buildAdminPharmaciesListUrl(
  state: AdminPharmacyListUrlState
): string {
  const value = normalize(state);
  const result: string[] = [];

  if (value.pharmacyId) result.push(`pharmacy-id-${value.pharmacyId}`);
  if (value.ownerId) result.push(`owner-id-${value.ownerId}`);

  if (value.status !== 'all')
    result.push(`status-${value.status.replaceAll('_', '-')}`);

  if (value.createdFrom) result.push(`created-from-${value.createdFrom}`);
  if (value.createdTo) result.push(`created-to-${value.createdTo}`);
  if (value.rating !== 'all') result.push(`rating-${value.rating}`);
  if (value.sort !== 'created_desc') result.push('sort-created-asc');
  if (value.page !== 1) result.push(`page-${value.page}`);
  if (value.perPage !== 20) result.push(`per-page-${value.perPage}`);

  return [ADMIN_ROUTES.PHARMACIES, ...result].join('/');
}

//===================================================================

export function buildAdminPharmacyDetailUrl(
  rawPharmacyId: string,
  tab: AdminPharmacyDetailTab = 'information'
): string {
  const pharmacyId = assertAdminPharmacyId(rawPharmacyId);

  if (!ADMIN_PHARMACY_DETAIL_TABS.includes(tab))
    throw new TypeError('Invalid pharmacy detail tab.');

  return `${ADMIN_ROUTES.PHARMACIES}/${pharmacyId}${tab === 'information' ? '' : `/${tab}`}`;
}

//===================================================================

export function buildAdminPharmaciesListApiParams(
  state: AdminPharmacyListUrlState
) {
  const value = normalize(state);

  return {
    pharmacyId: value.pharmacyId || undefined,
    ownerId: value.ownerId || undefined,
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

export const ADMIN_PHARMACIES_LIST_URL_DEFAULTS = DEFAULTS;
