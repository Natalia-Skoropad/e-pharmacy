import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { USER_ROLES } from '../constants/auth';
import { Pharmacy } from '../models/pharmacy.model';
import { PharmacyNote } from '../models/pharmacyNote.model';
import { User } from '../models/user.model';
import type { HttpError } from '../types/errors';

import {
  createPharmacyNoteService,
  deletePharmacyNoteService,
  getPharmacyNotesService,
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

function pharmacyActor(id: Types.ObjectId) {
  return { id: id.toString(), role: USER_ROLES.PHARMACY } as const;
}

//===================================================================

function noteInput(text: string, clientRequestId = randomUUID()) {
  return { text, clientRequestId };
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
        pharmacyActor(ownerId),
        'pharmacy',
        pharmacyId.toString(),
        noteInput('Own pharmacy note')
      );

      await createPharmacyNoteService(
        pharmacyActor(ownerId),
        'client',
        ownClientId.toString(),
        noteInput('Own client note')
      );

      await assert.rejects(
        createPharmacyNoteService(
          pharmacyActor(ownerId),
          'pharmacy',
          otherPharmacyId.toString(),
          noteInput('Foreign pharmacy note')
        ),
        (error: unknown) => (error as HttpError).status === 404
      );

      await assert.rejects(
        createPharmacyNoteService(
          pharmacyActor(ownerId),
          'client',
          unrelatedClientId.toString(),
          noteInput('Unrelated client note')
        ),
        (error: unknown) => (error as HttpError).status === 404
      );

      await Pharmacy.updateOne(
        { _id: pharmacyId },
        { $set: { status: 'blocked' } }
      );

      await assert.rejects(
        createPharmacyNoteService(
          pharmacyActor(ownerId),
          'pharmacy',
          pharmacyId.toString(),
          noteInput('Blocked pharmacy note')
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
        pharmacyActor(managerAId),
        'pharmacy',
        pharmacyId.toString(),
        noteInput('Manager A shared note')
      );

      await deletePharmacyNoteService(
        pharmacyActor(managerBId),
        'pharmacy',
        pharmacyId.toString(),
        managerANote.note.id
      );

      assert.equal(
        await PharmacyNote.exists({ _id: managerANote.note.id }),
        null
      );

      const managerBNote = await createPharmacyNoteService(
        pharmacyActor(managerBId),
        'pharmacy',
        pharmacyId.toString(),
        noteInput('Manager B shared note')
      );

      await deletePharmacyNoteService(
        pharmacyActor(ownerId),
        'pharmacy',
        pharmacyId.toString(),
        managerBNote.note.id
      );

      assert.equal(
        await PharmacyNote.exists({ _id: managerBNote.note.id }),
        null
      );

      const ownerNote = await createPharmacyNoteService(
        pharmacyActor(ownerId),
        'pharmacy',
        pharmacyId.toString(),
        noteInput('Owner shared note')
      );

      await deletePharmacyNoteService(
        pharmacyActor(managerAId),
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

//===================================================================

test(
  'pharmacy note author snapshot survives author rename and deletion',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const ownerId = new Types.ObjectId();
    const managerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();
    const suffix = new Types.ObjectId().toHexString().slice(-8);

    await Promise.all([
      User.create({
        _id: managerId,
        name: 'Manager Original',
        email: `note-author-${suffix}@example.com`,
        password: 'hashed-password',
        phone: `+38093${suffix.slice(0, 7).replace(/[a-f]/g, '3')}`,
        role: 'pharmacy',
        status: 'active',
      }),

      Pharmacy.create({
        _id: pharmacyId,
        ownerId,
        managerUserIds: [managerId],
        documents: [],
        name: 'Author Snapshot Pharmacy',
        status: 'active',
      }),
    ]);

    try {
      const created = await createPharmacyNoteService(
        pharmacyActor(managerId),
        'pharmacy',
        pharmacyId.toString(),
        noteInput('Snapshot note')
      );

      assert.deepEqual(created.note.author, {
        userId: managerId.toString(),
        displayName: 'Manager Original',
      });

      await User.updateOne(
        { _id: managerId },
        { $set: { name: 'Manager Renamed' } }
      );

      let page = await getPharmacyNotesService(
        pharmacyActor(managerId),
        'pharmacy',
        pharmacyId.toString(),
        1,
        10
      );

      assert.equal(page.items[0]?.author.displayName, 'Manager Original');

      await User.deleteOne({ _id: managerId });

      page = await getPharmacyNotesService(
        pharmacyActor(ownerId),
        'pharmacy',
        pharmacyId.toString(),
        1,
        10
      );

      assert.equal(page.items[0]?.author.displayName, 'Manager Original');
    } finally {
      await Promise.all([
        PharmacyNote.deleteMany({ pharmacyId }),
        Pharmacy.deleteOne({ _id: pharmacyId }),
        User.deleteOne({ _id: managerId }),
      ]);

      await mongoose.disconnect();
    }
  }
);

//===================================================================

test(
  'internal pharmacy notes fail closed for a non-pharmacy actor even with stale pharmacy membership',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const staleClientId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();

    await Pharmacy.create({
      _id: pharmacyId,
      ownerId: staleClientId,
      managerUserIds: [],
      documents: [],
      name: 'Stale Membership Pharmacy',
      status: 'active',
    });

    try {
      const actor = {
        id: staleClientId.toString(),
        role: USER_ROLES.CLIENT,
      } as const;

      await assert.rejects(
        getPharmacyNotesService(
          actor,
          'pharmacy',
          pharmacyId.toString(),
          1,
          10
        ),
        (error: unknown) => (error as HttpError).status === 403
      );

      await assert.rejects(
        createPharmacyNoteService(
          actor,
          'pharmacy',
          pharmacyId.toString(),
          noteInput('Must stay forbidden')
        ),
        (error: unknown) => (error as HttpError).status === 403
      );
    } finally {
      await Promise.all([
        PharmacyNote.deleteMany({ pharmacyId }),
        Pharmacy.deleteOne({ _id: pharmacyId }),
      ]);
      await mongoose.disconnect();
    }
  }
);

//===================================================================

test(
  'removed pharmacy manager immediately loses internal note read and delete access',
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
      name: 'Removed Manager Pharmacy',
      status: 'active',
    });

    try {
      const created = await createPharmacyNoteService(
        pharmacyActor(managerId),
        'pharmacy',
        pharmacyId.toString(),
        noteInput('Manager note before removal')
      );

      await Pharmacy.updateOne(
        { _id: pharmacyId },
        { $pull: { managerUserIds: managerId } }
      );

      await assert.rejects(
        getPharmacyNotesService(
          pharmacyActor(managerId),
          'pharmacy',
          pharmacyId.toString(),
          1,
          10
        ),
        (error: unknown) => (error as HttpError).status === 409
      );

      await assert.rejects(
        deletePharmacyNoteService(
          pharmacyActor(managerId),
          'pharmacy',
          pharmacyId.toString(),
          created.note.id
        ),
        (error: unknown) => (error as HttpError).status === 409
      );

      await deletePharmacyNoteService(
        pharmacyActor(ownerId),
        'pharmacy',
        pharmacyId.toString(),
        created.note.id
      );
    } finally {
      await Promise.all([
        PharmacyNote.deleteMany({ pharmacyId }),
        Pharmacy.deleteOne({ _id: pharmacyId }),
      ]);
      await mongoose.disconnect();
    }
  }
);

//===================================================================

test(
  'pharmacy note create is idempotent for an ambiguous retry and rejects request-key reuse with different text',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    const ownerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();
    const clientRequestId = randomUUID();

    await Pharmacy.create({
      _id: pharmacyId,
      ownerId,
      managerUserIds: [],
      documents: [],
      name: 'Idempotent Notes Pharmacy',
      status: 'active',
    });

    try {
      await PharmacyNote.syncIndexes();

      const first = await createPharmacyNoteService(
        pharmacyActor(ownerId),
        'pharmacy',
        pharmacyId.toString(),
        noteInput('Ambiguous retry note', clientRequestId)
      );

      const retry = await createPharmacyNoteService(
        pharmacyActor(ownerId),
        'pharmacy',
        pharmacyId.toString(),
        noteInput('Ambiguous retry note', clientRequestId)
      );

      assert.equal(retry.note.id, first.note.id);

      assert.equal(
        await PharmacyNote.countDocuments({ pharmacyId, clientRequestId }),
        1
      );

      await assert.rejects(
        createPharmacyNoteService(
          pharmacyActor(ownerId),
          'pharmacy',
          pharmacyId.toString(),
          noteInput('Different content', clientRequestId)
        ),
        (error: unknown) => (error as HttpError).status === 409
      );
    } finally {
      await Promise.all([
        PharmacyNote.deleteMany({ pharmacyId }),
        Pharmacy.deleteOne({ _id: pharmacyId }),
      ]);
      await mongoose.disconnect();
    }
  }
);
