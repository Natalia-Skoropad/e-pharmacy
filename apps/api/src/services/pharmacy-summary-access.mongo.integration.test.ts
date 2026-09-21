import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { PHARMACY_PROFILE_BLOCKED_ERROR_CODE } from '../constants/pharmacy-profile';
import { Pharmacy } from '../models/pharmacy.model';
import type { HttpError } from '../types/errors';

import {
  getCurrentPharmacySummaryService,
  getMyPharmacyProfileService,
} from './pharmacy.service';

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
  'blocked pharmacy members can read the minimal current summary while full profile access remains blocked',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const ownerId = new Types.ObjectId();
    const managerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();

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

      assert.equal(ownerSummary.pharmacy.id, pharmacyId.toString());
      assert.equal(ownerSummary.pharmacy.status, 'blocked');
      assert.equal(ownerSummary.pharmacy.membershipRole, 'owner');

      const managerSummary = await getCurrentPharmacySummaryService(
        managerId.toString()
      );

      assert.equal(managerSummary.pharmacy.id, pharmacyId.toString());
      assert.equal(managerSummary.pharmacy.status, 'blocked');
      assert.equal(managerSummary.pharmacy.membershipRole, 'manager');

      await assert.rejects(
        () => getMyPharmacyProfileService(ownerId.toString()),
        (error: unknown) => {
          const httpError = error as HttpError;
          return (
            httpError.status === 403 &&
            httpError.code === PHARMACY_PROFILE_BLOCKED_ERROR_CODE
          );
        }
      );
    } finally {
      await Pharmacy.deleteOne({ _id: pharmacyId });
      await mongoose.disconnect();
    }
  }
);
