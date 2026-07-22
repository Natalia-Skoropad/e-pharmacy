import { Schema, model, models } from 'mongoose';

import {
  MAX_REVIEW_RATING,
  MIN_REVIEW_RATING,
  REVIEW_COMMENT_PATTERN,
  USER_REVIEW_COMMENT_MAX_LENGTH,
  USER_REVIEW_COMMENT_MIN_LENGTH,
  VALIDATION_MESSAGES,
} from '../constants/validation';

//===============================================================

export type ProductReviewEntity = {
  productId: Schema.Types.ObjectId;
  userId?: Schema.Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  status: 'on_moderation' | 'approved' | 'rejected';
  moderationReason?: string;
  moderatedBy?: Schema.Types.ObjectId;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

const productReviewSchema = new Schema<ProductReviewEntity>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
      index: true,
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
      min: MIN_REVIEW_RATING,
      max: MAX_REVIEW_RATING,
    },

    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [
        USER_REVIEW_COMMENT_MIN_LENGTH,
        VALIDATION_MESSAGES.limits.reviewCommentMin,
      ],
      maxlength: [
        USER_REVIEW_COMMENT_MAX_LENGTH,
        VALIDATION_MESSAGES.limits.reviewCommentMax,
      ],
      match: [
        REVIEW_COMMENT_PATTERN,
        VALIDATION_MESSAGES.format.reviewComment,
      ],
    },

    status: {
      type: String,
      enum: ['on_moderation', 'approved', 'rejected'],
      default: 'on_moderation',
      required: true,
      index: true,
    },

    moderationReason: {
      type: String,
      trim: true,
      maxlength: [300, 'Moderation reason must be at most 300 characters'],
      default: undefined,
    },

    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },

    moderatedAt: {
      type: Date,
      default: undefined,
    },
  },

  { timestamps: true, versionKey: false }
);

//===============================================================

productReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
productReviewSchema.index({ status: 1, createdAt: -1 });

//===============================================================

export const ProductReview =
  models.ProductReview ||
  model<ProductReviewEntity>('ProductReview', productReviewSchema);
