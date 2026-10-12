import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import mongoose, { Types } from 'mongoose';

import { AdminAuditLog } from '../models/adminAuditLog.model';
import { Pharmacy } from '../models/pharmacy.model';
import { PharmacyAdminComment } from '../models/pharmacyAdminComment.model';
import { PharmacyDocumentFile } from '../models/pharmacyDocumentFile.model';
import { User } from '../models/user.model';

import {
  createPharmacyAdminCommentService,
  deletePharmacyAdminCommentService,
  listPharmacyAdminCommentsService,
} from './pharmacy-admin-comment.service';

import {
  downloadAdminPharmacyDocumentService,
  listAdminPharmacyDocumentsService,
} from './pharmacy-document.service';

//===================================================================

const uri = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===================================================================

test(
  'Stage 14.6 Mongo: pharmacy-only documents and idempotent private comments with body-free audit',
  { skip: !uri },
  async () => {
    await mongoose.connect(uri!);
    const adminId = new Types.ObjectId();
    const pharmacyA = new Types.ObjectId();
    const pharmacyB = new Types.ObjectId();
    const ownerId = new Types.ObjectId();
    const fileA = new Types.ObjectId();
    const fileB = new Types.ObjectId();
    const unreferencedFile = new Types.ObjectId();
    const now = new Date();
    const content = Buffer.from('%PDF-1.4 admin only');

    const documentMeta = (id: Types.ObjectId) => ({
      id: String(id),
      name: 'license.pdf',
      type: 'application/pdf',
      size: content.length,
      sha256: 'a'.repeat(64),
      uploadedAt: now.toISOString(),
    });

    try {
      await User.collection.insertMany([
        {
          _id: adminId,
          role: 'admin',
          name: 'Pharmacy reviewer',
          status: 'active',
        },
        { _id: ownerId, role: 'pharmacy', name: 'Owner', status: 'active' },
      ]);

      await Pharmacy.collection.insertMany([
        {
          _id: pharmacyA,
          ownerId,
          name: 'A',
          status: 'new',
          documents: [documentMeta(fileA)],
          pendingModeration: { documents: [documentMeta(fileB)] },
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: pharmacyB,
          ownerId,
          name: 'B',
          status: 'new',
          documents: [documentMeta(fileB)],
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await PharmacyDocumentFile.collection.insertMany([
        {
          _id: fileA,
          pharmacyId: pharmacyA,
          name: 'license.pdf',
          type: 'application/pdf',
          size: content.length,
          sha256: 'a'.repeat(64),
          content,
          attachedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: fileB,
          pharmacyId: pharmacyB,
          name: 'license.pdf',
          type: 'application/pdf',
          size: content.length,
          sha256: 'a'.repeat(64),
          content,
          attachedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: unreferencedFile,
          pharmacyId: pharmacyA,
          name: 'license.pdf',
          type: 'application/pdf',
          size: content.length,
          sha256: 'a'.repeat(64),
          content,
          attachedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      // A foreign file referenced in A's pending snapshot still cannot be read through A.
      assert.deepEqual(
        (await listAdminPharmacyDocumentsService(String(pharmacyA))).map(
          (d) => d.id
        ),
        [String(fileA)]
      );

      assert.deepEqual(
        (await listAdminPharmacyDocumentsService(String(pharmacyB))).map(
          (d) => d.id
        ),
        [String(fileB)]
      );

      const file = await downloadAdminPharmacyDocumentService(
        String(pharmacyA),
        String(fileA)
      );

      assert.deepEqual(file.content, content);

      await assert.rejects(
        downloadAdminPharmacyDocumentService(String(pharmacyA), String(fileB)),
        (error: unknown) =>
          error instanceof Error && 'status' in error && error.status === 404
      );

      await assert.rejects(
        downloadAdminPharmacyDocumentService(
          String(pharmacyA),
          String(unreferencedFile)
        ),
        (error: unknown) =>
          error instanceof Error && 'status' in error && error.status === 404
      );

      const key = randomUUID();
      const payload = { text: 'Private review notes', clientRequestId: key };

      const created = await createPharmacyAdminCommentService(
        String(pharmacyA),
        String(adminId),
        payload,
        randomUUID()
      );

      const replay = await createPharmacyAdminCommentService(
        String(pharmacyA),
        String(adminId),
        payload,
        randomUUID()
      );

      assert.equal(created.id, replay.id);

      assert.equal(
        (await listPharmacyAdminCommentsService(String(pharmacyA))).length,
        1
      );

      assert.deepEqual(
        await listPharmacyAdminCommentsService(String(pharmacyB)),
        []
      );

      await assert.rejects(
        createPharmacyAdminCommentService(
          String(pharmacyB),
          String(adminId),
          payload,
          randomUUID()
        ),

        (error: unknown) =>
          error instanceof Error && 'status' in error && error.status === 409
      );

      await assert.rejects(
        deletePharmacyAdminCommentService(
          String(pharmacyB),
          created.id,
          String(adminId),
          randomUUID()
        ),

        (error: unknown) =>
          error instanceof Error && 'status' in error && error.status === 404
      );

      await deletePharmacyAdminCommentService(
        String(pharmacyA),
        created.id,
        String(adminId),
        randomUUID()
      );

      assert.deepEqual(
        await listPharmacyAdminCommentsService(String(pharmacyA)),
        []
      );

      const audit = await AdminAuditLog.find({
        scopeEntityType: 'pharmacy',
        scopeEntityId: String(pharmacyA),
        entityType: 'pharmacyAdminComment',
      }).lean();

      assert.equal(audit.length, 2); // Replay must not create another audit record.

      for (const record of audit) {
        assert.equal(
          JSON.stringify(record.before).includes(payload.text),
          false
        );

        assert.equal(
          JSON.stringify(record.after).includes(payload.text),
          false
        );
      }
    } finally {
      await Promise.all([
        PharmacyAdminComment.deleteMany({
          pharmacyId: { $in: [pharmacyA, pharmacyB] },
        }),

        AdminAuditLog.deleteMany({
          scopeEntityType: 'pharmacy',
          scopeEntityId: String(pharmacyA),
          entityType: 'pharmacyAdminComment',
        }),

        PharmacyDocumentFile.deleteMany({
          _id: { $in: [fileA, fileB, unreferencedFile] },
        }),

        Pharmacy.deleteMany({ _id: { $in: [pharmacyA, pharmacyB] } }),
        User.deleteMany({ _id: { $in: [adminId, ownerId] } }),
      ]);

      await mongoose.disconnect();
    }
  }
);
