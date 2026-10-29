import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { seedIntegrationPharmacyActors } from '../__tests__/fixtures/pharmacy-integration-actors.helper';

import {
  PHARMACY_PROFILE_LOCKED_ERROR_CODE,
  PHARMACY_OWNER_REQUIRED_ERROR_CODE,
} from '../../constants/pharmacies/pharmacy-profile';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { User } from '../../models/accounts/user.model';

import type { HttpError } from '../../types/http/errors';

import {
  getCurrentPharmacySummaryService,
  getMyPharmacyProfileService,
  updateMyPharmacyProfileService,
} from './pharmacy-owner-profile.service';

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

test(
  'inactive pharmacies stay readable for reactivation while pending changes cannot be edited',
  { skip: shouldSkip },

  async () => {
    await mongoose.connect(getTestMongoUri());

    const ownerId = new Types.ObjectId();
    const managerId = new Types.ObjectId();
    const foreignId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();

    await seedIntegrationPharmacyActors([ownerId, managerId, foreignId]);

    await Pharmacy.create({
      _id: pharmacyId,
      ownerId,
      managerUserIds: [managerId],
      documents: [],
      name: `Blocked Summary Pharmacy ${pharmacyId.toHexString().slice(-6)}`,
      status: 'blocked',
    });

    try {
      const ownerSummary = await getCurrentPharmacySummaryService(
        ownerId.toString()
      );

      const ownerPharmacy = ownerSummary.pharmacy;

      assert.ok(ownerPharmacy, 'Owner must have a pharmacy in this fixture');
      assert.equal(ownerPharmacy.id, pharmacyId.toString());
      assert.equal(ownerPharmacy.status, 'blocked');
      assert.equal(ownerPharmacy.membershipRole, 'owner');

      const managerSummary = await getCurrentPharmacySummaryService(
        managerId.toString()
      );

      const managerPharmacy = managerSummary.pharmacy;

      assert.ok(
        managerPharmacy,
        'Manager must have a pharmacy in this fixture'
      );

      assert.equal(managerPharmacy.id, pharmacyId.toString());
      assert.equal(managerPharmacy.status, 'blocked');
      assert.equal(managerPharmacy.membershipRole, 'manager');

      // Block 1.2: Inactive owners must be able to inspect their saved data
      // and prepare a future reactivation request. Profile reads are no longer
      // restricted to the minimal summary, unlike operational mutations.
      const ownerProfile = await getMyPharmacyProfileService(
        ownerId.toString(),
        pharmacyId.toString()
      );

      assert.equal(ownerProfile.pharmacy.status, 'blocked');

      const managerProfile = await getMyPharmacyProfileService(
        managerId.toString(),
        pharmacyId.toString()
      );

      assert.equal(managerProfile.pharmacy.status, 'blocked');

      await assert.rejects(
        () =>
          getMyPharmacyProfileService(
            foreignId.toString(),
            pharmacyId.toString()
          ),
        (error: unknown) => (error as HttpError).status === 403
      );

      const beforeReview =
        await Pharmacy.findById(pharmacyId).select('updatedAt');

      assert.ok(beforeReview);

      await assert.rejects(
        () =>
          updateMyPharmacyProfileService(
            managerId.toString(),

            {
              name: 'Manager cannot edit',
              expectedRevision: beforeReview.updatedAt.toISOString(),
            },

            undefined,
            pharmacyId.toString()
          ),

        (error: unknown) => {
          const failure = error as HttpError;

          return (
            failure.status === 403 &&
            failure.code === PHARMACY_OWNER_REQUIRED_ERROR_CODE
          );
        }
      );

      // A pending reactivation/review still freezes owner changes, even though
      // the profile itself remains visible. Never replace this with a read ban.
      await Pharmacy.updateOne(
        { _id: pharmacyId },
        { $set: { reviewState: 'pending' } }
      );

      const pending = await Pharmacy.findById(pharmacyId).select('updatedAt');

      assert.ok(pending);

      await assert.rejects(
        () =>
          updateMyPharmacyProfileService(
            ownerId.toString(),

            {
              name: 'Forbidden pending edit',
              expectedRevision: pending.updatedAt.toISOString(),
            },

            undefined,
            pharmacyId.toString()
          ),

        (error: unknown) => {
          const failure = error as HttpError;

          return (
            failure.status === 400 &&
            failure.code === PHARMACY_PROFILE_LOCKED_ERROR_CODE
          );
        }
      );
    } finally {
      await Pharmacy.deleteOne({ _id: pharmacyId });
      await User.deleteMany({ _id: { $in: [ownerId, managerId, foreignId] } });
      await mongoose.disconnect();
    }
  }
);
