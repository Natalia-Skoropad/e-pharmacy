import { Types, type PipelineStage } from 'mongoose';

import { USER_ROLES } from '../../../constants/auth/auth';

import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';
import { User } from '../../../models/accounts/user.model';

import type {
  AdminPharmacyRegistryListQuery,
  AdminPharmacyRegistryOptionsQuery,
} from '../../../schemas/admin-pharmacy-registry.schema';

import { getEndOfDay, getStartOfDay } from '../../../utils/date-range';
import { createSafeRegExp } from '../../../utils/regexp';
import { buildPagedPharmacyItemsPipeline } from '../../pharmacies/registry/pharmacy-registry-query';

import {
  RATING_BOUNDS,
  STATUS_FIELDS,
} from '../../pharmacies/registry/pharmacy-registry.constants';

//===============================================================

type RegistryAggregateRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  imageUrl: string | null;
  location: Record<string, unknown> | null;
  status: string;
  createdAt: Date;
  owner: Array<{ id: string; name: string; pictureUrl: string | null }>;
  activeClientsCount: number;
  addedProductsCount: number;
  successfulOrdersCount: number;
  successfulRevenue: number;
  rating: number;
  reviewsCount: number;
};

type RegistryAggregateResult = {
  items: RegistryAggregateRow[];
  total: Array<{ count: number }>;
};

type RegistryOwnerOption = {
  id: string;
  name: string;
  pictureUrl: string | null;
};

type RegistryOption = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  imageUrl: string | null;
  location: Record<string, unknown> | null;
};

//===============================================================

function identitySearch(search: string, fields: readonly string[]) {
  const regex = createSafeRegExp(search);

  return [
    ...fields.map((field) => ({ [field]: regex })),
    { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex } } },
  ];
}

//===============================================================

function pharmacyMatch(query: AdminPharmacyRegistryListQuery) {
  const match: Record<string, unknown> = {};

  if (query.pharmacyId) match._id = new Types.ObjectId(query.pharmacyId);
  if (query.ownerId) match.ownerId = new Types.ObjectId(query.ownerId);
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

  if (query.pharmacySearch)
    match.$or = identitySearch(query.pharmacySearch, [
      'name',
      'email',
      'phone',
      'location.address',
      'location.settlement',
      'location.region',
    ]);

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

// Owner identity search happens BEFORE pagination; the owner projection and
// expensive order/client aggregations happen AFTER it, for the selected page only.
function ownerSearchStages(search?: string): PipelineStage[] {
  if (!search) return [];

  return [
    {
      $lookup: {
        from: User.collection.name,
        let: { ownerId: '$ownerId' },

        pipeline: [
          { $match: { role: USER_ROLES.PHARMACY } },
          { $match: { $expr: { $eq: ['$_id', '$$ownerId'] } } },
          {
            $match: { $or: identitySearch(search, ['name', 'email', 'phone']) },
          },
          { $project: { _id: 1 } },
        ],

        as: '_matchingOwners',
      },
    },
    { $match: { '_matchingOwners.0': { $exists: true } } },
  ];
}

//===============================================================

function pagedItems(
  query: AdminPharmacyRegistryListQuery,
  page: number
): PipelineStage.FacetPipelineStage[] {
  // The ownerId is kept only inside the aggregation, never in its HTTP payload.
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
      $lookup: {
        from: User.collection.name,
        let: { ownerId: '$ownerId' },

        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$ownerId'] } } },
          { $match: { role: USER_ROLES.PHARMACY } },
          {
            $project: {
              _id: 0,
              id: { $toString: '$_id' },
              name: 1,
              pictureUrl: { $ifNull: ['$pictureUrl', null] },
            },
          },
        ],

        as: 'owner',
      },
    },
    { $unset: 'ownerId' },
  ];
}

//===============================================================

async function aggregatePage(
  query: AdminPharmacyRegistryListQuery,
  page: number
) {
  const stages: PipelineStage[] = [
    { $match: pharmacyMatch(query) },

    ...ownerSearchStages(query.ownerSearch),

    {
      $facet: {
        items: pagedItems(query, page),
        total: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await Pharmacy.aggregate<RegistryAggregateResult>(stages);

  return { items: result?.items ?? [], total: result?.total[0]?.count ?? 0 };
}

//===============================================================

export async function listAdminPharmaciesService(
  query: AdminPharmacyRegistryListQuery
) {
  let page = query.page;
  let result = await aggregatePage(query, page);

  const totalPages = Math.ceil(result.total / query.perPage);

  // A stale deep link after deletions must not show a misleading empty page.
  const safePage = Math.max(1, Math.min(page, Math.max(1, totalPages)));

  if (safePage !== page) {
    page = safePage;
    result = await aggregatePage(query, page);
  }

  const earliest = await Pharmacy.findOne()
    .sort({ createdAt: 1, _id: 1 })
    .select('createdAt')
    .lean<{ createdAt: Date } | null>();

  return {
    items: result.items.map((item) => {
      const owner = item.owner[0];

      return {
        id: item.id,
        name: item.name,

        ...(item.email ? { email: item.email } : {}),
        ...(item.phone ? { phone: item.phone } : {}),
        ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
        ...(item.location ? { location: item.location } : {}),

        status: item.status,
        createdAt: item.createdAt.toISOString(),

        owner: owner
          ? {
              id: owner.id,
              name: owner.name,
              ...(owner.pictureUrl ? { pictureUrl: owner.pictureUrl } : {}),
            }
          : null,

        activeClientsCount: item.activeClientsCount,
        addedProductsCount: item.addedProductsCount,
        successfulOrdersCount: item.successfulOrdersCount,
        successfulRevenue: item.successfulRevenue,
        rating: item.rating,
        reviewsCount: item.reviewsCount,
      };
    }),

    page,
    perPage: query.perPage,
    total: result.total,
    totalPages,
    earliestCreatedAt: earliest?.createdAt?.toISOString().slice(0, 10) ?? null,
  };
}

//===============================================================

export async function getAdminPharmacyStatisticsService() {
  const group = Object.fromEntries(
    STATUS_FIELDS.map(([key, status]) => [
      key,
      {
        $sum: { $cond: [{ $eq: ['$status', status] }, 1, 0] },
      },
    ])
  );

  const [result] = await Pharmacy.aggregate<Record<string, number>>([
    { $group: { _id: null, all: { $sum: 1 }, ...group } },
    {
      $project: {
        _id: 0,
        all: 1,
        ...Object.fromEntries(STATUS_FIELDS.map(([k]) => [k, 1])),
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

export async function listAdminPharmacyOptionsService(
  query: AdminPharmacyRegistryOptionsQuery
) {
  const match: Record<string, unknown> = query.search
    ? {
        $or: identitySearch(query.search, [
          'name',
          'email',
          'phone',
          'location.address',
          'location.settlement',
          'location.region',
        ]),
      }
    : {};

  if (query.ownerId) match.ownerId = new Types.ObjectId(query.ownerId);
  if (query.pharmacyId) match._id = new Types.ObjectId(query.pharmacyId);

  const items = await Pharmacy.aggregate<RegistryOption>([
    { $match: match },
    { $sort: { name: 1, _id: 1 } },
    { $limit: query.limit },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: 1,
        email: { $ifNull: ['$email', null] },
        phone: { $ifNull: ['$phone', null] },
        imageUrl: { $ifNull: ['$imageUrl', null] },
        location: { $ifNull: ['$location', null] },
      },
    },
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,

      ...(item.email ? { email: item.email } : {}),
      ...(item.phone ? { phone: item.phone } : {}),
      ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
      ...(item.location ? { location: item.location } : {}),
    })),
  };
}

//===============================================================

/** Only owners linked to at least one pharmacy, under pharmacies.view. */
export async function listAdminPharmacyRegistryOwnerOptionsService(
  query: AdminPharmacyRegistryOptionsQuery
) {
  const items = await User.aggregate<RegistryOwnerOption>([
    {
      $match: {
        role: USER_ROLES.PHARMACY,
        ...(query.ownerId ? { _id: new Types.ObjectId(query.ownerId) } : {}),
        ...(query.search
          ? { $or: identitySearch(query.search, ['name', 'email', 'phone']) }
          : {}),
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
              ...(query.pharmacyId
                ? { _id: new Types.ObjectId(query.pharmacyId) }
                : {}),
            },
          },
          { $limit: 1 },
          { $project: { _id: 1 } },
        ],

        as: '_linkedPharmacies',
      },
    },
    { $match: { '_linkedPharmacies.0': { $exists: true } } },
    { $sort: { name: 1, _id: 1 } },
    { $limit: query.limit },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: 1,
        pictureUrl: { $ifNull: ['$pictureUrl', null] },
      },
    },
  ]);

  return {
    items: items.map((owner) => ({
      id: owner.id,
      name: owner.name,

      ...(owner.pictureUrl ? { pictureUrl: owner.pictureUrl } : {}),
    })),
  };
}

//===============================================================

export const ADMIN_PHARMACY_REGISTRY_READ_DEFINITIONS = {
  ratingBounds: RATING_BOUNDS,
  statuses: STATUS_FIELDS,
} as const;
