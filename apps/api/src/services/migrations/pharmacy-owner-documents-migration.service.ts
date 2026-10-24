import { createHash } from 'node:crypto';
import { Types } from 'mongoose';

import { USER_ROLES } from '../../constants/auth/auth';
import { PHARMACY_OWNER_DOCUMENT_RULES } from '../../constants/owners/pharmacy-owner-document-validation';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PharmacyDocumentFile } from '../../models/pharmacies/pharmacyDocumentFile.model';
import { PharmacyOwnerDocument } from '../../models/owners/pharmacyOwnerDocument.model';
import { User } from '../../models/accounts/user.model';

import { decodeAndVerifyDocumentUpload } from '../../utils/documentUpload';

//===============================================================

/** This migration is deliberately conservative: registration provenance is mandatory. */
export type OwnerDocumentsMigrationResult = {
  scanned: number;
  eligible: number;
  copied: number;
  alreadyCopied: number;
  skipped: Array<{ documentId: string; reason: string }>;
};

type LegacyRegistrationFile = {
  _id: Types.ObjectId;
  registrationUploadSessionId?: Types.ObjectId;
  pharmacyId?: Types.ObjectId;
  uploadedByUserId?: Types.ObjectId;
  attachedAt?: Date;
  expiresAt?: Date;
  name: string;
  size: number;
  type: string;
  sha256: string;
  content?: Buffer;
  createdAt: Date;
};

type PharmacyRegistrationReference = {
  id: string;
  name: string;
  size: number;
  type: string;
  sha256: string;
};

type MigrationPharmacy = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  documents?: PharmacyRegistrationReference[];
};

//===============================================================

function matchesOriginal(
  stored: {
    ownerUserId: Types.ObjectId;
    name: string;
    size: number;
    type: string;
    sha256: string;
    content?: Buffer;
  },

  file: LegacyRegistrationFile,
  ownerId: Types.ObjectId
): boolean {
  return (
    String(stored.ownerUserId) === String(ownerId) &&
    stored.name === file.name &&
    stored.size === file.size &&
    stored.type === file.type &&
    stored.sha256 === file.sha256 &&
    Boolean(stored.content && file.content) &&
    Buffer.from(stored.content ?? []).equals(Buffer.from(file.content ?? []))
  );
}

//===============================================================

/** Dry-run by default. Run with apply=true only after reviewing its report. */
export async function migratePharmacyOwnerRegistrationDocuments(
  apply = false
): Promise<OwnerDocumentsMigrationResult> {
  const result: OwnerDocumentsMigrationResult = {
    scanned: 0,
    eligible: 0,
    copied: 0,
    alreadyCopied: 0,
    skipped: [],
  };

  const planned = new Map<string, { count: number; bytes: number }>();

  const files = PharmacyDocumentFile.find({
    registrationUploadSessionId: { $exists: true },
    pharmacyId: { $exists: true },
    uploadedByUserId: { $exists: true },
    attachedAt: { $exists: true },
    expiresAt: { $exists: false },
  })
    .select('+content')
    .sort({ _id: 1 })
    .cursor();

  for await (const file of files) {
    result.scanned += 1;

    const documentId = String(file._id);

    const skip = (reason: string) =>
      result.skipped.push({ documentId, reason });

    if (
      !file.pharmacyId ||
      !file.uploadedByUserId ||
      !file.registrationUploadSessionId ||
      !file.attachedAt ||
      !file.content
    ) {
      skip('Incomplete source provenance or content');
      continue;
    }

    const pharmacy = await Pharmacy.findById(file.pharmacyId)
      .select('_id ownerId documents')
      .lean<MigrationPharmacy | null>();

    // A registration session alone is NOT sufficient: require a matching
    // pharmacy reference and the registration uploader to be the actual owner.
    if (
      !pharmacy ||
      String(pharmacy.ownerId) !== String(file.uploadedByUserId)
    ) {
      skip('Pharmacy owner does not match registration uploader');
      continue;
    }

    if (
      !(await User.exists({ _id: pharmacy.ownerId, role: USER_ROLES.PHARMACY }))
    ) {
      skip('Owner account is missing or has an incompatible role');
      continue;
    }

    const reference = (pharmacy.documents ?? []).find(
      (item) => item.id === documentId
    );

    if (
      !reference ||
      reference.name !== file.name ||
      reference.size !== file.size ||
      reference.type !== file.type ||
      reference.sha256 !== file.sha256
    ) {
      skip('No exact registration file reference in the pharmacy profile');

      continue;
    }

    try {
      const verified = decodeAndVerifyDocumentUpload(
        {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: `data:${file.type};base64,${Buffer.from(file.content).toString('base64')}`,
        },

        PHARMACY_OWNER_DOCUMENT_RULES
      );

      if (
        verified.sha256 !== file.sha256 ||
        createHash('sha256').update(file.content).digest('hex') !== file.sha256
      ) {
        skip('Source SHA-256 mismatch');

        continue;
      }
    } catch {
      skip(
        'Source file failed size, extension or MIME/content integrity checks'
      );

      continue;
    }

    const existing = await PharmacyOwnerDocument.findById(file._id).select(
      '+content'
    );

    if (existing) {
      if (matchesOriginal(existing, file, pharmacy.ownerId)) {
        result.alreadyCopied += 1;
      } else {
        skip(
          'Conflicting destination ID or destination checksum/owner/content'
        );
      }

      continue;
    }

    const otherDocuments = await PharmacyOwnerDocument.find({
      ownerUserId: pharmacy.ownerId,
    })
      .select('size')
      .lean<Array<{ size: number }>>();

    const existingBytes = otherDocuments.reduce(
      (sum, doc) => sum + doc.size,
      0
    );

    const ownerKey = String(pharmacy.ownerId);
    const reserved = planned.get(ownerKey) ?? { count: 0, bytes: 0 };

    if (
      otherDocuments.length + reserved.count >=
        PHARMACY_OWNER_DOCUMENT_RULES.maxFiles ||
      existingBytes + reserved.bytes + file.size >
        PHARMACY_OWNER_DOCUMENT_RULES.maxTotalSizeBytes
    ) {
      skip('Owner documents quota exceeded; requires manual review');

      continue;
    }

    result.eligible += 1;

    if (!apply) {
      planned.set(ownerKey, {
        count: reserved.count + 1,
        bytes: reserved.bytes + file.size,
      });

      continue;
    }

    // Never move/delete the legacy PharmacyDocumentFile or its pharmacy metadata.
    // Preserve the source _id: repeat runs detect a completed copy by identity.
    try {
      await PharmacyOwnerDocument.create({
        _id: file._id,
        ownerUserId: pharmacy.ownerId,
        uploadedByUserId: pharmacy.ownerId,
        registrationSourcePharmacyId: pharmacy._id,
        name: file.name,
        createdAt: file.createdAt,
        size: file.size,
        type: file.type,
        sha256: file.sha256,
        content: Buffer.from(file.content),
      });
    } catch (cause) {
      // A concurrent migration cannot silently replace destination content.
      const concurrent = await PharmacyOwnerDocument.findById(file._id).select(
        '+content'
      );

      if (concurrent && matchesOriginal(concurrent, file, pharmacy.ownerId)) {
        result.alreadyCopied += 1;

        continue;
      }

      throw cause;
    }

    const destination = await PharmacyOwnerDocument.findById(file._id).select(
      '+content'
    );

    if (!destination || !matchesOriginal(destination, file, pharmacy.ownerId)) {
      throw new Error(
        `Migration read-back validation failed for ${documentId}`
      );
    }

    result.copied += 1;
  }

  return result;
}
