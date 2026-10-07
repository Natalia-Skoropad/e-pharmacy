import mongoose, { Types, type ClientSession } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../constants/admin-audit';

import { USER_ROLES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';
import { PharmacyOwnerAdminComment } from '../models/pharmacyOwnerAdminComment.model';
import { User } from '../models/user.model';
import type { CreatePharmacyOwnerAdminCommentInput } from '../schemas/pharmacy-owner-admin-comment.schema';
import type { PharmacyOwnerAdminCommentDto } from '../types/pharmacy-owner-admin-comment';
import { httpError } from '../utils/httpError';
import { appendAdminAuditLog } from './admin-audit.service';

//===============================================================

type CommentRecord = Readonly<{
  _id: Types.ObjectId;
  ownerUserId: Types.ObjectId;
  text: string;
  createdByAdminUserId: Types.ObjectId;
  authorNameSnapshot: string;
  createdAt: Date;
}>;

//===============================================================

function serializeComment(
  comment: CommentRecord
): PharmacyOwnerAdminCommentDto {
  return {
    id: String(comment._id),
    ownerUserId: String(comment.ownerUserId),
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),

    author: {
      userId: String(comment.createdByAdminUserId),
      displayName: comment.authorNameSnapshot,
    },
  };
}

//===============================================================

function auditSnapshot(comment: CommentRecord) {
  return {
    exists: true,
    ownerUserId: String(comment.ownerUserId),
    text: comment.text,
    createdByAdminUserId: String(comment.createdByAdminUserId),
    authorName: comment.authorNameSnapshot,
    createdAt: comment.createdAt.toISOString(),
  };
}

//===============================================================

async function assertOwnerAccount(
  ownerUserId: string,
  session?: ClientSession
): Promise<void> {
  if (!Types.ObjectId.isValid(ownerUserId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy owner was not found.');
  }

  const query = User.exists({
    _id: ownerUserId,
    role: USER_ROLES.PHARMACY,
  });

  if (session) query.session(session);

  if (!(await query)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy owner was not found.');
  }
}

//===============================================================

async function resolveAdminAuthor(
  adminUserId: string,
  session: ClientSession
): Promise<{ _id: Types.ObjectId; name: string }> {
  if (!Types.ObjectId.isValid(adminUserId)) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Admin account was not found.');
  }

  const admin = await User.findOne({
    _id: adminUserId,
    role: USER_ROLES.ADMIN,
  })
    .select('_id name')
    .session(session)
    .lean<{ _id: Types.ObjectId; name: string } | null>();

  if (!admin) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Admin account was not found.');
  }

  return admin;
}

//===============================================================

async function findCommentReplay(
  adminUserId: string,
  clientRequestId: string,
  session?: ClientSession
): Promise<CommentRecord | null> {
  const query = PharmacyOwnerAdminComment.findOne({
    createdByAdminUserId: adminUserId,
    clientRequestId,
  }).select(
    '_id ownerUserId text createdByAdminUserId authorNameSnapshot createdAt'
  );

  if (session) query.session(session);

  return query.lean<CommentRecord | null>();
}

//===============================================================

function assertReplayMatches(
  comment: Pick<CommentRecord, 'ownerUserId' | 'text'>,
  ownerUserId: string,
  normalizedText: string
): void {
  if (
    String(comment.ownerUserId) !== ownerUserId ||
    comment.text !== normalizedText
  ) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Comment request key was already used for different content.'
    );
  }
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

export async function listPharmacyOwnerAdminCommentsService(
  ownerUserId: string
): Promise<PharmacyOwnerAdminCommentDto[]> {
  await assertOwnerAccount(ownerUserId);

  const comments = await PharmacyOwnerAdminComment.find({ ownerUserId })
    .select(
      '_id ownerUserId text createdByAdminUserId authorNameSnapshot createdAt'
    )
    .sort({ createdAt: -1, _id: -1 })
    .lean<CommentRecord[]>();

  return comments.map(serializeComment);
}

//===============================================================

export async function createPharmacyOwnerAdminCommentService(
  ownerUserId: string,
  adminUserId: string,
  input: CreatePharmacyOwnerAdminCommentInput,
  auditRequestId: string
): Promise<PharmacyOwnerAdminCommentDto> {
  await PharmacyOwnerAdminComment.init();

  const normalizedText = input.text.trim();
  const existing = await findCommentReplay(adminUserId, input.clientRequestId);

  if (existing) {
    assertReplayMatches(existing, ownerUserId, normalizedText);
    return serializeComment(existing);
  }

  const session = await mongoose.startSession();
  let result: PharmacyOwnerAdminCommentDto | null = null;
  let duplicateKeyError = false;

  try {
    await session.withTransaction(async () => {
      const replay = await findCommentReplay(
        adminUserId,
        input.clientRequestId,
        session
      );

      if (replay) {
        assertReplayMatches(replay, ownerUserId, normalizedText);
        result = serializeComment(replay);
        return;
      }

      await assertOwnerAccount(ownerUserId, session);
      const author = await resolveAdminAuthor(adminUserId, session);

      const [createdComment] = await PharmacyOwnerAdminComment.create(
        [
          {
            ownerUserId,
            text: normalizedText,
            createdByAdminUserId: author._id,
            authorNameSnapshot: author.name,
            clientRequestId: input.clientRequestId,
          },
        ],
        { session }
      );

      result = serializeComment(createdComment);

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_COMMENT_CREATED,
        section: ADMIN_AUDIT_SECTIONS.PHARMACY_OWNERS,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER_COMMENT,
        entityId: String(createdComment._id),
        entityLabel: 'Owner admin comment',
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
        scopeEntityId: ownerUserId,
        before: { exists: false },
        after: auditSnapshot(createdComment),

        changedFields: [
          'exists',
          'ownerUserId',
          'text',
          'createdByAdminUserId',
          'authorName',
          'createdAt',
        ],

        requestId: auditRequestId,
        session,
      });
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    duplicateKeyError = true;
  } finally {
    await session.endSession();
  }

  if (duplicateKeyError) {
    const replay = await findCommentReplay(adminUserId, input.clientRequestId);
    if (!replay) {
      throw new Error(
        'Owner comment idempotency replay could not be resolved.'
      );
    }

    assertReplayMatches(replay, ownerUserId, normalizedText);
    return serializeComment(replay);
  }

  if (!result) {
    throw new Error('Owner comment transaction did not commit.');
  }

  return result;
}

//===============================================================

export async function deletePharmacyOwnerAdminCommentService(
  ownerUserId: string,
  commentId: string,
  adminUserId: string,
  auditRequestId: string
): Promise<void> {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await assertOwnerAccount(ownerUserId, session);
      await resolveAdminAuthor(adminUserId, session);

      const comment = await PharmacyOwnerAdminComment.findOneAndDelete(
        {
          _id: commentId,
          ownerUserId,
        },
        { session }
      );

      if (!comment) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Owner comment was not found.');
      }

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_COMMENT_DELETED,
        section: ADMIN_AUDIT_SECTIONS.PHARMACY_OWNERS,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER_COMMENT,
        entityId: String(comment._id),
        entityLabel: 'Owner admin comment',
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
        scopeEntityId: ownerUserId,
        before: auditSnapshot(comment),
        after: { exists: false },

        changedFields: [
          'exists',
          'ownerUserId',
          'text',
          'createdByAdminUserId',
          'authorName',
          'createdAt',
        ],

        requestId: auditRequestId,
        session,
      });
    });
  } finally {
    await session.endSession();
  }
}
