import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { Pharmacy } from '../models/pharmacy.model';
import { PharmacyOwnerDocument } from '../models/pharmacyOwnerDocument.model';
import { User } from '../models/user.model';

import {
  deletePharmacyOwnerDocumentService,
  getPharmacyOwnerDocumentContentService,
  listPharmacyOwnerDocumentsService,
} from './pharmacy-owner-document.service';

//===============================================================

const TEST_MONGODB_URI = process.env.E_PHARMACY_TEST_MONGODB_URI;
const shouldSkip = !TEST_MONGODB_URI;

//===============================================================

function getTestMongoUri(): string {
  if (!TEST_MONGODB_URI) {
    throw new Error(
      'E_PHARMACY_TEST_MONGODB_URI is required for Mongo integration tests.'
    );
  }

  return TEST_MONGODB_URI;
}

//===============================================================

function uniqueOwnerIdentity(prefix: string) {
  const suffix = new Types.ObjectId().toHexString();
  return {
    email: `${prefix}-${suffix}@example.com`,
    phone: `+380${suffix.slice(-9).replace(/[a-f]/gi, '1')}`,
  };
}

//===============================================================

async function createOwner(prefix: string) {
  const identity = uniqueOwnerIdentity(prefix);

  return User.create({
    name: `${prefix} Owner`,
    email: identity.email,
    phone: identity.phone,
    password: 'integration-test-password-hash',
    role: 'pharmacy',
    status: 'active',
  });
}

//===============================================================

async function createLinkedPharmacy(ownerId: Types.ObjectId, name: string) {
  return Pharmacy.create({
    ownerId,
    managerUserIds: [],
    documents: [],
    name,
    status: 'new',
  });
}

//===============================================================

test(
  'owner documents remain isolated by ownerUserId for list, download and delete operations',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const ownerA = await createOwner('document-owner-a');
    const ownerB = await createOwner('document-owner-b');

    try {
      await Promise.all([
        createLinkedPharmacy(ownerA._id, 'Owner A document pharmacy'),
        createLinkedPharmacy(ownerB._id, 'Owner B document pharmacy'),
      ]);

      const content = Buffer.from('%PDF-1.4 isolated owner document');

      const document = await PharmacyOwnerDocument.create({
        ownerUserId: ownerA._id,
        uploadedByUserId: ownerA._id,
        name: 'owner-a-document.pdf',
        size: content.length,
        type: 'application/pdf',
        sha256: createHash('sha256').update(content).digest('hex'),
        content,
      });

      const [ownerADocuments, ownerBDocuments] = await Promise.all([
        listPharmacyOwnerDocumentsService(String(ownerA._id)),
        listPharmacyOwnerDocumentsService(String(ownerB._id)),
      ]);

      assert.deepEqual(
        ownerADocuments.map((item) => item.id),
        [String(document._id)]
      );
      assert.deepEqual(ownerBDocuments, []);

      const downloaded = await getPharmacyOwnerDocumentContentService(
        String(ownerA._id),
        String(document._id)
      );

      assert.deepEqual(downloaded.content, content);

      await assert.rejects(
        () =>
          getPharmacyOwnerDocumentContentService(
            String(ownerB._id),
            String(document._id)
          ),
        /Owner document was not found/
      );

      await assert.rejects(
        () =>
          deletePharmacyOwnerDocumentService(
            String(ownerB._id),
            String(document._id),
            `document-isolation-${new Types.ObjectId().toHexString()}`
          ),
        /Owner document was not found/
      );

      assert.ok(await PharmacyOwnerDocument.exists({ _id: document._id }));
    } finally {
      await PharmacyOwnerDocument.deleteMany({
        ownerUserId: { $in: [ownerA._id, ownerB._id] },
      });

      await Pharmacy.deleteMany({
        ownerId: { $in: [ownerA._id, ownerB._id] },
      });

      await User.deleteMany({ _id: { $in: [ownerA._id, ownerB._id] } });
      await mongoose.disconnect();
    }
  }
);
