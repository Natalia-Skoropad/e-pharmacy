import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { Pharmacy } from '../models/pharmacy.model';
import { PharmacyNote } from '../models/pharmacyNote.model';
import { User } from '../models/user.model';
import type { HttpError } from '../types/errors';

import {
  createPharmacyNoteService,
  deletePharmacyNoteService,
} from './pharmacy-note.service';

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
  'pharmacy notes reject unrelated client and pharmacy entities',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const ownerId = new Types.ObjectId();
    const otherOwnerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();
    const otherPharmacyId = new Types.ObjectId();
    const ownClientId = new Types.ObjectId();
    const unrelatedClientId = new Types.ObjectId();
    const suffix = new Types.ObjectId().toHexString().slice(-8);

    await User.create({
      _id: ownClientId,
      name: 'Walk In Client',
      email: `note-own-${suffix}@example.com`,
      password: 'hashed-password',
      phone: `+38050${suffix.slice(0, 7).replace(/[a-f]/g, '1')}`,
      role: 'client',
      status: 'active',
      isDefaultPharmacyClient: true,
      defaultClientPharmacyId: pharmacyId,
    });

    await User.create({
      _id: unrelatedClientId,
      name: 'Unrelated Client',
      email: `note-other-${suffix}@example.com`,
      password: 'hashed-password',
      phone: `+38067${suffix.slice(0, 7).replace(/[a-f]/g, '2')}`,
      role: 'client',
      status: 'active',
    });

    await Promise.all([
      Pharmacy.create({
        _id: pharmacyId,
        ownerId,
        managerUserIds: [],
        documents: [],
        name: 'Note Test Pharmacy',
        status: 'active',
      }),

      Pharmacy.create({
        _id: otherPharmacyId,
        ownerId: otherOwnerId,
        managerUserIds: [],
        documents: [],
        name: 'Other Note Pharmacy',
        status: 'active',
      }),
    ]);

    try {
      await createPharmacyNoteService(
        ownerId.toString(),
        'pharmacy',
        pharmacyId.toString(),
        'Own pharmacy note'
      );

      await createPharmacyNoteService(
        ownerId.toString(),
        'client',
        ownClientId.toString(),
        'Own client note'
      );

      await assert.rejects(
        createPharmacyNoteService(
          ownerId.toString(),
          'pharmacy',
          otherPharmacyId.toString(),
          'Foreign pharmacy note'
        ),
        (error: unknown) => (error as HttpError).status === 404
      );

      await assert.rejects(
        createPharmacyNoteService(
          ownerId.toString(),
          'client',
          unrelatedClientId.toString(),
          'Unrelated client note'
        ),
        (error: unknown) => (error as HttpError).status === 404
      );

      await Pharmacy.updateOne(
        { _id: pharmacyId },
        { $set: { status: 'blocked' } }
      );

      await assert.rejects(
        createPharmacyNoteService(
          ownerId.toString(),
          'pharmacy',
          pharmacyId.toString(),
          'Blocked pharmacy note'
        ),
        (error: unknown) =>
          (error as HttpError).status === 403 &&
          (error as HttpError).code === 'PHARMACY_PROFILE_BLOCKED'
      );
    } finally {
      await Promise.all([
        PharmacyNote.deleteMany({ pharmacyId }),
        Pharmacy.deleteMany({ _id: { $in: [pharmacyId, otherPharmacyId] } }),
        User.deleteMany({ _id: { $in: [ownClientId, unrelatedClientId] } }),
      ]);
      await mongoose.disconnect();
    }
  }
);

//===================================================================

test(
  'internal pharmacy notes are shared: owner and managers can delete each other notes inside the same pharmacy',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const ownerId = new Types.ObjectId();
    const managerAId = new Types.ObjectId();
    const managerBId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();

    await Pharmacy.create({
      _id: pharmacyId,
      ownerId,
      managerUserIds: [managerAId, managerBId],
      documents: [],
      name: 'Shared Notes Pharmacy',
      status: 'active',
    });

    try {
      const managerANote = await createPharmacyNoteService(
        managerAId.toString(),
        'pharmacy',
        pharmacyId.toString(),
        'Manager A shared note'
      );

      await deletePharmacyNoteService(
        managerBId.toString(),
        'pharmacy',
        pharmacyId.toString(),
        managerANote.note.id
      );

      assert.equal(
        await PharmacyNote.exists({ _id: managerANote.note.id }),
        null
      );

      const managerBNote = await createPharmacyNoteService(
        managerBId.toString(),
        'pharmacy',
        pharmacyId.toString(),
        'Manager B shared note'
      );

      await deletePharmacyNoteService(
        ownerId.toString(),
        'pharmacy',
        pharmacyId.toString(),
        managerBNote.note.id
      );

      assert.equal(
        await PharmacyNote.exists({ _id: managerBNote.note.id }),
        null
      );

      const ownerNote = await createPharmacyNoteService(
        ownerId.toString(),
        'pharmacy',
        pharmacyId.toString(),
        'Owner shared note'
      );

      await deletePharmacyNoteService(
        managerAId.toString(),
        'pharmacy',
        pharmacyId.toString(),
        ownerNote.note.id
      );

      assert.equal(await PharmacyNote.exists({ _id: ownerNote.note.id }), null);
    } finally {
      await Promise.all([
        PharmacyNote.deleteMany({ pharmacyId }),
        Pharmacy.deleteOne({ _id: pharmacyId }),
      ]);
      await mongoose.disconnect();
    }
  }
);
