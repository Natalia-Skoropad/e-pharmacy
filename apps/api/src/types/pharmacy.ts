import type { Types } from 'mongoose';

import type { PHARMACY_STATUSES } from '../constants/auth';

//===============================================================

export type PharmacyStatus = (typeof PHARMACY_STATUSES)[keyof typeof PHARMACY_STATUSES];

//===============================================================

export type ReviewModerationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'reported'
  | 'hidden';

//===============================================================

export type PharmacyReviewEntity = {
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

export type PharmacyBankDetails = {
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  paymentPurpose: string;
};

//===============================================================

export type PharmacyEntity = {
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: PharmacyBankDetails;
  status: PharmacyStatus;
  rating?: number;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
  reviewsCount?: number;
  reviews?: PharmacyReviewEntity[];
  ownerId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

export type PharmacyFilterOptionDto<TValue extends string = string> = {
  value: TValue;
  label: string;
};

//===============================================================

export type PharmacyFilterOptionsResponseDto = {
  cities: PharmacyFilterOptionDto[];
  sort: PharmacyFilterOptionDto<
    'newest' | 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc'
  >[];
};

//===============================================================

export type PharmacyResponseDto = {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: PharmacyBankDetails;
  bankTransferAvailable: boolean;
  status?: PharmacyStatus;
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

export type PharmacyReviewResponseDto = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};
