import type { ApiPaginationResponse } from '../api';
import type { OrderStatus } from '../orders';

import type {
  CalendarDateString,
  EntityId,
  ISODateTimeString,
} from '../primitives';

//===================================================================

export type StockMovementEventType =
  | 'arrival'
  | 'reserve'
  | 'release'
  | 'write_off'
  | 'adjustment';

//===================================================================

export type StockMovementSource = 'pharmacy_stock' | 'client_order';

//===================================================================

export type ProductStockBalance = {
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
};

export type ProductStockMovement = {
  id: EntityId;
  sequence: number;
  occurredAt: ISODateTimeString;
  eventType: StockMovementEventType;
  source: StockMovementSource;
  quantity: number;
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

//===================================================================

export type ProductStockMovementsResponse =
  ApiPaginationResponse<ProductStockMovement> & {
    stock: ProductStockBalance;
    earliestCreatedAt: CalendarDateString | null;
  };
