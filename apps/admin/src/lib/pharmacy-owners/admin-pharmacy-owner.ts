import type {
  AdminPharmacyOwnerComment,
  AdminPharmacyOwnerCommentResponse,
  AdminPharmacyOwnerCommentsResponse,
  AdminPharmacyOwnerDetail,
  AdminPharmacyOwnerListItem,
  AdminPharmacyOwnerListResponse,
  AdminPharmacyOwnerOption,
  AdminPharmacyOwnerOptionsResponse,
  AdminPharmacyOwnerPharmaciesResponse,
  AdminPharmacyOwnerPharmacySummary,
  AdminPharmacyOwnerStatistics,
  AdminPharmacyOwnerStatusMutationResponse,
} from '@e-pharmacy/types/admin';

import { PHARMACY_OWNER_ACCOUNT_STATUSES } from '@e-pharmacy/config/users';

import type { PharmacyOwnerAccountStatus } from '@e-pharmacy/types/auth';
import type { PharmacyLocationDraft } from '@e-pharmacy/types/pharmacies';
import type { ISODateTimeString } from '@e-pharmacy/types/primitives';
import { isISODateTimeString } from '@e-pharmacy/validation/dates';
import { isValidObjectId } from '@e-pharmacy/validation/url';

//===================================================================

export const ADMIN_PHARMACY_OWNER_STATUSES = PHARMACY_OWNER_ACCOUNT_STATUSES;

//===================================================================

export const ADMIN_OWNER_PHARMACY_STATUSES = [
  'new',
  'on_verification',
  'on_moderation',
  'active',
  'blocked',
] as const;

export const ADMIN_OWNER_RATING_FILTERS = [
  '0-0.9',
  '1-1.9',
  '2-2.9',
  '3-3.9',
  '4-5',
] as const;

//===================================================================

export type AdminPharmacyOwnerStatus = PharmacyOwnerAccountStatus;

export type AdminOwnerPharmacyStatus =
  (typeof ADMIN_OWNER_PHARMACY_STATUSES)[number];

export type AdminOwnerRatingFilter =
  (typeof ADMIN_OWNER_RATING_FILTERS)[number];

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

//===================================================================

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new TypeError(`Invalid ${label}.`);
  return value;
}

//===================================================================

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value;
}

//===================================================================

function optionalNonEmptyString(
  value: unknown,
  label: string
): string | undefined {
  if (value === undefined) return undefined;
  return requireNonEmptyString(value, label);
}

//===================================================================

function requireObjectId(value: unknown, label: string): string {
  const id = requireNonEmptyString(value, label);
  if (!isValidObjectId(id)) throw new TypeError(`Invalid ${label}.`);
  return id;
}

//===================================================================

function requireIsoDateTime(value: unknown, label: string): ISODateTimeString {
  if (!isISODateTimeString(value)) throw new TypeError(`Invalid ${label}.`);
  return value;
}

//===================================================================

function requireNonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value as number;
}

//===================================================================

function requirePositiveInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value as number;
}

//===================================================================

function requireNonNegativeNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value;
}

//===================================================================

function isOwnerStatus(value: unknown): value is AdminPharmacyOwnerStatus {
  return (
    typeof value === 'string' &&
    (ADMIN_PHARMACY_OWNER_STATUSES as readonly string[]).includes(value)
  );
}

//===================================================================

function isPharmacyStatus(value: unknown): value is AdminOwnerPharmacyStatus {
  return (
    typeof value === 'string' &&
    (ADMIN_OWNER_PHARMACY_STATUSES as readonly string[]).includes(value)
  );
}

//===================================================================

function parsePagination(record: Record<string, unknown>) {
  const page = requirePositiveInteger(record.page, 'page');
  const perPage = requirePositiveInteger(record.perPage, 'perPage');
  const total = requireNonNegativeInteger(record.total, 'total');
  const totalPages = requireNonNegativeInteger(record.totalPages, 'totalPages');

  if (![20, 50, 100].includes(perPage)) {
    throw new TypeError('Invalid perPage.');
  }

  const expectedTotalPages = total === 0 ? 0 : Math.ceil(total / perPage);

  if (totalPages !== expectedTotalPages) {
    throw new TypeError('Invalid pagination totals.');
  }

  return { page, perPage, total, totalPages } as const;
}

//===================================================================

export function assertAdminPharmacyOwnerEntityId(
  value: string,
  label = 'entity id'
): string {
  if (!isValidObjectId(value)) throw new TypeError(`Invalid ${label}.`);
  return value;
}

//===================================================================

function parseOwnerListItem(value: unknown): AdminPharmacyOwnerListItem {
  const record = requireRecord(value, 'pharmacy owner list item');

  if (!isOwnerStatus(record.status)) {
    throw new TypeError('Invalid pharmacy owner status.');
  }

  return {
    id: requireObjectId(record.id, 'pharmacy owner id'),
    name: requireNonEmptyString(record.name, 'pharmacy owner name'),
    email: requireNonEmptyString(record.email, 'pharmacy owner email'),
    phone: requireNonEmptyString(record.phone, 'pharmacy owner phone'),
    ...(optionalNonEmptyString(record.pictureUrl, 'pharmacy owner pictureUrl')
      ? { pictureUrl: record.pictureUrl as string }
      : {}),
    status: record.status,

    registeredAt: requireIsoDateTime(
      record.registeredAt,
      'pharmacy owner registeredAt'
    ),

    operatingPharmaciesCount: requireNonNegativeInteger(
      record.operatingPharmaciesCount,
      'operatingPharmaciesCount'
    ),

    nonWorkingPharmaciesCount: requireNonNegativeInteger(
      record.nonWorkingPharmaciesCount,
      'nonWorkingPharmaciesCount'
    ),
  };
}

//===================================================================

export function parseAdminPharmacyOwnerListResponse(
  value: unknown
): AdminPharmacyOwnerListResponse {
  const record = requireRecord(value, 'pharmacy owner list response');

  if (!Array.isArray(record.items)) {
    throw new TypeError('Invalid pharmacy owner list items.');
  }

  return {
    items: record.items.map(parseOwnerListItem),
    ...parsePagination(record),
    earliestCreatedAt:
      typeof record.earliestCreatedAt === 'string'
        ? record.earliestCreatedAt
        : null,
  };
}

//===================================================================

export function parseAdminPharmacyOwnerStatistics(
  value: unknown
): AdminPharmacyOwnerStatistics {
  const record = requireRecord(value, 'pharmacy owner statistics');

  const result = {
    all: requireNonNegativeInteger(record.all, 'all owners count'),
    new: requireNonNegativeInteger(record.new, 'new owners count'),
    active: requireNonNegativeInteger(record.active, 'active owners count'),
    blocked: requireNonNegativeInteger(record.blocked, 'blocked owners count'),
  };

  if (result.all !== result.new + result.active + result.blocked) {
    throw new TypeError('Invalid pharmacy owner statistics total.');
  }

  return result;
}

//===================================================================

function parseOwnerOption(value: unknown): AdminPharmacyOwnerOption {
  const record = requireRecord(value, 'pharmacy owner option');

  const pictureUrl = optionalNonEmptyString(
    record.pictureUrl,
    'pharmacy owner option pictureUrl'
  );

  return {
    id: requireObjectId(record.id, 'pharmacy owner option id'),
    name: requireNonEmptyString(record.name, 'pharmacy owner option name'),
    email: requireNonEmptyString(record.email, 'pharmacy owner option email'),
    phone: requireNonEmptyString(record.phone, 'pharmacy owner option phone'),
    ...(pictureUrl ? { pictureUrl } : {}),
  };
}

//===================================================================

export function parseAdminPharmacyOwnerOptionsResponse(
  value: unknown
): AdminPharmacyOwnerOptionsResponse {
  const record = requireRecord(value, 'pharmacy owner options response');
  if (!Array.isArray(record.items)) {
    throw new TypeError('Invalid pharmacy owner options items.');
  }

  return { items: record.items.map(parseOwnerOption) };
}

//===================================================================

function parsePharmacyStatistics(value: unknown) {
  const record = requireRecord(value, 'pharmacy owner pharmacy statistics');
  const result = {
    all: requireNonNegativeInteger(record.all, 'all pharmacies count'),
    new: requireNonNegativeInteger(record.new, 'new pharmacies count'),

    onVerification: requireNonNegativeInteger(
      record.onVerification,
      'onVerification pharmacies count'
    ),

    onModeration: requireNonNegativeInteger(
      record.onModeration,
      'onModeration pharmacies count'
    ),

    active: requireNonNegativeInteger(record.active, 'active pharmacies count'),
    blocked: requireNonNegativeInteger(
      record.blocked,
      'blocked pharmacies count'
    ),
  };

  if (
    result.all !==
    result.new +
      result.onVerification +
      result.onModeration +
      result.active +
      result.blocked
  ) {
    throw new TypeError('Invalid pharmacy statistics total.');
  }

  return result;
}

//===================================================================

function parseTabCounts(value: unknown) {
  const record = requireRecord(value, 'pharmacy owner tab counts');

  return {
    pharmacies: requireNonNegativeInteger(
      record.pharmacies,
      'pharmacies tab count'
    ),

    documents: requireNonNegativeInteger(
      record.documents,
      'documents tab count'
    ),

    comments: requireNonNegativeInteger(record.comments, 'comments tab count'),
  };
}

//===================================================================

export function parseAdminPharmacyOwnerDetail(
  value: unknown
): AdminPharmacyOwnerDetail {
  const record = requireRecord(value, 'pharmacy owner detail');
  if (!isOwnerStatus(record.status)) {
    throw new TypeError('Invalid pharmacy owner status.');
  }

  const address = optionalNonEmptyString(
    record.address,
    'pharmacy owner address'
  );

  const pictureUrl = optionalNonEmptyString(
    record.pictureUrl,
    'pharmacy owner pictureUrl'
  );

  const statusReason = optionalNonEmptyString(
    record.statusReason,
    'pharmacy owner statusReason'
  );

  const pharmacyStatistics = parsePharmacyStatistics(record.pharmacyStatistics);
  const tabCounts = parseTabCounts(record.tabCounts);

  if (tabCounts.pharmacies !== pharmacyStatistics.all) {
    throw new TypeError('Invalid pharmacy owner pharmacies tab count.');
  }

  return {
    id: requireObjectId(record.id, 'pharmacy owner id'),
    name: requireNonEmptyString(record.name, 'pharmacy owner name'),
    email: requireNonEmptyString(record.email, 'pharmacy owner email'),
    phone: requireNonEmptyString(record.phone, 'pharmacy owner phone'),
    ...(address ? { address } : {}),
    ...(pictureUrl ? { pictureUrl } : {}),
    status: record.status,
    ...(statusReason ? { statusReason } : {}),

    registeredAt: requireIsoDateTime(
      record.registeredAt,
      'pharmacy owner registeredAt'
    ),

    lastPersonalDataUpdateAt: requireIsoDateTime(
      record.lastPersonalDataUpdateAt,
      'pharmacy owner lastPersonalDataUpdateAt'
    ),

    pharmacyStatistics,
    tabCounts,
  };
}

//===================================================================

function parseGeoPoint(value: unknown): PharmacyLocationDraft['geo'] {
  const record = requireRecord(value, 'pharmacy geo point');

  if (record.type !== 'Point' || !Array.isArray(record.coordinates)) {
    throw new TypeError('Invalid pharmacy geo point.');
  }

  const [longitude, latitude, ...rest] = record.coordinates;
  if (
    rest.length > 0 ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new TypeError('Invalid pharmacy geo coordinates.');
  }

  return { type: 'Point', coordinates: [longitude, latitude] };
}

//===================================================================

function parseLocation(value: unknown): PharmacyLocationDraft {
  const record = requireRecord(value, 'pharmacy location');

  const result: {
    address?: string;
    settlement?: string;
    region?: string;
    countryCode?: string;
    geo?: PharmacyLocationDraft['geo'];
  } = {};

  for (const key of [
    'address',
    'settlement',
    'region',
    'countryCode',
  ] as const) {
    if (record[key] !== undefined) {
      result[key] = requireNonEmptyString(
        record[key],
        `pharmacy location ${key}`
      );
    }
  }

  if (record.geo !== undefined) result.geo = parseGeoPoint(record.geo);
  return result;
}

//===================================================================

function parseOwnerPharmacy(value: unknown): AdminPharmacyOwnerPharmacySummary {
  const record = requireRecord(value, 'owner pharmacy');

  if (!isPharmacyStatus(record.status)) {
    throw new TypeError('Invalid owner pharmacy status.');
  }

  const email = optionalNonEmptyString(record.email, 'owner pharmacy email');
  const phone = optionalNonEmptyString(record.phone, 'owner pharmacy phone');

  const imageUrl = optionalNonEmptyString(
    record.imageUrl,
    'owner pharmacy imageUrl'
  );

  const location =
    record.location === undefined ? undefined : parseLocation(record.location);

  const rating = requireNonNegativeNumber(
    record.rating,
    'owner pharmacy rating'
  );

  if (rating > 5) throw new TypeError('Invalid owner pharmacy rating.');

  return {
    id: requireObjectId(record.id, 'owner pharmacy id'),
    name: requireNonEmptyString(record.name, 'owner pharmacy name'),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(location ? { location } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    createdAt: requireIsoDateTime(record.createdAt, 'owner pharmacy createdAt'),
    status: record.status,

    activeClientsCount: requireNonNegativeInteger(
      record.activeClientsCount,
      'activeClientsCount'
    ),

    successfulOrdersCount: requireNonNegativeInteger(
      record.successfulOrdersCount,
      'successfulOrdersCount'
    ),

    successfulRevenue: requireNonNegativeNumber(
      record.successfulRevenue,
      'successfulRevenue'
    ),

    rating,

    reviewsCount: requireNonNegativeInteger(
      record.reviewsCount,
      'reviewsCount'
    ),
  };
}

//===================================================================

export function parseAdminPharmacyOwnerPharmaciesResponse(
  value: unknown
): AdminPharmacyOwnerPharmaciesResponse {
  const record = requireRecord(value, 'owner pharmacies response');

  if (!Array.isArray(record.items)) {
    throw new TypeError('Invalid owner pharmacies items.');
  }

  return {
    items: record.items.map(parseOwnerPharmacy),
    ...parsePagination(record),
  };
}

//===================================================================

function parseOwnerComment(value: unknown): AdminPharmacyOwnerComment {
  const record = requireRecord(value, 'owner comment');
  const author = requireRecord(record.author, 'owner comment author');

  return {
    id: requireObjectId(record.id, 'owner comment id'),
    ownerUserId: requireObjectId(record.ownerUserId, 'owner comment owner id'),
    text: requireNonEmptyString(record.text, 'owner comment text'),
    createdAt: requireIsoDateTime(record.createdAt, 'owner comment createdAt'),

    author: {
      userId: requireObjectId(author.userId, 'owner comment author id'),
      displayName: requireNonEmptyString(
        author.displayName,
        'owner comment author displayName'
      ),
      ...(typeof author.pictureUrl === 'string' && author.pictureUrl.trim()
        ? { pictureUrl: author.pictureUrl.trim() }
        : {}),
    },
  };
}

//===================================================================

export function parseAdminPharmacyOwnerCommentsResponse(
  value: unknown
): AdminPharmacyOwnerCommentsResponse {
  const record = requireRecord(value, 'owner comments response');

  if (!Array.isArray(record.comments)) {
    throw new TypeError('Invalid owner comments list.');
  }

  return { comments: record.comments.map(parseOwnerComment) };
}

//===================================================================

export function parseAdminPharmacyOwnerCommentResponse(
  value: unknown
): AdminPharmacyOwnerCommentResponse {
  const record = requireRecord(value, 'owner comment response');
  return { comment: parseOwnerComment(record.comment) };
}

//===================================================================

export function parseAdminPharmacyOwnerStatusMutationResponse(
  value: unknown
): AdminPharmacyOwnerStatusMutationResponse {
  const record = requireRecord(value, 'owner status mutation response');
  const owner = requireRecord(record.owner, 'owner status mutation');

  if (owner.status !== 'active' && owner.status !== 'blocked') {
    throw new TypeError('Invalid owner status mutation status.');
  }

  return {
    owner: {
      ownerId: requireObjectId(owner.ownerId, 'owner status mutation ownerId'),
      status: owner.status,
      blockedPharmacies: requireNonNegativeInteger(
        owner.blockedPharmacies,
        'blockedPharmacies'
      ),
    },
  };
}
