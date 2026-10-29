import { Types, type ClientSession } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PharmacyPaymentIdentifier } from '../../models/pharmacies/pharmacyPaymentIdentifier.model';

import type { PharmacyEntity } from '../../types/pharmacies/pharmacy';

import { hasMongoDuplicateKeyCode } from '../../utils/database/mongoError';
import { httpError } from '../../utils/http/httpError';

//===================================================================

export const UNIQUE_PAYMENT_FIELDS = ['taxId', 'iban', 'receiptEmail'] as const;

export type UniquePaymentField = (typeof UNIQUE_PAYMENT_FIELDS)[number];
export type PaymentValues = Partial<Record<UniquePaymentField, string | null>>;

//===================================================================

export const normalizePaymentIdentifier = (
  field: UniquePaymentField,
  raw: string
) =>
  field === 'receiptEmail'
    ? raw.trim().toLowerCase()
    : raw.trim().toUpperCase();

//===================================================================

const identifierKey = (field: UniquePaymentField, value: string) =>
  `${field}:${normalizePaymentIdentifier(field, value)}`;

//===================================================================

/** Includes published AND proposed values across ALL owners, except the current pharmacy. */
export async function checkPaymentIdentifierDuplicates(
  pharmacyId: string | undefined,
  values: PaymentValues,
  session?: ClientSession
): Promise<Partial<Record<UniquePaymentField, boolean>>> {
  const duplicates: Partial<Record<UniquePaymentField, boolean>> = {};

  for (const field of UNIQUE_PAYMENT_FIELDS) {
    const raw = values[field];

    if (!raw?.trim()) continue;

    const value = normalizePaymentIdentifier(field, raw);
    const key = identifierKey(field, value);
    // MongoDB does not support parallel queries sharing one transaction
    // session. Run these checks in order, then let the unique DB index
    // arbitrate any simultaneous writes from other requests.

    const existing = await Pharmacy.exists({
      ...(pharmacyId ? { _id: { $ne: new Types.ObjectId(pharmacyId) } } : {}),

      $or: [
        { [`bankDetails.${field}`]: value },
        { [`pendingModeration.bankDetails.${field}`]: value },
      ],
    }).session(session ?? null);

    const reservation = existing
      ? null
      : await PharmacyPaymentIdentifier.exists({
          key,

          ...(pharmacyId
            ? { pharmacyId: { $ne: new Types.ObjectId(pharmacyId) } }
            : {}),
        }).session(session ?? null);

    duplicates[field] = Boolean(existing || reservation);
  }

  return duplicates;
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

/** Atomically reserve all published/pending identifiers, releasing obsolete ones.
 * A unique DB index serializes concurrent requests from different owners.
 */
export async function syncPharmacyPaymentIdentifiers(
  pharmacy: PharmacyEntity & { _id: Types.ObjectId },
  session: ClientSession
) {
  const id = String(pharmacy._id);
  const keys = paymentIdentifiers(pharmacy);

  // Check every key, not only the most recent proposed value.
  for (const [key, field] of keys) {
    const value = key.slice(field.length + 1);
    const candidate: PaymentValues = {};

    candidate[field] = value;

    const conflicts = await checkPaymentIdentifierDuplicates(
      id,
      candidate,
      session
    );

    if (conflicts[field]) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        `${field} is already used by another pharmacy.`,
        { missingFields: [field] },
        'PHARMACY_PAYMENT_IDENTIFIER_DUPLICATE'
      );
    }

    try {
      await PharmacyPaymentIdentifier.updateOne(
        { key, pharmacyId: pharmacy._id },
        { $setOnInsert: { key, pharmacyId: pharmacy._id } },
        { upsert: true, session }
      );
    } catch (error) {
      if (!hasMongoDuplicateKeyCode(error)) throw error;

      throw httpError(
        HTTP_STATUS.CONFLICT,
        `${field} is already used by another pharmacy.`,
        { missingFields: [field] },
        'PHARMACY_PAYMENT_IDENTIFIER_DUPLICATE'
      );
    }
  }

  await PharmacyPaymentIdentifier.deleteMany({
    pharmacyId: pharmacy._id,
    key: { $nin: [...keys.keys()] },
  }).session(session);
}
