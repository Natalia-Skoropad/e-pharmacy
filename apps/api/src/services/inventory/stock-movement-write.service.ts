import mongoose, { Types } from 'mongoose';

import { StockMovement } from '../../models/inventory/stockMovement.model';

import {
  assertStockBalance,
  getMovementValueQuantity,
} from './stock-movement-balance';

import type {
  RecordStockMovementInput,
  StockOfferSnapshot,
} from './stock-movement-types';

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

    quantity: getMovementValueQuantity({
      stockDelta,
      reservedDelta,
      availableDelta,
    }),

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
