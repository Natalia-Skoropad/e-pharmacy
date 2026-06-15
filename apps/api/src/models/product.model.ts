import { Schema, model, models } from 'mongoose';

import { MAX_REVIEW_RATING } from '../constants/validation';

import type { ProductEntity } from '../types/product';

const PRODUCT_STATUSES = ['new', 'active', 'blocked'] as const;

//===============================================================



const productSchema = new Schema<ProductEntity>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [160, 'Product name must be at most 160 characters'],
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
    },

    article: {
      type: String,
      required: [true, 'Product article is required'],
      trim: true,
      uppercase: true,
      maxlength: [40, 'Product article must be at most 40 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [3000, 'Description must be at most 3000 characters'],
      default: undefined,
    },

    status: {
      type: String,
      enum: PRODUCT_STATUSES,
      default: 'new',
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: [
        'medicine',
        'vitamins',
        'beauty',
        'hygiene',
        'medical-devices',
        'other',
      ],
      default: 'medicine',
      required: true,
    },

    price: {
      type: Number,
      min: 0,
      default: undefined,
    },

    imageUrl: {
      type: String,
      trim: true,
      default: undefined,
    },

    manufacturer: {
      type: String,
      trim: true,
      maxlength: [160, 'Manufacturer must be at most 160 characters'],
      default: undefined,
    },

    dosage: {
      type: String,
      trim: true,
      maxlength: [80, 'Dosage must be at most 80 characters'],
      default: undefined,
    },

    packageQuantity: {
      type: String,
      trim: true,
      maxlength: [80, 'Package quantity must be at most 80 characters'],
      default: undefined,
    },

    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
      default: undefined,
    },

    pharmacyName: {
      type: String,
      trim: true,
      default: undefined,
    },


    inStock: {
      type: Boolean,
      default: true,
      required: true,
    },

    rating: {
      type: Number,
      min: 0,
      max: MAX_REVIEW_RATING,
      default: 0,
    },

    reviewsCount: {
      type: Number,
      min: 0,
      default: 0,
    },


    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

//===============================================================

productSchema.index({
  name: 'text',
  description: 'text',
  manufacturer: 'text',
  article: 'text',
});
productSchema.index({ article: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ pharmacyId: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ inStock: 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ updatedBy: 1 });

//===============================================================

export const Product =
  models.Product || model<ProductEntity>('Product', productSchema);
