import mongoose, { Types } from 'mongoose';

import { USER_ROLES } from '../constants/auth';
import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';

import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { ProductOffer } from '../models/productOffer.model';
import { Pharmacy } from '../models/pharmacy.model';

import { httpError } from '../utils/httpError';
import { commitReservedStock, releaseOfferStock } from './stock.service';
import { getCartService } from './cart.service';

import type {
  CheckoutOrderInput,
  UpdateOrderStatusInput,
} from '../schemas/order.schema';

import type {
  OrderEntity,
  OrderItemEntity,
  OrderResponseDto,
  OrdersResponseDto,
  OrderStatus,
} from '../types/order';

import type { ProductEntity } from '../types/product';
import type { PharmacyEntity } from '../types/pharmacy';
import type { UserRole } from '../types/user';

//===============================================================

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ['in_progress', 'rejected'],
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
type PharmacyDocument = PharmacyEntity & { _id: Types.ObjectId };
type OrderDocument = OrderEntity & { _id: Types.ObjectId };
type ProductFallbackMap = Map<string, ProductDocument>;

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
  productFallbacks?: ProductFallbackMap
): OrderResponseDto {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
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
        .lean();

      const offerMap = new Map(
        offers.map((offer) => [String(offer._id), offer])
      );

      const orderCartItems = cart.items.filter((item) => {
        const offer = offerMap.get(String(item.productOfferId));

        return (
          offer?.pharmacyId.toString() === input.pharmacyId &&
          item.expiresAt.getTime() > Date.now()
        );
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

      if (!pharmacy || !['active', 'on_moderation'].includes(pharmacy.status)) {
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
        const offer = offerMap.get(String(item.productOfferId));

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

      const productMap = new Map(
        products.map((product) => [String(product._id), product])
      );

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

export async function getOrdersService(
  userId: string
): Promise<OrdersResponseDto> {
  const orders = await Order.find({ userId })
    .sort({ createdAt: -1 })
    .lean<OrderDocument[]>();

  return {
    items: orders.map((order) => serializeOrder(order)),
    total: orders.length,
  };
}

//===============================================================

export async function getOrderByIdService(
  userId: string,
  orderId: string
): Promise<{ order: OrderResponseDto }> {
  const order = await Order.findOne({
    _id: orderId,
    userId,
  }).lean<OrderDocument | null>();

  if (!order) throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');

  const productFallbacks = await getOrderProductFallbacks(order);

  return { order: serializeOrder(order, productFallbacks) };
}
