import { createHash } from 'node:crypto';
import { Types, type ClientSession } from 'mongoose';

import { HTTP_STATUS } from '../../../constants/http/httpStatus';

import { AdminAuditLog } from '../../../models/audit/adminAuditLog.model';
import { AdminAuditPhoto } from '../../../models/audit/adminAuditPhoto.model';
import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';

import { httpError } from '../../../utils/http/httpError';
import { buildPharmacyAuditScopeFilter } from './admin-audit-filters';

//===================================================================

export type AuditPhotoSide = 'before' | 'after';

//===================================================================

// Uploaded pharmacy pictures are limited to 450 KiB by the shared validation.
// Check their type and canonical encoding again before persisting the archive.
const MAX_PHOTO_BYTES = 450 * 1024;

const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

//===================================================================

type MimeType = (typeof MIME_TYPES)[number];

//===================================================================

export function decodeAuditPharmacyPhoto(
  url: string | null | undefined
): { mimeType: MimeType; content: Buffer } | null {
  if (!url || url.length > 650_000) return null;

  const match =
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(
      url
    );

  if (!match) return null;

  const content = Buffer.from(match[2], 'base64');

  if (
    content.length === 0 ||
    content.length > MAX_PHOTO_BYTES ||
    content.toString('base64') !== match[2]
  )
    return null;

  const mimeType = match[1].toLowerCase() as MimeType;

  return { mimeType, content };
}

//===================================================================

export async function appendAuditPharmacyPhotos(input: {
  auditLogId: Types.ObjectId;
  before?: string | null;
  after?: string | null;
  session: ClientSession;
}): Promise<void> {
  const photos = (['before', 'after'] as const).flatMap((side) => {
    const decoded = decodeAuditPharmacyPhoto(input[side]);

    return decoded ? [{ auditLogId: input.auditLogId, side, ...decoded }] : [];
  });

  if (!photos.length) return;

  await AdminAuditPhoto.create(photos, { session: input.session });
}

//===================================================================

export async function getAdminAuditPhotoSides(
  auditLogId: Types.ObjectId
): Promise<AuditPhotoSide[]> {
  const photos = await AdminAuditPhoto.find({ auditLogId })
    .select('side -_id')
    .lean<Array<{ side: AuditPhotoSide }>>();

  return photos.map((photo) => photo.side);
}

//===================================================================

type PhotoSourceRecord = {
  imageUrl?: string | null;
  pendingModeration?: { imageUrl?: string | null } | null;
};

//===================================================================

// Legacy audit entries did not archive image bytes. Recover a preview only
// while an exactly matching data URL still exists in published or pending
// pharmacy data. Comparing the fingerprint prevents presenting a newer photo
// as historical evidence.
export function matchingLegacyAuditPhoto(
  pharmacy: PhotoSourceRecord | null,
  fingerprint: unknown
): { mimeType: MimeType; content: Buffer } | null {
  if (
    !pharmacy ||
    typeof fingerprint !== 'string' ||
    !/^[a-f0-9]{16}$/i.test(fingerprint)
  ) {
    return null;
  }

  for (const url of [pharmacy.imageUrl, pharmacy.pendingModeration?.imageUrl]) {
    if (!url) continue;

    if (
      createHash('sha256').update(url).digest('hex').slice(0, 16) !==
      fingerprint
    )
      continue;

    const photo = decodeAuditPharmacyPhoto(url);

    if (photo) return photo;
  }

  return null;
}

//===================================================================

async function getCurrentPhotoSources(
  pharmacyId: string
): Promise<PhotoSourceRecord | null> {
  if (!Types.ObjectId.isValid(pharmacyId)) return null;

  return Pharmacy.findById(pharmacyId)
    .select('imageUrl pendingModeration.imageUrl')
    .lean<PhotoSourceRecord | null>();
}

//===================================================================

export async function getRecoverableLegacyAuditPhotoSides(
  pharmacyId: string,
  fingerprints: Readonly<{ before: unknown; after: unknown }>,
  archivedSides: readonly AuditPhotoSide[]
): Promise<AuditPhotoSide[]> {
  if (
    archivedSides.length === 2 ||
    (!fingerprints.before && !fingerprints.after)
  )
    return [];

  const pharmacy = await getCurrentPhotoSources(pharmacyId);

  return (['before', 'after'] as const).filter(
    (side) =>
      !archivedSides.includes(side) &&
      matchingLegacyAuditPhoto(pharmacy, fingerprints[side]) !== null
  );
}

//===================================================================

export async function getAdminAuditPhotoService(
  auditLogId: string,
  side: AuditPhotoSide,
  pharmacyId?: string
): Promise<{ mimeType: MimeType; content: Buffer }> {
  if (
    !Types.ObjectId.isValid(auditLogId) ||
    (pharmacyId && !Types.ObjectId.isValid(pharmacyId))
  ) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Historical pharmacy photo was not found.'
    );
  }

  // The exact scoped audit record must exist before we read any photo bytes.
  const log = await AdminAuditLog.findOne({
    _id: new Types.ObjectId(auditLogId),
    ...(pharmacyId ? buildPharmacyAuditScopeFilter(pharmacyId) : {}),
    entityType: 'pharmacy',
    changedFields: 'photoFingerprint',
  })
    .select('entityId before after')
    .lean<{
      entityId: string;
      before: Record<string, unknown>;
      after: Record<string, unknown>;
    } | null>();

  if (!log) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Historical pharmacy photo was not found.'
    );
  }

  const photo = await AdminAuditPhoto.findOne({
    auditLogId: new Types.ObjectId(auditLogId),
    side,
  }).select('mimeType content');

  if (photo && MIME_TYPES.includes(photo.mimeType)) {
    return { mimeType: photo.mimeType, content: Buffer.from(photo.content) };
  }

  const legacyPhoto = matchingLegacyAuditPhoto(
    await getCurrentPhotoSources(log.entityId),

    log[side]?.photoFingerprint
  );

  if (legacyPhoto) return legacyPhoto;

  throw httpError(
    HTTP_STATUS.NOT_FOUND,
    'Historical pharmacy photo was not found.'
  );
}
