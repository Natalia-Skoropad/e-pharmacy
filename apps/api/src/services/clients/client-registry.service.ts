import { HTTP_STATUS } from '../../constants/httpStatus';
import { httpError } from '../../utils/httpError';
import type { ClientsQuery } from '../../schemas/client.schema';

import { getCurrentPharmacyId } from './client-access';
import { getClientRowsForPharmacy } from './client-registry-aggregation';

//===============================================================

export async function getClientsService(userId: string, query: ClientsQuery) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId) {
    return {
      items: [],
      page: 1,
      perPage: query.perPage,
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
      statistics: { total: 0, repeat: 0, active: 0, blocked: 0 },
    };
  }

  let result = await getClientRowsForPharmacy(pharmacyId, query);
  let totalPages = Math.ceil(result.total / query.perPage);
  let page = totalPages === 0 ? 1 : Math.min(query.page, totalPages);

  if (page !== query.page) {
    result = await getClientRowsForPharmacy(pharmacyId, { ...query, page });
    totalPages = Math.ceil(result.total / query.perPage);
    page = totalPages === 0 ? 1 : Math.min(page, totalPages);
  }

  return {
    items: result.items,
    page,
    perPage: query.perPage,
    total: result.total,
    totalPages,
    earliestCreatedAt: result.earliestCreatedAt,
    statistics: result.statistics,
  };
}

//===============================================================

export async function getClientByIdService(userId: string, clientId: string) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  const result = await getClientRowsForPharmacy(pharmacyId, {
    page: 1,
    perPage: 1,
    clientId,
  });

  const client = result.items.find((item) => item.id === clientId);

  if (!client) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  return { client };
}
