import { Schema, model, models } from 'mongoose';

import { MAX_REVIEW_RATING } from '../constants/validation';
import { PHARMACY_STATUSES } from '../constants/auth';
import type { PharmacyEntity } from '../types/pharmacy';

//===============================================================

const pharmacySchema = new Schema<PharmacyEntity>(
  {
    name: {
      type: String,
      required: false,
      trim: true,
      default: '',
      maxlength: [100, 'Pharmacy name must be at most 100 characters'],
    },

    address: {
      type: String,
      required: false,
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
      maxlength: [160, 'Working hours must be at most 160 characters'],
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
        match: [
          /^UA[A-Z0-9]{27}$/,
          'IBAN must start with UA and contain 29 characters',
        ],
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
        maxlength: [500, 'Payment purpose must be at most 500 characters'],
      },

      receiptEmail: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        maxlength: [64, 'Receipt email must be at most 64 characters'],
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
      maxlength: [5000, 'Description must be at most 5000 characters'],
      default: undefined,
    },

    statusReason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Status reason must be at most 1000 characters'],
      default: undefined,
    },

    pendingModeration: {
      type: Schema.Types.Mixed,
      default: undefined,
    },

    reviewsCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    managerUserIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },

    documents: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          size: { type: Number, required: true, min: 0 },
          type: { type: String, trim: true, default: '' },
        },
      ],
      default: [],
    },

    license: {
      type: String,
      trim: true,
      maxlength: [160, 'License must be at most 160 characters'],
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

    activatedAt: {
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
pharmacySchema.index({ ownerId: 1, status: 1 });
pharmacySchema.index({ status: 1 });
pharmacySchema.index({ status: 1, rating: -1 });

//===============================================================

export const Pharmacy =
  models.Pharmacy || model<PharmacyEntity>('Pharmacy', pharmacySchema);
