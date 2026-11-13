import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { httpError } from '../../utils/http/httpError';
import type { ClientsQuery } from '../../schemas/clients/client.schema';

import { getCurrentPharmacyId } from './client-access';

import {
  getClientRowsForPharmacy,
  getClientRowsForPharmacies,
} from './client-registry-aggregation';

import { getOwnedClientPharmacyIds } from './client-owner-scope';

//===============================================================

export async function getClientsService(userId: string, query: ClientsQuery) {
  // Only the owner-wide registry accepts scope=owner. A pharmacy-specific
  // detail/tab keeps its existing membership and selection requirements.
  const ownedIds =
    query.scope === 'owner' ? await getOwnedClientPharmacyIds(userId) : null;

  if (
    ownedIds &&
    query.pharmacyId &&
    !ownedIds.some((id) => String(id) === query.pharmacyId!.toLowerCase())
  ) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Pharmacy does not belong to this owner.'
    );
  }

  if (!ownedIds && query.pharmacyId) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Pharmacy filter requires owner scope.'
    );
  }

  const pharmacyId = ownedIds ? null : await getCurrentPharmacyId(userId);

  if (!ownedIds && !pharmacyId) {
    return {
      items: [],
      page: 1,
      perPage: query.perPage,
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
      availableClientAddedDates: [],
      statistics: { total: 0, repeat: 0, active: 0, blocked: 0 },
    };
  }

  const loadRows = (params: ClientsQuery) =>
    ownedIds
      ? getClientRowsForPharmacies(
          ownedIds.filter(
            (id) =>
              !params.pharmacyId ||
              String(id) === params.pharmacyId.toLowerCase()
          ),
          params
        )
      : getClientRowsForPharmacy(pharmacyId!, params);

  let result = await loadRows(query);
  let totalPages = Math.ceil(result.total / query.perPage);
  let page = totalPages === 0 ? 1 : Math.min(query.page, totalPages);

  if (page !== query.page) {
    result = await loadRows({ ...query, page });
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
    availableClientAddedDates: result.availableClientAddedDates ?? [],
    statistics: result.statistics,
  };
}

//===============================================================

export async function getClientByIdService(
  userId: string,
  clientId: string,
  ownerScope = false
) {
  const ownedIds = ownerScope ? await getOwnedClientPharmacyIds(userId) : null;
  const pharmacyId = ownedIds ? null : await getCurrentPharmacyId(userId);

  if (!ownedIds && !pharmacyId) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  const query = { page: 1, perPage: 1, clientId };

  const result = ownedIds
    ? await getClientRowsForPharmacies(ownedIds, query)
    : await getClientRowsForPharmacy(pharmacyId!, query);

  const client = result.items.find((item) => item.id === clientId);

  if (!client) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  return { client };
}
