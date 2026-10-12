import type { PharmacyOwnerAccountStatus } from '../auth';

import type {
  EditablePharmacyBankDetails,
  PharmacyLocationDraft,
  PharmacyPendingModeration,
  PharmacyStatus,
} from '../pharmacies';

import type { EntityId, ISODateTimeString } from '../primitives';

//===================================================================

/** A link only exists for a real pharmacy-role owner; legacy orphans use null. */
type AdminPharmacyDetailOwner = Readonly<{
  id: EntityId;
  name: string;
  email: string;
  phone: string;
  pictureUrl?: string;
  status: PharmacyOwnerAccountStatus;
}>;

/** Published fields. Never implicitly merge submitted data into this object. */
export type AdminPharmacyCurrentData = Readonly<{
  name: string;
  location?: PharmacyLocationDraft;
  email?: string;
  phone?: string;
  workingHours?: string;
  imageUrl?: string;
  description?: string;
  license?: string;
  bankDetails?: EditablePharmacyBankDetails;
  bankTransferAvailable: boolean;
}>;

/** Document contents and metadata belong to Stage 14.6, not the base detail. */
export type AdminPharmacyPendingChanges = Readonly<
  Omit<PharmacyPendingModeration, 'documents'> & {
    documentsCount?: number;
  }
>;

//===================================================================

export type AdminPharmacyDetail = Readonly<{
  id: EntityId;
  status: PharmacyStatus;
  owner: AdminPharmacyDetailOwner | null;
  current: AdminPharmacyCurrentData;
  pendingChanges?: AdminPharmacyPendingChanges;
  statusReason?: string;
  reviewState?: 'pending' | 'changes_requested';
  reviewFeedback?: string;
  reviewedAt?: ISODateTimeString;
  reviewedBy?: EntityId;

  dates: Readonly<{
    createdAt: ISODateTimeString;
    updatedAt: ISODateTimeString;
    approvedAt?: ISODateTimeString;
    activatedAt?: ISODateTimeString;
  }>;

  documentCount: number;

  metrics: Readonly<{
    activeClientsCount: number;
    successfulOrdersCount: number;
    successfulRevenue: number;
    rating: number;
    reviewsCount: number;
  }>;
}>;

//===================================================================

/** Stage 14.8: clientRequestId is supplied by the caller for safe retries. */
export type AdminPharmacyModerationDecisionPayload = Readonly<{
  action: 'approve' | 'request_corrections' | 'block' | 'review_reactivation';
  reason: string;
  expectedRevision: string;
  clientRequestId: string;
}>;

export type AdminPharmacyStatusPayload = Readonly<{
  status: 'active' | 'blocked';
  reason: string;
  expectedRevision: string;
  clientRequestId: string;
}>;

export type AdminPharmacyCorrectionsPayload = Readonly<{
  feedback: string;
  expectedRevision: string;
  clientRequestId: string;
}>;
