import mongoose, { Types } from 'mongoose';

import { USER_ROLES } from '../constants/auth';
import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { STOCK_CHANGED_ERROR_CODE } from '../constants/stock';
import { isPharmacyOperationalStatus } from '../constants/pharmacy-status';

import {
  CHECKOUT_CART_CHANGED_ERROR_CODE,
  CHECKOUT_GROUP_MISSING_ERROR_CODE,
  MANAGER_ORDER_REQUEST_REUSED_ERROR_CODE,
  PAYMENT_METHOD_UNAVAILABLE_ERROR_CODE,
  PHARMACY_UNAVAILABLE_ERROR_CODE,
} from '../constants/order';

import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { ProductOffer } from '../models/productOffer.model';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';

import { httpError } from '../utils/httpError';
import { getEndOfDay, getStartOfDay } from '../utils/date-range';
import { createSafeRegExp } from '../utils/regexp';
import { isMongoDuplicateKeyError } from '../utils/mongoError';

import {
  commitReservedStock,
  releaseOfferStock,
  reserveOfferStock,
} from './stock.service';

import { getCartService } from './cart.service';
import { createCheckoutGroupFingerprint } from './checkout-group-fingerprint';
import { createManagerOrderRequestFingerprint } from './manager-order-request-fingerprint';

import type {
  CheckoutOrderInput,
  CreateManagerOrderInput,
  CreateOrderManagerCommentInput,
  OrderCommentsQuery,
  OrderSalesStatisticsQuery,
  OrdersQuery,
  UpdateOrderDetailsInput,
  UpdateOrderStatusInput,
} from '../schemas/order.schema';

import type {
  OrderActivityHistoryItem,
  OrderClientSnapshot,
  OrderEntity,
  OrderItemEntity,
  OrderManagerCommentEntity,
  OrderResponseDto,
  OrdersResponseDto,
  OrderSalesStatisticsDto,
  OrderSalesStatisticsGroupBy,
  OrderStatus,
} from '../types/order';

import { PRODUCT_CATEGORIES, type ProductCategory } from '../types/categories';
import type { ProductEntity, ProductOfferEntity } from '../types/product';

import type {
  CompletePharmacyBankDetails,
  EditablePharmacyBankDetails,
  PharmacyEntity,
} from '../types/pharmacy';

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
  revision: number;
  updatedAt: Date;
};

//===============================================================

type ProductDocument = ProductEntity & { _id: Types.ObjectId };
type ProductOfferDocument = ProductOfferEntity & { _id: Types.ObjectId };
type PharmacyDocument = PharmacyEntity & { _id: Types.ObjectId };
type OrderDocument = OrderEntity & { _id: Types.ObjectId };

//===============================================================

type UserDocument = {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
  pictureUrl?: string;
  phone?: string;
  address?: string;
  isDefaultPharmacyClient?: boolean;
  defaultClientPharmacyId?: Types.ObjectId;
  status?: string;
  role?: string;
};

//===============================================================

type ProductFallbackMap = Map<string, ProductDocument>;
type OfferFallbackMap = Map<string, ProductOfferDocument>;
type ClientUserMap = Map<string, UserDocument>;

//===============================================================

type ManagerCommentDto = {
  id: string;
  text: string;
  createdAt: string;
  createdBy: string;

  author: {
    userId: string;
    displayName: string;
  };
};

//===============================================================

const ORDER_STATUSES_FOR_STATISTICS = [
  'new',
  'in_progress',
  'successful',
  'rejected',
] as const;

//===============================================================

function hasCompleteBankDetails(
  bankDetails?: EditablePharmacyBankDetails
): bankDetails is CompletePharmacyBankDetails {
  return Boolean(
    bankDetails?.recipientName &&
    bankDetails.taxId &&
    bankDetails.iban &&
    bankDetails.bankName &&
    bankDetails.receiptEmail &&
    bankDetails.paymentPurpose
  );
}

//===============================================================

function createOrderClientSnapshot(client: UserDocument): OrderClientSnapshot {
  const isDefaultPharmacyClient = Boolean(client.isDefaultPharmacyClient);

  if (isDefaultPharmacyClient) {
    return {
      name: 'Walk-in client',
      isDefaultPharmacyClient: true,
      ...(client.defaultClientPharmacyId
        ? { defaultClientPharmacyId: client.defaultClientPharmacyId }
        : {}),
    };
  }

  return {
    name: client.name?.trim() || client.email?.trim() || 'Client',
    ...(client.email?.trim() ? { email: client.email.trim() } : {}),
    ...(client.phone?.trim() ? { phone: client.phone.trim() } : {}),
    ...(client.address?.trim() ? { address: client.address.trim() } : {}),
    ...(client.pictureUrl?.trim()
      ? { pictureUrl: client.pictureUrl.trim() }
      : {}),
    isDefaultPharmacyClient: false,
  };
}

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

function assertManagerOrderReplayMatches(
  order: OrderDocument,
  requestFingerprint: string
): void {
  if (order.managerRequestFingerprint === requestFingerprint) return;

  throw httpError(
    HTTP_STATUS.CONFLICT,
    'This order request was already used with different order data.',
    undefined,
    MANAGER_ORDER_REQUEST_REUSED_ERROR_CODE
  );
}

//===============================================================

async function findManagerOrderReplay(
  pharmacyId: Types.ObjectId,
  input: CreateManagerOrderInput,
  requestFingerprint: string,
  session?: mongoose.ClientSession
): Promise<{ order: OrderResponseDto } | null> {
  let orderQuery = Order.findOne({
    pharmacyId,
    createdByType: 'manager',
    managerRequestId: input.clientRequestId,
  });

  if (session) orderQuery = orderQuery.session(session);

  const order = await orderQuery.lean<OrderDocument | null>();
  if (!order) return null;

  assertManagerOrderReplayMatches(order, requestFingerprint);

  let clientQuery = User.findById(order.userId).select(
    'name email pictureUrl phone address isDefaultPharmacyClient defaultClientPharmacyId'
  );

  if (session) clientQuery = clientQuery.session(session);

  const client = await clientQuery.lean<UserDocument | null>();
  const clientMap = client
    ? new Map([[String(client._id), client]])
    : undefined;

  return {
    order: serializeOrder(order, undefined, clientMap),
  };
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

function getManagerCommentAuthorDisplayName(
  user?: Pick<UserDocument, 'name' | 'email'> | null
): string {
  return user?.name?.trim() || user?.email?.trim() || 'Pharmacy member';
}

//===============================================================

function findManagerCommentReplay(
  order: OrderDocument,
  actorId: string,
  clientRequestId: string
): OrderManagerCommentEntity | undefined {
  return (order.managerComments ?? []).find(
    (comment) =>
      comment.createdBy.toString() === actorId &&
      comment.clientRequestId === clientRequestId
  );
}

//===============================================================

function assertManagerCommentReplayMatches(
  comment: OrderManagerCommentEntity,
  normalizedText: string
): void {
  if (comment.text !== normalizedText) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Comment request key was already used for different content.'
    );
  }
}

//===============================================================

function serializeCreatedManagerComment(
  comment: OrderManagerCommentEntity,
  actorId: string
) {
  return {
    comment: {
      id: comment._id?.toString() ?? '',
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      createdBy: actorId,
      author: {
        userId: actorId,
        displayName: comment.authorDisplayName?.trim() || 'Pharmacy member',
      },
    },
  };
}

//===============================================================

function serializeManagerComments(order: OrderDocument): ManagerCommentDto[] {
  const comments = (order.managerComments ?? []).map((comment) => ({
    id: comment._id?.toString() ?? '',
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
    createdBy: comment.createdBy.toString(),
    author: {
      userId: comment.createdBy.toString(),
      displayName: comment.authorDisplayName?.trim() || 'Pharmacy member',
    },
  }));

  if (order.managerComment?.trim()) {
    const legacyAuthorId =
      order.statusHistory.at(-1)?.changedBy.toString() ??
      order.userId.toString();

    comments.push({
      id: order._id.toString(),
      text: order.managerComment.trim(),
      createdAt: order.updatedAt.toISOString(),
      createdBy: legacyAuthorId,
      author: {
        userId: legacyAuthorId,
        displayName: 'Pharmacy member',
      },
    });
  }

  return comments
    .filter((comment) => Boolean(comment.id))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

//===============================================================

function serializeOrder(
  order: OrderDocument,
  productFallbacks?: ProductFallbackMap,
  clientUsers?: ClientUserMap,
  offerFallbacks?: OfferFallbackMap
): OrderResponseDto {
  const clientUser = clientUsers?.get(order.userId.toString());
  const clientSnapshot = order.clientSnapshot;
  const clientIdentity = clientSnapshot ?? clientUser;
  const isDefaultPharmacyClient = Boolean(
    clientIdentity?.isDefaultPharmacyClient
  );
  const hasClientIdentity = Boolean(clientIdentity);
  const clientName = isDefaultPharmacyClient
    ? 'Walk-in client'
    : (clientIdentity?.name ?? clientIdentity?.email);
  const clientPhotoUrl = isDefaultPharmacyClient
    ? order.pharmacySnapshot.imageUrl
    : clientIdentity?.pictureUrl;
  const clientPhone = isDefaultPharmacyClient
    ? undefined
    : clientIdentity?.phone;
  const clientAddress = isDefaultPharmacyClient
    ? undefined
    : clientIdentity?.address;
  const managerComments = serializeManagerComments(order);

  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    userId: order.userId.toString(),
    clientId: order.userId.toString(),
    ...(clientName ? { clientName } : {}),
    ...(clientPhotoUrl ? { clientPhotoUrl } : {}),
    ...(clientPhone ? { clientPhone } : {}),
    ...(clientAddress ? { clientAddress } : {}),
    ...(hasClientIdentity
      ? {
          client: {
            id: order.userId.toString(),
            name: clientName ?? 'Client',
            ...(clientPhotoUrl ? { photoUrl: clientPhotoUrl } : {}),
          },
        }
      : {}),
    pharmacyId: order.pharmacyId.toString(),
    pharmacyName: order.pharmacySnapshot.name,
    ...(order.pharmacySnapshot.imageUrl
      ? { pharmacyImageUrl: order.pharmacySnapshot.imageUrl }
      : {}),
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
    ...(order.pharmacySnapshot.workingHours
      ? { pharmacyWorkingHours: order.pharmacySnapshot.workingHours }
      : {}),
    totalItems: order.totalItems,
    totalPrice: order.totalPrice,
    currency: order.currency,
    status: order.status,
    createdByType: order.createdByType ?? 'client',
    statusHistory: order.statusHistory.map((entry) => ({
      status: entry.status,
      changedAt: entry.changedAt.toISOString(),
      changedBy: entry.changedBy.toString(),
      ...(entry.comment ? { comment: entry.comment } : {}),
    })),
    activityHistory: (order.activityHistory ?? []).map((entry) => ({
      type: entry.type,
      occurredAt: entry.occurredAt.toISOString(),
      changedBy: entry.changedBy.toString(),
      productId: entry.productId.toString(),
      productOfferId: entry.productOfferId.toString(),
      productName: entry.productName,
      previousQuantity: entry.previousQuantity,
      quantity: entry.quantity,
      quantityDelta: entry.quantityDelta,
      previousUnitPrice: entry.previousUnitPrice,
      unitPrice: entry.unitPrice,
    })),
    ...(order.rejectionReason
      ? { rejectionReason: order.rejectionReason }
      : {}),
    ...(order.rejectedAt ? { rejectedAt: order.rejectedAt.toISOString() } : {}),
    ...(order.rejectedBy ? { rejectedBy: order.rejectedBy.toString() } : {}),
    paymentMethod: order.paymentMethod,
    delivery: order.delivery,
    ...(order.comment ? { comment: order.comment } : {}),
    ...(order.managerComment ? { managerComment: order.managerComment } : {}),
    managerCommentsCount: managerComments.length,
    ...(managerComments.length ? { managerComments } : {}),
    ...(hasCompleteBankDetails(order.pharmacySnapshot.bankDetails)
      ? { bankDetails: order.pharmacySnapshot.bankDetails }
      : {}),
    items: order.items.map((item) => {
      const productFallback = productFallbacks?.get(item.productId.toString());
      const offerFallback = offerFallbacks?.get(item.productOfferId.toString());
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
        ...(typeof offerFallback?.availableQuantity === 'number'
          ? { availableQuantity: offerFallback.availableQuantity }
          : {}),
        ...(typeof offerFallback?.price === 'number'
          ? { currentPrice: offerFallback.price }
          : {}),
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

async function getOrderOfferFallbacks(
  order: OrderDocument
): Promise<OfferFallbackMap> {
  if (!order.items.length) return new Map();

  const offers = await ProductOffer.find({
    _id: { $in: order.items.map((item) => item.productOfferId) },
  })
    .select('_id price availableQuantity reservedQuantity totalQuantity')
    .lean<ProductOfferDocument[]>();

  return new Map(offers.map((offer) => [String(offer._id), offer]));
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
        HTTP_STATUS.CONFLICT,
        'Selected pharmacy order changed or expired. Please review the updated cart and confirm again.',
        undefined,
        CHECKOUT_CART_CHANGED_ERROR_CODE
      );
    }

    if (offer.availableQuantity < cartItem.quantity) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Available quantity has changed. Please review the order and try again.',
        undefined,
        STOCK_CHANGED_ERROR_CODE
      );
    }

    if (offer.totalQuantity < cartItem.quantity) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Available quantity has changed. Please review the order and try again.',
        undefined,
        STOCK_CHANGED_ERROR_CODE
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
    const createdOrder = await session.withTransaction(async () => {
      const [cart, client] = await Promise.all([
        Cart.findOne({ clientUserId })
          .session(session)
          .lean<CartDocument | null>(),
        User.findById(clientUserId)
          .select(
            'name email pictureUrl phone address isDefaultPharmacyClient defaultClientPharmacyId'
          )
          .session(session)
          .lean<UserDocument | null>(),
      ]);

      if (!cart) {
        throw httpError(HTTP_STATUS.BAD_REQUEST, 'Cart is empty');
      }

      if (!client) {
        throw httpError(HTTP_STATUS.BAD_REQUEST, 'Client is unavailable');
      }

      if (cart.revision !== input.expectedCartRevision) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Cart changed after checkout review. Please review the updated order and confirm again.',
          undefined,
          CHECKOUT_CART_CHANGED_ERROR_CODE
        );
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
          HTTP_STATUS.CONFLICT,
          'Selected pharmacy order is empty or expired. Please return to the cart.',
          undefined,
          CHECKOUT_GROUP_MISSING_ERROR_CODE
        );
      }

      const currentGroupFingerprint = createCheckoutGroupFingerprint({
        pharmacyId: input.pharmacyId,
        items: orderCartItems.map((item) => {
          const offer = initialOfferMap.get(String(item.productOfferId));

          if (!offer) {
            throw httpError(
              HTTP_STATUS.CONFLICT,
              'Selected pharmacy order changed. Please review the cart and confirm again.',
              undefined,
              CHECKOUT_CART_CHANGED_ERROR_CODE
            );
          }

          return {
            id: item._id,
            productOfferId: item.productOfferId,
            quantity: item.quantity,
            unitPrice: offer.price,
          };
        }),
      });

      if (currentGroupFingerprint !== input.groupFingerprint) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Selected pharmacy order changed. Please review the updated order and confirm again.',
          undefined,
          CHECKOUT_CART_CHANGED_ERROR_CODE
        );
      }

      const pharmacy = await Pharmacy.findById(input.pharmacyId)
        .session(session)
        .lean<PharmacyDocument | null>();

      if (!pharmacy || !isPharmacyOperationalStatus(pharmacy.status)) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Pharmacy is unavailable for checkout.',
          undefined,
          PHARMACY_UNAVAILABLE_ERROR_CODE
        );
      }

      if (
        input.paymentMethod === 'bank_transfer' &&
        !hasCompleteBankDetails(pharmacy.bankDetails)
      ) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Bank transfer is unavailable until bank details are completed.',
          undefined,
          PAYMENT_METHOD_UNAVAILABLE_ERROR_CODE
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

      const orderId = new Types.ObjectId();
      const createdAt = new Date();
      const orderNumber = createOrderNumber(orderId);

      for (const item of orderItems) {
        await reserveOfferStock(item.productOfferId, item.quantity, session, {
          source: 'client_order',
          orderId,
          orderNumber,
          orderStatus: 'new',
          occurredAt: createdAt,
          comment: `Order ${orderNumber} reserved ${item.quantity} unit${item.quantity === 1 ? '' : 's'}: available −${item.quantity}, reserved +${item.quantity}; physical stock did not change.`,
        });
      }

      const order = await Order.create(
        [
          {
            _id: orderId,
            userId: new Types.ObjectId(clientUserId),
            clientSnapshot: createOrderClientSnapshot(client),
            pharmacyId: pharmacy._id,
            pharmacySnapshot: {
              name: pharmacy.name,
              address: pharmacy.address,
              ...(pharmacy.city ? { city: pharmacy.city } : {}),
              ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
              ...(pharmacy.email ? { email: pharmacy.email } : {}),
              ...(pharmacy.workingHours
                ? { workingHours: pharmacy.workingHours }
                : {}),
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
            currency: '₴',
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
            createdByType: 'client',
            statusHistory: [
              {
                status: 'new',
                changedAt: createdAt,
                changedBy: new Types.ObjectId(clientUserId),
              },
            ],
            activityHistory: orderItems.map((item) => ({
              type: 'product_added',
              occurredAt: createdAt,
              changedBy: new Types.ObjectId(clientUserId),
              productId: item.productId,
              productOfferId: item.productOfferId,
              productName: item.productSnapshot.name,
              previousQuantity: 0,
              quantity: item.quantity,
              quantityDelta: item.quantity,
              previousUnitPrice: item.unitPrice,
              unitPrice: item.unitPrice,
            })),
            orderNumber,
          },
        ],
        { session }
      );

      const createdOrderDocument = order[0].toObject() as OrderDocument;

      const selectedIds = new Set(
        orderCartItems.map((item) => String(item._id))
      );

      const cartUpdateResult = await Cart.updateOne(
        { _id: cart._id, revision: input.expectedCartRevision },
        {
          $set: {
            items: cart.items.filter(
              (item) => !selectedIds.has(String(item._id))
            ),
          },
          $inc: { revision: 1 },
        },
        { session, runValidators: true }
      );

      if (cartUpdateResult.matchedCount !== 1) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Cart changed during checkout. Please review the updated order and confirm again.',
          undefined,
          CHECKOUT_CART_CHANGED_ERROR_CODE
        );
      }

      return createdOrderDocument;
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

export async function createManagerOrderService(
  actor: { id: string; role: UserRole },
  input: CreateManagerOrderInput
): Promise<{ order: OrderResponseDto }> {
  if (actor.role !== USER_ROLES.PHARMACY) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Only a pharmacy manager can create an order.'
    );
  }

  const requestFingerprint = createManagerOrderRequestFingerprint(input);
  const session = await mongoose.startSession();

  try {
    const transactionResult = await session.withTransaction(async () => {
      const pharmacy = await Pharmacy.findOne({
        $or: [{ ownerId: actor.id }, { managerUserIds: actor.id }],
      })
        .session(session)
        .lean<PharmacyDocument | null>();

      if (!pharmacy) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'An active pharmacy is required to create orders.'
        );
      }

      const replay = await findManagerOrderReplay(
        pharmacy._id,
        input,
        requestFingerprint,
        session
      );

      if (replay) {
        return { kind: 'replay' as const, replay };
      }

      if (!isPharmacyOperationalStatus(pharmacy.status)) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'An active pharmacy is required to create orders.'
        );
      }

      const client = await User.findOne({
        _id: input.clientId,
        role: USER_ROLES.CLIENT,
        status: 'active',
      })
        .session(session)
        .lean<UserDocument | null>();

      if (!client) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'The selected client is inactive or unavailable.'
        );
      }

      const isDefaultClient = Boolean(
        client.isDefaultPharmacyClient &&
        client.defaultClientPharmacyId?.equals(pharmacy._id)
      );

      if (!isDefaultClient) {
        const belongsToPharmacy = await Order.exists({
          pharmacyId: pharmacy._id,
          userId: client._id,
        }).session(session);

        if (!belongsToPharmacy) {
          throw httpError(
            HTTP_STATUS.BAD_REQUEST,
            'The selected client is not connected to this pharmacy.'
          );
        }
      }

      if (
        input.paymentMethod === 'bank_transfer' &&
        !hasCompleteBankDetails(pharmacy.bankDetails)
      ) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Bank transfer is unavailable until bank details are completed.',
          undefined,
          PAYMENT_METHOD_UNAVAILABLE_ERROR_CODE
        );
      }

      const requested = new Map<string, number>();
      for (const item of input.items) {
        requested.set(
          item.productOfferId,
          (requested.get(item.productOfferId) ?? 0) + item.quantity
        );
      }

      const offers = await ProductOffer.find({
        _id: { $in: [...requested.keys()] },
        pharmacyId: pharmacy._id,
      })
        .session(session)
        .lean<ProductOfferDocument[]>();

      if (offers.length !== requested.size) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'One or more product offers are unavailable.'
        );
      }

      const products = await Product.find({
        _id: { $in: offers.map((offer) => offer.productId) },
        status: 'active',
      })
        .session(session)
        .lean<ProductDocument[]>();

      const productMap = new Map(
        products.map((product) => [String(product._id), product])
      );

      const orderItems = offers.map((offer) => {
        const product = productMap.get(String(offer.productId));
        const quantity = requested.get(String(offer._id)) ?? 0;

        if (!product || quantity < 1) {
          throw httpError(
            HTTP_STATUS.BAD_REQUEST,
            'One or more products are unavailable.'
          );
        }

        if (offer.availableQuantity < quantity) {
          throw httpError(
            HTTP_STATUS.CONFLICT,
            `${product.name} does not have enough available stock.`
          );
        }

        return createOrderItemFromProductOffer({ offer, product, quantity });
      });

      const orderId = new Types.ObjectId();
      const createdAt = new Date();
      const orderNumber = createOrderNumber(orderId);

      for (const item of orderItems) {
        await reserveOfferStock(item.productOfferId, item.quantity, session, {
          source: 'client_order',
          orderId,
          orderNumber,
          orderStatus: 'in_progress',
          occurredAt: createdAt,
          comment: `Manager-created order ${orderNumber} reserved ${item.quantity} unit${item.quantity === 1 ? '' : 's'}: available −${item.quantity}, reserved +${item.quantity}; physical stock did not change.`,
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

      const [order] = await Order.create(
        [
          {
            _id: orderId,
            userId: client._id,
            clientSnapshot: createOrderClientSnapshot(client),
            pharmacyId: pharmacy._id,
            pharmacySnapshot: {
              name: pharmacy.name,
              address: pharmacy.address,
              ...(pharmacy.city ? { city: pharmacy.city } : {}),
              ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
              ...(pharmacy.email ? { email: pharmacy.email } : {}),
              ...(pharmacy.workingHours
                ? { workingHours: pharmacy.workingHours }
                : {}),
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
            currency: '₴',
            paymentMethod: input.paymentMethod,
            delivery:
              input.deliveryMethod === 'pickup'
                ? { method: 'pickup' }
                : {
                    method: 'postal_delivery',
                    details: input.deliveryDetails,
                  },
            ...(input.comment ? { comment: input.comment } : {}),
            status: 'in_progress',
            createdByType: 'manager',
            managerRequestId: input.clientRequestId,
            managerRequestFingerprint: requestFingerprint,
            statusHistory: [
              {
                status: 'in_progress',
                changedAt: createdAt,
                changedBy: new Types.ObjectId(actor.id),
                comment: 'Order created by the pharmacy manager.',
              },
            ],
            activityHistory: orderItems.map((item) => ({
              type: 'product_added',
              occurredAt: createdAt,
              changedBy: new Types.ObjectId(actor.id),
              productId: item.productId,
              productOfferId: item.productOfferId,
              productName: item.productSnapshot.name,
              previousQuantity: 0,
              quantity: item.quantity,
              quantityDelta: item.quantity,
              previousUnitPrice: item.unitPrice,
              unitPrice: item.unitPrice,
            })),
            orderNumber,
          },
        ],
        { session }
      );

      return {
        kind: 'created' as const,
        created: {
          order: order.toObject() as OrderDocument,
          client,
        },
      };
    });

    if (!transactionResult) {
      throw httpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Order could not be created.'
      );
    }

    if (transactionResult.kind === 'replay') {
      return transactionResult.replay;
    }

    const clientMap: ClientUserMap = new Map([
      [
        String(transactionResult.created.client._id),
        transactionResult.created.client,
      ],
    ]);

    return {
      order: serializeOrder(
        transactionResult.created.order,
        undefined,
        clientMap
      ),
    };
  } catch (error) {
    if (isMongoDuplicateKeyError(error)) {
      const pharmacyId = await getCurrentPharmacyId(actor.id);

      if (pharmacyId) {
        const replay = await findManagerOrderReplay(
          pharmacyId,
          input,
          requestFingerprint
        );

        if (replay) return replay;
      }
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

//===============================================================

async function getAuthorizedPharmacyOrderStatus(
  actor: { id: string; role: UserRole },
  order: OrderDocument,
  session: mongoose.ClientSession
): Promise<PharmacyEntity['status'] | null> {
  if (actor.role === USER_ROLES.ADMIN) return null;

  if (actor.role !== USER_ROLES.PHARMACY) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Only pharmacy users or admins can access orders.'
    );
  }

  const pharmacy = await Pharmacy.findOne({
    _id: order.pharmacyId,
    $or: [{ ownerId: actor.id }, { managerUserIds: actor.id }],
  })
    .select('status')
    .session(session)
    .lean<Pick<PharmacyDocument, 'status'> | null>();

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Pharmacy access denied.');
  }

  return pharmacy.status;
}

//===============================================================

async function assertCanAccessPharmacyOrder(
  actor: { id: string; role: UserRole },
  order: OrderDocument,
  session: mongoose.ClientSession
): Promise<void> {
  await getAuthorizedPharmacyOrderStatus(actor, order, session);
}

//===============================================================

async function assertCanEditPharmacyOrder(
  actor: { id: string; role: UserRole },
  order: OrderDocument,
  session: mongoose.ClientSession
): Promise<void> {
  const pharmacyStatus = await getAuthorizedPharmacyOrderStatus(
    actor,
    order,
    session
  );

  if (pharmacyStatus !== null && !isPharmacyOperationalStatus(pharmacyStatus)) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Order changes are unavailable while the pharmacy is not active.'
    );
  }
}

//===============================================================

function createOrderItemFromProductOffer({
  offer,
  product,
  quantity,
  previousItem,
}: {
  offer: ProductOfferDocument;
  product: ProductDocument;
  quantity: number;
  previousItem?: OrderItemEntity;
}): OrderItemEntity {
  return {
    ...(previousItem?._id ? { _id: previousItem._id } : {}),
    productId: offer.productId,
    productOfferId: offer._id,
    productSnapshot: {
      name: product.name,
      ...(product.slug ? { slug: product.slug } : {}),
      article: product.article,
      category: product.category,
      ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
      ...(product.manufacturer ? { manufacturer: product.manufacturer } : {}),
      ...(product.dosage ? { dosage: product.dosage } : {}),
      ...(product.packageQuantity
        ? { packageQuantity: product.packageQuantity }
        : {}),
      ...(typeof product.rating === 'number' ? { rating: product.rating } : {}),
      ...(typeof product.reviewsCount === 'number'
        ? { reviewsCount: product.reviewsCount }
        : {}),
    },
    quantity,
    unitPrice:
      previousItem && quantity <= previousItem.quantity
        ? previousItem.unitPrice
        : offer.price,
    totalPrice:
      quantity *
      (previousItem && quantity <= previousItem.quantity
        ? previousItem.unitPrice
        : offer.price),
  };
}

//===============================================================

export async function updateOrderDetailsService(
  actor: { id: string; role: UserRole },
  orderId: string,
  input: UpdateOrderDetailsInput
): Promise<{ order: OrderResponseDto }> {
  const session = await mongoose.startSession();

  try {
    const updatedOrder = await session.withTransaction(async () => {
      const order = await Order.findById(orderId)
        .session(session)
        .lean<OrderDocument | null>();

      if (!order) throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');

      await assertCanEditPharmacyOrder(actor, order, session);

      if (order.status !== 'in_progress') {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Order can be edited only after it is taken into work.'
        );
      }

      const set: Record<string, unknown> = {};
      const unset: Record<string, ''> = {};
      let activityHistoryEntries: OrderActivityHistoryItem[] = [];

      if (input.paymentMethod) {
        if (
          input.paymentMethod === 'bank_transfer' &&
          !hasCompleteBankDetails(order.pharmacySnapshot.bankDetails)
        ) {
          throw httpError(
            HTTP_STATUS.CONFLICT,
            'Bank transfer is unavailable for this order because confirmed bank details are missing.',
            undefined,
            PAYMENT_METHOD_UNAVAILABLE_ERROR_CODE
          );
        }

        set.paymentMethod = input.paymentMethod;
      }

      if (input.deliveryMethod) {
        set.delivery =
          input.deliveryMethod === 'pickup'
            ? { method: 'pickup' }
            : {
                method: 'postal_delivery',
                details: input.deliveryDetails,
              };
      }

      if (typeof input.managerComment === 'string') {
        if (input.managerComment.trim()) {
          set.managerComment = input.managerComment.trim();
        } else {
          unset.managerComment = '';
        }
      }

      if (input.items) {
        const changedAt = new Date();
        const requested = new Map<string, number>();

        for (const item of input.items) {
          requested.set(
            item.productOfferId,
            (requested.get(item.productOfferId) ?? 0) + item.quantity
          );
        }

        if (requested.size === 0) {
          throw httpError(
            HTTP_STATUS.BAD_REQUEST,
            'Order must contain products.'
          );
        }

        const existingByOfferId: Map<string, OrderItemEntity> = new Map(
          order.items.map((item) => [String(item.productOfferId), item])
        );

        const offers = await ProductOffer.find({
          _id: { $in: [...requested.keys()] },
          pharmacyId: order.pharmacyId,
        })
          .session(session)
          .lean<ProductOfferDocument[]>();

        const offerMap: Map<string, ProductOfferDocument> = new Map(
          offers.map((offer) => [String(offer._id), offer])
        );

        if (offerMap.size !== requested.size) {
          throw httpError(
            HTTP_STATUS.BAD_REQUEST,
            'Product offer is unavailable.'
          );
        }

        const products = await Product.find({
          _id: { $in: offers.map((offer) => offer.productId) },
          status: 'active',
        })
          .session(session)
          .lean<ProductDocument[]>();

        const productMap: Map<string, ProductDocument> = new Map(
          products.map((product) => [String(product._id), product])
        );

        for (const oldItem of order.items) {
          const nextQuantity =
            requested.get(String(oldItem.productOfferId)) ?? 0;

          if (nextQuantity < oldItem.quantity) {
            const releasedQuantity = oldItem.quantity - nextQuantity;

            await releaseOfferStock(
              oldItem.productOfferId,
              releasedQuantity,
              session,
              true,
              {
                source: 'client_order',
                orderId: order._id,
                orderNumber: order.orderNumber,
                orderStatus: order.status,
                occurredAt: changedAt,
                comment: `Order ${order.orderNumber} quantity was reduced by ${releasedQuantity}: reserved −${releasedQuantity}, available +${releasedQuantity}; physical stock did not change.`,
              }
            );
          }
        }

        for (const [offerId, nextQuantity] of requested) {
          const oldItem = existingByOfferId.get(offerId);

          if (oldItem && nextQuantity > oldItem.quantity) {
            const reservedQuantity = nextQuantity - oldItem.quantity;

            await reserveOfferStock(
              oldItem.productOfferId,
              reservedQuantity,
              session,
              {
                source: 'client_order',
                orderId: order._id,
                orderNumber: order.orderNumber,
                orderStatus: order.status,
                occurredAt: changedAt,
                comment: `Order ${order.orderNumber} quantity was increased by ${reservedQuantity}: available −${reservedQuantity}, reserved +${reservedQuantity}; physical stock did not change.`,
              }
            );
          }

          if (!oldItem) {
            await reserveOfferStock(offerId, nextQuantity, session, {
              source: 'client_order',
              orderId: order._id,
              orderNumber: order.orderNumber,
              orderStatus: order.status,
              occurredAt: changedAt,
              comment: `Product was added to order ${order.orderNumber}: available −${nextQuantity}, reserved +${nextQuantity}; physical stock did not change.`,
            });
          }
        }

        const nextItems = [...requested.entries()].map(
          ([offerId, quantity]) => {
            const offer = offerMap.get(offerId);

            if (!offer) {
              throw httpError(
                HTTP_STATUS.BAD_REQUEST,
                'Product offer is unavailable.'
              );
            }

            const product = productMap.get(String(offer.productId));

            if (!product) {
              throw httpError(
                HTTP_STATUS.NOT_FOUND,
                API_MESSAGES.PRODUCT_NOT_FOUND
              );
            }

            return createOrderItemFromProductOffer({
              offer,
              product,
              quantity,
              previousItem: existingByOfferId.get(offerId),
            });
          }
        );

        const nextByOfferId = new Map(
          nextItems.map((item) => [String(item.productOfferId), item])
        );
        const changedOfferIds = new Set([
          ...existingByOfferId.keys(),
          ...nextByOfferId.keys(),
        ]);

        activityHistoryEntries = [...changedOfferIds].flatMap((offerId) => {
          const previousItem = existingByOfferId.get(offerId);
          const nextItem = nextByOfferId.get(offerId);
          const previousQuantity = previousItem?.quantity ?? 0;
          const quantity = nextItem?.quantity ?? 0;

          if (previousQuantity === quantity) return [];

          const sourceItem = nextItem ?? previousItem;

          if (!sourceItem) return [];

          const type =
            previousQuantity === 0
              ? 'product_added'
              : quantity === 0
                ? 'product_removed'
                : quantity > previousQuantity
                  ? 'quantity_increased'
                  : 'quantity_decreased';

          return [
            {
              type,
              occurredAt: changedAt,
              changedBy: new Types.ObjectId(actor.id),
              productId: sourceItem.productId,
              productOfferId: sourceItem.productOfferId,
              productName: sourceItem.productSnapshot.name,
              previousQuantity,
              quantity,
              quantityDelta: quantity - previousQuantity,
              previousUnitPrice:
                previousItem?.unitPrice ?? nextItem?.unitPrice ?? 0,
              unitPrice: nextItem?.unitPrice ?? previousItem?.unitPrice ?? 0,
            },
          ];
        });

        set.items = nextItems;
        set.totalItems = nextItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        set.totalPrice = nextItems.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );
      }

      const update: Record<string, unknown> = {
        ...(Object.keys(set).length ? { $set: set } : {}),
        ...(Object.keys(unset).length ? { $unset: unset } : {}),
        ...(activityHistoryEntries.length
          ? { $push: { activityHistory: { $each: activityHistoryEntries } } }
          : {}),
      };

      return Order.findByIdAndUpdate(orderId, update, {
        returnDocument: 'after',
        runValidators: true,
        session,
      }).lean<OrderDocument | null>();
    });

    if (!updatedOrder) {
      throw httpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Order was not updated'
      );
    }

    const [productFallbacks, offerFallbacks, clientUser] = await Promise.all([
      getOrderProductFallbacks(updatedOrder),
      getOrderOfferFallbacks(updatedOrder),
      User.findById(updatedOrder.userId)
        .select(
          'name email pictureUrl phone address isDefaultPharmacyClient defaultClientPharmacyId'
        )
        .lean<UserDocument | null>(),
    ]);

    const clientMap = clientUser
      ? new Map([[String(clientUser._id), clientUser]])
      : undefined;

    return {
      order: serializeOrder(
        updatedOrder,
        productFallbacks,
        clientMap,
        offerFallbacks
      ),
    };
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function getOrderManagerCommentsService(
  actor: { id: string; role: UserRole },
  orderId: string,
  query: OrderCommentsQuery
) {
  const session = await mongoose.startSession();

  try {
    const order = await Order.findById(orderId)
      .session(session)
      .lean<OrderDocument | null>();

    if (!order) throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');

    await assertCanAccessPharmacyOrder(actor, order, session);

    const comments = serializeManagerComments(order);
    const total = comments.length;
    const totalPages = Math.ceil(total / query.perPage);
    const page = totalPages === 0 ? 1 : Math.min(query.page, totalPages);
    const start = (page - 1) * query.perPage;

    return {
      items: comments.slice(start, start + query.perPage),
      page,
      perPage: query.perPage,
      total,
      totalPages,
    };
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function createOrderManagerCommentService(
  actor: { id: string; role: UserRole },
  orderId: string,
  input: CreateOrderManagerCommentInput
) {
  const session = await mongoose.startSession();
  const normalizedText = input.text.trim();
  let resultComment: OrderManagerCommentEntity | null = null;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId)
        .session(session)
        .lean<OrderDocument | null>();

      if (!order) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');
      }

      await assertCanEditPharmacyOrder(actor, order, session);

      const replay = findManagerCommentReplay(
        order,
        actor.id,
        input.clientRequestId
      );

      if (replay) {
        assertManagerCommentReplayMatches(replay, normalizedText);
        resultComment = replay;
        return;
      }

      if (order.status !== 'in_progress') {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Comments can be added only while the order is in progress.'
        );
      }

      const author = await User.findById(actor.id)
        .select('name email')
        .session(session)
        .lean<UserDocument | null>();

      const authorDisplayName = getManagerCommentAuthorDisplayName(author);
      const comment: OrderManagerCommentEntity = {
        _id: new Types.ObjectId(),
        text: normalizedText,
        createdAt: new Date(),
        createdBy: new Types.ObjectId(actor.id),
        authorDisplayName,
        clientRequestId: input.clientRequestId,
      };

      await Order.updateOne(
        { _id: orderId },
        { $push: { managerComments: comment } },
        { session, runValidators: true }
      );

      resultComment = comment;
    });

    const finalComment = resultComment as OrderManagerCommentEntity | null;
    if (!finalComment) {
      throw httpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Comment could not be created.'
      );
    }

    return serializeCreatedManagerComment(finalComment, actor.id);
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function deleteOrderManagerCommentService(
  actor: { id: string; role: UserRole },
  orderId: string,
  commentId: string
) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId)
        .session(session)
        .lean<OrderDocument | null>();

      if (!order) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');
      }

      await assertCanEditPharmacyOrder(actor, order, session);

      if (order.status !== 'in_progress') {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Comments can be deleted only while the order is in progress.'
        );
      }

      if (commentId === order._id.toString() && order.managerComment) {
        await Order.updateOne(
          { _id: orderId },
          { $unset: { managerComment: '' } },
          { session }
        );
        return;
      }

      if (!Types.ObjectId.isValid(commentId)) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Comment was not found');
      }

      const commentExists = (order.managerComments ?? []).some(
        (comment) => comment._id?.toString() === commentId
      );

      if (!commentExists) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Comment was not found');
      }

      await Order.updateOne(
        { _id: orderId },
        { $pull: { managerComments: { _id: new Types.ObjectId(commentId) } } },
        { session }
      );
    });

    return { message: 'Comment deleted successfully.' };
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
    const updatedOrder = await session.withTransaction(async () => {
      const order = await Order.findById(orderId)
        .session(session)
        .lean<OrderDocument | null>();

      if (!order) throw httpError(HTTP_STATUS.NOT_FOUND, 'Order was not found');

      await assertCanEditPharmacyOrder(actor, order, session);

      if (!canTransitionOrderStatus(order.status, input.status)) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          `Order status cannot change from ${order.status} to ${input.status}.`
        );
      }

      const changedAt = new Date();

      if (input.status === 'successful') {
        for (const item of order.items) {
          await commitReservedStock(
            item.productOfferId,
            item.quantity,
            session,
            {
              source: 'client_order',
              orderId: order._id,
              orderNumber: order.orderNumber,
              orderStatus: 'successful',
              occurredAt: changedAt,
              comment: `Order ${order.orderNumber} was completed: ${item.quantity} reserved unit${item.quantity === 1 ? '' : 's'} left the warehouse. Physical stock −${item.quantity}, reserved −${item.quantity}; available stock did not change.`,
            }
          );
        }
      }

      if (input.status === 'rejected') {
        for (const item of order.items) {
          await releaseOfferStock(
            item.productOfferId,
            item.quantity,
            session,
            true,
            {
              source: 'client_order',
              orderId: order._id,
              orderNumber: order.orderNumber,
              orderStatus: 'rejected',
              occurredAt: changedAt,
              comment: `Order ${order.orderNumber} was rejected: ${item.quantity} unit${item.quantity === 1 ? '' : 's'} returned from reserved to available. Physical stock did not change.`,
            }
          );
        }
      }
      const set: Record<string, unknown> = { status: input.status };

      if (input.status === 'successful') {
        set.successfulAt = changedAt;
      }

      if (input.status === 'rejected') {
        set.rejectionReason = input.rejectionReason;
        set.rejectedAt = changedAt;
        set.rejectedBy = new Types.ObjectId(actor.id);
      }

      return Order.findByIdAndUpdate(
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

    const [productFallbacks, offerFallbacks, clientUser] = await Promise.all([
      getOrderProductFallbacks(updatedOrder),
      getOrderOfferFallbacks(updatedOrder),
      User.findById(updatedOrder.userId)
        .select(
          'name email pictureUrl phone address isDefaultPharmacyClient defaultClientPharmacyId'
        )
        .lean<UserDocument | null>(),
    ]);

    const clientMap = clientUser
      ? new Map([[String(clientUser._id), clientUser]])
      : undefined;

    return {
      order: serializeOrder(
        updatedOrder,
        productFallbacks,
        clientMap,
        offerFallbacks
      ),
    };
  } finally {
    await session.endSession();
  }
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

const SALES_DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
});

const SALES_MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

//===============================================================

function formatSalesPeriodLabel(
  key: string,
  groupBy: OrderSalesStatisticsGroupBy
): string {
  const date = new Date(
    `${key}${groupBy === 'month' ? '-01' : ''}T00:00:00.000Z`
  );

  return groupBy === 'day'
    ? SALES_DAY_LABEL_FORMATTER.format(date)
    : SALES_MONTH_LABEL_FORMATTER.format(date);
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
      currency: '₴',
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

  const successfulAtRange = {
    $gte: getStartOfDay(dateFrom),
    $lte: getEndOfDay(dateTo),
  };

  const matchFilter: Record<string, unknown> = {
    pharmacyId,
    status: 'successful',
    $or: [{ successfulAt: successfulAtRange }, { successfulAt: null }],
  };

  if (query.productId) {
    matchFilter['items.productId'] = new Types.ObjectId(query.productId);
  }

  const rows = await Order.aggregate<OrderSalesAggregationRow>([
    { $match: matchFilter },
    {
      $set: {
        _salesSuccessfulAt: {
          $ifNull: [
            '$successfulAt',
            {
              $let: {
                vars: {
                  successfulHistory: {
                    $filter: {
                      input: { $ifNull: ['$statusHistory', []] },
                      as: 'history',
                      cond: { $eq: ['$$history.status', 'successful'] },
                    },
                  },
                },
                in: {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: '$$successfulHistory',
                        as: 'history',
                        in: '$$history.changedAt',
                      },
                    },
                    -1,
                  ],
                },
              },
            },
          ],
        },
      },
    },
    { $match: { _salesSuccessfulAt: successfulAtRange } },
    { $unwind: '$items' },
    {
      $match: query.productId
        ? { 'items.productId': new Types.ObjectId(query.productId) }
        : {},
    },
    {
      $group: {
        _id: {
          period: {
            $dateToString: {
              date: '$_salesSuccessfulAt',
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
    currency: '₴',
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
    filter['pharmacySnapshot.name'] = createSafeRegExp(query.pharmacy.trim());
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

  const [total, statistics, earliestOrder] = await Promise.all([
    Order.countDocuments(filter),
    getOrderStatistics(statisticsFilter),
    Order.findOne(earliestDateFilter)
      .sort({ createdAt: 1 })
      .select('createdAt')
      .lean<{ createdAt: Date } | null>(),
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
