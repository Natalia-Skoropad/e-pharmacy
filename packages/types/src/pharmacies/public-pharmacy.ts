import type { EntityId, ISODateTimeString } from '../primitives';
import type { PublicPaymentBankDetails } from './bank-details';

//=============================================================================

export type PublicPharmacy = Readonly<{
  id: EntityId;
  name: string;
  publicSlugId: string;
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
}>;

export type PharmacyCheckoutDetails = Readonly<{
  id: EntityId;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankTransferAvailable: boolean;
  bankDetails?: PublicPaymentBankDetails;
}>;
