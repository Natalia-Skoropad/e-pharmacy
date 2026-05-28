export type ProductCategory =
  | 'medicine'
  | 'vitamins'
  | 'beauty'
  | 'hygiene'
  | 'medical-devices'
  | 'other';

//===================================================================

export type ProductOffer = {
  storeId: string;
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

//===================================================================

export type Product = {
  id: string;
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
  storeId?: string;
  storeName?: string;
  foundInStoresCount: number;
  offers: ProductOffer[];
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
  isFavorite?: boolean;
  updatedAt?: string;
};

//===================================================================

export type ProductReview = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

//===================================================================

export type ProductsQueryParams = {
  page?: number;
  perPage?: number;
  keyword?: string;
  nameKeyword?: string;
  articleKeyword?: string;
  category?: ProductCategory;
  storeId?: string;
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

export type ProductsResponse = {
  items: Product[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

//===================================================================

export type ProductDetailsResponse = {
  product: Product;
};

//===================================================================

export type ProductReviewsResponse = {
  items: ProductReview[];
  total: number;
};

//===================================================================

export type CreateProductReviewPayload = {
  rating: number;
  comment: string;
};

//===================================================================

export type CreateProductReviewResponse = {
  message: string;
};

//===================================================================

export type ToggleFavoriteProductResponse = {
  isFavorite: boolean;
  message: string;
};
