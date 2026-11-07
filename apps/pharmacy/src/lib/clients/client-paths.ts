import { CLIENT_ACCOUNT_STATUSES } from '@e-pharmacy/config/users';

import {
  isDateParam,
  isValidObjectId,
  isDateRangeValid,
  normalizeSlugEnumValue,
  slugifyStatus,
} from '@e-pharmacy/validation/url';

import {
  CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES,
  type ClientSuccessfulOrdersFilter,
} from '@/lib/clients/config';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { type ClientStatus } from '@/lib/clients/clients';

//===================================================================

export type ClientStatusFilter = 'all' | ClientStatus;

export type ClientSuccessfulOrdersRouteFilter =
  | 'all'
  | ClientSuccessfulOrdersFilter;

//===================================================================

export type ClientsFilterState = Readonly<{
  firstOrderDate: {
    from: string;
    to: string;
  };

  name: string;
  clientId: string;
  contact: string;
  pharmacyId: string;
  status: ClientStatusFilter;
  successfulOrders: ClientSuccessfulOrdersRouteFilter;
}>;

//===================================================================

export const DEFAULT_CLIENTS_FILTERS: ClientsFilterState = {
  firstOrderDate: {
    from: '',
    to: '',
  },

  name: '',
  clientId: '',
  contact: '',
  pharmacyId: '',
  status: 'all',
  successfulOrders: 'all',
};

//===================================================================

type ClientsFilterDraft = {
  firstOrderDate: {
    from: string;
    to: string;
  };

  name: string;
  clientId: string;
  contact: string;
  pharmacyId: string;
  status: ClientsFilterState['status'];
  successfulOrders: ClientsFilterState['successfulOrders'];
};

//===================================================================

function normalizeSuccessfulOrdersSegment(
  value: string
): Exclude<ClientSuccessfulOrdersRouteFilter, 'all'> | null {
  return normalizeSlugEnumValue(value, CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES);
}

//===================================================================

export type ClientsRouteParams = Readonly<{
  filters?: string[];
}>;

export type ClientsRouteResolution =
  | Readonly<{ kind: 'filters'; filters: string[] }>
  | Readonly<{ kind: 'detail'; clientId: string }>
  | Readonly<{ kind: 'invalid' }>;

//===================================================================

export function isClientsFilterSegment(segment: string): boolean {
  return (
    segment.startsWith('pharmacy-') ||
    segment.startsWith('search-name-') ||
    segment.startsWith('client-id-') ||
    segment.startsWith('contact-') ||
    segment.startsWith('email-') ||
    segment.startsWith('phone-') ||
    segment.startsWith('address-') ||
    segment.startsWith('status-') ||
    segment.startsWith('successful-orders-') ||
    segment.startsWith('date-from-') ||
    segment.startsWith('date-to-') ||
    /^page-[1-9]\d*$/.test(segment) ||
    /^per-page-(20|50|100)$/.test(segment)
  );
}

//===================================================================

export function isClientsFilterRoute(segments: string[] | undefined): boolean {
  return !segments?.length || segments.every(isClientsFilterSegment);
}

//===================================================================

export function resolveClientsRoute(
  segments: string[] | undefined
): ClientsRouteResolution {
  if (!segments?.length) {
    return { kind: 'filters', filters: [] };
  }

  if (isClientsFilterRoute(segments)) {
    return { kind: 'filters', filters: segments };
  }

  if (segments.length === 1 && isValidObjectId(segments[0])) {
    return { kind: 'detail', clientId: segments[0] };
  }

  return { kind: 'invalid' };
}

//===================================================================

export function parseClientsSegments(
  params: ClientsRouteParams = {}
): ClientsFilterState {
  const filters: ClientsFilterDraft = {
    ...DEFAULT_CLIENTS_FILTERS,
    firstOrderDate: { ...DEFAULT_CLIENTS_FILTERS.firstOrderDate },
  };

  for (const segment of params.filters ?? []) {
    if (segment.startsWith('pharmacy-')) {
      const pharmacyId = segment.slice('pharmacy-'.length);

      if (isValidObjectId(pharmacyId))
        filters.pharmacyId = pharmacyId.toLowerCase();

      continue;
    }

    if (
      segment.startsWith('search-name-') ||
      segment.startsWith('contact-') ||
      segment.startsWith('email-') ||
      segment.startsWith('phone-') ||
      segment.startsWith('address-')
    ) {
      // Legacy PII-bearing URLs are recognized so the page can canonicalize
      // them, but their values are intentionally not restored into state.
      continue;
    }

    if (segment.startsWith('client-id-')) {
      const clientId = segment.slice('client-id-'.length);

      if (isValidObjectId(clientId)) filters.clientId = clientId.toLowerCase();

      continue;
    }

    if (segment.startsWith('status-')) {
      const status = normalizeSlugEnumValue(
        segment.replace('status-', ''),
        CLIENT_ACCOUNT_STATUSES
      );

      if (status) {
        filters.status = status;
      }

      continue;
    }

    if (segment.startsWith('successful-orders-')) {
      const successfulOrders = normalizeSuccessfulOrdersSegment(
        segment.replace('successful-orders-', '')
      );

      if (successfulOrders) {
        filters.successfulOrders = successfulOrders;
      }

      continue;
    }

    if (segment.startsWith('date-from-')) {
      const dateFrom = segment.replace('date-from-', '');

      if (isDateParam(dateFrom)) {
        filters.firstOrderDate = {
          ...filters.firstOrderDate,
          from: dateFrom,
        };
      }

      continue;
    }

    if (segment.startsWith('date-to-')) {
      const dateTo = segment.replace('date-to-', '');

      if (isDateParam(dateTo)) {
        filters.firstOrderDate = {
          ...filters.firstOrderDate,
          to: dateTo,
        };
      }
    }
  }

  if (!isDateRangeValid(filters.firstOrderDate)) {
    filters.firstOrderDate = { ...DEFAULT_CLIENTS_FILTERS.firstOrderDate };
  }

  return filters;
}

//===================================================================

export type ClientsPaginationState = Readonly<{
  page: number;
  perPage: 20 | 50 | 100;
}>;

//===================================================================

/** Path-only paging for pharmacy-detail Clients. No personal search text in URLs. */
export function parseClientsPaginationSegments(
  segments: readonly string[]
): ClientsPaginationState {
  let page = 1;
  let perPage: 20 | 50 | 100 = 20;

  for (const segment of segments) {
    if (/^page-[1-9]\d*$/.test(segment)) {
      const value = Number(segment.slice(5));

      if (Number.isSafeInteger(value)) page = value;
    }

    if (/^per-page-(20|50|100)$/.test(segment)) {
      perPage = Number(segment.slice(9)) as 20 | 50 | 100;
    }
  }

  return { page, perPage };
}

//===================================================================

export function buildClientsPath(
  filters: ClientsFilterState,
  basePath: string = PHARMACY_ROUTES.CLIENTS,
  pagination?: ClientsPaginationState
): string {
  const segments: string[] = [];
  const dateRangeIsValid = isDateRangeValid(filters.firstOrderDate);

  // Only the opaque entity ID is persisted; never include names, contact
  // details or free-text search terms in a sharable URL.
  if (isValidObjectId(filters.clientId)) {
    segments.push(`client-id-${filters.clientId.toLowerCase()}`);
  }

  if (filters.status !== 'all') {
    segments.push(`status-${slugifyStatus(filters.status)}`);
  }

  if (filters.successfulOrders !== 'all') {
    segments.push(`successful-orders-${filters.successfulOrders}`);
  }

  if (dateRangeIsValid && filters.firstOrderDate.from) {
    segments.push(`date-from-${filters.firstOrderDate.from}`);
  }

  if (dateRangeIsValid && filters.firstOrderDate.to) {
    segments.push(`date-to-${filters.firstOrderDate.to}`);
  }

  if (pagination?.perPage && pagination.perPage !== 20) {
    segments.push(`per-page-${pagination.perPage}`);
  }

  if (pagination?.page && pagination.page > 1) {
    segments.push(`page-${pagination.page}`);
  }

  return segments.length ? `${basePath}/${segments.join('/')}` : basePath;
}
