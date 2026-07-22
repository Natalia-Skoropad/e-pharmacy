import { Schema, model, models } from 'mongoose';

import { PRODUCT_CATEGORIES } from '../types/categories';

import {
  PRODUCT_REQUEST_ARTICLE_PATTERN,
  PRODUCT_REQUEST_ATTACHMENT_RULES,
  PRODUCT_REQUEST_IMAGE_RULES,
  PRODUCT_REQUEST_LIMITS,
  PRODUCT_REQUEST_LONG_TEXT_PATTERN,
  PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
  PRODUCT_REQUEST_STATUSES,
  PRODUCT_REQUEST_VALIDATION_MESSAGES,
} from '../constants/product-request-validation';

import type { ProductRequestEntity } from '../types/product-request';

//===============================================================

type ProductRequestFileSchemaOptions = Readonly<{
  mimeTypes: readonly string[];
  fileNamePattern: RegExp;
  dataUrlPattern: RegExp;
  maxSizeBytes: number;
  maxDataUrlLength: number;
  invalidFormatMessage: string;
  maxSizeMessage: string;
  maxDataMessage: string;
  requireDataUrl?: boolean;
}>;

type ProductRequestStoredFile = {
  type: string;
  size: number;
  dataUrl?: string;
};

//===============================================================

function getDataUrlByteSize(dataUrl: string): number | null {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex < 0) return null;

  const base64 = dataUrl.slice(commaIndex + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;

  return Math.floor((base64.length * 3) / 4) - padding;
}

//===============================================================

function createProductRequestFileSchema({
  mimeTypes,
  fileNamePattern,
  dataUrlPattern,
  maxSizeBytes,
  maxDataUrlLength,
  invalidFormatMessage,
  maxSizeMessage,
  maxDataMessage,
  requireDataUrl = false,
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
        enum: { values: [...mimeTypes], message: invalidFormatMessage },
      },

      size: {
        type: Number,
        required: true,
        min: [0, 'File size is invalid.'],
        max: [maxSizeBytes, maxSizeMessage],
      },

      dataUrl: {
        type: String,
        required: [
          requireDataUrl,
          PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentDataRequired,
        ],
        maxlength: [maxDataUrlLength, maxDataMessage],
        match: [dataUrlPattern, invalidFormatMessage],
        validate: [
          {
            validator: function (
              this: ProductRequestStoredFile,
              value?: string
            ) {
              if (!value) return !requireDataUrl;
              const dataUrlMimeType = value.match(
                /^data:([^;,]+);base64,/i
              )?.[1];
              return dataUrlMimeType?.toLowerCase() === this.type.toLowerCase();
            },
            message: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.attachmentData,
          },
          {
            validator: function (
              this: ProductRequestStoredFile,
              value?: string
            ) {
              if (!value) return !requireDataUrl;
              return getDataUrlByteSize(value) === this.size;
            },
            message:
              PRODUCT_REQUEST_VALIDATION_MESSAGES.format.fileSizeMismatch,
          },
        ],
      },
    },
    { _id: false }
  );
}

//===============================================================

const productRequestFileSchema = createProductRequestFileSchema({
  mimeTypes: PRODUCT_REQUEST_ATTACHMENT_RULES.mimeTypes,
  fileNamePattern: PRODUCT_REQUEST_ATTACHMENT_RULES.fileNamePattern,
  dataUrlPattern: PRODUCT_REQUEST_ATTACHMENT_RULES.dataUrlPattern,
  maxSizeBytes: PRODUCT_REQUEST_ATTACHMENT_RULES.maxSizeBytes,
  maxDataUrlLength: PRODUCT_REQUEST_ATTACHMENT_RULES.maxDataUrlLength,
  invalidFormatMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.attachment,
  maxSizeMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentSize,
  maxDataMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentData,
  requireDataUrl: true,
});

//===============================================================

const productRequestImageSchema = createProductRequestFileSchema({
  mimeTypes: PRODUCT_REQUEST_IMAGE_RULES.mimeTypes,
  fileNamePattern: PRODUCT_REQUEST_IMAGE_RULES.fileNamePattern,
  dataUrlPattern: PRODUCT_REQUEST_IMAGE_RULES.dataUrlPattern,
  maxSizeBytes: PRODUCT_REQUEST_IMAGE_RULES.maxSizeBytes,
  maxDataUrlLength: PRODUCT_REQUEST_IMAGE_RULES.maxDataUrlLength,
  invalidFormatMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.productImage,
  maxSizeMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.productImageSize,
  maxDataMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.productImageData,
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
      match: [
        PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
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
      match: [
        PRODUCT_REQUEST_ARTICLE_PATTERN,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.article,
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
      match: [
        PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
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
      match: [
        PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
      ],
    },

    countryOfOrigin: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.countryOfOriginMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.countryOfOrigin,
      ],
      match: [
        PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
      ],
    },

    dosage: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.dosageMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.dosage,
      ],
      match: [
        PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
      ],
    },

    packageSize: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.packageSizeMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.packageSize,
      ],
      match: [
        PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
      ],
    },

    form: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.formMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.form,
      ],
      match: [
        PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
      ],
    },

    activeSubstance: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.activeSubstanceMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.activeSubstance,
      ],
      match: [
        PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
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
      match: [
        PRODUCT_REQUEST_LONG_TEXT_PATTERN,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.longText,
      ],
    },

    pharmacyComment: {
      type: String,
      trim: true,
      maxlength: [
        PRODUCT_REQUEST_LIMITS.pharmacyCommentMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.pharmacyComment,
      ],
      match: [
        PRODUCT_REQUEST_LONG_TEXT_PATTERN,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.longText,
      ],
    },

    additionalFiles: {
      type: [productRequestFileSchema],
      default: undefined,
      validate: [
        {
          validator: (files?: Array<{ size: number }>) =>
            !files || files.length <= PRODUCT_REQUEST_ATTACHMENT_RULES.maxFiles,
          message: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentsCount,
        },
        {
          validator: (files?: Array<{ size: number }>) =>
            !files ||
            files.reduce((total, file) => total + file.size, 0) <=
              PRODUCT_REQUEST_ATTACHMENT_RULES.maxTotalSizeBytes,
          message:
            PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentsTotalSize,
        },
      ],
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
