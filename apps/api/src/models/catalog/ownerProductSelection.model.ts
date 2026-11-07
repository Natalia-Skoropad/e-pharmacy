import { Schema, model, models, type Types } from 'mongoose';

//===================================================================

// Owner-wide catalog choices survive changes to individual pharmacy statuses.
type OwnerProductSelectionEntity = {
  ownerId: Types.ObjectId;
  productId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

//===================================================================

const schema = new Schema<OwnerProductSelectionEntity>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  },

  { timestamps: true, versionKey: false }
);

//===================================================================

schema.index({ ownerId: 1, productId: 1 }, { unique: true });

//===================================================================

export const OwnerProductSelection =
  models.OwnerProductSelection ||
  model<OwnerProductSelectionEntity>('OwnerProductSelection', schema);
