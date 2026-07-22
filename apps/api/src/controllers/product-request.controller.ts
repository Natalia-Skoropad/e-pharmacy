import type { Request } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';

import type {
  ProductRequestArticleAvailabilityQuery,
  ProductRequestFormInput,
  ProductRequestParams,
  ProductRequestsQuery,
} from '../schemas/product-request.schema';

import {
  createProductRequestService,
  deleteProductRequestService,
  getProductRequestArticleAvailabilityService,
  getProductRequestByIdService,
  getProductRequestsService,
  updateProductRequestService,
} from '../services/product-request.service';

import type { ValidatedResponse } from '../types/validated-request';
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

export async function createProductRequest(
  req: Request,
  res: ValidatedResponse<ProductRequestFormInput>
): Promise<void> {
  const { body } = res.locals.validated;
  const data = await createProductRequestService(req.user?.id ?? '', body);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

export async function getProductRequestArticleAvailability(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, ProductRequestArticleAvailabilityQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getProductRequestArticleAvailabilityService(query);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getProductRequests(
  req: Request,
  res: ValidatedResponse<unknown, unknown, ProductRequestsQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getProductRequestsService(req.user?.id ?? '', query);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getProductRequestById(
  req: Request,
  res: ValidatedResponse<unknown, ProductRequestParams>
): Promise<void> {
  const { requestId } = res.locals.validated.params;
  const data = await getProductRequestByIdService(req.user?.id ?? '', requestId);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function updateProductRequest(
  req: Request,
  res: ValidatedResponse<ProductRequestFormInput, ProductRequestParams>
): Promise<void> {
  const { body, params } = res.locals.validated;
  const data = await updateProductRequestService(
    req.user?.id ?? '',
    params.requestId,
    body
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function deleteProductRequest(
  req: Request,
  res: ValidatedResponse<unknown, ProductRequestParams>
): Promise<void> {
  const { requestId } = res.locals.validated.params;
  const data = await deleteProductRequestService(req.user?.id ?? '', requestId);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
