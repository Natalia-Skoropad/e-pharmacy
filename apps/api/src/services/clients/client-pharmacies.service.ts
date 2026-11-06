import { Types } from 'mongoose';

import { Order } from '../../models/orders/order.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';

import type { OwnedPharmacyRegistryListQuery } from '../../schemas/owners/owned-pharmacy-registry.schema';

import { getEndOfDay, getStartOfDay } from '../../utils/dates/date-range';
import { createSafeRegExp } from '../../utils/validation/regexp';

import { RATING_BOUNDS } from '../pharmacies/registry/pharmacy-registry.constants';

import { getOwnedClientPharmacyIds } from './client-owner-scope';
import { getClientByIdService } from './client-registry.service';

//===============================================================

type ClientPharmacyMetrics = {
  _id: Types.ObjectId;
  firstOrderAt: Date;
  lastOrderAt: Date;
  ordersCount: number;
  successfulOrdersCount: number;
  successfulOrdersAmount: number;
};

//===============================================================

const DEFAULT_QUERY: OwnedPharmacyRegistryListQuery = {
  page: 1,
  perPage: 20,
  sort: 'created_desc',
};

//===============================================================

/** Only the authenticated owner's accessible pharmacies are ever considered. */
export async function getClientPharmaciesService(
  userId: string,
  clientId: string,
  query: OwnedPharmacyRegistryListQuery = DEFAULT_QUERY
) {
  const { client } = await getClientByIdService(userId, clientId, true);
  const ownedIds = await getOwnedClientPharmacyIds(userId);

  const orderMetrics = await Order.aggregate<ClientPharmacyMetrics>([
    {
      $match: {
        userId: new Types.ObjectId(clientId),
        pharmacyId: { $in: ownedIds },
      },
    },
    {
      $group: {
        _id: '$pharmacyId',
        firstOrderAt: { $min: '$createdAt' },
        lastOrderAt: { $max: '$createdAt' },
        ordersCount: { $sum: 1 },
        successfulOrdersCount: {
          $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] },
        },
        successfulOrdersAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'successful'] }, '$totalPrice', 0],
          },
        },
      },
    },
  ]);

  const byId = new Map(
    orderMetrics.map((metric) => [String(metric._id), metric])
  );

  // A default (walk-in) client belongs to exactly one pharmacy even before
  // the first purchase. Ordinary clients appear only in pharmacies in which
  // they actually placed an order.
  const candidateIds = client.isDefault
    ? ownedIds.filter((id) => String(id) === client.pharmacyId)
    : orderMetrics.map((metric) => metric._id);

  const filter: Record<string, unknown> = {
    _id: { $in: candidateIds },
    ownerId: new Types.ObjectId(userId),
  };

  if (query.pharmacyId) {
    filter._id = {
      $in: candidateIds.filter((id) => String(id) === query.pharmacyId),
    };
  }

  if (query.status) filter.status = query.status;

  if (query.settlement) {
    filter['location.settlement'] = new RegExp(
      `^${createSafeRegExp(query.settlement).source}$`,
      'i'
    );
  }

  if (query.region) {
    filter['location.region'] = new RegExp(
      `^${createSafeRegExp(query.region).source}$`,
      'i'
    );
  }

  if (query.createdFrom || query.createdTo) {
    filter.createdAt = {
      ...(query.createdFrom ? { $gte: getStartOfDay(query.createdFrom) } : {}),
      ...(query.createdTo ? { $lte: getEndOfDay(query.createdTo) } : {}),
    };
  }

  if (query.pharmacySearch) {
    const regex = createSafeRegExp(query.pharmacySearch);

    filter.$or = [
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

  if (query.rating) {
    const bounds = RATING_BOUNDS[query.rating];

    filter.$and = [
      { $expr: { $gte: [{ $ifNull: ['$rating', 0] }, bounds.min] } },
      {
        $expr: {
          [bounds.inclusiveMax ? '$lte' : '$lt']: [
            { $ifNull: ['$rating', 0] },
            bounds.max,
          ],
        },
      },
    ];
  }

  const total = await Pharmacy.countDocuments(filter);
  const totalPages = Math.ceil(total / query.perPage);
  const page = Math.min(query.page, Math.max(1, totalPages));
  const direction = query.sort === 'created_asc' ? 1 : -1;

  const [pharmacies, earliest] = await Promise.all([
    Pharmacy.find(filter)
      .select(
        '_id name email phone imageUrl location status reviewState createdAt rating reviewsCount'
      )
      .sort({ createdAt: direction, _id: direction })
      .skip((page - 1) * query.perPage)
      .limit(query.perPage)
      .lean(),

    Pharmacy.findOne({
      _id: { $in: candidateIds },
      ownerId: new Types.ObjectId(userId),
    })
      .select('createdAt')
      .sort({ createdAt: 1, _id: 1 })
      .lean(),
  ]);

  return {
    items: pharmacies.map((pharmacy) => {
      const pharmacyId = String(pharmacy._id);
      const metric = byId.get(pharmacyId);

      return {
        pharmacyId,
        pharmacyName: pharmacy.name,
        createdAt: pharmacy.createdAt.toISOString(),

        ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
        ...(pharmacy.email ? { email: pharmacy.email } : {}),
        ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
        ...(pharmacy.location ? { location: pharmacy.location } : {}),

        status: pharmacy.status,

        ...(pharmacy.reviewState ? { reviewState: pharmacy.reviewState } : {}),

        rating: pharmacy.rating ?? 0,
        reviewsCount: pharmacy.reviewsCount ?? 0,
        firstOrderAt: metric?.firstOrderAt?.toISOString() ?? null,
        lastOrderAt: metric?.lastOrderAt?.toISOString() ?? null,
        ordersCount: metric?.ordersCount ?? 0,
        successfulOrdersCount: metric?.successfulOrdersCount ?? 0,
        successfulOrdersAmount: metric?.successfulOrdersAmount ?? 0,
      };
    }),

    page,
    perPage: query.perPage,
    total,
    totalPages,
    earliestCreatedAt: earliest?.createdAt?.toISOString().slice(0, 10) ?? null,
  };
}
