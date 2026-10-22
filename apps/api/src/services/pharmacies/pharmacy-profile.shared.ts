import { Types, type HydratedDocument, type ClientSession } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../../constants/admin-audit';

import { PHARMACY_PROFILE_CONFLICT_ERROR_CODE } from '../../constants/pharmacy-profile';
import { HTTP_STATUS } from '../../constants/httpStatus';
import { appendAdminAuditLog } from '../admin/audit/admin-audit.service';

import type {
  PharmacyEntity,
  PharmacyMembershipRole,
  PharmacyLocationDraft,
  PharmacyPendingModeration,
  PharmacyPendingModerationResponseDto,
  PharmacyProfileVerificationDocumentResponseDto,
  PharmacyVerificationDocumentMetadata,
  MyPharmacyProfileResponseDto,
  CurrentPharmacySummaryResponseDto,
  UpdateMyPharmacyProfileInput,
} from '../../types/pharmacy';

import { httpError } from '../../utils/httpError';
import { requireISODateTime } from '../../utils/date-contract';

import {
  clonePharmacyLocation,
  clonePendingModerationFields as normalizePendingModerationPayload,
} from './pharmacy-location';

import { hasCompleteBankDetails } from './bank-details';

//===============================================================

export type PharmacyDocument = PharmacyEntity & { _id: Types.ObjectId };

//===============================================================

export type PharmacyHydratedDocument = HydratedDocument<PharmacyEntity> & {
  _id: Types.ObjectId;
};

export type ResolvedPharmacyProfileUpdate = Omit<
  UpdateMyPharmacyProfileInput,
  'documents' | 'expectedRevision'
> & {
  documents?: PharmacyEntity['documents'];
};

//===============================================================

export function serializeCurrentPharmacySummary(
  pharmacy: PharmacyDocument,
  membershipRole: PharmacyMembershipRole
): CurrentPharmacySummaryResponseDto {
  return {
    id: String(pharmacy._id),
    name: pharmacy.name,
    status: pharmacy.status,

    ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),

    membershipRole,
  };
}

//===============================================================

function serializeProfileVerificationDocument(
  document: PharmacyVerificationDocumentMetadata
): PharmacyProfileVerificationDocumentResponseDto {
  return {
    id: document.id,
    name: document.name,
    size: document.size,
    type: document.type,
    uploadedAt: document.uploadedAt,
  };
}

//===============================================================

function applyEditableLocationPatch(
  baseLocation: PharmacyLocationDraft | undefined,
  patch: NonNullable<ResolvedPharmacyProfileUpdate['location']>
): PharmacyLocationDraft {
  const nextLocation: {
    address?: string;
    settlement?: string;
    region?: string;
    countryCode?: string;
    geo?: PharmacyLocationDraft['geo'];
  } = { ...(clonePharmacyLocation(baseLocation) ?? {}) };

  for (const field of ['address', 'settlement', 'region'] as const) {
    const value = patch[field];

    if (value === undefined) continue;
    if (value === null) delete nextLocation[field];
    else nextLocation[field] = value;
  }

  if (!nextLocation.countryCode) nextLocation.countryCode = 'UA';

  return nextLocation;
}

//===============================================================

function serializePendingModerationForProfile(
  pendingModeration: PharmacyPendingModeration
): PharmacyPendingModerationResponseDto {
  const normalized = normalizePendingModerationPayload(pendingModeration);

  const result: PharmacyPendingModerationResponseDto = {};

  if (normalized.name !== undefined) result.name = normalized.name;

  if (normalized.location !== undefined)
    result.location = clonePharmacyLocation(normalized.location);

  if (normalized.phone !== undefined) result.phone = normalized.phone;
  if (normalized.email !== undefined) result.email = normalized.email;

  if (normalized.workingHours !== undefined)
    result.workingHours = normalized.workingHours;

  if (normalized.imageUrl !== undefined) result.imageUrl = normalized.imageUrl;

  if (normalized.description !== undefined)
    result.description = normalized.description;

  if (normalized.shortDescription !== undefined)
    result.shortDescription = normalized.shortDescription;

  if (normalized.documents !== undefined) {
    result.documents = normalized.documents.map(
      serializeProfileVerificationDocument
    );
  }

  if (normalized.bankDetails !== undefined) {
    result.bankDetails = normalized.bankDetails;
  }

  return result;
}

//===============================================================

export function serializePharmacyProfile(
  pharmacy: PharmacyDocument,
  membershipRole: PharmacyMembershipRole
): MyPharmacyProfileResponseDto {
  return {
    id: String(pharmacy._id),
    membershipRole,
    name: pharmacy.name,

    ...(pharmacy.location
      ? { location: clonePharmacyLocation(pharmacy.location) }
      : {}),

    ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
    ...(pharmacy.email ? { email: pharmacy.email } : {}),
    ...(pharmacy.workingHours ? { workingHours: pharmacy.workingHours } : {}),

    bankTransferAvailable: hasCompleteBankDetails(pharmacy.bankDetails),

    ...(membershipRole !== 'manager' && pharmacy.bankDetails
      ? { bankDetails: pharmacy.bankDetails }
      : {}),

    documents:
      membershipRole === 'manager'
        ? []
        : (pharmacy.documents ?? []).map(serializeProfileVerificationDocument),

    status: pharmacy.status,
    rating: pharmacy.rating ?? 0,

    ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
    ...(pharmacy.description ? { description: pharmacy.description } : {}),

    ...(pharmacy.shortDescription
      ? { shortDescription: pharmacy.shortDescription }
      : {}),

    ...(pharmacy.statusReason ? { statusReason: pharmacy.statusReason } : {}),
    ...(pharmacy.reviewState ? { reviewState: pharmacy.reviewState } : {}),

    ...(pharmacy.reviewFeedback
      ? { reviewFeedback: pharmacy.reviewFeedback }
      : {}),

    ...(pharmacy.reviewedAt
      ? { reviewedAt: pharmacy.reviewedAt.toISOString() }
      : {}),

    ...(pharmacy.reviewedBy ? { reviewedBy: String(pharmacy.reviewedBy) } : {}),

    ...(membershipRole !== 'manager' && pharmacy.pendingModeration
      ? {
          pendingModeration: serializePendingModerationForProfile(
            pharmacy.pendingModeration
          ),
        }
      : {}),

    reviewsCount: pharmacy.reviewsCount ?? 0,
    updatedAt: requireISODateTime(pharmacy.updatedAt, 'pharmacy.updatedAt'),
  };
}

//===============================================================

export function hasModeratedProfileChanges(
  input: ResolvedPharmacyProfileUpdate
): boolean {
  return Boolean(
    input.name !== undefined ||
    input.location !== undefined ||
    input.phone !== undefined ||
    input.email !== undefined ||
    input.workingHours !== undefined ||
    input.imageUrl !== undefined ||
    input.description !== undefined ||
    input.shortDescription !== undefined ||
    input.documents !== undefined ||
    input.bankDetails
  );
}

//===============================================================

export function buildPendingModerationPayload(
  current: PharmacyPendingModeration | undefined,
  input: ResolvedPharmacyProfileUpdate,
  approvedLocation?: PharmacyLocationDraft
): PharmacyPendingModeration {
  const pending = normalizePendingModerationPayload(current);

  if (input.name !== undefined) pending.name = input.name;

  if (input.location !== undefined) {
    pending.location = applyEditableLocationPatch(
      pending.location ?? approvedLocation,
      input.location
    );
  }

  if (input.phone !== undefined) pending.phone = input.phone;
  if (input.email !== undefined) pending.email = input.email;

  if (input.workingHours !== undefined)
    pending.workingHours = input.workingHours;

  if (input.imageUrl !== undefined) pending.imageUrl = input.imageUrl;
  if (input.description !== undefined) pending.description = input.description;

  if (input.shortDescription !== undefined)
    pending.shortDescription = input.shortDescription;

  if (input.documents !== undefined) pending.documents = input.documents;

  if (input.bankDetails) {
    pending.bankDetails = {
      ...(pending.bankDetails ?? {}),
      ...input.bankDetails,
    };
  }

  return pending;
}

//===============================================================

export function throwPharmacyProfileConflict(): never {
  throw httpError(
    HTTP_STATUS.CONFLICT,
    'Pharmacy profile changed in another session. Reload the latest data and try again.',
    undefined,

    PHARMACY_PROFILE_CONFLICT_ERROR_CODE
  );
}

//===============================================================

export function assertPharmacyProfileRevision(
  pharmacy: Pick<PharmacyEntity, 'updatedAt'>,
  expectedRevision: string
): void {
  if (pharmacy.updatedAt.toISOString() !== expectedRevision) {
    throwPharmacyProfileConflict();
  }
}

//===============================================================

// Owner and pharmacy employees can mutate a profile: record who actually wrote it.
// Audit only status/revision and section labels; never document bytes, bank details,
// personal profile values, or owner-visible text.
export function safePharmacyEditedSections(fields: object): string[] {
  const names: Record<string, string> = {
    bankDetails: 'paymentSettings',
    documents: 'verificationDocuments',
    imageUrl: 'profileImage',
    location: 'location',
  };

  return [
    ...new Set(Object.keys(fields).map((key) => names[key] ?? key)),
  ].sort();
}

//===============================================================

export async function appendPharmacyOwnerMutationAudit(
  userId: string,
  before: PharmacyHydratedDocument,
  after: PharmacyHydratedDocument,

  action:
    | typeof ADMIN_AUDIT_ACTIONS.PHARMACY_PROFILE_UPDATED
    | typeof ADMIN_AUDIT_ACTIONS.PHARMACY_MODERATION_SUBMITTED,

  sections: string[],
  session: ClientSession,
  requestId?: string
): Promise<void> {
  const beforeSnapshot = {
    status: before.status,
    reviewState: before.reviewState ?? 'pending',
    revision: before.updatedAt.toISOString(),
    editedSections: [] as string[],
  };

  const afterSnapshot = {
    status: after.status,
    reviewState: after.reviewState ?? 'pending',
    revision: after.updatedAt.toISOString(),
    editedSections: sections,
  };

  const changedFields = ['revision', 'editedSections'];

  if (before.status !== after.status) changedFields.push('status');

  if (beforeSnapshot.reviewState !== afterSnapshot.reviewState)
    changedFields.push('reviewState');

  await appendAdminAuditLog({
    actorUserId: userId,
    action,
    section: ADMIN_AUDIT_SECTIONS.PHARMACIES,
    entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
    entityId: String(after._id),

    // A new pharmacy may still have an empty name while its profile is being completed.
    // Keep the audit label non-empty without exposing private profile fields.
    entityLabel: after.name.trim() || `Pharmacy ${String(after._id)}`,
    scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
    scopeEntityId: String(after.ownerId),
    before: beforeSnapshot,
    after: afterSnapshot,
    changedFields,
    requestId: requestId ?? new Types.ObjectId().toHexString(),
    session,
  });
}
