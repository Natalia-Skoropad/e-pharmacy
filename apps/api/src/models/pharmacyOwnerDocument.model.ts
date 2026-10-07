import { Schema, model, models, type Types } from 'mongoose';

import { PHARMACY_OWNER_DOCUMENT_RULES } from '../constants/pharmacy-owner-document-validation';

//===============================================================

export type PharmacyOwnerDocumentEntity = {
  ownerUserId: Types.ObjectId;
  uploadedByUserId: Types.ObjectId;
  name: string;
  size: number;
  type: string;
  sha256: string;
  content: Buffer;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

const pharmacyOwnerDocumentSchema = new Schema<PharmacyOwnerDocumentEntity>(
  {
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
      index: true,
    },

    uploadedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: PHARMACY_OWNER_DOCUMENT_RULES.fileNameMaxLength,
    },

    size: {
      type: Number,
      required: true,
      min: 1,
      max: PHARMACY_OWNER_DOCUMENT_RULES.maxSizeBytes,
    },

    type: {
      type: String,
      required: true,
      enum: [...PHARMACY_OWNER_DOCUMENT_RULES.mimeTypes],
    },

    sha256: {
      type: String,
      required: true,
      match: /^[a-f\d]{64}$/,
    },

    content: {
      type: Buffer,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

//===============================================================

pharmacyOwnerDocumentSchema.index({ ownerUserId: 1, createdAt: -1, _id: -1 });

//===============================================================

export const PharmacyOwnerDocument =
  models.PharmacyOwnerDocument ||
  model<PharmacyOwnerDocumentEntity>(
    'PharmacyOwnerDocument',
    pharmacyOwnerDocumentSchema
  );
