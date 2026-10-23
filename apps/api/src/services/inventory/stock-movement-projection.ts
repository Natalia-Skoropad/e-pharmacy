import type { Types } from 'mongoose';

import type { StockMovementEventType } from '../../models/inventory/stockMovement.model';
import type { OrderStatus } from '../../types/order';

import { getMovementValueQuantity } from './stock-movement-balance';

import type {
  CurrentOrderSnapshot,
  StockMovementDocument,
} from './stock-movement-types';

//===============================================================

function getLatestOrderStockChangeDate(order: CurrentOrderSnapshot): Date {
  const latestStatusDate = (order.statusHistory ?? []).reduce<Date | null>(
    (latest, entry) =>
      !latest || entry.changedAt.getTime() > latest.getTime()
        ? entry.changedAt
        : latest,
    null
  );

  return latestStatusDate ?? order.updatedAt ?? order.createdAt;
}

//===============================================================

function getAggregatedOrderComment(
  status: OrderStatus,
  orderNumber: string,
  quantity: number
): string {
  const unitLabel = quantity === 1 ? 'unit' : 'units';

  if (status === 'successful') {
    return `Successful order ${orderNumber} wrote off ${quantity} reserved ${unitLabel} from the warehouse.`;
  }

  if (status === 'rejected') {
    return `Rejected order ${orderNumber} released ${quantity} reserved ${unitLabel} back to available stock.`;
  }

  if (status === 'in_progress') {
    return `In progress order ${orderNumber} currently reserves ${quantity} ${unitLabel} from available stock.`;
  }

  return `New order ${orderNumber} reserves ${quantity} ${unitLabel} from available stock.`;
}

//===============================================================

function getLastMovement(
  movements: StockMovementDocument[],
  predicate?: (movement: StockMovementDocument) => boolean
): StockMovementDocument | undefined {
  for (let index = movements.length - 1; index >= 0; index -= 1) {
    const movement = movements[index];

    if (!predicate || predicate(movement)) return movement;
  }

  return undefined;
}

//===============================================================

export function aggregateOrderMovements(
  movements: StockMovementDocument[],
  order: CurrentOrderSnapshot | undefined,
  productOfferId: Types.ObjectId
) {
  const latestMovement = getLastMovement(movements);

  if (!latestMovement) return null;

  const orderId = String(latestMovement.orderId);
  const orderStatus = order?.status ?? latestMovement.orderStatus;
  const orderNumber = order?.orderNumber ?? latestMovement.orderNumber;

  if (!orderStatus || !orderNumber) return null;

  const currentItem = order?.items.find(
    (item) => String(item.productOfferId) === String(productOfferId)
  );

  let eventMovement = latestMovement;
  let eventType: StockMovementEventType = latestMovement.eventType;

  let quantity =
    latestMovement.quantity ?? getMovementValueQuantity(latestMovement);

  let unitPrice = latestMovement.unitPrice;

  if (orderStatus === 'successful') {
    eventMovement =
      getLastMovement(
        movements,
        (movement) => movement.eventType === 'write_off'
      ) ?? latestMovement;

    eventType = 'write_off';

    quantity =
      eventMovement.quantity ?? getMovementValueQuantity(eventMovement);

    unitPrice = eventMovement.unitPrice;
  } else if (orderStatus === 'rejected') {
    eventMovement =
      getLastMovement(
        movements,
        (movement) =>
          movement.eventType === 'release' &&
          movement.orderStatus === 'rejected'
      ) ??
      getLastMovement(
        movements,
        (movement) => movement.eventType === 'release'
      ) ??
      latestMovement;

    eventType = 'release';

    quantity =
      eventMovement.quantity ?? getMovementValueQuantity(eventMovement);

    unitPrice = eventMovement.unitPrice;
  } else {
    if (!currentItem || currentItem.quantity < 1) return null;

    eventType = 'reserve';
    quantity = currentItem.quantity;
    unitPrice = currentItem.unitPrice;
  }

  const orderChangedAt = order ? getLatestOrderStockChangeDate(order) : null;

  const occurredAt =
    orderChangedAt &&
    orderChangedAt.getTime() > latestMovement.occurredAt.getTime()
      ? orderChangedAt
      : latestMovement.occurredAt;

  const stockDelta =
    eventType === 'write_off' ? -quantity : eventMovement.stockDelta;

  const reservedDelta =
    eventType === 'reserve'
      ? quantity
      : eventType === 'release' || eventType === 'write_off'
        ? -quantity
        : eventMovement.reservedDelta;

  const availableDelta =
    eventType === 'reserve'
      ? -quantity
      : eventType === 'release'
        ? quantity
        : eventType === 'write_off'
          ? 0
          : eventMovement.availableDelta;

  return {
    id: `order-${orderId}-${String(productOfferId)}`,
    occurredAt,
    eventType,
    source: 'client_order' as const,
    quantity,
    stockDelta,
    reservedDelta,
    availableDelta,

    balanceAfter: {
      stockQuantity: latestMovement.stockAfter,
      reservedQuantity: latestMovement.reservedAfter,
      availableQuantity: latestMovement.availableAfter,
    },

    unitPrice,
    movementValue: quantity * unitPrice,
    orderId,
    orderNumber,
    orderStatus,

    ...(eventMovement.orderStatus
      ? { orderStatusAtEvent: eventMovement.orderStatus }
      : {}),

    comment: getAggregatedOrderComment(orderStatus, orderNumber, quantity),
  };
}
