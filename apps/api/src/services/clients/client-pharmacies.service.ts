import { Types } from 'mongoose';

import { Order } from '../../models/orders/order.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';

import { getOwnedClientPharmacyIds } from './client-owner-scope';
import { getClientRowsForPharmacies } from './client-registry-aggregation';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { httpError } from '../../utils/http/httpError';

//===============================================================

// Only completed or attempted orders establish a client-pharmacy relationship.
// A default walk-in client with no orders intentionally has an empty tab.
export async function getClientPharmaciesService(
  userId: string,
  clientId: string
) {
  const pharmacyIds = await getOwnedClientPharmacyIds(userId);

  const knownClient = await getClientRowsForPharmacies(pharmacyIds, {
    page: 1,
    perPage: 1,
    clientId,
  });

  if (!knownClient.items.some((client) => client.id === clientId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  const items = await Order.aggregate<{
    pharmacyId: string;
    pharmacyName: string;
    firstOrderAt: Date;
    lastOrderAt: Date;
    ordersCount: number;
    successfulOrdersCount: number;
    successfulOrdersAmount: number;
  }>([
    {
      $match: {
        userId: new Types.ObjectId(clientId),
        pharmacyId: { $in: pharmacyIds },
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
    {
      $lookup: {
        from: Pharmacy.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'pharmacy',
      },
    },
    { $unwind: '$pharmacy' },
    { $sort: { lastOrderAt: -1, _id: 1 } },
    {
      $project: {
        _id: 0,
        pharmacyId: { $toString: '$_id' },
        pharmacyName: '$pharmacy.name',
        firstOrderAt: 1,
        lastOrderAt: 1,
        ordersCount: 1,
        successfulOrdersCount: 1,
        successfulOrdersAmount: 1,
      },
    },
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      firstOrderAt: item.firstOrderAt.toISOString(),
      lastOrderAt: item.lastOrderAt.toISOString(),
    })),
  };
}
