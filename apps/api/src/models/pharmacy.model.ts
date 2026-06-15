import { Schema, model, models } from 'mongoose';

import {
  MAX_REVIEW_RATING,
  MIN_REVIEW_RATING,
  USER_REVIEW_COMMENT_MAX_LENGTH,
  USER_REVIEW_COMMENT_MIN_LENGTH,
  VALIDATION_MESSAGES,
} from '../constants/validation';

import { PHARMACY_STATUSES } from '../constants/auth';
import type { PharmacyEntity } from '../types/pharmacy';

//===============================================================


const pharmacyReviewSchema = new Schema(
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


    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'reported', 'hidden'],
      default: 'pending',
      required: true,
      index: true,
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
    },

    isModerated: {
      type: Boolean,
      default: false,
      required: true,
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

pharmacyReviewSchema.index({ status: 1, createdAt: -1 });

const pharmacySchema = new Schema<PharmacyEntity>(
  {
    name: {
      type: String,
      required: [true, 'Pharmacy name is required'],
      trim: true,
      maxlength: [100, 'Pharmacy name must be at most 100 characters'],
    },

    address: {
      type: String,
      required: [true, 'Pharmacy address is required'],
      trim: true,
      maxlength: [200, 'Pharmacy address must be at most 200 characters'],
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


    bankDetails: {
      recipientName: {
        type: String,
        required: false,
        trim: true,
        maxlength: [160, 'Bank recipient name must be at most 160 characters'],
      },

      taxId: {
        type: String,
        required: false,
        trim: true,
        match: [/^\d{8}(?:\d{2})?$/, 'Bank tax ID must contain 8 or 10 digits'],
      },

      iban: {
        type: String,
        required: false,
        trim: true,
        uppercase: true,
        match: [/^UA[A-Z0-9]{27}$/, 'IBAN must start with UA and contain 29 characters'],
      },

      bankName: {
        type: String,
        required: false,
        trim: true,
        maxlength: [120, 'Bank name must be at most 120 characters'],
      },

      paymentPurpose: {
        type: String,
        required: false,
        trim: true,
        maxlength: [220, 'Payment purpose must be at most 220 characters'],
      },
    },

    status: {
      type: String,
      enum: Object.values(PHARMACY_STATUSES),
      default: PHARMACY_STATUSES.NEW,
      required: true,
    },

    rating: {
      type: Number,
      min: 0,
      max: MAX_REVIEW_RATING,
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
      type: [pharmacyReviewSchema],
      default: [],
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
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

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },

    approvedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

//===============================================================

pharmacySchema.index({ name: 'text', address: 'text', city: 'text' });
pharmacySchema.index({ city: 1 });
pharmacySchema.index({ isActive: 1 });
pharmacySchema.index({ ownerId: 1, isActive: 1 });
pharmacySchema.index({ ownerId: 1, status: 1 });
pharmacySchema.index({ status: 1, isActive: 1 });

//===============================================================

export const Pharmacy = models.Pharmacy || model<PharmacyEntity>('Pharmacy', pharmacySchema);
