import type { EntityId, ISODateTimeString } from '../primitives';
import type { PharmacyVerificationDocument } from './verification-document';
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
  documents?: readonly PharmacyVerificationDocument[];
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
  documents: readonly PharmacyVerificationDocument[];
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
  documents?: Array<Readonly<{ documentId: EntityId }>>;
  bankDetails?: EditablePharmacyBankDetails;
};
