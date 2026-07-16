import type { ApiPaginationResponse } from '../api';
import type { EntityId, ISODateString } from '../shared';
import type { ReviewModerationStatus } from '../reviews';
import type { ProductCategory } from './categories';

//=============================================================================

export type ProductStatus = 'new' | 'active' | 'blocked';

export type ProductStockFilter =
  | 'in-stock'
  | 'available'
  | 'empty'
  | 'reserved';

//=============================================================================

export type ProductOffer = {
  id: EntityId;
  pharmacyId: EntityId;
  pharmacyName: string;
  pharmacyCity?: string;
  pharmacyAddress?: string;
  pharmacyPhone?: string;
  pharmacyImageUrl?: string;
  pharmacyRating: number;
  pharmacyReviewsCount: number;
  pharmacyIsFavorite: boolean;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  inStock: boolean;
  hasRelatedOrders?: boolean;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
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
  availableInPharmaciesCount: number;
  offers: ProductOffer[];
  inStock: boolean;
  rating: number;
  reviewsCount: number;
  isFavorite: boolean;
  createdAt?: ISODateString;
  updatedAt: ISODateString;
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
  status?: Extract<ProductStatus, 'active' | 'blocked'>;
  includeBlocked?: boolean;
  pharmacyId?: EntityId;
  addedToPharmacyId?: EntityId;
  addedToMyPharmacy?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  stock?: ProductStockFilter;
  addedFrom?: ISODateString;
  addedTo?: ISODateString;
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

export type ProductsResponse = ApiPaginationResponse<Product> & {
  earliestCreatedAt: ISODateString | null;
};

export type ProductDetailsResponse = { product: Product };

export type AddProductToMyPharmacyResponse = ProductDetailsResponse & {
  message: string;
};

export type RemoveProductFromMyPharmacyResponse = ProductDetailsResponse & {
  message: string;
};

export type FavoriteProductIdsResponse = { ids: EntityId[] };

//=============================================================================

export type ProductReviewsResponse = {
  items: ProductReview[];
  total: number;
};

export type PendingProductReviewsQueryParams = {
  page?: number;
  perPage?: number;
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

export type FavoriteProductResponse = {
  isFavorite: boolean;
  message: string;
};

export type ModerateProductReviewResponse = {
  message: string;
  rating: number;
  reviewsCount: number;
  moderatedAt?: ISODateString;
};
