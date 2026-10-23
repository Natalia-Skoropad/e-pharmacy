import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import test from 'node:test';
import mongoose, { Types } from 'mongoose';

import { Order } from '../../models/orders/order.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { User } from '../../models/accounts/user.model';

import {
  getOwnedPharmacyDetailService,
  getOwnedPharmacyStatisticsService,
  listOwnedPharmaciesService,
  listOwnedPharmacyOptionsService,
} from './owned-pharmacy-registry-read.service';

//===============================================================

const mongoUri = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===============================================================

const hasStatus = (error: unknown, status: number) =>
  Boolean(
    error &&
    typeof error === 'object' &&
    'status' in error &&
    error.status === status
  );

//===============================================================

test(
  'Stage 14.18.8: scoped list, metrics, filters, manager access and empty state',
  { skip: !mongoUri },

  async () => {
    await mongoose.connect(mongoUri!);

    const suffix = new Types.ObjectId().toHexString();
    const userIds = Array.from({ length: 5 }, () => new Types.ObjectId());
    const pharmacyIds = Array.from({ length: 4 }, () => new Types.ObjectId());
    const [owner, foreignOwner, manager, emptyOwner, client] = userIds;
    const [first, second, managed, foreign] = pharmacyIds;
    const orderId = new Types.ObjectId();

    try {
      await User.insertMany(
        userIds.map((id, index) => ({
          _id: id,
          name: 'Registry Account',
          email: `owned-registry-${index}-${suffix}@example.com`,
          phone: `+380${randomInt(100_000_000, 1_000_000_000)}`,
          password: 'test-hash',
          role: index === 4 ? 'client' : 'pharmacy',
          status: index === 3 ? 'new' : 'active',
        }))
      );

      await Pharmacy.insertMany([
        {
          _id: first,
          ownerId: owner,
          name: 'Test Odesa Pharmacy',
          location: { settlement: 'Odesa', region: 'Odesa Oblast' },
          status: 'active',
          documents: [],
          managerUserIds: [manager],
        },
        {
          _id: second,
          ownerId: owner,
          name: 'Another Registry Pharmacy',
          location: { settlement: 'Kyiv', region: 'Kyiv Oblast' },
          status: 'blocked',
          documents: [],
          managerUserIds: [],
        },
        {
          _id: managed,
          ownerId: foreignOwner,
          name: 'Managed Other Pharmacy',
          status: 'new',
          documents: [],
          managerUserIds: [manager],
        },
        {
          _id: foreign,
          ownerId: foreignOwner,
          name: 'Foreign Secret Pharmacy',
          status: 'active',
          documents: [],
          managerUserIds: [],
        },
      ]);

      await Order.create({
        _id: orderId,
        userId: client,
        pharmacyId: first,
        pharmacySnapshot: { name: 'Test Odesa Pharmacy' },

        items: [
          {
            productId: new Types.ObjectId(),
            productOfferId: new Types.ObjectId(),
            productSnapshot: { name: 'Test Product', article: `OWN-${suffix}` },
            quantity: 1,
            unitPrice: 177,
            totalPrice: 177,
          },
        ],

        totalItems: 1,
        totalPrice: 177,
        currency: '₴',
        paymentMethod: 'cash',
        delivery: { method: 'pickup' },
        status: 'successful',
        statusHistory: [],
        activityHistory: [],
        managerComments: [],
        orderNumber: `OWN-${suffix}`,
        createdByType: 'client',
      });

      const base = {
        page: 1,
        perPage: 20 as const,
        sort: 'created_desc' as const,
      };

      const list = await listOwnedPharmaciesService(String(owner), base);

      assert.equal(list.total, 2);
      assert.equal(list.items.length, 2);

      assert.ok(
        list.items.every((item) =>
          [String(first), String(second)].includes(item.id)
        )
      );

      assert.ok(list.items.every((item) => item.membershipRole === 'owner'));

      assert.equal(
        list.items.find((item) => item.id === String(first))?.successfulRevenue,
        177
      );

      assert.equal(
        list.items.find((item) => item.id === String(first))
          ?.successfulOrdersCount,
        1
      );

      assert.equal(
        list.items.find((item) => item.id === String(second))
          ?.successfulRevenue,
        0
      );

      assert.equal(
        list.items.find((item) => item.id === String(second))
          ?.successfulOrdersCount,
        0
      );

      const byName = await listOwnedPharmaciesService(String(owner), {
        ...base,
        pharmacySearch: 'Odesa',
      });

      assert.equal(byName.total, 1);
      assert.equal(byName.items[0]?.id, String(first));

      const byId = await listOwnedPharmaciesService(String(owner), {
        ...base,
        pharmacySearch: String(second),
      });

      assert.equal(byId.items[0]?.id, String(second));

      const byLocation = await listOwnedPharmaciesService(String(owner), {
        ...base,
        region: 'Odesa Oblast',
        status: 'active',
      });

      assert.equal(byLocation.total, 1);
      assert.equal(byLocation.items[0]?.id, String(first));

      const pageClamped = await listOwnedPharmaciesService(String(owner), {
        ...base,
        page: 100,
      });

      assert.equal(pageClamped.page, 1);
      assert.equal(pageClamped.total, 2);

      const statistics = await getOwnedPharmacyStatisticsService(String(owner));

      assert.equal(statistics.all, 2);
      assert.equal(statistics.active, 1);
      assert.equal(statistics.blocked, 1);

      const managerList = await listOwnedPharmaciesService(
        String(manager),
        base
      );

      assert.equal(managerList.total, 2);

      assert.ok(
        managerList.items.every((item) => item.membershipRole === 'manager')
      );

      assert.equal(
        managerList.items.find((item) => item.id === String(first))
          ?.successfulRevenue,
        undefined
      );

      const options = await listOwnedPharmacyOptionsService(String(owner), {
        limit: 10,
        search: 'Secret',
      });

      assert.equal(options.items.length, 0);

      const detail = await getOwnedPharmacyDetailService(
        String(owner),
        String(first)
      );

      assert.equal(detail.pharmacy.id, String(first));

      assert.ok(
        detail.metrics,
        'The owner must have access to pharmacy metrics'
      );

      assert.equal(detail.metrics.successfulRevenue, 177);

      const managerDetail = await getOwnedPharmacyDetailService(
        String(manager),
        String(first)
      );

      assert.equal(managerDetail.pharmacy.membershipRole, 'manager');
      assert.equal(managerDetail.pharmacy.documents.length, 0);
      assert.equal(managerDetail.pharmacy.bankDetails, undefined);
      assert.equal(managerDetail.metrics, null);

      await assert.rejects(
        getOwnedPharmacyDetailService(String(owner), String(foreign)),
        (error) => hasStatus(error, 403)
      );

      await assert.rejects(
        getOwnedPharmacyDetailService(
          String(owner),
          String(new Types.ObjectId())
        ),

        (error) => hasStatus(error, 404)
      );

      const empty = await listOwnedPharmaciesService(String(emptyOwner), base);

      assert.deepEqual(empty.items, []);
      assert.equal(empty.total, 0);
      assert.equal(empty.totalPages, 0);
      assert.equal(empty.earliestCreatedAt, null);

      assert.equal(
        (await getOwnedPharmacyStatisticsService(String(emptyOwner))).all,
        0
      );

      await User.updateOne(
        { _id: foreignOwner },
        { $set: { status: 'blocked' } }
      );

      assert.equal(
        (await listOwnedPharmaciesService(String(manager), base)).total,
        1
      );

      await assert.rejects(
        getOwnedPharmacyDetailService(String(manager), String(managed)),
        (error) => hasStatus(error, 403)
      );

      await User.updateOne({ _id: owner }, { $set: { status: 'blocked' } });

      await assert.rejects(
        listOwnedPharmaciesService(String(owner), base),
        (error) => hasStatus(error, 403)
      );
    } finally {
      await Order.deleteMany({ _id: orderId });
      await Pharmacy.deleteMany({ _id: { $in: pharmacyIds } });
      await User.deleteMany({ _id: { $in: userIds } });
      await mongoose.disconnect();
    }
  }
);
