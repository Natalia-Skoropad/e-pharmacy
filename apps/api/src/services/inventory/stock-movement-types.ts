import type mongoose from 'mongoose';
import type { Types } from 'mongoose';

import type {
  StockMovementEntity,
  StockMovementEventType,
  StockMovementSource,
} from '../../models/inventory/stockMovement.model';

import type { OrderStatus } from '../../types/order';

//===============================================================

export type StockOfferSnapshot = {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  pharmacyId: Types.ObjectId;
  price: number;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
};

//===============================================================

export type StockMovementContext = {
  source: StockMovementSource;
  orderId?: string | Types.ObjectId;
  orderNumber?: string;
  orderStatus?: OrderStatus;
  occurredAt?: Date;
  comment: string;
};

//===============================================================

export type RecordStockMovementInput = {
  offer: StockOfferSnapshot;
  eventType: StockMovementEventType;
  stockDelta: number;
  reservedDelta: number;
  availableDelta: number;
  context: StockMovementContext;
  session?: mongoose.ClientSession;
};

//===============================================================

export type CurrentOrderSnapshot = {
  _id: Types.ObjectId;
  status: OrderStatus;
  orderNumber: string;

  items: Array<{
    productOfferId: Types.ObjectId;
    quantity: number;
    unitPrice: number;
  }>;

  statusHistory?: Array<{
    status: OrderStatus;
    changedAt: Date;
  }>;

  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

export type StockMovementDocument = StockMovementEntity & {
  _id: Types.ObjectId;
};
