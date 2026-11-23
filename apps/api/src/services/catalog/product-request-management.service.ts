import mongoose, { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { PRODUCT_REQUEST_ERROR_CODES } from '../../constants/catalog/product-request';

import { PharmacyNote } from '../../models/pharmacies/pharmacyNote.model';
import { ProductRequest } from '../../models/catalog/productRequest.model';

import type { ProductRequestFormInput } from '../../schemas/catalog/product-request.schema';
import type { ProductCategoryReferenceDto } from '../../types/catalog/product-category';

import { httpError } from '../../utils/http/httpError';
import { isDuplicateProductRequestArticleError } from '../../utils/database/mongoError';

import {
  getProductCategoryReferenceMap,
  getProductCategoryReferenceOrThrow,
  requireProductCategoryById,
} from './product-category.service';

import { getProductRequestOwnerScope } from './product-request-access';
import { assertArticleAvailable } from './product-request-articles';

import {
  getStatusHistoryCopy,
  serializeProductRequest,
} from './product-request-projection';

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
  input: ProductRequestServiceInput
) {
  const scope = await getProductRequestOwnerScope(userId);

  await assertArticleAvailable(input.article);

  const now = new Date();
  const historyCopy = getStatusHistoryCopy(input.status);
  const formUpdate = await getRequestFormUpdate(input);

  try {
    const request = await ProductRequest.create({
      ownerId: scope.ownerId,
      status: input.status,

      ...formUpdate,

      history: [
        {
          status: input.status,
          ...historyCopy,
          createdAt: now,
        },
      ],
    });

    const categoryMap = request.categoryId
      ? await getProductCategoryReferenceMap([request.categoryId])
      : new Map<string, ProductCategoryReferenceDto>();

    return {
      request: serializeProductRequest(
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
  input: ProductRequestServiceInput
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

  if (request.status !== 'draft') {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Only draft product requests can be edited.',
      undefined,

      PRODUCT_REQUEST_ERROR_CODES.NOT_EDITABLE
    );
  }

  await assertArticleAvailable(input.article, requestId);

  const formUpdate = await getRequestFormUpdate(input);

  request.set({
    ...formUpdate,
    status: input.status,
  });

  const historyCopy =
    input.status === 'new'
      ? getStatusHistoryCopy('new')
      : {
          title: 'Draft updated',
          description: 'The pharmacy updated the product request draft.',
        };

  request.history = [
    ...(request.history ?? []),

    {
      status: input.status,
      ...historyCopy,
      createdAt: new Date(),
    },
  ];

  try {
    await request.save();
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

  const commentsTotal = await PharmacyNote.countDocuments({
    entityType: 'product_request',
    entityId: request._id,
    $or: scope.filter.$or,
  });

  const categoryMap = request.categoryId
    ? await getProductCategoryReferenceMap([request.categoryId])
    : new Map<string, ProductCategoryReferenceDto>();

  return {
    request: serializeProductRequest(
      request.toObject() as unknown as ProductRequestDocument,
      commentsTotal,

      request.categoryId
        ? getProductCategoryReferenceOrThrow(categoryMap, request.categoryId)
        : undefined
    ),
  };
}

//===============================================================

export async function deleteProductRequestService(
  userId: string,
  requestId: string
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
      })
        .select('_id status')
        .session(session);

      if (!request) {
        throw httpError(
          HTTP_STATUS.NOT_FOUND,
          'Product request was not found.',
          undefined,

          PRODUCT_REQUEST_ERROR_CODES.NOT_FOUND
        );
      }

      if (request.status !== 'draft') {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Only draft product requests can be deleted.',
          undefined,

          PRODUCT_REQUEST_ERROR_CODES.NOT_DELETABLE
        );
      }

      const deleteResult = await ProductRequest.deleteOne({
        _id: request._id,
        ...scope.filter,
        status: 'draft',
      }).session(session);

      if (deleteResult.deletedCount !== 1) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'The product request changed before it could be deleted.',
          undefined,

          PRODUCT_REQUEST_ERROR_CODES.NOT_DELETABLE
        );
      }

      await PharmacyNote.deleteMany({
        $or: scope.filter.$or,
        entityType: 'product_request',
        entityId: request._id,
      }).session(session);
    });
  } finally {
    await session.endSession();
  }

  return { message: 'Product request draft deleted successfully.' };
}
