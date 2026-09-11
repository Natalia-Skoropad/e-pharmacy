import { USER_STATUSES } from '@e-pharmacy/config/users';

import {
  isDateParam,
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

//===================================================================

export function isClientsFilterSegment(segment: string): boolean {
  return (
    segment.startsWith('search-name-') ||
    segment.startsWith('client-id-') ||
    segment.startsWith('contact-') ||
    segment.startsWith('email-') ||
    segment.startsWith('phone-') ||
    segment.startsWith('address-') ||
    segment.startsWith('status-') ||
    segment.startsWith('successful-orders-') ||
    segment.startsWith('date-from-') ||
    segment.startsWith('date-to-')
  );
}

//===================================================================

export function isClientsFilterRoute(segments: string[] | undefined): boolean {
  return !segments?.length || segments.every(isClientsFilterSegment);
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
    if (
      segment.startsWith('search-name-') ||
      segment.startsWith('client-id-') ||
      segment.startsWith('contact-') ||
      segment.startsWith('email-') ||
      segment.startsWith('phone-') ||
      segment.startsWith('address-')
    ) {
      // Legacy PII-bearing URLs are recognized so the page can canonicalize
      // them, but their values are intentionally not restored into state.
      continue;
    }

    if (segment.startsWith('status-')) {
      const status = normalizeSlugEnumValue(
        segment.replace('status-', ''),
        USER_STATUSES
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

export function buildClientsPath(filters: ClientsFilterState): string {
  const segments: string[] = [];
  const dateRangeIsValid = isDateRangeValid(filters.firstOrderDate);

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

  return segments.length
    ? `${PHARMACY_ROUTES.CLIENTS}/${segments.join('/')}`
    : PHARMACY_ROUTES.CLIENTS;
}
