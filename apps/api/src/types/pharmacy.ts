import type { Types } from 'mongoose';
import type { PHARMACY_STATUSES } from '../constants/auth';

//===============================================================

export type PharmacyStatus =
  (typeof PHARMACY_STATUSES)[keyof typeof PHARMACY_STATUSES];

export type ReviewModerationStatus = 'on_moderation' | 'approved' | 'rejected';

//===============================================================

export type PharmacyBankDetails = {
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  paymentPurpose: string;
};

export type PharmacyEntity = {
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: PharmacyBankDetails;
  license?: string;
  status: PharmacyStatus;
  rating: number;
  imageUrl?: string;
  description?: string;
  reviewsCount?: number;
  ownerId: Types.ObjectId;
  managerUserIds: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PharmacyOptionResponseDto = {
  id: string;
  name: string;
};

export type PharmacyFilterOptionDto<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export type PharmacyFilterOptionsResponseDto = {
  cities: PharmacyFilterOptionDto[];
  sort: PharmacyFilterOptionDto<
    'newest' | 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc'
  >[];
};

export type PublicPharmacyResponseDto = {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankTransferAvailable: boolean;
  rating?: number;
  imageUrl?: string;
  description?: string;
  availableProductsCount: number;
  reviewsCount: number;
  isFavorite: boolean;
  updatedAt: string;
};

export type PharmacyReviewResponseDto = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type PharmacyProfileResponseDto = {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: PharmacyBankDetails;
  bankTransferAvailable: boolean;
  status: PharmacyStatus;
  rating: number;
  imageUrl?: string;
  description?: string;
  reviewsCount: number;
  updatedAt: string;
};
