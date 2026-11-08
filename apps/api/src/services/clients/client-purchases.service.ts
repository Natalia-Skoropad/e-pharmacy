import { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { Order } from '../../models/orders/order.model';
import { User } from '../../models/accounts/user.model';

import type { ClientProductsQuery } from '../../schemas/clients/client.schema';

import { httpError } from '../../utils/http/httpError';

import { getCurrentPharmacyId } from './client-access';
import { getOwnedClientPharmacyIds } from './client-owner-scope';
import { getClientByIdService } from './client-registry.service';
import { buildClientProductsAggregationPipeline } from './client-purchases-aggregation';
import type { ClientPurchasedProductsAggregationResult } from './client-types';

//===============================================================

export async function getClientPurchasedProductsService(
  userId: string,
  clientId: string,
  query: ClientProductsQuery
) {
  const ownerScoped = query.scope === 'owner';

  // The owner-wide client detail never relies on a selected pharmacy header.
  // Authorization also verifies the client belongs to at least one of this
  // owner's pharmacies, including a walk-in client without any orders.
  if (ownerScoped) await getClientByIdService(userId, clientId, true);

  const pharmacyIds = ownerScoped
    ? await getOwnedClientPharmacyIds(userId)
    : await getCurrentPharmacyId(userId);

  if ((!ownerScoped && !pharmacyIds) || !Types.ObjectId.isValid(clientId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  const clientObjectId = new Types.ObjectId(clientId);
  const requestedSkip = (query.page - 1) * query.perPage;

  let [result] =
    await Order.aggregate<ClientPurchasedProductsAggregationResult>(
      buildClientProductsAggregationPipeline(
        pharmacyIds!,
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
        pharmacyIds!,
        clientObjectId,
        query,
        (page - 1) * query.perPage
      )
    );
  }

  const earliestCreatedAt = result?.metadata[0]?.earliestCreatedAt ?? null;

  if (!earliestCreatedAt && !ownerScoped) {
    const [clientHasOrders, defaultClientExists] = await Promise.all([
      Order.exists({
        pharmacyId: pharmacyIds,
        userId: clientObjectId,
      }),

      User.exists({
        _id: clientObjectId,
        isDefaultPharmacyClient: true,
        defaultClientPharmacyId: pharmacyIds,
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

    // Unfiltered metadata: the calendar must reflect all purchased product
    // first-order dates, even if the current table page/filter is empty.
    availableFirstOrderDates: [
      ...new Set(result?.metadata[0]?.availableFirstOrderDates ?? []),
    ].sort(),
  };
}
