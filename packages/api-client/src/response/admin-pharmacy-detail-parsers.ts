import type {
  AdminPharmacyCurrentData,
  AdminPharmacyDetail,
  AdminPharmacyPendingChanges,
} from '@e-pharmacy/types/admin';

import type {
  EditablePharmacyBankDetails,
  PharmacyStatus,
  PharmacyLocationDraft,
} from '@e-pharmacy/types/pharmacies';

import type { PharmacyOwnerAccountStatus } from '@e-pharmacy/types/auth';

import type { ISODateTimeString } from '@e-pharmacy/types/primitives';

//===================================================================

const OBJECT_ID = /^[0-9a-f]{24}$/i;

const PHARMACY_STATUSES = new Set([
  'new',
  'on_verification',
  'active',
  'on_moderation',
  'blocked',
]);

const OWNER_STATUSES = new Set(['new', 'active', 'blocked']);
const REVIEW_STATES = new Set(['pending', 'changes_requested']);

const BANK_KEYS = [
  'recipientName',
  'taxId',
  'iban',
  'bankName',
  'receiptEmail',
  'paymentPurpose',
] as const;

//===================================================================

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value as Record<string, unknown>;
}

//===================================================================

function text(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new TypeError(`Invalid ${label}.`);

  return value;
}

//===================================================================

function nonempty(value: unknown, label: string): string {
  const result = text(value, label);
  if (!result.trim()) throw new TypeError(`Invalid ${label}.`);

  return result;
}

//===================================================================

function id(value: unknown, label: string): string {
  if (typeof value !== 'string' || !OBJECT_ID.test(value)) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value;
}

//===================================================================

function timestamp(value: unknown, label: string): ISODateTimeString {
  const stringValue = text(value, label);
  const date = new Date(stringValue);

  if (!Number.isFinite(date.getTime()) || date.toISOString() !== stringValue) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return stringValue as ISODateTimeString;
}

//===================================================================

function count(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value;
}

//===================================================================

function number(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value;
}

//===================================================================

function choice<T extends string>(
  value: unknown,
  valid: ReadonlySet<string>,
  label: string
): T {
  if (typeof value !== 'string' || !valid.has(value)) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value as T;
}

//===================================================================

function optionalText(row: Record<string, unknown>, key: string) {
  return row[key] === undefined ? {} : { [key]: text(row[key], key) };
}

//===================================================================

function location(value: unknown): PharmacyLocationDraft {
  const row = record(value, 'pharmacy location');
  const result: Record<string, unknown> = {};

  for (const key of ['address', 'settlement', 'region', 'countryCode']) {
    Object.assign(result, optionalText(row, key));
  }

  if (row.geo !== undefined) {
    const geo = record(row.geo, 'pharmacy location geo');

    if (
      geo.type !== 'Point' ||
      !Array.isArray(geo.coordinates) ||
      geo.coordinates.length !== 2 ||
      !geo.coordinates.every(
        (n) => typeof n === 'number' && Number.isFinite(n)
      ) ||
      geo.coordinates[0] < -180 ||
      geo.coordinates[0] > 180 ||
      geo.coordinates[1] < -90 ||
      geo.coordinates[1] > 90
    ) {
      throw new TypeError('Invalid pharmacy location geo.');
    }

    result.geo = { type: 'Point', coordinates: [...geo.coordinates] };
  }

  return result;
}

//===================================================================

function bank(value: unknown, allowNull = false) {
  const row = record(value, 'bank details');
  const result: Record<string, unknown> = {};

  for (const key of BANK_KEYS) {
    if (row[key] === undefined) continue;
    if (allowNull && row[key] === null) result[key] = null;
    else result[key] = text(row[key], `bank details ${key}`);
  }

  return result;
}

//===================================================================

function currentData(value: unknown): AdminPharmacyCurrentData {
  const row = record(value, 'current pharmacy data');

  if (typeof row.bankTransferAvailable !== 'boolean') {
    throw new TypeError('Invalid bankTransferAvailable.');
  }

  return {
    // A newly registered pharmacy can have no name or contact details yet.
    name: text(row.name, 'pharmacy name'),
    ...(row.location === undefined ? {} : { location: location(row.location) }),

    ...Object.assign(
      {},
      ...[
        'email',
        'phone',
        'workingHours',
        'imageUrl',
        'description',
        'license',
      ].map((field) => optionalText(row, field))
    ),

    ...(row.bankDetails === undefined
      ? {}
      : { bankDetails: bank(row.bankDetails) as EditablePharmacyBankDetails }),

    bankTransferAvailable: row.bankTransferAvailable,
  };
}

//===================================================================

function pendingChanges(value: unknown): AdminPharmacyPendingChanges {
  const row = record(value, 'pending pharmacy changes');
  const result: Record<string, unknown> = {};

  if (row.name !== undefined) result.name = text(row.name, 'pending name');
  if (row.location !== undefined) result.location = location(row.location);

  for (const key of [
    'phone',
    'email',
    'workingHours',
    'imageUrl',
    'description',
  ]) {
    if (row[key] === undefined) continue;
    result[key] = row[key] === null ? null : text(row[key], `pending ${key}`);
  }

  if (row.bankDetails !== undefined) {
    result.bankDetails = bank(row.bankDetails, true);
  }

  if (row.documentsCount !== undefined) {
    result.documentsCount = count(row.documentsCount, 'pending document count');
  }

  return result;
}

//===================================================================

/** Reject invalid backend payloads before they reach Admin UI or caches. */
export function parseAdminPharmacyDetail(value: unknown): AdminPharmacyDetail {
  const row = record(value, 'admin pharmacy detail');
  const dates = record(row.dates, 'pharmacy dates');
  const metrics = record(row.metrics, 'pharmacy metrics');
  const owner = row.owner === null ? null : record(row.owner, 'pharmacy owner');

  const rating = number(metrics.rating, 'rating');
  if (rating > 5) throw new TypeError('Invalid rating.');

  return {
    id: id(row.id, 'pharmacy id'),

    status: choice<PharmacyStatus>(
      row.status,
      PHARMACY_STATUSES,
      'pharmacy status'
    ),

    owner: owner
      ? {
          id: id(owner.id, 'owner id'),
          name: nonempty(owner.name, 'owner name'),
          email: nonempty(owner.email, 'owner email'),
          phone: nonempty(owner.phone, 'owner phone'),

          status: choice<PharmacyOwnerAccountStatus>(
            owner.status,
            OWNER_STATUSES,
            'owner status'
          ),

          ...optionalText(owner, 'pictureUrl'),
        }
      : null,
    current: currentData(row.current),
    ...(row.pendingChanges === undefined
      ? {}
      : { pendingChanges: pendingChanges(row.pendingChanges) }),

    ...optionalText(row, 'statusReason'),
    ...(row.reviewState === undefined
      ? {}
      : {
          reviewState: choice<'pending' | 'changes_requested'>(
            row.reviewState,
            REVIEW_STATES,
            'review state'
          ),
        }),

    ...optionalText(row, 'reviewFeedback'),
    ...(row.reviewedAt === undefined
      ? {}
      : { reviewedAt: timestamp(row.reviewedAt, 'reviewedAt') }),

    ...(row.reviewedBy === undefined
      ? {}
      : { reviewedBy: id(row.reviewedBy, 'reviewedBy') }),

    dates: {
      createdAt: timestamp(dates.createdAt, 'createdAt'),
      updatedAt: timestamp(dates.updatedAt, 'updatedAt'),

      ...(dates.approvedAt === undefined
        ? {}
        : { approvedAt: timestamp(dates.approvedAt, 'approvedAt') }),

      ...(dates.activatedAt === undefined
        ? {}
        : { activatedAt: timestamp(dates.activatedAt, 'activatedAt') }),
    },

    documentCount: count(row.documentCount, 'document count'),

    metrics: {
      activeClientsCount: count(metrics.activeClientsCount, 'active clients'),
      successfulOrdersCount: count(metrics.successfulOrdersCount, 'orders'),
      successfulRevenue: number(metrics.successfulRevenue, 'revenue'),
      rating,
      reviewsCount: count(metrics.reviewsCount, 'reviews'),
    },
  };
}
