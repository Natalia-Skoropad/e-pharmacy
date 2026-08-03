import type { ApiPaginationResponse } from '../api';
import type { CalendarDateString, EntityId } from '../primitives';
import type { ProductCategory } from './category';
import type { ProductCardSummary } from './product-card-summary';
import type { ProductDetails } from './product-details';
import type { ProductStatus } from './product-summary';

//===================================================================

type ProductStockFilter = 'in-stock' | 'available' | 'empty' | 'reserved';

//===================================================================

export type ProductsSortOption =
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc'
  | 'rating-asc'
  | 'name-asc'
  | 'name-desc'
  | 'newest';

//===================================================================

type BaseProductsQueryParams = Readonly<{
  page?: number;
  perPage?: number;
  keyword?: string;
  nameKeyword?: string;
  articleKeyword?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductsSortOption;
}>;

//===================================================================

export type CatalogProductsQueryParams = BaseProductsQueryParams &
  Readonly<{
    pharmacyId?: EntityId;
    inStock?: boolean;
  }>;

//===================================================================

export type PharmacyProductsQueryParams = BaseProductsQueryParams &
  Readonly<{
    pharmacyId?: EntityId;
    status?: Extract<ProductStatus, 'active' | 'blocked'>;
    includeBlocked?: boolean;
    addedToPharmacyId?: EntityId;
    addedToMyPharmacy?: boolean;
    inStock?: boolean;
    stock?: ProductStockFilter;
    addedFrom?: CalendarDateString;
    addedTo?: CalendarDateString;
  }>;

//===================================================================

type ProductFilterOption<TValue extends string = string> = Readonly<{
  value: TValue;
  label: string;
}>;

//===================================================================

export type ProductFilterOptionsResponse = Readonly<{
  categories: readonly ProductFilterOption<'all' | ProductCategory>[];
  availability: readonly ProductFilterOption<
    'all' | 'in-stock' | 'out-of-stock'
  >[];
  sort: readonly ProductFilterOption<ProductsSortOption>[];
}>;

//===================================================================

export type ProductsResponse = Readonly<
  ApiPaginationResponse<ProductCardSummary> & {
    earliestCreatedAt: CalendarDateString | null;
  }
>;

export type ProductsWithOffersResponse = Readonly<
  ApiPaginationResponse<ProductDetails> & {
    earliestCreatedAt: CalendarDateString | null;
  }
>;

//===================================================================

export type ProductDetailsResponse = Readonly<{ product: ProductDetails }>;

//===================================================================

export type PharmacyProductMutationResponse = Readonly<
  ProductDetailsResponse & {
    message: string;
  }
>;

export type PendingProductReviewTarget = Readonly<{
  productId: EntityId;
  productName: string;
}>;
