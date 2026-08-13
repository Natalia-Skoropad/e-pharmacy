import { Schema, model, models, type Types } from 'mongoose';

import { PHARMACY_DOCUMENT_RULES } from '../constants/pharmacy-document-validation';

//===================================================================

type PharmacyDocumentFileEntity = {
  name: string;
  size: number;
  type: string;
  sha256: string;
  content: Buffer;
  claimTokenHash?: string;
  pharmacyId?: Types.ObjectId;
  uploadedByUserId?: Types.ObjectId;
  attachedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

//===================================================================

const pharmacyDocumentFileSchema = new Schema<PharmacyDocumentFileEntity>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: PHARMACY_DOCUMENT_RULES.fileNameMaxLength,
    },

    size: {
      type: Number,
      required: true,
      min: 1,
      max: PHARMACY_DOCUMENT_RULES.maxSizeBytes,
    },

    type: {
      type: String,
      required: true,
      enum: [...PHARMACY_DOCUMENT_RULES.mimeTypes],
    },

    sha256: {
      type: String,
      required: true,
      match: /^[a-f\d]{64}$/,
      index: true,
    },

    content: {
      type: Buffer,
      required: true,
      select: false,
    },

    claimTokenHash: {
      type: String,
      select: false,
      default: undefined,
    },

    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
      index: true,
      default: undefined,
    },

    uploadedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: undefined,
    },

    attachedAt: {
      type: Date,
      default: undefined,
    },

    expiresAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unclaimed registration uploads and private uploads that never become part of
// a saved profile are removed automatically. Attached files unset expiresAt.
pharmacyDocumentFileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
pharmacyDocumentFileSchema.index({ pharmacyId: 1, attachedAt: 1 });

//===================================================================

export const PharmacyDocumentFile =
  models.PharmacyDocumentFile ||
  model<PharmacyDocumentFileEntity>(
    'PharmacyDocumentFile',
    pharmacyDocumentFileSchema
  );
