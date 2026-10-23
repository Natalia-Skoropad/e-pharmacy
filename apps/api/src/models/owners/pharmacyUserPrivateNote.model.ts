import { Schema, model, models, type Types } from 'mongoose';

import { PRIVATE_COMMENT_MAX_LENGTH } from '../../constants/private-comment';

//===============================================================

export type PharmacyUserPrivateNoteEntity = {
  ownerUserId: Types.ObjectId;
  text: string;
  clientRequestId: string;
  authorNameSnapshot: string;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

const pharmacyUserPrivateNoteSchema = new Schema<PharmacyUserPrivateNoteEntity>(
  {
    // Always the authenticated user's ID, never a pharmacy or employer ID.
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
      maxlength: PRIVATE_COMMENT_MAX_LENGTH,
    },

    clientRequestId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 36,

      match:
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    },

    authorNameSnapshot: {
      type: String,
      required: true,
      trim: true,
      maxlength: 254,
    },
  },

  { timestamps: true, versionKey: false }
);

//===============================================================

pharmacyUserPrivateNoteSchema.index({
  ownerUserId: 1,

  createdAt: -1,
  _id: -1,
});

pharmacyUserPrivateNoteSchema.index(
  { ownerUserId: 1, clientRequestId: 1 },
  { unique: true }
);

//===============================================================

export const PharmacyUserPrivateNote =
  models.PharmacyUserPrivateNote ||
  model<PharmacyUserPrivateNoteEntity>(
    'PharmacyUserPrivateNote',
    pharmacyUserPrivateNoteSchema
  );
