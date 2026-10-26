import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { User } from '../../models/accounts/user.model';
import type { HttpError } from '../../types/http/errors';

import {
  canPharmacyMembershipUseCapability,
  getPharmacyMembership,
  requirePharmacyCapability,
  resolveSelectedPharmacyMembership,
} from './pharmacy-membership.service';

//===============================================================

const TEST_MONGODB_URI = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===============================================================

test(
  'tenant isolation: two owned pharmacies, foreign pharmacy, employee grants and blocked states',
  { skip: !TEST_MONGODB_URI },

  async () => {
    await mongoose.connect(TEST_MONGODB_URI!);

    const suffix = new Types.ObjectId().toHexString();

    const userIds = [
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
    ];

    const pharmacyIds = [
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
    ];

    const [ownerId, foreignOwnerId, employeeId] = userIds;
    const [pharmacyA, pharmacyB, foreignPharmacy] = pharmacyIds;

    try {
      await User.insertMany(
        userIds.map((id, index) => ({
          _id: id,
          name: 'Integration Member',
          email: `membership-${index}-${suffix}@example.com`,
          phone: `+380${randomInt(100_000_000, 1_000_000_000)}`,
          password: 'test-hash',
          role: 'pharmacy',
          status: 'active',
        }))
      );

      await Pharmacy.insertMany([
        {
          _id: pharmacyA,
          name: 'Membership Pharmacy A',
          ownerId,
          managerUserIds: [employeeId],
          status: 'active',
          documents: [],
        },

        {
          _id: pharmacyB,
          name: 'Membership Pharmacy B',
          ownerId,
          managerUserIds: [],
          status: 'active',
          documents: [],
        },

        {
          _id: foreignPharmacy,
          name: 'Membership Pharmacy Other',
          ownerId: foreignOwnerId,
          managerUserIds: [],
          status: 'active',
          documents: [],
        },
      ]);

      const member = await getPharmacyMembership(
        String(ownerId),
        String(pharmacyB)
      );

      assert.equal(member.membershipRole, 'owner');
      assert.equal(String(member.pharmacy._id), String(pharmacyB));

      await assert.rejects(
        resolveSelectedPharmacyMembership(String(ownerId)),

        (error: unknown) =>
          (error as HttpError).status === 409 &&
          (error as HttpError).code === 'PHARMACY_SELECTION_REQUIRED'
      );

      await assert.rejects(
        getPharmacyMembership(String(ownerId), String(foreignPharmacy)),
        (error: unknown) => (error as HttpError).status === 403
      );

      await assert.rejects(
        getPharmacyMembership(String(ownerId), String(new Types.ObjectId())),
        (error: unknown) => (error as HttpError).status === 404
      );

      await assert.rejects(
        getPharmacyMembership(String(ownerId), 'invalid-id'),
        (error: unknown) => (error as HttpError).status === 400
      );

      assert.equal(
        (
          await requirePharmacyCapability(String(employeeId), 'read_profile', {
            pharmacyId: String(pharmacyA),
          })
        ).membershipRole,
        'manager'
      );

      assert.equal(
        canPharmacyMembershipUseCapability('manager', 'manage_orders'),
        false
      );

      await assert.rejects(
        requirePharmacyCapability(String(employeeId), 'manage_orders', {
          pharmacyId: String(pharmacyA),
        }),

        (error: unknown) => (error as HttpError).status === 403
      );

      await Pharmacy.updateOne(
        { _id: pharmacyB },
        { $set: { status: 'blocked' } }
      );

      await assert.rejects(
        getPharmacyMembership(String(ownerId), String(pharmacyB)),
        (error: unknown) => (error as HttpError).status === 403
      );

      assert.equal(
        (
          await getPharmacyMembership(String(ownerId), String(pharmacyB), {
            allowBlocked: true,
          })
        ).pharmacy.status,
        'blocked'
      );

      await User.updateOne({ _id: ownerId }, { $set: { status: 'blocked' } });

      await assert.rejects(
        getPharmacyMembership(String(employeeId), String(pharmacyA)),
        (error: unknown) => (error as HttpError).status === 403
      );
    } finally {
      await Pharmacy.deleteMany({ _id: { $in: pharmacyIds } });
      await User.deleteMany({ _id: { $in: userIds } });
      await mongoose.disconnect();
    }
  }
);
