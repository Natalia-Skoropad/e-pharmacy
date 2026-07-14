import { Schema, model, models } from 'mongoose';

import type { OrderStatus } from '../types/order';

//===============================================================

export const STOCK_MOVEMENT_EVENT_TYPES = [
  'arrival',
  'reserve',
  'release',
  'write_off',
  'adjustment',
] as const;

export const STOCK_MOVEMENT_SOURCES = [
  'pharmacy_stock',
  'client_order',
] as const;

//===============================================================

export type StockMovementEventType =
  (typeof STOCK_MOVEMENT_EVENT_TYPES)[number];

export type StockMovementSource = (typeof STOCK_MOVEMENT_SOURCES)[number];

//===============================================================

export type StockMovementEntity = {
  productOfferId: Schema.Types.ObjectId;
  productId: Schema.Types.ObjectId;
  pharmacyId: Schema.Types.ObjectId;
  eventType: StockMovementEventType;
  source: StockMovementSource;
  quantity?: number;
  stockDelta: number;
  reservedDelta: number;
  availableDelta: number;
  stockAfter: number;
  reservedAfter: number;
  availableAfter: number;
  unitPrice: number;
  orderId?: Schema.Types.ObjectId;
  orderNumber?: string;
  orderStatus?: OrderStatus;
  comment: string;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

const stockMovementSchema = new Schema<StockMovementEntity>(
  {
    productOfferId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductOffer',
      required: true,
      index: true,
    },

    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },

    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
      index: true,
    },

    eventType: {
      type: String,
      enum: STOCK_MOVEMENT_EVENT_TYPES,
      required: true,
      index: true,
    },

    source: {
      type: String,
      enum: STOCK_MOVEMENT_SOURCES,
      required: true,
      index: true,
    },

    quantity: { type: Number, min: 0, default: undefined },
    stockDelta: { type: Number, required: true },
    reservedDelta: { type: Number, required: true },
    availableDelta: { type: Number, required: true },
    stockAfter: { type: Number, min: 0, required: true },
    reservedAfter: { type: Number, min: 0, required: true },
    availableAfter: { type: Number, min: 0, required: true },
    unitPrice: { type: Number, min: 0, required: true },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: undefined,
      index: true,
    },

    orderNumber: { type: String, trim: true, default: undefined },

    orderStatus: {
      type: String,
      enum: ['new', 'in_progress', 'successful', 'rejected'],
      default: undefined,
    },

    comment: { type: String, trim: true, maxlength: 1000, required: true },
    occurredAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

//===============================================================

stockMovementSchema.index({ productOfferId: 1, occurredAt: 1, _id: 1 });
stockMovementSchema.index({ pharmacyId: 1, productId: 1, occurredAt: -1 });
stockMovementSchema.index({ orderId: 1, productOfferId: 1, eventType: 1 });

//===============================================================

export const StockMovement =
  models.StockMovement ||
  model<StockMovementEntity>('StockMovement', stockMovementSchema);
