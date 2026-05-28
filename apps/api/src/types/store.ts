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

export type StoreBankDetails = {
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  paymentPurpose: string;
};

//===============================================================

export type StoreEntity = {
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails: StoreBankDetails;
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

export type StoreFilterOptionDto<TValue extends string = string> = {
  value: TValue;
  label: string;
};

//===============================================================

export type StoreFilterOptionsResponseDto = {
  cities: StoreFilterOptionDto[];
  sort: StoreFilterOptionDto<
    'newest' | 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc'
  >[];
};

//===============================================================

export type StoreResponseDto = {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails: StoreBankDetails;
  rating?: number;
  imageUrl?: string;
  description?: string;
  availableProductsCount: number;
  reviewsCount: number;
  isFavorite: boolean;
  isActive: boolean;
  updatedAt?: string;
};


//===============================================================

export type StoreReviewResponseDto = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};
