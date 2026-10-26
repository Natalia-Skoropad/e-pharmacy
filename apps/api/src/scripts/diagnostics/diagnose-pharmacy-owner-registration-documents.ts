import { createHash } from 'node:crypto';
import dotenv from 'dotenv';
import mongoose, { type Types } from 'mongoose';

import { ADMIN_AUDIT_ACTIONS } from '../../constants/admin/audit/admin-audit';
import { PHARMACY_OWNER_DOCUMENT_RULES } from '../../constants/owners/pharmacy-owner-document-validation';

import { AdminAuditLog } from '../../models/audit/adminAuditLog.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PharmacyDocumentFile } from '../../models/pharmacies/pharmacyDocumentFile.model';
import { PharmacyOwnerDocument } from '../../models/owners/pharmacyOwnerDocument.model';
import { User } from '../../models/accounts/user.model';

import { decodeAndVerifyDocumentUpload } from '../../utils/documentUpload';

//===================================================================
// Diagnostic only. No create/update/delete/migration methods are called.
// Never print file content, names, emails, phones or audit snapshots.
//===================================================================

type LegacyFile = {
  _id: Types.ObjectId;
  pharmacyId?: Types.ObjectId;
  uploadedByUserId?: Types.ObjectId;
  registrationUploadSessionId?: Types.ObjectId;
  attachedAt?: Date;
  createdAt: Date;
  name: string;
  size: number;
  type: string;
  sha256: string;
  content?: Buffer;
};

type PharmacyRow = {
  _id: Types.ObjectId;
  ownerId?: Types.ObjectId;
  email?: string;
  phone?: string;
  createdAt?: Date;

  documents?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    sha256: string;
  }>;
};

type UserRow = {
  _id: Types.ObjectId;
  role: string;
  status: string;
  email?: string;
  phone?: string;
  createdAt?: Date;
};

type AuditRow = {
  actorUserId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: string;
  scopeEntityId?: string;
  pharmacyId?: string;
  requestId: string;
  reason?: string;
  createdAt: Date;
};

//===================================================================

const LEGACY_CANDIDATE_FILTER = {
  registrationUploadSessionId: { $exists: true },
  pharmacyId: { $exists: true },
  uploadedByUserId: { $exists: true },
  attachedAt: { $exists: true },
  expiresAt: { $exists: false },
} as const;

const RELEVANT_ACTIONS = [
  ADMIN_AUDIT_ACTIONS.PHARMACY_CREATED,
  ADMIN_AUDIT_ACTIONS.PHARMACY_REGISTRATION_DOCUMENTS_ATTACHED,
  ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_ACCOUNT_CREATED,
  ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_REGISTRATION_DOCUMENTS_ATTACHED,
  ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_PROFILE_UPDATED,
] as const;

const asId = (value: Types.ObjectId | undefined): string | null =>
  value ? String(value) : null;

const asDate = (value: Date | undefined): string | null =>
  value instanceof Date && !Number.isNaN(value.valueOf())
    ? value.toISOString()
    : null;

//===================================================================

function accountSummary(user: UserRow | null, pharmacy: PharmacyRow | null) {
  return user
    ? {
        id: String(user._id),
        role: user.role,
        status: user.status,
        createdAt: asDate(user.createdAt),

        // These are clues only: a pharmacy's email/phone need not be its owner's.
        emailMatchesPharmacy: Boolean(
          user.email &&
          pharmacy?.email &&
          user.email.toLowerCase() === pharmacy.email.toLowerCase()
        ),

        phoneMatchesPharmacy: Boolean(
          user.phone && pharmacy?.phone && user.phone === pharmacy.phone
        ),
      }
    : null;
}

//===================================================================

function evaluateContent(file: LegacyFile) {
  if (!file.content) {
    return {
      present: false,
      actualBytesMatch: false,
      sha256Match: false,
      passesOwnerDocumentRules: false,
    };
  }

  // A lean() query can return BSON Binary instead of Node.js Buffer.
  // The caller deliberately loads a hydrated Mongoose document, and we fail
  // loudly if that invariant changes rather than report a false hash mismatch.
  if (!Buffer.isBuffer(file.content)) {
    throw new Error(
      `Registration document ${String(file._id)} content is not a Buffer`
    );
  }

  const content = file.content;
  const actualBytesMatch = content.length === file.size;
  const actualHash = createHash('sha256').update(content).digest('hex');
  const sha256Match = actualHash === file.sha256;

  let passesOwnerDocumentRules = false;

  try {
    const verified = decodeAndVerifyDocumentUpload(
      {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: `data:${file.type};base64,${content.toString('base64')}`,
      },

      PHARMACY_OWNER_DOCUMENT_RULES
    );

    passesOwnerDocumentRules = verified.sha256 === file.sha256;
  } catch {
    // Only report a failed validation; never emit binary or a data URL.
  }

  return {
    present: true,
    actualSizeBytes: content.byteLength,
    declaredSizeBytes: file.size,
    actualBytesMatch,
    sha256Match,
    passesOwnerDocumentRules,
  };
}

//===================================================================

function summarizeAudit(row: AuditRow) {
  const backfilled =
    row.requestId.startsWith('backfill-') ||
    /backfill(?:ed)?|pre-audit|historical (?:state|values)/i.test(
      row.reason ?? ''
    );

  return {
    action: row.action,
    createdAt: asDate(row.createdAt),
    actorUserId: String(row.actorUserId),
    entityType: row.entityType,
    entityId: row.entityId,
    scopeEntityId: row.scopeEntityId ?? null,
    pharmacyId: row.pharmacyId ?? null,
    backfilled,
    // Backfilled events reflect later database state, not original identity.
  };
}

//===================================================================

async function diagnoseOne(file: LegacyFile) {
  const pharmacyId = asId(file.pharmacyId);
  const uploaderId = asId(file.uploadedByUserId);

  const pharmacy = file.pharmacyId
    ? await Pharmacy.findById(file.pharmacyId)
        .select('_id ownerId email phone createdAt documents')
        .lean<PharmacyRow | null>()
    : null;

  const currentOwnerId = asId(pharmacy?.ownerId);

  const linkedIds = [pharmacy?.ownerId, file.uploadedByUserId].filter(
    (id): id is Types.ObjectId => Boolean(id)
  );

  const accounts = await User.find({ _id: { $in: linkedIds } })
    .select('_id role status email phone createdAt')
    .lean<UserRow[]>();

  const accountById = new Map(accounts.map((user) => [String(user._id), user]));

  const ownerAccount = currentOwnerId
    ? (accountById.get(currentOwnerId) ?? null)
    : null;

  const uploaderAccount = uploaderId
    ? (accountById.get(uploaderId) ?? null)
    : null;

  const reference = (pharmacy?.documents ?? []).find(
    (item) => item.id === String(file._id)
  );

  const referenceMatches = Boolean(
    reference &&
    reference.name === file.name &&
    reference.size === file.size &&
    reference.type === file.type &&
    reference.sha256 === file.sha256
  );

  // Hydrate both records: .lean() exposes Buffer columns as BSON Binary,
  // which must not be passed directly to Buffer.from() for hashing.
  const target = await PharmacyOwnerDocument.findById(file._id)
    .select('+content')
    .exec();

  if (target?.content && !Buffer.isBuffer(target.content)) {
    throw new Error(
      `Owner document ${String(file._id)} content is not a Buffer`
    );
  }

  const targetContent = target?.content ?? null;
  const sourceContent = file.content ?? null;

  const audit = await AdminAuditLog.find({
    action: { $in: RELEVANT_ACTIONS },

    $or: [
      { entityType: 'pharmacy', entityId: pharmacyId ?? '' },
      { pharmacyId: pharmacyId ?? '' },
      { entityType: 'pharmacyOwner', entityId: currentOwnerId ?? '' },
      { entityType: 'pharmacyOwner', entityId: uploaderId ?? '' },
      { scopeEntityType: 'pharmacyOwner', scopeEntityId: currentOwnerId ?? '' },
      { scopeEntityType: 'pharmacyOwner', scopeEntityId: uploaderId ?? '' },
    ],
  })
    .sort({ createdAt: 1, _id: 1 })
    .limit(30)

    .select(
      'actorUserId action createdAt entityType entityId scopeEntityId pharmacyId requestId reason'
    )

    .lean<AuditRow[]>();

  const uploaderOtherPharmacies = file.uploadedByUserId
    ? await Pharmacy.find({ ownerId: file.uploadedByUserId })
        .select('_id')
        .limit(10)
        .lean<Array<{ _id: Types.ObjectId }>>()
    : [];

  const ownerMatchesUploader = Boolean(
    currentOwnerId && uploaderId && currentOwnerId === uploaderId
  );

  const integrity = evaluateContent(file);

  return {
    documentId: String(file._id),
    sourceCreatedAt: asDate(file.createdAt),
    attachedAt: asDate(file.attachedAt),
    pharmacyId,
    registrationUploadSessionId: asId(file.registrationUploadSessionId),
    currentOwnerUserId: currentOwnerId,
    originalUploaderUserId: uploaderId,
    ownerMatchesUploader,
    pharmacyExists: Boolean(pharmacy),
    ownerAccount: accountSummary(ownerAccount, pharmacy),
    uploaderAccount: accountSummary(uploaderAccount, pharmacy),
    pharmacyCreatedAt: asDate(pharmacy?.createdAt),

    uploaderIsOwnerOfOtherPharmacies: uploaderOtherPharmacies.map((item) =>
      String(item._id)
    ),

    pharmacyDocumentReference: {
      found: Boolean(reference),
      metadataMatches: referenceMatches,
    },

    sourceIntegrity: integrity,

    existingOwnerDocument: target
      ? {
          ownerUserId: String(target.ownerUserId),
          uploadedByUserId: String(target.uploadedByUserId),
          sourcePharmacyId: asId(target.registrationSourcePharmacyId),

          metadataMatches:
            target.size === file.size &&
            target.type === file.type &&
            target.sha256 === file.sha256,

          bytesMatch: Boolean(
            targetContent &&
            sourceContent &&
            targetContent.equals(sourceContent)
          ),
        }
      : null,

    auditEvents: audit.map(summarizeAudit),

    assessment:
      ownerMatchesUploader &&
      referenceMatches &&
      integrity.passesOwnerDocumentRules
        ? 'PASSES_BASIC_PROVENANCE_CHECKS'
        : 'MANUAL_REVIEW_REQUIRED',
  };
}

//===================================================================

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) throw new Error('MONGODB_URI is required');

  // No --apply support by design. Extra arguments are rejected to avoid misuse.
  if (process.argv.length > 2) {
    throw new Error(
      'This diagnostic does not accept arguments (including --apply).'
    );
  }

  await mongoose.connect(uri, { autoIndex: false, autoCreate: false });

  try {
    // Do not use lean(): binary content needs Mongoose Buffer hydration.
    const files = await PharmacyDocumentFile.find(LEGACY_CANDIDATE_FILTER)
      .select('+content')
      .sort({ _id: 1 })
      .exec();

    const documents = [];

    for (const file of files) {
      documents.push(await diagnoseOne(file));
    }

    const ownerMismatch = documents.filter(
      (document) => !document.ownerMatchesUploader
    ).length;

    console.log(
      JSON.stringify(
        {
          mode: 'read-only',
          collection: 'historical registration candidates only',
          documentsScanned: documents.length,
          ownerMismatch,
          note: 'Backfilled audits and contact-field matches are clues, NOT proof of original ownership. No writes performed.',
          documents,
        },
        null,
        2
      )
    );
  } finally {
    await mongoose.disconnect();
  }
}

//===================================================================

dotenv.config();

//===================================================================

void main().catch((error: unknown) => {
  console.error('Registration document diagnosis failed:', error);
  process.exitCode = 1;
});
