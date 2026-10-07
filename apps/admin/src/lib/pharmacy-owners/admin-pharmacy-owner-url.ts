import { isCalendarDateString } from '@e-pharmacy/validation/dates';

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

export function parseAdminPharmacyOwnersListSearchParams(
  params: AdminSearchParams = {}
): AdminPharmacyOwnersListUrlState {
  const registeredFrom = parseDate(getSingle(params.registeredFrom));
  const registeredTo = parseDate(getSingle(params.registeredTo));
  const range = normalizeDateRange(registeredFrom, registeredTo);
  const status = getSingle(params.status);

  return {
    search: normalizeSearch(getSingle(params.search)),
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

  return `${ADMIN_ROUTES.PHARMACY_OWNERS}${buildQuery({
    search: normalizeSearch(state.search) || undefined,
    status: isOwnerStatus(state.status) ? state.status : undefined,
    registeredFrom: range.from || undefined,
    registeredTo: range.to || undefined,
    page: state.page > 1 ? parsePage(String(state.page)) : undefined,
    perPage:
      state.perPage === 20 ? undefined : parsePerPage(String(state.perPage)),
  })}`;
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
