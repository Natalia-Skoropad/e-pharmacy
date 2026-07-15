import { Schema, model, models } from 'mongoose';

//===============================================================

export type PharmacyNoteEntity = {
  pharmacyId: Schema.Types.ObjectId;
  entityType: 'client' | 'product' | 'pharmacy';
  entityId: Schema.Types.ObjectId;
  text: string;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

const pharmacyNoteSchema = new Schema<PharmacyNoteEntity>(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
      index: true,
    },

    entityType: {
      type: String,
      enum: ['client', 'product', 'pharmacy'],
      required: true,
      index: true,
    },

    entityId: { type: Schema.Types.ObjectId, required: true, index: true },

    text: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 1000,
      required: true,
    },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },

  { timestamps: true, versionKey: false }
);

//===============================================================

pharmacyNoteSchema.index({
  pharmacyId: 1,
  entityType: 1,
  entityId: 1,
  createdAt: -1,
});

//===============================================================

export const PharmacyNote =
  models.PharmacyNote ||
  model<PharmacyNoteEntity>('PharmacyNote', pharmacyNoteSchema);
