import type { ISODateTimeString } from '@e-pharmacy/types/primitives';

import type {
  OwnedPharmacyListItem,
  OwnedPharmacyListResponse,
  OwnedPharmacyOption,
  OwnedPharmacyOptionsResponse,
  OwnedPharmacyStatistics,
  OwnedPharmacyDetailResponse,
} from '@e-pharmacy/types/pharmacies';

import {
  parseAdminPharmacyOption,
  parseAdminPharmacyStatistics,
} from './admin-pharmacy-registry-parsers';

import { parsePharmacyProfileResponse } from './shared-dto-parsers';

//===================================================================

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Invalid owned pharmacy registry response.');
  }

  return value as Record<string, unknown>;
}

//=============================================================================

function nonnegative(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError('Invalid owned pharmacy metric.');
  }

  return value;
}

//=============================================================================

function whole(value: unknown): number {
  const result = nonnegative(value);

  if (!Number.isSafeInteger(result)) throw new TypeError('Invalid count.');

  return result;
}

//=============================================================================

function membership(value: unknown): 'owner' | 'manager' {
  if (value !== 'owner' && value !== 'manager') {
    throw new TypeError('Invalid owned pharmacy membership.');
  }

  return value;
}

//=============================================================================

const STATUSES = [
  'new',
  'on_verification',
  'active',
  'on_moderation',
  'on_reactivation',
  'blocked',
] as const;

//=============================================================================

function status(value: unknown): OwnedPharmacyListItem['status'] {
  if (!STATUSES.includes(value as (typeof STATUSES)[number])) {
    throw new TypeError('Invalid owned pharmacy status.');
  }

  return value as OwnedPharmacyListItem['status'];
}

//=============================================================================

function metrics(row: Record<string, unknown>) {
  return {
    activeClientsCount: whole(row.activeClientsCount),
    addedProductsCount: whole(row.addedProductsCount),
    successfulOrdersCount: whole(row.successfulOrdersCount),
    successfulRevenue: nonnegative(row.successfulRevenue),
  };
}

//=============================================================================

function parseOwnedPharmacyListItem(value: unknown): OwnedPharmacyListItem {
  const row = record(value);
  const base = parseAdminPharmacyOption(value);
  const role = membership(row.membershipRole);
  const rating = nonnegative(row.rating);

  if (rating > 5) throw new TypeError('Invalid pharmacy rating.');

  const createdAt = row.createdAt;

  if (
    typeof createdAt !== 'string' ||
    !Number.isFinite(Date.parse(createdAt))
  ) {
    throw new TypeError('Invalid pharmacy creation date.');
  }

  // Never require restricted KPIs from a manager, nor expose partial/malformed
  // owner metrics as if they were valid. The backend omits these intentionally.
  const privateKeys = [
    'activeClientsCount',
    'addedProductsCount',
    'successfulOrdersCount',
    'successfulRevenue',
  ] as const;

  const hasAnyMetrics = privateKeys.some((key) => row[key] !== undefined);

  if (role === 'manager' && hasAnyMetrics) {
    throw new TypeError('Unexpected restricted pharmacy metrics.');
  }

  return {
    ...base,

    status: status(row.status),
    membershipRole: role,
    createdAt: createdAt as ISODateTimeString,

    ...(role === 'owner' ? metrics(row) : {}),

    rating,
    reviewsCount: whole(row.reviewsCount),
  };
}

//=============================================================================

export function parseOwnedPharmacyListResponse(
  value: unknown
): OwnedPharmacyListResponse {
  const response = record(value);

  if (!Array.isArray(response.items))
    throw new TypeError('Invalid pharmacy list.');

  const page = whole(response.page);
  const perPage = whole(response.perPage);
  const total = whole(response.total);
  const totalPages = whole(response.totalPages);

  if (
    page < 1 ||
    ![20, 50, 100].includes(perPage) ||
    totalPages !== Math.ceil(total / perPage) ||
    page > Math.max(1, totalPages)
  ) {
    throw new TypeError('Invalid pharmacy pagination.');
  }

  const earliest = response.earliestCreatedAt;

  if (
    earliest !== null &&
    (typeof earliest !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(earliest) ||
      !Number.isFinite(Date.parse(earliest)))
  ) {
    throw new TypeError('Invalid pharmacy first creation date.');
  }

  return {
    items: response.items.map(parseOwnedPharmacyListItem),
    page,
    perPage,
    total,
    totalPages,
    earliestCreatedAt: earliest as string | null,
  };
}

//=============================================================================

export const parseOwnedPharmacyStatistics = parseAdminPharmacyStatistics as (
  value: unknown
) => OwnedPharmacyStatistics;

//=============================================================================

export function parseOwnedPharmacyOptionsResponse(
  value: unknown
): OwnedPharmacyOptionsResponse {
  const response = record(value);

  if (!Array.isArray(response.items))
    throw new TypeError('Invalid pharmacy options.');

  return {
    items: response.items.map((entry: unknown): OwnedPharmacyOption => {
      const row = record(entry);
      const base = parseAdminPharmacyOption(entry);

      return {
        id: base.id,
        name: base.name,

        ...(base.imageUrl ? { imageUrl: base.imageUrl } : {}),
        ...(base.email ? { email: base.email } : {}),
        ...(base.phone ? { phone: base.phone } : {}),
        ...(base.location ? { location: base.location } : {}),

        status: status(row.status),
        membershipRole: membership(row.membershipRole),
      };
    }),
  };
}

//=============================================================================

function isoDate(value: unknown): ISODateTimeString {
  if (
    typeof value !== 'string' ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  ) {
    throw new TypeError('Invalid pharmacy detail date.');
  }

  return value as ISODateTimeString;
}

//=============================================================================

export function parseOwnedPharmacyDetailResponse(
  value: unknown
): OwnedPharmacyDetailResponse {
  const row = record(value);
  const profile = parsePharmacyProfileResponse({ pharmacy: row.pharmacy });
  const metricsValue = row.metrics;
  const dates = record(row.dates);

  const parsedDates: OwnedPharmacyDetailResponse['dates'] = {
    createdAt: isoDate(dates.createdAt),
    updatedAt: isoDate(dates.updatedAt),

    ...(dates.submittedAt !== undefined
      ? { submittedAt: isoDate(dates.submittedAt) }
      : {}),

    ...(dates.approvedAt !== undefined
      ? { approvedAt: isoDate(dates.approvedAt) }
      : {}),

    ...(dates.activatedAt !== undefined
      ? { activatedAt: isoDate(dates.activatedAt) }
      : {}),
  };

  if (metricsValue !== null && profile.pharmacy.membershipRole !== 'owner') {
    throw new TypeError('Unexpected restricted pharmacy detail metrics.');
  }

  if (metricsValue === null)
    return { pharmacy: profile.pharmacy, dates: parsedDates, metrics: null };

  const m = record(metricsValue);
  const rating = nonnegative(m.rating);

  if (rating > 5) throw new TypeError('Invalid pharmacy rating.');

  return {
    pharmacy: profile.pharmacy,
    dates: parsedDates,
    metrics: { ...metrics(m), rating, reviewsCount: whole(m.reviewsCount) },
  };
}
