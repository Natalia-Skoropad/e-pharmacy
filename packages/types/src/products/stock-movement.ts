import type { OrderStatus } from '../orders';
import type { EntityId, ISODateString } from '../shared';

//=============================================================================

export type StockMovementEventType =
  | 'arrival'
  | 'reserve'
  | 'release'
  | 'write_off'
  | 'adjustment';

export type StockMovementSource = 'pharmacy_stock' | 'client_order';

//=============================================================================

export type ProductStockBalance = {
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
};

export type ProductStockMovement = {
  id: EntityId;
  sequence: number;
  occurredAt: ISODateString;
  eventType: StockMovementEventType;
  source: StockMovementSource;
  stockDelta: number;
  reservedDelta: number;
  availableDelta: number;
  balanceAfter: ProductStockBalance;
  unitPrice: number;
  movementValue: number;
  orderId?: EntityId;
  orderNumber?: string;
  orderStatus?: OrderStatus;
  orderStatusAtEvent?: OrderStatus;
  comment: string;
};

export type ProductStockMovementsResponse = {
  items: ProductStockMovement[];
  total: number;
  stock: ProductStockBalance;
};
