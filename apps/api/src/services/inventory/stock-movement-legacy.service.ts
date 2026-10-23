import mongoose, { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/httpStatus';

import { Order } from '../../models/orders/order.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';

import {
  StockMovement,
  type StockMovementEventType,
} from '../../models/inventory/stockMovement.model';

import type { OrderStatus } from '../../types/order';

import { httpError } from '../../utils/httpError';
import { isValidStockBalance } from './stock-movement-balance';

import type { StockOfferSnapshot } from './stock-movement-types';

//===============================================================

type LegacyOrderItem = {
  productOfferId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
};

//===============================================================

type LegacyOrder = {
  _id: Types.ObjectId;
  orderNumber: string;
  status: OrderStatus;
  items: LegacyOrderItem[];

  statusHistory?: Array<{
    status: OrderStatus;
    changedAt: Date;
  }>;

  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

type LegacyEvent = {
  eventType: Exclude<StockMovementEventType, 'arrival' | 'adjustment'>;
  quantity: number;
  unitPrice: number;
  orderId: Types.ObjectId;
  orderNumber: string;
  orderStatus: OrderStatus;
  occurredAt: Date;
};

//===============================================================

function buildMovementComment(event: LegacyEvent): string {
  const quantity = event.quantity;

  if (event.eventType === 'reserve') {
    return `Order ${event.orderNumber} reserved ${quantity} unit${quantity === 1 ? '' : 's'}: available −${quantity}, reserved +${quantity}; physical stock did not change.`;
  }

  if (event.eventType === 'write_off') {
    return `Order ${event.orderNumber} was completed: ${quantity} reserved unit${quantity === 1 ? '' : 's'} left the warehouse. Physical stock −${quantity}, reserved −${quantity}; available stock did not change.`;
  }

  return `Order ${event.orderNumber} was rejected: ${quantity} unit${quantity === 1 ? '' : 's'} returned from reserved to available. Physical stock did not change.`;
}

//===============================================================

function getFinalStatusDate(order: LegacyOrder): Date {
  const statusEntry = [...(order.statusHistory ?? [])]
    .reverse()
    .find((entry) => entry.status === order.status);

  return statusEntry?.changedAt ?? order.updatedAt;
}

//===============================================================

function getLegacyEvents(orders: LegacyOrder[], offerId: Types.ObjectId) {
  const events: LegacyEvent[] = [];

  for (const order of orders) {
    const item = order.items.find(
      (orderItem) => String(orderItem.productOfferId) === String(offerId)
    );

    if (!item) continue;

    events.push({
      eventType: 'reserve',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderStatus: 'new',
      occurredAt: order.createdAt,
    });

    if (order.status === 'successful') {
      events.push({
        eventType: 'write_off',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: 'successful',
        occurredAt: getFinalStatusDate(order),
      });
    }

    if (order.status === 'rejected') {
      events.push({
        eventType: 'release',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: 'rejected',
        occurredAt: getFinalStatusDate(order),
      });
    }
  }

  const eventPriority: Record<LegacyEvent['eventType'], number> = {
    reserve: 0,
    release: 1,
    write_off: 1,
  };

  return events.sort(
    (first, second) =>
      first.occurredAt.getTime() - second.occurredAt.getTime() ||
      eventPriority[first.eventType] - eventPriority[second.eventType]
  );
}

//===============================================================

function buildLegacyBalanceSnapshot(
  offer: StockOfferSnapshot,
  occurredAt: Date
): Record<string, unknown> {
  return {
    productOfferId: offer._id,
    productId: offer.productId,
    pharmacyId: offer.pharmacyId,
    eventType: 'adjustment',
    source: 'pharmacy_stock',
    quantity: 0,
    stockDelta: 0,
    reservedDelta: 0,
    availableDelta: 0,
    stockAfter: offer.totalQuantity,
    reservedAfter: offer.reservedQuantity,
    availableAfter: offer.availableQuantity,
    unitPrice: offer.price,

    comment:
      'Legacy movement history could not be reconstructed safely. The current stock balance was preserved and recorded as a migration snapshot.',

    occurredAt,
  };
}

//===============================================================

export async function backfillLegacyStockHistory(
  offer: StockOfferSnapshot,
  session: mongoose.ClientSession
): Promise<StockOfferSnapshot> {
  const movementExists = await StockMovement.exists({
    productOfferId: offer._id,
  }).session(session);

  if (movementExists) return offer;

  const orders = await Order.find({
    pharmacyId: offer.pharmacyId,
    'items.productOfferId': offer._id,
  })
    .sort({ createdAt: 1, _id: 1 })
    .session(session)
    .lean<LegacyOrder[]>();

  let stockQuantity = offer.totalQuantity;
  let reservedQuantity = 0;
  let availableQuantity = stockQuantity;

  const firstOrderDate = orders[0]?.createdAt;

  const arrivalDate = firstOrderDate
    ? new Date(firstOrderDate.getTime() - 1)
    : new Date();

  let canReconstructHistory = true;

  const documents: Array<Record<string, unknown>> = [
    {
      productOfferId: offer._id,
      productId: offer.productId,
      pharmacyId: offer.pharmacyId,
      eventType: 'arrival',
      source: 'pharmacy_stock',
      quantity: stockQuantity,
      stockDelta: stockQuantity,
      reservedDelta: 0,
      availableDelta: availableQuantity,
      stockAfter: stockQuantity,
      reservedAfter: 0,
      availableAfter: availableQuantity,
      unitPrice: offer.price,

      comment:
        'Initial stock quantity added to the pharmacy warehouse. Legacy history was reconstructed from existing orders.',

      occurredAt: arrivalDate,
    },
  ];

  for (const event of getLegacyEvents(orders, offer._id)) {
    if (!Number.isInteger(event.quantity) || event.quantity < 1) {
      canReconstructHistory = false;
      break;
    }

    if (event.eventType === 'reserve') {
      if (event.quantity > availableQuantity) {
        canReconstructHistory = false;
        break;
      }

      reservedQuantity += event.quantity;
      availableQuantity -= event.quantity;
    }

    if (event.eventType === 'release') {
      if (event.quantity > reservedQuantity) {
        canReconstructHistory = false;
        break;
      }

      reservedQuantity -= event.quantity;
      availableQuantity += event.quantity;
    }

    if (event.eventType === 'write_off') {
      if (event.quantity > reservedQuantity || event.quantity > stockQuantity) {
        canReconstructHistory = false;
        break;
      }

      stockQuantity -= event.quantity;
      reservedQuantity -= event.quantity;
    }

    if (
      !isValidStockBalance({
        stockQuantity,
        reservedQuantity,
        availableQuantity,
      })
    ) {
      canReconstructHistory = false;
      break;
    }

    documents.push({
      productOfferId: offer._id,
      productId: offer.productId,
      pharmacyId: offer.pharmacyId,
      eventType: event.eventType,
      source: 'client_order',
      quantity: event.quantity,
      stockDelta: event.eventType === 'write_off' ? -event.quantity : 0,

      reservedDelta:
        event.eventType === 'reserve' ? event.quantity : -event.quantity,

      availableDelta:
        event.eventType === 'reserve'
          ? -event.quantity
          : event.eventType === 'release'
            ? event.quantity
            : 0,

      stockAfter: stockQuantity,
      reservedAfter: reservedQuantity,
      availableAfter: availableQuantity,
      unitPrice: event.unitPrice,
      orderId: event.orderId,
      orderNumber: event.orderNumber,
      orderStatus: event.orderStatus,
      comment: buildMovementComment(event),
      occurredAt: event.occurredAt,
    });
  }

  if (!canReconstructHistory) {
    await StockMovement.create(
      [buildLegacyBalanceSnapshot(offer, new Date())],
      { session }
    );

    return offer;
  }

  await StockMovement.insertMany(documents, { session });

  const updatedOffer = await ProductOffer.findByIdAndUpdate(
    offer._id,
    {
      $set: {
        totalQuantity: stockQuantity,
        reservedQuantity,
        availableQuantity,
      },
    },

    { returnDocument: 'after', runValidators: true, session }
  ).lean<StockOfferSnapshot | null>();

  if (!updatedOffer) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product offer was not found.');
  }

  return updatedOffer;
}
