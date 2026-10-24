import { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { PRODUCT_REQUEST_ERROR_CODES } from '../../constants/catalog/product-request';

import { PharmacyNote } from '../../models/pharmacies/pharmacyNote.model';
import { ProductRequest } from '../../models/catalog/productRequest.model';

import type {
  ProductRequestArticleAvailabilityQuery,
  ProductRequestsQuery,
} from '../../schemas/product-request.schema';

import type { ProductRequestStatus } from '../../types/product-request';
import type { ProductCategoryReferenceDto } from '../../types/product-category';

import { httpError } from '../../utils/httpError';
import { getEndOfDay, getStartOfDay } from '../../utils/date-range';

import {
  createFlexibleSearchRegExp,
  createSafeRegExp,
} from '../../utils/regexp';

import {
  getProductCategoryReferenceMap,
  getProductCategoryReferenceOrThrow,
  findProductCategoryBySlug,
} from './product-category.service';

import {
  getCurrentPharmacy,
  getCurrentPharmacyId,
} from './product-request-access';

import { getArticleConflict } from './product-request-articles';
import { serializeProductRequest } from './product-request-projection';
import type { ProductRequestDocument } from './product-request-projection';

//===============================================================

export async function getProductRequestArticleAvailabilityService(
  userId: string,
  query: ProductRequestArticleAvailabilityQuery
) {
  const pharmacy = await getCurrentPharmacy(userId);

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy profile was not found.');
  }

  if (query.excludeRequestId) {
    const ownedRequestExists = await ProductRequest.exists({
      _id: new Types.ObjectId(query.excludeRequestId),
      pharmacyId: pharmacy._id,
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
  const pharmacyId = await getCurrentPharmacyId(userId);

  const statistics: Record<ProductRequestStatus, number> = {
    draft: 0,
    new: 0,
    in_progress: 0,
    approved: 0,
    rejected: 0,
  };

  if (!pharmacyId) return statistics;

  const rows = await ProductRequest.aggregate<{
    _id: ProductRequestStatus;
    count: number;
  }>([
    { $match: { pharmacyId } },
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
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId) {
    return {
      items: [],
      page: 1,
      perPage: query.perPage,
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
    };
  }

  const filter: Record<string, unknown> = { pharmacyId };

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {
      ...(query.dateFrom ? { $gte: getStartOfDay(query.dateFrom) } : {}),
      ...(query.dateTo ? { $lte: getEndOfDay(query.dateTo) } : {}),
    };
  }

  const requestNumber = query.requestNumber?.trim();
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

    filter.categoryMode = 'catalog';
    filter.categoryId = category?._id ?? null;
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

    ProductRequest.findOne({ pharmacyId })
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
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId || !Types.ObjectId.isValid(requestId)) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Product request was not found.',
      undefined,

      PRODUCT_REQUEST_ERROR_CODES.NOT_FOUND
    );
  }

  const request = await ProductRequest.findOne({
    _id: new Types.ObjectId(requestId),
    pharmacyId,
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
    pharmacyId,
    entityType: 'product_request',
    entityId: request._id,
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
