import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { AdminAuditLog } from '../../models/adminAuditLog.model';
import { Pharmacy } from '../../models/pharmacy.model';
import { User } from '../../models/user.model';
import { createPharmacyDraftService } from './pharmacy-create.service';

//===============================================================

const MONGODB_URI = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===============================================================

function hasStatus(error: unknown, status: number): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'status' in error &&
    error.status === status
  );
}

//===============================================================

test(
  'create second / third draft: idempotency, audit, owner isolation and blocked accounts',
  { skip: !MONGODB_URI },

  async () => {
    await mongoose.connect(MONGODB_URI!);

    const userIds: Types.ObjectId[] = [];
    const pharmacyIds: Types.ObjectId[] = [];

    async function makeOwner(status: 'new' | 'active' | 'blocked') {
      const id = new Types.ObjectId();

      userIds.push(id);

      await User.create({
        _id: id,
        name: 'Draft Tester',
        email: `draft-${status}-${id.toHexString()}@example.com`,
        phone: `+380${String((BigInt('0x' + id.toHexString().slice(-12)) % 900000000n) + 100000000n)}`,
        password: 'fake-hash',
        role: 'pharmacy',
        status,
      });

      return String(id);
    }

    try {
      const owner = await makeOwner('new');
      const secondOwner = await makeOwner('active');
      const blocked = await makeOwner('blocked');
      const manager = await makeOwner('active');

      const oldPharmacy = await Pharmacy.create({
        name: 'Existing Pharmacy',
        ownerId: owner,
        status: 'active',
        managerUserIds: [],
        documents: [],
      });

      pharmacyIds.push(oldPharmacy._id);

      const managed = await Pharmacy.create({
        name: 'Managed Pharmacy',
        ownerId: secondOwner,
        managerUserIds: [manager],
        status: 'new',
        documents: [],
      });

      pharmacyIds.push(managed._id);

      const clientRequestId = randomUUID();

      const first = await createPharmacyDraftService(
        owner,

        {
          clientRequestId,
          name: 'New Pharmacy B',
        },

        randomUUID()
      );

      pharmacyIds.push(new Types.ObjectId(first.pharmacy.id));

      assert.equal(first.replayed, false);
      assert.equal(first.pharmacy.status, 'new');
      assert.deepEqual(first.pharmacy.documents, []);
      assert.equal(first.pharmacy.location, undefined);
      assert.equal(first.pharmacy.bankDetails?.iban, undefined);

      const retry = await createPharmacyDraftService(
        owner,

        {
          clientRequestId,
          name: 'New Pharmacy B',
        },

        randomUUID()
      );

      assert.equal(retry.replayed, true);
      assert.equal(retry.pharmacy.id, first.pharmacy.id);

      await assert.rejects(
        createPharmacyDraftService(
          owner,
          { clientRequestId, name: 'Changed Name' },
          randomUUID()
        ),

        (error) => hasStatus(error, 409)
      );

      const third = await createPharmacyDraftService(
        owner,

        {
          clientRequestId: randomUUID(),
          name: 'New Pharmacy C',
          location: { settlement: 'Odesa' },
          email: 'TEST@example.com',
        },

        randomUUID()
      );

      pharmacyIds.push(new Types.ObjectId(third.pharmacy.id));

      assert.notEqual(third.pharmacy.id, first.pharmacy.id);
      assert.equal(third.pharmacy.location?.settlement, 'Odesa');
      assert.equal(third.pharmacy.location?.region, undefined);
      assert.equal(third.pharmacy.email, 'test@example.com');

      assert.equal(
        (await Pharmacy.findById(oldPharmacy._id))?.name,
        'Existing Pharmacy'
      );

      assert.equal(await Pharmacy.countDocuments({ ownerId: owner }), 3);

      assert.deepEqual(
        (await Pharmacy.findById(first.pharmacy.id))?.managerUserIds,
        []
      );

      assert.equal(
        await AdminAuditLog.countDocuments({
          action: 'pharmacy.created',
          entityId: first.pharmacy.id,
        }),
        1
      );

      assert.equal(
        await AdminAuditLog.countDocuments({
          action: 'pharmacy.created',
          scopeEntityId: owner,
          entityId: { $in: [first.pharmacy.id, third.pharmacy.id] },
        }),
        2
      );

      await assert.rejects(
        createPharmacyDraftService(
          blocked,
          { clientRequestId: randomUUID(), name: 'Blocked Pharmacy' },
          randomUUID()
        ),

        (error) => hasStatus(error, 403)
      );

      await assert.rejects(
        createPharmacyDraftService(
          manager,
          { clientRequestId: randomUUID(), name: 'Employee Pharmacy' },
          randomUUID()
        ),

        (error) => hasStatus(error, 403)
      );

      assert.equal(await Pharmacy.countDocuments({ ownerId: manager }), 0);
    } finally {
      await AdminAuditLog.deleteMany({
        entityId: { $in: pharmacyIds.map(String) },
      });

      await Pharmacy.deleteMany({ _id: { $in: pharmacyIds } });
      await User.deleteMany({ _id: { $in: userIds } });
      await mongoose.disconnect();
    }
  }
);
