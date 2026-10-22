import { Types, type PipelineStage } from 'mongoose';

import {
  PHARMACY_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from '../../constants/auth';

import { HTTP_STATUS } from '../../constants/httpStatus';
import { Pharmacy } from '../../models/pharmacy.model';
import { AdminAuditLog } from '../../models/adminAuditLog.model';
import { ADMIN_AUDIT_ACTIONS } from '../../constants/admin-audit';
import { User } from '../../models/user.model';

import type {
  OwnedPharmacyRegistryListQuery,
  OwnedPharmacyRegistryOptionsQuery,
} from '../../schemas/owned-pharmacy-registry.schema';

import type { PharmacyMembershipRole } from '../../types/pharmacy';

import { getEndOfDay, getStartOfDay } from '../../utils/date-range';
import { httpError } from '../../utils/httpError';
import { createSafeRegExp } from '../../utils/regexp';
import { buildPagedPharmacyItemsPipeline } from '../admin-pharmacy-owner-read.service';

import {
  canPharmacyMembershipUseCapability,
  getPharmacyMembership,
} from './pharmacy-membership.service';

import { serializePharmacyProfile } from './pharmacy.service';

//===============================================================

// Identical to the admin registry's mathematically contiguous rating buckets.
const RATING_BOUNDS = {
  '0-0.9': { min: 0, max: 1, inclusiveMax: false },
  '1-1.9': { min: 1, max: 2, inclusiveMax: false },
  '2-2.9': { min: 2, max: 3, inclusiveMax: false },
  '3-3.9': { min: 3, max: 4, inclusiveMax: false },
  '4-5': { min: 4, max: 5, inclusiveMax: true },
} as const;

const STATUS_FIELDS = [
  ['new', PHARMACY_STATUSES.NEW],
  ['onVerification', PHARMACY_STATUSES.ON_VERIFICATION],
  ['active', PHARMACY_STATUSES.ACTIVE],
  ['onModeration', PHARMACY_STATUSES.ON_MODERATION],
  ['blocked', PHARMACY_STATUSES.BLOCKED],
] as const;

//===============================================================

type RegistryRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  imageUrl: string | null;
  location: Record<string, unknown> | null;
  status: string;
  createdAt: Date;
  membershipRole: PharmacyMembershipRole;
  activeClientsCount: number;
  addedProductsCount: number;
  successfulOrdersCount: number;
  successfulRevenue: number;
  rating: number;
  reviewsCount: number;
};

type RegistryFacet = { items: RegistryRow[]; total: Array<{ count: number }> };

type RegistryMetrics = Pick<
  RegistryRow,
  | 'activeClientsCount'
  | 'addedProductsCount'
  | 'successfulOrdersCount'
  | 'successfulRevenue'
  | 'rating'
  | 'reviewsCount'
>;

type RegistryOption = {
  id: string;
  name: string;
  imageUrl: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  membershipRole: PharmacyMembershipRole;
  location: Record<string, unknown> | null;
};

//===============================================================

async function assertRegistryUser(userId: string): Promise<Types.ObjectId> {
  if (!Types.ObjectId.isValid(userId)) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Pharmacy access is forbidden.');
  }

  const user = await User.exists({
    _id: userId,
    role: USER_ROLES.PHARMACY,
    status: { $in: [USER_STATUSES.NEW, USER_STATUSES.ACTIVE] },
  });

  if (!user) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Pharmacy access is forbidden.');
  }

  return new Types.ObjectId(userId);
}

//===============================================================

/**
 * The first $match is ALWAYS derived from the authenticated user, never URL
 * filters. Managers can list only their memberships whose owner is unblocked;
 * owners can still see their own blocked pharmacy to understand its status.
 * Scope is applied BEFORE every $facet, $count, filter or metric lookup.
 */
function membershipStages(userId: Types.ObjectId): PipelineStage[] {
  return [
    {
      $match: {
        $or: [{ ownerId: userId }, { managerUserIds: userId }],
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        let: { ownerId: '$ownerId' },

        pipeline: [
          {
            $match: {
              role: USER_ROLES.PHARMACY,
              status: { $ne: USER_STATUSES.BLOCKED },
            },
          },
          { $match: { $expr: { $eq: ['$_id', '$$ownerId'] } } },
          { $project: { _id: 1 } },
        ],

        as: '_eligibleOwner',
      },
    },
    {
      $match: {
        $or: [{ ownerId: userId }, { '_eligibleOwner.0': { $exists: true } }],
      },
    },
    { $unset: '_eligibleOwner' },
  ];
}

//===============================================================

function searchConditions(value: string) {
  const regex = createSafeRegExp(value);

  return [
    ...[
      'name',
      'email',
      'phone',
      'location.address',
      'location.settlement',
      'location.region',
    ].map((field) => ({ [field]: regex })),

    { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex } } },
  ];
}

//===============================================================

function registryFilters(query: OwnedPharmacyRegistryListQuery) {
  const match: Record<string, unknown> = {};

  if (query.pharmacyId) match._id = new Types.ObjectId(query.pharmacyId);
  if (query.status) match.status = query.status;

  if (query.settlement) {
    match['location.settlement'] = new RegExp(
      `^${createSafeRegExp(query.settlement).source}$`,
      'i'
    );
  }

  if (query.region) {
    match['location.region'] = new RegExp(
      `^${createSafeRegExp(query.region).source}$`,
      'i'
    );
  }

  if (query.pharmacySearch) match.$or = searchConditions(query.pharmacySearch);

  if (query.createdFrom || query.createdTo) {
    match.createdAt = {
      ...(query.createdFrom ? { $gte: getStartOfDay(query.createdFrom) } : {}),
      ...(query.createdTo ? { $lte: getEndOfDay(query.createdTo) } : {}),
    };
  }

  if (query.rating) {
    const { min, max, inclusiveMax } = RATING_BOUNDS[query.rating];
    const value = { $ifNull: ['$rating', 0] };

    match.$expr = {
      $and: [
        { $gte: [value, min] },
        inclusiveMax ? { $lte: [value, max] } : { $lt: [value, max] },
      ],
    };
  }

  return match;
}

//===============================================================

function pagedItems(
  userId: Types.ObjectId,
  query: OwnedPharmacyRegistryListQuery,
  page: number
): PipelineStage.FacetPipelineStage[] {
  // All per-pharmacy KPIs come from the same aggregation as Admin Registry.
  // OwnerId is internal only, to project membershipRole after pagination.
  const pipeline = buildPagedPharmacyItemsPipeline(
    (page - 1) * query.perPage,
    query.perPage,
    true
  );

  const direction = query.sort === 'created_asc' ? 1 : -1;

  pipeline[0] = { $sort: { createdAt: direction, _id: direction } };

  return [
    ...pipeline,

    {
      $set: {
        membershipRole: {
          $cond: [{ $eq: ['$ownerId', userId] }, 'owner', 'manager'],
        },
      },
    },
    { $unset: 'ownerId' },
  ];
}

//===============================================================

async function aggregatePage(
  userId: Types.ObjectId,
  query: OwnedPharmacyRegistryListQuery,
  page: number
) {
  const [result] = await Pharmacy.aggregate<RegistryFacet>([
    ...membershipStages(userId),

    { $match: registryFilters(query) },
    {
      $facet: {
        items: pagedItems(userId, query, page),
        total: [{ $count: 'count' }],
      },
    },
  ]);

  return { items: result?.items ?? [], total: result?.total[0]?.count ?? 0 };
}

//===============================================================

export async function listOwnedPharmaciesService(
  actorUserId: string,
  query: OwnedPharmacyRegistryListQuery
) {
  const userId = await assertRegistryUser(actorUserId);

  let page = query.page;
  let result = await aggregatePage(userId, query, page);

  const totalPages = Math.ceil(result.total / query.perPage);
  const safePage = Math.max(1, Math.min(page, Math.max(1, totalPages)));

  if (safePage !== page) {
    page = safePage;
    result = await aggregatePage(userId, query, page);
  }

  const [earliest] = await Pharmacy.aggregate<{ createdAt: Date }>([
    ...membershipStages(userId),

    { $sort: { createdAt: 1, _id: 1 } },
    { $limit: 1 },
    { $project: { _id: 0, createdAt: 1 } },
  ]);

  return {
    items: result.items.map((item) => ({
      id: item.id,
      name: item.name,

      ...(item.email ? { email: item.email } : {}),
      ...(item.phone ? { phone: item.phone } : {}),
      ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
      ...(item.location ? { location: item.location } : {}),

      status: item.status,
      membershipRole: item.membershipRole,
      createdAt: item.createdAt.toISOString(),

      // Legacy managers have read_profile, NOT read_orders/read_clients/
      // read_products. They must not gain private KPIs through a list route.
      ...(item.membershipRole === 'owner'
        ? {
            activeClientsCount: item.activeClientsCount,
            addedProductsCount: item.addedProductsCount,
            successfulOrdersCount: item.successfulOrdersCount,
            successfulRevenue: item.successfulRevenue,
          }
        : {}),

      rating: item.rating,
      reviewsCount: item.reviewsCount,
    })),

    page,
    perPage: query.perPage,
    total: result.total,
    totalPages,
    earliestCreatedAt: earliest?.createdAt?.toISOString().slice(0, 10) ?? null,
  };
}

//===============================================================

export async function getOwnedPharmacyStatisticsService(actorUserId: string) {
  const userId = await assertRegistryUser(actorUserId);

  const groups = Object.fromEntries(
    STATUS_FIELDS.map(([key, status]) => [
      key,
      { $sum: { $cond: [{ $eq: ['$status', status] }, 1, 0] } },
    ])
  );

  const [result] = await Pharmacy.aggregate<Record<string, number>>([
    ...membershipStages(userId),

    { $group: { _id: null, all: { $sum: 1 }, ...groups } },
    {
      $project: {
        _id: 0,
        all: 1,
        ...Object.fromEntries(STATUS_FIELDS.map(([key]) => [key, 1])),
      },
    },
  ]);

  return (
    result ?? {
      all: 0,
      new: 0,
      onVerification: 0,
      active: 0,
      onModeration: 0,
      blocked: 0,
    }
  );
}

//===============================================================

export async function listOwnedPharmacyOptionsService(
  actorUserId: string,
  query: OwnedPharmacyRegistryOptionsQuery
) {
  const userId = await assertRegistryUser(actorUserId);

  const options = await Pharmacy.aggregate<RegistryOption>([
    ...membershipStages(userId),

    ...(query.search
      ? [{ $match: { $or: searchConditions(query.search) } }]
      : []),

    { $sort: { name: 1, _id: 1 } },
    { $limit: query.limit },

    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: 1,
        imageUrl: { $ifNull: ['$imageUrl', null] },
        email: { $ifNull: ['$email', null] },
        phone: { $ifNull: ['$phone', null] },
        status: 1,
        location: { $ifNull: ['$location', null] },
        membershipRole: {
          $cond: [{ $eq: ['$ownerId', userId] }, 'owner', 'manager'],
        },
      },
    },
  ]);

  return {
    items: options.map((item) => ({
      id: item.id,
      name: item.name,
      status: item.status,
      membershipRole: item.membershipRole,

      ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
      ...(item.email ? { email: item.email } : {}),
      ...(item.phone ? { phone: item.phone } : {}),
      ...(item.location ? { location: item.location } : {}),
    })),
  };
}

//===============================================================

export async function getOwnedPharmacyDetailService(
  actorUserId: string,
  pharmacyId: string
) {
  // The canonical membership check distinguishes invalid, missing and foreign
  // pharmacy IDs and enforces the authenticated account's status.
  const { pharmacy, membershipRole } = await getPharmacyMembership(
    actorUserId,
    pharmacyId,
    { allowBlocked: true }
  );

  if (!canPharmacyMembershipUseCapability(membershipRole, 'read_profile')) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Pharmacy access is forbidden.');
  }

  // allowBlocked lets an owner inspect their BLOCKED pharmacy, but must not
  // let a manager bypass a BLOCKED / deleted owner's account.
  if (membershipRole === 'manager') {
    const owner = await User.exists({
      _id: pharmacy.ownerId,
      role: USER_ROLES.PHARMACY,
      status: { $ne: USER_STATUSES.BLOCKED },
    });

    if (!owner) {
      throw httpError(HTTP_STATUS.FORBIDDEN, 'Pharmacy access is forbidden.');
    }
  }

  const [metrics] = await Pharmacy.aggregate<RegistryMetrics>([
    { $match: { _id: pharmacy._id, ownerId: pharmacy.ownerId } },
    ...buildPagedPharmacyItemsPipeline(0, 1),
  ]);

  if (!metrics) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found.');
  }

  // The audit entry reflects the actual submission time. It must not be
  // inferred from updatedAt, which also changes on unrelated profile edits.
  const submission = await AdminAuditLog.findOne({
    pharmacyId: String(pharmacy._id),
    action: ADMIN_AUDIT_ACTIONS.PHARMACY_MODERATION_SUBMITTED,
  })
    .sort({ createdAt: -1 })
    .select('createdAt')
    .lean<{ createdAt: Date } | null>();

  return {
    pharmacy: serializePharmacyProfile(pharmacy, membershipRole),

    dates: {
      createdAt: pharmacy.createdAt.toISOString(),
      updatedAt: pharmacy.updatedAt.toISOString(),

      ...(submission?.createdAt
        ? { submittedAt: submission.createdAt.toISOString() }
        : {}),

      ...(pharmacy.approvedAt
        ? { approvedAt: pharmacy.approvedAt.toISOString() }
        : {}),

      ...(pharmacy.activatedAt
        ? { activatedAt: pharmacy.activatedAt.toISOString() }
        : {}),
    },
    // A read_profile-only manager may inspect pharmacy details, but cannot
    // learn order/client/product revenue metrics without future permissions.
    metrics:
      membershipRole === 'owner'
        ? {
            activeClientsCount: metrics.activeClientsCount,
            addedProductsCount: metrics.addedProductsCount,
            successfulOrdersCount: metrics.successfulOrdersCount,
            successfulRevenue: metrics.successfulRevenue,
            rating: metrics.rating,
            reviewsCount: metrics.reviewsCount,
          }
        : null,
  };
}
