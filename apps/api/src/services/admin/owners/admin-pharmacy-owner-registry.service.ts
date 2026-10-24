import type { PipelineStage } from 'mongoose';

import { USER_ROLES, USER_STATUSES } from '../../../constants/auth/auth';

import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';
import { User } from '../../../models/accounts/user.model';

import type {
  AdminPharmacyOwnerListQuery,
  AdminPharmacyOwnerOptionsQuery,
} from '../../../schemas/admin-pharmacy-owner.schema';

import {
  OPERATING_PHARMACY_STATUSES,
  NON_WORKING_PHARMACY_STATUSES,
  buildOwnerMatch,
  buildIdAwareSearchConditions,
} from './admin-pharmacy-owner-filters';

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

//===============================================================

type OwnerListAggregateResult = Readonly<{
  items: OwnerListAggregateRow[];
  total: Array<{ count: number }>;
}>;

//===============================================================

type OwnerStatisticsAggregateRow = Readonly<{
  all: number;
  new: number;
  active: number;
  blocked: number;
}>;

//===============================================================

type OwnerOptionAggregateRow = Readonly<{
  id: string;
  name: string;
  email: string;
  phone: string;
  pictureUrl: string | null;
}>;

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
