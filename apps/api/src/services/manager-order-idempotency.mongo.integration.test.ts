import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { MANAGER_ORDER_REQUEST_REUSED_ERROR_CODE } from '../constants/order';
import { Order } from '../models/order.model';
import { Pharmacy } from '../models/pharmacy.model';
import { Product } from '../models/product.model';
import { ProductOffer } from '../models/productOffer.model';
import { User } from '../models/user.model';
import type { HttpError } from '../types/errors';

import { createManagerOrderService } from './order.service';

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

function getPhoneSuffix(seed: string): string {
  return String(Number.parseInt(seed.slice(-6), 16) % 10_000_000).padStart(
    7,
    '0'
  );
}

//===================================================================

test(
  'retrying the same manager order request returns the committed order without reserving stock twice',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    await Order.syncIndexes();

    const suffix = new Types.ObjectId().toHexString().toUpperCase();
    const ownerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();
    const productId = new Types.ObjectId();
    const offerId = new Types.ObjectId();
    const clientId = new Types.ObjectId();
    const phoneSuffix = getPhoneSuffix(suffix);

    await Promise.all([
      Pharmacy.create({
        _id: pharmacyId,
        ownerId,
        managerUserIds: [],
        documents: [],
        name: `Replay Pharmacy ${suffix.slice(-8)}`,
        status: 'active',
      }),

      Product.create({
        _id: productId,
        name: `Replay Product ${suffix.slice(-8)}`,
        article: `RP-${suffix.slice(-12)}`,
        category: 'medicine',
        status: 'active',
        price: 100,
        inStock: true,
      }),

      User.create({
        _id: clientId,
        name: 'Replay Test Client',
        email: `replay-${suffix.toLowerCase()}@example.com`,
        password: 'test-password-hash',
        role: 'client',
        status: 'active',
        phone: `+38050${phoneSuffix}`,
        isDefaultPharmacyClient: true,
        defaultClientPharmacyId: pharmacyId,
      }),
    ]);

    await ProductOffer.create({
      _id: offerId,
      productId,
      pharmacyId,
      price: 100,
      totalQuantity: 5,
      availableQuantity: 5,
      reservedQuantity: 0,
    });

    const input = {
      clientRequestId: '1a3ae534-45a8-466c-a99f-153242673d0c',
      clientId: clientId.toString(),
      items: [{ productOfferId: offerId.toString(), quantity: 1 }],
      paymentMethod: 'cash' as const,
      deliveryMethod: 'pickup' as const,
      comment: '',
    };

    try {
      const first = await createManagerOrderService(
        { id: ownerId.toString(), role: 'pharmacy' },
        input
      );

      const replay = await createManagerOrderService(
        { id: ownerId.toString(), role: 'pharmacy' },
        input
      );

      assert.equal(replay.order.id, first.order.id);

      assert.equal(
        await Order.countDocuments({
          pharmacyId,
          managerRequestId: input.clientRequestId,
        }),
        1
      );

      const offerAfterReplay = await ProductOffer.findById(offerId).lean<{
        availableQuantity: number;
        reservedQuantity: number;
      } | null>();

      assert.ok(offerAfterReplay);
      assert.equal(offerAfterReplay.availableQuantity, 4);
      assert.equal(offerAfterReplay.reservedQuantity, 1);

      await assert.rejects(
        () =>
          createManagerOrderService(
            { id: ownerId.toString(), role: 'pharmacy' },
            {
              ...input,
              items: [{ productOfferId: offerId.toString(), quantity: 2 }],
            }
          ),
        (error: unknown) => {
          const httpError = error as HttpError;
          assert.equal(httpError.status, 409);
          assert.equal(httpError.code, MANAGER_ORDER_REQUEST_REUSED_ERROR_CODE);
          return true;
        }
      );

      assert.equal(await Order.countDocuments({ pharmacyId }), 1);

      const offerAfterConflict = await ProductOffer.findById(offerId).lean<{
        availableQuantity: number;
        reservedQuantity: number;
      } | null>();

      assert.ok(offerAfterConflict);
      assert.equal(offerAfterConflict.availableQuantity, 4);
      assert.equal(offerAfterConflict.reservedQuantity, 1);
    } finally {
      await Promise.all([
        Order.deleteMany({ pharmacyId }),
        ProductOffer.deleteOne({ _id: offerId }),
        Product.deleteOne({ _id: productId }),
        Pharmacy.deleteOne({ _id: pharmacyId }),
        User.deleteOne({ _id: clientId }),
      ]);

      await mongoose.disconnect();
    }
  }
);
