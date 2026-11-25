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

//===============================================================

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
  ownerId: string;
  requestId: string;
  category: ProductRequestCategoryFilter;
  status: ProductRequestStatusFilter;
}>;

export type ProductRequestsQueryParams = Readonly<{
  page?: number;
  perPage?: number;
  dateFrom?: CalendarDateString;
  dateTo?: CalendarDateString;
  ownerId?: string;
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

export type ProductRequestRowViewModel = Readonly<{
  id: EntityId;
  owner?: Readonly<{ id: EntityId; name: string }>;
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
  ownerId: '',
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
    (categoryMode !== 'catalog' && categoryMode !== 'custom')
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

  if (!productName) return null;

  const owner = isRecord(rawRequest.owner) ? rawRequest.owner : undefined;
  const ownerId = getTrimmedString(owner?.id);
  const ownerName = getTrimmedString(owner?.name);

  return {
    id,

    ...(ownerId && /^[a-f0-9]{24}$/i.test(ownerId) && ownerName
      ? { owner: { id: ownerId, name: ownerName } }
      : {}),

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

//===============================================================

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
