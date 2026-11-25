import {
  normalizePaginatedResponse,
  requirePaginatedResponse,
} from '@e-pharmacy/api-client/response';

import { ApiError } from '@e-pharmacy/api-client/transport';
import { PRODUCT_REQUEST_STATUSES } from '@e-pharmacy/config/product-requests';
import type { ApiPaginationResponse } from '@e-pharmacy/types/api';

import type {
  CalendarDateString,
  EntityId,
  ISODateTimeString,
} from '@e-pharmacy/types/primitives';

import type {
  ProductCategoryReference,
  ProductCategorySlug,
} from '@e-pharmacy/types/reference-data';

import type {
  ProductRequestCategoryMode,
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

function invalidProductRequestContract(
  message: string,
  payload: unknown
): never {
  throw new ApiError(message, {
    transportCode: 'INVALID_RESPONSE',
    payload,
  });
}

//===================================================================

function parseEarliestCreatedAt(payload: unknown): CalendarDateString | null {
  if (!isRecord(payload)) {
    invalidProductRequestContract(
      'product requests response must be an object.',
      payload
    );
  }

  if (payload.earliestCreatedAt === null) return null;

  if (!isCalendarDateString(payload.earliestCreatedAt)) {
    invalidProductRequestContract(
      'product requests response.earliestCreatedAt must be a calendar date or null.',
      payload
    );
  }

  return payload.earliestCreatedAt;
}

//===================================================================

export const CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER = '__custom__' as const;

export type ProductRequestCategoryFilter =
  | 'all'
  | ProductCategorySlug
  | typeof CUSTOM_PRODUCT_REQUEST_CATEGORY_FILTER;

export type ProductRequestStatusFilter = 'all' | ProductRequestStatus;

//===================================================================

export type ProductRequestsFilterState = Readonly<{
  date: { from: string; to: string };
  requestId: string;
  category: ProductRequestCategoryFilter;
  status: ProductRequestStatusFilter;
}>;

export type ProductRequestsQueryParams = Readonly<{
  page?: number;
  perPage?: number;
  dateFrom?: CalendarDateString;
  dateTo?: CalendarDateString;
  requestId?: string;
  productId?: string;
  linkedOnly?: boolean;
  keyword?: string;
  requestNumber?: string;
  productName?: string;
  productArticle?: string;
  category?: ProductCategorySlug;
  categoryMode?: ProductRequestCategoryMode;
  status?: ProductRequestStatus;
}>;

export type ProductRequestHistoryViewModel = Readonly<{
  id: EntityId;
  status: ProductRequestStatus;
  title: string;
  description: string;
  createdAt: ISODateTimeString;
  isInferred: boolean;
  actorName?: string;
  actorNameSource?: 'current_owner';
}>;

export type ProductRequestRowViewModel = Readonly<{
  id: EntityId;
  requestNumber: string;
  createdAt: ISODateTimeString;
  productId?: EntityId;
  productImageUrl?: string;
  productArticle: string;
  productName: string;
  categoryMode: ProductRequestCategoryMode;
  category?: ProductCategoryReference;
  customCategory?: string;
  status: ProductRequestStatus;
  cancelledBy?: 'owner' | 'admin';
  reviewState?: 'changes_requested';
}>;

export type ProductRequestDetailsViewModel = ProductRequestRowViewModel &
  Readonly<{
    updatedAt: ISODateTimeString;
    name: string;
    article: string;
    productImage?: ProductRequestFile;
    brand?: string;
    series?: string;
    manufacturer?: string;
    releaseForm?: string;
    activeIngredients?: string;
    activeIngredientCount?: string;
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

export function normalizeProductRequestStatisticsResponse(
  value: unknown
): ProductRequestStatisticsCounts {
  if (!isRecord(value)) {
    invalidProductRequestContract(
      'product request statistics response must be an object.',
      value
    );
  }

  const statistics = { ...DEFAULT_PRODUCT_REQUEST_STATISTICS };

  for (const status of PRODUCT_REQUEST_STATUSES) {
    const count = getFiniteNumber(value[status]);

    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
      invalidProductRequestContract(
        `product request statistics response.${status} must be a non-negative integer.`,
        value
      );
    }

    statistics[status] = count;
  }

  return statistics;
}

//===================================================================

export const DEFAULT_PRODUCT_REQUESTS_FILTERS: ProductRequestsFilterState = {
  date: { from: '', to: '' },
  requestId: '',
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
  if (value === 'draft') return { success: true, value: 'new', legacy: true };
  if (isProductRequestStatus(value)) {
    return { success: true, value, legacy: false };
  }

  if (value === 'in_work' || value === 'in_progress') {
    return { success: true, value: 'on_moderation', legacy: true };
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
  const documentId = getTrimmedString(rawFile.documentId);

  return {
    name,
    type,
    size,

    ...(dataUrl ? { dataUrl } : {}),
    ...(documentId && /^[a-f\d]{24}$/i.test(documentId) ? { documentId } : {}),
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
  const isInferred = rawEntry.isInferred;

  if (
    !id ||
    !createdAt ||
    !title ||
    !description ||
    !status.success ||
    typeof isInferred !== 'boolean'
  ) {
    return null;
  }

  const actorName = !isInferred
    ? getTrimmedString(rawEntry.actorName)
    : undefined;

  return {
    id,
    status: status.value,
    title,
    description,
    createdAt,
    isInferred,

    ...(actorName ? { actorName } : {}),

    ...(actorName && rawEntry.actorNameSource === 'current_owner'
      ? { actorNameSource: 'current_owner' as const }
      : {}),
  };
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

  const categoryMode = rawRequest.categoryMode;
  const category = rawRequest.category;
  const customCategory = getTrimmedString(rawRequest.customCategory);

  if (
    !id ||
    !createdAt ||
    !status.success ||
    (categoryMode !== 'catalog' && categoryMode !== 'custom') ||
    (status.value !== 'new' &&
      categoryMode === 'catalog' &&
      !isProductCategory(category)) ||
    (status.value !== 'new' && categoryMode === 'custom' && !customCategory)
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

  if (!productName || (status.value !== 'new' && !productArticle)) return null;

  return {
    id,
    requestNumber: getTrimmedString(rawRequest.requestNumber) ?? id,
    createdAt,

    ...(productId ? { productId } : {}),
    ...(productImageUrl ? { productImageUrl } : {}),

    productArticle: productArticle ?? '',
    productName,
    categoryMode,

    ...(isProductCategory(category) ? { category } : {}),
    ...(categoryMode === 'custom' && customCategory ? { customCategory } : {}),

    status: status.value,

    ...(rawRequest.reviewState === 'changes_requested'
      ? { reviewState: 'changes_requested' as const }
      : {}),

    ...(status.value === 'rejected' &&
    (rawRequest.cancelledBy === 'owner' || rawRequest.cancelledBy === 'admin')
      ? { cancelledBy: rawRequest.cancelledBy }
      : {}),
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

  if (!updatedAt || !name || (request.status !== 'new' && !article)) {
    return null;
  }

  const productImage = normalizeProductRequestFile(rawRequest.productImage);

  const additionalFiles = Array.isArray(rawRequest.additionalFiles)
    ? rawRequest.additionalFiles
        .map(normalizeProductRequestFile)
        .filter((file): file is ProductRequestFile => Boolean(file))
    : [];

  const rawHistory = Array.isArray(rawRequest.history)
    ? rawRequest.history
    : [];

  const history = rawHistory
    .map(normalizeProductRequestHistoryEntry)
    .filter((entry): entry is ProductRequestHistoryViewModel => Boolean(entry));

  if (history.length !== rawHistory.length) return null;

  const optionalString = (key: string): string | undefined =>
    getTrimmedString(rawRequest[key]);

  return {
    ...request,

    updatedAt,
    name,
    article: article ?? '',

    ...(productImage ? { productImage } : {}),
    ...(optionalString('brand') ? { brand: optionalString('brand') } : {}),
    ...(optionalString('series') ? { series: optionalString('series') } : {}),

    ...(optionalString('releaseForm')
      ? { releaseForm: optionalString('releaseForm') }
      : {}),

    ...(optionalString('activeIngredients')
      ? { activeIngredients: optionalString('activeIngredients') }
      : {}),

    ...(optionalString('activeIngredientCount')
      ? { activeIngredientCount: optionalString('activeIngredientCount') }
      : {}),

    ...(optionalString('manufacturer')
      ? { manufacturer: optionalString('manufacturer') }
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

  return {
    ...response,
    earliestCreatedAt: parseEarliestCreatedAt(payload),
  };
}

//===================================================================

// A mutation response may be lost after the server commits. Only treat a
// fresh authorized read as confirmation if it contains a new matching event.
export function confirmsProductRequestTransition(
  previous: ProductRequestDetailsViewModel,
  fresh: ProductRequestDetailsViewModel,
  transition: 'submit' | 'cancel'
): boolean {
  if (previous.id !== fresh.id) return false;

  const previousEligible =
    transition === 'submit'
      ? previous.status === 'new' ||
        (previous.status === 'on_moderation' &&
          previous.reviewState === 'changes_requested')
      : previous.status === 'on_moderation' &&
        previous.reviewState === 'changes_requested';

  if (!previousEligible) return false;

  const previousIds = new Set(previous.history.map((entry) => entry.id));
  const status = transition === 'submit' ? 'on_moderation' : 'rejected';

  const title =
    transition === 'submit' ? 'Sent for moderation' : 'Cancelled by owner';

  return (
    fresh.status === status &&
    !fresh.reviewState &&
    (transition !== 'cancel' || fresh.cancelledBy === 'owner') &&
    fresh.history.some(
      (entry) =>
        !entry.isInferred &&
        !previousIds.has(entry.id) &&
        entry.status === status &&
        entry.title === title
    )
  );
}
