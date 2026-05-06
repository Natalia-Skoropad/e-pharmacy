export type ProductCategory =
  | 'medicine'
  | 'vitamins'
  | 'beauty'
  | 'hygiene'
  | 'medical-devices'
  | 'other';

//===================================================================

export type Product = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  category: ProductCategory;
  price: number;
  imageUrl?: string;
  manufacturer?: string;
  dosage?: string;
  packageQuantity?: string;
  storeId: string;
  storeName?: string;
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
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
  category?: ProductCategory;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: 'price-asc' | 'price-desc' | 'rating-desc' | 'newest';
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
