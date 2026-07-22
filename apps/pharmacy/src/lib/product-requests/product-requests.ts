import { isProductCategory } from '@e-pharmacy/types/products';

import {
  normalizePaginatedResponse,
  requirePaginatedResponse,
} from '@e-pharmacy/api-client/response';

import { isRecord } from '@e-pharmacy/utils/guards';
import { getFiniteNumber } from '@e-pharmacy/utils/numbers';
import { getTrimmedString } from '@e-pharmacy/utils/strings';

import {
  normalizeProductRequestStatus,
  type ProductRequestDetails,
  type ProductRequestRow,
  type ProductRequestFile,
  type ProductRequestHistoryEntry,
  type ProductRequestsResponse,
} from '@e-pharmacy/types/product-requests';

export { DEFAULT_PRODUCT_REQUESTS_FILTERS } from '@e-pharmacy/types/product-requests';

export type {
  ProductRequestDetails,
  ProductRequestRow,
  ProductRequestsQueryParams,
  ProductRequestsResponse,
  ProductRequestCategoryFilter,
  ProductRequestStatus,
  ProductRequestStatusFilter,
  ProductRequestsFilterState,
} from '@e-pharmacy/types/product-requests';

//===================================================================

function normalizeProductRequestFile(
  rawFile: unknown
): ProductRequestFile | null {
  if (!isRecord(rawFile)) return null;

  const name = getTrimmedString(rawFile.name);
  const size = getFiniteNumber(rawFile.size);

  if (!name || size === undefined) return null;

  return {
    name,
    type: getTrimmedString(rawFile.type) ?? 'application/octet-stream',
    size,
    ...(getTrimmedString(rawFile.dataUrl)
      ? { dataUrl: getTrimmedString(rawFile.dataUrl) }
      : {}),
  };
}

//===================================================================

function normalizeProductRequestHistoryEntry(
  rawEntry: unknown,
  index: number
): ProductRequestHistoryEntry | null {
  if (!isRecord(rawEntry)) return null;

  const createdAt = getTrimmedString(rawEntry.createdAt);
  const title = getTrimmedString(rawEntry.title);
  const description = getTrimmedString(rawEntry.description);

  if (!createdAt || !title || !description) return null;

  return {
    id:
      getTrimmedString(rawEntry.id) ??
      getTrimmedString(rawEntry._id) ??
      `history-${index}`,
    status: normalizeProductRequestStatus(rawEntry.status),
    title,
    description,
    createdAt,
  };
}

//===================================================================

export function normalizeProductRequest(
  rawRequest: unknown
): ProductRequestRow | null {
  if (!isRecord(rawRequest)) return null;

  const id =
    getTrimmedString(rawRequest.id) ?? getTrimmedString(rawRequest._id);
  const createdAt =
    getTrimmedString(rawRequest.createdAt) ??
    getTrimmedString(rawRequest.createdDate) ??
    getTrimmedString(rawRequest.updatedAt);

  if (!id || !createdAt) return null;

  const rawProduct = isRecord(rawRequest.product)
    ? rawRequest.product
    : undefined;

  const productId =
    getTrimmedString(rawRequest.productId) ??
    getTrimmedString(rawProduct?.id) ??
    getTrimmedString(rawProduct?._id) ??
    getTrimmedString(rawRequest.product);

  const productImageUrl =
    getTrimmedString(rawRequest.productImageUrl) ??
    getTrimmedString(rawRequest.imageUrl) ??
    getTrimmedString(rawProduct?.imageUrl);

  const productArticle =
    getTrimmedString(rawRequest.productArticle) ??
    getTrimmedString(rawRequest.article) ??
    '—';

  const productName =
    getTrimmedString(rawRequest.productName) ??
    getTrimmedString(rawRequest.name) ??
    'Unnamed request';

  return {
    id,
    requestNumber: getTrimmedString(rawRequest.requestNumber) ?? id,
    createdAt,
    productId,
    productImageUrl,
    productArticle,
    productName,
    category: isProductCategory(rawRequest.category)
      ? rawRequest.category
      : 'other',
    ...(getTrimmedString(rawRequest.customCategory)
      ? { customCategory: getTrimmedString(rawRequest.customCategory) }
      : {}),
    status: normalizeProductRequestStatus(rawRequest.status),
  };
}

//===================================================================

export function normalizeProductRequestDetails(
  rawRequest: unknown
): ProductRequestDetails | null {
  const request = normalizeProductRequest(rawRequest);
  if (!request || !isRecord(rawRequest)) return null;

  const productImage = normalizeProductRequestFile(rawRequest.productImage);
  const additionalFiles = Array.isArray(rawRequest.additionalFiles)
    ? rawRequest.additionalFiles
        .map(normalizeProductRequestFile)
        .filter((file): file is ProductRequestFile => Boolean(file))
    : [];
  const history = Array.isArray(rawRequest.history)
    ? rawRequest.history
        .map(normalizeProductRequestHistoryEntry)
        .filter((entry): entry is ProductRequestHistoryEntry => Boolean(entry))
    : [];

  return {
    ...request,
    updatedAt: getTrimmedString(rawRequest.updatedAt) ?? request.createdAt,
    name: getTrimmedString(rawRequest.name) ?? request.productName,
    article: getTrimmedString(rawRequest.article) ?? request.productArticle,
    ...(productImage ? { productImage } : {}),
    ...(getTrimmedString(rawRequest.manufacturer)
      ? { manufacturer: getTrimmedString(rawRequest.manufacturer) }
      : {}),
    ...(getTrimmedString(rawRequest.countryOfOrigin)
      ? { countryOfOrigin: getTrimmedString(rawRequest.countryOfOrigin) }
      : {}),
    ...(getTrimmedString(rawRequest.dosage)
      ? { dosage: getTrimmedString(rawRequest.dosage) }
      : {}),
    ...(getTrimmedString(rawRequest.packageSize)
      ? { packageSize: getTrimmedString(rawRequest.packageSize) }
      : {}),
    ...(getTrimmedString(rawRequest.form)
      ? { form: getTrimmedString(rawRequest.form) }
      : {}),
    ...(getTrimmedString(rawRequest.activeSubstance)
      ? { activeSubstance: getTrimmedString(rawRequest.activeSubstance) }
      : {}),
    ...(getTrimmedString(rawRequest.prescriptionType)
      ? { prescriptionType: getTrimmedString(rawRequest.prescriptionType) }
      : {}),
    ...(getTrimmedString(rawRequest.fullDescription)
      ? { fullDescription: getTrimmedString(rawRequest.fullDescription) }
      : {}),
    ...(getTrimmedString(rawRequest.pharmacyComment)
      ? { pharmacyComment: getTrimmedString(rawRequest.pharmacyComment) }
      : {}),
    ...(additionalFiles.length ? { additionalFiles } : {}),
    ...(getTrimmedString(rawRequest.rejectionReason)
      ? { rejectionReason: getTrimmedString(rawRequest.rejectionReason) }
      : {}),
    history,
    commentsTotal: getFiniteNumber(rawRequest.commentsTotal) ?? 0,
  };
}

//===================================================================

export function normalizeProductRequestsResponse(
  payload: unknown
): ProductRequestsResponse {
  const response = requirePaginatedResponse(
    normalizePaginatedResponse(payload, {
      itemKeys: ['items', 'requests'],
      normalizeItem: normalizeProductRequest,
    }),
    'product requests response'
  );

  return {
    ...response,
    earliestCreatedAt: isRecord(payload)
      ? (getTrimmedString(payload.earliestCreatedAt) ?? null)
      : null,
  };
}
