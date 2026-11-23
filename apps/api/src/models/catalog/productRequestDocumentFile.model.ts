import { Schema, model, models, type Types } from 'mongoose';

import {
  PRODUCT_REQUEST_ATTACHMENT_RULES,
  PRODUCT_REQUEST_LIMITS,
} from '../../constants/catalog/product-request-validation';

//=================================================================================

// Separate binary storage: never embed Base64 attachments in ProductRequest.
export type ProductRequestDocumentFileEntity = {
  name: string;
  size: number;
  type: string;
  sha256: string;
  content: Buffer;
  ownerId: Types.ObjectId;
  uploadedByUserId: Types.ObjectId;
  requestId?: Types.ObjectId;
  attachedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

//=================================================================================

const productRequestDocumentFileSchema =
  new Schema<ProductRequestDocumentFileEntity>(
    {
      name: {
        type: String,
        trim: true,
        required: true,
        maxlength: PRODUCT_REQUEST_LIMITS.fileNameMax,
      },

      size: {
        type: Number,
        required: true,
        min: 1,
        max: PRODUCT_REQUEST_ATTACHMENT_RULES.maxSizeBytes,
      },

      type: {
        type: String,
        required: true,
        enum: [...PRODUCT_REQUEST_ATTACHMENT_RULES.mimeTypes],
      },

      sha256: { type: String, required: true, match: /^[a-f\d]{64}$/ },
      content: { type: Buffer, required: true, select: false },

      ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },

      uploadedByUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },

      requestId: {
        type: Schema.Types.ObjectId,
        ref: 'ProductRequest',
        index: true,
      },

      attachedAt: { type: Date, default: undefined },
      expiresAt: { type: Date, default: undefined },
    },

    { timestamps: true, versionKey: false }
  );

//=================================================================================

productRequestDocumentFileSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

//=================================================================================

productRequestDocumentFileSchema.index({
  ownerId: 1,
  requestId: 1,
  attachedAt: 1,
});

//=================================================================================

export const ProductRequestDocumentFile =
  models.ProductRequestDocumentFile ||
  model<ProductRequestDocumentFileEntity>(
    'ProductRequestDocumentFile',
    productRequestDocumentFileSchema
  );
