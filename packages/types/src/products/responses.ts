import type { ApiPaginationResponse } from '../api';
import type { CalendarDateString, EntityId } from '../primitives';
import type { Review } from '../reviews';
import type { ProductCategory } from './category';
import type { ProductDetails } from './product-details';
import type { ProductStatus } from './product-summary';

//===================================================================

export type ProductStockFilter =
  | 'in-stock'
  | 'available'
  | 'empty'
  | 'reserved';

//===================================================================

export type ProductsQueryParams = {
  page?: number;
  perPage?: number;
  keyword?: string;
  nameKeyword?: string;
  articleKeyword?: string;
  category?: ProductCategory;
  status?: Extract<ProductStatus, 'active' | 'blocked'>;
  includeBlocked?: boolean;
  pharmacyId?: EntityId;
  addedToPharmacyId?: EntityId;
  addedToMyPharmacy?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  stock?: ProductStockFilter;
  addedFrom?: CalendarDateString;
  addedTo?: CalendarDateString;

  sort?:
    | 'price-asc'
    | 'price-desc'
    | 'rating-desc'
    | 'rating-asc'
    | 'name-asc'
    | 'name-desc'
    | 'newest';
};

//===================================================================

export type ProductFilterOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

//===================================================================

export type ProductFilterOptionsResponse = {
  categories: ProductFilterOption<'all' | ProductCategory>[];
  availability: ProductFilterOption<'all' | 'in-stock' | 'out-of-stock'>[];
  sort: ProductFilterOption<NonNullable<ProductsQueryParams['sort']>>[];
};

//===================================================================

export type ProductsResponse = ApiPaginationResponse<ProductDetails> & {
  earliestCreatedAt: CalendarDateString | null;
};

export type ProductDetailsResponse = { product: ProductDetails };

export type PharmacyProductMutationResponse = ProductDetailsResponse & {
  message: string;
};

export type ProductReviewsResponse = {
  items: Review[];
  total: number;
};

export type PendingProductReviewTarget = {
  productId: EntityId;
  productName: string;
};
