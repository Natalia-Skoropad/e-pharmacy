import mongoose from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { Order } from '../../models/orders/order.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';

import {
  StockMovement,
  type StockMovementEventType,
  type StockMovementSource,
} from '../../models/inventory/stockMovement.model';

import {
  requirePharmacyCapability,
  isPharmacyMembershipMissing,
} from '../pharmacies/pharmacy-membership.service';

import type { OrderStatus } from '../../types/order';
import { httpError } from '../../utils/httpError';
import { getMovementValueQuantity } from './stock-movement-balance';
import { backfillLegacyStockHistory } from './stock-movement-legacy.service';
import { reconcileOfferReservationBalance } from './stock-movement-reconcile.service';
import { aggregateOrderMovements } from './stock-movement-projection';

import type {
  CurrentOrderSnapshot,
  StockMovementDocument,
  StockOfferSnapshot,
} from './stock-movement-types';

//===============================================================

export async function getProductStockMovementsService(
  productId: string,
  userId: string
) {
  const session = await mongoose.startSession();

  let currentOffer: StockOfferSnapshot | undefined;

  try {
    currentOffer = await session.withTransaction(async () => {
      let pharmacy;

      try {
        ({ pharmacy } = await requirePharmacyCapability(userId, 'read_stock', {
          session,
        }));
      } catch (error) {
        if (isPharmacyMembershipMissing(error)) {
          throw httpError(
            HTTP_STATUS.NOT_FOUND,
            'Pharmacy profile was not found.'
          );
        }

        throw error;
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

      const offerWithHistory = await backfillLegacyStockHistory(offer, session);

      return reconcileOfferReservationBalance(offerWithHistory, session);
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
    .lean<StockMovementDocument[]>();

  const orderIds = [
    ...new Set(
      movements.flatMap((movement) =>
        movement.orderId ? [String(movement.orderId)] : []
      )
    ),
  ];

  const ordersById = new Map<string, CurrentOrderSnapshot>();

  if (orderIds.length > 0) {
    const orders = await Order.find({ _id: { $in: orderIds } })
      .select(
        '_id status orderNumber items.productOfferId items.quantity items.unitPrice statusHistory createdAt updatedAt'
      )

      .lean<CurrentOrderSnapshot[]>();

    for (const order of orders) {
      ordersById.set(String(order._id), order);
    }
  }

  const orderMovementGroups = new Map<string, StockMovementDocument[]>();

  const rows: Array<{
    id: string;
    occurredAt: Date;
    eventType: StockMovementEventType;
    source: StockMovementSource;
    quantity: number;
    stockDelta: number;
    reservedDelta: number;
    availableDelta: number;

    balanceAfter: {
      stockQuantity: number;
      reservedQuantity: number;
      availableQuantity: number;
    };

    unitPrice: number;
    movementValue: number;
    orderId?: string;
    orderNumber?: string;
    orderStatus?: OrderStatus;
    orderStatusAtEvent?: OrderStatus;
    comment: string;
  }> = [];

  for (const movement of movements) {
    if (movement.source === 'client_order' && movement.orderId) {
      const orderId = String(movement.orderId);
      const group = orderMovementGroups.get(orderId) ?? [];

      group.push(movement);
      orderMovementGroups.set(orderId, group);

      continue;
    }

    const eventType =
      movement.eventType === 'adjustment' && movement.stockDelta > 0
        ? 'arrival'
        : movement.eventType;

    const quantity = movement.quantity ?? getMovementValueQuantity(movement);

    rows.push({
      id: String(movement._id),
      occurredAt: movement.occurredAt,
      eventType,
      source: movement.source,
      quantity,
      stockDelta: movement.stockDelta,
      reservedDelta: movement.reservedDelta,
      availableDelta: movement.availableDelta,

      balanceAfter: {
        stockQuantity: movement.stockAfter,
        reservedQuantity: movement.reservedAfter,
        availableQuantity: movement.availableAfter,
      },

      unitPrice: movement.unitPrice,
      movementValue: quantity * movement.unitPrice,
      comment: movement.comment,
    });
  }

  for (const [orderId, orderMovements] of orderMovementGroups) {
    const aggregatedMovement = aggregateOrderMovements(
      orderMovements,
      ordersById.get(orderId),
      currentOffer._id
    );

    if (aggregatedMovement) rows.push(aggregatedMovement);
  }

  rows.sort(
    (first, second) =>
      second.occurredAt.getTime() - first.occurredAt.getTime() ||
      second.id.localeCompare(first.id)
  );

  const latestRow = rows[0];

  if (latestRow) {
    latestRow.balanceAfter = {
      stockQuantity: currentOffer.totalQuantity,
      reservedQuantity: currentOffer.reservedQuantity,
      availableQuantity: currentOffer.availableQuantity,
    };
  }

  return {
    items: rows.map((row, index) => ({
      ...row,

      sequence: rows.length - index,
      occurredAt: row.occurredAt.toISOString(),
    })),

    page: 1,
    perPage: Math.max(rows.length, 1),
    total: rows.length,
    totalPages: rows.length > 0 ? 1 : 0,

    stock: {
      stockQuantity: currentOffer.totalQuantity,
      reservedQuantity: currentOffer.reservedQuantity,
      availableQuantity: currentOffer.availableQuantity,
    },

    earliestCreatedAt:
      rows[rows.length - 1]?.occurredAt.toISOString().slice(0, 10) ?? null,
  };
}
