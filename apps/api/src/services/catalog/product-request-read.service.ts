import { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { PRODUCT_REQUEST_ERROR_CODES } from '../../constants/catalog/product-request';
import { USER_ROLES } from '../../constants/auth/auth';

import { PharmacyNote } from '../../models/pharmacies/pharmacyNote.model';
import { ProductRequest } from '../../models/catalog/productRequest.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { User } from '../../models/accounts/user.model';

import type {
  ProductRequestArticleAvailabilityQuery,
  ProductRequestsQuery,
  AdminProductRequestsQuery,
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
import { serializeProductRequestDetail } from './product-request-history-actor';
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
    new: 0,
    on_moderation: 0,
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

async function buildProductRequestFilter(
  query: ProductRequestsQuery,
  filter: Record<string, unknown>
) {
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
  else if (query.linkedOnly) filter.productId = { $exists: true, $ne: null };

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

  return filter;
}

export async function getProductRequestsService(
  userId: string,
  query: ProductRequestsQuery
) {
  const scope = await getProductRequestOwnerScope(userId);
  const filter = await buildProductRequestFilter(query, { ...scope.filter });
  const skip = (query.page - 1) * query.perPage;

  const [requests, total, earliestRequest] = await Promise.all([
    ProductRequest.find(filter)
      .select('-additionalFiles') // large legacy binaries belong only in request details
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
    request: await serializeProductRequestDetail(
      request,
      commentsTotal,

      request.categoryId
        ? getProductCategoryReferenceOrThrow(categoryMap, request.categoryId)
        : undefined
    ),
  };
}

//===============================================================

async function buildAdminProductRequestOwnerScope(ownerIdValue?: string) {
  const scope: Record<string, unknown> = {};

  if (ownerIdValue) {
    const ownerId = new Types.ObjectId(ownerIdValue);

    const pharmacies = await Pharmacy.find({ ownerId })
      .select('_id')
      .lean<Array<{ _id: Types.ObjectId }>>();

    scope.$or = [
      { ownerId },
      {
        ownerId: null,
        pharmacyId: { $in: pharmacies.map((pharmacy) => pharmacy._id) },
      },
    ];
  }

  return scope;
}

//===============================================================

/** Admin read scope is separate from owner scope. Authorization is enforced
 * by the admin route permission guard, never by client-supplied owner IDs. */
export async function getAdminProductRequestsService(
  query: AdminProductRequestsQuery
) {
  const scope = await buildAdminProductRequestOwnerScope(query.ownerId);
  const filter = await buildProductRequestFilter(query, { ...scope });

  if (query.keyword?.trim()) {
    const expression = createFlexibleSearchRegExp(query.keyword.trim());

    filter.$and = [
      {
        $or: [
          { name: expression },
          { article: expression },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: '$_id' },
                regex: createSafeRegExp(query.keyword.trim()),
              },
            },
          },
        ],
      },
    ];
  }

  // Unknown catalog slugs must not match uncategorized drafts.
  if (query.category && filter.categoryId === null)
    filter.categoryId = { $in: [] };

  // Normalize out-of-range deep links before querying: the shared pagination
  // contract rejects responses with page greater than totalPages.
  const [total, earliestRequest] = await Promise.all([
    ProductRequest.countDocuments(filter),

    ProductRequest.findOne(scope)
      .sort({ createdAt: 1 })
      .select('createdAt')
      .lean<{ createdAt: Date } | null>(),
  ]);

  const page = Math.min(
    query.page,
    Math.max(1, Math.ceil(total / query.perPage))
  );

  const requests = await ProductRequest.find(filter)
    .select(
      'ownerId pharmacyId name article categoryMode categoryId customCategory status productId productImage cancelledBy reviewState createdAt updatedAt'
    )
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * query.perPage)
    .limit(query.perPage)
    .populate('productId', 'imageUrl article name')
    .lean<ProductRequestDocument[]>();

  const legacyIds = requests.flatMap((request) =>
    !request.ownerId && request.pharmacyId ? [request.pharmacyId] : []
  );

  const legacy = await Pharmacy.find({ _id: { $in: legacyIds } })
    .select('ownerId')
    .lean<Array<{ _id: Types.ObjectId; ownerId: Types.ObjectId }>>();

  const legacyOwners = new Map(
    legacy.map((pharmacy) => [String(pharmacy._id), pharmacy.ownerId])
  );

  const resolveOwnerId = (request: ProductRequestDocument) =>
    request.ownerId ?? legacyOwners.get(String(request.pharmacyId));

  const [categories, owners] = await Promise.all([
    getProductCategoryReferenceMap(
      requests.flatMap((request) =>
        request.categoryId ? [request.categoryId] : []
      )
    ),

    User.find({
      _id: {
        $in: requests.flatMap((request) => {
          const id = resolveOwnerId(request);
          return id ? [id] : [];
        }),
      },

      role: USER_ROLES.PHARMACY,
    })
      .select('name')
      .lean<Array<{ _id: Types.ObjectId; name: string }>>(),
  ]);

  const ownerMap = new Map(
    owners.map((owner) => [
      String(owner._id),
      { id: String(owner._id), name: owner.name },
    ])
  );

  return {
    items: requests.map((request) => {
      const category = request.categoryId
        ? getProductCategoryReferenceOrThrow(categories, request.categoryId)
        : undefined;

      const owner = ownerMap.get(String(resolveOwnerId(request)));
      const row = serializeProductRequest(request, 0, category);

      return {
        id: row.id,
        requestNumber: row.requestNumber,
        createdAt: row.createdAt,
        productId: row.productId,
        productImageUrl: row.productImageUrl,
        productArticle: row.productArticle,
        productName: row.productName,
        categoryMode: row.categoryMode,
        category: row.category,
        customCategory: row.customCategory,
        status: row.status,
        reviewState: row.reviewState,
        cancelledBy: row.cancelledBy,
        owner,
      };
    }),

    total,
    page,
    perPage: query.perPage,
    totalPages: Math.ceil(total / query.perPage),

    earliestCreatedAt: earliestRequest
      ? earliestRequest.createdAt.toISOString().slice(0, 10)
      : null,
  };
}

//===============================================================

export async function getAdminProductRequestStatisticsService(
  ownerId?: string
) {
  const scope = await buildAdminProductRequestOwnerScope(ownerId);

  const statistics: Record<ProductRequestStatus, number> = {
    new: 0,
    on_moderation: 0,
    approved: 0,
    rejected: 0,
  };

  const rows = await ProductRequest.aggregate<{
    _id: ProductRequestStatus;
    count: number;
  }>([{ $match: scope }, { $group: { _id: '$status', count: { $sum: 1 } } }]);

  for (const row of rows)
    if (row._id in statistics) statistics[row._id] = row.count;

  return statistics;
}

//===============================================================

// Scope owner suggestions to owners with requests (including legacy pharmacy ownership).
// Search and pagination are applied after owner deduplication, never to a page of requests.
export async function getAdminProductRequestOwnerOptionsService(
  query: AdminProductRequestsQuery
) {
  const filter = await buildProductRequestFilter(
    { ...query, keyword: undefined },
    {}
  );

  if (query.category && filter.categoryId === null)
    filter.categoryId = { $in: [] };

  const search = query.keyword?.trim();
  const regex = search ? createSafeRegExp(search) : undefined;

  const items = await ProductRequest.aggregate<{
    id: string;
    name: string;
    pictureUrl?: string;
  }>([
    { $match: filter },
    {
      $group: {
        _id: {
          ownerId: '$ownerId',
          pharmacyId: {
            $cond: [{ $ifNull: ['$ownerId', false] }, null, '$pharmacyId'],
          },
        },
      },
    },
    {
      $lookup: {
        from: Pharmacy.collection.name,
        localField: '_id.pharmacyId',
        foreignField: '_id',
        as: 'legacyPharmacy',
      },
    },
    {
      $project: {
        ownerId: {
          $ifNull: [
            '$_id.ownerId',
            { $arrayElemAt: ['$legacyPharmacy.ownerId', 0] },
          ],
        },
      },
    },
    { $match: { ownerId: { $ne: null } } },
    { $group: { _id: '$ownerId' } },
    {
      $lookup: {
        from: User.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'owner',
      },
    },
    { $unwind: '$owner' },
    {
      $match: {
        'owner.role': USER_ROLES.PHARMACY,

        ...(regex
          ? {
              $or: [
                { 'owner.name': regex },
                { 'owner.email': regex },
                { 'owner.phone': regex },
                {
                  $expr: {
                    $regexMatch: { input: { $toString: '$_id' }, regex },
                  },
                },
              ],
            }
          : {}),
      },
    },
    { $sort: { 'owner.name': 1, _id: 1 } },
    { $skip: (query.page - 1) * query.perPage },
    { $limit: query.perPage },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: '$owner.name',

        pictureUrl: {
          $cond: [
            {
              $lte: [
                { $strLenCP: { $ifNull: ['$owner.pictureUrl', ''] } },
                4096,
              ],
            },
            '$owner.pictureUrl',
            '$$REMOVE',
          ],
        },
      },
    },
  ]);

  return {
    items: items.map(({ id, name, pictureUrl }) => ({
      id,
      name,
      ...(pictureUrl ? { pictureUrl } : {}),
    })),
  };
}

//===================================================================

export async function getAdminProductRequestByIdService(requestId: string) {
  if (!Types.ObjectId.isValid(requestId))
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request not found.');

  const request = await ProductRequest.findById(requestId)
    .populate('productId', 'imageUrl article name')
    .lean<ProductRequestDocument | null>();

  if (!request)
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product request not found.');

  const categories = request.categoryId
    ? await getProductCategoryReferenceMap([request.categoryId])
    : new Map<string, ProductCategoryReferenceDto>();

  const legacyPharmacy =
    !request.ownerId && request.pharmacyId
      ? await Pharmacy.findById(request.pharmacyId)
          .select('ownerId')
          .lean<{ ownerId?: Types.ObjectId } | null>()
      : null;

  const ownerId = request.ownerId ?? legacyPharmacy?.ownerId;

  const owner = ownerId
    ? await User.findOne({ _id: ownerId, role: USER_ROLES.PHARMACY })
        .select('name pictureUrl status')
        .lean<{
          _id: Types.ObjectId;
          name: string;
          pictureUrl?: string;
          status: string;
        } | null>()
    : null;

  return {
    owner: owner
      ? {
          id: String(owner._id),
          name: owner.name,
          pictureUrl: owner.pictureUrl,
          status: owner.status,
        }
      : null,

    request: await serializeProductRequestDetail(
      request,
      0,

      request.categoryId
        ? getProductCategoryReferenceOrThrow(categories, request.categoryId)
        : undefined,

      owner ? { id: String(owner._id), name: owner.name } : undefined
    ),
  };
}
