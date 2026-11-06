import { Types } from 'mongoose';

import { Order } from '../../models/orders/order.model';
import type { OrderSalesStatisticsQuery } from '../../schemas/orders/order.schema';
import { getOrderSalesStatisticsForPharmaciesService } from '../orders/order-sales-statistics.service';

import { getOwnedClientPharmacyIds } from './client-owner-scope';
import { getClientByIdService } from './client-registry.service';

//===============================================================

/** Resolve the persisted owner scope first; never use the selected pharmacy. */
async function getClientAnalyticsScope(userId: string, clientId: string) {
  const { client } = await getClientByIdService(userId, clientId, true);
  const ownedIds = await getOwnedClientPharmacyIds(userId);

  const pharmacyIds = client.isDefault
    ? ownedIds.filter((id) => String(id) === client.pharmacyId)
    : ownedIds;

  return { clientObjectId: new Types.ObjectId(clientId), pharmacyIds };
}

//===============================================================

/** Includes zero values for every status when a client has no orders. */
export async function getClientOrderStatisticsService(
  userId: string,
  clientId: string
) {
  const { clientObjectId, pharmacyIds } = await getClientAnalyticsScope(
    userId,
    clientId
  );

  const counts = {
    new: { count: 0, amount: 0 },
    in_progress: { count: 0, amount: 0 },
    successful: { count: 0, amount: 0 },
    rejected: { count: 0, amount: 0 },
  };

  if (!pharmacyIds.length) return counts;

  const rows = await Order.aggregate<{
    _id: keyof typeof counts;
    count: number;
    amount: number;
  }>([
    {
      $match: {
        userId: clientObjectId,
        pharmacyId: { $in: pharmacyIds },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        amount: { $sum: '$totalPrice' },
      },
    },
  ]);

  for (const row of rows) {
    if (Object.prototype.hasOwnProperty.call(counts, row._id)) {
      counts[row._id] = { count: row.count, amount: row.amount };
    }
  }

  return counts;
}

//===============================================================

export async function getClientSalesStatisticsService(
  userId: string,
  clientId: string,
  query: OrderSalesStatisticsQuery
) {
  const { pharmacyIds } = await getClientAnalyticsScope(userId, clientId);

  return getOrderSalesStatisticsForPharmaciesService(
    pharmacyIds.map(String),
    query,
    clientId
  );
}
