import { isProductCategory } from '@e-pharmacy/types/products';
import { normalizePaginatedResponse } from '@e-pharmacy/utils/api';

import {
  getStringValue,
  isRecord,
} from '@e-pharmacy/utils/guards';

import {
  normalizeProductRequestStatus,
  type PharmacyProductRequestRow,
  type PharmacyProductRequestsResponse,
} from '@e-pharmacy/types/product-requests';

export {
  DEFAULT_PRODUCT_REQUESTS_FILTERS,
  PRODUCT_REQUEST_STATUS_LABELS,
} from '@e-pharmacy/types/product-requests';

export type {
  PharmacyProductRequestRow,
  PharmacyProductRequestsQueryParams,
  PharmacyProductRequestsResponse,
  ProductRequestCategoryFilter,
  ProductRequestStatus,
  ProductRequestStatusFilter,
  ProductRequestsFilterState,
} from '@e-pharmacy/types/product-requests';

//===================================================================

export function normalizePharmacyProductRequest(
  rawRequest: unknown
): PharmacyProductRequestRow | null {
  if (!isRecord(rawRequest)) return null;

  const id = getStringValue(rawRequest.id) ?? getStringValue(rawRequest._id);
  const createdAt =
    getStringValue(rawRequest.createdAt) ??
    getStringValue(rawRequest.createdDate) ??
    getStringValue(rawRequest.updatedAt);

  if (!id || !createdAt) return null;

  const productId =
    getStringValue(rawRequest.productId) ?? getStringValue(rawRequest.product);

  const productArticle =
    getStringValue(rawRequest.productArticle) ??
    getStringValue(rawRequest.article) ??
    '—';

  const productName =
    getStringValue(rawRequest.productName) ??
    getStringValue(rawRequest.name) ??
    'Unnamed request';

  return {
    id,
    requestNumber: getStringValue(rawRequest.requestNumber) ?? id,
    createdAt,
    productId,
    productArticle,
    productName,
    category: isProductCategory(rawRequest.category)
      ? rawRequest.category
      : 'other',
    status: normalizeProductRequestStatus(rawRequest.status),
  };
}

//===================================================================

export function normalizePharmacyProductRequestsResponse(
  payload: unknown
): PharmacyProductRequestsResponse {
  return normalizePaginatedResponse(payload, {
    itemKeys: ['items', 'requests'],
    normalizeItem: normalizePharmacyProductRequest,
  });
}
