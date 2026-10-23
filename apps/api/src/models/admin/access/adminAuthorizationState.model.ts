import { Schema, model, models } from 'mongoose';

//===============================================================

type AdminAuthorizationStateEntity = {
  key: 'platform-owner';
  ownerRevision: number;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

const adminAuthorizationStateSchema = new Schema<AdminAuthorizationStateEntity>(
  {
    key: {
      type: String,
      enum: ['platform-owner'],
      required: true,
      unique: true,
    },

    ownerRevision: {
      type: Number,
      min: 0,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

//===============================================================

export const AdminAuthorizationState =
  models.AdminAuthorizationState ||
  model<AdminAuthorizationStateEntity>(
    'AdminAuthorizationState',
    adminAuthorizationStateSchema
  );
