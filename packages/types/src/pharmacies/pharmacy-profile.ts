import type { EntityId, ISODateTimeString } from '../primitives';
import type { PharmacyVerificationDocument } from './verification-document';
import type { EditablePharmacyBankDetails } from './bank-details';
import type { PharmacyStatus } from './status';

//=============================================================================

type PharmacyMembershipRole = 'owner' | 'manager';

type ClearableEditablePharmacyBankDetails = Partial<{
  [Field in keyof EditablePharmacyBankDetails]: string | null;
}>;

//=============================================================================

export type PharmacyPendingModeration = Readonly<{
  name?: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  workingHours?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  documents?: readonly PharmacyVerificationDocument[];
  bankDetails?: ClearableEditablePharmacyBankDetails;
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

export type MyPharmacyProfile = PharmacyProfile &
  Readonly<{
    membershipRole: PharmacyMembershipRole;
  }>;

//=============================================================================

export type PharmacyProfileUpdateChanges = {
  name?: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  workingHours?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  documents?: Array<Readonly<{ documentId: EntityId }>>;
  bankDetails?: ClearableEditablePharmacyBankDetails;
};

export type UpdateMyPharmacyProfilePayload = PharmacyProfileUpdateChanges & {
  expectedRevision: ISODateTimeString;
};

export type SubmitMyPharmacyModerationPayload = {
  changes: PharmacyProfileUpdateChanges;
  expectedRevision: ISODateTimeString;
};
