import mongoose, { Types, type ClientSession } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../../../constants/admin/audit/admin-audit';

import { USER_ROLES } from '../../../constants/auth/auth';
import { HTTP_STATUS } from '../../../constants/http/httpStatus';

import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';
import { PharmacyAdminComment } from '../../../models/admin/comments/pharmacyAdminComment.model';
import { User } from '../../../models/accounts/user.model';

import type { CreatePharmacyAdminCommentInput } from '../../../schemas/admin/pharmacies/pharmacy-admin-comment.schema';
import type { PharmacyAdminCommentDto } from '../../../types/admin/pharmacies/pharmacy-admin-comment';

import { httpError } from '../../../utils/httpError';
import { appendAdminAuditLog } from '../audit/admin-audit-write.service';

import { hasMongoDuplicateKeyCode } from '../../../utils/mongoError';

//===================================================================

// Intentionally distinct from PharmacyNote and PharmacyOwnerAdminComment.
type CommentRecord = Readonly<{
  _id: Types.ObjectId;
  pharmacyId: Types.ObjectId;
  text: string;
  createdByAdminUserId: Types.ObjectId;
  authorNameSnapshot: string;
  createdAt: Date;
}>;

//===================================================================

function serialize(
  comment: CommentRecord,
  pictureUrl?: string
): PharmacyAdminCommentDto {
  return {
    id: String(comment._id),
    pharmacyId: String(comment.pharmacyId),
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),

    author: {
      userId: String(comment.createdByAdminUserId),
      displayName: comment.authorNameSnapshot,
      ...(pictureUrl ? { pictureUrl } : {}),
    },
  };
}

//===================================================================

// Audit deliberately excludes the private body; snapshots must not form a
// second, less restricted comment datastore.
function auditMetadata(comment: CommentRecord) {
  return {
    exists: true,
    pharmacyId: String(comment.pharmacyId),
    createdByAdminUserId: String(comment.createdByAdminUserId),
    authorName: comment.authorNameSnapshot,
    createdAt: comment.createdAt.toISOString(),
  };
}

//===================================================================

const auditFields = [
  'exists',
  'pharmacyId',
  'createdByAdminUserId',
  'authorName',
  'createdAt',
] as const;

//===================================================================

async function assertPharmacy(pharmacyId: string, session?: ClientSession) {
  if (!Types.ObjectId.isValid(pharmacyId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found.');
  }

  const query = Pharmacy.exists({ _id: pharmacyId });

  if (session) query.session(session);

  if (!(await query))
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found.');
}

//===================================================================

async function resolveAuthor(adminUserId: string, session: ClientSession) {
  if (!Types.ObjectId.isValid(adminUserId)) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Admin account was not found.');
  }

  const author = await User.findOne({
    _id: adminUserId,
    role: USER_ROLES.ADMIN,
  })
    .select('_id name')
    .session(session)
    .lean<{ _id: Types.ObjectId; name: string } | null>();

  if (!author)
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Admin account was not found.');

  return author;
}

//===================================================================

function findReplay(
  adminUserId: string,
  clientRequestId: string,
  session?: ClientSession
) {
  const query = PharmacyAdminComment.findOne({
    createdByAdminUserId: adminUserId,
    clientRequestId,
  }).select(
    '_id pharmacyId text createdByAdminUserId authorNameSnapshot createdAt'
  );

  if (session) query.session(session);

  return query.lean<CommentRecord | null>();
}

//===================================================================

function assertReplayMatches(
  comment: CommentRecord,
  pharmacyId: string,
  text: string
) {
  if (String(comment.pharmacyId) !== pharmacyId || comment.text !== text) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Comment request key was already used for different content.'
    );
  }
}

//===================================================================

export async function listPharmacyAdminCommentsService(
  pharmacyId: string
): Promise<PharmacyAdminCommentDto[]> {
  await assertPharmacy(pharmacyId);

  const comments = await PharmacyAdminComment.find({ pharmacyId })
    .select(
      '_id pharmacyId text createdByAdminUserId authorNameSnapshot createdAt'
    )
    .sort({ createdAt: -1, _id: -1 })
    .lean<CommentRecord[]>();

  const authorIds = [
    ...new Set(comments.map((comment) => String(comment.createdByAdminUserId))),
  ];

  const authors = await User.find({ _id: { $in: authorIds } })
    .select('_id pictureUrl')
    .lean<Array<{ _id: Types.ObjectId; pictureUrl?: string }>>();

  const pictureById = new Map(
    authors.map((author) => [String(author._id), author.pictureUrl])
  );

  return comments.map((comment) =>
    serialize(comment, pictureById.get(String(comment.createdByAdminUserId)))
  );
}

//===================================================================

export async function createPharmacyAdminCommentService(
  pharmacyId: string,
  adminUserId: string,
  input: CreatePharmacyAdminCommentInput,
  auditRequestId: string
): Promise<PharmacyAdminCommentDto> {
  await PharmacyAdminComment.init(); // Unique idempotency index must exist before writes.

  const text = input.text.trim();
  const existing = await findReplay(adminUserId, input.clientRequestId);

  if (existing) {
    assertReplayMatches(existing, pharmacyId, text);

    return serialize(existing);
  }

  const session = await mongoose.startSession();

  let result: PharmacyAdminCommentDto | null = null;
  let duplicateKey = false;

  try {
    await session.withTransaction(async () => {
      const replay = await findReplay(
        adminUserId,
        input.clientRequestId,
        session
      );

      if (replay) {
        assertReplayMatches(replay, pharmacyId, text);
        result = serialize(replay);

        return;
      }

      await assertPharmacy(pharmacyId, session);

      const author = await resolveAuthor(adminUserId, session);

      const [created] = await PharmacyAdminComment.create(
        [
          {
            pharmacyId,
            text,
            createdByAdminUserId: author._id,
            authorNameSnapshot: author.name,
            clientRequestId: input.clientRequestId,
          },
        ],
        { session }
      );

      result = serialize(created);

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_COMMENT_CREATED,
        section: ADMIN_AUDIT_SECTIONS.PHARMACIES,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_COMMENT,
        entityId: String(created._id),
        entityLabel: 'Pharmacy admin comment',
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
        scopeEntityId: pharmacyId,
        before: { exists: false },
        after: auditMetadata(created),
        changedFields: auditFields,
        requestId: auditRequestId,
        session,
      });
    });
  } catch (error) {
    if (!hasMongoDuplicateKeyCode(error)) throw error;

    duplicateKey = true;
  } finally {
    await session.endSession();
  }

  if (duplicateKey) {
    const replay = await findReplay(adminUserId, input.clientRequestId);

    if (!replay)
      throw new Error(
        'Pharmacy comment idempotency replay could not be resolved.'
      );

    assertReplayMatches(replay, pharmacyId, text);

    return serialize(replay);
  }

  if (!result) throw new Error('Pharmacy comment transaction did not commit.');

  const saved: PharmacyAdminCommentDto = result;

  const author = await User.findById(adminUserId)
    .select('pictureUrl')
    .lean<{ pictureUrl?: string } | null>();

  return author?.pictureUrl
    ? { ...saved, author: { ...saved.author, pictureUrl: author.pictureUrl } }
    : saved;
}

//===================================================================

export async function deletePharmacyAdminCommentService(
  pharmacyId: string,
  commentId: string,
  adminUserId: string,
  auditRequestId: string
): Promise<void> {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await assertPharmacy(pharmacyId, session);
      await resolveAuthor(adminUserId, session);

      const comment = await PharmacyAdminComment.findOneAndDelete(
        { _id: commentId, pharmacyId },
        { session }
      );

      if (!comment)
        throw httpError(
          HTTP_STATUS.NOT_FOUND,
          'Pharmacy comment was not found.'
        );

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_COMMENT_DELETED,
        section: ADMIN_AUDIT_SECTIONS.PHARMACIES,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_COMMENT,
        entityId: String(comment._id),
        entityLabel: 'Pharmacy admin comment',
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
        scopeEntityId: pharmacyId,
        before: auditMetadata(comment),
        after: { exists: false },
        changedFields: auditFields,
        requestId: auditRequestId,
        session,
      });
    });
  } finally {
    await session.endSession();
  }
}
