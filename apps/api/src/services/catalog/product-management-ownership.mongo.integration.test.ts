import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { seedIntegrationPharmacyActors } from '../__tests__/fixtures/pharmacy-integration-actors.helper';

import { Pharmacy } from '../../models/pharmacy.model';
import { User } from '../../models/user.model';
import { Product } from '../../models/product.model';
import { ProductOffer } from '../../models/productOffer.model';
import type { HttpError } from '../../types/errors';

import {
  getManagedProductDetailsService,
  getManagedProductsService,
  getProductDetailsService,
} from './product.service';

import { getTestProductCategoryId } from './__tests__/product-category-test.helper';

//===================================================================

const TEST_MONGODB_URI = process.env.E_PHARMACY_TEST_MONGODB_URI;
const shouldSkip = !TEST_MONGODB_URI;

//===================================================================

function getTestMongoUri(): string {
  if (!TEST_MONGODB_URI) {
    throw new Error(
      'E_PHARMACY_TEST_MONGODB_URI is required for Mongo integration tests.'
    );
  }

  return TEST_MONGODB_URI;
}

//===================================================================

test(
  'managed products derive pharmacy scope from the authenticated pharmacy actor',
  { skip: shouldSkip },

  async () => {
    await mongoose.connect(getTestMongoUri());

    const medicineCategoryId = await getTestProductCategoryId();

    const ownerId = new Types.ObjectId();
    const foreignOwnerId = new Types.ObjectId();
    const currentPharmacyId = new Types.ObjectId();
    const foreignPharmacyId = new Types.ObjectId();
    const suffix = new Types.ObjectId().toHexString().slice(-8).toUpperCase();

    await seedIntegrationPharmacyActors([ownerId, foreignOwnerId]);

    const product = await Product.create({
      name: `Ownership Product ${suffix}`,
      article: `OWN-${suffix}`,
      categoryId: medicineCategoryId,
      status: 'active',
      price: 120,
      inStock: true,
    });

    await Promise.all([
      Pharmacy.create({
        _id: currentPharmacyId,
        ownerId,
        managerUserIds: [],
        documents: [],
        name: `Blocked Pharmacy ${suffix}`,
        status: 'blocked',
      }),

      Pharmacy.create({
        _id: foreignPharmacyId,
        ownerId: foreignOwnerId,
        managerUserIds: [],
        documents: [],
        name: `Foreign Pharmacy ${suffix}`,
        status: 'active',
      }),
    ]);

    await Promise.all([
      ProductOffer.create({
        productId: product._id,
        pharmacyId: currentPharmacyId,
        price: 120,
        totalQuantity: 10,
        availableQuantity: 8,
        reservedQuantity: 2,
      }),

      ProductOffer.create({
        productId: product._id,
        pharmacyId: foreignPharmacyId,
        price: 130,
        totalQuantity: 20,
        availableQuantity: 15,
        reservedQuantity: 5,
      }),
    ]);

    try {
      // A blocked pharmacy cannot open managed-product reads.
      await assert.rejects(
        getManagedProductsService(
          { page: 1, perPage: 20, pharmacyId: currentPharmacyId.toString() },
          { userId: ownerId.toString(), role: 'pharmacy' },
          { includeOffers: true }
        ),

        (error: unknown) => (error as HttpError).status === 403
      );

      await Pharmacy.updateOne(
        { _id: currentPharmacyId },
        { $set: { status: 'active' } }
      );

      const ownResult = await getManagedProductsService(
        {
          page: 1,
          perPage: 20,
          pharmacyId: currentPharmacyId.toString(),
        },
        { userId: ownerId.toString(), role: 'pharmacy' },
        { includeOffers: true }
      );

      assert.equal(ownResult.total, 1);

      const ownProduct = ownResult.items[0];

      assert.ok(ownProduct);

      assert.ok(
        'offers' in ownProduct,
        'Expected managed products response to include offers.'
      );

      const currentOffer = ownProduct.offers.find(
        (offer) => offer.pharmacyId === currentPharmacyId.toString()
      );

      const foreignOffer = ownProduct.offers.find(
        (offer) => offer.pharmacyId === foreignPharmacyId.toString()
      );

      assert.ok(currentOffer);
      assert.equal(currentOffer.totalQuantity, 10);
      assert.equal(currentOffer.reservedQuantity, 2);
      assert.equal(currentOffer.hasRelatedOrders, false);

      assert.ok(foreignOffer);
      assert.equal(foreignOffer.totalQuantity, undefined);
      assert.equal(foreignOffer.reservedQuantity, undefined);
      assert.equal(foreignOffer.hasRelatedOrders, undefined);

      await assert.rejects(
        getManagedProductsService(
          {
            page: 1,
            perPage: 20,
            pharmacyId: foreignPharmacyId.toString(),
          },
          { userId: ownerId.toString(), role: 'pharmacy' },
          { includeOffers: true }
        ),

        (error: unknown) => (error as HttpError).status === 403
      );

      await assert.rejects(
        getManagedProductsService(
          {
            page: 1,
            perPage: 20,
            addedToMyPharmacy: true,
            addedToPharmacyId: foreignPharmacyId.toString(),
          },
          { userId: ownerId.toString(), role: 'pharmacy' },
          { includeOffers: true }
        ),

        (error: unknown) => (error as HttpError).status === 403
      );

      const adminResult = await getManagedProductsService(
        {
          page: 1,
          perPage: 20,
          pharmacyId: foreignPharmacyId.toString(),
        },
        { userId: new Types.ObjectId().toString(), role: 'admin' },
        { includeOffers: true }
      );

      assert.equal(adminResult.total, 1);

      const managementDetails = await getManagedProductDetailsService(
        product._id.toString(),
        { userId: ownerId.toString(), role: 'pharmacy' }
      );

      const currentDetailsOffer = managementDetails.product.offers.find(
        (offer) => offer.pharmacyId === currentPharmacyId.toString()
      );

      assert.ok(currentDetailsOffer);
      assert.equal(currentDetailsOffer.totalQuantity, 10);
      assert.equal(currentDetailsOffer.reservedQuantity, 2);

      await Pharmacy.updateOne(
        { _id: currentPharmacyId },
        { $set: { status: 'blocked' } }
      );

      const publicDetails = await getProductDetailsService(
        product._id.toString()
      );

      assert.equal(publicDetails.product.offers.length, 1);

      assert.equal(
        publicDetails.product.offers[0]?.pharmacyId,
        foreignPharmacyId.toString()
      );

      assert.equal(publicDetails.product.offers[0]?.totalQuantity, undefined);

      assert.equal(
        publicDetails.product.offers[0]?.reservedQuantity,
        undefined
      );

      assert.equal(
        publicDetails.product.offers[0]?.hasRelatedOrders,
        undefined
      );

      await assert.rejects(
        getManagedProductDetailsService(product._id.toString(), {
          userId: ownerId.toString(),
          role: 'pharmacy',
        }),

        (error: unknown) => (error as HttpError).status === 403
      );
    } finally {
      await Promise.all([
        ProductOffer.deleteMany({ productId: product._id }),
        Product.deleteOne({ _id: product._id }),

        Pharmacy.deleteMany({
          _id: { $in: [currentPharmacyId, foreignPharmacyId] },
        }),

        User.deleteMany({ _id: { $in: [ownerId, foreignOwnerId] } }),
      ]);

      await mongoose.disconnect();
    }
  }
);
