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
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

//===============================================================

export type ProductEntity = {
  name: string;
  slug?: string;
  description?: string;
  category: ProductCategory;
  price: number;
  imageUrl?: string;
  manufacturer?: string;
  dosage?: string;
  packageQuantity?: string;
  storeId: Types.ObjectId;
  storeName?: string;
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
  reviews: ProductReviewEntity[];
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

export type ProductResponseDto = {
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

//===============================================================

export type ProductReviewResponseDto = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};
