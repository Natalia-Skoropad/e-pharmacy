import { Schema, model, models } from 'mongoose';

import { PRODUCT_CATEGORIES } from '../types/categories';

import {
  PRODUCT_REQUEST_ADDITIONAL_FILE_MIME_TYPES,
  PRODUCT_REQUEST_ADDITIONAL_FILE_NAME_PATTERN,
  PRODUCT_REQUEST_IMAGE_DATA_URL_PATTERN,
  PRODUCT_REQUEST_IMAGE_FILE_NAME_PATTERN,
  PRODUCT_REQUEST_IMAGE_MIME_TYPES,
  PRODUCT_REQUEST_LIMITS,
  PRODUCT_REQUEST_STATUSES,
  PRODUCT_REQUEST_VALIDATION_MESSAGES,
} from '../constants/product-request-validation';

import type { ProductRequestEntity } from '../types/product-request';

//===============================================================

type ProductRequestFileSchemaOptions = Readonly<{
  mimeTypes: readonly string[];
  fileNamePattern: RegExp;
  maxSizeBytes: number;
  invalidFormatMessage: string;
  maxSizeMessage: string;
  dataUrlPattern?: RegExp;
}>;

//===============================================================

function createProductRequestFileSchema({
  mimeTypes,
  fileNamePattern,
  maxSizeBytes,
  invalidFormatMessage,
  maxSizeMessage,
  dataUrlPattern,
}: ProductRequestFileSchemaOptions) {
  return new Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [
          PRODUCT_REQUEST_LIMITS.fileNameMax,
          PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fileName,
        ],
        match: [fileNamePattern, invalidFormatMessage],
      },
      type: {
        type: String,
        required: true,
        trim: true,
        maxlength: [
          PRODUCT_REQUEST_LIMITS.fileTypeMax,
          PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fileType,
        ],
        enum: {
          values: [...mimeTypes],
          message: invalidFormatMessage,
        },
      },
      size: {
        type: Number,
        required: true,
        min: [0, 'File size is invalid.'],
        max: [maxSizeBytes, maxSizeMessage],
      },
      dataUrl: {
        type: String,
        required: false,
        maxlength: PRODUCT_REQUEST_LIMITS.dataUrlMaxLength,
        ...(dataUrlPattern
          ? { match: [dataUrlPattern, invalidFormatMessage] }
          : {}),
      },
    },
    { _id: false }
  );
}

//===============================================================

const productRequestFileSchema = createProductRequestFileSchema({
  mimeTypes: PRODUCT_REQUEST_ADDITIONAL_FILE_MIME_TYPES,
  fileNamePattern: PRODUCT_REQUEST_ADDITIONAL_FILE_NAME_PATTERN,
  maxSizeBytes: PRODUCT_REQUEST_LIMITS.additionalFileMaxSizeBytes,

  invalidFormatMessage:
    PRODUCT_REQUEST_VALIDATION_MESSAGES.format.additionalFile,

  maxSizeMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.additionalFileSize,
});

//===============================================================

const productRequestImageSchema = createProductRequestFileSchema({
  mimeTypes: PRODUCT_REQUEST_IMAGE_MIME_TYPES,
  fileNamePattern: PRODUCT_REQUEST_IMAGE_FILE_NAME_PATTERN,
  maxSizeBytes: PRODUCT_REQUEST_LIMITS.productImageMaxSizeBytes,
  invalidFormatMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.productImage,
  maxSizeMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.productImageSize,
  dataUrlPattern: PRODUCT_REQUEST_IMAGE_DATA_URL_PATTERN,
});

//===============================================================

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
      required: [true, PRODUCT_REQUEST_VALIDATION_MESSAGES.required.name],
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.nameMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.name,
      ],
    },

    article: {
      type: String,
      required: [true, PRODUCT_REQUEST_VALIDATION_MESSAGES.required.article],
      trim: true,
      uppercase: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.articleMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.article,
      ],
    },

    category: {
      type: String,
      enum: PRODUCT_CATEGORIES,
      default: 'medicine',
      required: true,
    },

    customCategory: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.customCategoryMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.customCategory,
      ],
    },

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
      type: productRequestImageSchema,
      required: false,
    },

    manufacturer: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.manufacturerMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.manufacturer,
      ],
    },

    countryOfOrigin: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.countryOfOriginMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.countryOfOrigin,
      ],
    },

    dosage: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.dosageMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.dosage,
      ],
    },

    packageSize: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.packageSizeMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.packageSize,
      ],
    },

    form: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.formMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.form,
      ],
    },

    activeSubstance: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.activeSubstanceMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.activeSubstance,
      ],
    },

    prescriptionType: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.prescriptionTypeMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.prescriptionType,
      ],
    },

    fullDescription: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.fullDescriptionMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fullDescription,
      ],
    },

    pharmacyComment: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.pharmacyCommentMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.pharmacyComment,
      ],
    },

    additionalFiles: {
      type: [productRequestFileSchema],
      default: undefined,
      validate: {
        validator: (files?: unknown[]) =>
          !files || files.length <= PRODUCT_REQUEST_LIMITS.additionalFilesMax,
        message:
          PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.additionalFilesCount,
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
