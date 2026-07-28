import 'client-only';

import {
  ApiError,
  appendQueryParams,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/transport';

import {
  parseApiResponseData,
  parseMessageResponse,
  type ApiResponseContext,
} from '@e-pharmacy/api-client/response';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import { isRecord } from '@e-pharmacy/utils/guards';
import type { ProductRequestFormPayload } from '@e-pharmacy/types/product-requests';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  normalizeProductRequest,
  normalizeProductRequestDetails,
  normalizeProductRequestsResponse,
  type ProductRequestDetailsViewModel,
  type ProductRequestRowViewModel,
  type ProductRequestsQueryParams,
  type ProductRequestsViewModelResponse,
} from '@/lib/product-requests/product-requests';

//===================================================================

type ArticleAvailabilityResult = Readonly<{
  available: boolean;
  message?: string;
}>;

//===================================================================

function parseArticleAvailabilityResponse(
  value: unknown,
  context?: ApiResponseContext
): ArticleAvailabilityResult {
  if (!isRecord(value) || typeof value.available !== 'boolean') {
    throw new ApiError('Article availability response is invalid.', {
      transportCode: 'INVALID_RESPONSE',
      payload: value,
      ...context,
    });
  }

  if (value.message !== undefined && typeof value.message !== 'string') {
    throw new ApiError('Article availability response message is invalid.', {
      transportCode: 'INVALID_RESPONSE',
      payload: value,
      ...context,
    });
  }

  return {
    available: value.available,
    ...(typeof value.message === 'string' ? { message: value.message } : {}),
  };
}

//===================================================================

function parseProductRequestRow(
  value: unknown,
  context?: ApiResponseContext
): ProductRequestRowViewModel {
  const payload = isRecord(value) ? value.request : undefined;
  const request = normalizeProductRequest(payload);

  if (!request) {
    throw new ApiError(
      'Product request response does not match its contract.',
      {
        transportCode: 'INVALID_RESPONSE',
        payload: value,
        ...context,
      }
    );
  }
  return request;
}

//===================================================================

function parseProductRequestDetails(
  value: unknown,
  context?: ApiResponseContext
): ProductRequestDetailsViewModel {
  const payload = isRecord(value) ? value.request : undefined;
  const request = normalizeProductRequestDetails(payload);

  if (!request) {
    throw new ApiError(
      'Product request response does not match its contract.',
      {
        transportCode: 'INVALID_RESPONSE',
        payload: value,
        ...context,
      }
    );
  }
  return request;
}

//===================================================================

export async function createPharmacyProductRequest(
  payload: ProductRequestFormPayload
): Promise<ProductRequestRowViewModel> {
  const path = PHARMACY_API_ROUTES.productRequests.list;

  return parseApiResponseData(
    await localApiRequest(path, { method: 'POST', body: payload }),
    parseProductRequestRow,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function checkPharmacyProductRequestArticle(
  article: string,
  excludeRequestId?: string,
  options?: JsonResponseRequestOptions
): Promise<ArticleAvailabilityResult> {
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.productRequests.articleAvailability,
    { article, excludeRequestId }
  );

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseArticleAvailabilityResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getPharmacyProductRequests(
  params: ProductRequestsQueryParams = {},
  options?: JsonResponseRequestOptions
): Promise<ProductRequestsViewModelResponse> {
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.productRequests.list,
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, options),
    normalizeProductRequestsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getPharmacyProductRequest(
  requestId: string,
  options?: JsonResponseRequestOptions
): Promise<ProductRequestDetailsViewModel> {
  const path = PHARMACY_API_ROUTES.productRequests.details(requestId);

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseProductRequestDetails,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function updatePharmacyProductRequest(
  requestId: string,
  payload: ProductRequestFormPayload
): Promise<ProductRequestDetailsViewModel> {
  const path = PHARMACY_API_ROUTES.productRequests.details(requestId);

  return parseApiResponseData(
    await localApiRequest(path, { method: 'PATCH', body: payload }),
    parseProductRequestDetails,
    { url: path, method: 'PATCH' }
  );
}

//===================================================================

export async function deletePharmacyProductRequest(
  requestId: string
): Promise<void> {
  const path = PHARMACY_API_ROUTES.productRequests.details(requestId);

  parseApiResponseData(
    await localApiRequest(path, { method: 'DELETE' }),
    parseMessageResponse,
    { url: path, method: 'DELETE' }
  );
}
