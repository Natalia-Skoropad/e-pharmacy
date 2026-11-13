import { Types } from 'mongoose';

import { Order } from '../../models/orders/order.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';

import type { OwnedPharmacyRegistryListQuery } from '../../schemas/owners/owned-pharmacy-registry.schema';

import { createSafeRegExp } from '../../utils/validation/regexp';
import { getBusinessCalendarDate } from '../../utils/dates/date-range';

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

  // The date filter applies to when THIS client became associated with each
  // pharmacy, not to the unrelated pharmacy's global creation date.
  const calendarPharmacies = await Pharmacy.find({
    _id: { $in: candidateIds },
    ownerId: new Types.ObjectId(userId),
  })
    .select('_id createdAt activatedAt approvedAt')
    .lean();

  const associationDates = new Map(
    calendarPharmacies.map((pharmacy) => {
      const metric = byId.get(String(pharmacy._id));

      const date =
        metric?.firstOrderAt ??
        (pharmacy.activatedAt || pharmacy.approvedAt || pharmacy.createdAt);

      return [String(pharmacy._id), date] as const;
    })
  );

  const availableCreatedDates = [
    ...new Set(
      [...associationDates.values()]
        .map((date) => getBusinessCalendarDate(date))
        .filter((day): day is string => Boolean(day))
    ),
  ].sort();

  const filteredIds = candidateIds.filter((id) => {
    const date = getBusinessCalendarDate(
      associationDates.get(String(id)) ?? new Date(Number.NaN)
    );

    if (!date) return false;

    return (
      (!query.createdFrom || date >= query.createdFrom) &&
      (!query.createdTo || date <= query.createdTo)
    );
  });

  const filter: Record<string, unknown> = {
    _id: { $in: filteredIds },
    ownerId: new Types.ObjectId(userId),
  };

  if (query.pharmacyId) {
    filter._id = {
      $in: filteredIds.filter((id) => String(id) === query.pharmacyId),
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

  const pharmacies = await Pharmacy.find(filter)
    .select(
      '_id name email phone imageUrl location status reviewState blockSource createdAt rating reviewsCount'
    )
    .sort({ createdAt: direction, _id: direction })
    .skip((page - 1) * query.perPage)
    .limit(query.perPage)
    .lean();

  return {
    items: pharmacies.map((pharmacy) => {
      const pharmacyId = String(pharmacy._id);
      const metric = byId.get(pharmacyId);

      return {
        pharmacyId,
        pharmacyName: pharmacy.name,

        createdAt: (
          associationDates.get(pharmacyId) ?? pharmacy.createdAt
        ).toISOString(),

        ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
        ...(pharmacy.email ? { email: pharmacy.email } : {}),
        ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
        ...(pharmacy.location ? { location: pharmacy.location } : {}),

        status: pharmacy.status,

        ...(pharmacy.reviewState ? { reviewState: pharmacy.reviewState } : {}),
        ...(pharmacy.blockSource ? { blockSource: pharmacy.blockSource } : {}),

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
    earliestCreatedAt: availableCreatedDates[0] ?? null,
    availableCreatedDates,
  };
}
