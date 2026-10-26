import mongoose, { Types } from 'mongoose';

import { API_MESSAGES } from '../../constants/shared/messages';
import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { STOCK_CHANGED_ERROR_CODE } from '../../constants/inventory/stock';
import { isPharmacyOperationalStatus } from '../../constants/pharmacies/pharmacy-status';

import {
  CHECKOUT_CART_CHANGED_ERROR_CODE,
  CHECKOUT_GROUP_MISSING_ERROR_CODE,
  PAYMENT_METHOD_UNAVAILABLE_ERROR_CODE,
  PHARMACY_UNAVAILABLE_ERROR_CODE,
} from '../../constants/orders/order';

import { Cart } from '../../models/cart/cart.model';
import { Order } from '../../models/orders/order.model';
import { Product } from '../../models/catalog/product.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { User } from '../../models/accounts/user.model';

import { httpError } from '../../utils/http/httpError';
import { reserveOfferStock } from '../inventory/stock.service';
import { getCartService } from '../cart/cart.service';
import { createCheckoutGroupFingerprint } from './checkout-group-fingerprint';

import {
  getProductCategoryReferenceMap,
  getProductCategoryReferenceOrThrow,
} from '../catalog/product-category.service';

import type { CheckoutOrderInput } from '../../schemas/orders/order.schema';
import type { OrderItemEntity, OrderResponseDto } from '../../types/orders/order';

import { hasCompleteBankDetails } from '../pharmacies/bank-details';

import type {
  CartItemDocument,
  CartDocument,
  ProductDocument,
  ProductOfferDocument,
  PharmacyDocument,
  OrderDocument,
  UserDocument,
} from './order-shared';

import {
  createOrderClientSnapshot,
  createOrderNumber,
  createOrderPharmacySnapshot,
  serializeOrder,
} from './order-shared';

//===============================================================

type CheckoutCartValidationInput = {
  cartItems: CartItemDocument[];
  offers: ProductOfferDocument[];
  products: ProductDocument[];
  pharmacyId: string;
  now: number;
};

//===============================================================

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
      // MongoDB transactions do not support concurrent operations on the same session.
      const cart = await Cart.findOne({ clientUserId })
        .session(session)
        .lean<CartDocument | null>();

      const client = await User.findById(clientUserId)
        .select(
          'name email pictureUrl phone address isDefaultPharmacyClient defaultClientPharmacyId'
        )

        .session(session)
        .lean<UserDocument | null>();

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

      const categoryMap = await getProductCategoryReferenceMap(
        products.map((product) => product.categoryId),
        session
      );

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

        const category = getProductCategoryReferenceOrThrow(
          categoryMap,
          product.categoryId
        );

        return {
          productId: offer.productId,
          productOfferId: offer._id,

          productSnapshot: {
            name: product.name,

            ...(product.slug ? { slug: product.slug } : {}),

            article: product.article,
            categoryId: product.categoryId,
            categoryNameSnapshot: category.name,
            categorySlugSnapshot: category.slug,

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
            pharmacySnapshot: createOrderPharmacySnapshot(pharmacy),
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
