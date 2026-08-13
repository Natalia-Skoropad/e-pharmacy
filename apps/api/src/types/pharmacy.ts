import type { Types } from 'mongoose';
import type { PHARMACY_STATUSES } from '../constants/auth';
import type { updateMyPharmacyProfileSchema } from '../schemas/pharmacy.schema';
import type { z } from 'zod';
import type { ISODateTimeString } from './date';

//===============================================================

export type PharmacyStatus =
  (typeof PHARMACY_STATUSES)[keyof typeof PHARMACY_STATUSES];

//===============================================================

export type ReviewModerationStatus = 'on_moderation' | 'approved' | 'rejected';

//===============================================================

export type PharmacyVerificationDocumentMetadata = {
  id: string;
  name: string;
  size: number;
  type: string;
  sha256: string;
  uploadedAt: ISODateTimeString;
};

export type EditablePharmacyBankDetails = Partial<{
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  receiptEmail: string;
  paymentPurpose: string;
}>;

export type CompletePharmacyBankDetails = {
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  receiptEmail: string;
  paymentPurpose: string;
};

export type PublicPaymentBankDetails = {
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  receiptEmail: string;
  paymentPurpose: string;
};

export type PharmacyPendingModeration = {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  imageUrl?: string | null;
  description?: string;
  documents?: PharmacyVerificationDocumentMetadata[];
  bankDetails?: EditablePharmacyBankDetails;
};

export type PharmacyEntity = {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: EditablePharmacyBankDetails;
  license?: string;
  documents: PharmacyVerificationDocumentMetadata[];
  status: PharmacyStatus;
  rating: number;
  imageUrl?: string;
  description?: string;
  statusReason?: string;
  pendingModeration?: PharmacyPendingModeration;
  reviewsCount?: number;
  ownerId: Types.ObjectId;
  managerUserIds: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  activatedAt?: Date;
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

//===============================================================

export type PharmacyFilterOptionsResponseDto = {
  cities: PharmacyFilterOptionDto[];
  sort: PharmacyFilterOptionDto<
    'newest' | 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc'
  >[];
};

//===============================================================

export type PharmacyCardSummaryResponseDto = {
  id: string;
  name: string;
  publicSlugId: string;
  address?: string;
  city?: string;
  phone?: string;
  rating: number;
  imageUrl?: string;
  availableProductsCount: number;
  reviewsCount: number;
  isFavorite: boolean;
};

export type PublicPharmacyResponseDto = {
  id: string;
  name: string;
  publicSlugId: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankTransferAvailable: boolean;
  bankDetails?: PublicPaymentBankDetails;
  rating: number;
  imageUrl?: string;
  description?: string;
  availableProductsCount: number;
  reviewsCount: number;
  isFavorite: boolean;
  updatedAt: ISODateTimeString;
};

export type PharmacyReviewResponseDto = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: ISODateTimeString;
};

export type PharmacyProfileResponseDto = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: EditablePharmacyBankDetails;
  bankTransferAvailable: boolean;
  documents: PharmacyVerificationDocumentMetadata[];
  status: PharmacyStatus;
  rating: number;
  imageUrl?: string;
  description?: string;
  statusReason?: string;
  pendingModeration?: PharmacyPendingModeration;
  reviewsCount: number;
  updatedAt: ISODateTimeString;
};

//===============================================================

export type UpdateMyPharmacyProfileInput = z.infer<
  typeof updateMyPharmacyProfileSchema
>;
