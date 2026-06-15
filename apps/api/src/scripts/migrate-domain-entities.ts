import mongoose, { Types } from 'mongoose';

import { env } from '../config/env';
import { Client } from '../models/client.model';
import { Pharmacy } from '../models/pharmacy.model';
import { PharmacyReview } from '../models/pharmacyReview.model';
import { ProductOffer } from '../models/productOffer.model';
import { ProductReview } from '../models/productReview.model';

//===============================================================

/**
 * One-time migration for the canonical domain model.
 * Run after deploying the new models and before removing legacy data backups.
 */

async function migrate(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection is unavailable.');

  const users = db.collection('users');
  const pharmacies = db.collection('pharmacies');
  const products = db.collection('products');

  for await (const user of users.find({})) {
    if (user.role === 'client') {
      await Client.updateOne(
        { userId: user._id },
        {
          $setOnInsert: { userId: user._id },
          $addToSet: {
            favoriteProductIds: { $each: user.favoriteProductIds ?? [] },
            favoritePharmacyIds: { $each: user.favoritePharmacyIds ?? [] },
          },
        },
        { upsert: true }
      );
    }

    const legacyPharmacyStatus = user[['pharmacy', 'Status'].join('')];
    if (user.role === 'pharmacy' && legacyPharmacyStatus) {
      const status =
        legacyPharmacyStatus === 'inactive' ? 'blocked' : legacyPharmacyStatus;
      await Pharmacy.updateOne({ ownerId: user._id }, { $set: { status } });
    }
  }

  for await (const product of products.find({})) {
    for (const offer of product.offers ?? []) {
      await ProductOffer.updateOne(
        { productId: product._id, pharmacyId: offer.pharmacyId },
        {
          $set: {
            price: offer.price,
            totalQuantity: offer.totalQuantity ?? 0,
            activeQuantity: offer.activeQuantity ?? 0,
            reservedQuantity: offer.reservedQuantity ?? 0,
            inStock: Boolean(offer.inStock),
          },
        },
        { upsert: true }
      );
    }

    for (const review of product.reviews ?? []) {
      await ProductReview.updateOne(
        { _id: review._id ?? new Types.ObjectId(), productId: product._id },
        {
          $setOnInsert: {
            productId: product._id,
            userId: review.userId,
            userName: review.userName,
            rating: review.rating,
            comment: review.comment,
            status:
              review.status === 'approved' || review.isModerated
                ? 'approved'
                : review.status === 'rejected'
                  ? 'rejected'
                  : 'on_moderation',
            moderationReason: review.moderationReason,
            moderatedBy: review.moderatedBy,
            moderatedAt: review.moderatedAt,
            createdAt: review.createdAt,
          },
        },
        { upsert: true }
      );
    }

    const status =
      product.status === 'inactive' ? 'blocked' : (product.status ?? 'active');
    await products.updateOne(
      { _id: product._id },
      { $set: { status }, $unset: { offers: '', reviews: '' } }
    );
  }

  for await (const pharmacy of pharmacies.find({})) {
    for (const review of pharmacy.reviews ?? []) {
      await PharmacyReview.updateOne(
        { _id: review._id ?? new Types.ObjectId(), pharmacyId: pharmacy._id },
        {
          $setOnInsert: {
            pharmacyId: pharmacy._id,
            userId: review.userId,
            userName: review.userName,
            rating: review.rating,
            comment: review.comment,
            status:
              review.status === 'approved' || review.isModerated
                ? 'approved'
                : review.status === 'rejected'
                  ? 'rejected'
                  : 'on_moderation',
            moderationReason: review.moderationReason,
            moderatedBy: review.moderatedBy,
            moderatedAt: review.moderatedAt,
            createdAt: review.createdAt,
          },
        },
        { upsert: true }
      );
    }

    const status = pharmacy.status === 'inactive' ? 'blocked' : pharmacy.status;
    await pharmacies.updateOne(
      { _id: pharmacy._id },
      {
        $set: { status, managerUserIds: pharmacy.managerUserIds ?? [] },
        $unset: { reviews: '', isActive: '' },
      }
    );
  }

  await users.updateMany(
    {},
    {
      $unset: {
        [['pharmacy', 'Status'].join('')]: '',
        favoriteProductIds: '',
        favoritePharmacyIds: '',
      },
    }
  );
  await mongoose.disconnect();
}

//===============================================================

migrate().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
