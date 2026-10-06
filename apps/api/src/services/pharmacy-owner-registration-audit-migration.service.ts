import { Types } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../constants/admin-audit';

import { USER_ROLES } from '../constants/auth';
import { AdminAuditLog } from '../models/adminAuditLog.model';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';

import type { PharmacyVerificationDocumentMetadata } from '../types/pharmacy';

//===============================================================

const LEGACY_DEMO_OWNER_EMAIL_PATTERN =
  /^pharmacy\.\d+@e-pharmacy\.example\.com$/i;

const DEMO_OWNER_BACKFILL_REASON =
  'Backfilled for an owner account created by the Stage 13.2 demo-owner repair migration.';

const LEGACY_OWNER_BACKFILL_REASON =
  'Backfilled from persisted pre-audit account state; exact registration-time values are unavailable.';

const DEMO_DOCUMENTS_BACKFILL_REASON =
  'Backfilled from persisted demo pharmacy state after the Stage 13.2 owner repair; exact registration-time document history is unavailable.';

const LEGACY_DOCUMENTS_BACKFILL_REASON =
  'Backfilled from persisted pre-audit pharmacy state; exact registration-time document history is unavailable.';

//===============================================================

type OwnerRow = Readonly<{
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'active' | 'blocked';
  createdAt?: Date;
}>;

type PharmacyRow = Readonly<{
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  name?: string;
  email?: string;
  documents?: PharmacyVerificationDocumentMetadata[];
  createdAt?: Date;
}>;

export type PharmacyOwnerRegistrationAuditMigrationResult = Readonly<{
  ownersScanned: number;
  demoOwners: number;
  legacyOwners: number;
  accountEventsCreated: number;
  accountEventsSkipped: number;
  documentEventsCreated: number;
  documentEventsSkipped: number;
}>;

//===============================================================

function isDemoOwner(owner: OwnerRow): boolean {
  return LEGACY_DEMO_OWNER_EMAIL_PATTERN.test(owner.email.trim());
}

//===============================================================

function getOwnerBackfillReason(owner: OwnerRow): string {
  return isDemoOwner(owner)
    ? DEMO_OWNER_BACKFILL_REASON
    : LEGACY_OWNER_BACKFILL_REASON;
}

//===============================================================

function getHistoricalCreatedAt(
  value: Date | undefined,
  id: Types.ObjectId
): Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? value
    : id.getTimestamp();
}

//===============================================================

function getDocumentsAuditCreatedAt(
  ownerCreatedAt: Date,
  pharmacyCreatedAt: Date
): Date {
  return new Date(
    Math.max(ownerCreatedAt.getTime(), pharmacyCreatedAt.getTime()) + 1
  );
}

//===============================================================

async function ensureOwnerAccountCreatedEvent(
  owner: OwnerRow
): Promise<boolean> {
  const entityId = String(owner._id);

  const existing = await AdminAuditLog.exists({
    action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_ACCOUNT_CREATED,
    entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
    entityId,
  });

  if (existing) return false;

  const requestId = `backfill-owner-registration:${entityId}`;

  const result = await AdminAuditLog.updateOne(
    { requestId },
    {
      $setOnInsert: {
        actorUserId: owner._id,
        actorNameSnapshot: owner.name,
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_ACCOUNT_CREATED,
        section: ADMIN_AUDIT_SECTIONS.PHARMACY_OWNERS,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
        entityId,
        entityLabelSnapshot: owner.name,
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
        scopeEntityId: entityId,
        before: {},
        after: {
          status: owner.status,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
        },
        changedFields: ['email', 'name', 'phone', 'status'],
        reason: getOwnerBackfillReason(owner),
        requestId,
        createdAt: getHistoricalCreatedAt(owner.createdAt, owner._id),
      },
    },
    { upsert: true, timestamps: false }
  );

  return result.upsertedCount === 1;
}

//===============================================================

async function ensureRegistrationDocumentsEvent(
  owner: OwnerRow,
  pharmacy: PharmacyRow
): Promise<boolean | null> {
  const documents = pharmacy.documents ?? [];
  if (documents.length === 0) return null;

  const entityId = String(pharmacy._id);
  const ownerId = String(owner._id);

  const existing = await AdminAuditLog.exists({
    action: ADMIN_AUDIT_ACTIONS.PHARMACY_REGISTRATION_DOCUMENTS_ATTACHED,
    entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
    entityId,
    scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
    scopeEntityId: ownerId,
  });

  if (existing) return false;

  const requestId = `backfill-pharmacy-registration-documents:${entityId}`;
  const entityLabel =
    pharmacy.name?.trim() || pharmacy.email?.trim() || owner.email;

  const result = await AdminAuditLog.updateOne(
    { requestId },
    {
      $setOnInsert: {
        actorUserId: owner._id,
        actorNameSnapshot: owner.name,
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_REGISTRATION_DOCUMENTS_ATTACHED,
        section: ADMIN_AUDIT_SECTIONS.PHARMACIES,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
        entityId,
        entityLabelSnapshot: entityLabel,
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
        scopeEntityId: ownerId,
        before: {
          registrationDocuments: [],
          documentCount: 0,
          documentMimeTypes: [],
          documentSizesBytes: [],
          totalDocumentSizeBytes: 0,
        },
        after: {
          registrationDocuments: documents.map((document) => document.name),
          documentCount: documents.length,
          documentMimeTypes: documents.map((document) => document.type),
          documentSizesBytes: documents.map((document) =>
            String(document.size)
          ),
          totalDocumentSizeBytes: documents.reduce(
            (total, document) => total + document.size,
            0
          ),
        },
        changedFields: [
          'documentCount',
          'documentMimeTypes',
          'documentSizesBytes',
          'registrationDocuments',
          'totalDocumentSizeBytes',
        ],
        reason: isDemoOwner(owner)
          ? DEMO_DOCUMENTS_BACKFILL_REASON
          : LEGACY_DOCUMENTS_BACKFILL_REASON,
        requestId,
        createdAt: getDocumentsAuditCreatedAt(
          getHistoricalCreatedAt(owner.createdAt, owner._id),
          getHistoricalCreatedAt(pharmacy.createdAt, pharmacy._id)
        ),
      },
    },
    { upsert: true, timestamps: false }
  );

  return result.upsertedCount === 1;
}

//===============================================================

export async function migratePharmacyOwnerRegistrationAudit(): Promise<PharmacyOwnerRegistrationAuditMigrationResult> {
  const ownerIds = await Pharmacy.distinct('ownerId');

  const owners = await User.find({
    _id: { $in: ownerIds },
    role: USER_ROLES.PHARMACY,
  })
    .select('_id name email phone status createdAt')
    .sort({ createdAt: 1, _id: 1 })
    .lean<OwnerRow[]>();

  const pharmacies = await Pharmacy.find({
    ownerId: { $in: owners.map((owner) => owner._id) },
  })
    .select('_id ownerId name email documents createdAt')
    .sort({ createdAt: 1, _id: 1 })
    .lean<PharmacyRow[]>();

  const ownerById = new Map(
    owners.map((owner) => [String(owner._id), owner] as const)
  );

  let accountEventsCreated = 0;
  let accountEventsSkipped = 0;
  let documentEventsCreated = 0;
  let documentEventsSkipped = 0;

  for (const owner of owners) {
    if (await ensureOwnerAccountCreatedEvent(owner)) {
      accountEventsCreated += 1;
    } else {
      accountEventsSkipped += 1;
    }
  }

  for (const pharmacy of pharmacies) {
    const owner = ownerById.get(String(pharmacy.ownerId));
    if (!owner) continue;

    const created = await ensureRegistrationDocumentsEvent(owner, pharmacy);
    if (created === null) continue;

    if (created) {
      documentEventsCreated += 1;
    } else {
      documentEventsSkipped += 1;
    }
  }

  return {
    ownersScanned: owners.length,
    demoOwners: owners.filter(isDemoOwner).length,
    legacyOwners: owners.filter((owner) => !isDemoOwner(owner)).length,
    accountEventsCreated,
    accountEventsSkipped,
    documentEventsCreated,
    documentEventsSkipped,
  };
}
