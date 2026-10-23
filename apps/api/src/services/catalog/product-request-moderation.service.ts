import mongoose, { Types } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../../constants/admin-audit';

import { HTTP_STATUS } from '../../constants/httpStatus';
import { PRODUCT_REQUEST_ERROR_CODES } from '../../constants/product-request';

import { ProductRequest } from '../../models/productRequest.model';
import { Product } from '../../models/product.model';

import type { ProductRequestModerationInput } from '../../schemas/product-request.schema';
import type { ProductCategoryReferenceDto } from '../../types/product-category';
import type { ProductRequestStatus } from '../../types/product-request';

import { httpError } from '../../utils/httpError';
import { isDuplicateProductArticleError } from '../../utils/mongoError';
import { appendAdminAuditLog } from '../admin/audit/admin-audit.service';

import {
  getProductCategoryReferenceMap,
  getProductCategoryReferenceOrThrow,
  requireProductCategoryById,
} from './product-category.service';

import {
  getStatusHistoryCopy,
  serializeProductRequest,
} from './product-request-projection';

import type {
  ProductRequestDocument,
  ProductRequestProductDocument,
} from './product-request-projection';

//===============================================================

function canTransitionProductRequest(
  currentStatus: ProductRequestStatus,
  nextStatus: ProductRequestModerationInput['status']
): boolean {
  if (currentStatus === 'new') return nextStatus === 'in_progress';

  if (currentStatus === 'in_progress') {
    return nextStatus === 'approved' || nextStatus === 'rejected';
  }

  return false;
}

//===============================================================

type ApprovedProductResolution = Readonly<{
  productId: Types.ObjectId;
  categoryId: Types.ObjectId;
}>;

//===============================================================

async function assertApprovalCategoryMatchesRequest(
  request: ProductRequestDocument,
  categoryId: Types.ObjectId,
  inputCategoryId: string | undefined,
  session: mongoose.ClientSession
): Promise<void> {
  if (request.categoryMode === 'catalog') {
    if (
      !request.categoryId ||
      String(request.categoryId) !== String(categoryId)
    ) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'The selected catalog product uses a different product category.',
        undefined,

        PRODUCT_REQUEST_ERROR_CODES.APPROVAL_PRODUCT_CONFLICT
      );
    }

    if (inputCategoryId && String(request.categoryId) !== inputCategoryId) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Catalog product category cannot be changed while approving this request.',
        undefined,

        PRODUCT_REQUEST_ERROR_CODES.APPROVAL_PRODUCT_CONFLICT
      );
    }

    return;
  }

  if (inputCategoryId && inputCategoryId !== String(categoryId)) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'The selected catalog product does not match the assigned product category.',
      undefined,

      PRODUCT_REQUEST_ERROR_CODES.APPROVAL_PRODUCT_CONFLICT
    );
  }

  await requireProductCategoryById(categoryId, { activeOnly: true, session });
}

//===============================================================

async function resolveApprovedProduct(
  request: ProductRequestDocument,
  input: ProductRequestModerationInput,
  adminUserId: string,
  session: mongoose.ClientSession
): Promise<ApprovedProductResolution> {
  const normalizedArticle = request.article.trim().toUpperCase();

  if (input.productId) {
    const linkedProduct = await Product.findById(input.productId)
      .select('_id article categoryId')
      .session(session)
      .lean<ProductRequestProductDocument | null>();

    if (
      !linkedProduct ||
      linkedProduct.article?.toUpperCase() !== normalizedArticle ||
      !linkedProduct.categoryId
    ) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'The selected catalog product does not match the request article.',
        undefined,

        PRODUCT_REQUEST_ERROR_CODES.APPROVAL_PRODUCT_CONFLICT
      );
    }

    await assertApprovalCategoryMatchesRequest(
      request,
      linkedProduct.categoryId,
      input.categoryId,
      session
    );

    return {
      productId: linkedProduct._id,
      categoryId: linkedProduct.categoryId,
    };
  }

  const existingProduct = await Product.findOne({ article: normalizedArticle })
    .session(session)
    .select('_id article categoryId')
    .lean<ProductRequestProductDocument | null>();

  if (existingProduct?.categoryId) {
    await assertApprovalCategoryMatchesRequest(
      request,
      existingProduct.categoryId,
      input.categoryId,
      session
    );

    return {
      productId: existingProduct._id,
      categoryId: existingProduct.categoryId,
    };
  }

  const approvalCategoryId =
    request.categoryMode === 'catalog' ? request.categoryId : input.categoryId;

  if (!approvalCategoryId) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'A catalog category is required when approving a custom category request.',
      undefined,

      PRODUCT_REQUEST_ERROR_CODES.APPROVAL_PRODUCT_CONFLICT
    );
  }

  const category = await requireProductCategoryById(approvalCategoryId, {
    activeOnly: true,
    session,
  });

  const [createdProduct] = await Product.create(
    [
      {
        name: request.name,
        article: normalizedArticle,
        description: request.fullDescription,
        categoryId: category._id,
        status: 'active',
        imageUrl: request.productImage?.dataUrl,
        manufacturer: request.manufacturer,
        dosage: request.dosage,
        packageQuantity: request.packageSize,
        inStock: false,
        createdBy: new Types.ObjectId(adminUserId),
        updatedBy: new Types.ObjectId(adminUserId),
      },
    ],

    { session }
  );

  return {
    productId: createdProduct._id as Types.ObjectId,
    categoryId: category._id,
  };
}

//===============================================================

export async function moderateProductRequestByAdminService(
  productRequestId: string,
  input: ProductRequestModerationInput,
  adminUserId: string,
  auditRequestId?: string
) {
  if (
    !Types.ObjectId.isValid(productRequestId) ||
    !Types.ObjectId.isValid(adminUserId)
  ) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Product request was not found.',
      undefined,

      PRODUCT_REQUEST_ERROR_CODES.NOT_FOUND
    );
  }

  const session = await mongoose.startSession();

  try {
    const moderatedRequest = await session.withTransaction(async () => {
      const request =
        await ProductRequest.findById(productRequestId).session(session);

      if (!request) {
        throw httpError(
          HTTP_STATUS.NOT_FOUND,
          'Product request was not found.',
          undefined,

          PRODUCT_REQUEST_ERROR_CODES.NOT_FOUND
        );
      }

      const previousStatus = request.status;

      const previousProductId = request.productId
        ? String(request.productId)
        : null;

      const previousCategoryId = request.categoryId
        ? String(request.categoryId)
        : null;

      if (!canTransitionProductRequest(request.status, input.status)) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          `Product request cannot transition from ${request.status} to ${input.status}.`,
          undefined,

          PRODUCT_REQUEST_ERROR_CODES.INVALID_TRANSITION
        );
      }

      if (input.status === 'rejected' && !input.reason?.trim()) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Rejection reason is required.',
          undefined,

          PRODUCT_REQUEST_ERROR_CODES.REJECTION_REASON_REQUIRED
        );
      }

      let approvedProduct: ApprovedProductResolution | undefined;

      if (input.status === 'approved') {
        approvedProduct = await resolveApprovedProduct(
          request.toObject() as unknown as ProductRequestDocument,
          input,
          adminUserId,
          session
        );
      }

      request.status = input.status;

      if (approvedProduct) {
        request.productId = approvedProduct.productId;

        if (request.categoryMode === 'custom') {
          request.categoryId = approvedProduct.categoryId;
        }

        request.rejectionReason = undefined;
      } else if (input.status === 'rejected') {
        request.rejectionReason = input.reason?.trim();
      }

      const historyCopy = getStatusHistoryCopy(
        input.status,
        request.rejectionReason
      );

      request.history = [
        ...(request.history ?? []),

        {
          status: input.status,
          ...historyCopy,
          createdAt: new Date(),
        },
      ];

      await request.save({ session });

      if (auditRequestId) {
        const nextProductId = request.productId
          ? String(request.productId)
          : null;

        const nextCategoryId = request.categoryId
          ? String(request.categoryId)
          : null;

        const productChanged = previousProductId !== nextProductId;
        const categoryChanged = previousCategoryId !== nextCategoryId;

        await appendAdminAuditLog({
          actorUserId: adminUserId,
          action: ADMIN_AUDIT_ACTIONS.PRODUCT_REQUEST_STATUS_CHANGED,
          section: ADMIN_AUDIT_SECTIONS.PRODUCT_REQUESTS,
          entityType: ADMIN_AUDIT_ENTITY_TYPES.PRODUCT_REQUEST,
          entityId: String(request._id),
          entityLabel: request.name,

          before: {
            status: previousStatus,

            ...(productChanged ? { productId: previousProductId } : {}),
            ...(categoryChanged ? { categoryId: previousCategoryId } : {}),
          },

          after: {
            status: request.status,

            ...(productChanged ? { productId: nextProductId } : {}),
            ...(categoryChanged ? { categoryId: nextCategoryId } : {}),
          },

          changedFields: [
            'status',

            ...(productChanged ? ['productId'] : []),
            ...(categoryChanged ? ['categoryId'] : []),
          ],

          ...(input.reason?.trim() ? { reason: input.reason.trim() } : {}),

          requestId: auditRequestId,
          session,
        });
      }

      return request.toObject() as unknown as ProductRequestDocument;
    });

    if (!moderatedRequest) {
      throw new Error(
        'Product request moderation transaction returned no request.'
      );
    }

    const categoryMap = moderatedRequest.categoryId
      ? await getProductCategoryReferenceMap([moderatedRequest.categoryId])
      : new Map<string, ProductCategoryReferenceDto>();

    return {
      request: serializeProductRequest(
        moderatedRequest,
        0,

        moderatedRequest.categoryId
          ? getProductCategoryReferenceOrThrow(
              categoryMap,
              moderatedRequest.categoryId
            )
          : undefined
      ),
    };
  } catch (error) {
    if (isDuplicateProductArticleError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'A catalog product with this article was created concurrently. Retry approval to link it.',
        undefined,

        PRODUCT_REQUEST_ERROR_CODES.APPROVAL_PRODUCT_CONFLICT
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
}
