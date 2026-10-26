import mongoose, { Types } from 'mongoose';

import { API_MESSAGES } from '../../constants/shared/messages';
import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { PAYMENT_METHOD_UNAVAILABLE_ERROR_CODE } from '../../constants/orders/order';
import { Order } from '../../models/orders/order.model';
import { Product } from '../../models/catalog/product.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';
import { User } from '../../models/accounts/user.model';
import { httpError } from '../../utils/http/httpError';

import {
  commitReservedStock,
  releaseOfferStock,
  reserveOfferStock,
} from '../inventory/stock.service';

import {
  getProductCategoryReferenceMap,
  getProductCategoryReferenceOrThrow,
} from '../catalog/product-category.service';

import type {
  UpdateOrderDetailsInput,
  UpdateOrderStatusInput,
} from '../../schemas/orders/order.schema';

import type {
  OrderActivityHistoryItem,
  OrderItemEntity,
  OrderResponseDto,
} from '../../types/orders/order';

import type { UserRole } from '../../types/accounts/user';

import { hasCompleteBankDetails } from '../pharmacies/bank-details';
import { canTransitionOrderStatus } from './order-status';

import type {
  ProductDocument,
  ProductOfferDocument,
  OrderDocument,
  UserDocument,
} from './order-shared';

import {
  serializeOrder,
  getOrderProductFallbacks,
  getOrderOfferFallbacks,
  createOrderItemFromProductOffer,
} from './order-shared';

import { assertCanEditPharmacyOrder } from './order-access';

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

        const categoryMap = await getProductCategoryReferenceMap(
          products.map((product) => product.categoryId),
          session
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

              category: getProductCategoryReferenceOrThrow(
                categoryMap,
                product.categoryId
              ),

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
