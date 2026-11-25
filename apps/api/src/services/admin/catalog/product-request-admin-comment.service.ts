import mongoose, { Types, type ClientSession } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../../../constants/admin/audit/admin-audit';

import { USER_ROLES } from '../../../constants/auth/auth';
import { HTTP_STATUS } from '../../../constants/http/httpStatus';

import { ProductRequest } from '../../../models/catalog/productRequest.model';
import { ProductRequestAdminComment } from '../../../models/admin/comments/productRequestAdminComment.model';
import { User } from '../../../models/accounts/user.model';

import type { CreatePharmacyAdminCommentInput } from '../../../schemas/admin/pharmacies/pharmacy-admin-comment.schema';
import type { PharmacyAdminCommentDto } from '../../../types/admin/pharmacies/pharmacy-admin-comment';

import { httpError } from '../../../utils/http/httpError';
import { hasMongoDuplicateKeyCode } from '../../../utils/database/mongoError';

import { appendAdminAuditLog } from '../audit/admin-audit-write.service';

//===================================================================

type ProductRequestAdminCommentDto = Omit<
  PharmacyAdminCommentDto,
  'pharmacyId'
> & { productRequestId: string };

//===================================================================

// Intentionally distinct from PharmacyNote and PharmacyOwnerAdminComment.
type CommentRecord = Readonly<{
  _id: Types.ObjectId;
  productRequestId: Types.ObjectId;
  text: string;
  createdByAdminUserId: Types.ObjectId;
  authorNameSnapshot: string;
  createdAt: Date;
}>;

//===================================================================

function serialize(
  comment: CommentRecord,
  pictureUrl?: string
): ProductRequestAdminCommentDto {
  return {
    id: String(comment._id),
    productRequestId: String(comment.productRequestId),
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

// This admin-only audit stores the comment text alongside its author and date.
// It must remain restricted to Admin audit permissions and never enter public APIs.
function auditMetadata(comment: CommentRecord) {
  return {
    exists: true,
    productRequestId: String(comment.productRequestId),
    createdByAdminUserId: String(comment.createdByAdminUserId),
    authorName: comment.authorNameSnapshot,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
  };
}

//===================================================================

const auditFields = [
  'exists',
  'productRequestId',
  'createdByAdminUserId',
  'authorName',
  'text',
  'createdAt',
] as const;

//===================================================================

async function assertRequest(
  productRequestId: string,
  session?: ClientSession
) {
  if (!Types.ObjectId.isValid(productRequestId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request was not found.');
  }

  const query = ProductRequest.exists({ _id: productRequestId });

  if (session) query.session(session);

  if (!(await query))
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request was not found.');
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
  const query = ProductRequestAdminComment.findOne({
    createdByAdminUserId: adminUserId,
    clientRequestId,
  }).select(
    '_id productRequestId text createdByAdminUserId authorNameSnapshot createdAt'
  );

  if (session) query.session(session);

  return query.lean<CommentRecord | null>();
}

//===================================================================

function assertReplayMatches(
  comment: CommentRecord,
  productRequestId: string,
  text: string
) {
  if (
    String(comment.productRequestId) !== productRequestId ||
    comment.text !== text
  ) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Comment request key was already used for different content.'
    );
  }
}

//===================================================================

export async function listProductRequestAdminCommentsService(
  productRequestId: string
): Promise<ProductRequestAdminCommentDto[]> {
  await assertRequest(productRequestId);

  const comments = await ProductRequestAdminComment.find({ productRequestId })
    .select(
      '_id productRequestId text createdByAdminUserId authorNameSnapshot createdAt'
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

export async function createProductRequestAdminCommentService(
  productRequestId: string,
  adminUserId: string,
  input: CreatePharmacyAdminCommentInput,
  auditRequestId: string
): Promise<ProductRequestAdminCommentDto> {
  await ProductRequestAdminComment.init(); // Unique idempotency index must exist before writes.

  const text = input.text.trim();
  const existing = await findReplay(adminUserId, input.clientRequestId);

  if (existing) {
    assertReplayMatches(existing, productRequestId, text);

    return serialize(existing);
  }

  const session = await mongoose.startSession();

  let result: ProductRequestAdminCommentDto | null = null;
  let duplicateKey = false;

  try {
    await session.withTransaction(async () => {
      const replay = await findReplay(
        adminUserId,
        input.clientRequestId,
        session
      );

      if (replay) {
        assertReplayMatches(replay, productRequestId, text);
        result = serialize(replay);

        return;
      }

      await assertRequest(productRequestId, session);

      const author = await resolveAuthor(adminUserId, session);

      const [created] = await ProductRequestAdminComment.create(
        [
          {
            productRequestId,
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
        action: ADMIN_AUDIT_ACTIONS.PRODUCT_REQUEST_COMMENT_CREATED,
        section: ADMIN_AUDIT_SECTIONS.PRODUCT_REQUESTS,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PRODUCT_REQUEST_COMMENT,
        entityId: String(created._id),
        entityLabel: 'Product request Admin comment',
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PRODUCT_REQUEST,
        scopeEntityId: productRequestId,
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
        'Product request comment idempotency replay could not be resolved.'
      );

    assertReplayMatches(replay, productRequestId, text);

    return serialize(replay);
  }

  if (!result)
    throw new Error('Product request comment transaction did not commit.');

  const saved: ProductRequestAdminCommentDto = result;

  const author = await User.findById(adminUserId)
    .select('pictureUrl')
    .lean<{ pictureUrl?: string } | null>();

  return author?.pictureUrl
    ? { ...saved, author: { ...saved.author, pictureUrl: author.pictureUrl } }
    : saved;
}

//===================================================================

export async function deleteProductRequestAdminCommentService(
  productRequestId: string,
  commentId: string,
  adminUserId: string,
  auditRequestId: string
): Promise<void> {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await assertRequest(productRequestId, session);
      await resolveAuthor(adminUserId, session);

      const comment = await ProductRequestAdminComment.findOneAndDelete(
        { _id: commentId, productRequestId },
        { session }
      );

      if (!comment)
        throw httpError(
          HTTP_STATUS.NOT_FOUND,
          'Product request comment was not found.'
        );

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action: ADMIN_AUDIT_ACTIONS.PRODUCT_REQUEST_COMMENT_DELETED,
        section: ADMIN_AUDIT_SECTIONS.PRODUCT_REQUESTS,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PRODUCT_REQUEST_COMMENT,
        entityId: String(comment._id),
        entityLabel: 'Product request Admin comment',
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PRODUCT_REQUEST,
        scopeEntityId: productRequestId,
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
