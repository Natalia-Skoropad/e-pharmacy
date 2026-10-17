import { Types, type PipelineStage } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
} from '../constants/admin-audit';

import {
  PHARMACY_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from '../constants/auth';

import { HTTP_STATUS } from '../constants/httpStatus';
import { AdminAuditLog } from '../models/adminAuditLog.model';
import { Order } from '../models/order.model';
import { Pharmacy } from '../models/pharmacy.model';
import { ProductOffer } from '../models/productOffer.model';
import { PharmacyOwnerAdminComment } from '../models/pharmacyOwnerAdminComment.model';
import { PharmacyOwnerDocument } from '../models/pharmacyOwnerDocument.model';
import { User } from '../models/user.model';
import { Session } from '../models/session.model';

import type {
  AdminPharmacyOwnerActivityQuery,
  AdminPharmacyOwnerListQuery,
  AdminPharmacyOwnerOptionsQuery,
  AdminPharmacyOwnerPharmaciesQuery,
} from '../schemas/admin-pharmacy-owner.schema';

import type { PharmacyLocationDraft } from '../types/pharmacy';

import { getEndOfDay, getStartOfDay } from '../utils/date-range';
import { httpError } from '../utils/httpError';
import { createSafeRegExp } from '../utils/regexp';

import { listAdminAuditLogsService } from './admin-audit.service';
import { getOrderSalesStatisticsForPharmaciesService } from './order.service';
import type { OrderSalesStatisticsQuery } from '../schemas/order.schema';

//===============================================================

const OPERATING_PHARMACY_STATUSES = [
  PHARMACY_STATUSES.ACTIVE,
  PHARMACY_STATUSES.ON_MODERATION,
] as const;

const NON_WORKING_PHARMACY_STATUSES = [
  PHARMACY_STATUSES.NEW,
  PHARMACY_STATUSES.ON_VERIFICATION,
  PHARMACY_STATUSES.BLOCKED,
] as const;

//===============================================================

const RATING_BOUNDS = {
  '0-0.9': { min: 0, max: 1 },
  '1-1.9': { min: 1, max: 2 },
  '2-2.9': { min: 2, max: 3 },
  '3-3.9': { min: 3, max: 4 },
  '4-5': { min: 4, max: 5 },
} as const;

//===============================================================

type OwnerListAggregateRow = Readonly<{
  id: string;
  name: string;
  email: string;
  phone: string;
  pictureUrl: string | null;
  status: 'new' | 'active' | 'blocked';
  registeredAt: Date;
  operatingPharmaciesCount: number;
  nonWorkingPharmaciesCount: number;
}>;

type OwnerListAggregateResult = Readonly<{
  items: OwnerListAggregateRow[];
  total: Array<{ count: number }>;
}>;

type OwnerStatisticsAggregateRow = Readonly<{
  all: number;
  new: number;
  active: number;
  blocked: number;
}>;

type OwnerOptionAggregateRow = Readonly<{
  id: string;
  name: string;
  email: string;
  phone: string;
  pictureUrl: string | null;
}>;

type OwnerDetailAggregateRow = Readonly<{
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  pictureUrl: string | null;
  status: 'new' | 'active' | 'blocked';
  statusReason: string | null;
  registeredAt: Date;
  lastPersonalDataUpdateAt: Date;

  pharmacyStatistics: Readonly<{
    all: number;
    new: number;
    onVerification: number;
    onModeration: number;
    active: number;
    blocked: number;
  }>;

  tabCounts: Readonly<{
    pharmacies: number;
    documents: number;
    comments: number;
  }>;
}>;

type OwnerPharmacyAggregateRow = Readonly<{
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: PharmacyLocationDraft | null;
  imageUrl: string | null;
  createdAt: Date;
  status: 'new' | 'on_verification' | 'on_moderation' | 'active' | 'blocked';
  activeClientsCount: number;
  addedProductsCount: number;
  successfulOrdersCount: number;
  successfulRevenue: number;
  rating: number;
  reviewsCount: number;
}>;

type OwnerPharmaciesAggregateResult = Readonly<{
  items: OwnerPharmacyAggregateRow[];
  total: Array<{ count: number }>;
}>;

//===============================================================

function buildIdAwareSearchConditions(
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

function buildOwnerMatch(query: AdminPharmacyOwnerListQuery) {
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

function buildPharmacyMatch(
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
        bounds.max === 5
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

export async function listAdminPharmacyOwnersService(
  query: AdminPharmacyOwnerListQuery
) {
  const skip = (query.page - 1) * query.perPage;

  const itemPipeline: PipelineStage.FacetPipelineStage[] = [
    { $sort: { createdAt: -1, _id: -1 } },
    { $skip: skip },
    { $limit: query.perPage },
    {
      $lookup: {
        from: Pharmacy.collection.name,
        let: { ownerId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$ownerId', '$$ownerId'] },
            },
          },
          {
            $group: {
              _id: null,
              operatingPharmaciesCount: {
                $sum: {
                  $cond: [
                    { $in: ['$status', [...OPERATING_PHARMACY_STATUSES]] },
                    1,
                    0,
                  ],
                },
              },
              nonWorkingPharmaciesCount: {
                $sum: {
                  $cond: [
                    { $in: ['$status', [...NON_WORKING_PHARMACY_STATUSES]] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],
        as: 'pharmacyCounts',
      },
    },
    {
      $set: {
        pharmacyCounts: { $arrayElemAt: ['$pharmacyCounts', 0] },
      },
    },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: 1,
        email: 1,
        phone: 1,
        pictureUrl: { $ifNull: ['$pictureUrl', null] },
        status: 1,
        registeredAt: '$createdAt',

        operatingPharmaciesCount: {
          $ifNull: ['$pharmacyCounts.operatingPharmaciesCount', 0],
        },

        nonWorkingPharmaciesCount: {
          $ifNull: ['$pharmacyCounts.nonWorkingPharmaciesCount', 0],
        },
      },
    },
  ];

  const [result] = await User.aggregate<OwnerListAggregateResult>([
    { $match: buildOwnerMatch(query) },
    {
      $facet: {
        items: itemPipeline,
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const total = result?.total[0]?.count ?? 0;

  const earliestOwner = await User.findOne({ role: USER_ROLES.PHARMACY })
    .sort({ createdAt: 1, _id: 1 })
    .select('createdAt')
    .lean<{ createdAt: Date } | null>();

  return {
    items: (result?.items ?? []).map((owner) => ({
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,

      ...(owner.pictureUrl ? { pictureUrl: owner.pictureUrl } : {}),

      status: owner.status,
      registeredAt: owner.registeredAt.toISOString(),
      operatingPharmaciesCount: owner.operatingPharmaciesCount,
      nonWorkingPharmaciesCount: owner.nonWorkingPharmaciesCount,
    })),

    page: query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),

    earliestCreatedAt:
      earliestOwner?.createdAt?.toISOString().slice(0, 10) ?? null,
  };
}

//===============================================================

export async function getAdminPharmacyOwnerStatisticsService() {
  const [statistics] = await User.aggregate<OwnerStatisticsAggregateRow>([
    { $match: { role: USER_ROLES.PHARMACY } },
    {
      $group: {
        _id: null,
        all: { $sum: 1 },

        new: {
          $sum: {
            $cond: [{ $eq: ['$status', USER_STATUSES.NEW] }, 1, 0],
          },
        },

        active: {
          $sum: {
            $cond: [{ $eq: ['$status', USER_STATUSES.ACTIVE] }, 1, 0],
          },
        },

        blocked: {
          $sum: {
            $cond: [{ $eq: ['$status', USER_STATUSES.BLOCKED] }, 1, 0],
          },
        },
      },
    },
    { $project: { _id: 0, all: 1, new: 1, active: 1, blocked: 1 } },
  ]);

  return (
    statistics ?? {
      all: 0,
      new: 0,
      active: 0,
      blocked: 0,
    }
  );
}

//===============================================================

export async function listAdminPharmacyOwnerOptionsService(
  query: AdminPharmacyOwnerOptionsQuery
) {
  const match: Record<string, unknown> = { role: USER_ROLES.PHARMACY };

  if (query.search) {
    match.$or = buildIdAwareSearchConditions(query.search, [
      'name',
      'email',
      'phone',
    ]);
  }

  const items = await User.aggregate<OwnerOptionAggregateRow>([
    { $match: match },
    { $sort: { name: 1, _id: 1 } },
    { $limit: query.limit },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: 1,
        email: 1,
        phone: 1,
        pictureUrl: { $ifNull: ['$pictureUrl', null] },
      },
    },
  ]);

  return {
    items: items.map((owner) => ({
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      ...(owner.pictureUrl ? { pictureUrl: owner.pictureUrl } : {}),
    })),
  };
}

//===============================================================

export async function getAdminPharmacyOwnerDetailService(ownerId: string) {
  const ownerObjectId = new Types.ObjectId(ownerId);

  const [owner] = await User.aggregate<OwnerDetailAggregateRow>([
    {
      $match: {
        _id: ownerObjectId,
        role: USER_ROLES.PHARMACY,
      },
    },
    {
      $lookup: {
        from: Pharmacy.collection.name,
        let: { ownerId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$ownerId', '$$ownerId'] },
            },
          },
          {
            $group: {
              _id: null,
              all: { $sum: 1 },

              new: {
                $sum: {
                  $cond: [{ $eq: ['$status', PHARMACY_STATUSES.NEW] }, 1, 0],
                },
              },

              onVerification: {
                $sum: {
                  $cond: [
                    { $eq: ['$status', PHARMACY_STATUSES.ON_VERIFICATION] },
                    1,
                    0,
                  ],
                },
              },

              onModeration: {
                $sum: {
                  $cond: [
                    { $eq: ['$status', PHARMACY_STATUSES.ON_MODERATION] },
                    1,
                    0,
                  ],
                },
              },

              active: {
                $sum: {
                  $cond: [{ $eq: ['$status', PHARMACY_STATUSES.ACTIVE] }, 1, 0],
                },
              },

              blocked: {
                $sum: {
                  $cond: [
                    { $eq: ['$status', PHARMACY_STATUSES.BLOCKED] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          { $project: { _id: 0 } },
        ],
        as: 'pharmacyStatistics',
      },
    },
    {
      $set: {
        pharmacyStatistics: {
          $ifNull: [
            { $arrayElemAt: ['$pharmacyStatistics', 0] },
            {
              all: 0,
              new: 0,
              onVerification: 0,
              onModeration: 0,
              active: 0,
              blocked: 0,
            },
          ],
        },
      },
    },
    {
      $lookup: {
        from: AdminAuditLog.collection.name,
        let: { ownerId: { $toString: '$_id' } },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: [
                      '$scopeEntityType',
                      ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
                    ],
                  },
                  { $eq: ['$scopeEntityId', '$$ownerId'] },
                  {
                    $in: [
                      '$action',
                      [
                        ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_ACCOUNT_CREATED,
                        ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_PROFILE_UPDATED,
                        ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_PHOTO_UPDATED,
                      ],
                    ],
                  },
                ],
              },
            },
          },
          { $sort: { createdAt: -1, _id: -1 } },
          { $limit: 1 },
          { $project: { _id: 0, createdAt: 1 } },
        ],
        as: 'lastPersonalDataUpdate',
      },
    },
    {
      $lookup: {
        from: PharmacyOwnerDocument.collection.name,
        let: { ownerId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$ownerUserId', '$$ownerId'] },
            },
          },
          { $count: 'count' },
        ],
        as: 'documentCount',
      },
    },
    {
      $lookup: {
        from: PharmacyOwnerAdminComment.collection.name,
        let: { ownerId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$ownerUserId', '$$ownerId'] },
            },
          },
          { $count: 'count' },
        ],
        as: 'commentCount',
      },
    },
    {
      $set: {
        tabCounts: {
          pharmacies: '$pharmacyStatistics.all',

          documents: {
            $ifNull: [{ $arrayElemAt: ['$documentCount.count', 0] }, 0],
          },

          comments: {
            $ifNull: [{ $arrayElemAt: ['$commentCount.count', 0] }, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: 1,
        email: 1,
        phone: 1,
        address: { $ifNull: ['$address', null] },
        pictureUrl: { $ifNull: ['$pictureUrl', null] },
        status: 1,
        statusReason: { $ifNull: ['$statusReason', null] },
        registeredAt: '$createdAt',

        lastPersonalDataUpdateAt: {
          $ifNull: [
            { $arrayElemAt: ['$lastPersonalDataUpdate.createdAt', 0] },
            '$createdAt',
          ],
        },

        pharmacyStatistics: 1,
        tabCounts: 1,
      },
    },
  ]);

  if (!owner) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy owner was not found.');
  }

  return {
    id: owner.id,
    name: owner.name,
    email: owner.email,
    phone: owner.phone,

    ...(owner.address ? { address: owner.address } : {}),
    ...(owner.pictureUrl ? { pictureUrl: owner.pictureUrl } : {}),

    status: owner.status,

    ...(owner.statusReason ? { statusReason: owner.statusReason } : {}),

    registeredAt: owner.registeredAt.toISOString(),
    lastPersonalDataUpdateAt: owner.lastPersonalDataUpdateAt.toISOString(),
    pharmacyStatistics: owner.pharmacyStatistics,
    tabCounts: owner.tabCounts,
  };
}

//===============================================================

export function buildPagedPharmacyItemsPipeline(
  skip: number,
  perPage: number,
  includeOwnerId = false
): PipelineStage.FacetPipelineStage[] {
  return [
    { $sort: { createdAt: -1, _id: -1 } },
    { $skip: skip },
    { $limit: perPage },
    {
      $lookup: {
        from: ProductOffer.collection.name,
        let: { pharmacyId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$pharmacyId', '$$pharmacyId'] } } },
          { $count: 'count' },
        ],
        as: '_productCount',
      },
    },
    {
      $lookup: {
        from: Order.collection.name,
        let: { pharmacyId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$pharmacyId', '$$pharmacyId'] },
            },
          },
          // The parent pharmacy list already uses $facet for items and total.
          // MongoDB forbids a second $facet nested through this $lookup, so
          // calculate order metrics and unique clients in one $group instead.
          {
            $group: {
              _id: null,
              successfulOrdersCount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'successful'] }, 1, 0],
                },
              },
              successfulRevenue: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'successful'] }, '$totalPrice', 0],
                },
              },
              orderClientIds: { $addToSet: '$userId' },
            },
          },
          {
            $lookup: {
              from: User.collection.name,
              localField: 'orderClientIds',
              foreignField: '_id',
              pipeline: [
                {
                  $match: {
                    $or: [
                      { isDefaultPharmacyClient: true },
                      { status: { $ne: USER_STATUSES.BLOCKED } },
                    ],
                  },
                },
                { $count: 'count' },
              ],
              as: 'activeOrderClients',
            },
          },
          {
            $project: {
              _id: 0,
              successfulOrdersCount: 1,
              successfulRevenue: 1,
              activeOrderClientsCount: {
                $ifNull: [
                  { $arrayElemAt: ['$activeOrderClients.count', 0] },
                  0,
                ],
              },
              orderClientIds: 1,
            },
          },
        ],
        as: 'orderStatistics',
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        let: { pharmacyId: '$_id' },

        pipeline: [
          {
            $match: {
              isDefaultPharmacyClient: true,
              $expr: {
                $eq: ['$defaultClientPharmacyId', '$$pharmacyId'],
              },
            },
          },
          { $project: { _id: 1 } },
          { $limit: 1 },
        ],
        as: 'defaultClients',
      },
    },
    {
      $set: {
        orderStatistics: { $arrayElemAt: ['$orderStatistics', 0] },
        defaultClient: { $arrayElemAt: ['$defaultClients', 0] },
      },
    },
    {
      $set: {
        activeClientsCount: {
          $add: [
            { $ifNull: ['$orderStatistics.activeOrderClientsCount', 0] },
            {
              $cond: [
                {
                  $and: [
                    {
                      $ne: [{ $ifNull: ['$defaultClient._id', null] }, null],
                    },
                    {
                      $not: [
                        {
                          $in: [
                            '$defaultClient._id',
                            {
                              $ifNull: ['$orderStatistics.orderClientIds', []],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: 1,
        email: { $ifNull: ['$email', null] },
        phone: { $ifNull: ['$phone', null] },
        location: { $ifNull: ['$location', null] },
        imageUrl: { $ifNull: ['$imageUrl', null] },
        createdAt: 1,
        status: 1,
        ...(includeOwnerId ? { ownerId: 1 } : {}),
        activeClientsCount: 1,

        addedProductsCount: {
          $ifNull: [{ $arrayElemAt: ['$_productCount.count', 0] }, 0],
        },

        successfulOrdersCount: {
          $ifNull: ['$orderStatistics.successfulOrdersCount', 0],
        },

        successfulRevenue: {
          $ifNull: ['$orderStatistics.successfulRevenue', 0],
        },

        rating: { $ifNull: ['$rating', 0] },
        reviewsCount: { $ifNull: ['$reviewsCount', 0] },
      },
    },
  ];
}

//===============================================================

export async function listAdminPharmacyOwnerPharmaciesService(
  ownerId: string,
  query: AdminPharmacyOwnerPharmaciesQuery
) {
  const ownerObjectId = new Types.ObjectId(ownerId);

  const ownerExists = await User.exists({
    _id: ownerObjectId,
    role: USER_ROLES.PHARMACY,
  });

  if (!ownerExists) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy owner was not found.');
  }

  const skip = (query.page - 1) * query.perPage;

  const [result] = await Pharmacy.aggregate<OwnerPharmaciesAggregateResult>([
    { $match: buildPharmacyMatch(ownerObjectId, query) },
    {
      $facet: {
        items: buildPagedPharmacyItemsPipeline(skip, query.perPage),
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const total = result?.total[0]?.count ?? 0;

  const earliestOwner = await User.findOne({ role: USER_ROLES.PHARMACY })
    .sort({ createdAt: 1, _id: 1 })
    .select('createdAt')
    .lean<{ createdAt: Date } | null>();

  return {
    items: (result?.items ?? []).map((pharmacy) => ({
      id: pharmacy.id,
      name: pharmacy.name,

      ...(pharmacy.email ? { email: pharmacy.email } : {}),
      ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),

      ...(pharmacy.location ? { location: pharmacy.location } : {}),
      ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),

      createdAt: pharmacy.createdAt.toISOString(),
      status: pharmacy.status,
      activeClientsCount: pharmacy.activeClientsCount,
      addedProductsCount: pharmacy.addedProductsCount,
      successfulOrdersCount: pharmacy.successfulOrdersCount,
      successfulRevenue: pharmacy.successfulRevenue,
      rating: pharmacy.rating,
      reviewsCount: pharmacy.reviewsCount,
    })),

    page: query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),

    earliestCreatedAt:
      earliestOwner?.createdAt?.toISOString().slice(0, 10) ?? null,
  };
}

//===============================================================

export const ADMIN_PHARMACY_OWNER_READ_DEFINITIONS = {
  operatingPharmacyStatuses: OPERATING_PHARMACY_STATUSES,
  nonWorkingPharmacyStatuses: NON_WORKING_PHARMACY_STATUSES,
  ratingBounds: RATING_BOUNDS,
} as const;

//===============================================================

export async function listAdminPharmacyOwnerActivityService(
  ownerId: string,
  query: AdminPharmacyOwnerActivityQuery
) {
  const ownerExists = await User.exists({
    _id: new Types.ObjectId(ownerId),
    role: USER_ROLES.PHARMACY,
  });

  if (!ownerExists) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy owner was not found.');
  }

  return listAdminAuditLogsService({
    ...query,
    scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
    scopeEntityId: ownerId,
  });
}

//===============================================================

/** One query covering ALL of the owner's pharmacies, not just the current list page. */
export async function getAdminPharmacyOwnerSalesStatisticsService(
  ownerId: string,
  query: OrderSalesStatisticsQuery
) {
  const ownerObjectId = new Types.ObjectId(ownerId);

  const exists = await User.exists({
    _id: ownerObjectId,
    role: USER_ROLES.PHARMACY,
  });

  if (!exists)
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy owner was not found.');

  const pharmacies = await Pharmacy.find({ ownerId: ownerObjectId })
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();

  return getOrderSalesStatisticsForPharmaciesService(
    pharmacies.map((item) => String(item._id)),
    query
  );
}

//===============================================================

/** Admin read-only session listing. Never include token hashes. */
export async function listAdminPharmacyOwnerSessionsService(ownerId: string) {
  const userId = new Types.ObjectId(ownerId);
  const exists = await User.exists({ _id: userId, role: USER_ROLES.PHARMACY });

  if (!exists)
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy owner was not found.');

  const now = new Date();

  const sessions = await Session.find({
    userId,
    roleAtLogin: USER_ROLES.PHARMACY,
    revokedAt: undefined,
    expiresAt: { $gt: now },

    $or: [
      { absoluteExpiresAt: { $gt: now } },
      { absoluteExpiresAt: { $exists: false } },
    ],
  })
    .sort({ lastUsedAt: -1 })
    .limit(100)
    .lean();

  return {
    sessions: sessions.map((session) => ({
      id: String(session._id),

      ...(session.deviceName ? { deviceName: session.deviceName } : {}),
      ...(session.userAgent ? { userAgent: session.userAgent } : {}),
      ...(session.ip ? { ip: session.ip } : {}),

      roleAtLogin: session.roleAtLogin,

      ...(session.createdAt
        ? { createdAt: session.createdAt.toISOString() }
        : {}),

      lastUsedAt: session.lastUsedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      isCurrent: false,
    })),
  };
}
