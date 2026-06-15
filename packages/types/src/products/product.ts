import type { ApiPaginationResponse } from '../api';
import type { EntityId, ISODateString } from '../shared';
import type { ReviewModerationStatus } from '../reviews';

//=============================================================================

export type ProductStatus = 'new' | 'active' | 'blocked';

export type ProductCategory =
  | 'medicine'
  | 'vitamins'
  | 'beauty'
  | 'hygiene'
  | 'medical-devices'
  | 'other';

//=============================================================================

export type ProductOffer = {
  id: EntityId;
  pharmacyId: EntityId;
  pharmacyName: string;
  pharmacyCity?: string;
  pharmacyAddress?: string;
  pharmacyPhone?: string;
  pharmacyImageUrl?: string;
  pharmacyRating?: number;
  pharmacyReviewsCount?: number;
  pharmacyIsFavorite?: boolean;
  price: number;
  totalQuantity: number;
  activeQuantity: number;
  reservedQuantity: number;
  inStock: boolean;
};

export type Product = {
  id: EntityId;
  name: string;
  slug?: string;
  article: string;
  description?: string;
  category: ProductCategory;
  status: ProductStatus;
  price: number;
  imageUrl?: string;
  manufacturer?: string;
  dosage?: string;
  packageQuantity?: string;
  pharmacyId?: EntityId;
  pharmacyName?: string;
  foundInPharmaciesCount: number;
  offers: ProductOffer[];
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
  isFavorite?: boolean;
  updatedAt?: ISODateString;
};

export type ProductReview = {
  id: EntityId;
  userName: string;
  rating: number;
  comment: string;
  createdAt: ISODateString;
};

export type PendingProductReview = {
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
  pharmacyId?: EntityId;
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

export type ProductsResponse = ApiPaginationResponse<Product>;
export type ProductDetailsResponse = { product: Product };

//=============================================================================

export type ProductReviewsResponse = {
  items: ProductReview[];
  total: number;
};

export type PendingProductReviewsResponse = {
  items: PendingProductReview[];
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
