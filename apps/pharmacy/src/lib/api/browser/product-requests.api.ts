import 'client-only';

import {
  ApiError,
  appendQueryParams,
  getResponseData,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/core';

import type { ApiSuccessResponse } from '@e-pharmacy/types/api';
import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { isRecord } from '@e-pharmacy/utils/guards';

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

type ArticleAvailabilityResult = Readonly<{
  available: boolean;
  message?: string;
}>;

//===================================================================

function parseArticleAvailabilityResponse(
  value: unknown
): ArticleAvailabilityResult {
  if (!isRecord(value) || typeof value.available !== 'boolean') {
    throw new ApiError('Article availability response is invalid.', {
      transportCode: 'INVALID_RESPONSE',
      payload: value,
    });
  }

  if (value.message !== undefined && typeof value.message !== 'string') {
    throw new ApiError('Article availability response message is invalid.', {
      transportCode: 'INVALID_RESPONSE',
      payload: value,
    });
  }

  return {
    available: value.available,
    ...(typeof value.message === 'string' ? { message: value.message } : {}),
  };
}

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
  excludeRequestId?: string,
  options?: JsonResponseRequestOptions
): Promise<{ available: boolean; message?: string }> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    appendQueryParams(
      PHARMACY_API_ROUTES.productRequests.articleAvailability,
      { article, excludeRequestId }
    ),
    options
  );

  return parseArticleAvailabilityResponse(getResponseData(response));
}

//===================================================================

export async function getPharmacyProductRequests(
  params: ProductRequestsQueryParams = {},
  options?: JsonResponseRequestOptions
): Promise<ProductRequestsViewModelResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ProductRequestsResponseDto>
  >(
    appendQueryParams(PHARMACY_API_ROUTES.productRequests.list, params),
    options
  );

  return normalizeProductRequestsResponse(getResponseData(response));
}

//===================================================================

export async function getPharmacyProductRequest(
  requestId: string,
  options?: JsonResponseRequestOptions
): Promise<ProductRequestDetailsViewModel> {
  const response = await localApiRequest<
    ApiSuccessResponse<{ request?: ProductRequestResponseDto }>
  >(PHARMACY_API_ROUTES.productRequests.details(requestId), options);

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
