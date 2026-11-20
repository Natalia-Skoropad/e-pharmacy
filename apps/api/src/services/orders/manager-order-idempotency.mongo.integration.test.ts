import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { seedIntegrationPharmacyActors } from '../__tests__/fixtures/pharmacy-integration-actors.helper';
import { getTestProductCategoryId } from '../catalog/__tests__/product-category-test.helper';

import { MANAGER_ORDER_REQUEST_REUSED_ERROR_CODE } from '../../constants/orders/order';

import { Order } from '../../models/orders/order.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { Product } from '../../models/catalog/product.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';
import { User } from '../../models/accounts/user.model';

import type { HttpError } from '../../types/http/errors';

import { createManagerOrderService } from './order-manager-orders.service';

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

    const suffix = new Types.ObjectId().toHexString().toUpperCase();
    const ownerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();
    const productId = new Types.ObjectId();
    const offerId = new Types.ObjectId();
    const clientId = new Types.ObjectId();
    const secondClientId = new Types.ObjectId();
    const phoneSuffix = getPhoneSuffix(suffix);

    try {
      const medicineCategoryId = await getTestProductCategoryId();

      await Order.syncIndexes();
      await seedIntegrationPharmacyActors([ownerId]);

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
          categoryId: medicineCategoryId,
          status: 'active',
          price: 100,
          inStock: true,
        }),

        User.create({
          _id: secondClientId,
          name: 'Parallel Test Client',
          email: `parallel-${suffix.toLowerCase()}@example.com`,
          password: 'test-password-hash',
          role: 'client',
          status: 'active',
          phone: `+38067${phoneSuffix}`,
          // A regular client is eligible for manager orders after a previous
          // order in this pharmacy; only one walk-in client may be default.
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

      // The second client is already associated with this pharmacy through a
      // historical completed order. This fixture does not reserve current stock
      // and is intentionally excluded from manager-created order assertions.
      await Order.create({
        userId: secondClientId,
        pharmacyId,
        pharmacySnapshot: { name: `Replay Pharmacy ${suffix.slice(-8)}` },

        items: [
          {
            productId,
            productOfferId: offerId,
            productSnapshot: {
              name: `Replay Product ${suffix.slice(-8)}`,
              article: `RP-${suffix.slice(-12)}`,
            },
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
          },
        ],

        totalItems: 1,
        totalPrice: 100,
        currency: '₴',
        paymentMethod: 'cash',
        delivery: { method: 'pickup' },
        status: 'successful',
        createdByType: 'client',
        orderNumber: `RP-HISTORY-${suffix.slice(-12)}`,
      });

      const input = {
        clientRequestId: '1a3ae534-45a8-466c-a99f-153242673d0c',
        clientId: clientId.toString(),
        items: [{ productOfferId: offerId.toString(), quantity: 1 }],
        paymentMethod: 'cash' as const,
        deliveryMethod: 'pickup' as const,
        comment: '',
      };

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

      assert.equal(
        await Order.countDocuments({ pharmacyId, createdByType: 'manager' }),
        1
      );

      const offerAfterConflict = await ProductOffer.findById(offerId).lean<{
        availableQuantity: number;
        reservedQuantity: number;
      } | null>();

      assert.ok(offerAfterConflict);
      assert.equal(offerAfterConflict.availableQuantity, 4);
      assert.equal(offerAfterConflict.reservedQuantity, 1);

      // Two browser tabs/employees may submit independent requests for the
      // same pharmacy at once. Neither request may reuse another's idempotency
      // key; Mongo must reserve each order exactly once without overwriting it.
      const [sameClientOrder, otherClientOrder] = await Promise.all([
        createManagerOrderService(
          { id: ownerId.toString(), role: 'pharmacy' },
          {
            ...input,
            clientRequestId: '3a350cb8-b4ac-4e5c-b970-1a0dc9f28e06',
          }
        ),

        createManagerOrderService(
          { id: ownerId.toString(), role: 'pharmacy' },
          {
            ...input,
            clientRequestId: '90d3b6df-fd0e-4c80-bfc9-2f11a23b35d6',
            clientId: secondClientId.toString(),
          }
        ),
      ]);

      assert.notEqual(sameClientOrder.order.id, otherClientOrder.order.id);
      assert.notEqual(first.order.id, sameClientOrder.order.id);

      assert.equal(
        await Order.countDocuments({ pharmacyId, createdByType: 'manager' }),
        3
      );

      const offerAfterConcurrentOrders = await ProductOffer.findById(
        offerId
      ).lean<{
        availableQuantity: number;
        reservedQuantity: number;
      } | null>();

      assert.ok(offerAfterConcurrentOrders);
      assert.equal(offerAfterConcurrentOrders.availableQuantity, 2);
      assert.equal(offerAfterConcurrentOrders.reservedQuantity, 3);
    } finally {
      try {
        await Promise.all([
          Order.deleteMany({ pharmacyId }),
          ProductOffer.deleteOne({ _id: offerId }),
          Product.deleteOne({ _id: productId }),
          Pharmacy.deleteOne({ _id: pharmacyId }),

          User.deleteMany({
            _id: { $in: [ownerId, clientId, secondClientId] },
          }),
        ]);
      } finally {
        await mongoose.disconnect();
      }
    }
  }
);
