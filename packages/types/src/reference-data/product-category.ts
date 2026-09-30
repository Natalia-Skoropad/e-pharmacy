import type { ApiPaginationResponse } from '../api';

import type {
  CalendarDateString,
  EntityId,
  ISODateTimeString,
} from '../primitives';

import type { ReferenceDataListQueryParams } from './common';

//===================================================================

/**
 * Persistence slug for a dynamic product category.
 *
 * Stage 11 keeps the existing snake_case category keys compatible with the
 * migration path. Public URL formatting is a separate presentation concern.
 */
export type ProductCategorySlug = string;

export type ProductCategoryStatus = 'active' | 'hidden';
export type ProductCategoryKind = 'standard' | 'custom_fallback';

//===================================================================

/** Canonical persisted category contract introduced by Stage 11. */
export type ProductCategoryEntity = Readonly<{
  id: EntityId;
  name: string;
  slug: ProductCategorySlug;
  status: ProductCategoryStatus;
  kind: ProductCategoryKind;
  sortOrder: number;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  createdBy: EntityId;
  updatedBy: EntityId;
}>;

/** Lightweight relation returned with products and product requests later. */
export type ProductCategoryReference = Readonly<
  Pick<ProductCategoryEntity, 'id' | 'name' | 'slug'>
>;

//===================================================================

export type ProductCategoryUsage = Readonly<{
  productsCount: number;
  productRequestsCount: number;
  total: number;
}>;

export type ProductCategoryListItem = Readonly<
  Pick<
    ProductCategoryEntity,
    'id' | 'name' | 'slug' | 'status' | 'kind' | 'sortOrder' | 'createdAt'
  > & {
    usage: ProductCategoryUsage;
  }
>;

export type ProductCategoryListQueryParams = ReferenceDataListQueryParams;

export type ProductCategoryListResponse = Readonly<
  ApiPaginationResponse<ProductCategoryListItem> & {
    earliestCreatedAt: CalendarDateString | null;
  }
>;

//===================================================================

export type CreateProductCategoryPayload = Readonly<{
  name: string;
}>;

export type UpdateProductCategoryPayload = Readonly<{
  name: string;
}>;

export type ProductCategoryResponse = Readonly<{
  category: ProductCategoryEntity;
}>;
