import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import mongoose, { Types } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
} from '../../constants/admin/audit/admin-audit';

import { USER_ROLES } from '../../constants/auth/auth';

import { AdminAuditLog } from '../../models/audit/adminAuditLog.model';
import { User } from '../../models/accounts/user.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PharmacyNote } from '../../models/pharmacies/pharmacyNote.model';

import { seedIntegrationPharmacyActors } from '../__tests__/fixtures/pharmacy-integration-actors.helper';

import {
  createClientCardNoteService,
  deleteClientCardNoteService,
  getClientCardNotesService,
} from './client-note.service';

//===============================================================

const uri = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===============================================================

test(
  'client comments can be created/deleted and are audited without exposing private text',
  { skip: !uri },

  async () => {
    await mongoose.connect(uri!);
    const ownerId = new Types.ObjectId();
    const otherOwnerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();
    const siblingPharmacyId = new Types.ObjectId();
    const clientId = new Types.ObjectId();
    const testPhone = `+38050${String(Number.parseInt(clientId.toHexString().slice(-6), 16) % 10000000).padStart(7, '0')}`;
    const actor = { id: String(ownerId), role: USER_ROLES.PHARMACY };

    try {
      await seedIntegrationPharmacyActors([ownerId, otherOwnerId]);

      await Pharmacy.create([
        {
          _id: pharmacyId,
          ownerId,
          name: 'Comments integration pharmacy',
          status: 'active',
          documents: [],
        },
        {
          _id: siblingPharmacyId,
          ownerId,
          name: 'Same-owner sibling pharmacy',
          status: 'active',
          documents: [],
        },
      ]);

      await User.create({
        _id: clientId,
        name: 'Walk-in client',
        email: `client-note-${clientId}@example.com`,
        phone: testPhone,
        password: 'test-password-hash',
        role: USER_ROLES.CLIENT,
        status: 'active',
        isDefaultPharmacyClient: true,
        defaultClientPharmacyId: pharmacyId,
      });

      const key = randomUUID();

      const text =
        'Private client information — never include in the activity log';

      const created = await createClientCardNoteService(
        actor,
        String(clientId),
        { text, clientRequestId: key }
      );

      const replay = await createClientCardNoteService(
        actor,
        String(clientId),
        { text, clientRequestId: key }
      );

      assert.equal(created.note.id, replay.note.id);

      const listed = await getClientCardNotesService(
        actor,
        String(clientId),
        1,
        10
      );

      assert.equal(listed.total, 1);
      assert.equal(listed.items[0]?.text, text);

      // The client comment belongs to the owner, not to the pharmacy containing
      // the walk-in profile or the currently selected pharmacy.
      const persisted = await PharmacyNote.findById(created.note.id).lean();

      assert.equal(String(persisted?.ownerId), String(ownerId));
      assert.equal(persisted?.pharmacyId, undefined);

      await assert.rejects(
        getClientCardNotesService(
          { id: String(otherOwnerId), role: USER_ROLES.PHARMACY },
          String(clientId),
          1,
          10
        ),

        (error: unknown) => (error as { status?: number }).status === 404
      );

      await deleteClientCardNoteService(
        actor,
        String(clientId),
        created.note.id
      );

      const after = await getClientCardNotesService(
        actor,
        String(clientId),
        1,
        10
      );

      assert.equal(after.total, 0);

      const audit = await AdminAuditLog.find({
        entityType: ADMIN_AUDIT_ENTITY_TYPES.CLIENT_COMMENT,
        entityId: created.note.id,
        scopeEntityId: String(ownerId),
      }).lean();

      assert.deepEqual(
        new Set(audit.map((row) => row.action)),

        new Set([
          ADMIN_AUDIT_ACTIONS.CLIENT_COMMENT_CREATED,
          ADMIN_AUDIT_ACTIONS.CLIENT_COMMENT_DELETED,
        ])
      );

      for (const row of audit) {
        assert.equal(JSON.stringify(row).includes(text), false);
        assert.equal(row.pharmacyId, undefined);
        assert.equal(row.section, 'clients');
      }

      // Regression: older imported pharmacy owners may have no name field.
      // The audit must still resolve a truthful actor label from the stored
      // email instead of throwing a TypeError on undefined.trim().
      await User.collection.updateOne(
        { _id: ownerId },
        { $unset: { name: '' } }
      );

      const legacyText = 'Legacy actor comment text must stay private';

      const legacy = await createClientCardNoteService(
        actor,
        String(clientId),
        {
          text: legacyText,
          clientRequestId: randomUUID(),
        }
      );

      const legacyAudit = await AdminAuditLog.findOne({
        entityType: ADMIN_AUDIT_ENTITY_TYPES.CLIENT_COMMENT,
        entityId: legacy.note.id,
        action: ADMIN_AUDIT_ACTIONS.CLIENT_COMMENT_CREATED,
      }).lean();

      assert.equal(
        legacyAudit?.actorNameSnapshot,
        `integration-pharmacy-${ownerId.toHexString()}@example.com`
      );

      assert.equal(JSON.stringify(legacyAudit).includes(legacyText), false);

      await deleteClientCardNoteService(
        actor,
        String(clientId),
        legacy.note.id
      );
    } finally {
      await AdminAuditLog.deleteMany({
        scopeEntityId: String(ownerId),
        entityType: ADMIN_AUDIT_ENTITY_TYPES.CLIENT_COMMENT,
      });

      await PharmacyNote.deleteMany({ $or: [{ ownerId }, { pharmacyId }] });

      await User.deleteMany({
        _id: { $in: [ownerId, otherOwnerId, clientId] },
      });

      await Pharmacy.deleteMany({
        _id: { $in: [pharmacyId, siblingPharmacyId] },
      });

      await mongoose.disconnect();
    }
  }
);
