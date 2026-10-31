import { Schema, model, models } from 'mongoose';

//===============================================================

// A single identifier may be reserved by one pharmacy (published OR pending).
// Do not expose the registry through public endpoints or audit payloads.
const schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    pharmacyId: { type: Schema.Types.ObjectId, required: true, index: true },

    // One reservation per value, shared by pharmacies belonging to this owner.
    ownerId: { type: Schema.Types.ObjectId, index: true },
  },
  { timestamps: true }
);

//===============================================================

export const PharmacyPaymentIdentifier =
  models.PharmacyPaymentIdentifier ??
  model('PharmacyPaymentIdentifier', schema);
