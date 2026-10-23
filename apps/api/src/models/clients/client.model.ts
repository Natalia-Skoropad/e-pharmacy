import { Schema, model, models } from 'mongoose';

//===============================================================

export type ClientEntity = {
  userId: Schema.Types.ObjectId;
  favoriteProductIds: Schema.Types.ObjectId[];
  favoritePharmacyIds: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

const clientSchema = new Schema<ClientEntity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    favoriteProductIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
    },

    favoritePharmacyIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Pharmacy',
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

//===============================================================

export const Client =
  models.Client || model<ClientEntity>('Client', clientSchema);
