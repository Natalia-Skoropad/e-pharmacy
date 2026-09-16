import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { Order } from '../models/order.model';
import { Pharmacy } from '../models/pharmacy.model';
import { Product } from '../models/product.model';
import { ProductOffer } from '../models/productOffer.model';
import { User } from '../models/user.model';
import type { HttpError } from '../types/errors';

import {
  createManagerOrderService,
  createOrderManagerCommentService,
  deleteOrderManagerCommentService,
  getOrderByIdService,
  getOrderManagerCommentsService,
  updateOrderDetailsService,
  updateOrderStatusService,
} from './order.service';

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

async function expectHttpStatus(
  action: () => Promise<unknown>,
  expectedStatus: number
): Promise<void> {
  await assert.rejects(action, (error: unknown) => {
    assert.equal((error as HttpError).status, expectedStatus);
    return true;
  });
}

//===================================================================

test(
  'order services keep owner/manager membership explicit and block a foreign pharmacy across read and mutation paths',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    await Order.syncIndexes();

    const suffix = new Types.ObjectId().toHexString().toUpperCase();
    const ownerA = new Types.ObjectId();
    const managerA = new Types.ObjectId();
    const ownerB = new Types.ObjectId();
    const pharmacyA = new Types.ObjectId();
    const pharmacyB = new Types.ObjectId();
    const productId = new Types.ObjectId();
    const offerId = new Types.ObjectId();
    const clientId = new Types.ObjectId();

    await Promise.all([
      Pharmacy.create({
        _id: pharmacyA,
        ownerId: ownerA,
        managerUserIds: [managerA],
        documents: [],
        name: `Tenant Pharmacy A ${suffix.slice(-6)}`,
        status: 'active',
      }),

      Pharmacy.create({
        _id: pharmacyB,
        ownerId: ownerB,
        managerUserIds: [],
        documents: [],
        name: `Tenant Pharmacy B ${suffix.slice(-6)}`,
        status: 'active',
      }),

      Product.create({
        _id: productId,
        name: `Tenant Product ${suffix.slice(-6)}`,
        article: `TP-${suffix.slice(-10)}`,
        category: 'medicine',
        status: 'active',
        inStock: true,
      }),

      User.create({
        _id: clientId,
        name: 'Tenant Test Client',
        email: `tenant-${suffix.toLowerCase()}@example.com`,
        password: 'test-password-hash',
        role: 'client',
        status: 'active',
        phone: `+38050${getPhoneSuffix(suffix)}`,
        isDefaultPharmacyClient: true,
        defaultClientPharmacyId: pharmacyA,
      }),
    ]);

    await ProductOffer.create({
      _id: offerId,
      productId,
      pharmacyId: pharmacyA,
      price: 100,
      totalQuantity: 5,
      availableQuantity: 5,
      reservedQuantity: 0,
    });

    const ownerActor = { id: ownerA.toString(), role: 'pharmacy' as const };

    const managerActor = {
      id: managerA.toString(),
      role: 'pharmacy' as const,
    };

    const foreignActor = { id: ownerB.toString(), role: 'pharmacy' as const };

    try {
      const created = await createManagerOrderService(ownerActor, {
        clientRequestId: 'de84ad81-5eca-4d66-9952-6f68e8d52178',
        clientId: clientId.toString(),
        items: [{ productOfferId: offerId.toString(), quantity: 1 }],
        paymentMethod: 'cash',
        deliveryMethod: 'pickup',
        comment: '',
      });

      const managerRead = await getOrderByIdService(
        managerA.toString(),
        created.order.id,
        'pharmacy'
      );

      assert.equal(managerRead.order.id, created.order.id);

      const managerComments = await getOrderManagerCommentsService(
        managerActor,
        created.order.id,
        { page: 1, perPage: 10 }
      );

      assert.equal(managerComments.total, 0);

      await expectHttpStatus(
        () =>
          getOrderByIdService(ownerB.toString(), created.order.id, 'pharmacy'),
        404
      );

      await expectHttpStatus(
        () =>
          updateOrderDetailsService(foreignActor, created.order.id, {
            paymentMethod: 'cash',
          }),
        403
      );

      await expectHttpStatus(
        () =>
          updateOrderStatusService(foreignActor, created.order.id, {
            status: 'successful',
          }),
        403
      );

      await expectHttpStatus(
        () =>
          getOrderManagerCommentsService(foreignActor, created.order.id, {
            page: 1,
            perPage: 10,
          }),
        403
      );

      await expectHttpStatus(
        () =>
          createOrderManagerCommentService(foreignActor, created.order.id, {
            text: 'Foreign comment attempt',
          }),
        403
      );

      await expectHttpStatus(
        () =>
          deleteOrderManagerCommentService(
            foreignActor,
            created.order.id,
            new Types.ObjectId().toString()
          ),
        403
      );

      await expectHttpStatus(
        () =>
          createManagerOrderService(foreignActor, {
            clientRequestId: '189255d5-b4ef-454e-97dd-5ab26a11aed1',
            clientId: clientId.toString(),
            items: [{ productOfferId: offerId.toString(), quantity: 1 }],
            paymentMethod: 'cash',
            deliveryMethod: 'pickup',
            comment: '',
          }),
        400
      );
    } finally {
      await Promise.all([
        Order.deleteMany({ pharmacyId: { $in: [pharmacyA, pharmacyB] } }),
        ProductOffer.deleteOne({ _id: offerId }),
        Product.deleteOne({ _id: productId }),
        Pharmacy.deleteMany({ _id: { $in: [pharmacyA, pharmacyB] } }),
        User.deleteOne({ _id: clientId }),
      ]);

      await mongoose.disconnect();
    }
  }
);
