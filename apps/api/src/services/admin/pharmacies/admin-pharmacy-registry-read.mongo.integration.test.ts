import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose, { Types } from 'mongoose';

import { Order } from '../../../models/order.model';
import { Pharmacy } from '../../../models/pharmacy.model';
import { User } from '../../../models/user.model';

import {
  getAdminPharmacyStatisticsService,
  listAdminPharmaciesService,
  listAdminPharmacyOptionsService,
} from './admin-pharmacy-registry-read.service';

import { listAdminPharmacyOwnerPharmaciesService } from '../owners/admin-pharmacy-owner-pharmacies.service';

//===============================================================

const mongoUri = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===============================================================

test(
  'Stage 14.4: registry filters and metrics match linked-owner pharmacies in MongoDB',
  { skip: !mongoUri },

  async () => {
    await mongoose.connect(mongoUri!);

    const unique = new Types.ObjectId().toHexString();
    const pharmacyId = new Types.ObjectId();
    const ownerId = new Types.ObjectId();
    const clientId = new Types.ObjectId();
    const ownerEmail = `registry-${unique}@example.com`;

    try {
      await User.create([
        {
          _id: ownerId,
          name: 'Registry owner',
          email: ownerEmail,
          phone: `+38050${unique.replace(/[^0-9]/g, '4').slice(0, 7)}`,
          password: 'registry-test-only',
          role: 'pharmacy',
          status: 'active',
        },
        {
          _id: clientId,
          name: 'Registry client',
          email: `registry-client-${unique}@example.com`,
          phone: `+38067${unique.replace(/[^0-9]/g, '6').slice(0, 7)}`,
          password: 'registry-test-only',
          role: 'client',
          status: 'active',
        },
      ]);

      await Pharmacy.create({
        _id: pharmacyId,
        ownerId,
        status: 'active',
        name: 'Registry test pharmacy',
        location: { settlement: 'Odesa', region: 'Odesa Oblast' },
        rating: 3.95,
        reviewsCount: 4,
        documents: [],
      });

      const productId = new Types.ObjectId();

      await Order.create({
        userId: clientId,
        pharmacyId,
        pharmacySnapshot: { name: 'Registry test pharmacy' },

        items: [
          {
            productId,
            productOfferId: new Types.ObjectId(),

            productSnapshot: {
              name: 'Registry product',
              article: `REG-${unique}`,
            },

            quantity: 1,
            unitPrice: 123,
            totalPrice: 123,
          },
        ],

        totalItems: 1,
        totalPrice: 123,
        currency: '₴',
        paymentMethod: 'cash',
        delivery: { method: 'pickup' },
        status: 'successful',
        statusHistory: [],
        activityHistory: [],
        managerComments: [],
        orderNumber: `REG-${unique}`,
        createdByType: 'client',
      });

      const filter = {
        pharmacyId: String(pharmacyId),
        ownerSearch: ownerEmail,
        pharmacySearch: 'Odesa Oblast',
        rating: '3-3.9' as const,
        status: 'active' as const,
        sort: 'created_desc' as const,
        page: 1,
        perPage: 20 as const,
      };

      const registry = await listAdminPharmaciesService(filter);

      assert.equal(registry.total, 1);
      assert.equal(registry.items.length, 1);
      assert.equal(registry.items[0]?.owner?.id, String(ownerId));
      assert.equal(registry.items[0]?.successfulOrdersCount, 1);
      assert.equal(registry.items[0]?.successfulRevenue, 123);
      assert.equal(registry.items[0]?.activeClientsCount, 1);
      assert.equal(registry.items[0]?.reviewsCount, 4);

      const linked = await listAdminPharmacyOwnerPharmaciesService(
        String(ownerId),
        {
          page: 1,
          perPage: 20,
          search: 'Registry test pharmacy',
        }
      );

      assert.equal(
        linked.items[0]?.activeClientsCount,
        registry.items[0]?.activeClientsCount
      );

      assert.equal(
        linked.items[0]?.successfulOrdersCount,
        registry.items[0]?.successfulOrdersCount
      );

      assert.equal(
        linked.items[0]?.successfulRevenue,
        registry.items[0]?.successfulRevenue
      );

      assert.equal(
        (await listAdminPharmaciesService({ ...filter, rating: '4-5' })).total,
        0
      );

      assert.equal(
        (
          await listAdminPharmaciesService({
            ...filter,
            ownerSearch: 'not-the-owner',
          })
        ).total,
        0
      );

      assert.equal(
        (await listAdminPharmaciesService({ ...filter, page: 99 })).page,
        1
      );

      assert.equal(
        (
          await listAdminPharmacyOptionsService({
            search: String(pharmacyId),
            limit: 10,
          })
        ).items[0]?.id,

        String(pharmacyId)
      );

      const counters = await getAdminPharmacyStatisticsService();

      assert.equal(
        counters.all,

        counters.new +
          counters.onVerification +
          counters.active +
          counters.onModeration +
          counters.blocked
      );

      assert.ok(counters.active >= 1);
    } finally {
      await Order.deleteMany({ pharmacyId });
      await Pharmacy.deleteMany({ _id: pharmacyId });
      await User.deleteMany({ _id: { $in: [ownerId, clientId] } });
      await mongoose.disconnect();
    }
  }
);
