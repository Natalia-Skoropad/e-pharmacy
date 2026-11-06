import type { Request } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import type {
  ClientParams,
  ClientDetailQuery,
  ClientProductsQuery,
  ClientsQuery,
} from '../../schemas/clients/client.schema';

import {
  getClientByIdService,
  getClientsService,
} from '../../services/clients/client-registry.service';

import { getClientPharmaciesService } from '../../services/clients/client-pharmacies.service';
import { getClientPurchasedProductsService } from '../../services/clients/client-purchases.service';

import {
  getClientOrderStatisticsService,
  getClientSalesStatisticsService,
} from '../../services/clients/client-analytics.service';

import type { OrderSalesStatisticsQuery } from '../../schemas/orders/order.schema';
import type { OwnedPharmacyRegistryListQuery } from '../../schemas/owners/owned-pharmacy-registry.schema';

import type { ValidatedResponse } from '../../types/http/validated-request';
import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

export async function getClients(
  req: Request,
  res: ValidatedResponse<unknown, unknown, ClientsQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getClientsService(req.user?.id ?? '', query);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getClientById(
  req: Request,
  res: ValidatedResponse<unknown, ClientParams, ClientDetailQuery>
): Promise<void> {
  const { clientId } = res.locals.validated.params;

  const data = await getClientByIdService(
    req.user?.id ?? '',
    clientId,
    res.locals.validated.query.scope === 'owner'
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getClientPurchasedProducts(
  req: Request,
  res: ValidatedResponse<unknown, ClientParams, ClientProductsQuery>
): Promise<void> {
  const { params, query } = res.locals.validated;

  const data = await getClientPurchasedProductsService(
    req.user?.id ?? '',
    params.clientId,
    query
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getClientPharmacies(
  req: Request,
  res: ValidatedResponse<unknown, ClientParams, OwnedPharmacyRegistryListQuery>
): Promise<void> {
  const data = await getClientPharmaciesService(
    req.user?.id ?? '',
    res.locals.validated.params.clientId,
    res.locals.validated.query
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getClientOrderStatistics(
  req: Request,
  res: ValidatedResponse<unknown, ClientParams>
): Promise<void> {
  const data = await getClientOrderStatisticsService(
    req.user?.id ?? '',
    res.locals.validated.params.clientId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getClientSalesStatistics(
  req: Request,
  res: ValidatedResponse<unknown, ClientParams, OrderSalesStatisticsQuery>
): Promise<void> {
  const data = await getClientSalesStatisticsService(
    req.user?.id ?? '',
    res.locals.validated.params.clientId,
    res.locals.validated.query
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
