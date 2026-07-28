import {
  normalizePaginatedResponse,
  requirePaginatedResponse,
} from '@e-pharmacy/api-client/response';

import { PRODUCT_REQUEST_STATUSES } from '@e-pharmacy/config/product-requests';
import type { ApiPaginationResponse } from '@e-pharmacy/types/api';

import type {
  CalendarDateString,
  EntityId,
  ISODateTimeString,
} from '@e-pharmacy/types/primitives';

import type { ProductCategory } from '@e-pharmacy/types/products';

import type {
  ProductRequestFile,
  ProductRequestStatus,
} from '@e-pharmacy/types/product-requests';

import {
  isCalendarDateString,
  isISODateTimeString,
} from '@e-pharmacy/validation/dates';

import { isProductCategory } from '@e-pharmacy/validation/products';
import { isProductRequestStatus } from '@e-pharmacy/validation/product-requests';
import { isRecord } from '@e-pharmacy/utils/guards';
import { getFiniteNumber } from '@e-pharmacy/utils/numbers';
import { getTrimmedString } from '@e-pharmacy/utils/strings';

//===================================================================

export type ProductRequestCategoryFilter = 'all' | ProductCategory;
export type ProductRequestStatusFilter = 'all' | ProductRequestStatus;

//===================================================================

export type ProductRequestsFilterState = Readonly<{
  date: { from: string; to: string };
  requestNumber: string;
  productArticle: string;
  productName: string;
  category: ProductRequestCategoryFilter;
  status: ProductRequestStatusFilter;
}>;

export type ProductRequestsQueryParams = Readonly<{
  page?: number;
  perPage?: number;
  dateFrom?: CalendarDateString;
  dateTo?: CalendarDateString;
  requestNumber?: string;
  productName?: string;
  productArticle?: string;
  category?: ProductCategory;
  status?: ProductRequestStatus;
}>;

export type ProductRequestHistoryViewModel = Readonly<{
  id: EntityId;
  status: ProductRequestStatus;
  title: string;
  description: string;
  createdAt: ISODateTimeString;
}>;

export type ProductRequestRowViewModel = Readonly<{
  id: EntityId;
  requestNumber: string;
  createdAt: ISODateTimeString;
  productId?: EntityId;
  productImageUrl?: string;
  productArticle: string;
  productName: string;
  category: ProductCategory;
  customCategory?: string;
  status: ProductRequestStatus;
}>;

export type ProductRequestDetailsViewModel = ProductRequestRowViewModel &
  Readonly<{
    updatedAt: ISODateTimeString;
    name: string;
    article: string;
    productImage?: ProductRequestFile;
    manufacturer?: string;
    countryOfOrigin?: string;
    dosage?: string;
    packageSize?: string;
    form?: string;
    activeSubstance?: string;
    prescriptionType?: string;
    fullDescription?: string;
    pharmacyComment?: string;
    additionalFiles?: ProductRequestFile[];
    rejectionReason?: string;
    history: ProductRequestHistoryViewModel[];
    commentsTotal: number;
  }>;

//===================================================================

export type ProductRequestsViewModelResponse = Readonly<
  ApiPaginationResponse<ProductRequestRowViewModel> & {
    earliestCreatedAt: CalendarDateString | null;
  }
>;

export type ProductRequestStatisticsCounts = Record<
  ProductRequestStatus,
  number
>;

//===================================================================

export const DEFAULT_PRODUCT_REQUEST_STATISTICS: ProductRequestStatisticsCounts =
  Object.fromEntries(
    PRODUCT_REQUEST_STATUSES.map((status) => [status, 0])
  ) as ProductRequestStatisticsCounts;

//===================================================================

export const DEFAULT_PRODUCT_REQUESTS_FILTERS: ProductRequestsFilterState = {
  date: { from: '', to: '' },
  requestNumber: '',
  productArticle: '',
  productName: '',
  category: 'all',
  status: 'all',
};

//===================================================================

export type ProductRequestStatusNormalizationResult =
  | Readonly<{ success: true; value: ProductRequestStatus; legacy: boolean }>
  | Readonly<{
      success: false;
      issue: 'unknown-status';
      value: unknown;
    }>;

//===================================================================

export function normalizeProductRequestStatus(
  value: unknown
): ProductRequestStatusNormalizationResult {
  if (isProductRequestStatus(value)) {
    return { success: true, value, legacy: false };
  }

  if (value === 'in_work' || value === 'on_moderation') {
    return { success: true, value: 'in_progress', legacy: true };
  }

  return { success: false, issue: 'unknown-status', value };
}

//===================================================================

function normalizeDateTime(value: unknown): ISODateTimeString | null {
  const raw = getTrimmedString(value);
  if (!raw) return null;

  if (isISODateTimeString(raw)) return raw;

  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) return null;

  const normalized = new Date(timestamp).toISOString();
  return isISODateTimeString(normalized) ? normalized : null;
}

//===================================================================

function normalizeProductRequestFile(
  rawFile: unknown
): ProductRequestFile | null {
  if (!isRecord(rawFile)) return null;

  const name = getTrimmedString(rawFile.name);
  const size = getFiniteNumber(rawFile.size);
  const type =
    getTrimmedString(rawFile.type) ?? getTrimmedString(rawFile.mimeType);

  if (!name || size === undefined || !type) return null;

  const dataUrl = getTrimmedString(rawFile.dataUrl);

  return {
    name,
    type,
    size,
    ...(dataUrl ? { dataUrl } : {}),
  };
}

//===================================================================

function normalizeProductRequestHistoryEntry(
  rawEntry: unknown
): ProductRequestHistoryViewModel | null {
  if (!isRecord(rawEntry)) return null;

  const id = getTrimmedString(rawEntry.id) ?? getTrimmedString(rawEntry._id);
  const createdAt = normalizeDateTime(rawEntry.createdAt);
  const title = getTrimmedString(rawEntry.title);
  const description = getTrimmedString(rawEntry.description);
  const status = normalizeProductRequestStatus(rawEntry.status);

  if (!id || !createdAt || !title || !description || !status.success) {
    return null;
  }

  return { id, status: status.value, title, description, createdAt };
}

//===================================================================

export function normalizeProductRequest(
  rawRequest: unknown
): ProductRequestRowViewModel | null {
  if (!isRecord(rawRequest)) return null;

  const id =
    getTrimmedString(rawRequest.id) ?? getTrimmedString(rawRequest._id);
  const createdAt =
    normalizeDateTime(rawRequest.createdAt) ??
    normalizeDateTime(rawRequest.createdDate) ??
    normalizeDateTime(rawRequest.updatedAt);
  const status = normalizeProductRequestStatus(rawRequest.status);

  if (
    !id ||
    !createdAt ||
    !status.success ||
    !isProductCategory(rawRequest.category)
  ) {
    return null;
  }

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
    getTrimmedString(rawRequest.article);

  const productName =
    getTrimmedString(rawRequest.productName) ??
    getTrimmedString(rawRequest.name);

  if (!productArticle || !productName) return null;

  const customCategory = getTrimmedString(rawRequest.customCategory);

  return {
    id,
    requestNumber: getTrimmedString(rawRequest.requestNumber) ?? id,
    createdAt,
    ...(productId ? { productId } : {}),
    ...(productImageUrl ? { productImageUrl } : {}),
    productArticle,
    productName,
    category: rawRequest.category,
    ...(customCategory ? { customCategory } : {}),
    status: status.value,
  };
}

//===================================================================

export function normalizeProductRequestDetails(
  rawRequest: unknown
): ProductRequestDetailsViewModel | null {
  const request = normalizeProductRequest(rawRequest);
  if (!request || !isRecord(rawRequest)) return null;

  const updatedAt = normalizeDateTime(rawRequest.updatedAt);
  const name = getTrimmedString(rawRequest.name);
  const article = getTrimmedString(rawRequest.article);

  if (!updatedAt || !name || !article) return null;

  const productImage = normalizeProductRequestFile(rawRequest.productImage);

  const additionalFiles = Array.isArray(rawRequest.additionalFiles)
    ? rawRequest.additionalFiles
        .map(normalizeProductRequestFile)
        .filter((file): file is ProductRequestFile => Boolean(file))
    : [];

  const history = Array.isArray(rawRequest.history)
    ? rawRequest.history
        .map(normalizeProductRequestHistoryEntry)
        .filter((entry): entry is ProductRequestHistoryViewModel =>
          Boolean(entry)
        )
    : [];

  const optionalString = (key: string): string | undefined =>
    getTrimmedString(rawRequest[key]);

  return {
    ...request,
    updatedAt,
    name,
    article,
    ...(productImage ? { productImage } : {}),
    ...(optionalString('manufacturer')
      ? { manufacturer: optionalString('manufacturer') }
      : {}),
    ...(optionalString('countryOfOrigin')
      ? { countryOfOrigin: optionalString('countryOfOrigin') }
      : {}),
    ...(optionalString('dosage') ? { dosage: optionalString('dosage') } : {}),
    ...(optionalString('packageSize')
      ? { packageSize: optionalString('packageSize') }
      : {}),
    ...(optionalString('form') ? { form: optionalString('form') } : {}),
    ...(optionalString('activeSubstance')
      ? { activeSubstance: optionalString('activeSubstance') }
      : {}),
    ...(optionalString('prescriptionType')
      ? { prescriptionType: optionalString('prescriptionType') }
      : {}),
    ...(optionalString('fullDescription')
      ? { fullDescription: optionalString('fullDescription') }
      : {}),
    ...(optionalString('pharmacyComment')
      ? { pharmacyComment: optionalString('pharmacyComment') }
      : {}),
    ...(additionalFiles.length ? { additionalFiles } : {}),
    ...(optionalString('rejectionReason')
      ? { rejectionReason: optionalString('rejectionReason') }
      : {}),
    history,
    commentsTotal: getFiniteNumber(rawRequest.commentsTotal) ?? 0,
  };
}

//===================================================================

export function normalizeProductRequestsResponse(
  payload: unknown
): ProductRequestsViewModelResponse {
  const response = requirePaginatedResponse(
    normalizePaginatedResponse(payload, {
      legacyItemKeys: ['requests'],
      normalizeItem: normalizeProductRequest,
    }),
    { label: 'product requests response' }
  );
  const earliestCreatedAt = isRecord(payload)
    ? getTrimmedString(payload.earliestCreatedAt)
    : undefined;

  return {
    ...response,
    earliestCreatedAt:
      earliestCreatedAt && isCalendarDateString(earliestCreatedAt)
        ? earliestCreatedAt
        : null,
  };
}
