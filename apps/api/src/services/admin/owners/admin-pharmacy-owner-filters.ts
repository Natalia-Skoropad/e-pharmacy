import { Types } from 'mongoose';

import { PHARMACY_STATUSES, USER_ROLES } from '../../../constants/auth/auth';

import type {
  AdminPharmacyOwnerListQuery,
  AdminPharmacyOwnerPharmaciesQuery,
} from '../../../schemas/admin/owners/admin-pharmacy-owner.schema';

import { getStartOfDay, getEndOfDay } from '../../../utils/dates/date-range';
import { createSafeRegExp } from '../../../utils/validation/regexp';

import { RATING_BOUNDS } from '../../pharmacies/registry/pharmacy-registry.constants';

//===============================================================

export const OPERATING_PHARMACY_STATUSES = [
  PHARMACY_STATUSES.ACTIVE,
  PHARMACY_STATUSES.ON_MODERATION,
] as const;

//===============================================================

export const NON_WORKING_PHARMACY_STATUSES = [
  PHARMACY_STATUSES.NEW,
  PHARMACY_STATUSES.ON_VERIFICATION,
  PHARMACY_STATUSES.BLOCKED,
] as const;

//===============================================================

export function buildIdAwareSearchConditions(
  search: string,
  fields: readonly string[]
): Record<string, unknown>[] {
  const regex = createSafeRegExp(search);

  return [
    ...fields.map((field) => ({ [field]: regex })),

    {
      $expr: {
        $regexMatch: {
          input: { $toString: '$_id' },
          regex,
        },
      },
    },
  ];
}

//===============================================================

export function buildOwnerMatch(query: AdminPharmacyOwnerListQuery) {
  const match: Record<string, unknown> = { role: USER_ROLES.PHARMACY };

  if (query.status) match.status = query.status;

  if (query.registeredFrom || query.registeredTo) {
    match.createdAt = {
      ...(query.registeredFrom
        ? { $gte: getStartOfDay(query.registeredFrom) }
        : {}),

      ...(query.registeredTo ? { $lte: getEndOfDay(query.registeredTo) } : {}),
    };
  }

  if (query.search) {
    match.$or = buildIdAwareSearchConditions(query.search, [
      'name',
      'email',
      'phone',
    ]);
  }

  return match;
}

//===============================================================

export function buildPharmacyMatch(
  ownerId: Types.ObjectId,
  query: AdminPharmacyOwnerPharmaciesQuery
) {
  const match: Record<string, unknown> = { ownerId };

  if (query.status) match.status = query.status;

  if (query.settlement)
    match['location.settlement'] = new RegExp(
      `^${createSafeRegExp(query.settlement).source}$`,
      'i'
    );

  if (query.region)
    match['location.region'] = new RegExp(
      `^${createSafeRegExp(query.region).source}$`,
      'i'
    );

  if (query.createdFrom || query.createdTo) {
    match.createdAt = {
      ...(query.createdFrom ? { $gte: getStartOfDay(query.createdFrom) } : {}),
      ...(query.createdTo ? { $lte: getEndOfDay(query.createdTo) } : {}),
    };
  }

  if (query.rating) {
    const bounds = RATING_BOUNDS[query.rating];

    match.$expr = {
      $and: [
        { $gte: [{ $ifNull: ['$rating', 0] }, bounds.min] },
        bounds.inclusiveMax
          ? { $lte: [{ $ifNull: ['$rating', 0] }, bounds.max] }
          : { $lt: [{ $ifNull: ['$rating', 0] }, bounds.max] },
      ],
    };
  }

  if (query.search) {
    match.$or = buildIdAwareSearchConditions(query.search, [
      'name',
      'email',
      'phone',
      'location.address',
      'location.settlement',
    ]);
  }

  return match;
}

//===============================================================

export const ADMIN_PHARMACY_OWNER_READ_DEFINITIONS = {
  operatingPharmacyStatuses: OPERATING_PHARMACY_STATUSES,
  nonWorkingPharmacyStatuses: NON_WORKING_PHARMACY_STATUSES,
  ratingBounds: RATING_BOUNDS,
} as const;
