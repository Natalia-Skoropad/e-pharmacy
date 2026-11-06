import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { Order } from '../../models/orders/order.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { User } from '../../models/accounts/user.model';

import type { HttpError } from '../../types/http/errors';
import { clientsQuerySchema } from '../../schemas/clients/client.schema';
import { seedIntegrationPharmacyActors } from '../__tests__/fixtures/pharmacy-integration-actors.helper';
import { getTestProductCategoryId } from '../catalog/__tests__/product-category-test.helper';

import {
  getClientsService,
  getClientByIdService,
} from './client-registry.service';

import { getClientPharmaciesService } from './client-pharmacies.service';

//===================================================================

const uri = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===================================================================

function phoneFrom(id: Types.ObjectId): string {
  return `+380${(BigInt(`0x${id.toHexString()}`) % 1_000_000_000n).toString().padStart(9, '0')}`;
}

//===================================================================

test(
  '14.18.16: owner Clients registry isolates two pharmacies, preserves default clients and rejects foreign filters',
  { skip: !uri },

  async () => {
    await mongoose.connect(uri!);

    const categoryId = await getTestProductCategoryId();
    const ownerId = new Types.ObjectId();
    const foreignOwnerId = new Types.ObjectId();
    const a = new Types.ObjectId();
    const b = new Types.ObjectId();
    const foreign = new Types.ObjectId();
    const sharedClient = new Types.ObjectId();
    const foreignClient = new Types.ObjectId();
    const defaultA = new Types.ObjectId();
    const defaultB = new Types.ObjectId();
    const ids = [a, b, foreign];

    const users = [
      ownerId,
      foreignOwnerId,
      sharedClient,
      foreignClient,
      defaultA,
      defaultB,
    ];

    const suffix = ownerId.toHexString().slice(-8);

    try {
      await seedIntegrationPharmacyActors([ownerId, foreignOwnerId]);

      await Pharmacy.insertMany([
        {
          _id: a,
          ownerId,
          name: `Clients Alpha ${suffix}`,
          status: 'active',
          documents: [],
        },
        {
          _id: b,
          ownerId,
          name: `Clients Beta ${suffix}`,
          status: 'active',
          documents: [],
        },
        {
          _id: foreign,
          ownerId: foreignOwnerId,
          name: `Clients Foreign ${suffix}`,
          status: 'active',
          documents: [],
        },
      ]);

      await User.insertMany([
        {
          _id: sharedClient,
          name: 'Common Client',
          email: `common-${suffix}@example.com`,
          password: 'test-hash',
          phone: phoneFrom(sharedClient),
          address: 'Harbor Street 23',
          role: 'client',
          status: 'active',
        },
        {
          _id: foreignClient,
          name: 'Foreign Client',
          email: `foreign-${suffix}@example.com`,
          password: 'test-hash',
          phone: phoneFrom(foreignClient),
          role: 'client',
          status: 'active',
        },
        {
          _id: defaultA,
          name: 'Walk-in client',
          email: `walkina-${suffix}@example.com`,
          password: 'test-hash',
          phone: phoneFrom(defaultA),
          role: 'client',
          status: 'active',
          isDefaultPharmacyClient: true,
          defaultClientPharmacyId: a,
        },
        {
          _id: defaultB,
          name: 'Walk-in client',
          email: `walkinb-${suffix}@example.com`,
          password: 'test-hash',
          phone: phoneFrom(defaultB),
          role: 'client',
          status: 'active',
          isDefaultPharmacyClient: true,
          defaultClientPharmacyId: b,
        },
      ]);

      const placeOrder = (
        pharmacyId: Types.ObjectId,
        userId: Types.ObjectId,
        price: number,
        tag: string
      ) => ({
        pharmacyId,
        userId,
        pharmacySnapshot: { name: 'Pharmacy' },

        items: [
          {
            productId: new Types.ObjectId(),
            productOfferId: new Types.ObjectId(),

            productSnapshot: {
              name: 'Historical product',
              article: `HIST-${suffix}-${tag}`,
              categoryId,
              categoryNameSnapshot: 'Medicine',
              categorySlugSnapshot: 'medicine',
            },

            quantity: 1,
            unitPrice: price,
            totalPrice: price,
          },
        ],

        totalItems: 1,
        totalPrice: price,
        currency: '₴',
        paymentMethod: 'cash',
        delivery: { method: 'pickup' },
        status: 'successful',
        statusHistory: [],
        activityHistory: [],
        managerComments: [],
        orderNumber: `CL-${suffix}-${tag}`,
        createdByType: 'client',
      });

      await Order.insertMany([
        placeOrder(a, sharedClient, 100, 'A1'),
        placeOrder(a, sharedClient, 200, 'A2'),
        placeOrder(b, sharedClient, 400, 'B1'),
        placeOrder(foreign, foreignClient, 900, 'F1'),
      ]);

      const query = clientsQuerySchema.parse({
        page: 1,
        perPage: 20,
        scope: 'owner',
      });

      const result = await getClientsService(ownerId.toString(), query);

      assert.equal(result.total, 3); // one shared person + two distinct walk-in accounts
      assert.equal(result.statistics.total, 3);
      assert.equal(result.statistics.repeat, 1);

      const shared = result.items.filter(
        (row) => row.id === sharedClient.toString()
      );

      assert.equal(shared.length, 1);
      assert.equal(shared[0].successfulOrdersCount, 3);
      assert.equal(shared[0].successfulOrdersAmount, 700);

      const clientDetail = await getClientByIdService(
        ownerId.toString(),
        sharedClient.toString(),
        true
      );

      assert.equal(clientDetail.client.successfulOrdersAmount, 700);

      const linkedPharmacies = await getClientPharmaciesService(
        ownerId.toString(),
        sharedClient.toString()
      );

      assert.equal(linkedPharmacies.items.length, 2);

      assert.deepEqual(
        new Set(linkedPharmacies.items.map((row) => row.pharmacyId)),
        new Set([a.toString(), b.toString()])
      );

      assert.equal(
        linkedPharmacies.items.find((row) => row.pharmacyId === a.toString())
          ?.successfulOrdersAmount,
        300
      );

      assert.equal(
        linkedPharmacies.items.find((row) => row.pharmacyId === b.toString())
          ?.successfulOrdersAmount,
        400
      );

      const walkInPharmacies = await getClientPharmaciesService(
        ownerId.toString(),
        defaultA.toString()
      );

      assert.equal(walkInPharmacies.items.length, 1);
      assert.equal(walkInPharmacies.items[0]?.pharmacyId, a.toString());
      assert.equal(walkInPharmacies.items[0]?.successfulOrdersCount, 0);
      assert.equal(walkInPharmacies.items[0]?.successfulOrdersAmount, 0);
      assert.equal(walkInPharmacies.items[0]?.firstOrderAt, null);

      assert.ok(
        result.items.some(
          (row) => row.isDefault && row.pharmacyId === a.toString()
        )
      );

      assert.ok(
        result.items.some(
          (row) => row.isDefault && row.pharmacyId === b.toString()
        )
      );

      assert.ok(
        result.items.every(
          (row) => row.pharmacyName && row.pharmacyId !== foreign.toString()
        )
      );

      assert.ok(
        !result.items.some((row) => row.id === foreignClient.toString())
      );

      // One remote searchable selector must match all five fields without
      // exposing another owner's clients or combining pharmacy-specific rows.
      for (const search of [
        sharedClient.toString().slice(-12),
        'Common Client',
        `common-${suffix}@example.com`,
        phoneFrom(sharedClient),
        'Harbor Street 23',
      ]) {
        const matches = await getClientsService(ownerId.toString(), {
          ...query,
          search,
        });

        assert.equal(matches.total, 1, `Client search field: ${search}`);

        assert.ok(
          matches.items.every((row) => row.id === sharedClient.toString())
        );
      }

      const foreignSearch = await getClientsService(ownerId.toString(), {
        ...query,
        search: 'Foreign Client',
      });

      assert.equal(foreignSearch.total, 0);

      const filtered = await getClientsService(ownerId.toString(), {
        ...query,
        pharmacyId: b.toString(),
      });

      assert.equal(filtered.total, 2);
      assert.ok(filtered.items.every((row) => row.pharmacyId === b.toString()));

      await assert.rejects(
        getClientsService(ownerId.toString(), {
          ...query,
          pharmacyId: foreign.toString(),
        }),

        (error: unknown) => (error as HttpError).status === 403
      );

      await assert.rejects(
        getClientsService(sharedClient.toString(), query),
        (error: unknown) => (error as HttpError).status === 403
      );

      const noRows = await getClientsService(foreignOwnerId.toString(), query);

      assert.equal(noRows.total, 1);
    } finally {
      await Order.deleteMany({ pharmacyId: { $in: ids } });
      await User.deleteMany({ _id: { $in: users } });
      await Pharmacy.deleteMany({ _id: { $in: ids } });
      await mongoose.disconnect();
    }
  }
);

//===================================================================

test(
  '14.18.82: walk-in clients enable Client added even without orders',
  { skip: !uri },

  async () => {
    await mongoose.connect(uri!);

    const ownerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();
    const defaultClientId = new Types.ObjectId();
    const suffix = ownerId.toHexString().slice(-8);

    try {
      await seedIntegrationPharmacyActors([ownerId]);

      await Pharmacy.create({
        _id: pharmacyId,
        ownerId,
        name: `Client Date ${suffix}`,
        status: 'active',
        documents: [],
      });

      await User.create({
        _id: defaultClientId,
        name: 'Walk-in client',
        email: `walkindate-${suffix}@example.com`,
        password: 'test-hash',
        phone: phoneFrom(defaultClientId),
        role: 'client',
        status: 'active',
        isDefaultPharmacyClient: true,
        defaultClientPharmacyId: pharmacyId,
      });

      const query = clientsQuerySchema.parse({
        page: 1,
        perPage: 20,
        scope: 'owner',
      });

      const result = await getClientsService(ownerId.toString(), query);

      assert.equal(result.total, 1);

      assert.ok(
        result.earliestCreatedAt,
        'Date filter must not be disabled for walk-in clients'
      );

      assert.equal(
        result.earliestCreatedAt,
        result.items[0]?.firstOrderAt.slice(0, 10)
      );

      const filtered = await getClientsService(ownerId.toString(), {
        ...query,
        firstOrderFrom: result.earliestCreatedAt!,
        firstOrderTo: result.earliestCreatedAt!,
      });

      assert.equal(filtered.total, 1);
    } finally {
      await User.deleteOne({ _id: defaultClientId });
      await Pharmacy.deleteOne({ _id: pharmacyId });
      await User.deleteOne({ _id: ownerId });
      await mongoose.disconnect();
    }
  }
);
