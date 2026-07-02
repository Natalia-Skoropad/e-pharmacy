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

    status: {
      type: String,
      enum: PRODUCT_REQUEST_STATUSES,
      default: 'draft',
      required: true,
      index: true,
    },
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
