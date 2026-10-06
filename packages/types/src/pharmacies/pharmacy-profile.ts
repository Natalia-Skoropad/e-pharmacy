import type { EntityId, ISODateTimeString } from '../primitives';
import type { PharmacyProfileVerificationDocument } from './verification-document';
import type { PharmacyLocationDraft } from './location';
import type { EditablePharmacyBankDetails } from './bank-details';
import type { PharmacyStatus } from './status';

//=============================================================================

type PharmacyMembershipRole = 'owner' | 'manager';

//=============================================================================

type ClearableEditablePharmacyBankDetails = Partial<{
  [Field in keyof EditablePharmacyBankDetails]: string | null;
}>;

//=============================================================================

export type PharmacyPendingModeration = Readonly<{
  name?: string;
  location?: PharmacyLocationDraft;
  phone?: string | null;
  email?: string | null;
  workingHours?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  documents?: readonly PharmacyProfileVerificationDocument[];
  bankDetails?: ClearableEditablePharmacyBankDetails;
}>;

//=============================================================================

export type CurrentPharmacySummary = Readonly<{
  id: EntityId;
  name: string;
  status: PharmacyStatus;
  imageUrl?: string;
  membershipRole: PharmacyMembershipRole;
}>;

//=============================================================================

export type PharmacyProfile = Readonly<{
  id: EntityId;
  name: string;
  location?: PharmacyLocationDraft;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: EditablePharmacyBankDetails;
  bankTransferAvailable: boolean;
  documents: readonly PharmacyProfileVerificationDocument[];
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

  location?: Partial<{
    address: string | null;
    settlement: string | null;
    region: string | null;
  }>;

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
