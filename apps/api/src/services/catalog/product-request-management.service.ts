import mongoose, { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { PRODUCT_REQUEST_ERROR_CODES } from '../../constants/catalog/product-request';

import { PharmacyNote } from '../../models/pharmacies/pharmacyNote.model';
import { ProductRequest } from '../../models/catalog/productRequest.model';
import { ProductRequestDocumentFile } from '../../models/catalog/productRequestDocumentFile.model';
import { ProductRequestAdminComment } from '../../models/admin/comments/productRequestAdminComment.model';

import type { ProductRequestFormInput } from '../../schemas/catalog/product-request.schema';
import type { ProductCategoryReferenceDto } from '../../types/catalog/product-category';

import { httpError } from '../../utils/http/httpError';
import { isDuplicateProductRequestArticleError } from '../../utils/database/mongoError';

import {
  resolveProductRequestDocuments,
  reconcileProductRequestDocuments,
} from './product-request-document.service';

import {
  getProductCategoryReferenceMap,
  getProductCategoryReferenceOrThrow,
  requireProductCategoryById,
} from './product-category.service';

import {
  getProductRequestHistoryActorName,
  serializeProductRequestDetail,
} from './product-request-history-actor';

import { getProductRequestOwnerScope } from './product-request-access';
import { getProductRequestByIdService } from './product-request-read.service';
import { assertArticleAvailable } from './product-request-articles';
import { getStatusHistoryCopy } from './product-request-projection';

import {
  ADMIN_AUDIT_ACTIONS,
  auditProductRequestMutation,
  productRequestAuditSnapshot,
} from './product-request-audit';

import type { ProductRequestDocument } from './product-request-projection';

//===============================================================

// The validated response type includes transform-generated `undefined` fields,
// but direct service callers can omit them (notably name-only drafts).
// Keep the essential inputs required while accepting absent optional values.
type ProductRequestServiceInput = Pick<
  ProductRequestFormInput,
  'status' | 'name' | 'article' | 'categoryMode'
> &
  Partial<
    Omit<
      ProductRequestFormInput,
      'status' | 'name' | 'article' | 'categoryMode'
    >
  >;

//===============================================================

async function getRequestFormUpdate(input: ProductRequestServiceInput) {
  const categoryId =
    input.categoryMode === 'catalog' && input.categoryId
      ? (
          await requireProductCategoryById(input.categoryId!, {
            activeOnly: true,
          })
        )._id
      : undefined;

  return {
    name: input.name.trim(),
    article: input.article,
    categoryMode: input.categoryMode,
    categoryId,

    customCategory:
      input.categoryMode === 'custom' ? input.customCategory : undefined,

    productImage: input.productImage,
    brand: input.brand,
    series: input.series,
    manufacturer: input.manufacturer,
    releaseForm: input.releaseForm,
    activeIngredients: input.activeIngredients,
    activeIngredientCount: input.activeIngredientCount,
    fullDescription: input.fullDescription,
    pharmacyComment: input.pharmacyComment,

    additionalFiles: input.additionalFiles?.length
      ? input.additionalFiles
      : undefined,
  };
}

//===============================================================

export async function createProductRequestService(
  userId: string,
  input: ProductRequestServiceInput,
  auditRequestId?: string
) {
  const scope = await getProductRequestOwnerScope(userId);

  await assertArticleAvailable(input.article);

  const now = new Date();
  const historyCopy = getStatusHistoryCopy('new');
  const formUpdate = await getRequestFormUpdate(input);

  try {
    // Allocate the ID before storing files so each binary is bound to this
    // request in the same MongoDB transaction as the metadata.
    const requestId = new Types.ObjectId();
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const files = await resolveProductRequestDocuments(
          scope.ownerId,
          requestId,
          input.additionalFiles ?? [],
          session
        );

        const [created] = await ProductRequest.create(
          [
            {
              _id: requestId,
              ownerId: scope.ownerId,
              status: 'new',
              ...formUpdate,
              additionalFiles: files.length ? files : undefined,

              history: [
                {
                  status: 'new',
                  ...historyCopy,
                  createdAt: now,

                  actorNameSnapshot: await getProductRequestHistoryActorName(
                    userId,
                    session
                  ),
                },
              ],
            },
          ],
          { session }
        );

        await auditProductRequestMutation({
          actorUserId: userId,
          entityId: String(requestId),
          entityLabel: created.name,
          action: ADMIN_AUDIT_ACTIONS.PRODUCT_REQUEST_CREATED,
          before: { exists: false },
          after: productRequestAuditSnapshot(created),
          session,
          requestId: auditRequestId,
        });
      });
    } finally {
      await session.endSession();
    }

    const request = await ProductRequest.findById(requestId);

    if (!request) throw new Error('Product request creation did not commit.');

    const categoryMap = request.categoryId
      ? await getProductCategoryReferenceMap([request.categoryId])
      : new Map<string, ProductCategoryReferenceDto>();

    return {
      request: await serializeProductRequestDetail(
        request.toObject() as unknown as ProductRequestDocument,
        0,

        request.categoryId
          ? getProductCategoryReferenceOrThrow(categoryMap, request.categoryId)
          : undefined
      ),
    };
  } catch (error) {
    if (isDuplicateProductRequestArticleError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Another active product request already uses this article.',
        undefined,

        PRODUCT_REQUEST_ERROR_CODES.ARTICLE_CONFLICT
      );
    }

    throw error;
  }
}

//===============================================================

export async function updateProductRequestService(
  userId: string,
  requestId: string,
  input: ProductRequestServiceInput,
  auditRequestId?: string
) {
  const scope = await getProductRequestOwnerScope(userId);

  if (!Types.ObjectId.isValid(requestId)) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Product request was not found.',
      undefined,

      PRODUCT_REQUEST_ERROR_CODES.NOT_FOUND
    );
  }

  const request = await ProductRequest.findOne({
    _id: new Types.ObjectId(requestId),
    ...scope.filter,
  });

  if (!request) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Product request was not found.',
      undefined,

      PRODUCT_REQUEST_ERROR_CODES.NOT_FOUND
    );
  }

  if (
    !(
      request.status === 'new' ||
      (request.status === 'on_moderation' &&
        request.reviewState === 'changes_requested')
    )
  ) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Only New or Needs changes requests can be edited.',
      undefined,

      PRODUCT_REQUEST_ERROR_CODES.NOT_EDITABLE
    );
  }

  await assertArticleAvailable(input.article, requestId);

  const formUpdate = await getRequestFormUpdate(input);

  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const editableRequest = await ProductRequest.findOne({
          _id: request._id,
          ...scope.filter,
          status: request.status,

          reviewState:
            request.reviewState === 'changes_requested'
              ? 'changes_requested'
              : { $exists: false },
        }).session(session);

        if (!editableRequest) {
          throw httpError(
            HTTP_STATUS.CONFLICT,
            'Only New or Needs changes requests can be edited.',
            undefined,
            PRODUCT_REQUEST_ERROR_CODES.NOT_EDITABLE
          );
        }

        const files = await resolveProductRequestDocuments(
          scope.ownerId,
          request._id,
          input.additionalFiles ?? [],
          session
        );

        const before = productRequestAuditSnapshot(editableRequest);

        editableRequest.set({
          ...formUpdate,
          additionalFiles: files.length ? files : undefined,
          status: request.status,
        });

        editableRequest.history = [
          ...(editableRequest.history ?? []),

          {
            status: request.status,
            title: 'Request details updated',
            description: 'The pharmacy owner saved changes.',
            createdAt: new Date(),
          },
        ];

        await editableRequest.save({ session });

        await auditProductRequestMutation({
          actorUserId: userId,
          entityId: String(editableRequest._id),
          entityLabel: editableRequest.name,
          action: ADMIN_AUDIT_ACTIONS.PRODUCT_REQUEST_UPDATED,
          before,
          after: productRequestAuditSnapshot(editableRequest),
          session,
          requestId: auditRequestId,
        });

        await reconcileProductRequestDocuments(
          scope.ownerId,
          request._id,
          files,
          session
        );
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    if (isDuplicateProductRequestArticleError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Another active product request already uses this article.',
        undefined,

        PRODUCT_REQUEST_ERROR_CODES.ARTICLE_CONFLICT
      );
    }

    throw error;
  }

  const updatedRequest = await ProductRequest.findById(request._id);

  if (!updatedRequest)
    throw new Error('Product request update did not commit.');

  const commentsTotal = await PharmacyNote.countDocuments({
    entityType: 'product_request',
    entityId: request._id,
    $or: scope.filter.$or,
  });

  const categoryMap = updatedRequest.categoryId
    ? await getProductCategoryReferenceMap([updatedRequest.categoryId])
    : new Map<string, ProductCategoryReferenceDto>();

  return {
    request: await serializeProductRequestDetail(
      updatedRequest.toObject() as unknown as ProductRequestDocument,
      commentsTotal,

      updatedRequest.categoryId
        ? getProductCategoryReferenceOrThrow(
            categoryMap,
            updatedRequest.categoryId
          )
        : undefined
    ),
  };
}

//===============================================================

export async function deleteProductRequestService(
  userId: string,
  requestId: string,
  auditRequestId?: string
) {
  const scope = await getProductRequestOwnerScope(userId);

  if (!Types.ObjectId.isValid(requestId)) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Product request was not found.',
      undefined,

      PRODUCT_REQUEST_ERROR_CODES.NOT_FOUND
    );
  }

  const requestObjectId = new Types.ObjectId(requestId);
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const request = await ProductRequest.findOne({
        _id: requestObjectId,
        ...scope.filter,
      }).session(session);

      if (!request) {
        throw httpError(
          HTTP_STATUS.NOT_FOUND,
          'Product request was not found.',
          undefined,

          PRODUCT_REQUEST_ERROR_CODES.NOT_FOUND
        );
      }

      if (
        !(
          request.status === 'new' ||
          (request.status === 'on_moderation' &&
            request.reviewState === 'changes_requested')
        )
      ) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Only New product requests can be deleted.',
          undefined,

          PRODUCT_REQUEST_ERROR_CODES.NOT_DELETABLE
        );
      }

      const deleteResult = await ProductRequest.deleteOne({
        _id: request._id,
        ...scope.filter,
        status: 'new',
      }).session(session);

      if (deleteResult.deletedCount !== 1) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'The product request changed before it could be deleted.',
          undefined,

          PRODUCT_REQUEST_ERROR_CODES.NOT_DELETABLE
        );
      }

      await auditProductRequestMutation({
        actorUserId: userId,
        entityId: String(request._id),
        entityLabel: request.name,
        action: ADMIN_AUDIT_ACTIONS.PRODUCT_REQUEST_DELETED,
        before: productRequestAuditSnapshot(request),
        after: { exists: false },
        session,
        requestId: auditRequestId,
      });

      await ProductRequestAdminComment.deleteMany({
        productRequestId: request._id,
      }).session(session);

      await PharmacyNote.deleteMany({
        $or: scope.filter.$or,
        entityType: 'product_request',
        entityId: request._id,
      }).session(session);

      await ProductRequestDocumentFile.deleteMany({
        requestId: request._id,
        ownerId: scope.ownerId,
      }).session(session);
    });
  } finally {
    await session.endSession();
  }

  return { message: 'Product request deleted successfully.' };
}

//===============================================================

/** Owner-only transition; unlike Save, submitting never updates request fields. */
export async function submitProductRequestService(
  userId: string,
  requestId: string,
  auditRequestId?: string
) {
  const scope = await getProductRequestOwnerScope(userId);

  if (!Types.ObjectId.isValid(requestId))
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request was not found.');

  const session = await mongoose.startSession();

  let updatedId: Types.ObjectId | null = null;

  try {
    await session.withTransaction(async () => {
      const request = await ProductRequest.findOne({
        _id: new Types.ObjectId(requestId),
        ...scope.filter,
      }).session(session);

      if (!request)
        throw httpError(
          HTTP_STATUS.NOT_FOUND,
          'Product request was not found.'
        );
      if (
        !(
          request.status === 'new' ||
          (request.status === 'on_moderation' &&
            request.reviewState === 'changes_requested')
        )
      ) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'The request cannot be submitted in its current status.',
          undefined,
          PRODUCT_REQUEST_ERROR_CODES.INVALID_TRANSITION
        );
      }

      // All required fields are checked against the saved document; never trust a disabled button.
      const missing = [
        !request.name?.trim() && 'name',
        !request.article?.trim() && 'article',
        !request.productImage?.dataUrl && 'productImage',
        !request.additionalFiles?.length && 'additionalFiles',
        !request.brand?.trim() && 'brand',
        !request.series?.trim() && 'series',
        !request.manufacturer?.trim() && 'manufacturer',
        (!request.fullDescription?.trim() ||
          request.fullDescription.trim().length < 100) &&
          'fullDescription',
        request.categoryMode === 'catalog' &&
          !request.categoryId &&
          'categoryId',
        request.categoryMode === 'custom' &&
          !request.customCategory?.trim() &&
          'customCategory',
      ].filter(Boolean);

      if (missing.length)
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          `Complete the required fields before moderation: ${missing.join(', ')}.`
        );

      await assertArticleAvailable(request.article, requestId);

      const before = productRequestAuditSnapshot(request);

      request.status = 'on_moderation';
      request.reviewState = undefined;

      request.history = [
        ...(request.history ?? []),

        {
          status: 'on_moderation',
          ...getStatusHistoryCopy('on_moderation'),
          createdAt: new Date(),

          actorNameSnapshot: await getProductRequestHistoryActorName(
            userId,
            session
          ),
        },
      ];

      await request.save({ session });

      await auditProductRequestMutation({
        actorUserId: userId,
        entityId: String(request._id),
        entityLabel: request.name,
        action: ADMIN_AUDIT_ACTIONS.PRODUCT_REQUEST_STATUS_CHANGED,
        before,
        after: productRequestAuditSnapshot(request),
        session,
        requestId: auditRequestId,
      });

      updatedId = request._id;
    });
  } finally {
    await session.endSession();
  }

  if (!updatedId)
    throw new Error('Product request submit transaction did not commit.');

  // Return the same complete, owner-scoped DTO as the detail endpoint.
  // A successful transition must not omit its catalog category or counts.
  return getProductRequestByIdService(userId, String(updatedId));
}

//===============================================================

export async function cancelProductRequestService(
  userId: string,
  requestId: string,
  reason: string,
  auditRequestId?: string
) {
  const cancellationReason = reason.trim();

  if (!cancellationReason || cancellationReason.length > 1000)
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'A valid cancellation reason is required.'
    );

  const scope = await getProductRequestOwnerScope(userId);

  if (!Types.ObjectId.isValid(requestId))
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request was not found.');

  const session = await mongoose.startSession();

  let updatedId: Types.ObjectId | null = null;

  try {
    await session.withTransaction(async () => {
      const request = await ProductRequest.findOne({
        _id: new Types.ObjectId(requestId),
        ...scope.filter,
      }).session(session);

      if (!request)
        throw httpError(
          HTTP_STATUS.NOT_FOUND,
          'Product request was not found.'
        );

      if (
        request.status !== 'on_moderation' ||
        request.reviewState !== 'changes_requested'
      ) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Only a request needing corrections can be cancelled by its owner.',
          undefined,
          PRODUCT_REQUEST_ERROR_CODES.INVALID_TRANSITION
        );
      }

      const before = productRequestAuditSnapshot(request);

      request.status = 'rejected';
      request.reviewState = undefined;
      request.cancelledBy = 'owner';
      request.rejectionReason = cancellationReason;

      request.history = [
        ...(request.history ?? []),

        {
          status: 'rejected',
          title: 'Cancelled by owner',
          description: cancellationReason,
          createdAt: new Date(),

          actorNameSnapshot: await getProductRequestHistoryActorName(
            userId,
            session
          ),
        },
      ];

      await request.save({ session });

      await auditProductRequestMutation({
        actorUserId: userId,
        entityId: String(request._id),
        entityLabel: request.name,
        action: ADMIN_AUDIT_ACTIONS.PRODUCT_REQUEST_STATUS_CHANGED,
        before,
        after: productRequestAuditSnapshot(request),
        session,
        requestId: auditRequestId,
        reason: cancellationReason,
      });

      updatedId = request._id;
    });
  } finally {
    await session.endSession();
  }

  if (!updatedId)
    throw new Error('Product request cancel transaction did not commit.');

  // Return the same complete, owner-scoped DTO as the detail endpoint.
  // A successful transition must not omit its catalog category or counts.
  return getProductRequestByIdService(userId, String(updatedId));
}
