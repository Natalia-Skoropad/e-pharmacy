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

import type { OrderEntity } from '../types/order';
import type { ProductEntity, ProductStatus } from '../types/product';
import type { ProductCategory } from '../types/categories';
import type { PharmacyEntity } from '../types/pharmacy';

//===============================================================

type PharmacyDocument = PharmacyEntity & { _id: Types.ObjectId };
type OrderDocument = OrderEntity & { _id: Types.ObjectId };
type ProductDocument = ProductEntity & { _id: Types.ObjectId };

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
  orderId: string;
  orderDate: string;
  productId: string;
  photoUrl: string | null;
  article: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  totalAmount: number;
  currentProductExists: boolean;
  currentStatus: ProductStatus | null;
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

function matchesClientProductFilters(
  row: ClientPurchasedProductRow,
  query: ClientProductsQuery
): boolean {
  if (
    query.article?.trim() &&
    !createSafeRegExp(query.article.trim()).test(row.article)
  ) {
    return false;
  }

  if (
    query.name?.trim() &&
    !createSafeRegExp(query.name.trim()).test(row.name)
  ) {
    return false;
  }

  if (query.category && row.category !== query.category) return false;
  if (query.status && row.currentStatus !== query.status) return false;

  if (query.dateFrom && row.orderDate < `${query.dateFrom}T00:00:00.000Z`) {
    return false;
  }

  if (query.dateTo && row.orderDate > `${query.dateTo}T23:59:59.999Z`) {
    return false;
  }

  return true;
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

  const orders = await Order.find({
    pharmacyId,
    userId: new Types.ObjectId(clientId),
    status: 'successful',
  })
    .sort({ createdAt: -1 })
    .lean<OrderDocument[]>();

  if (!orders.length) {
    const [clientHasOrders, defaultClientExists] = await Promise.all([
      Order.exists({
        pharmacyId,
        userId: new Types.ObjectId(clientId),
      }),
      User.exists({
        _id: new Types.ObjectId(clientId),
        isDefaultPharmacyClient: true,
        defaultClientPharmacyId: pharmacyId,
      }),
    ]);

    if (!clientHasOrders && !defaultClientExists) {
      throw httpError(HTTP_STATUS.NOT_FOUND, 'Client was not found');
    }

    return {
      items: [],
      page: 1,
      perPage: query.perPage,
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
    };
  }

  const productIds = [
    ...new Set(
      orders.flatMap((order) =>
        order.items.map((item) => item.productId.toString())
      )
    ),
  ].map((productId) => new Types.ObjectId(productId));

  const products = await Product.find({ _id: { $in: productIds } })
    .select('status')
    .lean<ProductDocument[]>();

  const productsById = new Map(
    products.map((product) => [String(product._id), product])
  );

  const rows = orders
    .flatMap((order) =>
      order.items.map((item, itemIndex): ClientPurchasedProductRow => {
        const productId = item.productId.toString();
        const product = productsById.get(productId);
        const snapshot = item.productSnapshot;

        return {
          id: `${order._id.toString()}-${item._id?.toString() ?? itemIndex}`,
          orderId: order._id.toString(),
          orderDate: order.createdAt.toISOString(),
          productId,
          photoUrl: snapshot.imageUrl ?? null,
          article: snapshot.article,
          name: snapshot.name,
          category: snapshot.category ?? 'other',
          quantity: item.quantity,
          totalAmount: item.totalPrice,
          currentProductExists: Boolean(product),
          currentStatus: product?.status ?? null,
        };
      })
    )
    .filter((row) => matchesClientProductFilters(row, query))
    .sort((left, right) => right.orderDate.localeCompare(left.orderDate));

  const total = rows.length;
  const totalPages = Math.ceil(total / query.perPage);
  const page = totalPages === 0 ? 1 : Math.min(query.page, totalPages);
  const skip = (page - 1) * query.perPage;
  const items = rows.slice(skip, skip + query.perPage);

  return {
    items,
    page,
    perPage: query.perPage,
    total,
    totalPages,
    earliestCreatedAt:
      orders[orders.length - 1]?.createdAt.toISOString().slice(0, 10) ?? null,
  };
}
