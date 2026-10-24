import { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { Order } from '../../models/orders/order.model';
import { User } from '../../models/accounts/user.model';

import type { ClientProductsQuery } from '../../schemas/client.schema';

import { httpError } from '../../utils/httpError';

import { getCurrentPharmacyId } from './client-access';
import { buildClientProductsAggregationPipeline } from './client-purchases-aggregation';
import type { ClientPurchasedProductsAggregationResult } from './client-types';

//===============================================================

export async function getClientPurchasedProductsService(
  userId: string,
  clientId: string,
  query: ClientProductsQuery
) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId || !Types.ObjectId.isValid(clientId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  const clientObjectId = new Types.ObjectId(clientId);
  const requestedSkip = (query.page - 1) * query.perPage;

  let [result] =
    await Order.aggregate<ClientPurchasedProductsAggregationResult>(
      buildClientProductsAggregationPipeline(
        pharmacyId,
        clientObjectId,
        query,
        requestedSkip
      )
    );

  const total = result?.total[0]?.count ?? 0;
  const totalPages = Math.ceil(total / query.perPage);
  const page = totalPages === 0 ? 1 : Math.min(query.page, totalPages);

  if (page !== query.page) {
    [result] = await Order.aggregate<ClientPurchasedProductsAggregationResult>(
      buildClientProductsAggregationPipeline(
        pharmacyId,
        clientObjectId,
        query,
        (page - 1) * query.perPage
      )
    );
  }

  const earliestCreatedAt = result?.metadata[0]?.earliestCreatedAt ?? null;

  if (!earliestCreatedAt) {
    const [clientHasOrders, defaultClientExists] = await Promise.all([
      Order.exists({
        pharmacyId,
        userId: clientObjectId,
      }),

      User.exists({
        _id: clientObjectId,
        isDefaultPharmacyClient: true,
        defaultClientPharmacyId: pharmacyId,
      }),
    ]);

    if (!clientHasOrders && !defaultClientExists) {
      throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
    }
  }

  return {
    items: (result?.items ?? []).map(
      ({ categoryId, categoryName, categorySlug, ...row }) => ({
        ...row,

        ...(categoryName && categorySlug
          ? {
              category: {
                ...(categoryId ? { id: categoryId } : {}),

                name: categoryName,
                slug: categorySlug,
              },
            }
          : {}),

        firstOrderDate: row.firstOrderDate.toISOString(),
      })
    ),

    page,
    perPage: query.perPage,
    total,
    totalPages,

    earliestCreatedAt: earliestCreatedAt
      ? earliestCreatedAt.toISOString().slice(0, 10)
      : null,
  };
}
