import type { ApiPaginationResponse } from '../api';
import type { EntityId, ISODateString } from '../shared';
import type { ReviewModerationStatus } from '../reviews';

//=============================================================================

export type ProductCategory =
  | 'medicine'
  | 'vitamins'
  | 'beauty'
  | 'hygiene'
  | 'medical-devices'
  | 'other';

//=============================================================================

export type ProductOfferDto = {
  storeId: EntityId;
  storeName: string;
  storeCity?: string;
  storeAddress?: string;
  storePhone?: string;
  storeImageUrl?: string;
  storeRating?: number;
  storeReviewsCount?: number;
  storeIsFavorite?: boolean;
  price: number;
  totalQuantity: number;
  activeQuantity: number;
  reservedQuantity: number;
  inStock: boolean;
};

export type ProductDto = {
  id: EntityId;
  name: string;
  slug?: string;
  article: string;
  description?: string;
  category: ProductCategory;
  price: number;
  imageUrl?: string;
  manufacturer?: string;
  dosage?: string;
  packageQuantity?: string;
  storeId?: EntityId;
  storeName?: string;
  foundInStoresCount: number;
  offers: ProductOfferDto[];
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
  isFavorite?: boolean;
  updatedAt?: ISODateString;
};

export type ProductReviewDto = {
  id: EntityId;
  userName: string;
  rating: number;
  comment: string;
  createdAt: ISODateString;
};

export type PendingProductReviewDto = {
  productId: EntityId;
  productName: string;
  reviewId: EntityId;
  userName: string;
  rating: number;
  comment: string;
  status: ReviewModerationStatus;
  createdAt: ISODateString;
};

export type ModerateProductReviewPayload = {
  status: Extract<ReviewModerationStatus, 'approved' | 'rejected'>;
  reason?: string;
};

export type ProductsQueryParams = {
  page?: number;
  perPage?: number;
  keyword?: string;
  nameKeyword?: string;
  articleKeyword?: string;
  category?: ProductCategory;
  storeId?: EntityId;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?:
    | 'price-asc'
    | 'price-desc'
    | 'rating-desc'
    | 'rating-asc'
    | 'name-asc'
    | 'name-desc'
    | 'newest';
};

//=============================================================================

export type ProductFilterOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export type ProductFilterOptionsResponse = {
  categories: ProductFilterOption<'all' | ProductCategory>[];
  availability: ProductFilterOption<'all' | 'in-stock' | 'out-of-stock'>[];
  sort: ProductFilterOption<NonNullable<ProductsQueryParams['sort']>>[];
};

//=============================================================================

export type ProductsResponse = ApiPaginationResponse<ProductDto>;
export type ProductDetailsResponse = { product: ProductDto };

//=============================================================================

export type ProductReviewsResponse = {
  items: ProductReviewDto[];
  total: number;
};

export type PendingProductReviewsResponse = {
  items: PendingProductReviewDto[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type CreateProductReviewPayload = { rating: number; comment: string };
export type CreateProductReviewResponse = { message: string };

//=============================================================================

export type ToggleFavoriteProductResponse = {
  isFavorite: boolean;
  message: string;
};

export type Product = ProductDto;
export type ProductOffer = ProductOfferDto;
export type ProductReview = ProductReviewDto;
