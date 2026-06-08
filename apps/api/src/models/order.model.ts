import { Schema, model, models } from 'mongoose';

import { MAX_REVIEW_RATING } from '../constants/validation';

import type { OrderEntity } from '../types/order';

//===============================================================

const orderStoreSnapshotSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
      default: undefined,
    },

    city: {
      type: String,
      trim: true,
      default: undefined,
    },

    phone: {
      type: String,
      trim: true,
      default: undefined,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
    },

    imageUrl: {
      type: String,
      trim: true,
      default: undefined,
    },

    rating: {
      type: Number,
      min: 0,
      max: MAX_REVIEW_RATING,
      default: undefined,
    },

    reviewsCount: {
      type: Number,
      min: 0,
      default: undefined,
    },

    bankDetails: {
      recipientName: { type: String, trim: true, default: undefined },
      taxId: { type: String, trim: true, default: undefined },
      iban: { type: String, trim: true, default: undefined },
      bankName: { type: String, trim: true, default: undefined },
      paymentPurpose: { type: String, trim: true, default: undefined },
    },
  },
  {
    _id: false,
    id: false,
  }
);

//===============================================================

const orderProductSnapshotSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      trim: true,
      default: undefined,
    },

    article: {
      type: String,
      required: true,
      trim: true,
    },

    imageUrl: {
      type: String,
      trim: true,
      default: undefined,
    },

    rating: {
      type: Number,
      min: 0,
      max: MAX_REVIEW_RATING,
      default: undefined,
    },

    reviewsCount: {
      type: Number,
      min: 0,
      default: undefined,
    },
  },
  {
    _id: false,
    id: false,
  }
);

//===============================================================

const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    productSnapshot: {
      type: orderProductSnapshotSchema,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: true,
    id: false,
  }
);

//===============================================================

const orderSchema = new Schema<OrderEntity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },

    storeSnapshot: {
      type: orderStoreSnapshotSchema,
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: 'Order must contain at least one item',
      },
    },

    totalItems: {
      type: Number,
      required: true,
      min: 1,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ['cash', 'bank-transfer'],
      required: true,
    },

    deliveryMethod: {
      type: String,
      enum: ['pickup', 'post'],
      required: true,
    },

    deliveryDetails: {
      recipientName: { type: String, trim: true, default: undefined },
      recipientPhone: { type: String, trim: true, default: undefined },
      address: { type: String, trim: true, default: undefined },
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },

    status: {
      type: String,
      enum: ['accepted', 'processing', 'completed', 'cancelled'],
      default: 'accepted',
      required: true,
      index: true,
    },

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

//===============================================================

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ userId: 1, _id: 1 });

//===============================================================

export const Order = models.Order || model<OrderEntity>('Order', orderSchema);
