import { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { PRODUCT_REQUEST_ERROR_CODES } from '../../constants/catalog/product-request';

import { PharmacyNote } from '../../models/pharmacies/pharmacyNote.model';
import { ProductRequest } from '../../models/catalog/productRequest.model';

import type {
  ProductRequestArticleAvailabilityQuery,
  ProductRequestsQuery,
} from '../../schemas/catalog/product-request.schema';

import type { ProductRequestStatus } from '../../types/catalog/product-request';
import type { ProductCategoryReferenceDto } from '../../types/catalog/product-category';

import { httpError } from '../../utils/http/httpError';
import { getEndOfDay, getStartOfDay } from '../../utils/dates/date-range';

import {
  createFlexibleSearchRegExp,
  createSafeRegExp,
} from '../../utils/validation/regexp';

import {
  getProductCategoryReferenceMap,
  getProductCategoryReferenceOrThrow,
  findProductCategoryBySlug,
} from './product-category.service';

import { getProductRequestOwnerScope } from './product-request-access';
import { getArticleConflict } from './product-request-articles';
import { serializeProductRequest } from './product-request-projection';
import type { ProductRequestDocument } from './product-request-projection';

//===============================================================

export async function getProductRequestArticleAvailabilityService(
  userId: string,
  query: ProductRequestArticleAvailabilityQuery
) {
  const scope = await getProductRequestOwnerScope(userId);

  if (query.excludeRequestId) {
    const ownedRequestExists = await ProductRequest.exists({
      _id: new Types.ObjectId(query.excludeRequestId),
      ...scope.filter,
    });

    if (!ownedRequestExists) {
      throw httpError(
        HTTP_STATUS.NOT_FOUND,
        'Product request was not found.',
        undefined,

        PRODUCT_REQUEST_ERROR_CODES.NOT_FOUND
      );
    }
  }

  const message = await getArticleConflict(
    query.article,
    query.excludeRequestId
  );

  return {
    available: !message,
    ...(message ? { message } : {}),
  };
}

//===============================================================

export async function getProductRequestStatisticsService(userId: string) {
  const scope = await getProductRequestOwnerScope(userId);

  const statistics: Record<ProductRequestStatus, number> = {
    draft: 0,
    new: 0,
    in_progress: 0,
    approved: 0,
    rejected: 0,
  };

  const rows = await ProductRequest.aggregate<{
    _id: ProductRequestStatus;
    count: number;
  }>([
    { $match: scope.filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  for (const row of rows) {
    if (row._id in statistics) statistics[row._id] = row.count;
  }

  return statistics;
}

//===============================================================

export async function getProductRequestsService(
  userId: string,
  query: ProductRequestsQuery
) {
  const scope = await getProductRequestOwnerScope(userId);
  const filter: Record<string, unknown> = { ...scope.filter };

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {
      ...(query.dateFrom ? { $gte: getStartOfDay(query.dateFrom) } : {}),
      ...(query.dateTo ? { $lte: getEndOfDay(query.dateTo) } : {}),
    };
  }

  const requestNumber = query.requestNumber?.trim();
  const keyword = query.keyword?.trim();

  if (query.requestId) filter._id = new Types.ObjectId(query.requestId);
  if (query.productId) filter.productId = new Types.ObjectId(query.productId);

  if (keyword) {
    const expression = createFlexibleSearchRegExp(keyword);

    filter.$and = [
      {
        $or: [
          { name: expression },
          { article: expression },
          ...(Types.ObjectId.isValid(keyword)
            ? [{ _id: new Types.ObjectId(keyword) }]
            : []),
        ],
      },
    ];
  }

  const productName = query.productName?.trim() || query.name?.trim();
  const productArticle = query.productArticle?.trim() || query.article?.trim();

  if (requestNumber) {
    filter._id = Types.ObjectId.isValid(requestNumber)
      ? new Types.ObjectId(requestNumber)
      : null;
  }

  if (productName) {
    filter.name = createFlexibleSearchRegExp(productName);
  }

  if (productArticle) {
    filter.article = createSafeRegExp(productArticle);
  }

  if (query.category) {
    const category = await findProductCategoryBySlug(query.category);

    // Approved custom requests also have a resolved catalog categoryId.
    filter.categoryId = category?._id ?? null;
  } else if (query.categoryMode === 'custom') {
    // Once Admin approves a custom-category request it is associated with a
    // canonical product/category; it no longer belongs in the custom-only view.
    filter.categoryMode = 'custom';
    filter.productId = { $exists: false };
  } else if (query.categoryMode) {
    filter.categoryMode = query.categoryMode;
  }

  if (query.status) filter.status = query.status;

  const skip = (query.page - 1) * query.perPage;

  const [requests, total, earliestRequest] = await Promise.all([
    ProductRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.perPage)
      .populate('productId', 'imageUrl article name')
      .lean<ProductRequestDocument[]>(),

    ProductRequest.countDocuments(filter),

    ProductRequest.findOne(scope.filter)
      .sort({ createdAt: 1 })
      .select('createdAt')
      .lean<{ createdAt: Date } | null>(),
  ]);

  const categoryMap = await getProductCategoryReferenceMap(
    requests.flatMap((request) =>
      request.categoryId ? [request.categoryId] : []
    )
  );

  return {
    items: requests.map((request) =>
      serializeProductRequest(
        request,
        0,

        request.categoryId
          ? getProductCategoryReferenceOrThrow(categoryMap, request.categoryId)
          : undefined
      )
    ),

    page: total === 0 ? 1 : query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),

    earliestCreatedAt: earliestRequest
      ? earliestRequest.createdAt.toISOString().slice(0, 10)
      : null,
  };
}

//===============================================================

export async function getProductRequestByIdService(
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

  const request = await ProductRequest.findOne({
    _id: new Types.ObjectId(requestId),
    ...scope.filter,
  })
    .populate('productId', 'imageUrl article name')
    .lean<ProductRequestDocument | null>();

  if (!request) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Product request was not found.',
      undefined,

      PRODUCT_REQUEST_ERROR_CODES.NOT_FOUND
    );
  }

  const commentsTotal = await PharmacyNote.countDocuments({
    entityType: 'product_request',
    entityId: request._id,

    $or: [
      { ownerId: scope.ownerId },
      {
        ownerId: { $exists: false },
        pharmacyId: { $in: scope.legacyPharmacyIds },
      },
    ],
  });

  const categoryMap = request.categoryId
    ? await getProductCategoryReferenceMap([request.categoryId])
    : new Map<string, ProductCategoryReferenceDto>();

  return {
    request: serializeProductRequest(
      request,
      commentsTotal,

      request.categoryId
        ? getProductCategoryReferenceOrThrow(categoryMap, request.categoryId)
        : undefined
    ),
  };
}
