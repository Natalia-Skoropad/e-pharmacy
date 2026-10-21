import { createHash } from 'node:crypto';

import mongoose, { Types, type ClientSession } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../constants/admin-audit';

import {
  PHARMACY_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from '../constants/auth';

import { HTTP_STATUS } from '../constants/httpStatus';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';

import type { CreatePharmacyDraftInput } from '../schemas/pharmacy.schema';
import type { MyPharmacyProfileResponseDto } from '../types/pharmacy';

import { httpError } from '../utils/httpError';
import { appendAdminAuditLog } from './admin-audit.service';
import { serializePharmacyProfile } from './pharmacy.service';

//===============================================================

type DraftCreationResult = Readonly<{
  pharmacy: MyPharmacyProfileResponseDto;
  replayed: boolean;
}>;

//===============================================================

/** Omit empty form inputs so a new draft contains only actual pharmacy data. */
function removeEmptyFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeEmptyFields);
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value !== 'object') return value;

  const fields = Object.entries(value)
    .map(([key, item]) => [key, removeEmptyFields(item)] as const)
    .filter(([, item]) => item !== undefined);

  return fields.length ? Object.fromEntries(fields) : undefined;
}

//===============================================================

function normalizeDraft(input: CreatePharmacyDraftInput) {
  const editable = Object.fromEntries(
    Object.entries(input).filter(([key]) => key !== 'clientRequestId')
  );

  const normalized = (removeEmptyFields(editable) ?? {}) as Record<string, unknown>;

  // Country code is managed by the backend, just as in pharmacy profile PATCH.
  if (normalized.location) {
    normalized.location = {
      ...(normalized.location as Record<string, unknown>),

      countryCode: 'UA',
    };
  }

  return normalized;
}

//===============================================================

function draftFingerprint(draft: Record<string, unknown>): string {
  // The strict Zod schema produces a deterministic field order, even if the
  // incoming JSON property order differs; never hash user-controlled ownerId.
  return createHash('sha256').update(JSON.stringify(draft)).digest('hex');
}

//===============================================================

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 11000
  );
}

//===============================================================

function assertSameCreation(
  pharmacy: { creationFingerprint?: string },
  fingerprint: string
): void {
  if (pharmacy.creationFingerprint !== fingerprint) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'This clientRequestId was already used for different pharmacy data.',
      undefined,

      'PHARMACY_CREATE_REQUEST_CONFLICT'
    );
  }
}

//===============================================================

async function assertCanCreatePharmacy(
  ownerUserId: string,
  session?: ClientSession
): Promise<void> {
  if (!Types.ObjectId.isValid(ownerUserId)) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Pharmacy owner access is forbidden.'
    );
  }

  const account = await User.findOne({
    _id: ownerUserId,
    role: USER_ROLES.PHARMACY,
    status: { $in: [USER_STATUSES.NEW, USER_STATUSES.ACTIVE] },
  })
    .select('_id')
    .session(session ?? null);

  if (!account) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Pharmacy owner access is forbidden.'
    );
  }

  // A user who is only a manager is not an owner. A registered owner with
  // zero pharmacies remains eligible to create the first one.
  const [owns, manages] = await Promise.all([
    Pharmacy.exists({ ownerId: ownerUserId }).session(session ?? null),
    Pharmacy.exists({ managerUserIds: ownerUserId }).session(session ?? null),
  ]);

  if (manages && !owns) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Pharmacy employees cannot create pharmacies.'
    );
  }
}

//===============================================================

// Fetch a replay only through the verified owner scope, never by UUID alone.
async function findReplay(
  ownerUserId: string,
  clientRequestId: string,
  fingerprint: string,
  session?: ClientSession
) {
  const pharmacy = await Pharmacy.findOne({
    ownerId: ownerUserId,
    creationRequestId: clientRequestId,
  }).session(session ?? null);

  if (pharmacy) assertSameCreation(pharmacy, fingerprint);

  return pharmacy;
}

//===============================================================

/** One DB transaction saves both the draft and its immutable creation audit. */
export async function createPharmacyDraftService(
  ownerUserId: string,
  input: CreatePharmacyDraftInput,
  auditRequestId: string
): Promise<DraftCreationResult> {
  const draft = normalizeDraft(input);
  const fingerprint = draftFingerprint(draft);

  // Fail closed if the required unique index does not exist or cannot be
  // installed (also works in deployments with autoIndex disabled).
  await Pharmacy.collection.createIndex(
    { ownerId: 1, creationRequestId: 1 },

    {
      name: 'pharmacy_owner_create_idempotency',
      unique: true,
      partialFilterExpression: { creationRequestId: { $type: 'string' } },
    }
  );

  await assertCanCreatePharmacy(ownerUserId);

  const existing = await findReplay(
    ownerUserId,
    input.clientRequestId,
    fingerprint
  );

  if (existing) {
    return {
      pharmacy: serializePharmacyProfile(existing, 'owner'),
      replayed: true,
    };
  }

  const session = await mongoose.startSession();

  let created: Awaited<ReturnType<typeof findReplay>> = null;
  let duplicate = false;

  try {
    await session.withTransaction(async () => {
      // Revalidate inside the transaction, including after account blocking.
      await assertCanCreatePharmacy(ownerUserId, session);

      const replay = await findReplay(
        ownerUserId,
        input.clientRequestId,
        fingerprint,
        session
      );

      if (replay) {
        created = replay;
        return;
      }

      const [pharmacy] = await Pharmacy.create(
        [
          {
            ...draft,
            ownerId: ownerUserId,
            status: PHARMACY_STATUSES.NEW,
            managerUserIds: [],
            createdBy: ownerUserId,
            creationRequestId: input.clientRequestId,
            creationFingerprint: fingerprint,
          },
        ],
        { session }
      );

      created = pharmacy;

      await appendAdminAuditLog({
        actorUserId: ownerUserId,
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_CREATED,
        section: ADMIN_AUDIT_SECTIONS.PHARMACIES,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
        entityId: String(pharmacy._id),
        entityLabel: pharmacy.name,
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
        scopeEntityId: ownerUserId,
        before: { exists: false },
        after: { exists: true, status: PHARMACY_STATUSES.NEW },
        changedFields: ['exists', 'status'],
        mutationKey: input.clientRequestId,
        requestId: auditRequestId,
        session,
      });
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    duplicate = true;
  } finally {
    await session.endSession();
  }

  if (duplicate) {
    // Another concurrent request won the unique index. Only replay committed
    // records with the identical payload; no second audit event is inserted.
    const winner = await findReplay(
      ownerUserId,
      input.clientRequestId,
      fingerprint
    );

    if (!winner) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Pharmacy creation is being completed. Retry with the same clientRequestId.',
        undefined,
        'PHARMACY_CREATE_RETRY'
      );
    }

    return {
      pharmacy: serializePharmacyProfile(winner, 'owner'),
      replayed: true,
    };
  }

  if (!created) {
    throw new Error('Pharmacy creation transaction did not commit.');
  }

  return {
    pharmacy: serializePharmacyProfile(created, 'owner'),
    replayed: false,
  };
}
