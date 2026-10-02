import { Types, type PipelineStage } from 'mongoose';

import {
  PHARMACY_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from '../constants/auth';

import { HTTP_STATUS } from '../constants/httpStatus';
import { Order } from '../models/order.model';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';

import type {
  AdminPharmacyOwnerListQuery,
  AdminPharmacyOwnerOptionsQuery,
  AdminPharmacyOwnerPharmaciesQuery,
} from '../schemas/admin-pharmacy-owner.schema';

import { getEndOfDay, getStartOfDay } from '../utils/date-range';
import { httpError } from '../utils/httpError';
import { createSafeRegExp } from '../utils/regexp';

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
  '0-0.9': { min: 0, max: 0.9 },
  '1-1.9': { min: 1, max: 1.9 },
  '2-2.9': { min: 2, max: 2.9 },
  '3-3.9': { min: 3, max: 3.9 },
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
}>;

type OwnerPharmacyAggregateRow = Readonly<{
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  imageUrl: string | null;
  createdAt: Date;
  status: 'new' | 'on_verification' | 'on_moderation' | 'active' | 'blocked';
  activeClientsCount: number;
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

  if (query.createdFrom || query.createdTo) {
    match.createdAt = {
      ...(query.createdFrom ? { $gte: getStartOfDay(query.createdFrom) } : {}),
      ...(query.createdTo ? { $lte: getEndOfDay(query.createdTo) } : {}),
    };
  }

  if (query.rating) {
    const bounds = RATING_BOUNDS[query.rating];
    match.rating = { $gte: bounds.min, $lte: bounds.max };
  }

  if (query.search) {
    match.$or = buildIdAwareSearchConditions(query.search, [
      'name',
      'email',
      'phone',
      'address',
      'city',
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
        lastPersonalDataUpdateAt: '$updatedAt',
        pharmacyStatistics: 1,
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
  };
}

//===============================================================

function buildPagedPharmacyItemsPipeline(
  skip: number,
  perPage: number
): PipelineStage.FacetPipelineStage[] {
  return [
    { $sort: { createdAt: -1, _id: -1 } },
    { $skip: skip },
    { $limit: perPage },
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
          {
            $facet: {
              successful: [
                { $match: { status: 'successful' } },
                {
                  $group: {
                    _id: null,
                    count: { $sum: 1 },
                    revenue: { $sum: '$totalPrice' },
                  },
                },
              ],
              clients: [
                { $group: { _id: '$userId' } },
                {
                  $lookup: {
                    from: User.collection.name,
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [
                      {
                        $project: {
                          _id: 1,
                          status: 1,
                          isDefaultPharmacyClient: 1,
                        },
                      },
                    ],
                  },
                },
                { $unwind: '$user' },
                {
                  $group: {
                    _id: null,
                    activeCount: {
                      $sum: {
                        $cond: [
                          {
                            $or: [
                              {
                                $eq: ['$user.isDefaultPharmacyClient', true],
                              },
                              {
                                $ne: ['$user.status', USER_STATUSES.BLOCKED],
                              },
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                    },
                    ids: { $push: '$_id' },
                  },
                },
              ],
            },
          },
          {
            $project: {
              _id: 0,
              successfulOrdersCount: {
                $ifNull: [{ $arrayElemAt: ['$successful.count', 0] }, 0],
              },
              successfulRevenue: {
                $ifNull: [{ $arrayElemAt: ['$successful.revenue', 0] }, 0],
              },
              activeOrderClientsCount: {
                $ifNull: [{ $arrayElemAt: ['$clients.activeCount', 0] }, 0],
              },
              orderClientIds: {
                $ifNull: [{ $arrayElemAt: ['$clients.ids', 0] }, []],
              },
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
        address: { $ifNull: ['$address', null] },
        city: { $ifNull: ['$city', null] },
        imageUrl: { $ifNull: ['$imageUrl', null] },
        createdAt: 1,
        status: 1,
        activeClientsCount: 1,
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

  return {
    items: (result?.items ?? []).map((pharmacy) => ({
      id: pharmacy.id,
      name: pharmacy.name,
      ...(pharmacy.email ? { email: pharmacy.email } : {}),
      ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
      ...(pharmacy.address ? { address: pharmacy.address } : {}),
      ...(pharmacy.city ? { city: pharmacy.city } : {}),
      ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
      createdAt: pharmacy.createdAt.toISOString(),
      status: pharmacy.status,
      activeClientsCount: pharmacy.activeClientsCount,
      successfulOrdersCount: pharmacy.successfulOrdersCount,
      successfulRevenue: pharmacy.successfulRevenue,
      rating: pharmacy.rating,
      reviewsCount: pharmacy.reviewsCount,
    })),

    page: query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),
  };
}

//===============================================================

export const ADMIN_PHARMACY_OWNER_READ_DEFINITIONS = {
  operatingPharmacyStatuses: OPERATING_PHARMACY_STATUSES,
  nonWorkingPharmacyStatuses: NON_WORKING_PHARMACY_STATUSES,
  ratingBounds: RATING_BOUNDS,
} as const;
