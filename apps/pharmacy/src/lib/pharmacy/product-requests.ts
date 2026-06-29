import type { EntityId, ProductCategory } from '@e-pharmacy/types';

//===================================================================

export type ProductRequestStatus =
  | 'draft'
  | 'new'
  | 'in_progress'
  | 'approved'
  | 'rejected';

export type PharmacyProductRequestRow = Readonly<{
  id: EntityId;
  createdAt: string;
  article: string;
  name: string;
  category: ProductCategory;
  status: ProductRequestStatus;
}>;

export type PharmacyProductRequestsQueryParams = Readonly<{
  page?: number;
  perPage?: number;
  dateFrom?: string;
  dateTo?: string;
  name?: string;
  article?: string;
  category?: ProductCategory;
  status?: ProductRequestStatus;
}>;

export type PharmacyProductRequestsResponse = Readonly<{
  items: PharmacyProductRequestRow[];
  total: number;
}>;

//===================================================================

export const PRODUCT_REQUEST_CATEGORY_LABELS: Record<ProductCategory, string> = {
  medicine: 'Medicine',
  vitamins: 'Vitamins',
  beauty: 'Beauty',
  hygiene: 'Hygiene',
  medical_devices: 'Medical devices',
  other: 'Other',
};

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

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function getNumberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

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

function isProductRequestStatus(value: unknown): value is ProductRequestStatus {
  return (
    value === 'draft' ||
    value === 'new' ||
    value === 'in_progress' ||
    value === 'approved' ||
    value === 'rejected'
  );
}

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

  return {
    id,
    createdAt,
    article: getStringValue(rawRequest.article) ?? '—',
    name: getStringValue(rawRequest.name) ?? 'Unnamed request',
    category: isProductCategory(rawRequest.category) ? rawRequest.category : 'other',
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
