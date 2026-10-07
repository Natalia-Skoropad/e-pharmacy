import { Schema, model, models, type Types } from 'mongoose';

import { PHARMACY_OWNER_ADMIN_COMMENT_MAX_LENGTH } from '../constants/pharmacy-owner-admin-comment';

//===============================================================

export type PharmacyOwnerAdminCommentEntity = {
  ownerUserId: Types.ObjectId;
  text: string;
  createdByAdminUserId: Types.ObjectId;
  authorNameSnapshot: string;
  clientRequestId: string;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

const pharmacyOwnerAdminCommentSchema =
  new Schema<PharmacyOwnerAdminCommentEntity>(
    {
      ownerUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true,
        index: true,
      },

      text: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: PHARMACY_OWNER_ADMIN_COMMENT_MAX_LENGTH,
      },

      createdByAdminUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true,
        index: true,
      },

      authorNameSnapshot: {
        type: String,
        required: true,
        trim: true,
        maxlength: 254,
      },

      clientRequestId: {
        type: String,
        required: true,
        trim: true,
        maxlength: 36,
        match:
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

//===============================================================

pharmacyOwnerAdminCommentSchema.index({
  ownerUserId: 1,
  createdAt: -1,
  _id: -1,
});

pharmacyOwnerAdminCommentSchema.index(
  { createdByAdminUserId: 1, clientRequestId: 1 },
  { unique: true }
);

//===============================================================

export const PharmacyOwnerAdminComment =
  models.PharmacyOwnerAdminComment ||
  model<PharmacyOwnerAdminCommentEntity>(
    'PharmacyOwnerAdminComment',
    pharmacyOwnerAdminCommentSchema
  );
