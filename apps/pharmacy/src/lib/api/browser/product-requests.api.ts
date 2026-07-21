import 'client-only';

import { buildQueryString, getResponseData } from '@e-pharmacy/api-client/core';
import type { ApiSuccessResponse } from '@e-pharmacy/types';

import type {
  CreatePharmacyProductRequestPayload,
  PharmacyProductRequestDetails,
  PharmacyProductRequestRow,
  PharmacyProductRequestsQueryParams,
  PharmacyProductRequestsResponse,
  UpdatePharmacyProductRequestPayload,
} from '@e-pharmacy/types/product-requests';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  normalizePharmacyProductRequest,
  normalizePharmacyProductRequestDetails,
  normalizePharmacyProductRequestsResponse,
} from '@/lib/product-requests/product-requests';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

//===================================================================

export async function createPharmacyProductRequest(
  payload: CreatePharmacyProductRequestPayload
): Promise<PharmacyProductRequestRow> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.productRequests.list,
    {
      method: 'POST',
      body: payload,
    }
  );

  const data = getResponseData(response) as { request?: unknown };
  const request = normalizePharmacyProductRequest(data.request);

  if (!request) {
    throw new Error('Product request could not be created.');
  }

  return request;
}

//===================================================================

export async function checkPharmacyProductRequestArticle(
  article: string,
  excludeRequestId?: string
): Promise<{ available: boolean; message?: string }> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `${PHARMACY_API_ROUTES.productRequests.list}/article-availability${buildQueryString({
      article,
      excludeRequestId,
    })}`
  );

  const data = getResponseData(response) as {
    available?: unknown;
    message?: unknown;
  };

  return {
    available: data.available === true,
    ...(typeof data.message === 'string' ? { message: data.message } : {}),
  };
}

//===================================================================

export async function getPharmacyProductRequests(
  params: PharmacyProductRequestsQueryParams = {}
): Promise<PharmacyProductRequestsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `${PHARMACY_API_ROUTES.productRequests.list}${buildQueryString(params)}`
  );

  return normalizePharmacyProductRequestsResponse(getResponseData(response));
}

//===================================================================

export async function getPharmacyProductRequest(
  requestId: string
): Promise<PharmacyProductRequestDetails> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.productRequests.details(requestId)
  );

  const data = getResponseData(response) as { request?: unknown };
  const request = normalizePharmacyProductRequestDetails(data.request);

  if (!request) {
    throw new Error('Product request could not be loaded.');
  }

  return request;
}

//===================================================================

export async function updatePharmacyProductRequest(
  requestId: string,
  payload: UpdatePharmacyProductRequestPayload
): Promise<PharmacyProductRequestDetails> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.productRequests.details(requestId),
    {
      method: 'PATCH',
      body: payload,
    }
  );

  const data = getResponseData(response) as { request?: unknown };
  const request = normalizePharmacyProductRequestDetails(data.request);

  if (!request) {
    throw new Error('Product request could not be updated.');
  }

  return request;
}

//===================================================================

export async function deletePharmacyProductRequest(
  requestId: string
): Promise<void> {
  await localApiRequest(
    PHARMACY_API_ROUTES.productRequests.details(requestId),
    { method: 'DELETE' }
  );
}
