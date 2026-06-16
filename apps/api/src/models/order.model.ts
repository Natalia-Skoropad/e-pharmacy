import { Schema, model, models } from 'mongoose';
import { MAX_REVIEW_RATING } from '../constants/validation';
import type { OrderEntity } from '../types/order';

//===============================================================

const orderPharmacySnapshotSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: undefined },
    city: { type: String, trim: true, default: undefined },
    phone: { type: String, trim: true, default: undefined },
    email: { type: String, trim: true, lowercase: true, default: undefined },
    imageUrl: { type: String, trim: true, default: undefined },

    rating: {
      type: Number,
      min: 0,
      max: MAX_REVIEW_RATING,
      default: undefined,
    },

    reviewsCount: { type: Number, min: 0, default: undefined },

    bankDetails: {
      recipientName: { type: String, trim: true, default: undefined },
      taxId: { type: String, trim: true, default: undefined },
      iban: { type: String, trim: true, default: undefined },
      bankName: { type: String, trim: true, default: undefined },
      paymentPurpose: { type: String, trim: true, default: undefined },
    },
  },
  { _id: false, id: false }
);

//===============================================================

const orderProductSnapshotSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, default: undefined },
    article: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true, default: undefined },
    manufacturer: { type: String, trim: true, default: undefined },
    dosage: { type: String, trim: true, default: undefined },
    packageQuantity: { type: String, trim: true, default: undefined },
  },

  { _id: false, id: false }
);

//===============================================================

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productOfferId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductOffer',
      required: true,
    },

    productSnapshot: { type: orderProductSnapshotSchema, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator(
          this: { quantity: number; unitPrice: number },
          value: number
        ) {
          return value === this.quantity * this.unitPrice;
        },
        message:
          'Order item total price must equal unit price multiplied by quantity.',
      },
    },
  },

  { _id: true, id: false }
);

//===============================================================

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ['new', 'in_progress', 'successful', 'rejected'],
      required: true,
    },

    changedAt: { type: Date, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, trim: true, maxlength: 500, default: undefined },
  },

  { _id: false, id: false }
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

    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
      index: true,
    },

    pharmacySnapshot: { type: orderPharmacySnapshotSchema, required: true },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: 'Order must contain at least one item',
      },
    },

    totalItems: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['UAH'], default: 'UAH', required: true },

    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer'],
      required: true,
    },

    delivery: {
      method: {
        type: String,
        enum: ['pickup', 'postal_delivery'],
        required: true,
      },

      details: {
        recipientName: { type: String, trim: true, default: undefined },
        recipientPhone: { type: String, trim: true, default: undefined },
        address: { type: String, trim: true, default: undefined },
      },
    },

    comment: { type: String, trim: true, maxlength: 500, default: undefined },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'successful', 'rejected'],
      default: 'new',
      required: true,
      index: true,
    },

    statusHistory: { type: [statusHistorySchema], default: [] },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },

    rejectedAt: { type: Date, default: undefined },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },

    orderNumber: { type: String, required: true, unique: true, index: true },
  },

  { timestamps: true, versionKey: false }
);

//===============================================================

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ pharmacyId: 1, createdAt: -1 });

//===============================================================

export const Order = models.Order || model<OrderEntity>('Order', orderSchema);
