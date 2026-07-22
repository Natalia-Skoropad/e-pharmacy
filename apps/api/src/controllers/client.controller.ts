import type { Request } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';

import type {
  ClientParams,
  ClientProductsQuery,
  ClientsQuery,
} from '../schemas/client.schema';

import {
  getClientByIdService,
  getClientPurchasedProductsService,
  getClientsService,
} from '../services/client.service';

import type { ValidatedResponse } from '../types/validated-request';
import { sendSuccessResponse } from '../utils/apiResponse';

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
  res: ValidatedResponse<unknown, ClientParams>
): Promise<void> {
  const { clientId } = res.locals.validated.params;
  const data = await getClientByIdService(req.user?.id ?? '', clientId);

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
