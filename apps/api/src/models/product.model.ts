import { Schema, model, models } from 'mongoose';

import type { ProductEntity } from '../types/product';

//===============================================================

const productReviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },

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
      minlength: [10, 'Review comment must be at least 10 characters'],
      maxlength: [200, 'Review comment must be at most 200 characters'],
    },

    isModerated: {
      type: Boolean,
      default: false,
      required: true,
    },

    moderatedAt: {
      type: Date,
      default: undefined,
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

const productOfferSchema = new Schema(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },

    storeName: {
      type: String,
      required: true,
      trim: true,
    },

    storeCity: {
      type: String,
      trim: true,
      default: undefined,
    },

    storeAddress: {
      type: String,
      trim: true,
      default: undefined,
    },

    storePhone: {
      type: String,
      trim: true,
      default: undefined,
    },

    storeRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    storeReviewsCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, 'Offer price is required'],
      min: 0,
    },

    totalQuantity: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
    },

    activeQuantity: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
    },

    reservedQuantity: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
    },

    inStock: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    _id: false,
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

    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      default: undefined,
    },

    storeName: {
      type: String,
      trim: true,
      default: undefined,
    },

    offers: {
      type: [productOfferSchema],
      default: [],
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
  article: 'text',
});
productSchema.index({ article: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ storeId: 1 });
productSchema.index({ 'offers.storeId': 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ inStock: 1 });

//===============================================================

export const Product =
  models.Product || model<ProductEntity>('Product', productSchema);
