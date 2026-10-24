import { Schema, model, models, type Types } from 'mongoose';

import { PHARMACY_OWNER_ADMIN_COMMENT_MAX_LENGTH } from '../../../constants/owners/pharmacy-owner-admin-comment';

//===============================================================

// Pharmacy admin comments are never stored in Pharmacy or PharmacyNote.
export type PharmacyAdminCommentEntity = {
  pharmacyId: Types.ObjectId;
  text: string;
  createdByAdminUserId: Types.ObjectId;
  authorNameSnapshot: string;
  clientRequestId: string;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

const schema = new Schema<PharmacyAdminCommentEntity>(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
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
  { timestamps: true, versionKey: false }
);

//===============================================================

schema.index({ pharmacyId: 1, createdAt: -1, _id: -1 });
schema.index({ createdByAdminUserId: 1, clientRequestId: 1 }, { unique: true });

//===============================================================

export const PharmacyAdminComment =
  models.PharmacyAdminComment ||
  model<PharmacyAdminCommentEntity>('PharmacyAdminComment', schema);
