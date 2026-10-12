import type {
  AdminPharmacyListItem,
  AdminPharmacyListResponse,
  AdminPharmacyOption,
  AdminPharmacyOptionsResponse,
  AdminPharmacyStatistics,
  AdminPharmacyRegistryOwnerOptionsResponse,
} from '@e-pharmacy/types/admin';

import type {
  PharmacyLocationDraft,
  PharmacyStatus,
} from '@e-pharmacy/types/pharmacies';

import type { ISODateTimeString } from '@e-pharmacy/types/primitives';

//===================================================================

const PHARMACY_STATUSES: readonly string[] = [
  'new',
  'on_verification',
  'active',
  'on_moderation',
  'blocked',
];

//===================================================================

const OBJECT_ID = /^[0-9a-f]{24}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

//===================================================================

function validCalendarDate(value: string): boolean {
  if (!DATE.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

//===================================================================

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value as Record<string, unknown>;
}

//===================================================================

function id(value: unknown, label: string): string {
  if (typeof value !== 'string' || !OBJECT_ID.test(value))
    throw new TypeError(`Invalid ${label}.`);

  return value;
}

//===================================================================

function str(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new TypeError(`Invalid ${label}.`);

  return value;
}

//===================================================================

function optional(value: unknown, label: string): string | undefined {
  return value === undefined ? undefined : str(value, label);
}

//===================================================================

function count(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value;
}

//===================================================================

function amount(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value;
}

//===================================================================

function location(value: unknown): PharmacyLocationDraft | undefined {
  if (value === undefined || value === null) return undefined;
  const row = record(value, 'pharmacy location');

  // Location is a partial draft during onboarding. Reject malformed fields,
  // but never fabricate a missing address/settlement/region.
  for (const key of ['address', 'settlement', 'region', 'countryCode']) {
    if (
      row[key] !== undefined &&
      (typeof row[key] !== 'string' || !row[key].trim())
    ) {
      throw new TypeError(`Invalid pharmacy location ${key}.`);
    }
  }

  return row as PharmacyLocationDraft;
}

//===================================================================

function dateTime(value: unknown): ISODateTimeString {
  const date = str(value, 'pharmacy createdAt');
  const parsed = new Date(date);

  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== date) {
    throw new TypeError('Invalid pharmacy createdAt.');
  }

  return date as ISODateTimeString;
}

//===================================================================

function status(value: unknown): PharmacyStatus {
  if (!PHARMACY_STATUSES.includes(value as string)) {
    throw new TypeError('Invalid pharmacy status.');
  }

  return value as PharmacyStatus;
}

//===================================================================

function base(value: unknown) {
  const item = record(value, 'pharmacy');
  const pharmacyLocation = location(item.location);

  return {
    id: id(item.id, 'pharmacy id'),
    name: str(item.name, 'pharmacy name'),

    ...(optional(item.email, 'pharmacy email')
      ? { email: item.email as string }
      : {}),

    ...(optional(item.phone, 'pharmacy phone')
      ? { phone: item.phone as string }
      : {}),

    ...(optional(item.imageUrl, 'pharmacy imageUrl')
      ? { imageUrl: item.imageUrl as string }
      : {}),

    ...(pharmacyLocation ? { location: pharmacyLocation } : {}),
  };
}

//===================================================================

export function parseAdminPharmacyOption(value: unknown): AdminPharmacyOption {
  return base(value);
}

//===================================================================

export function parseAdminPharmacyOptionsResponse(
  value: unknown
): AdminPharmacyOptionsResponse {
  const response = record(value, 'admin pharmacy options response');

  if (!Array.isArray(response.items))
    throw new TypeError('Invalid pharmacy options.');

  return { items: response.items.map(parseAdminPharmacyOption) };
}

//===================================================================

export function parseAdminPharmacyRegistryOwnerOptionsResponse(
  value: unknown
): AdminPharmacyRegistryOwnerOptionsResponse {
  const response = record(value, 'pharmacy registry owner options response');

  if (!Array.isArray(response.items))
    throw new TypeError('Invalid pharmacy registry owner options.');

  return {
    items: response.items.map((value: unknown) => {
      const owner = record(value, 'pharmacy registry owner');

      const pictureUrl =
        owner.pictureUrl === null
          ? undefined
          : optional(owner.pictureUrl, 'owner picture');

      return {
        id: id(owner.id, 'owner ID'),
        name: str(owner.name, 'owner name'),
        ...(pictureUrl ? { pictureUrl } : {}),
      };
    }),
  };
}

//===================================================================

export function parseAdminPharmacyListItem(
  value: unknown
): AdminPharmacyListItem {
  const item = record(value, 'admin pharmacy list item');

  const owner =
    item.owner === null ? null : record(item.owner, 'pharmacy owner link');

  const rating = amount(item.rating, 'pharmacy rating');
  if (rating > 5) throw new TypeError('Invalid pharmacy rating.');

  return {
    ...base(item),
    status: status(item.status),
    createdAt: dateTime(item.createdAt),

    owner: owner
      ? {
          id: id(owner.id, 'pharmacy owner id'),
          name: str(owner.name, 'pharmacy owner name'),
          ...(optional(owner.pictureUrl, 'pharmacy owner pictureUrl')
            ? { pictureUrl: owner.pictureUrl as string }
            : {}),
        }
      : null,

    activeClientsCount: count(item.activeClientsCount, 'active clients'),

    successfulOrdersCount: count(
      item.successfulOrdersCount,
      'successful orders'
    ),

    successfulRevenue: amount(item.successfulRevenue, 'successful revenue'),
    rating,
    reviewsCount: count(item.reviewsCount, 'reviews count'),
  };
}

//===================================================================

export function parseAdminPharmacyListResponse(
  value: unknown
): AdminPharmacyListResponse {
  const response = record(value, 'admin pharmacy list response');

  if (!Array.isArray(response.items))
    throw new TypeError('Invalid pharmacy items.');

  const page = count(response.page, 'page');
  const perPage = count(response.perPage, 'perPage');
  const total = count(response.total, 'total');
  const totalPages = count(response.totalPages, 'totalPages');

  if (
    page < 1 ||
    ![20, 50, 100].includes(perPage) ||
    totalPages !== Math.ceil(total / perPage) ||
    page > Math.max(1, totalPages)
  ) {
    throw new TypeError('Invalid admin pharmacy pagination.');
  }

  const earliest = response.earliestCreatedAt;

  if (
    earliest !== null &&
    (typeof earliest !== 'string' || !validCalendarDate(earliest))
  ) {
    throw new TypeError('Invalid earliest pharmacy creation date.');
  }

  return {
    items: response.items.map(parseAdminPharmacyListItem),
    page,
    perPage,
    total,
    totalPages,
    earliestCreatedAt: earliest as string | null,
  };
}

//===================================================================

export function parseAdminPharmacyStatistics(
  value: unknown
): AdminPharmacyStatistics {
  const response = record(value, 'admin pharmacy statistics');

  const result = {
    all: count(response.all, 'all pharmacies'),
    new: count(response.new, 'new pharmacies'),

    onVerification: count(
      response.onVerification,
      'on verification pharmacies'
    ),

    active: count(response.active, 'active pharmacies'),
    onModeration: count(response.onModeration, 'on moderation pharmacies'),
    blocked: count(response.blocked, 'blocked pharmacies'),
  };

  if (
    result.all !==
    result.new +
      result.onVerification +
      result.active +
      result.onModeration +
      result.blocked
  ) {
    throw new TypeError('Invalid pharmacy status counts.');
  }
  return result;
}
