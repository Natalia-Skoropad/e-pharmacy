import { USER_SEARCH_MAX_LENGTH } from '@e-pharmacy/validation';

import { PHARMACY_CLIENTS } from '@/lib/layout/routes';

import type { ClientsFilterState } from '@/components/clients/ClientsPageContent';
import type { ClientStatus } from './clients';

//===================================================================

const URL_TEXT_PARAM_DISALLOWED_CHARS_PATTERN = /[^A-Za-z0-9 .@_+-]/g;
const SLUG_SEGMENT_SEPARATOR_PATTERN = /[^a-z0-9.@_+]+/g;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

//===================================================================

const CLIENT_STATUSES: ClientStatus[] = ['active', 'blocked'];

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

function sanitizeTextParam(value?: string): string {
  return (
    value
      ?.trim()
      .replace(URL_TEXT_PARAM_DISALLOWED_CHARS_PATTERN, '')
      .slice(0, USER_SEARCH_MAX_LENGTH) ?? ''
  );
}

//===================================================================

function slugifySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(SLUG_SEGMENT_SEPARATOR_PATTERN, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, USER_SEARCH_MAX_LENGTH);
}

//===================================================================

function deslugifyTextSegment(value: string): string {
  return sanitizeTextParam(value.replace(/-/g, ' '));
}

//===================================================================

function deslugifyDirectSegment(value: string): string {
  return sanitizeTextParam(value);
}

//===================================================================

function isValidClientDate(value?: string): boolean {
  return Boolean(value && DATE_PATTERN.test(value));
}

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

export function isClientsFilterRoute(
  segments: string[] | undefined
): boolean {
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
      filters.name = deslugifyTextSegment(segment.replace('search-name-', ''));
      continue;
    }

    if (segment.startsWith('client-id-')) {
      filters.clientId = deslugifyDirectSegment(segment.replace('client-id-', ''));
      continue;
    }

    if (segment.startsWith('email-')) {
      filters.email = deslugifyDirectSegment(segment.replace('email-', ''));
      continue;
    }

    if (segment.startsWith('phone-')) {
      filters.phone = deslugifyDirectSegment(segment.replace('phone-', ''));
      continue;
    }

    if (segment.startsWith('address-')) {
      filters.address = deslugifyTextSegment(segment.replace('address-', ''));
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

      if (isValidClientDate(dateFrom)) {
        filters.firstOrderDate = {
          ...filters.firstOrderDate,
          from: dateFrom,
        };
      }

      continue;
    }

    if (segment.startsWith('date-to-')) {
      const dateTo = segment.replace('date-to-', '');

      if (isValidClientDate(dateTo)) {
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
    segments.push(`search-name-${slugifySegment(name)}`);
  }

  if (clientId) {
    segments.push(`client-id-${slugifySegment(clientId)}`);
  }

  if (email) {
    segments.push(`email-${slugifySegment(email)}`);
  }

  if (phone) {
    segments.push(`phone-${slugifySegment(phone)}`);
  }

  if (address) {
    segments.push(`address-${slugifySegment(address)}`);
  }

  if (filters.status !== 'all') {
    segments.push(`status-${filters.status.replace(/_/g, '-')}`);
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
