import mongoose, { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { Order } from '../models/order.model';
import { Pharmacy } from '../models/pharmacy.model';
import { ProductOffer } from '../models/productOffer.model';

import {
  StockMovement,
  type StockMovementEntity,
  type StockMovementEventType,
  type StockMovementSource,
} from '../models/stockMovement.model';

import type { OrderStatus } from '../types/order';
import { httpError } from '../utils/httpError';

//===============================================================

type StockOfferSnapshot = {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  pharmacyId: Types.ObjectId;
  price: number;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
};

type StockMovementContext = {
  source: StockMovementSource;
  orderId?: string | Types.ObjectId;
  orderNumber?: string;
  orderStatus?: OrderStatus;
  occurredAt?: Date;
  comment: string;
};

type RecordStockMovementInput = {
  offer: StockOfferSnapshot;
  eventType: StockMovementEventType;
  stockDelta: number;
  reservedDelta: number;
  availableDelta: number;
  context: StockMovementContext;
  session?: mongoose.ClientSession;
};

type LegacyOrderItem = {
  productOfferId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
};

type LegacyOrder = {
  _id: Types.ObjectId;
  orderNumber: string;
  status: OrderStatus;
  items: LegacyOrderItem[];
  statusHistory: Array<{
    status: OrderStatus;
    changedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

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

function assertStockBalance(input: {
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}): void {
  const { stockQuantity, reservedQuantity, availableQuantity } = input;

  if (
    !Number.isInteger(stockQuantity) ||
    !Number.isInteger(reservedQuantity) ||
    !Number.isInteger(availableQuantity) ||
    stockQuantity < 0 ||
    reservedQuantity < 0 ||
    availableQuantity < 0 ||
    reservedQuantity > stockQuantity ||
    availableQuantity !== stockQuantity - reservedQuantity
  ) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Stock balance is inconsistent. Physical stock must equal reserved plus available stock.'
    );
  }
}

//===============================================================

function getMovementValueQuantity(input: {
  stockDelta: number;
  reservedDelta: number;
  availableDelta: number;
}): number {
  return Math.max(
    Math.abs(input.stockDelta),
    Math.abs(input.reservedDelta),
    Math.abs(input.availableDelta)
  );
}

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
  const statusEntry = [...order.statusHistory]
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

export async function recordStockMovement({
  offer,
  eventType,
  stockDelta,
  reservedDelta,
  availableDelta,
  context,
  session,
}: RecordStockMovementInput): Promise<void> {
  assertStockBalance({
    stockQuantity: offer.totalQuantity,
    reservedQuantity: offer.reservedQuantity,
    availableQuantity: offer.availableQuantity,
  });

  const document = {
    productOfferId: offer._id,
    productId: offer.productId,
    pharmacyId: offer.pharmacyId,
    eventType,
    source: context.source,
    stockDelta,
    reservedDelta,
    availableDelta,
    stockAfter: offer.totalQuantity,
    reservedAfter: offer.reservedQuantity,
    availableAfter: offer.availableQuantity,
    unitPrice: offer.price,
    ...(context.orderId
      ? { orderId: new Types.ObjectId(String(context.orderId)) }
      : {}),
    ...(context.orderNumber ? { orderNumber: context.orderNumber } : {}),
    ...(context.orderStatus ? { orderStatus: context.orderStatus } : {}),
    comment: context.comment,
    occurredAt: context.occurredAt ?? new Date(),
  };

  if (session) {
    await StockMovement.create([document], { session });
    return;
  }

  await StockMovement.create(document);
}

//===============================================================

export async function recordInitialStockArrival(
  offer: StockOfferSnapshot,
  comment = 'Initial stock quantity added to the pharmacy warehouse.',
  session?: mongoose.ClientSession
): Promise<void> {
  await recordStockMovement({
    offer,
    eventType: 'arrival',
    stockDelta: offer.totalQuantity,
    reservedDelta: 0,
    availableDelta: offer.availableQuantity,
    context: {
      source: 'pharmacy_stock',
      occurredAt: new Date(),
      comment,
    },
    session,
  });
}

//===============================================================

/**
 * Rebuilds the ledger once for offers created before stock movements existed.
 * In the legacy model, successful orders did not reduce totalQuantity, so the
 * stored total is treated as the initial physical stock and existing orders
 * are replayed chronologically to calculate the real current balance.
 */
async function backfillLegacyStockHistory(
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

  const documents: Array<Record<string, unknown>> = [
    {
      productOfferId: offer._id,
      productId: offer.productId,
      pharmacyId: offer.pharmacyId,
      eventType: 'arrival',
      source: 'pharmacy_stock',
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
    if (event.eventType === 'reserve') {
      if (event.quantity > availableQuantity) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Legacy stock history cannot be reconstructed because reserved quantity exceeds available stock.'
        );
      }

      reservedQuantity += event.quantity;
      availableQuantity -= event.quantity;
    }

    if (event.eventType === 'release') {
      if (event.quantity > reservedQuantity) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Legacy stock history cannot be reconstructed because released quantity exceeds reserved stock.'
        );
      }

      reservedQuantity -= event.quantity;
      availableQuantity += event.quantity;
    }

    if (event.eventType === 'write_off') {
      if (event.quantity > reservedQuantity || event.quantity > stockQuantity) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Legacy stock history cannot be reconstructed because written-off quantity exceeds reserved stock.'
        );
      }

      stockQuantity -= event.quantity;
      reservedQuantity -= event.quantity;
    }

    assertStockBalance({
      stockQuantity,
      reservedQuantity,
      availableQuantity,
    });

    documents.push({
      productOfferId: offer._id,
      productId: offer.productId,
      pharmacyId: offer.pharmacyId,
      eventType: event.eventType,
      source: 'client_order',
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

//===============================================================

export async function getProductStockMovementsService(
  productId: string,
  userId: string
) {
  const session = await mongoose.startSession();
  let currentOffer: StockOfferSnapshot | undefined;

  try {
    currentOffer = await session.withTransaction(async () => {
      const pharmacy = await Pharmacy.findOne({
        $or: [{ ownerId: userId }, { managerUserIds: userId }],
      })
        .select('_id')
        .session(session)
        .lean<{ _id: Types.ObjectId } | null>();

      if (!pharmacy) {
        throw httpError(
          HTTP_STATUS.NOT_FOUND,
          'Pharmacy profile was not found.'
        );
      }

      const offer = await ProductOffer.findOne({
        productId,
        pharmacyId: pharmacy._id,
      })
        .session(session)
        .lean<StockOfferSnapshot | null>();

      if (!offer) {
        throw httpError(
          HTTP_STATUS.NOT_FOUND,
          'This product is not added to your pharmacy.'
        );
      }

      return backfillLegacyStockHistory(offer, session);
    });
  } finally {
    await session.endSession();
  }

  if (!currentOffer) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product offer was not found.');
  }

  const movements = await StockMovement.find({
    productOfferId: currentOffer._id,
  })
    .sort({ occurredAt: 1, _id: 1 })
    .lean<Array<StockMovementEntity & { _id: Types.ObjectId }>>();

  const orderIds = movements.flatMap((movement) =>
    movement.orderId ? [movement.orderId] : []
  );
  const currentOrderStatuses = new Map<string, OrderStatus>();

  if (orderIds.length > 0) {
    const orders = await Order.find({ _id: { $in: orderIds } })
      .select('_id status')
      .lean<Array<{ _id: Types.ObjectId; status: OrderStatus }>>();

    for (const order of orders) {
      currentOrderStatuses.set(String(order._id), order.status);
    }
  }

  return {
    items: movements.map((movement, index) => {
      const movementValueQuantity = getMovementValueQuantity(movement);
      const orderId = movement.orderId ? String(movement.orderId) : undefined;
      const currentOrderStatus = orderId
        ? currentOrderStatuses.get(orderId)
        : undefined;
      const displayedOrderStatus = currentOrderStatus ?? movement.orderStatus;

      return {
        id: String(movement._id),
        sequence: index + 1,
        occurredAt: movement.occurredAt.toISOString(),
        eventType: movement.eventType,
        source: movement.source,
        stockDelta: movement.stockDelta,
        reservedDelta: movement.reservedDelta,
        availableDelta: movement.availableDelta,
        balanceAfter: {
          stockQuantity: movement.stockAfter,
          reservedQuantity: movement.reservedAfter,
          availableQuantity: movement.availableAfter,
        },
        unitPrice: movement.unitPrice,
        movementValue: movementValueQuantity * movement.unitPrice,
        ...(orderId ? { orderId } : {}),
        ...(movement.orderNumber ? { orderNumber: movement.orderNumber } : {}),
        ...(displayedOrderStatus ? { orderStatus: displayedOrderStatus } : {}),
        ...(movement.orderStatus
          ? { orderStatusAtEvent: movement.orderStatus }
          : {}),
        comment: movement.comment,
      };
    }),
    total: movements.length,
    stock: {
      stockQuantity: currentOffer.totalQuantity,
      reservedQuantity: currentOffer.reservedQuantity,
      availableQuantity: currentOffer.availableQuantity,
    },
  };
}

export type { StockMovementContext };
