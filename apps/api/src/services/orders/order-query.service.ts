import { Types } from 'mongoose';

import { USER_ROLES } from '../../constants/auth';
import { HTTP_STATUS } from '../../constants/httpStatus';
import { Order } from '../../models/orders/order.model';
import { User } from '../../models/accounts/user.model';
import { httpError } from '../../utils/httpError';
import { getEndOfDay, getStartOfDay } from '../../utils/date-range';
import { createSafeRegExp } from '../../utils/regexp';

import type { OrdersQuery } from '../../schemas/order.schema';

import type {
  OrderResponseDto,
  OrderPharmacySnapshot,
  OrdersResponseDto,
} from '../../types/order';

import type { UserRole } from '../../types/user';

import type {
  OrderDocument,
  UserDocument,
  ClientUserMap,
} from './order-shared';

import {
  serializeOrder,
  getOrderProductFallbacks,
  getOrderOfferFallbacks,
} from './order-shared';

import { getCurrentPharmacyId } from './order-access';

//===============================================================

const ORDER_STATUSES_FOR_STATISTICS = [
  'new',
  'in_progress',
  'successful',
  'rejected',
] as const;

//===============================================================

async function createOrderClientSearchCondition(
  rawSearch: string
): Promise<Record<string, unknown>> {
  const search = rawSearch.trim();
  const searchRegExp = createSafeRegExp(search);

  const matchingUsers = await User.find({
    isDefaultPharmacyClient: { $ne: true },

    $or: [
      { name: searchRegExp },
      { email: searchRegExp },
      { phone: searchRegExp },
      { address: searchRegExp },
    ],
  })
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();

  const matchingUserIds = matchingUsers.map((user) => user._id);

  if (Types.ObjectId.isValid(search)) {
    matchingUserIds.push(new Types.ObjectId(search));
  }

  const canMatchIdText = /^[0-9a-f]+$/i.test(search);

  return {
    $or: [
      { 'clientSnapshot.name': searchRegExp },
      { 'clientSnapshot.email': searchRegExp },
      { 'clientSnapshot.phone': searchRegExp },
      { 'clientSnapshot.address': searchRegExp },
      { 'delivery.details.recipientName': searchRegExp },
      { 'delivery.details.recipientPhone': searchRegExp },
      { 'delivery.details.address': searchRegExp },

      ...(matchingUserIds.length > 0
        ? [{ userId: { $in: matchingUserIds } }]
        : []),

      ...(canMatchIdText
        ? [
            {
              $expr: {
                $regexMatch: {
                  input: { $toString: '$userId' },
                  regex: searchRegExp,
                },
              },
            },
          ]
        : []),
    ],
  };
}

//===============================================================

function createEmptyOrderStatistics() {
  return {
    new: { count: 0, amount: 0 },
    in_progress: { count: 0, amount: 0 },
    successful: { count: 0, amount: 0 },
    rejected: { count: 0, amount: 0 },
  };
}

//===============================================================

async function getOrderStatistics(filter: Record<string, unknown>) {
  const rows = await Order.aggregate<{
    _id: (typeof ORDER_STATUSES_FOR_STATISTICS)[number];
    count: number;
    amount: number;
  }>([
    { $match: filter },

    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        amount: { $sum: '$totalPrice' },
      },
    },
  ]);

  const statistics = createEmptyOrderStatistics();

  for (const row of rows) {
    if (!ORDER_STATUSES_FOR_STATISTICS.includes(row._id)) continue;

    statistics[row._id] = {
      count: row.count,
      amount: row.amount,
    };
  }

  return statistics;
}

//===============================================================

function createOrderPharmacySearchCondition(searchValue: string) {
  const search = createSafeRegExp(searchValue);

  return {
    $or: [
      { 'pharmacySnapshot.name': search },
      { 'pharmacySnapshot.phone': search },
      { 'pharmacySnapshot.email': search },
      { 'pharmacySnapshot.address': search },
      { 'pharmacySnapshot.location.address': search },
      { 'pharmacySnapshot.location.settlement': search },
    ],
  };
}

//===============================================================

export async function getOrdersService(
  userId: string,
  query: OrdersQuery,
  role?: UserRole
): Promise<OrdersResponseDto> {
  const filter: Record<string, unknown> = {};

  if (role === USER_ROLES.PHARMACY) {
    const pharmacyId = await getCurrentPharmacyId(userId);

    if (!pharmacyId) {
      return {
        items: [],
        page: 1,
        perPage: query.perPage,
        total: 0,
        totalPages: 0,
        statistics: createEmptyOrderStatistics(),
        earliestCreatedAt: null,
      };
    }

    filter.pharmacyId = pharmacyId;
  } else {
    filter.userId = userId;
  }

  const earliestDateFilter: Record<string, unknown> = { ...filter };

  if (query.productId) {
    earliestDateFilter['items.productId'] = new Types.ObjectId(query.productId);
  }

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {
      ...(query.dateFrom ? { $gte: getStartOfDay(query.dateFrom) } : {}),
      ...(query.dateTo ? { $lte: getEndOfDay(query.dateTo) } : {}),
    };
  }

  if (query.orderNumber?.trim()) {
    filter.orderNumber = createSafeRegExp(query.orderNumber.trim());
  }

  if (query.client?.trim()) {
    const clientSearchCondition = await createOrderClientSearchCondition(
      query.client
    );

    filter.$and = [
      ...((filter.$and as Record<string, unknown>[] | undefined) ?? []),

      clientSearchCondition,
    ];
  }

  if (query.pharmacy?.trim()) {
    filter.$and = [
      ...((filter.$and as Record<string, unknown>[] | undefined) ?? []),
      createOrderPharmacySearchCondition(query.pharmacy.trim()),
    ];
  }

  // Never let a user-supplied pharmacy ID override the authenticated pharmacy's tenant boundary.
  if (query.pharmacyId && role !== USER_ROLES.PHARMACY) {
    filter.pharmacyId = new Types.ObjectId(query.pharmacyId);
  }

  if (query.clientId) {
    const clientObjectId = new Types.ObjectId(query.clientId);

    filter.userId = clientObjectId;
    earliestDateFilter.userId = clientObjectId;
  }

  if (query.deliveryMethod) {
    filter['delivery.method'] = query.deliveryMethod;
  }

  if (query.paymentMethod) {
    filter.paymentMethod = query.paymentMethod;
  }

  if (query.createdByType) {
    filter.createdByType = query.createdByType;
  }

  if (query.productId) {
    filter['items.productId'] = new Types.ObjectId(query.productId);
  }

  if (query.comment?.trim()) {
    const commentRegExp = createSafeRegExp(query.comment.trim());

    filter.$or = [
      { comment: commentRegExp },
      { managerComment: commentRegExp },
      { 'managerComments.text': commentRegExp },
      { 'statusHistory.comment': commentRegExp },
    ];
  }

  if (query.clientComment?.trim()) {
    filter.comment = createSafeRegExp(query.clientComment.trim());
  }

  if (query.clientCommentPresence === 'with') {
    filter.$and = [
      ...((filter.$and as Record<string, unknown>[] | undefined) ?? []),

      { comment: { $exists: true, $nin: ['', null] } },
    ];
  } else if (query.clientCommentPresence === 'without') {
    filter.$and = [
      ...((filter.$and as Record<string, unknown>[] | undefined) ?? []),

      {
        $or: [
          { comment: { $exists: false } },
          { comment: '' },
          { comment: null },
        ],
      },
    ];
  }

  const statisticsFilter = { ...filter };

  if (query.status) {
    filter.status = query.status;
  }

  const [
    total,
    statistics,
    earliestOrder,
    pharmacyOptions,
    orderNumberOptions,
  ] = await Promise.all([
    Order.countDocuments(filter),
    getOrderStatistics(statisticsFilter),

    Order.findOne(earliestDateFilter)
      .sort({ createdAt: 1 })
      .select('createdAt')
      .lean<{ createdAt: Date } | null>(),

    role === USER_ROLES.PHARMACY
      ? Promise.resolve(
          [] as Array<{
            _id: Types.ObjectId;
            snapshot: OrderPharmacySnapshot;
          }>
        )
      : Order.aggregate<{
          _id: Types.ObjectId;
          snapshot: OrderPharmacySnapshot;
        }>([
          {
            $match: {
              userId: new Types.ObjectId(userId),
              // Pharmacy choices depend on the selected order, not on themselves.
              ...(query.orderNumber?.trim()
                ? { orderNumber: createSafeRegExp(query.orderNumber.trim()) }
                : {}),
            },
          },
          { $sort: { createdAt: -1 } },

          {
            $group: {
              _id: '$pharmacyId',
              snapshot: { $first: '$pharmacySnapshot' },
            },
          },

          { $sort: { 'snapshot.name': 1 } },
        ]),

    role === USER_ROLES.PHARMACY
      ? Promise.resolve([] as string[])
      : Order.distinct('orderNumber', {
          userId: new Types.ObjectId(userId),

          // Order choices depend on the selected pharmacy, not on themselves.
          ...(query.pharmacyId
            ? { pharmacyId: new Types.ObjectId(query.pharmacyId) }
            : query.pharmacy?.trim()
              ? createOrderPharmacySearchCondition(query.pharmacy.trim())
              : {}),
        }),
  ]);

  const totalPages = Math.ceil(total / query.perPage);
  const page = totalPages === 0 ? 1 : Math.min(query.page, totalPages);
  const skip = (page - 1) * query.perPage;

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(query.perPage)
    .lean<OrderDocument[]>();

  const clients = await User.find({
    _id: { $in: orders.map((order) => order.userId) },
  })
    .select(
      'name email pictureUrl phone address isDefaultPharmacyClient defaultClientPharmacyId'
    )
    .lean<UserDocument[]>();

  const clientMap: ClientUserMap = new Map(
    clients.map((client) => [String(client._id), client])
  );

  return {
    items: orders.map((order) => serializeOrder(order, undefined, clientMap)),
    page,
    perPage: query.perPage,
    total,
    totalPages,
    statistics,

    orderNumberOptions: orderNumberOptions
      .filter((number): number is string => typeof number === 'string')
      .sort((first, second) => second.localeCompare(first, 'en')),

    pharmacyOptions: pharmacyOptions.map(({ _id, snapshot }) => ({
      id: String(_id),
      name: snapshot.name,

      ...(snapshot.phone ? { phone: snapshot.phone } : {}),
      ...(snapshot.email ? { email: snapshot.email } : {}),

      ...(snapshot.location?.address || snapshot.address
        ? { address: snapshot.location?.address || snapshot.address }
        : {}),

      ...(snapshot.imageUrl ? { imageUrl: snapshot.imageUrl } : {}),
    })),

    earliestCreatedAt: earliestOrder
      ? earliestOrder.createdAt.toISOString().slice(0, 10)
      : null,
  };
}

//===============================================================

export async function getOrderByIdService(
  userId: string,
  orderId: string,
  role?: UserRole
): Promise<{ order: OrderResponseDto }> {
  if (!Types.ObjectId.isValid(orderId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');
  }

  let filter: Record<string, unknown>;

  if (role === USER_ROLES.PHARMACY) {
    const pharmacyId = await getCurrentPharmacyId(userId);

    if (!pharmacyId) {
      throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');
    }

    filter = { _id: orderId, pharmacyId };
  } else {
    filter = { _id: orderId, userId };
  }

  const order = await Order.findOne(filter).lean<OrderDocument | null>();

  if (!order) throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');

  const [productFallbacks, offerFallbacks, clientUser] = await Promise.all([
    getOrderProductFallbacks(order),
    getOrderOfferFallbacks(order),

    User.findById(order.userId)
      .select(
        'name email pictureUrl phone address isDefaultPharmacyClient defaultClientPharmacyId'
      )
      .lean<UserDocument | null>(),
  ]);

  const clientMap = clientUser
    ? new Map([[String(clientUser._id), clientUser]])
    : undefined;

  return {
    order: serializeOrder(order, productFallbacks, clientMap, offerFallbacks),
  };
}
