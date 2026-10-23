import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose, { Types } from 'mongoose';

import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';
import { User } from '../../../models/accounts/user.model';

import { getAdminPharmacyDetailService } from './admin-pharmacy-detail-read.service';

//===============================================================

const mongoUri = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===============================================================

test(
  'Stage 14.5: onboarding, pending/published isolation, 404 and owner link in MongoDB',
  { skip: !mongoUri },

  async () => {
    await mongoose.connect(mongoUri!);

    const ownerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();
    const missingId = new Types.ObjectId();
    const unique = pharmacyId.toHexString();

    try {
      await User.create({
        _id: ownerId,
        role: 'pharmacy',
        status: 'new',
        name: 'Detail owner',
        email: `detail-${unique}@example.com`,
        phone: `+38050${String(parseInt(unique.slice(-8), 16) % 10_000_000).padStart(7, '0')}`,
        password: 'test-only',
      });

      await Pharmacy.create({
        _id: pharmacyId,
        ownerId,
        name: '',
        status: 'new',
        documents: [],

        pendingModeration: {
          name: 'Proposed name',
          bankDetails: { iban: 'UA012345678901234567890123456' },
          documents: [],
        },
      });

      const detail = await getAdminPharmacyDetailService(String(pharmacyId));

      assert.equal(detail.current.name, '');
      assert.equal(detail.current.bankTransferAvailable, false);
      assert.equal(detail.owner?.id, String(ownerId));
      assert.equal(detail.owner?.status, 'new');
      assert.equal(detail.pendingChanges?.name, 'Proposed name');
      assert.equal(detail.pendingChanges?.documentsCount, 0);
      assert.equal(detail.documentCount, 0);
      assert.equal(detail.metrics.successfulOrdersCount, 0);
      assert.equal(detail.metrics.successfulRevenue, 0);
      assert.match(detail.dates.createdAt, /^\d{4}-\d\d-\d\dT/);
      assert.doesNotMatch(JSON.stringify(detail), /sha256|document\.content/);

      await assert.rejects(
        getAdminPharmacyDetailService(String(missingId)),

        (error: unknown) =>
          error instanceof Error &&
          (error as Error & { status?: number }).status === 404
      );

      await User.deleteOne({ _id: ownerId });

      const legacy = await getAdminPharmacyDetailService(String(pharmacyId));

      assert.equal(legacy.owner, null);
    } finally {
      await Pharmacy.deleteOne({ _id: pharmacyId });
      await User.deleteOne({ _id: ownerId });
      await mongoose.disconnect();
    }
  }
);
