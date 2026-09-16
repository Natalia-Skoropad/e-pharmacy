import { Types, type PipelineStage } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';
import { httpError } from '../utils/httpError';
import { getEndOfDay, getStartOfDay } from '../utils/date-range';
import { createSafeRegExp } from '../utils/regexp';

import type {
  ClientProductsQuery,
  ClientsQuery,
} from '../schemas/client.schema';

import type { ProductStatus } from '../types/product';
import type { ProductCategory } from '../types/categories';
import type { PharmacyEntity } from '../types/pharmacy';

//===============================================================

type PharmacyDocument = PharmacyEntity & { _id: Types.ObjectId };

//===============================================================

type ClientRow = Readonly<{
  id: string;
  photoUrl: string | null;
  firstOrderAt: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  successfulOrdersCount: number;
  successfulOrdersAmount: number;
  status: 'active' | 'blocked';
  statusReason?: string;
  isDefault: boolean;
}>;

type ClientStatistics = Readonly<{
  total: number;
  repeat: number;
  active: number;
  blocked: number;
}>;

type AggregatedClientRow = Omit<ClientRow, 'firstOrderAt'> & {
  firstOrderAt: Date;
  earliestOrderAt: Date | null;
};

type ClientAggregationResult = Readonly<{
  items: AggregatedClientRow[];
  total: Array<{ count: number }>;
  statistics: Array<
    ClientStatistics & {
      earliestOrderAt: Date | null;
    }
  >;
}>;

type ClientPurchasedProductRow = Readonly<{
  id: string;
  firstOrderDate: string;
  productId: string;
  photoUrl: string | null;
  article: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  totalAmount: number;
  ordersCount: number;
  currentProductExists: boolean;
  currentStatus: ProductStatus | null;
}>;

type AggregatedClientPurchasedProductRow = Omit<
  ClientPurchasedProductRow,
  'firstOrderDate'
> & {
  firstOrderDate: Date;
};

type ClientPurchasedProductsAggregationResult = Readonly<{
  items: AggregatedClientPurchasedProductRow[];
  total: Array<{ count: number }>;
  metadata: Array<{ earliestCreatedAt: Date }>;
}>;

//===============================================================

async function getCurrentPharmacyId(userId: string) {
  if (!Types.ObjectId.isValid(userId)) return null;

  const pharmacy = await Pharmacy.findOne({
    $or: [{ ownerId: userId }, { managerUserIds: userId }],
  })
    .select('_id')
    .lean<Pick<PharmacyDocument, '_id'> | null>();

  return pharmacy?._id ?? null;
}

//===============================================================

function buildClientFilterStages(
  query: ClientsQuery
): PipelineStage.FacetPipelineStage[] {
  const match: Record<string, unknown> = {};

  if (query.firstOrderFrom || query.firstOrderTo) {
    match.firstOrderAt = {
      ...(query.firstOrderFrom
        ? { $gte: getStartOfDay(query.firstOrderFrom) }
        : {}),
      ...(query.firstOrderTo ? { $lte: getEndOfDay(query.firstOrderTo) } : {}),
    };
  }

  if (query.clientId?.trim()) {
    match.id = createSafeRegExp(query.clientId.trim());
  }

  if (query.name?.trim()) {
    match.name = createSafeRegExp(query.name.trim());
  }

  if (query.contact?.trim()) {
    const contact = createSafeRegExp(query.contact.trim());
    match.$or = [{ email: contact }, { phone: contact }, { address: contact }];
  }

  if (query.email?.trim()) {
    match.email = createSafeRegExp(query.email.trim());
  }

  if (query.phone?.trim()) {
    match.phone = createSafeRegExp(query.phone.trim());
  }

  if (query.address?.trim()) {
    match.address = createSafeRegExp(query.address.trim());
  }

  if (query.status) {
    match.status = query.status;
  }

  if (query.successfulOrders === 'repeat') {
    match.successfulOrdersCount = { $gte: 2 };
  } else if (query.successfulOrders === 'successful') {
    match.successfulOrdersCount = { $gte: 1 };
  } else if (query.successfulOrders === 'other') {
    match.successfulOrdersCount = 0;
  }

  return Object.keys(match).length ? [{ $match: match }] : [];
}

//===============================================================

async function getClientRowsForPharmacy(
  pharmacyId: Types.ObjectId,
  query: ClientsQuery
): Promise<{
  items: ClientRow[];
  total: number;
  statistics: ClientStatistics;
  earliestCreatedAt: string | null;
}> {
  const pharmacy = await Pharmacy.findById(pharmacyId)
    .select('imageUrl activatedAt approvedAt createdAt')
    .lean<Pick<
      PharmacyDocument,
      '_id' | 'imageUrl' | 'activatedAt' | 'approvedAt' | 'createdAt'
    > | null>();

  if (!pharmacy) {
    return {
      items: [],
      total: 0,
      statistics: { total: 0, repeat: 0, active: 0, blocked: 0 },
      earliestCreatedAt: null,
    };
  }

  const fallbackDate =
    pharmacy.activatedAt ?? pharmacy.approvedAt ?? pharmacy.createdAt;
  const filterStages = buildClientFilterStages(query);
  const skip = (query.page - 1) * query.perPage;

  const itemsFacet: PipelineStage.FacetPipelineStage[] = [
    ...filterStages,
    { $sort: { isDefault: -1, firstOrderAt: -1 } },
    { $skip: skip },
    { $limit: query.perPage },
  ];

  const totalFacet: PipelineStage.FacetPipelineStage[] = [
    ...filterStages,
    { $count: 'count' },
  ];

  const statisticsFacet: PipelineStage.FacetPipelineStage[] = [
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        repeat: {
          $sum: {
            $cond: [{ $gte: ['$successfulOrdersCount', 2] }, 1, 0],
          },
        },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        blocked: {
          $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] },
        },
        earliestOrderCandidates: { $push: '$earliestOrderAt' },
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        repeat: 1,
        active: 1,
        blocked: 1,
        earliestOrderAt: {
          $min: {
            $filter: {
              input: '$earliestOrderCandidates',
              as: 'orderDate',
              cond: { $ne: ['$$orderDate', null] },
            },
          },
        },
      },
    },
  ];

  const pipeline: PipelineStage[] = [
    { $match: { pharmacyId } },
    {
      $set: {
        latestDeliveryAddressCandidate: {
          $cond: [
            {
              $and: [
                { $eq: ['$delivery.method', 'postal_delivery'] },
                {
                  $gt: [
                    {
                      $strLenCP: {
                        $ifNull: ['$delivery.details.address', ''],
                      },
                    },
                    0,
                  ],
                },
              ],
            },
            '$delivery.details.address',
            null,
          ],
        },
        hasDeliveryAddressCandidate: {
          $cond: [
            {
              $and: [
                { $eq: ['$delivery.method', 'postal_delivery'] },
                {
                  $gt: [
                    {
                      $strLenCP: {
                        $ifNull: ['$delivery.details.address', ''],
                      },
                    },
                    0,
                  ],
                },
              ],
            },
            1,
            0,
          ],
        },
      },
    },
    {
      $sort: {
        userId: 1,
        hasDeliveryAddressCandidate: -1,
        createdAt: -1,
      },
    },
    {
      $group: {
        _id: '$userId',
        firstOrderAt: { $min: '$createdAt' },
        earliestOrderAt: { $min: '$createdAt' },
        successfulOrdersCount: {
          $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] },
        },
        successfulOrdersAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'successful'] }, '$totalPrice', 0],
          },
        },
        latestDeliveryAddress: { $first: '$latestDeliveryAddressCandidate' },
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $set: { sourcePriority: 1 } },
    {
      $unionWith: {
        coll: User.collection.name,
        pipeline: [
          {
            $match: {
              isDefaultPharmacyClient: true,
              defaultClientPharmacyId: pharmacyId,
            },
          },
          {
            $project: {
              _id: 1,
              firstOrderAt: { $literal: null },
              earliestOrderAt: { $literal: null },
              successfulOrdersCount: { $literal: 0 },
              successfulOrdersAmount: { $literal: 0 },
              latestDeliveryAddress: { $literal: null },
              sourcePriority: { $literal: 0 },
              user: {
                _id: '$_id',
                name: '$name',
                email: '$email',
                phone: '$phone',
                address: '$address',
                pictureUrl: '$pictureUrl',
                status: '$status',
                statusReason: '$statusReason',
                isDefaultPharmacyClient: '$isDefaultPharmacyClient',
              },
            },
          },
        ],
      },
    },
    { $sort: { _id: 1, sourcePriority: -1 } },
    {
      $group: {
        _id: '$_id',
        row: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$row' } },
    {
      $set: {
        isDefault: { $eq: ['$user.isDefaultPharmacyClient', true] },
      },
    },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        photoUrl: {
          $cond: [
            '$isDefault',
            pharmacy.imageUrl ?? null,
            { $ifNull: ['$user.pictureUrl', null] },
          ],
        },
        firstOrderAt: {
          $cond: ['$isDefault', fallbackDate, '$firstOrderAt'],
        },
        earliestOrderAt: 1,
        name: { $cond: ['$isDefault', 'Walk-in client', '$user.name'] },
        email: { $cond: ['$isDefault', '', '$user.email'] },
        phone: { $cond: ['$isDefault', '', '$user.phone'] },
        address: {
          $cond: [
            '$isDefault',
            '',
            {
              $cond: [
                { $gt: [{ $strLenCP: { $ifNull: ['$user.address', ''] } }, 0] },
                '$user.address',
                { $ifNull: ['$latestDeliveryAddress', 'Not specified'] },
              ],
            },
          ],
        },
        successfulOrdersCount: 1,
        successfulOrdersAmount: 1,
        status: {
          $cond: [
            '$isDefault',
            'active',
            {
              $cond: [
                { $eq: ['$user.status', 'blocked'] },
                'blocked',
                'active',
              ],
            },
          ],
        },
        statusReason: {
          $cond: [
            '$isDefault',
            null,
            { $ifNull: ['$user.statusReason', null] },
          ],
        },
        isDefault: 1,
      },
    },
    {
      $facet: {
        items: itemsFacet,
        total: totalFacet,
        statistics: statisticsFacet,
      },
    },
  ];

  const [result] = await Order.aggregate<ClientAggregationResult>(pipeline);
  const total = result?.total[0]?.count ?? 0;
  const statistics = result?.statistics[0] ?? {
    total: 0,
    repeat: 0,
    active: 0,
    blocked: 0,
    earliestOrderAt: null,
  };

  return {
    items: (result?.items ?? []).map((client) => ({
      id: client.id,
      photoUrl: client.photoUrl,
      firstOrderAt: client.firstOrderAt.toISOString(),
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      successfulOrdersCount: client.successfulOrdersCount,
      successfulOrdersAmount: client.successfulOrdersAmount,
      status: client.status,
      ...(client.statusReason ? { statusReason: client.statusReason } : {}),
      isDefault: client.isDefault,
    })),
    total,
    statistics: {
      total: statistics.total,
      repeat: statistics.repeat,
      active: statistics.active,
      blocked: statistics.blocked,
    },
    earliestCreatedAt: statistics.earliestOrderAt
      ? statistics.earliestOrderAt.toISOString().slice(0, 10)
      : null,
  };
}

//===============================================================

export async function getClientsService(userId: string, query: ClientsQuery) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId) {
    return {
      items: [],
      page: 1,
      perPage: query.perPage,
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
      statistics: { total: 0, repeat: 0, active: 0, blocked: 0 },
    };
  }

  let result = await getClientRowsForPharmacy(pharmacyId, query);
  let totalPages = Math.ceil(result.total / query.perPage);
  let page = totalPages === 0 ? 1 : Math.min(query.page, totalPages);

  if (page !== query.page) {
    result = await getClientRowsForPharmacy(pharmacyId, { ...query, page });
    totalPages = Math.ceil(result.total / query.perPage);
    page = totalPages === 0 ? 1 : Math.min(page, totalPages);
  }

  return {
    items: result.items,
    page,
    perPage: query.perPage,
    total: result.total,
    totalPages,
    earliestCreatedAt: result.earliestCreatedAt,
    statistics: result.statistics,
  };
}

//===============================================================

export async function getClientByIdService(userId: string, clientId: string) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  const result = await getClientRowsForPharmacy(pharmacyId, {
    page: 1,
    perPage: 1,
    clientId,
  });

  const client = result.items.find((item) => item.id === clientId);

  if (!client) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  return { client };
}

//===============================================================

function buildClientProductFilterStages(
  query: ClientProductsQuery
): PipelineStage.FacetPipelineStage[] {
  const match: Record<string, unknown> = {};

  if (query.article?.trim()) {
    match.article = createSafeRegExp(query.article.trim());
  }

  if (query.name?.trim()) {
    match.name = createSafeRegExp(query.name.trim());
  }

  if (query.category) {
    match.category = query.category;
  }

  if (query.status) {
    match.currentStatus = query.status;
  }

  if (query.dateFrom || query.dateTo) {
    match.firstOrderDate = {
      ...(query.dateFrom ? { $gte: getStartOfDay(query.dateFrom) } : {}),
      ...(query.dateTo ? { $lte: getEndOfDay(query.dateTo) } : {}),
    };
  }

  return Object.keys(match).length ? [{ $match: match }] : [];
}

//===============================================================

function buildClientProductsAggregationPipeline(
  pharmacyId: Types.ObjectId,
  clientObjectId: Types.ObjectId,
  query: ClientProductsQuery,
  skip: number
): PipelineStage[] {
  const filterStages = buildClientProductFilterStages(query);

  const itemsFacet: PipelineStage.FacetPipelineStage[] = [
    ...filterStages,
    { $sort: { firstOrderDate: -1, productId: 1 } },
    { $skip: skip },
    { $limit: query.perPage },
  ];

  const totalFacet: PipelineStage.FacetPipelineStage[] = [
    ...filterStages,
    { $count: 'count' },
  ];

  const metadataFacet: PipelineStage.FacetPipelineStage[] = [
    {
      $group: {
        _id: null,
        earliestCreatedAt: { $min: '$firstOrderDate' },
      },
    },
    { $project: { _id: 0, earliestCreatedAt: 1 } },
  ];

  return [
    {
      $match: {
        pharmacyId,
        userId: clientObjectId,
        status: 'successful',
      },
    },
    {
      $unwind: {
        path: '$items',
        includeArrayIndex: 'itemIndex',
      },
    },
    {
      $sort: {
        'items.productId': 1,
        createdAt: 1,
        _id: 1,
        itemIndex: 1,
      },
    },
    {
      $group: {
        _id: '$items.productId',
        firstOrderDate: { $min: '$createdAt' },
        photoUrl: {
          $first: { $ifNull: ['$items.productSnapshot.imageUrl', null] },
        },
        article: { $first: '$items.productSnapshot.article' },
        name: { $first: '$items.productSnapshot.name' },
        category: {
          $first: { $ifNull: ['$items.productSnapshot.category', 'other'] },
        },
        quantity: { $sum: '$items.quantity' },
        totalAmount: { $sum: '$items.totalPrice' },
        orderIds: { $addToSet: '$_id' },
      },
    },
    {
      $lookup: {
        from: Product.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'currentProducts',
        pipeline: [{ $project: { _id: 1, status: 1 } }],
      },
    },
    {
      $set: {
        currentProduct: { $arrayElemAt: ['$currentProducts', 0] },
      },
    },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        firstOrderDate: 1,
        productId: { $toString: '$_id' },
        photoUrl: 1,
        article: 1,
        name: 1,
        category: 1,
        quantity: 1,
        totalAmount: 1,
        ordersCount: { $size: '$orderIds' },
        currentProductExists: {
          $ne: [{ $ifNull: ['$currentProduct._id', null] }, null],
        },
        currentStatus: { $ifNull: ['$currentProduct.status', null] },
      },
    },
    {
      $facet: {
        items: itemsFacet,
        total: totalFacet,
        metadata: metadataFacet,
      },
    },
  ];
}

//===============================================================

export async function getClientPurchasedProductsService(
  userId: string,
  clientId: string,
  query: ClientProductsQuery
) {
  const pharmacyId = await getCurrentPharmacyId(userId);

  if (!pharmacyId || !Types.ObjectId.isValid(clientId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
  }

  const clientObjectId = new Types.ObjectId(clientId);
  const requestedSkip = (query.page - 1) * query.perPage;

  let [result] =
    await Order.aggregate<ClientPurchasedProductsAggregationResult>(
      buildClientProductsAggregationPipeline(
        pharmacyId,
        clientObjectId,
        query,
        requestedSkip
      )
    );

  const total = result?.total[0]?.count ?? 0;
  const totalPages = Math.ceil(total / query.perPage);
  const page = totalPages === 0 ? 1 : Math.min(query.page, totalPages);

  if (page !== query.page) {
    [result] = await Order.aggregate<ClientPurchasedProductsAggregationResult>(
      buildClientProductsAggregationPipeline(
        pharmacyId,
        clientObjectId,
        query,
        (page - 1) * query.perPage
      )
    );
  }

  const earliestCreatedAt = result?.metadata[0]?.earliestCreatedAt ?? null;

  if (!earliestCreatedAt) {
    const [clientHasOrders, defaultClientExists] = await Promise.all([
      Order.exists({
        pharmacyId,
        userId: clientObjectId,
      }),
      User.exists({
        _id: clientObjectId,
        isDefaultPharmacyClient: true,
        defaultClientPharmacyId: pharmacyId,
      }),
    ]);

    if (!clientHasOrders && !defaultClientExists) {
      throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
    }
  }

  return {
    items: (result?.items ?? []).map((row) => ({
      ...row,
      firstOrderDate: row.firstOrderDate.toISOString(),
    })),
    page,
    perPage: query.perPage,
    total,
    totalPages,
    earliestCreatedAt: earliestCreatedAt
      ? earliestCreatedAt.toISOString().slice(0, 10)
      : null,
  };
}
