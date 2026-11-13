import { Schema, model, models } from 'mongoose';

//===============================================================

export type PharmacyNoteEntity = {
  pharmacyId?: Schema.Types.ObjectId;
  ownerId?: Schema.Types.ObjectId;
  entityType: 'client' | 'product' | 'pharmacy' | 'product_request';
  entityId: Schema.Types.ObjectId;
  text: string;
  createdBy: Schema.Types.ObjectId;
  authorDisplayName?: string;
  clientRequestId?: string;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

const pharmacyNoteSchema = new Schema<PharmacyNoteEntity>(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',

      // Client-card comments are owner-scoped; legacy pharmacy notes keep
      // their required pharmacyId and remain in their original collection.
      required: function (this: PharmacyNoteEntity) {
        return !this.ownerId;
      },

      index: true,
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
      index: true,

      validate: {
        validator: function (this: PharmacyNoteEntity) {
          return (
            ['client', 'product'].includes(this.entityType) && !this.pharmacyId
          );
        },

        message: 'Owner-scoped notes must target a client without a pharmacy.',
      },
    },

    entityType: {
      type: String,
      enum: ['client', 'product', 'pharmacy', 'product_request'],
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
    authorDisplayName: { type: String, trim: true, default: undefined },
    clientRequestId: { type: String, trim: true, default: undefined },
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

pharmacyNoteSchema.index(
  {
    pharmacyId: 1,
    entityType: 1,
    entityId: 1,
    createdBy: 1,
    clientRequestId: 1,
  },
  {
    unique: true,
    partialFilterExpression: { clientRequestId: { $type: 'string' } },
  }
);

//===============================================================

// Owner-wide client comments have their own index and never need a current
// pharmacy. The old pharmacy-based indexes remain for existing notes.
pharmacyNoteSchema.index({
  ownerId: 1,
  entityType: 1,
  entityId: 1,
  createdAt: -1,
});

//===============================================================

pharmacyNoteSchema.index(
  { ownerId: 1, entityType: 1, entityId: 1, createdBy: 1, clientRequestId: 1 },
  {
    name: 'owner_client_comment_idempotency',
    unique: true,

    partialFilterExpression: {
      ownerId: { $type: 'objectId' },
      clientRequestId: { $type: 'string' },
    },
  }
);

//===============================================================

export const PharmacyNote =
  models.PharmacyNote ||
  model<PharmacyNoteEntity>('PharmacyNote', pharmacyNoteSchema);
