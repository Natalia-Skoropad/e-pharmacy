import { Schema, model, models } from 'mongoose';

//===============================================================

export type ProductOfferEntity = {
  productId: Schema.Types.ObjectId;
  pharmacyId: Schema.Types.ObjectId;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

const productOfferSchema = new Schema<ProductOfferEntity>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },

    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
      index: true,
    },

    price: {
      type: Number,
      required: [true, 'Offer price is required'],
      min: 0,
    },

    totalQuantity: { type: Number, min: 0, default: 0, required: true },
    availableQuantity: { type: Number, min: 0, default: 0, required: true },
    reservedQuantity: { type: Number, min: 0, default: 0, required: true },
  },

  { timestamps: true, versionKey: false }
);

//===============================================================

productOfferSchema.pre('validate', function validateStockInvariant() {
  if (this.reservedQuantity > this.totalQuantity) {
    this.invalidate(
      'reservedQuantity',
      'Reserved quantity cannot exceed total quantity.'
    );
  }

  if (this.availableQuantity + this.reservedQuantity !== this.totalQuantity) {
    this.invalidate(
      'availableQuantity',
      'Available and reserved quantities must equal total quantity.'
    );
  }
});

//===============================================================

productOfferSchema.index({ productId: 1, pharmacyId: 1 }, { unique: true });
productOfferSchema.index({ pharmacyId: 1, availableQuantity: 1 });
productOfferSchema.index({ productId: 1, availableQuantity: 1, price: 1 });

//===============================================================

export const ProductOffer =
  models.ProductOffer ||
  model<ProductOfferEntity>('ProductOffer', productOfferSchema);
