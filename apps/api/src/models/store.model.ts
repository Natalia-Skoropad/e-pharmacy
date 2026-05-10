import { Schema, model, models } from 'mongoose';

import type { StoreEntity } from '../types/store';

//===============================================================


const storeReviewSchema = new Schema(
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
      maxlength: [500, 'Review comment must be at most 500 characters'],
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

const storeSchema = new Schema<StoreEntity>(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      maxlength: [100, 'Store name must be at most 100 characters'],
    },

    address: {
      type: String,
      required: [true, 'Store address is required'],
      trim: true,
      maxlength: [200, 'Store address must be at most 200 characters'],
    },

    city: {
      type: String,
      trim: true,
      maxlength: [80, 'City must be at most 80 characters'],
      default: undefined,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [30, 'Phone must be at most 30 characters'],
      default: undefined,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
    },

    workingHours: {
      type: String,
      trim: true,
      maxlength: [120, 'Working hours must be at most 120 characters'],
      default: undefined,
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    imageUrl: {
      type: String,
      trim: true,
      default: undefined,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description must be at most 1000 characters'],
      default: undefined,
    },

    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },

    reviewsCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    reviews: {
      type: [storeReviewSchema],
      default: [],
    },

    ownerId: {
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

storeSchema.index({ name: 'text', address: 'text', city: 'text' });
storeSchema.index({ city: 1 });
storeSchema.index({ isActive: 1 });

//===============================================================

export const Store = models.Store || model<StoreEntity>('Store', storeSchema);
