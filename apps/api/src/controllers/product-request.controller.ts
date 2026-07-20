import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';

import {
  createProductRequestSchema,
  productRequestParamsSchema,
  productRequestsQuerySchema,
} from '../schemas/product-request.schema';

import {
  createProductRequestService,
  getProductRequestByIdService,
  getProductRequestsService,
} from '../services/product-request.service';

import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

export async function createProductRequest(
  req: Request,
  res: Response
): Promise<void> {
  const body = createProductRequestSchema.parse(req.body);
  const data = await createProductRequestService(req.user?.id ?? '', body);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    data,
  });
}

//===============================================================

export async function getProductRequests(
  req: Request,
  res: Response
): Promise<void> {
  const query = productRequestsQuerySchema.parse(req.query);
  const data = await getProductRequestsService(req.user?.id ?? '', query);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getProductRequestById(
  req: Request,
  res: Response
): Promise<void> {
  const { requestId } = productRequestParamsSchema.parse(req.params);
  const data = await getProductRequestByIdService(
    req.user?.id ?? '',
    requestId
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

