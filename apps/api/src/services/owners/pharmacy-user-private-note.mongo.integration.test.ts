import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { PharmacyUserPrivateNote } from '../../models/pharmacyUserPrivateNote.model';
import { User } from '../../models/user.model';

import {
  createMyPharmacyUserPrivateNoteService,
  deleteMyPharmacyUserPrivateNoteService,
  listMyPharmacyUserPrivateNotesService,
} from './pharmacy-user-private-note.service';

//===============================================================

const TEST_MONGODB_URI = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===============================================================

async function createUser(status: 'new' | 'active') {
  const suffix = new Types.ObjectId().toHexString();

  return User.create({
    name: 'Private Note',
    email: `private-note-${suffix}@example.com`,
    phone: `+380${String((BigInt('0x' + suffix.slice(-12)) % 900000000n) + 100000000n)}`,
    password: 'test-password-hash',
    role: 'pharmacy',
    status,
  });
}

//===============================================================

function isHttpError(error: unknown, status: number) {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'status' in error &&
    error.status === status
  );
}

//===============================================================

test(
  'zero-pharmacy owner and another pharmacy user have isolated private notes and idempotency',
  { skip: !TEST_MONGODB_URI },

  async () => {
    await mongoose.connect(TEST_MONGODB_URI!);

    const userIds: Types.ObjectId[] = [];

    try {
      // Neither user belongs to a Pharmacy; new owners are still authorized.
      const owner = await createUser('new');
      const employee = await createUser('active');

      userIds.push(owner._id, employee._id);

      const ownerId = String(owner._id);
      const employeeId = String(employee._id);
      const key = randomUUID();
      const payload = { text: 'Personal note', clientRequestId: key };

      const first = await createMyPharmacyUserPrivateNoteService(
        ownerId,
        payload
      );

      const replay = await createMyPharmacyUserPrivateNoteService(
        ownerId,
        payload
      );

      assert.equal(first.id, replay.id);
      assert.equal(first.author.userId, ownerId);

      await assert.rejects(
        () =>
          createMyPharmacyUserPrivateNoteService(ownerId, {
            ...payload,
            text: 'Different text',
          }),

        (error) => isHttpError(error, 409)
      );

      // The same client request ID is independently allowed for another user.
      const other = await createMyPharmacyUserPrivateNoteService(
        employeeId,
        payload
      );

      assert.notEqual(first.id, other.id);

      await createMyPharmacyUserPrivateNoteService(ownerId, {
        text: 'Second note',
        clientRequestId: randomUUID(),
      });

      const firstPage = await listMyPharmacyUserPrivateNotesService(
        ownerId,
        1,
        1
      );

      assert.equal(firstPage.total, 2);
      assert.equal(firstPage.totalPages, 2);
      assert.equal(firstPage.items.length, 1);

      const lastPage = await listMyPharmacyUserPrivateNotesService(
        ownerId,
        99,
        1
      );

      assert.equal(lastPage.page, 2);
      assert.equal(lastPage.items.length, 1);

      const employeeNotes = await listMyPharmacyUserPrivateNotesService(
        employeeId,
        1,
        10
      );

      assert.deepEqual(
        employeeNotes.items.map((item) => item.id),
        [other.id]
      );

      await assert.rejects(
        () => deleteMyPharmacyUserPrivateNoteService(employeeId, first.id),
        (error) => isHttpError(error, 404)
      );

      await deleteMyPharmacyUserPrivateNoteService(ownerId, first.id);

      assert.equal(
        (await listMyPharmacyUserPrivateNotesService(ownerId, 1, 10)).total,
        1
      );
    } finally {
      await PharmacyUserPrivateNote.deleteMany({
        ownerUserId: { $in: userIds },
      });

      await User.deleteMany({ _id: { $in: userIds } });
      await mongoose.disconnect();
    }
  }
);
