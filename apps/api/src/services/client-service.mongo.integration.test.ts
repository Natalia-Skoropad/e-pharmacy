import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { Order } from '../models/order.model';
import { Pharmacy } from '../models/pharmacy.model';
import { Product } from '../models/product.model';
import { User } from '../models/user.model';

import {
  getClientPurchasedProductsService,
  getClientsService,
} from './client.service';

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

function testPhone(prefix: string, suffix: string): string {
  const digits = suffix
    .replace(/[^0-9]/g, '')
    .padEnd(7, '1')
    .slice(0, 7);
  return `+380${prefix}${digits}`;
}

//===================================================================

async function createSuccessfulOrder({
  pharmacyId,
  userId,
  productId,
  createdAt,
  totalPrice,
  quantity = 1,
  orderNumber,
  snapshot,
}: Readonly<{
  pharmacyId: Types.ObjectId;
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  createdAt: Date;
  totalPrice: number;
  quantity?: number;
  orderNumber: string;
  snapshot: Readonly<{
    name: string;
    article: string;
    category: 'medicine' | 'other';
    imageUrl?: string;
  }>;
}>) {
  const productOfferId = new Types.ObjectId();

  return Order.create({
    pharmacyId,
    userId,
    pharmacySnapshot: { name: 'Client Aggregate Test Pharmacy' },
    items: [
      {
        productId,
        productOfferId,
        productSnapshot: snapshot,
        quantity,
        unitPrice: totalPrice / quantity,
        totalPrice,
      },
    ],
    totalItems: quantity,
    totalPrice,
    currency: '₴',
    paymentMethod: 'cash',
    delivery: { method: 'pickup' },
    status: 'successful',
    statusHistory: [],
    activityHistory: [],
    managerComments: [],
    orderNumber,
    createdByType: 'client',
    createdAt,
    updatedAt: createdAt,
  });
}

//===================================================================

test(
  'first-order filters are applied after canonical client metrics are derived',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const ownerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();
    const januaryClientId = new Types.ObjectId();
    const septemberClientId = new Types.ObjectId();
    const productId = new Types.ObjectId();
    const suffix = new Types.ObjectId().toHexString().slice(-8);

    await Pharmacy.create({
      _id: pharmacyId,
      ownerId,
      managerUserIds: [],
      documents: [],
      name: 'Client Aggregate Test Pharmacy',
      status: 'active',
    });

    await Promise.all([
      User.create({
        _id: januaryClientId,
        name: 'January Client',
        email: `client-january-${suffix}@example.com`,
        password: 'hashed-password',
        phone: testPhone('50', suffix),
        role: 'client',
        status: 'active',
      }),

      User.create({
        _id: septemberClientId,
        name: 'September Client',
        email: `client-september-${suffix}@example.com`,
        password: 'hashed-password',
        phone: testPhone('67', suffix.split('').reverse().join('')),
        role: 'client',
        status: 'active',
      }),
    ]);

    const snapshot = {
      name: 'Historical Medicine',
      article: `HIST-${suffix.toUpperCase()}`,
      category: 'medicine' as const,
    };

    await Promise.all([
      createSuccessfulOrder({
        pharmacyId,
        userId: januaryClientId,
        productId,
        createdAt: new Date('2026-01-10T10:00:00.000Z'),
        totalPrice: 100,
        orderNumber: `JAN-1-${suffix}`,
        snapshot,
      }),

      createSuccessfulOrder({
        pharmacyId,
        userId: januaryClientId,
        productId,
        createdAt: new Date('2026-09-10T10:00:00.000Z'),
        totalPrice: 200,
        orderNumber: `JAN-2-${suffix}`,
        snapshot,
      }),

      createSuccessfulOrder({
        pharmacyId,
        userId: septemberClientId,
        productId,
        createdAt: new Date('2026-09-05T10:00:00.000Z'),
        totalPrice: 300,
        orderNumber: `SEP-1-${suffix}`,
        snapshot,
      }),

      createSuccessfulOrder({
        pharmacyId,
        userId: septemberClientId,
        productId,
        createdAt: new Date('2026-10-05T10:00:00.000Z'),
        totalPrice: 400,
        orderNumber: `SEP-2-${suffix}`,
        snapshot,
      }),
    ]);

    try {
      const filtered = await getClientsService(ownerId.toString(), {
        page: 1,
        perPage: 20,
        firstOrderFrom: '2026-09-01',
        successfulOrders: 'repeat',
      });

      assert.equal(filtered.total, 1);
      assert.equal(filtered.items[0]?.id, septemberClientId.toString());
      assert.equal(filtered.items[0]?.firstOrderAt, '2026-09-05T10:00:00.000Z');
      assert.equal(filtered.items[0]?.successfulOrdersCount, 2);
      assert.equal(filtered.items[0]?.successfulOrdersAmount, 700);

      const unfiltered = await getClientsService(ownerId.toString(), {
        page: 1,
        perPage: 20,
      });

      const januaryClient = unfiltered.items.find(
        (client) => client.id === januaryClientId.toString()
      );

      assert.ok(januaryClient);
      assert.equal(januaryClient.firstOrderAt, '2026-01-10T10:00:00.000Z');
      assert.equal(januaryClient.successfulOrdersCount, 2);
      assert.equal(januaryClient.successfulOrdersAmount, 300);
      assert.equal(unfiltered.statistics.repeat, 2);
      assert.equal(unfiltered.earliestCreatedAt, '2026-01-10');
    } finally {
      await Promise.all([
        Order.deleteMany({ pharmacyId }),
        User.deleteMany({ _id: { $in: [januaryClientId, septemberClientId] } }),
        Pharmacy.deleteOne({ _id: pharmacyId }),
      ]);

      await mongoose.disconnect();
    }
  }
);

//===================================================================

test(
  'purchased-product history stays on the order snapshot while current metadata controls availability',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const ownerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();
    const clientId = new Types.ObjectId();
    const productId = new Types.ObjectId();
    const suffix = new Types.ObjectId().toHexString().slice(-8).toUpperCase();

    await Promise.all([
      Pharmacy.create({
        _id: pharmacyId,
        ownerId,
        managerUserIds: [],
        documents: [],
        name: 'Historical Product Test Pharmacy',
        status: 'active',
      }),

      User.create({
        _id: clientId,
        name: 'Historical Client',
        email: `history-${suffix.toLowerCase()}@example.com`,
        password: 'hashed-password',
        phone: testPhone('93', suffix),
        role: 'client',
        status: 'active',
      }),

      Product.create({
        _id: productId,
        name: 'Aspirin Forte',
        article: `NEW-${suffix}`,
        category: 'other',
        imageUrl: 'https://example.com/current.jpg',
        status: 'active',
        inStock: true,
      }),
    ]);

    await createSuccessfulOrder({
      pharmacyId,
      userId: clientId,
      productId,
      createdAt: new Date('2026-08-12T10:00:00.000Z'),
      totalPrice: 250,
      orderNumber: `HISTORY-${suffix}`,

      snapshot: {
        name: 'Aspirin 100',
        article: `OLD-${suffix}`,
        category: 'medicine',
        imageUrl: 'https://example.com/historical.jpg',
      },
    });

    try {
      const current = await getClientPurchasedProductsService(
        ownerId.toString(),
        clientId.toString(),
        { page: 1, perPage: 20 }
      );

      const currentItem = current.items[0];
      assert.ok(currentItem);
      assert.equal(currentItem.name, 'Aspirin 100');
      assert.equal(currentItem.article, `OLD-${suffix}`);
      assert.equal(currentItem.category, 'medicine');
      assert.equal(currentItem.photoUrl, 'https://example.com/historical.jpg');
      assert.equal(currentItem.totalAmount, 250);
      assert.equal(currentItem.currentProductExists, true);
      assert.equal(currentItem.currentStatus, 'active');

      await Product.updateOne(
        { _id: productId },
        { $set: { status: 'blocked' } }
      );

      const blocked = await getClientPurchasedProductsService(
        ownerId.toString(),
        clientId.toString(),
        { page: 1, perPage: 20 }
      );

      const blockedItem = blocked.items[0];
      assert.ok(blockedItem);
      assert.equal(blockedItem.name, 'Aspirin 100');
      assert.equal(blockedItem.article, `OLD-${suffix}`);
      assert.equal(blockedItem.category, 'medicine');
      assert.equal(blockedItem.photoUrl, 'https://example.com/historical.jpg');
      assert.equal(blockedItem.currentProductExists, true);
      assert.equal(blockedItem.currentStatus, 'blocked');

      await Product.deleteOne({ _id: productId });

      const deleted = await getClientPurchasedProductsService(
        ownerId.toString(),
        clientId.toString(),
        { page: 1, perPage: 20 }
      );

      const deletedItem = deleted.items[0];
      assert.ok(deletedItem);
      assert.equal(deletedItem.name, 'Aspirin 100');
      assert.equal(deletedItem.article, `OLD-${suffix}`);
      assert.equal(deletedItem.category, 'medicine');
      assert.equal(deletedItem.photoUrl, 'https://example.com/historical.jpg');
      assert.equal(deletedItem.currentProductExists, false);
      assert.equal(deletedItem.currentStatus, null);
    } finally {
      await Promise.all([
        Order.deleteMany({ pharmacyId }),
        Product.deleteOne({ _id: productId }),
        User.deleteOne({ _id: clientId }),
        Pharmacy.deleteOne({ _id: pharmacyId }),
      ]);

      await mongoose.disconnect();
    }
  }
);

//===================================================================

test(
  'purchased products aggregate repeated product purchases across successful orders',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const ownerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();
    const clientId = new Types.ObjectId();
    const productId = new Types.ObjectId();
    const suffix = new Types.ObjectId().toHexString().slice(-8).toUpperCase();

    await Promise.all([
      Pharmacy.create({
        _id: pharmacyId,
        ownerId,
        managerUserIds: [],
        documents: [],
        name: 'Purchased Product Aggregate Pharmacy',
        status: 'active',
      }),

      User.create({
        _id: clientId,
        name: 'Aggregate Client',
        email: `aggregate-${suffix.toLowerCase()}@example.com`,
        password: 'hashed-password',
        phone: testPhone('68', suffix),
        role: 'client',
        status: 'active',
      }),

      Product.create({
        _id: productId,
        name: 'Current Aggregate Product',
        article: `EPH-${suffix}`,
        category: 'medicine',
        status: 'active',
        inStock: true,
      }),
    ]);

    await Promise.all([
      createSuccessfulOrder({
        pharmacyId,
        userId: clientId,
        productId,
        createdAt: new Date('2026-09-15T10:00:00.000Z'),
        totalPrice: 500,
        quantity: 5,
        orderNumber: `AGG-1-${suffix}`,
        snapshot: {
          name: 'Historical Aggregate Product',
          article: `EPH-${suffix}`,
          category: 'medicine',
        },
      }),

      createSuccessfulOrder({
        pharmacyId,
        userId: clientId,
        productId,
        createdAt: new Date('2026-09-16T10:00:00.000Z'),
        totalPrice: 770,
        quantity: 7,
        orderNumber: `AGG-2-${suffix}`,
        snapshot: {
          name: 'Historical Aggregate Product',
          article: `EPH-${suffix}`,
          category: 'medicine',
        },
      }),
    ]);

    try {
      const response = await getClientPurchasedProductsService(
        ownerId.toString(),
        clientId.toString(),
        { page: 1, perPage: 20 }
      );

      assert.equal(response.total, 1);
      assert.equal(response.items.length, 1);

      const item = response.items[0];
      assert.ok(item);
      assert.equal(item.productId, productId.toString());
      assert.equal(item.firstOrderDate, '2026-09-15T10:00:00.000Z');
      assert.equal(item.ordersCount, 2);
      assert.equal(item.quantity, 12);
      assert.equal(item.totalAmount, 1270);
      assert.equal(response.earliestCreatedAt, '2026-09-15');
    } finally {
      await Promise.all([
        Order.deleteMany({ pharmacyId }),
        Product.deleteOne({ _id: productId }),
        User.deleteOne({ _id: clientId }),
        Pharmacy.deleteOne({ _id: pharmacyId }),
      ]);

      await mongoose.disconnect();
    }
  }
);
