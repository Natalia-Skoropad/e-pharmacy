import type { Types } from 'mongoose';

//===============================================================

export type ProductCategory =
  | 'medicine'
  | 'vitamins'
  | 'beauty'
  | 'hygiene'
  | 'medical-devices'
  | 'other';

//===============================================================

export type ProductReviewEntity = {
  userId?: Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  isModerated: boolean;
  moderatedAt?: Date;
  createdAt: Date;
};

//===============================================================

export type ProductOfferEntity = {
  storeId: Types.ObjectId;
  storeName: string;
  storeCity?: string;
  storeAddress?: string;
  storePhone?: string;
  storeImageUrl?: string;
  storeRating?: number;
  storeReviewsCount?: number;
  price: number;
  totalQuantity: number;
  activeQuantity: number;
  reservedQuantity: number;
  inStock: boolean;
};

//===============================================================

export type ProductEntity = {
  name: string;
  slug?: string;
  article: string;
  description?: string;
  category: ProductCategory;
  price?: number;
  imageUrl?: string;
  manufacturer?: string;
  dosage?: string;
  packageQuantity?: string;
  storeId?: Types.ObjectId;
  storeName?: string;
  offers: ProductOfferEntity[];
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
  reviews: ProductReviewEntity[];
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

export type ProductOfferResponseDto = {
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

//===============================================================

export type ProductResponseDto = {
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
  offers: ProductOfferResponseDto[];
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
  isFavorite?: boolean;
  updatedAt?: string;
};


//===============================================================

export type ProductFilterOptionDto<TValue extends string = string> = {
  value: TValue;
  label: string;
};

//===============================================================

export type ProductFilterOptionsResponseDto = {
  categories: ProductFilterOptionDto<'all' | ProductCategory>[];
  availability: ProductFilterOptionDto<'all' | 'in-stock' | 'out-of-stock'>[];
  sort: ProductFilterOptionDto<
    | 'price-asc'
    | 'price-desc'
    | 'rating-desc'
    | 'rating-asc'
    | 'name-asc'
    | 'name-desc'
    | 'newest'
  >[];
};

//===============================================================

export type ProductReviewResponseDto = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};
