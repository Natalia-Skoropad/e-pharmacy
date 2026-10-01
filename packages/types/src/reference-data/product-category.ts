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
 * Stored slugs use the reference-data contract; public URL formatting is a
 * separate presentation concern.
 */
export type ProductCategorySlug = string;

//===================================================================

export type ProductCategoryStatus = 'active' | 'hidden';
export type ProductCategoryKind = 'standard';

//===================================================================

/** Canonical persisted product-category contract. */
export type ProductCategoryEntity = Readonly<{
  id: EntityId;
  name: string;
  slug: ProductCategorySlug;
  status: ProductCategoryStatus;
  kind: ProductCategoryKind;
  sortOrder: number;
  color: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  createdBy: EntityId | null;
  updatedBy: EntityId | null;
}>;

/** Lightweight relation returned with products and product requests. */
export type ProductCategoryReference = Readonly<
  Pick<ProductCategoryEntity, 'id' | 'name' | 'slug'>
>;

/** Historical order snapshots may predate the persisted category id. */
export type ProductCategorySnapshot = Readonly<{
  id?: EntityId;
  name: string;
  slug: ProductCategorySlug;
}>;

//===================================================================

export type ProductCategoryUsage = Readonly<{
  productsCount: number;
  productRequestsCount: number;
  total: number;
}>;

export type ProductCategoryListItem = Readonly<
  Pick<
    ProductCategoryEntity,
    | 'id'
    | 'name'
    | 'slug'
    | 'status'
    | 'kind'
    | 'sortOrder'
    | 'color'
    | 'createdAt'
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
  color: string;
}>;

export type UpdateProductCategoryPayload = Readonly<{
  name: string;
  color: string;
}>;

export type ProductCategoryResponse = Readonly<{
  category: ProductCategoryEntity;
}>;
