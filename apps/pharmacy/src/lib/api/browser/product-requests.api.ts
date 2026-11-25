import 'client-only';

import {
  ApiError,
  appendQueryParams,
  isApiError,
} from '@e-pharmacy/api-client/transport';

import {
  parseApiResponseData,
  parseMessageResponse,
  type ApiResponseContext,
} from '@e-pharmacy/api-client/response';

import { isRecord } from '@e-pharmacy/utils/guards';
import type { ProductRequestFormPayload } from '@e-pharmacy/types/product-requests';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';
import { dispatchProductRequestCounterRefresh } from '@/lib/product-requests/product-request-counter-refresh';

import {
  confirmsProductRequestTransition,
  normalizeProductRequest,
  normalizeProductRequestDetails,
  normalizeProductRequestStatisticsResponse,
  normalizeProductRequestsResponse,
  type ProductRequestDetailsViewModel,
  type ProductRequestRowViewModel,
  type ProductRequestsQueryParams,
  type ProductRequestsViewModelResponse,
} from '@/lib/product-requests/product-requests';

import {
  sanitizeBrowserReadRequestOptions,
  type BrowserReadRequestOptions,
} from './request-options';

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

  const result = parseApiResponseData(
    await localApiRequest(path, { method: 'POST', body: payload }),

    parseProductRequestRow,

    { url: path, method: 'POST' }
  );

  dispatchProductRequestCounterRefresh();

  return result;
}

//===================================================================

export async function checkPharmacyProductRequestArticle(
  article: string,
  excludeRequestId?: string,
  options?: BrowserReadRequestOptions
): Promise<ArticleAvailabilityResult> {
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.productRequests.articleAvailability,
    { article, excludeRequestId }
  );

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    parseArticleAvailabilityResponse,

    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getPharmacyProductRequestStatistics(
  options?: BrowserReadRequestOptions
) {
  const path = PHARMACY_API_ROUTES.productRequests.statistics;

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    normalizeProductRequestStatisticsResponse,

    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getPharmacyProductRequests(
  params: ProductRequestsQueryParams = {},
  options?: BrowserReadRequestOptions
): Promise<ProductRequestsViewModelResponse> {
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.productRequests.list,
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    normalizeProductRequestsResponse,

    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getPharmacyProductRequest(
  requestId: string,
  options?: BrowserReadRequestOptions
): Promise<ProductRequestDetailsViewModel> {
  const path = PHARMACY_API_ROUTES.productRequests.details(requestId);

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

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

  const result = parseApiResponseData(
    await localApiRequest(path, { method: 'PATCH', body: payload }),

    parseProductRequestDetails,

    { url: path, method: 'PATCH' }
  );

  dispatchProductRequestCounterRefresh();

  return result;
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

  dispatchProductRequestCounterRefresh();
}

//===================================================================

// Separate binary attachment storage; product request JSON stores only document IDs.
export async function uploadPharmacyProductRequestDocument(payload: {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}): Promise<{
  document: { documentId: string; name: string; type: string; size: number };
}> {
  const path = PHARMACY_API_ROUTES.productRequests.documentUpload;

  return parseApiResponseData(
    await localApiRequest(path, { method: 'POST', body: payload }),
    (value) => {
      if (
        !isRecord(value) ||
        !isRecord(value.document) ||
        typeof value.document.documentId !== 'string' ||
        typeof value.document.name !== 'string' ||
        typeof value.document.type !== 'string' ||
        typeof value.document.size !== 'number'
      ) {
        throw new ApiError(
          'Product request document upload response is invalid.',
          {
            transportCode: 'INVALID_RESPONSE',
            payload: value,
          }
        );
      }

      return {
        document: {
          documentId: value.document.documentId,
          name: value.document.name,
          type: value.document.type,
          size: value.document.size,
        },
      };
    },
    { url: path, method: 'POST' }
  );
}

//===================================================================

// Owner lifecycle transitions are separate from ordinary Save changes.
async function mutatePharmacyProductRequestStatus(
  previous: ProductRequestDetailsViewModel,
  transition: 'submit' | 'cancel'
): Promise<ProductRequestDetailsViewModel> {
  const path = PHARMACY_API_ROUTES.productRequests[transition](previous.id);

  let result: ProductRequestDetailsViewModel;

  try {
    result = parseApiResponseData(
      await localApiRequest(path, { method: 'POST' }),
      parseProductRequestDetails,
      { url: path, method: 'POST' }
    );
  } catch (error: unknown) {
    const mayHaveCommitted =
      !isApiError(error) ||
      error.transportCode === 'INVALID_RESPONSE' ||
      error.transportCode === 'NETWORK_ERROR' ||
      error.transportCode === 'TIMEOUT' ||
      error.httpStatus === 409 ||
      (error.httpStatus !== undefined && error.httpStatus >= 500);

    if (!mayHaveCommitted) throw error;

    // Do not retry the POST. Verify the persisted transition via GET first.
    const fresh = await getPharmacyProductRequest(previous.id).catch(
      () => null
    );

    if (
      !fresh ||
      !confirmsProductRequestTransition(previous, fresh, transition)
    )
      throw error;

    result = fresh;
  }

  dispatchProductRequestCounterRefresh();

  return result;
}

//===================================================================

export function submitPharmacyProductRequest(
  previous: ProductRequestDetailsViewModel
) {
  return mutatePharmacyProductRequestStatus(previous, 'submit');
}

//===================================================================

export function cancelPharmacyProductRequest(
  previous: ProductRequestDetailsViewModel
) {
  return mutatePharmacyProductRequestStatus(previous, 'cancel');
}
