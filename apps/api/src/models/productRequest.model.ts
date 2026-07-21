import { Schema, model, models } from 'mongoose';

import { PRODUCT_CATEGORIES } from '../types/categories';
import type { ProductRequestEntity } from '../types/product-request';

//===============================================================

const PRODUCT_REQUEST_STATUSES = [
  'draft',
  'new',
  'in_progress',
  'approved',
  'rejected',
] as const;

//===============================================================

const productRequestFileSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    type: {
      type: String,
      default: 'application/octet-stream',
      trim: true,
      maxlength: 120,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
      max: 10 * 1024 * 1024,
    },
    dataUrl: {
      type: String,
      required: false,
      maxlength: 3 * 1024 * 1024,
    },
  },
  { _id: false }
);

const productRequestHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: PRODUCT_REQUEST_STATUSES,
      required: true,
    },
    title: { type: String, trim: true, required: true, maxlength: 180 },
    description: { type: String, trim: true, required: true, maxlength: 1000 },
    createdAt: { type: Date, required: true },
  },
  { _id: true }
);

//===============================================================

const productRequestSchema = new Schema<ProductRequestEntity>(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Product request name is required'],
      trim: true,
      maxlength: [160, 'Product request name must be at most 160 characters'],
    },

    article: {
      type: String,
      required: [true, 'Product request article is required'],
      trim: true,
      uppercase: true,
      maxlength: [40, 'Product request article must be at most 40 characters'],
    },

    category: {
      type: String,
      enum: PRODUCT_CATEGORIES,
      default: 'medicine',
      required: true,
    },

    customCategory: { type: String, trim: true, maxlength: 100 },

    status: {
      type: String,
      enum: PRODUCT_REQUEST_STATUSES,
      default: 'draft',
      required: true,
      index: true,
    },

    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
      index: true,
    },

    productImage: {
      type: productRequestFileSchema,
      required: false,
    },

    manufacturer: { type: String, trim: true, maxlength: 160 },
    countryOfOrigin: { type: String, trim: true, maxlength: 100 },
    dosage: { type: String, trim: true, maxlength: 100 },
    packageSize: { type: String, trim: true, maxlength: 100 },
    form: { type: String, trim: true, maxlength: 100 },
    activeSubstance: { type: String, trim: true, maxlength: 180 },
    prescriptionType: { type: String, trim: true, maxlength: 80 },
    fullDescription: { type: String, trim: true, maxlength: 5000 },
    pharmacyComment: { type: String, trim: true, maxlength: 1500 },

    additionalFiles: {
      type: [productRequestFileSchema],
      default: undefined,
      validate: {
        validator: (files: unknown[]) => files.length <= 5,
        message: 'A product request can contain at most 5 additional files',
      },
    },

    rejectionReason: { type: String, trim: true, maxlength: 1000 },
    history: { type: [productRequestHistorySchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

//===============================================================

productRequestSchema.index({ pharmacyId: 1, createdAt: -1 });
productRequestSchema.index({ pharmacyId: 1, status: 1, createdAt: -1 });
productRequestSchema.index({ pharmacyId: 1, category: 1, createdAt: -1 });
productRequestSchema.index({ pharmacyId: 1, article: 1 });
productRequestSchema.index({ name: 'text', article: 'text' });

//===============================================================

export const ProductRequest =
  models.ProductRequest ||
  model<ProductRequestEntity>('ProductRequest', productRequestSchema);
