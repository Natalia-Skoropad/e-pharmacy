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

export type ProductStatus = 'new' | 'active' | 'blocked';
export type ReviewModerationStatus = 'on_moderation' | 'approved' | 'rejected';

//===============================================================

export type ProductEntity = {
  name: string;
  slug?: string;
  article: string;
  description?: string;
  category: ProductCategory;
  status: ProductStatus;
  price?: number;
  imageUrl?: string;
  manufacturer?: string;
  dosage?: string;
  packageQuantity?: string;
  pharmacyId?: Types.ObjectId;
  pharmacyName?: string;
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductOfferEntity = {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  pharmacyId: Types.ObjectId;
  price: number;
  totalQuantity: number;
  activeQuantity: number;
  reservedQuantity: number;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductOfferResponseDto = {
  id: string;
  pharmacyId: string;
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

export type ProductResponseDto = {
  id: string;
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
  pharmacyId?: string;
  pharmacyName?: string;
  foundInPharmaciesCount: number;
  offers: ProductOfferResponseDto[];
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
  isFavorite?: boolean;
  updatedAt?: string;
};

export type ProductFilterOptionDto<TValue extends string = string> = {
  value: TValue;
  label: string;
};

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

export type ProductReviewResponseDto = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};
