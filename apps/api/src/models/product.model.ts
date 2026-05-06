import { Schema, model, models } from 'mongoose';

import type { ProductEntity } from '../types/product';

//===============================================================

const productReviewSchema = new Schema(
  {
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: [80, 'User name must be at most 80 characters'],
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [1000, 'Review comment must be at most 1000 characters'],
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
    id: false,
  }
);

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

    description: {
      type: String,
      trim: true,
      maxlength: [3000, 'Description must be at most 3000 characters'],
      default: undefined,
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
      required: [true, 'Price is required'],
      min: 0,
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

    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },

    storeName: {
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
      max: 5,
      default: 0,
    },

    reviewsCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    reviews: {
      type: [productReviewSchema],
      default: [],
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
});
productSchema.index({ category: 1 });
productSchema.index({ storeId: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ inStock: 1 });

//===============================================================

export const Product =
  models.Product || model<ProductEntity>('Product', productSchema);
