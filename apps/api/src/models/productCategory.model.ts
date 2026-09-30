import { Schema, model, models } from 'mongoose';

import {
  PRODUCT_CATEGORY_KINDS,
  PRODUCT_CATEGORY_NAME_MAX_LENGTH,
  PRODUCT_CATEGORY_NAME_PATTERN,
  PRODUCT_CATEGORY_SLUG_PATTERN,
  PRODUCT_CATEGORY_STATUSES,
  normalizeProductCategoryName,
  normalizeProductCategoryNameKey,
} from '../constants/product-category';

import type { ProductCategoryPersistenceEntity } from '../types/product-category';

//===============================================================

const productCategorySchema = new Schema<ProductCategoryPersistenceEntity>(
  {
    name: {
      type: String,
      required: [true, 'Product category name is required'],
      trim: true,
      maxlength: [
        PRODUCT_CATEGORY_NAME_MAX_LENGTH,
        `Product category name must be at most ${PRODUCT_CATEGORY_NAME_MAX_LENGTH} characters`,
      ],
      match: [
        PRODUCT_CATEGORY_NAME_PATTERN,
        'Use Latin letters and spaces, starting with an uppercase letter',
      ],
    },

    normalizedName: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: [true, 'Product category slug is required'],
      trim: true,
      lowercase: true,
      match: [
        PRODUCT_CATEGORY_SLUG_PATTERN,
        'Product category slug must use lowercase snake_case',
      ],
    },

    status: {
      type: String,
      enum: PRODUCT_CATEGORY_STATUSES,
      required: true,
      default: 'active',
    },

    kind: {
      type: String,
      enum: PRODUCT_CATEGORY_KINDS,
      required: true,
      default: 'standard',
    },

    sortOrder: {
      type: Number,
      required: true,
      min: [0, 'Product category sort order must be non-negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Product category sort order must be an integer',
      },
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

//===============================================================

productCategorySchema.pre('validate', function normalizeCategoryIdentity() {
  if (typeof this.name === 'string') {
    this.name = normalizeProductCategoryName(this.name);
    this.normalizedName = normalizeProductCategoryNameKey(this.name);
  }
});

//===============================================================

productCategorySchema.index(
  { normalizedName: 1 },
  { unique: true, name: 'product_category_normalized_name_unique' }
);

productCategorySchema.index(
  { slug: 1 },
  { unique: true, name: 'product_category_slug_unique' }
);

productCategorySchema.index({ status: 1, sortOrder: 1, _id: 1 });

//===============================================================

export const ProductCategory =
  models.ProductCategory ||
  model<ProductCategoryPersistenceEntity>(
    'ProductCategory',
    productCategorySchema
  );
