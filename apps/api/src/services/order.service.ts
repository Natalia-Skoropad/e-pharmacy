import mongoose, { Types } from 'mongoose';

import { PHARMACY_STATUSES, USER_ROLES } from '../constants/auth';
import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';

import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { ProductOffer } from '../models/productOffer.model';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';

import { httpError } from '../utils/httpError';

import {
  commitReservedStock,
  releaseOfferStock,
  reserveOfferStock,
} from './stock.service';

import { getCartService } from './cart.service';

import type {
  CheckoutOrderInput,
  OrderSalesStatisticsQuery,
  OrdersQuery,
  UpdateOrderStatusInput,
} from '../schemas/order.schema';

import type {
  OrderEntity,
  OrderItemEntity,
  OrderResponseDto,
  OrdersResponseDto,
  OrderSalesStatisticsDto,
  OrderSalesStatisticsGroupBy,
  OrderStatus,
} from '../types/order';

import { PRODUCT_CATEGORIES, type ProductCategory } from '../types/categories';
import type { ProductEntity, ProductOfferEntity } from '../types/product';
import type { PharmacyEntity } from '../types/pharmacy';
import type { UserRole } from '../types/user';

//===============================================================

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ['in_progress'],
  in_progress: ['successful', 'rejected'],
  successful: [],
  rejected: [],
};

//===============================================================

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): boolean {
  return ORDER_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}

//===============================================================

type CartItemDocument = {
  _id: Types.ObjectId;
  productOfferId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  expiresAt: Date;
};

type CartDocument = {
  _id: Types.ObjectId;
  clientUserId: Types.ObjectId;
  items: CartItemDocument[];
  updatedAt: Date;
};

type ProductDocument = ProductEntity & { _id: Types.ObjectId };
type ProductOfferDocument = ProductOfferEntity & { _id: Types.ObjectId };
type PharmacyDocument = PharmacyEntity & { _id: Types.ObjectId };
type OrderDocument = OrderEntity & { _id: Types.ObjectId };
type UserDocument = {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
  pictureUrl?: string;
};
type ProductFallbackMap = Map<string, ProductDocument>;
type ClientUserMap = Map<string, UserDocument>;

const ORDER_STATUSES_FOR_STATISTICS = [
  'new',
  'in_progress',
  'successful',
  'rejected',
] as const;

//===============================================================

function isCheckoutPharmacyStatus(status: PharmacyEntity['status']): boolean {
  return (
    status === PHARMACY_STATUSES.ACTIVE ||
    status === PHARMACY_STATUSES.ON_MODERATION
  );
}

//===============================================================

function hasCompleteBankDetails(
  bankDetails?: import('../types/pharmacy').PharmacyBankDetails
): boolean {
  return Boolean(
    bankDetails?.recipientName &&
    bankDetails.taxId &&
    bankDetails.iban &&
    bankDetails.bankName &&
    bankDetails.paymentPurpose
  );
}

//===============================================================

function padDatePart(value: number): string {
  return value.toString().padStart(2, '0');
}

//===============================================================

function createOrderNumber(orderId: Types.ObjectId): string {
  const date = new Date();

  const datePart = [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('');

  const timePart = [
    padDatePart(date.getHours()),
    padDatePart(date.getMinutes()),
    padDatePart(date.getSeconds()),
  ].join('');

  return `EP-${datePart}-${timePart}-${orderId.toString().slice(-8).toUpperCase()}`;
}

//===============================================================

function getPharmacyAddress(
  pharmacySnapshot: OrderEntity['pharmacySnapshot']
): string | undefined {
  const address = [pharmacySnapshot.address, pharmacySnapshot.city]
    .filter(Boolean)
    .join(', ');

  return address || undefined;
}

//===============================================================

function serializeOrder(
  order: OrderDocument,
  productFallbacks?: ProductFallbackMap,
  clientUsers?: ClientUserMap
): OrderResponseDto {
  const clientUser = clientUsers?.get(order.userId.toString());

  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    userId: order.userId.toString(),
    clientId: order.userId.toString(),
    clientName: clientUser?.name ?? undefined,
    clientPhotoUrl: clientUser?.pictureUrl ?? undefined,
    ...(clientUser
      ? {
          client: {
            id: clientUser._id.toString(),
            name: clientUser.name ?? clientUser.email ?? 'Client',
            ...(clientUser.pictureUrl
              ? { photoUrl: clientUser.pictureUrl }
              : {}),
          },
        }
      : {}),
    pharmacyId: order.pharmacyId.toString(),
    pharmacyName: order.pharmacySnapshot.name,
    ...(typeof order.pharmacySnapshot.rating === 'number'
      ? { pharmacyRating: order.pharmacySnapshot.rating }
      : {}),
    ...(typeof order.pharmacySnapshot.reviewsCount === 'number'
      ? { pharmacyReviewsCount: order.pharmacySnapshot.reviewsCount }
      : {}),
    ...(order.pharmacySnapshot.phone
      ? { pharmacyPhone: order.pharmacySnapshot.phone }
      : {}),
    ...(order.pharmacySnapshot.email
      ? { pharmacyEmail: order.pharmacySnapshot.email }
      : {}),
    ...(getPharmacyAddress(order.pharmacySnapshot)
      ? { pharmacyAddress: getPharmacyAddress(order.pharmacySnapshot) }
      : {}),
    totalItems: order.totalItems,
    totalPrice: order.totalPrice,
    currency: order.currency,
    status: order.status,
    statusHistory: order.statusHistory.map((entry) => ({
      status: entry.status,
      changedAt: entry.changedAt.toISOString(),
      changedBy: entry.changedBy.toString(),
      ...(entry.comment ? { comment: entry.comment } : {}),
    })),
    ...(order.rejectionReason
      ? { rejectionReason: order.rejectionReason }
      : {}),
    ...(order.rejectedAt ? { rejectedAt: order.rejectedAt.toISOString() } : {}),
    ...(order.rejectedBy ? { rejectedBy: order.rejectedBy.toString() } : {}),
    paymentMethod: order.paymentMethod,
    delivery: order.delivery,
    ...(order.comment ? { comment: order.comment } : {}),
    ...(order.pharmacySnapshot.bankDetails
      ? { bankDetails: order.pharmacySnapshot.bankDetails }
      : {}),
    items: order.items.map((item) => {
      const productFallback = productFallbacks?.get(item.productId.toString());
      const category =
        item.productSnapshot.category ?? productFallback?.category;

      const rating =
        typeof item.productSnapshot.rating === 'number'
          ? item.productSnapshot.rating
          : productFallback?.rating;

      const reviewsCount =
        typeof item.productSnapshot.reviewsCount === 'number'
          ? item.productSnapshot.reviewsCount
          : productFallback?.reviewsCount;

      return {
        id: item._id?.toString() ?? '',
        productId: item.productId.toString(),
        productOfferId: item.productOfferId.toString(),
        name: item.productSnapshot.name,
        ...(item.productSnapshot.slug
          ? { slug: item.productSnapshot.slug }
          : {}),
        article: item.productSnapshot.article,
        ...(category ? { category } : {}),
        ...(item.productSnapshot.imageUrl
          ? { imageUrl: item.productSnapshot.imageUrl }
          : {}),
        ...(item.productSnapshot.manufacturer
          ? { manufacturer: item.productSnapshot.manufacturer }
          : {}),
        ...(item.productSnapshot.dosage
          ? { dosage: item.productSnapshot.dosage }
          : {}),
        ...(item.productSnapshot.packageQuantity
          ? { packageQuantity: item.productSnapshot.packageQuantity }
          : {}),
        ...(typeof rating === 'number' ? { rating } : {}),
        ...(typeof reviewsCount === 'number' ? { reviewsCount } : {}),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      };
    }),
  };
}

//===============================================================

async function getOrderProductFallbacks(
  order: OrderDocument
): Promise<ProductFallbackMap> {
  const missingProductDetailsIds = order.items
    .filter(
      (item) =>
        !item.productSnapshot.category ||
        typeof item.productSnapshot.rating !== 'number' ||
        typeof item.productSnapshot.reviewsCount !== 'number'
    )
    .map((item) => item.productId);

  if (!missingProductDetailsIds.length) return new Map();

  const products = await Product.find({
    _id: { $in: missingProductDetailsIds },
  })
    .select('category rating reviewsCount')
    .lean<ProductDocument[]>();

  return new Map(products.map((product) => [String(product._id), product]));
}

//===============================================================

type CheckoutCartValidationInput = {
  cartItems: CartItemDocument[];
  offers: ProductOfferDocument[];
  products: ProductDocument[];
  pharmacyId: string;
  now: number;
};

type CheckoutCartValidationResult = {
  offerMap: Map<string, ProductOfferDocument>;
  productMap: Map<string, ProductDocument>;
};

//===============================================================

function validateCheckoutCartItemsOrThrow({
  cartItems,
  offers,
  products,
  pharmacyId,
  now,
}: CheckoutCartValidationInput): CheckoutCartValidationResult {
  const offerMap = new Map(offers.map((offer) => [String(offer._id), offer]));

  const productMap = new Map(
    products.map((product) => [String(product._id), product])
  );

  for (const cartItem of cartItems) {
    const offer = offerMap.get(String(cartItem.productOfferId));

    if (!offer) {
      throw httpError(HTTP_STATUS.BAD_REQUEST, 'Product offer is unavailable');
    }

    if (offer.pharmacyId.toString() !== pharmacyId) {
      throw httpError(
        HTTP_STATUS.BAD_REQUEST,
        'Selected pharmacy order contains an invalid offer.'
      );
    }

    if (cartItem.expiresAt.getTime() <= now) {
      throw httpError(
        HTTP_STATUS.BAD_REQUEST,
        'Selected pharmacy order is empty or expired'
      );
    }

    if (offer.availableQuantity < cartItem.quantity) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Product quantity is no longer available. Please refresh and try again.'
      );
    }

    if (offer.totalQuantity < cartItem.quantity) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Product quantity is no longer available. Please refresh and try again.'
      );
    }

    const product = productMap.get(String(offer.productId));

    if (!product) {
      throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
    }

    if (product.status !== 'active') {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Product is no longer available for checkout.'
      );
    }
  }

  return { offerMap, productMap };
}

//===============================================================

export async function checkoutOrderService(
  clientUserId: string,
  input: CheckoutOrderInput
): Promise<{
  order: OrderResponseDto;
  cart: Awaited<ReturnType<typeof getCartService>>['cart'];
}> {
  const session = await mongoose.startSession();

  try {
    let createdOrder: OrderDocument | null = null;

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ clientUserId })
        .session(session)
        .lean<CartDocument | null>();

      if (!cart) {
        throw httpError(HTTP_STATUS.BAD_REQUEST, 'Cart is empty');
      }

      const offers = await ProductOffer.find({
        _id: { $in: cart.items.map((item) => item.productOfferId) },
      })
        .session(session)
        .lean<ProductOfferDocument[]>();

      const initialOfferMap = new Map(
        offers.map((offer) => [String(offer._id), offer])
      );

      const now = Date.now();

      const orderCartItems = cart.items.filter((item) => {
        const offer = initialOfferMap.get(String(item.productOfferId));

        return offer?.pharmacyId.toString() === input.pharmacyId;
      });

      if (!orderCartItems.length) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Selected pharmacy order is empty or expired'
        );
      }

      const pharmacy = await Pharmacy.findById(input.pharmacyId)
        .session(session)
        .lean<PharmacyDocument | null>();

      if (!pharmacy || !isCheckoutPharmacyStatus(pharmacy.status)) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found');
      }

      if (
        input.paymentMethod === 'bank_transfer' &&
        !hasCompleteBankDetails(pharmacy.bankDetails)
      ) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Bank transfer is unavailable for this pharmacy until bank details are completed.'
        );
      }

      const productIds = orderCartItems.map((item) => {
        const offer = initialOfferMap.get(String(item.productOfferId));

        if (!offer) {
          throw httpError(
            HTTP_STATUS.BAD_REQUEST,
            'Product offer is unavailable'
          );
        }

        return offer.productId;
      });

      const products = await Product.find({ _id: { $in: productIds } })
        .session(session)
        .lean<ProductDocument[]>();

      const { offerMap, productMap } = validateCheckoutCartItemsOrThrow({
        cartItems: orderCartItems,
        offers,
        products,
        pharmacyId: input.pharmacyId,
        now,
      });

      const orderItems: OrderItemEntity[] = orderCartItems.map((cartItem) => {
        const offer = offerMap.get(String(cartItem.productOfferId));

        if (!offer) {
          throw httpError(
            HTTP_STATUS.BAD_REQUEST,
            'Product offer is unavailable'
          );
        }

        const product = productMap.get(String(offer.productId));

        if (!product) {
          throw httpError(
            HTTP_STATUS.NOT_FOUND,
            API_MESSAGES.PRODUCT_NOT_FOUND
          );
        }

        const unitPrice = offer.price;

        return {
          productId: offer.productId,
          productOfferId: offer._id,
          productSnapshot: {
            name: product.name,
            ...(product.slug ? { slug: product.slug } : {}),
            article: product.article,
            category: product.category,
            ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
            ...(product.manufacturer
              ? { manufacturer: product.manufacturer }
              : {}),
            ...(product.dosage ? { dosage: product.dosage } : {}),
            ...(product.packageQuantity
              ? { packageQuantity: product.packageQuantity }
              : {}),
            ...(typeof product.rating === 'number'
              ? { rating: product.rating }
              : {}),
            ...(typeof product.reviewsCount === 'number'
              ? { reviewsCount: product.reviewsCount }
              : {}),
          },
          quantity: cartItem.quantity,
          unitPrice,
          totalPrice: cartItem.quantity * unitPrice,
        };
      });

      const totalItems = orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      const totalPrice = orderItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      for (const item of orderItems) {
        await reserveOfferStock(item.productOfferId, item.quantity, session);
      }

      const orderId = new Types.ObjectId();
      const createdAt = new Date();

      const order = await Order.create(
        [
          {
            _id: orderId,
            userId: new Types.ObjectId(clientUserId),
            pharmacyId: pharmacy._id,
            pharmacySnapshot: {
              name: pharmacy.name,
              address: pharmacy.address,
              ...(pharmacy.city ? { city: pharmacy.city } : {}),
              ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
              ...(pharmacy.email ? { email: pharmacy.email } : {}),
              ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
              ...(typeof pharmacy.rating === 'number'
                ? { rating: pharmacy.rating }
                : {}),
              ...(typeof pharmacy.reviewsCount === 'number'
                ? { reviewsCount: pharmacy.reviewsCount }
                : {}),
              ...(hasCompleteBankDetails(pharmacy.bankDetails)
                ? { bankDetails: pharmacy.bankDetails }
                : {}),
            },
            items: orderItems,
            totalItems,
            totalPrice,
            currency: 'UAH',
            paymentMethod: input.paymentMethod,
            delivery:
              input.deliveryMethod === 'pickup'
                ? { method: 'pickup' }
                : {
                    method: 'postal_delivery',
                    details: input.deliveryDetails,
                  },
            ...(input.comment ? { comment: input.comment } : {}),
            status: 'new',
            statusHistory: [
              {
                status: 'new',
                changedAt: createdAt,
                changedBy: new Types.ObjectId(clientUserId),
              },
            ],
            orderNumber: createOrderNumber(orderId),
          },
        ],
        { session }
      );

      createdOrder = order[0].toObject() as OrderDocument;

      const selectedIds = new Set(
        orderCartItems.map((item) => String(item._id))
      );

      const cartUpdateResult = await Cart.updateOne(
        { _id: cart._id, updatedAt: cart.updatedAt },
        {
          $set: {
            items: cart.items.filter(
              (item) => !selectedIds.has(String(item._id))
            ),
          },
        },
        { session, runValidators: true }
      );

      if (cartUpdateResult.matchedCount !== 1) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Cart was changed by another request. Please refresh and try again.'
        );
      }
    });

    if (!createdOrder) {
      throw httpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Order was not created'
      );
    }

    const { cart } = await getCartService(clientUserId);

    return {
      order: serializeOrder(createdOrder),
      cart,
    };
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function updateOrderStatusService(
  actor: { id: string; role: UserRole },
  orderId: string,
  input: UpdateOrderStatusInput
): Promise<{ order: OrderResponseDto }> {
  const session = await mongoose.startSession();

  try {
    let updatedOrder: OrderDocument | null = null;

    await session.withTransaction(async () => {
      const order = await Order.findById(orderId)
        .session(session)
        .lean<OrderDocument | null>();

      if (!order) throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');

      if (actor.role !== USER_ROLES.ADMIN) {
        if (actor.role !== USER_ROLES.PHARMACY) {
          throw httpError(
            HTTP_STATUS.FORBIDDEN,
            'Only pharmacy users or admins can update order status.'
          );
        }

        const hasAccess = await Pharmacy.exists({
          _id: order.pharmacyId,
          $or: [{ ownerId: actor.id }, { managerUserIds: actor.id }],
        }).session(session);

        if (!hasAccess) {
          throw httpError(HTTP_STATUS.FORBIDDEN, 'Pharmacy access denied.');
        }
      }

      if (!canTransitionOrderStatus(order.status, input.status)) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          `Order status cannot change from ${order.status} to ${input.status}.`
        );
      }

      if (input.status === 'successful') {
        for (const item of order.items) {
          await commitReservedStock(
            item.productOfferId,
            item.quantity,
            session
          );
        }
      }

      if (input.status === 'rejected') {
        for (const item of order.items) {
          await releaseOfferStock(item.productOfferId, item.quantity, session);
        }
      }

      const changedAt = new Date();
      const set: Record<string, unknown> = { status: input.status };

      if (input.status === 'rejected') {
        set.rejectionReason = input.rejectionReason;
        set.rejectedAt = changedAt;
        set.rejectedBy = new Types.ObjectId(actor.id);
      }

      updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: set,
          $push: {
            statusHistory: {
              status: input.status,
              changedAt,
              changedBy: new Types.ObjectId(actor.id),
              ...(input.comment ? { comment: input.comment } : {}),
            },
          },
        },
        { returnDocument: 'after', runValidators: true, session }
      ).lean<OrderDocument | null>();
    });

    if (!updatedOrder) {
      throw httpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Order was not updated'
      );
    }

    return { order: serializeOrder(updatedOrder) };
  } finally {
    await session.endSession();
  }
}

//===============================================================

function getStartOfDay(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

//===============================================================

function getEndOfDay(value: string): Date {
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

//===============================================================

function createOrderSearchRegExp(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

//===============================================================

async function getCurrentPharmacyId(userId: string) {
  if (!Types.ObjectId.isValid(userId)) return null;

  const pharmacy = await Pharmacy.findOne({
    $or: [{ ownerId: userId }, { managerUserIds: userId }],
  })
    .select('_id')
    .lean<{ _id: Types.ObjectId } | null>();

  return pharmacy?._id ?? null;
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

type OrderSalesAggregationRow = {
  _id: {
    period: string;
    category: ProductCategory | null;
  };
  quantity: number;
  amount: number;
};

//===============================================================

function getDefaultSalesDateRange(query: OrderSalesStatisticsQuery) {
  const currentYear = new Date().getUTCFullYear();

  return {
    dateFrom: query.dateFrom ?? `${currentYear}-01-01`,
    dateTo: query.dateTo ?? `${currentYear}-12-31`,
  };
}

//===============================================================

function addSalesPeriod(
  date: Date,
  groupBy: OrderSalesStatisticsGroupBy
): Date {
  const nextDate = new Date(date);

  if (groupBy === 'day') {
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    return nextDate;
  }

  nextDate.setUTCMonth(nextDate.getUTCMonth() + 1, 1);
  return nextDate;
}

//===============================================================

function createSalesPeriodKey(
  date: Date,
  groupBy: OrderSalesStatisticsGroupBy
): string {
  const year = date.getUTCFullYear();
  const month = padDatePart(date.getUTCMonth() + 1);

  if (groupBy === 'day') {
    return `${year}-${month}-${padDatePart(date.getUTCDate())}`;
  }

  return `${year}-${month}`;
}

//===============================================================

function formatSalesPeriodLabel(
  key: string,
  groupBy: OrderSalesStatisticsGroupBy
): string {
  const date = new Date(
    `${key}${groupBy === 'month' ? '-01' : ''}T00:00:00.000Z`
  );

  return new Intl.DateTimeFormat('en-GB', {
    ...(groupBy === 'day' ? { day: '2-digit' } : {}),
    month: 'short',
    ...(groupBy === 'month' ? { year: 'numeric' } : {}),
  }).format(date);
}

//===============================================================

function createEmptySalesValues(categories: readonly ProductCategory[]) {
  return categories.reduce<
    Partial<Record<ProductCategory, { quantity: number; amount: number }>>
  >((acc, category) => {
    acc[category] = { quantity: 0, amount: 0 };
    return acc;
  }, {});
}

//===============================================================

function createSalesPoints({
  rows,
  dateFrom,
  dateTo,
  groupBy,
  categories,
}: {
  rows: OrderSalesAggregationRow[];
  dateFrom: string;
  dateTo: string;
  groupBy: OrderSalesStatisticsGroupBy;
  categories: ProductCategory[];
}): OrderSalesStatisticsDto['points'] {
  const rowMap = new Map<string, OrderSalesAggregationRow>();

  for (const row of rows) {
    const category = row._id.category;
    if (!category || !PRODUCT_CATEGORIES.includes(category)) continue;

    rowMap.set(`${row._id.period}:${category}`, row);
  }

  const points: OrderSalesStatisticsDto['points'] = [];
  let cursor = getStartOfDay(dateFrom);
  const endDate = getEndOfDay(dateTo);

  if (groupBy === 'month') {
    cursor = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1)
    );
  }

  while (cursor.getTime() <= endDate.getTime()) {
    const key = createSalesPeriodKey(cursor, groupBy);
    const values = createEmptySalesValues(categories);

    for (const category of categories) {
      const row = rowMap.get(`${key}:${category}`);
      if (!row) continue;

      values[category] = {
        quantity: row.quantity,
        amount: row.amount,
      };
    }

    points.push({
      key,
      label: formatSalesPeriodLabel(key, groupBy),
      values,
    });

    cursor = addSalesPeriod(cursor, groupBy);
  }

  return points;
}

//===============================================================

export async function getOrderSalesStatisticsService(
  userId: string,
  query: OrderSalesStatisticsQuery,
  role?: UserRole
): Promise<OrderSalesStatisticsDto> {
  const pharmacyId =
    role === USER_ROLES.PHARMACY ? await getCurrentPharmacyId(userId) : null;
  const { dateFrom, dateTo } = getDefaultSalesDateRange(query);
  const groupBy = query.groupBy;

  if (!pharmacyId) {
    return {
      currency: 'UAH',
      groupBy,
      categories: [],
      points: createSalesPoints({
        rows: [],
        dateFrom,
        dateTo,
        groupBy,
        categories: [],
      }),
    };
  }

  const matchFilter: Record<string, unknown> = {
    pharmacyId,
    status: 'successful',
    createdAt: {
      $gte: getStartOfDay(dateFrom),
      $lte: getEndOfDay(dateTo),
    },
  };

  const rows = await Order.aggregate<OrderSalesAggregationRow>([
    { $match: matchFilter },
    { $unwind: '$items' },
    {
      $group: {
        _id: {
          period: {
            $dateToString: {
              date: '$createdAt',
              format: groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m',
              timezone: 'UTC',
            },
          },
          category: { $ifNull: ['$items.productSnapshot.category', 'other'] },
        },
        quantity: { $sum: '$items.quantity' },
        amount: { $sum: '$items.totalPrice' },
      },
    },
    { $sort: { '_id.period': 1, '_id.category': 1 } },
  ]);

  const categories = PRODUCT_CATEGORIES.filter((category) =>
    rows.some((row) => row._id.category === category && row.amount > 0)
  );

  return {
    currency: 'UAH',
    groupBy,
    categories,
    points: createSalesPoints({ rows, dateFrom, dateTo, groupBy, categories }),
  };
}

//===============================================================

export async function getOrdersService(
  userId: string,
  query: OrdersQuery,
  role?: UserRole
): Promise<
  OrdersResponseDto & { page: number; perPage: number; totalPages: number }
> {
  const filter: Record<string, unknown> = {};

  if (role === USER_ROLES.PHARMACY) {
    const pharmacyId = await getCurrentPharmacyId(userId);

    if (!pharmacyId) {
      return {
        items: [],
        page: query.page,
        perPage: query.perPage,
        total: 0,
        totalPages: 0,
        statistics: createEmptyOrderStatistics(),
      };
    }

    filter.pharmacyId = pharmacyId;
  } else {
    filter.userId = userId;
  }

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {
      ...(query.dateFrom ? { $gte: getStartOfDay(query.dateFrom) } : {}),
      ...(query.dateTo ? { $lte: getEndOfDay(query.dateTo) } : {}),
    };
  }

  if (query.orderNumber?.trim()) {
    filter.orderNumber = createOrderSearchRegExp(query.orderNumber.trim());
  }

  if (query.client?.trim()) {
    filter['delivery.details.recipientName'] = createOrderSearchRegExp(
      query.client.trim()
    );
  }

  if (query.deliveryMethod) {
    filter['delivery.method'] = query.deliveryMethod;
  }

  if (query.paymentMethod) {
    filter.paymentMethod = query.paymentMethod;
  }

  const statisticsFilter = { ...filter };

  if (query.status) {
    filter.status = query.status;
  }

  const skip = (query.page - 1) * query.perPage;

  const [orders, total, statistics] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.perPage)
      .lean<OrderDocument[]>(),
    Order.countDocuments(filter),
    getOrderStatistics(statisticsFilter),
  ]);

  const clients = await User.find({
    _id: { $in: orders.map((order) => order.userId) },
  })
    .select('name email pictureUrl')
    .lean<UserDocument[]>();

  const clientMap = new Map(
    clients.map((client) => [String(client._id), client])
  );

  return {
    items: orders.map((order) => serializeOrder(order, undefined, clientMap)),
    page: query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),
    statistics,
  };
}

//===============================================================

export async function getOrderByIdService(
  userId: string,
  orderId: string,
  role?: UserRole
): Promise<{ order: OrderResponseDto }> {
  let filter: Record<string, unknown>;

  if (role === USER_ROLES.PHARMACY) {
    const pharmacyId = await getCurrentPharmacyId(userId);

    if (!pharmacyId) {
      throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');
    }

    filter = Types.ObjectId.isValid(orderId)
      ? { _id: orderId, pharmacyId }
      : { pharmacyId };
  } else {
    if (!Types.ObjectId.isValid(orderId)) {
      throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');
    }

    filter = { _id: orderId, userId };
  }

  const order = await Order.findOne(filter)
    .sort({ createdAt: -1 })
    .lean<OrderDocument | null>();

  if (!order) throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');

  const [productFallbacks, clientUser] = await Promise.all([
    getOrderProductFallbacks(order),
    User.findById(order.userId)
      .select('name email pictureUrl')
      .lean<UserDocument | null>(),
  ]);

  const clientMap = clientUser
    ? new Map([[String(clientUser._id), clientUser]])
    : undefined;

  return { order: serializeOrder(order, productFallbacks, clientMap) };
}
