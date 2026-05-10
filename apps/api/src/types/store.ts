import type { Types } from 'mongoose';

//===============================================================

export type StoreReviewEntity = {
  userId?: Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  isModerated: boolean;
  moderatedAt?: Date;
  createdAt: Date;
};

//===============================================================

export type StoreEntity = {
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  rating?: number;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
  reviewsCount?: number;
  reviews?: StoreReviewEntity[];
  ownerId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

export type StoreResponseDto = {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  rating?: number;
  imageUrl?: string;
  description?: string;
  availableProductsCount: number;
  reviewsCount: number;
  isFavorite: boolean;
  isActive: boolean;
};


//===============================================================

export type StoreReviewResponseDto = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};
