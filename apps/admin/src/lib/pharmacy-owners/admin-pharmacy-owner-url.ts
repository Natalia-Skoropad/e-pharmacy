import { isCalendarDateString } from '@e-pharmacy/validation/dates';
import { isValidObjectId, slugifyStatus } from '@e-pharmacy/validation/url';

import { ADMIN_ROUTES } from '@/lib/routes/admin-routes';

import {
  ADMIN_OWNER_PHARMACY_STATUSES,
  ADMIN_OWNER_RATING_FILTERS,
  ADMIN_PHARMACY_OWNER_STATUSES,
  assertAdminPharmacyOwnerEntityId,
  type AdminOwnerPharmacyStatus,
  type AdminOwnerRatingFilter,
  type AdminPharmacyOwnerStatus,
} from './admin-pharmacy-owner';

//===================================================================

export type AdminSearchParamValue = string | string[] | undefined;
export type AdminSearchParams = Readonly<Record<string, AdminSearchParamValue>>;

export type AdminPharmacyOwnersListUrlState = Readonly<{
  search: string;
  status: AdminPharmacyOwnerStatus | 'all';
  registeredFrom: string;
  registeredTo: string;
  page: number;
  perPage: 20 | 50 | 100;
}>;

export type AdminPharmacyOwnersRouteParams = Readonly<{
  filters?: string[];
}>;

export type AdminPharmacyOwnersRouteResolution =
  | Readonly<{ kind: 'filters'; filters: string[] }>
  | Readonly<{ kind: 'detail'; ownerId: string }>
  | Readonly<{ kind: 'invalid' }>;

//===================================================================

export const ADMIN_PHARMACY_OWNER_DETAIL_TABS = [
  'personal',
  'pharmacies',
  'documents',
  'comments',
  'activity',
] as const;

//===================================================================

export type AdminPharmacyOwnerDetailTab =
  (typeof ADMIN_PHARMACY_OWNER_DETAIL_TABS)[number];

export type AdminPharmacyOwnerDetailUrlState = Readonly<{
  tab: AdminPharmacyOwnerDetailTab;
}>;

export type AdminPharmacyOwnerPharmaciesUrlState = Readonly<{
  search: string;
  status: AdminOwnerPharmacyStatus | 'all';
  createdFrom: string;
  createdTo: string;
  rating: AdminOwnerRatingFilter | 'all';
  page: number;
  perPage: 20 | 50 | 100;
}>;

//===================================================================

function getSingle(value: AdminSearchParamValue): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

//===================================================================

function normalizeSearch(value?: string): string {
  return (
    value
      ?.trim()
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .slice(0, 120) ?? ''
  );
}

//===================================================================

function parsePage(value?: string): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

//===================================================================

function parsePerPage(value?: string): 20 | 50 | 100 {
  return value === '50' ? 50 : value === '100' ? 100 : 20;
}

//===================================================================

function parseDate(value?: string): string {
  return isCalendarDateString(value) ? value : '';
}

//===================================================================

function normalizeDateRange(
  from: string,
  to: string
): Readonly<{ from: string; to: string }> {
  if (from && to && from > to) return { from: '', to: '' };
  return { from, to };
}

//===================================================================

function isOwnerStatus(value?: string): value is AdminPharmacyOwnerStatus {
  return Boolean(
    value &&
    (ADMIN_PHARMACY_OWNER_STATUSES as readonly string[]).includes(value)
  );
}

//===================================================================

function isPharmacyStatus(value?: string): value is AdminOwnerPharmacyStatus {
  return Boolean(
    value &&
    (ADMIN_OWNER_PHARMACY_STATUSES as readonly string[]).includes(value)
  );
}

//===================================================================

function isRating(value?: string): value is AdminOwnerRatingFilter {
  return Boolean(
    value && (ADMIN_OWNER_RATING_FILTERS as readonly string[]).includes(value)
  );
}

//===================================================================

function isDetailTab(value?: string): value is AdminPharmacyOwnerDetailTab {
  return Boolean(
    value &&
    (ADMIN_PHARMACY_OWNER_DETAIL_TABS as readonly string[]).includes(value)
  );
}

//===================================================================

function buildQuery(
  entries: Readonly<Record<string, string | number | undefined>>
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === '' || value === 1 || value === 20) {
      continue;
    }
    params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

//===================================================================

export function isAdminPharmacyOwnersFilterSegment(segment: string): boolean {
  return (
    segment.startsWith('owner-id-') ||
    segment.startsWith('status-') ||
    segment.startsWith('registered-from-') ||
    segment.startsWith('registered-to-') ||
    segment.startsWith('page-') ||
    segment.startsWith('per-page-')
  );
}

//===================================================================

export function resolveAdminPharmacyOwnersRoute(
  segments: string[] | undefined
): AdminPharmacyOwnersRouteResolution {
  if (!segments?.length) return { kind: 'filters', filters: [] };

  if (segments.every(isAdminPharmacyOwnersFilterSegment)) {
    return { kind: 'filters', filters: segments };
  }

  if (segments.length === 1 && isValidObjectId(segments[0])) {
    return { kind: 'detail', ownerId: segments[0] };
  }

  return { kind: 'invalid' };
}

//===================================================================

export function parseAdminPharmacyOwnersListSegments(
  params: AdminPharmacyOwnersRouteParams = {}
): AdminPharmacyOwnersListUrlState {
  let search = '';
  let status: AdminPharmacyOwnerStatus | 'all' = 'all';
  let registeredFrom = '';
  let registeredTo = '';
  let page = 1;
  let perPage: 20 | 50 | 100 = 20;

  for (const segment of params.filters ?? []) {
    if (segment.startsWith('owner-id-')) {
      const candidate = segment.replace('owner-id-', '');
      search = isValidObjectId(candidate) ? candidate : '';
      continue;
    }

    if (segment.startsWith('status-')) {
      const candidate = segment.replace('status-', '').replace(/-/g, '_');
      status = isOwnerStatus(candidate) ? candidate : 'all';
      continue;
    }

    if (segment.startsWith('registered-from-')) {
      registeredFrom = parseDate(segment.replace('registered-from-', ''));
      continue;
    }

    if (segment.startsWith('registered-to-')) {
      registeredTo = parseDate(segment.replace('registered-to-', ''));
      continue;
    }

    if (segment.startsWith('page-')) {
      page = parsePage(segment.replace('page-', ''));
      continue;
    }

    if (segment.startsWith('per-page-')) {
      perPage = parsePerPage(segment.replace('per-page-', ''));
    }
  }

  const range = normalizeDateRange(registeredFrom, registeredTo);

  return {
    search,
    status,
    registeredFrom: range.from,
    registeredTo: range.to,
    page,
    perPage,
  };
}

//===================================================================

export function parseAdminPharmacyOwnersListSearchParams(
  params: AdminSearchParams = {}
): AdminPharmacyOwnersListUrlState {
  const registeredFrom = parseDate(getSingle(params.registeredFrom));
  const registeredTo = parseDate(getSingle(params.registeredTo));
  const range = normalizeDateRange(registeredFrom, registeredTo);
  const status = getSingle(params.status);
  const search = normalizeSearch(getSingle(params.search));

  return {
    search: isValidObjectId(search) ? search : '',
    status: isOwnerStatus(status) ? status : 'all',
    registeredFrom: range.from,
    registeredTo: range.to,
    page: parsePage(getSingle(params.page)),
    perPage: parsePerPage(getSingle(params.perPage)),
  };
}

//===================================================================

export function buildAdminPharmacyOwnersListUrl(
  state: AdminPharmacyOwnersListUrlState
): string {
  const range = normalizeDateRange(
    parseDate(state.registeredFrom),
    parseDate(state.registeredTo)
  );

  const segments: string[] = [];

  const search = normalizeSearch(state.search);
  if (isValidObjectId(search)) segments.push(`owner-id-${search}`);

  if (isOwnerStatus(state.status)) {
    segments.push(`status-${slugifyStatus(state.status)}`);
  }

  if (range.from) segments.push(`registered-from-${range.from}`);
  if (range.to) segments.push(`registered-to-${range.to}`);

  const page = parsePage(String(state.page));
  if (page > 1) segments.push(`page-${page}`);

  const perPage = parsePerPage(String(state.perPage));
  if (perPage !== 20) segments.push(`per-page-${perPage}`);

  return segments.length
    ? `${ADMIN_ROUTES.PHARMACY_OWNERS}/${segments.join('/')}`
    : ADMIN_ROUTES.PHARMACY_OWNERS;
}

//===================================================================

export function parseAdminPharmacyOwnerDetailSearchParams(
  params: AdminSearchParams = {}
): AdminPharmacyOwnerDetailUrlState {
  const tab = getSingle(params.tab);
  return { tab: isDetailTab(tab) ? tab : 'personal' };
}

//===================================================================

export function buildAdminPharmacyOwnerDetailUrl(
  ownerId: string,
  state: AdminPharmacyOwnerDetailUrlState = { tab: 'personal' }
): string {
  assertAdminPharmacyOwnerEntityId(ownerId, 'owner id');
  const tab = isDetailTab(state.tab) ? state.tab : 'personal';
  const query = tab === 'personal' ? '' : `?tab=${encodeURIComponent(tab)}`;
  return `${ADMIN_ROUTES.PHARMACY_OWNERS}/${encodeURIComponent(ownerId)}${query}`;
}

//===================================================================

export function parseAdminPharmacyOwnerPharmaciesSearchParams(
  params: AdminSearchParams = {}
): AdminPharmacyOwnerPharmaciesUrlState {
  const createdFrom = parseDate(getSingle(params.pharmacyCreatedFrom));
  const createdTo = parseDate(getSingle(params.pharmacyCreatedTo));
  const range = normalizeDateRange(createdFrom, createdTo);
  const status = getSingle(params.pharmacyStatus);
  const rating = getSingle(params.pharmacyRating);

  return {
    search: normalizeSearch(getSingle(params.pharmacySearch)),
    status: isPharmacyStatus(status) ? status : 'all',
    createdFrom: range.from,
    createdTo: range.to,
    rating: isRating(rating) ? rating : 'all',
    page: parsePage(getSingle(params.pharmacyPage)),
    perPage: parsePerPage(getSingle(params.pharmacyPerPage)),
  };
}

//===================================================================

export function buildAdminPharmacyOwnerPharmaciesUrl(
  ownerId: string,
  state: AdminPharmacyOwnerPharmaciesUrlState
): string {
  assertAdminPharmacyOwnerEntityId(ownerId, 'owner id');
  const range = normalizeDateRange(
    parseDate(state.createdFrom),
    parseDate(state.createdTo)
  );

  return `${ADMIN_ROUTES.PHARMACY_OWNERS}/${encodeURIComponent(ownerId)}${buildQuery(
    {
      tab: 'pharmacies',
      pharmacySearch: normalizeSearch(state.search) || undefined,
      pharmacyStatus: isPharmacyStatus(state.status) ? state.status : undefined,
      pharmacyCreatedFrom: range.from || undefined,
      pharmacyCreatedTo: range.to || undefined,
      pharmacyRating: isRating(state.rating) ? state.rating : undefined,
      pharmacyPage: state.page > 1 ? parsePage(String(state.page)) : undefined,
      pharmacyPerPage:
        state.perPage === 20 ? undefined : parsePerPage(String(state.perPage)),
    }
  )}`;
}

//===================================================================

export function buildAdminPharmacyOwnerListApiParams(
  state: AdminPharmacyOwnersListUrlState
) {
  return {
    search: state.search || undefined,
    status: state.status === 'all' ? undefined : state.status,
    registeredFrom: state.registeredFrom || undefined,
    registeredTo: state.registeredTo || undefined,
    page: state.page,
    perPage: state.perPage,
  } as const;
}

//===================================================================

export function buildAdminPharmacyOwnerPharmaciesApiParams(
  state: AdminPharmacyOwnerPharmaciesUrlState
) {
  return {
    search: state.search || undefined,
    status: state.status === 'all' ? undefined : state.status,
    createdFrom: state.createdFrom || undefined,
    createdTo: state.createdTo || undefined,
    rating: state.rating === 'all' ? undefined : state.rating,
    page: state.page,
    perPage: state.perPage,
  } as const;
}
