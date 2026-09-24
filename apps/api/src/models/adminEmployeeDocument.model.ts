import { Schema, model, models, type Types } from 'mongoose';

import { ADMIN_EMPLOYEE_DOCUMENT_RULES } from '../constants/admin-employee-document-validation';

//===============================================================

export type AdminEmployeeDocumentEntity = {
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

const adminEmployeeDocumentSchema = new Schema<AdminEmployeeDocumentEntity>(
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
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: ADMIN_EMPLOYEE_DOCUMENT_RULES.fileNameMaxLength,
    },

    size: {
      type: Number,
      required: true,
      min: 1,
      max: ADMIN_EMPLOYEE_DOCUMENT_RULES.maxSizeBytes,
    },

    type: {
      type: String,
      required: true,
      enum: [...ADMIN_EMPLOYEE_DOCUMENT_RULES.mimeTypes],
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

adminEmployeeDocumentSchema.index({ ownerUserId: 1, createdAt: -1, _id: -1 });

//===============================================================

export const AdminEmployeeDocument =
  models.AdminEmployeeDocument ||
  model<AdminEmployeeDocumentEntity>(
    'AdminEmployeeDocument',
    adminEmployeeDocumentSchema
  );
