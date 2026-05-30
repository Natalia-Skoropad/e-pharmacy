import mongoose, { Types } from 'mongoose';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { Store } from '../models/store.model';
import { httpError } from '../utils/httpError';
import { commitReservedStock } from './inventory.service';

import type { CheckoutOrderInput } from '../schemas/order.schema';

import type {
  OrderEntity,
  OrderItemEntity,
  OrderResponseDto,
  OrdersResponseDto,
} from '../types/order';

import type { ProductEntity, ProductOfferEntity } from '../types/product';
import type { StoreEntity } from '../types/store';

//===============================================================

type CartItemDocument = {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  storeId: Types.ObjectId;
  quantity: number;
  price: number;
  expiresAt: Date;
};

type CartDocument = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: CartItemDocument[];
};

type ProductDocument = ProductEntity & {
  _id: Types.ObjectId;
};

type StoreDocument = StoreEntity & {
  _id: Types.ObjectId;
};

type OrderDocument = OrderEntity & {
  _id: Types.ObjectId;
};

//===============================================================

function hasCompleteBankDetails(
  bankDetails?: import('../types/store').StoreBankDetails
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

function findProductOffer(
  product: ProductDocument,
  storeId: string
): ProductOfferEntity | null {
  return (
    product.offers?.find((offer) => offer.storeId.toString() === storeId) ??
    null
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
  const orderIdPart = orderId.toString().slice(-8).toUpperCase();

  return `EP-${datePart}-${timePart}-${orderIdPart}`;
}

//===============================================================

function getStoreAddress(
  storeSnapshot: OrderEntity['storeSnapshot']
): string | undefined {
  const address = [storeSnapshot.address, storeSnapshot.city]
    .filter(Boolean)
    .join(', ');

  return address || undefined;
}

//===============================================================

function serializeOrder(order: OrderDocument): OrderResponseDto {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    storeId: order.storeId.toString(),
    storeName: order.storeSnapshot.name,
    ...(typeof order.storeSnapshot.rating === 'number'
      ? { storeRating: order.storeSnapshot.rating }
      : {}),
    ...(typeof order.storeSnapshot.reviewsCount === 'number'
      ? { storeReviewsCount: order.storeSnapshot.reviewsCount }
      : {}),
    ...(order.storeSnapshot.phone
      ? { storePhone: order.storeSnapshot.phone }
      : {}),
    ...(order.storeSnapshot.email
      ? { storeEmail: order.storeSnapshot.email }
      : {}),
    ...(getStoreAddress(order.storeSnapshot)
      ? { storeAddress: getStoreAddress(order.storeSnapshot) }
      : {}),
    totalItems: order.totalItems,
    totalPrice: order.totalPrice,
    status: order.status,
    paymentMethod: order.paymentMethod,
    deliveryMethod: order.deliveryMethod,
    ...(order.deliveryDetails
      ? { deliveryDetails: order.deliveryDetails }
      : {}),
    ...(order.comment ? { comment: order.comment } : {}),
    ...(order.storeSnapshot.bankDetails
      ? { bankDetails: order.storeSnapshot.bankDetails }
      : {}),
    items: order.items.map((item) => ({
      id: item.productId.toString(),
      productId: item.productId.toString(),
      name: item.productSnapshot.name,
      ...(item.productSnapshot.slug ? { slug: item.productSnapshot.slug } : {}),
      article: item.productSnapshot.article,
      ...(item.productSnapshot.imageUrl
        ? { imageUrl: item.productSnapshot.imageUrl }
        : {}),
      ...(typeof item.productSnapshot.rating === 'number'
        ? { rating: item.productSnapshot.rating }
        : {}),
      ...(typeof item.productSnapshot.reviewsCount === 'number'
        ? { reviewsCount: item.productSnapshot.reviewsCount }
        : {}),
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
    })),
  };
}

//===============================================================

export async function checkoutOrderService(
  userId: string,
  input: CheckoutOrderInput
): Promise<{ order: OrderResponseDto }> {
  const session = await mongoose.startSession();

  try {
    let createdOrder: OrderDocument | null = null;

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId })
        .session(session)
        .lean<CartDocument | null>();

      if (!cart) {
        throw httpError(HTTP_STATUS.BAD_REQUEST, 'Cart is empty');
      }

      const orderCartItems = (cart.items ?? []).filter(
        (item) =>
          item.storeId.toString() === input.storeId &&
          item.expiresAt.getTime() > Date.now()
      );

      if (orderCartItems.length === 0) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Selected pharmacy invoice is empty or expired'
        );
      }

      const store = await Store.findById(input.storeId)
        .session(session)
        .lean<StoreDocument | null>();

      if (!store || !store.isActive) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found');
      }

      if (input.paymentMethod === 'bank-transfer' && !hasCompleteBankDetails(store.bankDetails)) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Bank transfer is unavailable for this pharmacy until bank details are completed.'
        );
      }

      const productIds = orderCartItems.map((item) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } })
        .session(session)
        .lean<ProductDocument[]>();
      const productMap = new Map(
        products.map((product) => [product._id.toString(), product])
      );

      const orderItems: OrderItemEntity[] = [];

      for (const cartItem of orderCartItems) {
        const product = productMap.get(cartItem.productId.toString());

        if (!product) {
          throw httpError(
            HTTP_STATUS.NOT_FOUND,
            API_MESSAGES.PRODUCT_NOT_FOUND
          );
        }

        const offer = findProductOffer(product, input.storeId);

        if (!offer) {
          throw httpError(
            HTTP_STATUS.BAD_REQUEST,
            `${product.name} is unavailable in this pharmacy`
          );
        }

        await commitReservedStock(
          cartItem.productId,
          cartItem.storeId,
          cartItem.quantity,
          session
        );

        orderItems.push({
          productId: cartItem.productId,
          productSnapshot: {
            name: product.name,
            ...(product.slug ? { slug: product.slug } : {}),
            article: product.article,
            ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
            ...(typeof product.rating === 'number'
              ? { rating: product.rating }
              : {}),
            ...(typeof product.reviewsCount === 'number'
              ? { reviewsCount: product.reviewsCount }
              : {}),
          },
          quantity: cartItem.quantity,
          price: cartItem.price,
          totalPrice: cartItem.quantity * cartItem.price,
        });
      }

      const totalItems = orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const totalPrice = orderItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      const orderId = new Types.ObjectId();

      const order = await Order.create(
        [
          {
            _id: orderId,
            userId: new Types.ObjectId(userId),
            storeId: store._id,
            storeSnapshot: {
              name: store.name,
              address: store.address,
              ...(store.city ? { city: store.city } : {}),
              ...(store.phone ? { phone: store.phone } : {}),
              ...(store.email ? { email: store.email } : {}),
              ...(store.imageUrl ? { imageUrl: store.imageUrl } : {}),
              ...(typeof store.rating === 'number'
                ? { rating: store.rating }
                : {}),
              ...(typeof store.reviewsCount === 'number'
                ? { reviewsCount: store.reviewsCount }
                : {}),
              ...(hasCompleteBankDetails(store.bankDetails)
                ? { bankDetails: store.bankDetails }
                : {}),
            },
            items: orderItems,
            totalItems,
            totalPrice,
            paymentMethod: input.paymentMethod,
            deliveryMethod: input.deliveryMethod,
            ...(input.deliveryDetails
              ? { deliveryDetails: input.deliveryDetails }
              : {}),
            ...(input.comment ? { comment: input.comment } : {}),
            status: 'accepted',
            orderNumber: createOrderNumber(orderId),
          },
        ],
        { session }
      );

      createdOrder = order[0].toObject() as OrderDocument;

      const nextCartItems = cart.items.filter(
        (item) => item.storeId.toString() !== input.storeId
      );

      await Cart.updateOne(
        { userId },
        { $set: { items: nextCartItems } },
        { session }
      );
    });

    if (!createdOrder) {
      throw httpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Order was not created'
      );
    }

    return { order: serializeOrder(createdOrder) };
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
    items: orders.map(serializeOrder),
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

  if (!order) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');
  }

  return { order: serializeOrder(order) };
}
