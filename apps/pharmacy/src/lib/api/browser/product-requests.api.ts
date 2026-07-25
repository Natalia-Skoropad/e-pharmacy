import 'client-only';

import {
  buildQueryString,
  getResponseData,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/core';

import type { ApiSuccessResponse } from '@e-pharmacy/types/api';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  ProductRequestFormPayload,
  ProductRequestResponseDto,
  ProductRequestsResponseDto,
} from '@e-pharmacy/types/product-requests';

import type {
  ProductRequestDetailsViewModel,
  ProductRequestRowViewModel,
  ProductRequestsQueryParams,
  ProductRequestsViewModelResponse,
} from '@/lib/product-requests/product-requests';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  normalizeProductRequest,
  normalizeProductRequestDetails,
  normalizeProductRequestsResponse,
} from '@/lib/product-requests/product-requests';

//===================================================================

export async function createPharmacyProductRequest(
  payload: ProductRequestFormPayload
): Promise<ProductRequestRowViewModel> {
  const response = await localApiRequest<
    ApiSuccessResponse<{ request?: ProductRequestResponseDto }>
  >(PHARMACY_API_ROUTES.productRequests.list, {
    method: 'POST',
    body: payload,
  });

  const data = getResponseData(response);
  const request = normalizeProductRequest(data.request);

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
    `${PHARMACY_API_ROUTES.productRequests.list}/article-availability${buildQueryString(
      {
        article,
        excludeRequestId,
      }
    )}`
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
  params: ProductRequestsQueryParams = {},
  options?: JsonResponseRequestOptions
): Promise<ProductRequestsViewModelResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ProductRequestsResponseDto>
  >(
    `${PHARMACY_API_ROUTES.productRequests.list}${buildQueryString(params)}`,
    options
  );

  return normalizeProductRequestsResponse(getResponseData(response));
}

//===================================================================

export async function getPharmacyProductRequest(
  requestId: string
): Promise<ProductRequestDetailsViewModel> {
  const response = await localApiRequest<
    ApiSuccessResponse<{ request?: ProductRequestResponseDto }>
  >(PHARMACY_API_ROUTES.productRequests.details(requestId));

  const data = getResponseData(response);
  const request = normalizeProductRequestDetails(data.request);

  if (!request) {
    throw new Error('Product request could not be loaded.');
  }

  return request;
}

//===================================================================

export async function updatePharmacyProductRequest(
  requestId: string,
  payload: ProductRequestFormPayload
): Promise<ProductRequestDetailsViewModel> {
  const response = await localApiRequest<
    ApiSuccessResponse<{ request?: ProductRequestResponseDto }>
  >(PHARMACY_API_ROUTES.productRequests.details(requestId), {
    method: 'PATCH',
    body: payload,
  });

  const data = getResponseData(response);
  const request = normalizeProductRequestDetails(data.request);

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
