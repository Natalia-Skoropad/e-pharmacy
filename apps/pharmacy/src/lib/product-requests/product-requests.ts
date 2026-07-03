import type { EntityId, ProductCategory } from '@e-pharmacy/types';

//===================================================================

export type ProductRequestStatus =
  | 'draft'
  | 'new'
  | 'in_progress'
  | 'approved'
  | 'rejected';

//===================================================================

export type ProductRequestCategoryFilter = 'all' | ProductCategory;
export type ProductRequestStatusFilter = 'all' | ProductRequestStatus;

//===================================================================

export type ProductRequestsFilterState = Readonly<{
  date: {
    from: string;
    to: string;
  };
  requestNumber: string;
  productArticle: string;
  productName: string;
  category: ProductRequestCategoryFilter;
  status: ProductRequestStatusFilter;
}>;

//===================================================================

export const DEFAULT_PRODUCT_REQUESTS_FILTERS: ProductRequestsFilterState = {
  date: {
    from: '',
    to: '',
  },
  requestNumber: '',
  productArticle: '',
  productName: '',
  category: 'all',
  status: 'all',
};

//===================================================================

export type PharmacyProductRequestRow = Readonly<{
  id: EntityId;
  requestNumber: string;
  createdAt: string;
  productId?: EntityId;
  productArticle: string;
  productName: string;
  category: ProductCategory;
  status: ProductRequestStatus;
}>;

export type PharmacyProductRequestsQueryParams = Readonly<{
  page?: number;
  perPage?: number;
  dateFrom?: string;
  dateTo?: string;
  requestNumber?: string;
  productName?: string;
  productArticle?: string;
  category?: ProductCategory;
  status?: ProductRequestStatus;
}>;

export type PharmacyProductRequestsResponse = Readonly<{
  items: PharmacyProductRequestRow[];
  total: number;
}>;

//===================================================================

export const PRODUCT_REQUEST_CATEGORY_LABELS: Record<ProductCategory, string> =
  {
    medicine: 'Medicine',
    vitamins: 'Vitamins',
    beauty: 'Beauty',
    hygiene: 'Hygiene',
    medical_devices: 'Medical devices',
    other: 'Other',
  };

//===================================================================

export const PRODUCT_REQUEST_STATUS_LABELS: Record<
  ProductRequestStatus,
  string
> = {
  draft: 'Draft',
  new: 'New',
  in_progress: 'In work',
  approved: 'Approved',
  rejected: 'Rejected',
};

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

//===================================================================

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

//===================================================================

function getNumberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

//===================================================================

function isProductCategory(value: unknown): value is ProductCategory {
  return (
    value === 'medicine' ||
    value === 'vitamins' ||
    value === 'beauty' ||
    value === 'hygiene' ||
    value === 'medical_devices' ||
    value === 'other'
  );
}

//===================================================================

function isProductRequestStatus(value: unknown): value is ProductRequestStatus {
  return (
    value === 'draft' ||
    value === 'new' ||
    value === 'in_progress' ||
    value === 'approved' ||
    value === 'rejected'
  );
}

//===================================================================

function getProductRequestStatus(value: unknown): ProductRequestStatus {
  if (isProductRequestStatus(value)) return value;

  if (value === 'in_work' || value === 'on_moderation') {
    return 'in_progress';
  }

  return 'draft';
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
    status: getProductRequestStatus(rawRequest.status),
  };
}

//===================================================================

export function normalizePharmacyProductRequestsResponse(
  payload: unknown
): PharmacyProductRequestsResponse {
  if (!isRecord(payload)) return { items: [], total: 0 };

  const rawItems = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.requests)
      ? payload.requests
      : [];

  const items = rawItems.flatMap((item) => {
    const request = normalizePharmacyProductRequest(item);
    return request ? [request] : [];
  });

  return {
    items,
    total: getNumberValue(payload.total) ?? items.length,
  };
}
