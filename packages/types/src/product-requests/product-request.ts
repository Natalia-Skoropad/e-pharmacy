import type { ApiPaginationResponse } from '../api';
import type { EntityId } from '../shared';
import type { ProductCategory } from '../products/categories';

//=============================================================================

export const PRODUCT_REQUEST_STATUSES = [
  'draft',
  'new',
  'in_progress',
  'approved',
  'rejected',
] as const;

//=============================================================================

export const DEFAULT_PRODUCT_REQUEST_STATISTICS: ProductRequestStatisticsCounts =
  {
    draft: 0,
    new: 0,
    in_progress: 0,
    approved: 0,
    rejected: 0,
  };

//=============================================================================

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

//=============================================================================

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

//=============================================================================

export type ProductRequestStatus = (typeof PRODUCT_REQUEST_STATUSES)[number];

//=============================================================================

export type ProductRequestCategoryFilter = 'all' | ProductCategory;
export type ProductRequestStatusFilter = 'all' | ProductRequestStatus;

//=============================================================================

export type ProductRequestFile = Readonly<{
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
}>;

export type ProductRequestHistoryEntry = Readonly<{
  id: string;
  status: ProductRequestStatus;
  title: string;
  description: string;
  createdAt: string;
}>;

export type ProductRequestFormPayload = Readonly<{
  status: Extract<ProductRequestStatus, 'draft' | 'new'>;
  name: string;
  article: string;
  category: ProductCategory;
  customCategory?: string;
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
}>;

//=============================================================================

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

//=============================================================================

export type ProductRequestRow = Readonly<{
  id: EntityId;
  requestNumber: string;
  createdAt: string;
  productId?: EntityId;
  productImageUrl?: string;
  productArticle: string;
  productName: string;
  category: ProductCategory;
  customCategory?: string;
  status: ProductRequestStatus;
}>;

export type ProductRequestDetails = ProductRequestRow &
  Readonly<{
    updatedAt: string;
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
    history: ProductRequestHistoryEntry[];
    commentsTotal: number;
  }>;

export type ProductRequestsQueryParams = Readonly<{
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

export type ProductRequestsResponse = Readonly<
  ApiPaginationResponse<ProductRequestRow> & {
    earliestCreatedAt: string | null;
  }
>;

//=============================================================================

export type ProductRequestStatisticsCounts = Record<
  ProductRequestStatus,
  number
>;

//=============================================================================

export function isProductRequestStatus(
  value: unknown
): value is ProductRequestStatus {
  return PRODUCT_REQUEST_STATUSES.includes(value as ProductRequestStatus);
}

//=============================================================================

export function normalizeProductRequestStatus(
  value: unknown
): ProductRequestStatus {
  if (isProductRequestStatus(value)) return value;

  if (value === 'in_work' || value === 'on_moderation') {
    return 'in_progress';
  }

  return 'draft';
}
