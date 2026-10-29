import assert from 'node:assert/strict';
import { createHash, randomInt } from 'node:crypto';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PharmacyOwnerDocument } from '../../models/owners/pharmacyOwnerDocument.model';
import { User } from '../../models/accounts/user.model';

import {
  deletePharmacyOwnerDocumentService,
  getPharmacyOwnerDocumentContentService,
  listPharmacyOwnerDocumentsService,
  replacePharmacyOwnerDocumentService,
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
    phone: `+380${randomInt(100_000_000, 1_000_000_000)}`,
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

    const createdOwnerIds: Types.ObjectId[] = [];

    try {
      const ownerA = await createOwner('document-owner-a');

      createdOwnerIds.push(ownerA._id);

      const ownerB = await createOwner('document-owner-b');

      createdOwnerIds.push(ownerB._id);

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
      try {
        if (createdOwnerIds.length > 0) {
          await PharmacyOwnerDocument.deleteMany({
            ownerUserId: { $in: createdOwnerIds },
          });

          await Pharmacy.deleteMany({
            ownerId: { $in: createdOwnerIds },
          });

          await User.deleteMany({ _id: { $in: createdOwnerIds } });
        }
      } finally {
        await mongoose.disconnect();
      }
    }
  }
);

//===============================================================

test(
  'a pharmacy owner without linked pharmacies has an empty document list, not 404',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const owner = await createOwner('document-new-owner');

    try {
      assert.deepEqual(
        await listPharmacyOwnerDocumentsService(String(owner._id)),
        []
      );
    } finally {
      await User.deleteOne({ _id: owner._id });
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'Block 1.3: last Owner document is protected and replacing it preserves verified binary content',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const owner = await createOwner('document-replacement');
    const originalContent = Buffer.from('%PDF-1.4 original owner identity');

    const replacementContent = Buffer.from(
      '%PDF-1.4 replacement owner identity'
    );

    const original = await PharmacyOwnerDocument.create({
      ownerUserId: owner._id,
      uploadedByUserId: owner._id,
      name: 'identity.pdf',
      size: originalContent.length,
      type: 'application/pdf',
      sha256: createHash('sha256').update(originalContent).digest('hex'),
      content: originalContent,
    });

    try {
      await assert.rejects(
        () =>
          deletePharmacyOwnerDocumentService(
            String(owner._id),
            String(original._id),
            `last-owner-document-${new Types.ObjectId().toHexString()}`
          ),
        /At least one owner document is required/
      );

      // Invalid binary data must never destroy the existing document.
      const invalidContent = Buffer.from('not a PDF');

      await assert.rejects(
        () =>
          replacePharmacyOwnerDocumentService(
            String(owner._id),
            String(original._id),
            {
              name: 'identity.pdf',
              size: invalidContent.length,
              type: 'application/pdf',
              dataUrl: `data:application/pdf;base64,${invalidContent.toString('base64')}`,
            },
            `invalid-replacement-${new Types.ObjectId().toHexString()}`
          ),
        /Document/
      );

      const unchanged = await getPharmacyOwnerDocumentContentService(
        String(owner._id),
        String(original._id)
      );

      assert.deepEqual(unchanged.content, originalContent);

      const replacement = await replacePharmacyOwnerDocumentService(
        String(owner._id),
        String(original._id),
        {
          name: 'new-identity.pdf',
          size: replacementContent.length,
          type: 'application/pdf',
          dataUrl: `data:application/pdf;base64,${replacementContent.toString('base64')}`,
        },
        `valid-replacement-${new Types.ObjectId().toHexString()}`
      );

      assert.equal(replacement.id, String(original._id));

      const downloaded = await getPharmacyOwnerDocumentContentService(
        String(owner._id),
        String(original._id)
      );

      assert.deepEqual(downloaded.content, replacementContent);
      assert.equal(downloaded.document.name, 'new-identity.pdf');

      const stored = await PharmacyOwnerDocument.findById(original._id).select(
        '+content'
      );

      assert.equal(
        stored?.sha256,
        createHash('sha256').update(replacementContent).digest('hex')
      );

      assert.equal(
        await PharmacyOwnerDocument.countDocuments({ ownerUserId: owner._id }),
        1
      );
    } finally {
      await PharmacyOwnerDocument.deleteMany({ ownerUserId: owner._id });
      await User.deleteOne({ _id: owner._id });
      await mongoose.disconnect();
    }
  }
);
