import {
  CLIENT_SLUG_SEGMENT_SEPARATOR_PATTERN,
  URL_CLIENT_TEXT_PARAM_DISALLOWED_CHARS_PATTERN,
  deslugifyNameSegment,
  isDateParam,
  isDateRangeValid,
  normalizeSlugEnumValue,
  sanitizeTextParam,
  slugifySegment,
  slugifyStatus,
} from '@e-pharmacy/validation/url';

import {
  CLIENT_SUCCESSFUL_ORDERS_FILTERS,
  type ClientSuccessfulOrdersFilter as ClientSuccessfulOrdersValue,
} from '@e-pharmacy/types/clients';

import { PHARMACY_CLIENTS } from '@/lib/layout/routes';

import { CLIENT_STATUSES, type ClientStatus } from './clients';

//===================================================================

const CLIENT_TEXT_PARAM_OPTIONS = {
  disallowedCharsPattern: URL_CLIENT_TEXT_PARAM_DISALLOWED_CHARS_PATTERN,
} as const;

const CLIENT_SLUG_OPTIONS = {
  separatorPattern: CLIENT_SLUG_SEGMENT_SEPARATOR_PATTERN,
} as const;

//===================================================================

export type ClientStatusFilter = 'all' | ClientStatus;
export type ClientSuccessfulOrdersFilter =
  | 'all'
  | ClientSuccessfulOrdersValue;

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
  successfulOrders: ClientSuccessfulOrdersFilter;
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

function normalizeStatusSegment(value: string): ClientStatus | null {
  return normalizeSlugEnumValue(value, CLIENT_STATUSES);
}

//===================================================================

function normalizeSuccessfulOrdersSegment(
  value: string
): Exclude<ClientSuccessfulOrdersFilter, 'all'> | null {
  return normalizeSlugEnumValue(value, CLIENT_SUCCESSFUL_ORDERS_FILTERS);
}

//===================================================================

function sanitizeContactSegment(value: string): string {
  return sanitizeTextParam(value, CLIENT_TEXT_PARAM_OPTIONS);
}

//===================================================================

function deslugifyContactSegment(value: string): string {
  return deslugifyNameSegment(value, CLIENT_TEXT_PARAM_OPTIONS);
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
    if (segment.startsWith('search-name-')) {
      filters.name = deslugifyNameSegment(
        segment.replace('search-name-', ''),
        CLIENT_TEXT_PARAM_OPTIONS
      );
      continue;
    }

    if (segment.startsWith('client-id-')) {
      filters.clientId = sanitizeTextParam(
        segment.replace('client-id-', ''),
        CLIENT_TEXT_PARAM_OPTIONS
      );
      continue;
    }

    if (segment.startsWith('contact-')) {
      filters.contact = deslugifyContactSegment(segment.replace('contact-', ''));
      continue;
    }

    if (segment.startsWith('email-')) {
      filters.contact = sanitizeContactSegment(segment.replace('email-', ''));
      continue;
    }

    if (segment.startsWith('phone-')) {
      filters.contact = sanitizeContactSegment(segment.replace('phone-', ''));
      continue;
    }

    if (segment.startsWith('address-')) {
      filters.contact = deslugifyContactSegment(segment.replace('address-', ''));
      continue;
    }

    if (segment.startsWith('status-')) {
      const status = normalizeStatusSegment(segment.replace('status-', ''));

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
  const name = filters.name.trim();
  const clientId = filters.clientId.trim();
  const contact = filters.contact.trim();

  if (name) {
    segments.push(`search-name-${slugifySegment(name, CLIENT_SLUG_OPTIONS)}`);
  }

  if (clientId) {
    segments.push(`client-id-${slugifySegment(clientId, CLIENT_SLUG_OPTIONS)}`);
  }

  if (contact) {
    segments.push(`contact-${slugifySegment(contact, CLIENT_SLUG_OPTIONS)}`);
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

  return segments.length
    ? `${PHARMACY_CLIENTS}/${segments.join('/')}`
    : PHARMACY_CLIENTS;
}
