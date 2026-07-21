import { isProductCategory } from '@e-pharmacy/types/products';
import { normalizePaginatedResponse } from '@e-pharmacy/utils/api';

import {
  getNumberValue,
  getStringValue,
  isRecord,
} from '@e-pharmacy/utils/guards';

import {
  normalizeProductRequestStatus,
  type PharmacyProductRequestDetails,
  type PharmacyProductRequestRow,
  type ProductRequestFile,
  type ProductRequestHistoryEntry,
  type PharmacyProductRequestsResponse,
} from '@e-pharmacy/types/product-requests';

export {
  DEFAULT_PRODUCT_REQUESTS_FILTERS,
  PRODUCT_REQUEST_STATUS_LABELS,
} from '@e-pharmacy/types/product-requests';

export type {
  PharmacyProductRequestDetails,
  PharmacyProductRequestRow,
  PharmacyProductRequestsQueryParams,
  PharmacyProductRequestsResponse,
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

  const name = getStringValue(rawFile.name);
  const size = getNumberValue(rawFile.size);

  if (!name || size === undefined) return null;

  return {
    name,
    type: getStringValue(rawFile.type) ?? 'application/octet-stream',
    size,
    ...(getStringValue(rawFile.dataUrl)
      ? { dataUrl: getStringValue(rawFile.dataUrl) }
      : {}),
  };
}

//===================================================================

function normalizeProductRequestHistoryEntry(
  rawEntry: unknown,
  index: number
): ProductRequestHistoryEntry | null {
  if (!isRecord(rawEntry)) return null;

  const createdAt = getStringValue(rawEntry.createdAt);
  const title = getStringValue(rawEntry.title);
  const description = getStringValue(rawEntry.description);

  if (!createdAt || !title || !description) return null;

  return {
    id:
      getStringValue(rawEntry.id) ??
      getStringValue(rawEntry._id) ??
      `history-${index}`,
    status: normalizeProductRequestStatus(rawEntry.status),
    title,
    description,
    createdAt,
  };
}

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

  const rawProduct = isRecord(rawRequest.product)
    ? rawRequest.product
    : undefined;

  const productId =
    getStringValue(rawRequest.productId) ??
    getStringValue(rawProduct?.id) ??
    getStringValue(rawProduct?._id) ??
    getStringValue(rawRequest.product);

  const productImageUrl =
    getStringValue(rawRequest.productImageUrl) ??
    getStringValue(rawRequest.imageUrl) ??
    getStringValue(rawProduct?.imageUrl);

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
    productImageUrl,
    productArticle,
    productName,
    category: isProductCategory(rawRequest.category)
      ? rawRequest.category
      : 'other',
    ...(getStringValue(rawRequest.customCategory)
      ? { customCategory: getStringValue(rawRequest.customCategory) }
      : {}),
    status: normalizeProductRequestStatus(rawRequest.status),
  };
}

//===================================================================

export function normalizePharmacyProductRequestDetails(
  rawRequest: unknown
): PharmacyProductRequestDetails | null {
  const request = normalizePharmacyProductRequest(rawRequest);
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
    updatedAt: getStringValue(rawRequest.updatedAt) ?? request.createdAt,
    name: getStringValue(rawRequest.name) ?? request.productName,
    article: getStringValue(rawRequest.article) ?? request.productArticle,
    ...(productImage ? { productImage } : {}),
    ...(getStringValue(rawRequest.manufacturer)
      ? { manufacturer: getStringValue(rawRequest.manufacturer) }
      : {}),
    ...(getStringValue(rawRequest.countryOfOrigin)
      ? { countryOfOrigin: getStringValue(rawRequest.countryOfOrigin) }
      : {}),
    ...(getStringValue(rawRequest.dosage)
      ? { dosage: getStringValue(rawRequest.dosage) }
      : {}),
    ...(getStringValue(rawRequest.packageSize)
      ? { packageSize: getStringValue(rawRequest.packageSize) }
      : {}),
    ...(getStringValue(rawRequest.form)
      ? { form: getStringValue(rawRequest.form) }
      : {}),
    ...(getStringValue(rawRequest.activeSubstance)
      ? { activeSubstance: getStringValue(rawRequest.activeSubstance) }
      : {}),
    ...(getStringValue(rawRequest.prescriptionType)
      ? { prescriptionType: getStringValue(rawRequest.prescriptionType) }
      : {}),
    ...(getStringValue(rawRequest.fullDescription)
      ? { fullDescription: getStringValue(rawRequest.fullDescription) }
      : {}),
    ...(getStringValue(rawRequest.pharmacyComment)
      ? { pharmacyComment: getStringValue(rawRequest.pharmacyComment) }
      : {}),
    ...(additionalFiles.length ? { additionalFiles } : {}),
    ...(getStringValue(rawRequest.rejectionReason)
      ? { rejectionReason: getStringValue(rawRequest.rejectionReason) }
      : {}),
    history,
    commentsTotal: getNumberValue(rawRequest.commentsTotal) ?? 0,
  };
}

//===================================================================

export function normalizePharmacyProductRequestsResponse(
  payload: unknown
): PharmacyProductRequestsResponse {
  const response = normalizePaginatedResponse(payload, {
    itemKeys: ['items', 'requests'],
    normalizeItem: normalizePharmacyProductRequest,
  });

  return {
    ...response,
    earliestCreatedAt: isRecord(payload)
      ? (getStringValue(payload.earliestCreatedAt) ?? null)
      : null,
  };
}
