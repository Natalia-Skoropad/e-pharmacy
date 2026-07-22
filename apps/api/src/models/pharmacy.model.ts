import { Schema, model, models } from 'mongoose';

import {
  BANK_NAME_MAX_LENGTH,
  BANK_NAME_MIN_LENGTH,
  BANK_NAME_PATTERN,
  BANK_RECIPIENT_NAME_MAX_LENGTH,
  BANK_RECIPIENT_NAME_MIN_LENGTH,
  BANK_RECIPIENT_NAME_PATTERN,
  MAX_REVIEW_RATING,
  PHARMACY_NAME_MAX_LENGTH,
  PHARMACY_NAME_MIN_LENGTH,
  PHARMACY_NAME_PATTERN,
  PAYMENT_PURPOSE_MAX_LENGTH,
  PAYMENT_PURPOSE_PATTERN,
  PICTURE_DATA_URL_MAX_LENGTH,
  PICTURE_HTTP_URL_MAX_LENGTH,
  VALIDATION_MESSAGES,
  WORKING_HOURS_MAX_LENGTH,
  WORKING_HOURS_PATTERN,
  isHttpUrl,
  isPictureDataUrl,
} from '../constants/validation';

import { PHARMACY_STATUSES } from '../constants/auth';

import {
  PHARMACY_DOCUMENT_RULES,
  PHARMACY_DOCUMENT_VALIDATION_MESSAGES,
} from '../constants/pharmacy-document-validation';

import { getWorkingHoursValidationIssue } from '../utils/validation/working-hours';
import type { PharmacyEntity } from '../types/pharmacy';

//===============================================================

const pharmacySchema = new Schema<PharmacyEntity>(
  {
    name: {
      type: String,
      required: false,
      trim: true,
      default: '',
      maxlength: [
        PHARMACY_NAME_MAX_LENGTH,
        VALIDATION_MESSAGES.limits.pharmacyNameMax,
      ],

      validate: [
        {
          validator: (value: string) =>
            !value || value.length >= PHARMACY_NAME_MIN_LENGTH,
          message: VALIDATION_MESSAGES.limits.pharmacyNameMin,
        },
        {
          validator: (value: string) =>
            !value || PHARMACY_NAME_PATTERN.test(value),
          message: VALIDATION_MESSAGES.format.pharmacyName,
        },
      ],
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
      maxlength: [
        WORKING_HOURS_MAX_LENGTH,
        VALIDATION_MESSAGES.limits.workingHoursMax,
      ],
      match: [WORKING_HOURS_PATTERN, VALIDATION_MESSAGES.format.workingHours],
      validate: {
        validator: (value?: string) =>
          !value || getWorkingHoursValidationIssue(value) === null,
        message: VALIDATION_MESSAGES.format.workingHours,
      },
      default: undefined,
    },

    bankDetails: {
      recipientName: {
        type: String,
        required: false,
        trim: true,
        maxlength: [
          BANK_RECIPIENT_NAME_MAX_LENGTH,
          VALIDATION_MESSAGES.limits.bankRecipientNameMax,
        ],
        validate: [
          {
            validator: (value?: string) =>
              !value || value.length >= BANK_RECIPIENT_NAME_MIN_LENGTH,
            message: VALIDATION_MESSAGES.limits.bankRecipientNameMin,
          },
          {
            validator: (value?: string) =>
              !value || BANK_RECIPIENT_NAME_PATTERN.test(value),
            message: VALIDATION_MESSAGES.format.bankRecipientName,
          },
        ],
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
        maxlength: [
          BANK_NAME_MAX_LENGTH,
          VALIDATION_MESSAGES.limits.bankNameMax,
        ],
        validate: [
          {
            validator: (value?: string) =>
              !value || value.length >= BANK_NAME_MIN_LENGTH,
            message: VALIDATION_MESSAGES.limits.bankNameMin,
          },
          {
            validator: (value?: string) =>
              !value || BANK_NAME_PATTERN.test(value),
            message: VALIDATION_MESSAGES.format.bankName,
          },
        ],
      },

      paymentPurpose: {
        type: String,
        required: false,
        trim: true,
        maxlength: [
          PAYMENT_PURPOSE_MAX_LENGTH,
          VALIDATION_MESSAGES.limits.paymentPurposeMax,
        ],
        match: [
          PAYMENT_PURPOSE_PATTERN,
          VALIDATION_MESSAGES.format.paymentPurpose,
        ],
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
      validate: {
        validator: (value?: string) => {
          if (!value) return true;
          if (isPictureDataUrl(value)) {
            return value.length <= PICTURE_DATA_URL_MAX_LENGTH;
          }
          if (isHttpUrl(value))
            return value.length <= PICTURE_HTTP_URL_MAX_LENGTH;
          return false;
        },
        message: VALIDATION_MESSAGES.format.picture,
      },
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
          name: {
            type: String,
            required: true,
            trim: true,
            maxlength: [
              PHARMACY_DOCUMENT_RULES.fileNameMaxLength,
              PHARMACY_DOCUMENT_VALIDATION_MESSAGES.nameLength,
            ],
            match: [
              PHARMACY_DOCUMENT_RULES.fileNamePattern,
              PHARMACY_DOCUMENT_VALIDATION_MESSAGES.format,
            ],
          },
          size: {
            type: Number,
            required: true,
            min: 0,
            max: [
              PHARMACY_DOCUMENT_RULES.maxSizeBytes,
              PHARMACY_DOCUMENT_VALIDATION_MESSAGES.size,
            ],
          },
          type: {
            type: String,
            required: true,
            trim: true,
            enum: {
              values: [...PHARMACY_DOCUMENT_RULES.mimeTypes],
              message: PHARMACY_DOCUMENT_VALIDATION_MESSAGES.format,
            },
          },
        },
      ],
      validate: {
        validator: (documents: unknown[]) =>
          documents.length <= PHARMACY_DOCUMENT_RULES.maxFiles,
        message: PHARMACY_DOCUMENT_VALIDATION_MESSAGES.count,
      },
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
