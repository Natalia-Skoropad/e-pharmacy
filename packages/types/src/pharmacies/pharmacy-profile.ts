import type { EntityId, FileMetadata, ISODateTimeString } from '../primitives';
import type { EditablePharmacyBankDetails } from './bank-details';
import type { PharmacyStatus } from './status';

//=============================================================================

export type PharmacyPendingModeration = Readonly<{
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  imageUrl?: string | null;
  description?: string;
  documents?: readonly FileMetadata[];
  bankDetails?: EditablePharmacyBankDetails;
}>;

//=============================================================================

export type PharmacyProfile = Readonly<{
  id: EntityId;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: EditablePharmacyBankDetails;
  bankTransferAvailable: boolean;
  documents: readonly FileMetadata[];
  status: PharmacyStatus;
  rating: number;
  imageUrl?: string;
  description?: string;
  statusReason?: string;
  pendingModeration?: PharmacyPendingModeration;
  reviewsCount: number;
  updatedAt: ISODateTimeString;
}>;

//=============================================================================

export type UpdateMyPharmacyProfilePayload = {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  imageUrl?: string | null;
  description?: string;
  documents?: FileMetadata[];
  bankDetails?: EditablePharmacyBankDetails;
};
