import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose, { Types } from 'mongoose';

import { Pharmacy } from '../models/pharmacy.model';
import { Product } from '../models/product.model';
import { ProductOffer } from '../models/productOffer.model';
import { ProductRequest } from '../models/productRequest.model';

import { getManagedProductStatisticsService } from './product.service';
import { getProductRequestStatisticsService } from './product-request.service';

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
  'product-request statistics return one tenant-scoped status distribution',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const suffix = new Types.ObjectId().toHexString().toUpperCase();
    const ownerA = new Types.ObjectId();
    const ownerB = new Types.ObjectId();
    const pharmacyA = new Types.ObjectId();
    const pharmacyB = new Types.ObjectId();

    await Promise.all([
      Pharmacy.create({
        _id: pharmacyA,
        ownerId: ownerA,
        managerUserIds: [],
        documents: [],
        name: `Analytics Requests Pharmacy A ${suffix.slice(-6)}`,
        status: 'active',
      }),

      Pharmacy.create({
        _id: pharmacyB,
        ownerId: ownerB,
        managerUserIds: [],
        documents: [],
        name: `Analytics Requests Pharmacy B ${suffix.slice(-6)}`,
        status: 'active',
      }),
    ]);

    const requestIds = Array.from({ length: 6 }, () => new Types.ObjectId());

    try {
      await ProductRequest.create([
        {
          _id: requestIds[0],
          pharmacyId: pharmacyA,
          name: 'Analytics draft A1',
          article: `AN-D1-${suffix.slice(-8)}`,
          category: 'medicine',
          status: 'draft',
        },
        {
          _id: requestIds[1],
          pharmacyId: pharmacyA,
          name: 'Analytics draft A2',
          article: `AN-D2-${suffix.slice(-8)}`,
          category: 'medicine',
          status: 'draft',
        },
        {
          _id: requestIds[2],
          pharmacyId: pharmacyA,
          name: 'Analytics approved A',
          article: `AN-A1-${suffix.slice(-8)}`,
          category: 'medicine',
          status: 'approved',
        },
        {
          _id: requestIds[3],
          pharmacyId: pharmacyA,
          name: 'Analytics rejected A',
          article: `AN-R1-${suffix.slice(-8)}`,
          category: 'medicine',
          status: 'rejected',
        },
        {
          _id: requestIds[4],
          pharmacyId: pharmacyB,
          name: 'Analytics new B1',
          article: `AN-N1-${suffix.slice(-8)}`,
          category: 'medicine',
          status: 'new',
        },
        {
          _id: requestIds[5],
          pharmacyId: pharmacyB,
          name: 'Analytics new B2',
          article: `AN-N2-${suffix.slice(-8)}`,
          category: 'medicine',
          status: 'new',
        },
      ]);

      const statisticsA = await getProductRequestStatisticsService(
        ownerA.toString()
      );

      const statisticsB = await getProductRequestStatisticsService(
        ownerB.toString()
      );

      assert.deepEqual(statisticsA, {
        draft: 2,
        new: 0,
        in_progress: 0,
        approved: 1,
        rejected: 1,
      });

      assert.deepEqual(statisticsB, {
        draft: 0,
        new: 2,
        in_progress: 0,
        approved: 0,
        rejected: 0,
      });
    } finally {
      await Promise.all([
        ProductRequest.deleteMany({ _id: { $in: requestIds } }),
        Pharmacy.deleteMany({ _id: { $in: [pharmacyA, pharmacyB] } }),
      ]);

      await mongoose.disconnect();
    }
  }
);

//===================================================================

test(
  'managed-product statistics keep added/not-added counts scoped to the current pharmacy',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const suffix = new Types.ObjectId().toHexString().toUpperCase();
    const ownerA = new Types.ObjectId();
    const ownerB = new Types.ObjectId();
    const pharmacyA = new Types.ObjectId();
    const pharmacyB = new Types.ObjectId();

    await Promise.all([
      Pharmacy.create({
        _id: pharmacyA,
        ownerId: ownerA,
        managerUserIds: [],
        documents: [],
        name: `Analytics Products Pharmacy A ${suffix.slice(-6)}`,
        status: 'active',
      }),

      Pharmacy.create({
        _id: pharmacyB,
        ownerId: ownerB,
        managerUserIds: [],
        documents: [],
        name: `Analytics Products Pharmacy B ${suffix.slice(-6)}`,
        status: 'active',
      }),
    ]);

    const productIds = Array.from({ length: 5 }, () => new Types.ObjectId());
    const offerIds = Array.from({ length: 4 }, () => new Types.ObjectId());

    try {
      await Product.create([
        {
          _id: productIds[0],
          name: 'Analytics active added A',
          article: `AN-P1-${suffix.slice(-8)}`,
          status: 'active',
          category: 'medicine',
        },
        {
          _id: productIds[1],
          name: 'Analytics blocked added A',
          article: `AN-P2-${suffix.slice(-8)}`,
          status: 'blocked',
          category: 'medicine',
        },
        {
          _id: productIds[2],
          name: 'Analytics active added B',
          article: `AN-P3-${suffix.slice(-8)}`,
          status: 'active',
          category: 'medicine',
        },
        {
          _id: productIds[3],
          name: 'Analytics blocked no offer',
          article: `AN-P4-${suffix.slice(-8)}`,
          status: 'blocked',
          category: 'medicine',
        },
        {
          _id: productIds[4],
          name: 'Analytics new excluded',
          article: `AN-P5-${suffix.slice(-8)}`,
          status: 'new',
          category: 'medicine',
        },
      ]);

      await ProductOffer.create([
        {
          _id: offerIds[0],
          productId: productIds[0],
          pharmacyId: pharmacyA,
          price: 100,
          totalQuantity: 5,
          availableQuantity: 5,
          reservedQuantity: 0,
        },
        {
          _id: offerIds[1],
          productId: productIds[1],
          pharmacyId: pharmacyA,
          price: 110,
          totalQuantity: 5,
          availableQuantity: 5,
          reservedQuantity: 0,
        },
        {
          _id: offerIds[2],
          productId: productIds[2],
          pharmacyId: pharmacyB,
          price: 120,
          totalQuantity: 5,
          availableQuantity: 5,
          reservedQuantity: 0,
        },
        {
          _id: offerIds[3],
          productId: productIds[4],
          pharmacyId: pharmacyA,
          price: 130,
          totalQuantity: 5,
          availableQuantity: 5,
          reservedQuantity: 0,
        },
      ]);

      const statisticsA = await getManagedProductStatisticsService({
        userId: ownerA.toString(),
        role: 'pharmacy',
      });

      const statisticsB = await getManagedProductStatisticsService({
        userId: ownerB.toString(),
        role: 'pharmacy',
      });

      assert.deepEqual(statisticsA, {
        active: 2,
        blocked: 2,
        addedToPharmacy: 2,
        notAddedToPharmacy: 2,
      });

      assert.deepEqual(statisticsB, {
        active: 2,
        blocked: 2,
        addedToPharmacy: 1,
        notAddedToPharmacy: 3,
      });

      await assert.rejects(
        getManagedProductStatisticsService({
          userId: ownerA.toString(),
          role: 'admin',
        }),

        (error: unknown) =>
          typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          error.status === 403
      );
    } finally {
      await Promise.all([
        ProductOffer.deleteMany({ _id: { $in: offerIds } }),
        Product.deleteMany({ _id: { $in: productIds } }),
        Pharmacy.deleteMany({ _id: { $in: [pharmacyA, pharmacyB] } }),
      ]);
      await mongoose.disconnect();
    }
  }
);
