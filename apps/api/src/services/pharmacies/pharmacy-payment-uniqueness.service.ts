import { Types, type ClientSession } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PharmacyPaymentIdentifier } from '../../models/pharmacies/pharmacyPaymentIdentifier.model';

import type { PharmacyEntity } from '../../types/pharmacies/pharmacy';

import { hasMongoDuplicateKeyCode } from '../../utils/database/mongoError';
import { httpError } from '../../utils/http/httpError';

//===================================================================

export const UNIQUE_PAYMENT_FIELDS = ['taxId', 'iban', 'receiptEmail'] as const;
export const UNIQUE_CONTACT_FIELDS = ['phone', 'email'] as const;

//===================================================================

export type UniquePaymentField = (typeof UNIQUE_PAYMENT_FIELDS)[number];

type UniqueContactField = (typeof UNIQUE_CONTACT_FIELDS)[number];
type UniqueField = UniquePaymentField | UniqueContactField;

export type PaymentValues = Partial<Record<UniqueField, string | null>>;

//===================================================================

export const normalizePaymentIdentifier = (field: UniqueField, raw: string) =>
  field === 'receiptEmail' || field === 'email'
    ? raw.trim().toLowerCase()
    : field === 'phone'
      ? raw.trim()
      : raw.trim().toUpperCase();

//===================================================================

const identifierKey = (field: UniqueField, value: string) =>
  `${field}:${normalizePaymentIdentifier(field, value)}`;

//===================================================================

const fields = [...UNIQUE_PAYMENT_FIELDS, ...UNIQUE_CONTACT_FIELDS] as const;

//===================================================================

function fieldPaths(field: UniqueField): [string, string] {
  return field === 'phone' || field === 'email'
    ? [field, `pendingModeration.${field}`]
    : [`bankDetails.${field}`, `pendingModeration.bankDetails.${field}`];
}

//===================================================================

// Recover the owner of a reservation created before ownerId was persisted.
async function getReservationOwner(
  reservation: { ownerId?: Types.ObjectId; pharmacyId: Types.ObjectId },
  session?: ClientSession
): Promise<string | undefined> {
  if (reservation.ownerId) return String(reservation.ownerId);

  const pharmacy = await Pharmacy.findById(reservation.pharmacyId)
    .select('ownerId')
    .session(session ?? null);

  return pharmacy?.ownerId ? String(pharmacy.ownerId) : undefined;
}

//===================================================================

/** Reject values used by another OWNER; pharmacies of one owner can share them.
 * Published and pending moderation values participate in the same uniqueness check.
 * A global unique reservation key serializes concurrent requests by different owners.
 */
export async function checkPaymentIdentifierDuplicates(
  pharmacyId: string | undefined,
  values: PaymentValues,
  session?: ClientSession,
  ownerUserId?: string
): Promise<Partial<Record<UniqueField, boolean>>> {
  const duplicates: Partial<Record<UniqueField, boolean>> = {};

  let ownerId = ownerUserId;

  if (!ownerId && pharmacyId) {
    const pharmacy = await Pharmacy.findById(pharmacyId)
      .select('ownerId')
      .session(session ?? null);

    ownerId = pharmacy?.ownerId ? String(pharmacy.ownerId) : undefined;
  }

  for (const field of fields) {
    const raw = values[field];

    if (!raw?.trim()) continue;

    const value = normalizePaymentIdentifier(field, raw);
    const [publishedPath, pendingPath] = fieldPaths(field);

    // Queries sharing a Mongo session must run sequentially.
    const existing = await Pharmacy.exists({
      ...(ownerId
        ? { ownerId: { $ne: new Types.ObjectId(ownerId) } }
        : pharmacyId
          ? { _id: { $ne: new Types.ObjectId(pharmacyId) } }
          : {}),

      $or: [{ [publishedPath]: value }, { [pendingPath]: value }],
    }).session(session ?? null);

    const reservation = existing
      ? null
      : await PharmacyPaymentIdentifier.findOne({
          key: identifierKey(field, value),
        })
          .select('ownerId pharmacyId')
          .session(session ?? null);

    const reservationOwner = reservation
      ? await getReservationOwner(reservation, session)
      : undefined;

    duplicates[field] = Boolean(
      existing || (reservation && (!ownerId || reservationOwner !== ownerId))
    );
  }

  return duplicates;
}

//===================================================================

// Only reveal matches belonging to the authenticated owner. Never return
// another owner's pharmacy identity from the uniqueness preflight.
export async function findOwnPharmacyIdentifierMatches(
  ownerUserId: string,
  pharmacyId: string | undefined,
  values: PaymentValues
): Promise<
  Partial<
    Record<UniqueField, { id: string; name: string; imageUrl?: string }[]>
  >
> {
  const matches: Partial<
    Record<UniqueField, { id: string; name: string; imageUrl?: string }[]>
  > = {};

  for (const field of fields) {
    const raw = values[field];

    if (!raw?.trim()) continue;

    const value = normalizePaymentIdentifier(field, raw);
    const [publishedPath, pendingPath] = fieldPaths(field);

    const pharmacies = await Pharmacy.find({
      ownerId: new Types.ObjectId(ownerUserId),

      ...(pharmacyId ? { _id: { $ne: new Types.ObjectId(pharmacyId) } } : {}),

      $or: [{ [publishedPath]: value }, { [pendingPath]: value }],
    })
      .select('_id name imageUrl')
      .limit(10)
      .lean();

    if (pharmacies.length) {
      matches[field] = pharmacies.map((pharmacy) => ({
        id: String(pharmacy._id),
        name: pharmacy.name,

        ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
      }));
    }
  }

  return matches;
}

//===================================================================

export function paymentIdentifiers(
  pharmacy: Pick<PharmacyEntity, 'bankDetails' | 'pendingModeration'>
) {
  const values = new Map<string, UniquePaymentField>();

  for (const field of UNIQUE_PAYMENT_FIELDS) {
    for (const raw of [
      pharmacy.bankDetails?.[field],
      pharmacy.pendingModeration?.bankDetails?.[field],
    ]) {
      if (raw?.trim()) values.set(identifierKey(field, raw), field);
    }
  }

  return values;
}

//===================================================================

function allPharmacyIdentifiers(
  pharmacy: Pick<
    PharmacyEntity,
    'bankDetails' | 'pendingModeration' | 'phone' | 'email'
  >
): Map<string, UniqueField> {
  const identifiers: Map<string, UniqueField> = new Map(
    paymentIdentifiers(pharmacy)
  );

  for (const field of UNIQUE_CONTACT_FIELDS) {
    for (const raw of [pharmacy[field], pharmacy.pendingModeration?.[field]]) {
      if (raw?.trim()) identifiers.set(identifierKey(field, raw), field);
    }
  }

  return identifiers;
}

//===================================================================

// Call before starting a MongoDB transaction, including with autoIndex disabled.
// The model declares `key: { unique: true }`, which creates MongoDB's `key_1`
// index. Never request a second name for the same key specification: MongoDB
// rejects that with IndexOptionsConflict (85) even if both are unique.
// Existing documents are checked on every mutation for legacy compatibility.
let indexReady: Promise<void> | undefined;

//===================================================================

export async function ensurePharmacyPaymentUniqueIndex(): Promise<void> {
  if (!indexReady) {
    indexReady = (async () => {
      try {
        await PharmacyPaymentIdentifier.collection.createIndex(
          { key: 1 },
          { unique: true }
        );
      } catch (error) {
        // Older deployments may already have an equivalent index under a
        // different name. Reuse it only if MongoDB confirms that it protects
        // the entire key space (no sparse/partial/non-unique index).

        const isNameConflict =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error.code === 85 || error.code === 86);

        if (!isNameConflict) throw error;

        const indexes = await PharmacyPaymentIdentifier.collection.indexes();

        const compatible = indexes.some(
          (index) =>
            Object.keys(index.key).length === 1 &&
            index.key.key === 1 &&
            index.unique === true &&
            !index.sparse &&
            !index.partialFilterExpression &&
            (!index.collation || index.collation.locale === 'simple')
        );
        if (!compatible) throw error;
      }
    })().catch((error: unknown) => {
      indexReady = undefined;
      throw error;
    });
  }

  await indexReady;
}

//===================================================================

/** Reserve all contact/payment identifiers across owners, but allow one
 * owner's pharmacies to reuse values. Keep reservations when another pharmacy
 * belonging to the same owner still uses the value.
 */
export async function syncPharmacyPaymentIdentifiers(
  pharmacy: PharmacyEntity & { _id: Types.ObjectId },
  session: ClientSession
) {
  const id = String(pharmacy._id);
  const ownerId = String(pharmacy.ownerId);
  const keys = allPharmacyIdentifiers(pharmacy);

  for (const [key, field] of keys) {
    const value = key.slice(field.length + 1);
    const candidate: PaymentValues = { [field]: value };

    const conflicts = await checkPaymentIdentifierDuplicates(
      id,
      candidate,
      session,
      ownerId
    );

    if (conflicts[field]) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        `${field} is already used by a pharmacy belonging to another owner.`,
        { missingFields: [field] },
        'PHARMACY_PAYMENT_IDENTIFIER_DUPLICATE'
      );
    }

    const reservation = await PharmacyPaymentIdentifier.findOne({ key })
      .select('ownerId pharmacyId')
      .session(session);

    if (reservation) {
      if ((await getReservationOwner(reservation, session)) === ownerId)
        continue;

      throw httpError(
        HTTP_STATUS.CONFLICT,
        `${field} is reserved by another pharmacy owner.`,
        { missingFields: [field] },
        'PHARMACY_PAYMENT_IDENTIFIER_DUPLICATE'
      );
    }

    try {
      await PharmacyPaymentIdentifier.updateOne(
        { key },
        {
          $setOnInsert: {
            key,
            ownerId: pharmacy.ownerId,
            pharmacyId: pharmacy._id,
          },
        },
        { upsert: true, session }
      );
    } catch (error) {
      if (!hasMongoDuplicateKeyCode(error)) throw error;

      throw httpError(
        HTTP_STATUS.CONFLICT,
        `${field} is reserved by another pharmacy owner.`,
        { missingFields: [field] },
        'PHARMACY_PAYMENT_IDENTIFIER_DUPLICATE'
      );
    }
  }

  const obsolete = await PharmacyPaymentIdentifier.find({
    pharmacyId: pharmacy._id,
    key: { $nin: [...keys.keys()] },
  }).session(session);

  for (const reservation of obsolete) {
    const separator = reservation.key.indexOf(':');
    const field = reservation.key.slice(0, separator) as UniqueField;
    const value = reservation.key.slice(separator + 1);
    const [publishedPath, pendingPath] = fieldPaths(field);

    const other = await Pharmacy.findOne({
      _id: { $ne: pharmacy._id },
      ownerId: pharmacy.ownerId,
      $or: [{ [publishedPath]: value }, { [pendingPath]: value }],
    })
      .select('_id')
      .session(session);

    if (other) {
      await PharmacyPaymentIdentifier.updateOne(
        { _id: reservation._id },
        { $set: { pharmacyId: other._id, ownerId: pharmacy.ownerId } },
        { session }
      );
    } else {
      await PharmacyPaymentIdentifier.deleteOne({
        _id: reservation._id,
      }).session(session);
    }
  }
}

//===================================================================

/** Called after physically deleting a New draft in the same transaction. */
export async function releasePharmacyIdentifierReservations(
  pharmacyId: Types.ObjectId,
  ownerId: Types.ObjectId,
  session: ClientSession
): Promise<void> {
  const reservations = await PharmacyPaymentIdentifier.find({
    pharmacyId,
  }).session(session);

  for (const reservation of reservations) {
    const separator = reservation.key.indexOf(':');

    if (separator < 1) continue;

    const field = reservation.key.slice(0, separator) as UniqueField;
    const value = reservation.key.slice(separator + 1);
    const [publishedPath, pendingPath] = fieldPaths(field);

    const sibling = await Pharmacy.findOne({
      ownerId,
      $or: [{ [publishedPath]: value }, { [pendingPath]: value }],
    })
      .select('_id')
      .session(session);

    if (sibling) {
      await PharmacyPaymentIdentifier.updateOne(
        { _id: reservation._id },
        { $set: { pharmacyId: sibling._id, ownerId } },
        { session }
      );
    } else {
      await PharmacyPaymentIdentifier.deleteOne({
        _id: reservation._id,
      }).session(session);
    }
  }
}
