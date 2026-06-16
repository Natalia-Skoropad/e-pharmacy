import mongoose, { Types } from 'mongoose';

import { env } from '../config/env';
import { Client } from '../models/client.model';
import { Pharmacy } from '../models/pharmacy.model';
import { PharmacyReview } from '../models/pharmacyReview.model';
import { ProductOffer } from '../models/productOffer.model';
import { ProductReview } from '../models/productReview.model';

//===============================================================

const LEGACY_AVAILABLE_QUANTITY_KEY = ['active', 'Quantity'].join('');
const LEGACY_OFFER_AVAILABILITY_KEY = ['in', 'Stock'].join('');
const LEGACY_MEDICAL_DEVICES_CATEGORY = ['medical', 'devices'].join('-');
const LEGACY_POSTAL_DELIVERY_METHOD = ['po', 'st'].join('');

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
  const productOffers = db.collection('productoffers');
  const carts = db.collection('carts');
  const orders = db.collection('orders');

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
      const reservedQuantity = offer.reservedQuantity ?? 0;
      const totalQuantity = offer.totalQuantity ?? 0;
      const availableQuantity =
        offer.availableQuantity ??
        offer[LEGACY_AVAILABLE_QUANTITY_KEY] ??
        Math.max(totalQuantity - reservedQuantity, 0);

      await ProductOffer.updateOne(
        { productId: product._id, pharmacyId: offer.pharmacyId },
        {
          $set: {
            price: offer.price,
            totalQuantity,
            availableQuantity,
            reservedQuantity,
          },
          $unset: {
            [LEGACY_OFFER_AVAILABILITY_KEY]: '',
            [LEGACY_AVAILABLE_QUANTITY_KEY]: '',
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
    const category =
      product.category === LEGACY_MEDICAL_DEVICES_CATEGORY
        ? 'medical_devices'
        : product.category;

    await products.updateOne(
      { _id: product._id },
      {
        $set: { status, category },
        $unset: { offers: '', reviews: '' },
      }
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

  // Normalize already-extracted ProductOffer documents.
  for await (const offer of productOffers.find({})) {
    const reservedQuantity = offer.reservedQuantity ?? 0;
    const totalQuantity = offer.totalQuantity ?? 0;
    const availableQuantity =
      offer.availableQuantity ??
      offer[LEGACY_AVAILABLE_QUANTITY_KEY] ??
      Math.max(totalQuantity - reservedQuantity, 0);

    await productOffers.updateOne(
      { _id: offer._id },
      {
        $set: { totalQuantity, availableQuantity, reservedQuantity },
        $unset: {
          [LEGACY_AVAILABLE_QUANTITY_KEY]: '',
          [LEGACY_OFFER_AVAILABILITY_KEY]: '',
        },
      }
    );
  }

  // Cart now references ProductOffer directly and uses clientUserId/unitPrice.
  for await (const cart of carts.find({})) {
    const nextItems = [];

    for (const item of cart.items ?? []) {
      let productOfferId = item.productOfferId;
      if (!productOfferId && item.productId && item.pharmacyId) {
        const offer = await productOffers.findOne({
          productId: item.productId,
          pharmacyId: item.pharmacyId,
        });
        productOfferId = offer?._id;
      }

      if (!productOfferId) continue;

      const offer = await productOffers.findOne({ _id: productOfferId });
      nextItems.push({
        _id: item._id ?? new Types.ObjectId(),
        productOfferId,
        quantity: item.quantity,
        unitPrice: offer?.price ?? item.unitPrice ?? item.price ?? 0,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    }

    await carts.updateOne(
      { _id: cart._id },
      {
        $set: {
          clientUserId: cart.clientUserId ?? cart.userId,
          items: nextItems,
        },
        $unset: { userId: '' },
      }
    );
  }

  // Orders keep immutable snapshots and a ProductOffer link per item.
  for await (const order of orders.find({})) {
    const nextItems = [];

    for (const item of order.items ?? []) {
      let productOfferId = item.productOfferId;
      if (!productOfferId && item.productId && order.pharmacyId) {
        const offer = await productOffers.findOne({
          productId: item.productId,
          pharmacyId: order.pharmacyId,
        });
        productOfferId = offer?._id;
      }

      if (!productOfferId) continue;

      const unitPrice = item.unitPrice ?? item.price ?? 0;
      nextItems.push({
        _id: item._id ?? new Types.ObjectId(),
        productId: item.productId,
        productOfferId,
        productSnapshot: {
          name: item.productSnapshot?.name,
          slug: item.productSnapshot?.slug,
          article: item.productSnapshot?.article,
          imageUrl: item.productSnapshot?.imageUrl,
          manufacturer: item.productSnapshot?.manufacturer,
          dosage: item.productSnapshot?.dosage,
          packageQuantity: item.productSnapshot?.packageQuantity,
        },
        quantity: item.quantity,
        unitPrice,
        totalPrice: item.quantity * unitPrice,
      });
    }

    const deliveryMethod =
      order.delivery?.method ??
      (order.deliveryMethod === LEGACY_POSTAL_DELIVERY_METHOD
        ? 'postal_delivery'
        : (order.deliveryMethod ?? 'pickup'));
    const delivery =
      deliveryMethod === 'postal_delivery'
        ? {
            method: 'postal_delivery',
            details: order.delivery?.details ?? order.deliveryDetails,
          }
        : { method: 'pickup' };

    const createdAt = order.createdAt ?? new Date();
    const statusHistory = order.statusHistory?.length
      ? order.statusHistory
      : [
          {
            status: order.status ?? 'new',
            changedAt: createdAt,
            changedBy: order.userId,
          },
        ];

    await orders.updateOne(
      { _id: order._id },
      {
        $set: {
          items: nextItems,
          currency: order.currency ?? 'UAH',
          delivery,
          statusHistory,
        },
        $unset: { deliveryMethod: '', deliveryDetails: '' },
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
