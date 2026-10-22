import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { seedIntegrationPharmacyActors } from '../__tests__/fixtures/pharmacy-integration-actors.helper';

import { USER_ROLES } from '../../constants/auth';
import { Order } from '../../models/order.model';
import { Pharmacy } from '../../models/pharmacy.model';
import { PharmacyNote } from '../../models/pharmacyNote.model';
import { Product } from '../../models/product.model';
import { User } from '../../models/user.model';
import type { HttpError } from '../../types/errors';

import { getTestProductCategoryId } from '../catalog/__tests__/product-category-test.helper';

import {
  getClientByIdService,
  getClientPurchasedProductsService,
  getClientsService,
} from './client.service';

import { getOrdersService } from '../order.service';

import {
  createPharmacyNoteService,
  deletePharmacyNoteService,
  getPharmacyNotesService,
} from '../pharmacies/pharmacy-note.service';

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
  categoryId,
  orderNumber,
}: Readonly<{
  pharmacyId: Types.ObjectId;
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  categoryId: Types.ObjectId;
  orderNumber: string;
}>) {
  const createdAt = new Date('2026-09-01T10:00:00.000Z');

  return Order.create({
    pharmacyId,
    userId,
    pharmacySnapshot: { name: 'Tenant Isolation Pharmacy' },

    items: [
      {
        productId,
        productOfferId: new Types.ObjectId(),

        productSnapshot: {
          name: 'Tenant Isolation Product',
          article: `TENANT-${orderNumber}`,
          categoryId,
          categoryNameSnapshot: 'Medicine',
          categorySlugSnapshot: 'medicine',
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

function isNotFound(error: unknown): boolean {
  return (error as HttpError).status === 404;
}

//===================================================================

test(
  'client resources are isolated to the authenticated owner or manager pharmacy',
  { skip: shouldSkip },

  async () => {
    await mongoose.connect(getTestMongoUri());

    const medicineCategoryId = await getTestProductCategoryId();

    const ownerA = new Types.ObjectId();
    const managerA = new Types.ObjectId();
    const ownerB = new Types.ObjectId();
    const managerB = new Types.ObjectId();
    const pharmacyA = new Types.ObjectId();
    const pharmacyB = new Types.ObjectId();
    const clientA = new Types.ObjectId();
    const clientB = new Types.ObjectId();
    const productA = new Types.ObjectId();
    const productB = new Types.ObjectId();
    const suffix = new Types.ObjectId().toHexString().slice(-8);

    await seedIntegrationPharmacyActors([ownerA, managerA, ownerB, managerB]);

    await Promise.all([
      Pharmacy.create({
        _id: pharmacyA,
        ownerId: ownerA,
        managerUserIds: [managerA],
        documents: [],
        name: 'Tenant Pharmacy A',
        status: 'active',
      }),

      Pharmacy.create({
        _id: pharmacyB,
        ownerId: ownerB,
        managerUserIds: [managerB],
        documents: [],
        name: 'Tenant Pharmacy B',
        status: 'active',
      }),

      User.create({
        _id: clientA,
        name: 'Walk-in client',
        email: `tenant-a-${suffix}@example.com`,
        password: 'hashed-password',
        phone: testPhone('50', suffix),
        role: 'client',
        status: 'active',
      }),

      User.create({
        _id: clientB,
        name: 'Tenant Client B',
        email: `tenant-b-${suffix}@example.com`,
        password: 'hashed-password',
        phone: testPhone('67', suffix.split('').reverse().join('')),
        role: 'client',
        status: 'active',
      }),

      Product.create({
        _id: productA,
        name: 'Tenant Product A',
        article: `TENANT-A-${suffix}`,
        categoryId: medicineCategoryId,
        status: 'active',
        inStock: true,
      }),

      Product.create({
        _id: productB,
        name: 'Tenant Product B',
        article: `TENANT-B-${suffix}`,
        categoryId: medicineCategoryId,
        status: 'active',
        inStock: true,
      }),
    ]);

    await Promise.all([
      createSuccessfulOrder({
        pharmacyId: pharmacyA,
        userId: clientA,
        productId: productA,
        categoryId: medicineCategoryId,
        orderNumber: `TENANT-A-${suffix}`,
      }),

      createSuccessfulOrder({
        pharmacyId: pharmacyB,
        userId: clientB,
        productId: productB,
        categoryId: medicineCategoryId,
        orderNumber: `TENANT-B-${suffix}`,
      }),
    ]);

    try {
      // Stage 14.18.6: only Owners have the clients/orders capabilities.
      const clients = await getClientsService(ownerA.toString(), {
        page: 1,
        perPage: 20,
      });

      assert.deepEqual(
        clients.items.map((client) => client.id),
        [clientA.toString()]
      );

      assert.equal(clients.items[0]?.isDefault, false);

      const details = await getClientByIdService(
        ownerA.toString(),
        clientA.toString()
      );

      assert.equal(details.client.id, clientA.toString());

      const products = await getClientPurchasedProductsService(
        ownerA.toString(),
        clientA.toString(),
        { page: 1, perPage: 20 }
      );

      assert.equal(products.total, 1);
      assert.equal(products.items[0]?.productId, productA.toString());

      const orders = await getOrdersService(
        ownerA.toString(),
        { page: 1, perPage: 20, clientId: clientA.toString() },
        USER_ROLES.PHARMACY
      );

      assert.equal(orders.total, 1);
      assert.equal(orders.items[0]?.clientId, clientA.toString());

      await assert.rejects(
        getClientByIdService(ownerA.toString(), clientB.toString()),
        isNotFound
      );

      await assert.rejects(
        getClientPurchasedProductsService(
          ownerA.toString(),
          clientB.toString(),
          { page: 1, perPage: 20 }
        ),

        isNotFound
      );

      const foreignOrders = await getOrdersService(
        ownerA.toString(),
        { page: 1, perPage: 20, clientId: clientB.toString() },
        USER_ROLES.PHARMACY
      );

      assert.equal(foreignOrders.total, 0);
      assert.deepEqual(foreignOrders.items, []);

      // Legacy Managers retain only profile read and pharmacy-internal notes.
      // They cannot access client identities, purchases or orders.
      for (const action of [
        () => getClientsService(managerA.toString(), { page: 1, perPage: 20 }),
        () => getClientByIdService(managerA.toString(), clientA.toString()),

        () =>
          getClientPurchasedProductsService(
            managerA.toString(),
            clientA.toString(),
            { page: 1, perPage: 20 }
          ),

        () =>
          getOrdersService(
            managerA.toString(),
            { page: 1, perPage: 20, clientId: clientA.toString() },
            USER_ROLES.PHARMACY
          ),
      ]) {
        await assert.rejects(
          action(),
          (error: unknown) => (error as HttpError).status === 403
        );
      }

      // Shared internal notes are the limited Manager capability that remains.
      for (const actorId of [ownerA, managerA]) {
        const actor = { id: actorId.toString(), role: USER_ROLES.PHARMACY };

        const ownNote = await createPharmacyNoteService(
          actor,
          'client',
          clientA.toString(),

          {
            text: `Own note ${actorId.toString()}`,
            clientRequestId: randomUUID(),
          }
        );

        const notes = await getPharmacyNotesService(
          actor,
          'client',
          clientA.toString(),
          1,
          10
        );

        assert.ok(notes.items.some((note) => note.id === ownNote.note.id));

        await deletePharmacyNoteService(
          actor,
          'client',
          clientA.toString(),
          ownNote.note.id
        );

        await assert.rejects(
          getPharmacyNotesService(actor, 'client', clientB.toString(), 1, 10),
          isNotFound
        );

        await assert.rejects(
          createPharmacyNoteService(actor, 'client', clientB.toString(), {
            text: 'Foreign note',
            clientRequestId: randomUUID(),
          }),

          isNotFound
        );
      }

      const foreignNote = await createPharmacyNoteService(
        { id: ownerB.toString(), role: USER_ROLES.PHARMACY },
        'client',
        clientB.toString(),
        { text: 'Foreign pharmacy note', clientRequestId: randomUUID() }
      );

      for (const actorId of [ownerA, managerA]) {
        await assert.rejects(
          deletePharmacyNoteService(
            { id: actorId.toString(), role: USER_ROLES.PHARMACY },
            'client',
            clientB.toString(),
            foreignNote.note.id
          ),

          isNotFound
        );
      }
    } finally {
      await Promise.all([
        PharmacyNote.deleteMany({
          pharmacyId: { $in: [pharmacyA, pharmacyB] },
        }),

        Order.deleteMany({ pharmacyId: { $in: [pharmacyA, pharmacyB] } }),
        Product.deleteMany({ _id: { $in: [productA, productB] } }),

        User.deleteMany({
          _id: { $in: [ownerA, managerA, ownerB, managerB, clientA, clientB] },
        }),

        Pharmacy.deleteMany({ _id: { $in: [pharmacyA, pharmacyB] } }),
      ]);

      await mongoose.disconnect();
    }
  }
);
