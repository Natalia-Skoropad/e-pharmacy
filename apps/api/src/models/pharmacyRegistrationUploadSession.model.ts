import { Schema, model, models } from 'mongoose';

import { PHARMACY_DOCUMENT_RULES } from '../constants/pharmacy-document-validation';

//===================================================================

type PharmacyRegistrationUploadSessionEntity = {
  tokenHash: string;
  uploadedFiles: number;
  uploadedBytes: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

//===================================================================

const pharmacyRegistrationUploadSessionSchema =
  new Schema<PharmacyRegistrationUploadSessionEntity>(
    {
      tokenHash: {
        type: String,
        required: true,
        select: false,
      },

      uploadedFiles: {
        type: Number,
        required: true,
        min: 0,
        max: PHARMACY_DOCUMENT_RULES.maxFiles,
        default: 0,
      },

      uploadedBytes: {
        type: Number,
        required: true,
        min: 0,
        max: PHARMACY_DOCUMENT_RULES.maxTotalSizeBytes,
        default: 0,
      },

      expiresAt: {
        type: Date,
        required: true,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

pharmacyRegistrationUploadSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

//===================================================================

export const PharmacyRegistrationUploadSession =
  models.PharmacyRegistrationUploadSession ||
  model<PharmacyRegistrationUploadSessionEntity>(
    'PharmacyRegistrationUploadSession',
    pharmacyRegistrationUploadSessionSchema
  );
