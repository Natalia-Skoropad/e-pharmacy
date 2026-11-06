import { randomUUID } from 'node:crypto';
import mongoose, { Types, type ClientSession } from 'mongoose';

import {
  ADMIN_AUDIT_ENTITY_TYPES,
  CLIENT_COMMENT_AUDIT_EVENTS,
} from '../../constants/admin/audit/admin-audit';

import {
  USER_ROLES,
  USER_STATUSES,
  PHARMACY_STATUSES,
} from '../../constants/auth/auth';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { Order } from '../../models/orders/order.model';
import { PharmacyNote } from '../../models/pharmacies/pharmacyNote.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { User } from '../../models/accounts/user.model';

import type { CreatePharmacyNoteInput } from '../../schemas/pharmacies/pharmacy-note.schema';
import type { PharmacyInternalNotesActor } from '../pharmacies/pharmacy-membership.service';

import {
  canPharmacyMembershipUseCapability,
  listUserPharmacyMemberships,
} from '../pharmacies/pharmacy-membership.service';

import { appendAdminAuditLog } from '../admin/audit/admin-audit-write.service';

import { hasMongoDuplicateKeyCode } from '../../utils/database/mongoError';
import { httpError } from '../../utils/http/httpError';

//===============================================================

/**
 * Client-card comments belong to the pharmacy OWNER, not to an individual
 * pharmacy. Any user who can read this client's record can read and manage
 * its comments. Memberships establish access; the selected pharmacy does not.
 */
async function resolveClientNoteScope(
  actor: PharmacyInternalNotesActor,
  clientId: string
) {
  if (actor.role !== USER_ROLES.PHARMACY || !Types.ObjectId.isValid(clientId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found.');
  }

  // Reuse the Clients permission (not the pharmacy internal-notes permission).
  // An employee without Clients access must not read or mutate these notes.
  const memberships = await listUserPharmacyMemberships(actor.id);

  const eligibleIds = memberships.pharmacies
    .filter(
      (member) =>
        member.membershipRole &&
        member.status !== PHARMACY_STATUSES.BLOCKED &&
        canPharmacyMembershipUseCapability(
          member.membershipRole,
          'read_clients'
        )
    )
    .map((member) => new Types.ObjectId(member.id));

  // A Clients grant establishes the owner's tenant. It does NOT limit the
  // comments to the member's selected/assigned pharmacy. The client record
  // and owner relationship below remain mandatory to prevent cross-owner reads.
  const granted = await Pharmacy.find({
    _id: { $in: eligibleIds },
    status: { $ne: PHARMACY_STATUSES.BLOCKED },
    $or: [{ ownerId: actor.id }, { managerUserIds: actor.id }],
  })
    .select('ownerId')
    .lean<Array<{ ownerId: Types.ObjectId }>>();

  const grantedOwnerIds = [
    ...new Set(granted.map((item) => String(item.ownerId))),
  ];

  const activeOwners = await User.find({
    _id: { $in: grantedOwnerIds },
    role: USER_ROLES.PHARMACY,
    status: { $ne: USER_STATUSES.BLOCKED },
  })
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();

  const accessible = await Pharmacy.find({
    ownerId: { $in: activeOwners.map((item) => item._id) },
    status: { $ne: PHARMACY_STATUSES.BLOCKED },
  })
    .select('_id ownerId')
    .lean<
      Array<{
        _id: Types.ObjectId;
        ownerId: Types.ObjectId;
      }>
    >();

  const accessibleIds = accessible.map((item) => item._id);

  const client = await User.findOne({ _id: clientId, role: USER_ROLES.CLIENT })
    .select('isDefaultPharmacyClient defaultClientPharmacyId')
    .lean<{
      isDefaultPharmacyClient?: boolean;
      defaultClientPharmacyId?: Types.ObjectId;
    } | null>();

  if (!client) throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found.');

  // Walk-in clients are permanently tied to their single pharmacy.
  // Never fall back to other pharmacies if that binding is missing.
  const defaultPharmacyId = client.defaultClientPharmacyId;

  const relatedIds = client.isDefaultPharmacyClient
    ? defaultPharmacyId
      ? accessibleIds.filter((id) => id.equals(defaultPharmacyId))
      : []
    : ((await Order.distinct('pharmacyId', {
        pharmacyId: { $in: accessibleIds },
        userId: new Types.ObjectId(clientId),
      })) as Types.ObjectId[]);

  if (!relatedIds.length) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Client was not found in accessible pharmacies.'
    );
  }

  const relatedIdSet = new Set(relatedIds.map(String));

  const relatedPharmacies = accessible.filter((item) =>
    relatedIdSet.has(String(item._id))
  );

  const ownerIdsForClient = [
    ...new Set(relatedPharmacies.map((item) => String(item.ownerId))),
  ];

  // The owner can always resolve their own tenant. Employees normally belong
  // to one owner; if a user serves two owners who both have the same client,
  // do not silently merge private notes across businesses.
  const ownerId = ownerIdsForClient.includes(actor.id)
    ? actor.id
    : ownerIdsForClient.length === 1
      ? ownerIdsForClient[0]!
      : null;

  if (!ownerId) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Client is shared by multiple owners; the owner context is ambiguous.'
    );
  }

  return {
    ownerObjectId: new Types.ObjectId(ownerId),
    clientObjectId: new Types.ObjectId(clientId),

    // Read preexisting pharmacy-scoped client comments without losing data.
    // All NEW client-card comments are stored by ownerId alone.
    legacyPharmacyIds: relatedPharmacies
      .filter((item) => String(item.ownerId) === ownerId)
      .map((item) => item._id),
  };
}

//===============================================================

type LeanClientNote = {
  _id: Types.ObjectId;
  text: string;
  createdAt: Date;
  createdBy: Types.ObjectId;
  authorDisplayName?: string;
  pharmacyId?: Types.ObjectId;
  ownerId?: Types.ObjectId;
};

//===============================================================

function serializeClientNote(note: LeanClientNote, avatar?: string) {
  return {
    id: String(note._id),
    text: note.text,
    createdAt: note.createdAt.toISOString(),

    author: {
      userId: String(note.createdBy),
      displayName: note.authorDisplayName?.trim() || 'Pharmacy member',
      ...(avatar ? { pictureUrl: avatar } : {}),
    },
  };
}

//===============================================================

type ClientCardNoteScope = Awaited<ReturnType<typeof resolveClientNoteScope>>;

//===============================================================

function noteFilter(scope: ClientCardNoteScope) {
  return {
    entityType: 'client' as const,
    entityId: scope.clientObjectId,

    $or: [
      { ownerId: scope.ownerObjectId },
      // Compatibility for comments saved by earlier stages. Only notes from
      // pharmacies of the authorized owner are considered.
      {
        ownerId: { $exists: false },
        pharmacyId: { $in: scope.legacyPharmacyIds },
      },
    ],
  };
}

//===============================================================

function ownerNoteReplayFilter(
  scope: ClientCardNoteScope,
  actorId: string,
  key: string
) {
  return {
    ownerId: scope.ownerObjectId,
    entityType: 'client' as const,
    entityId: scope.clientObjectId,
    createdBy: new Types.ObjectId(actorId),
    clientRequestId: key,
  };
}

//===============================================================

export async function getClientCardNotesService(
  actor: PharmacyInternalNotesActor,
  clientId: string,
  page: number,
  perPage: number
) {
  const scope = await resolveClientNoteScope(actor, clientId);
  const filter = noteFilter(scope);
  const total = await PharmacyNote.countDocuments(filter);
  const totalPages = Math.ceil(total / perPage);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const notes = await PharmacyNote.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip((safePage - 1) * perPage)
    .limit(perPage)
    .lean<LeanClientNote[]>();

  const authorIds = [...new Set(notes.map((note) => String(note.createdBy)))];

  const authors = await User.find({ _id: { $in: authorIds } })
    .select('_id pictureUrl')
    .lean<Array<{ _id: Types.ObjectId; pictureUrl?: string }>>();

  const avatars = new Map(
    authors.map((author) => [String(author._id), author.pictureUrl])
  );

  return {
    items: notes.map((note) =>
      serializeClientNote(note, avatars.get(String(note.createdBy)))
    ),

    page: safePage,
    perPage,
    total,
    totalPages,
  };
}

//===============================================================

/** Metadata-only activity. Comment text never enters an administrator-visible audit. */
async function appendClientCommentActivity(input: {
  actorId: string;
  noteId: string;
  clientId: string;
  ownerId: string;
  created: boolean;
  requestId: string;
  session?: ClientSession;
}) {
  const snapshot = {
    exists: true,
    clientId: input.clientId,
    actorId: input.actorId,
  };

  // The action, section and entity type are a single registered contract.
  // This event stays in the owner's activity log, under the Clients section.
  const auditEvent = input.created
    ? CLIENT_COMMENT_AUDIT_EVENTS.CREATED
    : CLIENT_COMMENT_AUDIT_EVENTS.DELETED;

  await appendAdminAuditLog({
    actorUserId: input.actorId,
    ...auditEvent,
    entityId: input.noteId,
    entityLabel: 'Client comment',
    scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
    scopeEntityId: input.ownerId,

    // No pharmacyId: these notes are shared across the owner's Clients section.
    before: input.created ? { exists: false } : snapshot,
    after: input.created ? snapshot : { exists: false },
    changedFields: ['exists', 'clientId', 'actorId'],
    requestId: input.requestId,
    session: input.session,
  });
}

//===============================================================

/** Use a database transaction only if MongoDB supports it. Standalone MongoDB
 * allows ordinary writes but rejects the transaction sequence; the previous
 * fallback still tried to write with a newly-created ClientSession. For the
 * standalone path we intentionally use normal model operations (matching
 * existing pharmacy comments), compensating a note write if auditing fails.
 *
 * This check is performed for mutations only, not for read-only requests.
 */
async function supportsClientNoteTransactions(): Promise<boolean> {
  const database = mongoose.connection.db;

  if (!database) return false;

  try {
    const hello = await database.admin().command({ hello: 1 });

    return Boolean(hello.setName || hello.msg === 'isdbgrid');
  } catch {
    // Treat an unknown topology conservatively and use compensating writes.
    return false;
  }
}

//===============================================================

function isUnsupportedMongoTransaction(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const code = (error as Error & { code?: number }).code;

  return (
    (code === 20 || code === 263 || code === 303 || code === undefined) &&
    /(?:transaction numbers are only allowed|transactions? (?:are|is) not supported|not supported in a transaction|cannot create namespace.*transaction|replica set member or mongos)/i.test(
      error.message
    )
  );
}

//===============================================================

/** Do not log the note text, request payload, or raw MongoDB validation errors. */
function logClientNoteMutationError(
  operation: 'create' | 'delete',
  phase: string,
  error: unknown
): void {
  const issue =
    error && typeof error === 'object'
      ? (error as { name?: string; code?: string | number })
      : null;

  console.error('[client-note-mutation]', {
    operation,
    phase,
    errorName: issue?.name ?? 'UnknownError',
    errorCode: issue?.code ?? null,

    // Only internal fixed-format validation text. Never log raw DB errors,
    // because they may contain private comment content.
    auditValidation:
      error instanceof TypeError &&
      (/^Audit [a-zA-Z ]+(?:invalid|unsafe|forbidden|too large|must be)/.test(
        error.message
      ) ||
        error.message === 'Audit action, section, or entity type is invalid.' ||
        /^Cannot read properties of (?:undefined|null) \(reading 'trim'\)$/.test(
          error.message
        ))
        ? error.message
        : undefined,
  });
}

//===============================================================

async function runClientNoteMutation(
  mutation: (
    session: ClientSession | undefined,
    compensate: boolean
  ) => Promise<void>
): Promise<void> {
  if (!(await supportsClientNoteTransactions())) {
    await mutation(undefined, true);

    return;
  }

  const session = await mongoose.startSession();

  let useCompensation = false;

  try {
    try {
      await session.withTransaction(() => mutation(session, false));
    } catch (error) {
      if (!isUnsupportedMongoTransaction(error)) throw error;
      useCompensation = true;
    }
  } finally {
    await session.endSession();
  }

  if (useCompensation) await mutation(undefined, true);
}

//===============================================================

export async function createClientCardNoteService(
  actor: PharmacyInternalNotesActor,
  clientId: string,
  input: CreatePharmacyNoteInput
) {
  const scope = await resolveClientNoteScope(actor, clientId);
  const text = input.text.trim();

  const replayFilter = ownerNoteReplayFilter(
    scope,
    actor.id,
    input.clientRequestId
  );

  const replay = await PharmacyNote.findOne(
    replayFilter
  ).lean<LeanClientNote | null>();

  if (replay) {
    if (replay.text !== text)
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Comment request key was already used for different content.'
      );

    return { note: serializeClientNote(replay) };
  }

  const author = await User.findById(actor.id)
    .select('name email pictureUrl')
    .lean<{ name?: string; email?: string; pictureUrl?: string } | null>();

  const authorDisplayName =
    author?.name?.trim() || author?.email?.trim() || 'Pharmacy member';

  let result: ReturnType<typeof serializeClientNote> | null = null;

  try {
    await runClientNoteMutation(async (session, compensate) => {
      const existing = await PharmacyNote.findOne(replayFilter)
        .session(session ?? null)
        .lean<LeanClientNote | null>();

      if (existing) {
        if (existing.text !== text)
          throw httpError(
            HTTP_STATUS.CONFLICT,
            'Comment request key was already used for different content.'
          );

        result = serializeClientNote(existing);

        return;
      }

      const [note] = await PharmacyNote.create(
        [
          {
            ownerId: scope.ownerObjectId,
            entityType: 'client',
            entityId: scope.clientObjectId,
            createdBy: new Types.ObjectId(actor.id),
            text,
            authorDisplayName,
            clientRequestId: input.clientRequestId,
          },
        ],

        session ? { session } : {}
      );

      try {
        await appendClientCommentActivity({
          actorId: actor.id,
          noteId: String(note._id),
          clientId,
          ownerId: String(scope.ownerObjectId),
          created: true,
          requestId: input.clientRequestId,
          session,
        });
      } catch (error) {
        logClientNoteMutationError('create', 'owner-audit', error);

        if (compensate) {
          // Standalone MongoDB has no rollback: remove the unaudited note.
          try {
            await PharmacyNote.deleteOne({
              _id: note._id,
              ...replayFilter,
            }).session(session ?? null);
          } catch (rollbackError) {
            logClientNoteMutationError('create', 'rollback', rollbackError);
          }
        }
        throw error;
      }

      result = serializeClientNote(note as LeanClientNote, author?.pictureUrl);
    });
  } catch (error) {
    if (!hasMongoDuplicateKeyCode(error)) {
      logClientNoteMutationError('create', 'write-or-audit', error);
      throw error;
    }

    const existing = await PharmacyNote.findOne(
      replayFilter
    ).lean<LeanClientNote | null>();

    if (!existing) throw error;

    if (existing.text !== text)
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Comment request key was already used for different content.'
      );

    return { note: serializeClientNote(existing) };
  }

  if (!result)
    throw httpError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Comment could not be created.'
    );

  return { note: result };
}

//===============================================================

export async function deleteClientCardNoteService(
  actor: PharmacyInternalNotesActor,
  clientId: string,
  noteId: string
) {
  const scope = await resolveClientNoteScope(actor, clientId);

  try {
    await runClientNoteMutation(async (session, compensate) => {
      const deleted = await PharmacyNote.findOneAndDelete(
        {
          _id: noteId,
          ...noteFilter(scope),
        },
        session ? { session } : {}
      );

      if (!deleted)
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Comment was not found.');

      try {
        await appendClientCommentActivity({
          actorId: actor.id,
          noteId,
          clientId,
          ownerId: String(scope.ownerObjectId),
          created: false,
          requestId: randomUUID(),
          session,
        });
      } catch (error) {
        logClientNoteMutationError('delete', 'owner-audit', error);

        if (compensate) {
          // Restore the exact deleted note when the required audit fails.
          try {
            await PharmacyNote.collection.insertOne(deleted.toObject());
          } catch (rollbackError) {
            logClientNoteMutationError('delete', 'rollback', rollbackError);
          }
        }

        throw error;
      }
    });
  } catch (error) {
    logClientNoteMutationError('delete', 'write-or-audit', error);

    throw error;
  }

  return { message: 'Comment deleted successfully.' };
}
