import type { EntityId, ISODateTimeString } from '../primitives';
import type { PublicPaymentBankDetails } from './bank-details';

//=============================================================================

export type PublicPharmacy = {
  id: EntityId;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  rating: number;
  imageUrl?: string;
  description?: string;
  availableProductsCount: number;
  reviewsCount: number;
  isFavorite: boolean;
  bankTransferAvailable: boolean;
  bankDetails?: PublicPaymentBankDetails;
  updatedAt: ISODateTimeString;
};

export type PharmacyCheckoutDetails = {
  id: EntityId;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankTransferAvailable: boolean;
  bankDetails?: PublicPaymentBankDetails;
};
