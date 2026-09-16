import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { Order } from '../models/order.model';
import { Pharmacy } from '../models/pharmacy.model';
import { Product } from '../models/product.model';
import { ProductOffer } from '../models/productOffer.model';
import { StockMovement } from '../models/stockMovement.model';
import { User } from '../models/user.model';
import type { HttpError } from '../types/errors';

import { createManagerOrderService } from './order.service';

import {
  addProductToMyPharmacyService,
  removeProductFromMyPharmacyService,
} from './product.service';

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
  'product offer mutations remain consistent under concurrent add and order/remove races',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const suffix = new Types.ObjectId().toHexString().toUpperCase();
    const ownerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();
    const productId = new Types.ObjectId();
    const clientId = new Types.ObjectId();
    const phoneSuffix = getPhoneSuffix(suffix);

    await Promise.all([
      Pharmacy.create({
        _id: pharmacyId,
        ownerId,
        managerUserIds: [],
        documents: [],
        name: `Atomic Pharmacy ${suffix.slice(-8)}`,
        status: 'active',
      }),

      Product.create({
        _id: productId,
        name: `Atomic Product ${suffix.slice(-8)}`,
        article: `AT-${suffix.slice(-12)}`,
        category: 'medicine',
        status: 'active',
        price: 100,
        inStock: true,
      }),

      User.create({
        _id: clientId,
        name: 'Atomic Test Client',
        email: `atomic-${suffix.toLowerCase()}@example.com`,
        password: 'test-password-hash',
        role: 'client',
        status: 'active',
        phone: `+38050${phoneSuffix}`,
        isDefaultPharmacyClient: true,
        defaultClientPharmacyId: pharmacyId,
      }),
    ]);

    try {
      const addResults = await Promise.allSettled([
        addProductToMyPharmacyService(productId.toString(), ownerId.toString()),
        addProductToMyPharmacyService(productId.toString(), ownerId.toString()),
      ]);

      assert.equal(
        addResults.filter((result) => result.status === 'fulfilled').length,
        1
      );

      assert.equal(
        addResults.filter((result) => result.status === 'rejected').length,
        1
      );

      const rejectedAdd = addResults.find(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected'
      );

      assert.ok(rejectedAdd);
      assert.equal((rejectedAdd.reason as HttpError).status, 409);

      assert.equal(
        (rejectedAdd.reason as HttpError).code,
        'PRODUCT_MANAGEMENT_ALREADY_ADDED'
      );

      const offer = await ProductOffer.findOne({ productId, pharmacyId }).lean<{
        _id: Types.ObjectId;
      } | null>();

      assert.ok(offer);

      assert.equal(
        await StockMovement.countDocuments({
          productOfferId: offer._id,
          eventType: 'arrival',
        }),
        1
      );

      const [removeResult, orderResult] = await Promise.allSettled([
        removeProductFromMyPharmacyService(
          productId.toString(),
          ownerId.toString()
        ),

        createManagerOrderService(
          { id: ownerId.toString(), role: 'pharmacy' },
          {
            clientRequestId: '89cf0a15-d61e-4d8b-94b6-c2b9cbeb81cb',
            clientId: clientId.toString(),
            items: [{ productOfferId: offer._id.toString(), quantity: 1 }],
            paymentMethod: 'cash',
            deliveryMethod: 'pickup',
            comment: '',
          }
        ),
      ]);

      assert.notEqual(
        removeResult.status === 'fulfilled' &&
          orderResult.status === 'fulfilled',
        true,
        'remove and order creation must not both commit for the same offer'
      );

      const persistedOffer = await ProductOffer.findById(offer._id).lean();

      const relatedOrder = await Order.findOne({
        'items.productOfferId': offer._id,
      }).lean();

      if (orderResult.status === 'fulfilled') {
        assert.ok(
          persistedOffer,
          'committed order must retain its product offer'
        );
        assert.ok(relatedOrder, 'committed order must be persisted');
        assert.equal(removeResult.status, 'rejected');
      } else if (removeResult.status === 'fulfilled') {
        assert.equal(persistedOffer, null);
        assert.equal(relatedOrder, null);
      } else {
        assert.fail(
          'one of the concurrent order/remove operations must commit'
        );
      }
    } finally {
      const offers = await ProductOffer.find({ productId, pharmacyId })
        .select('_id')
        .lean<Array<{ _id: Types.ObjectId }>>();
      const offerIds = offers.map((offer) => offer._id);

      await Promise.all([
        Order.deleteMany({ pharmacyId }),
        StockMovement.deleteMany({ productId, pharmacyId }),
        ProductOffer.deleteMany({ productId, pharmacyId }),
        Product.deleteOne({ _id: productId }),
        Pharmacy.deleteOne({ _id: pharmacyId }),
        User.deleteOne({ _id: clientId }),
        ...(offerIds.length
          ? [StockMovement.deleteMany({ productOfferId: { $in: offerIds } })]
          : []),
      ]);

      await mongoose.disconnect();
    }
  }
);
