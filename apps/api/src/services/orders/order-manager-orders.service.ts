import mongoose, { Types } from 'mongoose';

import { USER_ROLES } from '../../constants/auth/auth';
import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { isPharmacyOperationalStatus } from '../../constants/pharmacies/pharmacy-status';
import { requirePharmacyCapability } from '../pharmacies/pharmacy-membership.service';

import {
  MANAGER_ORDER_REQUEST_REUSED_ERROR_CODE,
  PAYMENT_METHOD_UNAVAILABLE_ERROR_CODE,
} from '../../constants/orders/order';

import { Order } from '../../models/orders/order.model';
import { Product } from '../../models/catalog/product.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';
import { User } from '../../models/accounts/user.model';

import { httpError } from '../../utils/http/httpError';
import { isMongoDuplicateKeyError } from '../../utils/database/mongoError';
import { reserveOfferStock } from '../inventory/stock.service';
import { createManagerOrderRequestFingerprint } from './manager-order-request-fingerprint';

import {
  getProductCategoryReferenceMap,
  getProductCategoryReferenceOrThrow,
} from '../catalog/product-category.service';

import type { CreateManagerOrderInput } from '../../schemas/orders/order.schema';
import type { OrderResponseDto } from '../../types/orders/order';
import type { UserRole } from '../../types/accounts/user';
import { hasCompleteBankDetails } from '../pharmacies/bank-details';

import type {
  ProductDocument,
  ProductOfferDocument,
  OrderDocument,
  UserDocument,
  ClientUserMap,
} from './order-shared';

import {
  createOrderClientSnapshot,
  createOrderNumber,
  createOrderPharmacySnapshot,
  serializeOrder,
  createOrderItemFromProductOffer,
} from './order-shared';

import { getCurrentPharmacyId } from './order-access';

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
      const { pharmacy } = await requirePharmacyCapability(
        actor.id,
        'manage_orders',
        { session }
      );

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

      const categoryMap = await getProductCategoryReferenceMap(
        products.map((product) => product.categoryId),
        session
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

        return createOrderItemFromProductOffer({
          offer,
          product,

          category: getProductCategoryReferenceOrThrow(
            categoryMap,
            product.categoryId
          ),

          quantity,
        });
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
