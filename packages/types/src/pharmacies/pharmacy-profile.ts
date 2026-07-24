import type { EntityId, FileMetadata, ISODateTimeString } from '../primitives';
import type { EditablePharmacyBankDetails } from './bank-details';
import type { PharmacyStatus } from './status';

//=============================================================================

export type PharmacyPendingModeration = {
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

//=============================================================================

export type PharmacyModerationDetails = {
  status: PharmacyStatus;
  statusReason?: string;
  pendingModeration?: PharmacyPendingModeration;
};

//=============================================================================

export type PharmacyProfile = {
  id: EntityId;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: EditablePharmacyBankDetails;
  bankTransferAvailable: boolean;
  documents: FileMetadata[];
  status: PharmacyStatus;
  rating: number;
  imageUrl?: string;
  description?: string;
  statusReason?: string;
  pendingModeration?: PharmacyPendingModeration;
  reviewsCount: number;
  updatedAt: ISODateTimeString;
};

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
