import { Schema, model, models } from 'mongoose';

import type { CartEntity } from '../types/cart';

//===============================================================

const cartItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
    },

    quantity: {
      type: Number,
      min: 1,
      required: true,
    },

    price: {
      type: Number,
      min: 0,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    _id: true,
    id: false,
    timestamps: true,
  }
);

//===============================================================

const cartSchema = new Schema<CartEntity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

//===============================================================

cartSchema.index({ 'items.expiresAt': 1 });
cartSchema.index({ 'items.productId': 1, 'items.pharmacyId': 1 });

//===============================================================

export const Cart = models.Cart || model<CartEntity>('Cart', cartSchema);
