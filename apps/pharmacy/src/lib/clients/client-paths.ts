import {
  CLIENT_SLUG_SEGMENT_SEPARATOR_PATTERN,
  URL_CLIENT_TEXT_PARAM_DISALLOWED_CHARS_PATTERN,
  deslugifyNameSegment,
  isDateParam,
  sanitizeTextParam,
  slugifySegment,
  slugifyStatus,
} from '@e-pharmacy/validation';

import { PHARMACY_CLIENTS } from '@/lib/layout/routes';

import type { ClientStatus } from './clients';

//===================================================================

const CLIENT_STATUSES: ClientStatus[] = ['active', 'blocked'];

const CLIENT_TEXT_PARAM_OPTIONS = {
  disallowedCharsPattern: URL_CLIENT_TEXT_PARAM_DISALLOWED_CHARS_PATTERN,
} as const;

const CLIENT_SLUG_OPTIONS = {
  separatorPattern: CLIENT_SLUG_SEGMENT_SEPARATOR_PATTERN,
} as const;

//===================================================================

export type ClientStatusFilter = 'all' | ClientStatus;

//===================================================================

export type ClientsFilterState = Readonly<{
  firstOrderDate: {
    from: string;
    to: string;
  };
  name: string;
  clientId: string;
  email: string;
  phone: string;
  address: string;
  status: ClientStatusFilter;
}>;

//===================================================================

type ClientsFilterDraft = {
  firstOrderDate: {
    from: string;
    to: string;
  };
  name: string;
  clientId: string;
  email: string;
  phone: string;
  address: string;
  status: ClientsFilterState['status'];
};

//===================================================================

function normalizeStatusSegment(value: string): ClientStatus | null {
  const normalized = value.replace(/-/g, '_');

  return CLIENT_STATUSES.includes(normalized as ClientStatus)
    ? (normalized as ClientStatus)
    : null;
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
    segment.startsWith('email-') ||
    segment.startsWith('phone-') ||
    segment.startsWith('address-') ||
    segment.startsWith('status-') ||
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
    firstOrderDate: {
      from: '',
      to: '',
    },
    name: '',
    clientId: '',
    email: '',
    phone: '',
    address: '',
    status: 'all',
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

    if (segment.startsWith('email-')) {
      filters.email = sanitizeTextParam(
        segment.replace('email-', ''),
        CLIENT_TEXT_PARAM_OPTIONS
      );
      continue;
    }

    if (segment.startsWith('phone-')) {
      filters.phone = sanitizeTextParam(
        segment.replace('phone-', ''),
        CLIENT_TEXT_PARAM_OPTIONS
      );
      continue;
    }

    if (segment.startsWith('address-')) {
      filters.address = deslugifyNameSegment(
        segment.replace('address-', ''),
        CLIENT_TEXT_PARAM_OPTIONS
      );
      continue;
    }

    if (segment.startsWith('status-')) {
      const status = normalizeStatusSegment(segment.replace('status-', ''));

      if (status) {
        filters.status = status;
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

  return filters;
}

//===================================================================

export function buildClientsPath(filters: ClientsFilterState): string {
  const segments: string[] = [];
  const name = filters.name.trim();
  const clientId = filters.clientId.trim();
  const email = filters.email.trim();
  const phone = filters.phone.trim();
  const address = filters.address.trim();

  if (name) {
    segments.push(`search-name-${slugifySegment(name, CLIENT_SLUG_OPTIONS)}`);
  }

  if (clientId) {
    segments.push(`client-id-${slugifySegment(clientId, CLIENT_SLUG_OPTIONS)}`);
  }

  if (email) {
    segments.push(`email-${slugifySegment(email, CLIENT_SLUG_OPTIONS)}`);
  }

  if (phone) {
    segments.push(`phone-${slugifySegment(phone, CLIENT_SLUG_OPTIONS)}`);
  }

  if (address) {
    segments.push(`address-${slugifySegment(address, CLIENT_SLUG_OPTIONS)}`);
  }

  if (filters.status !== 'all') {
    segments.push(`status-${slugifyStatus(filters.status)}`);
  }

  if (filters.firstOrderDate.from) {
    segments.push(`date-from-${filters.firstOrderDate.from}`);
  }

  if (filters.firstOrderDate.to) {
    segments.push(`date-to-${filters.firstOrderDate.to}`);
  }

  return segments.length
    ? `${PHARMACY_CLIENTS}/${segments.join('/')}`
    : PHARMACY_CLIENTS;
}
