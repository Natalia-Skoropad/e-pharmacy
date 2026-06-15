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

export type ReviewModerationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'reported'
  | 'hidden';

//===============================================================

export type ProductReviewEntity = {
  userId?: Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  status: ReviewModerationStatus;
  isModerated: boolean;
  moderationReason?: string;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  createdAt: Date;
};

//===============================================================

export type ProductOfferEntity = {
  pharmacyId: Types.ObjectId;
  pharmacyName: string;
  pharmacyCity?: string;
  pharmacyAddress?: string;
  pharmacyPhone?: string;
  pharmacyImageUrl?: string;
  pharmacyRating?: number;
  pharmacyReviewsCount?: number;
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
  pharmacyId?: Types.ObjectId;
  pharmacyName?: string;
  offers: ProductOfferEntity[];
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
  reviews: ProductReviewEntity[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

export type ProductOfferResponseDto = {
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
