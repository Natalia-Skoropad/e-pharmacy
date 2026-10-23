import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import mongoose, { Types } from 'mongoose';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PharmacyDocumentFile } from '../../models/pharmacies/pharmacyDocumentFile.model';
import { PharmacyOwnerDocument } from '../../models/owners/pharmacyOwnerDocument.model';
import { User } from '../../models/accounts/user.model';

import { migratePharmacyOwnerRegistrationDocuments } from './pharmacy-owner-documents-migration.service';

//===============================================================

const uri = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===============================================================

test(
  'registration migration copies only proven, valid source files; re-running is idempotent and never removes pharmacy originals',
  { skip: !uri },

  async () => {
    if (!uri) return;

    await mongoose.connect(uri);

    const ownerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();
    const validId = new Types.ObjectId();
    const unrelatedId = new Types.ObjectId();
    const sessionId = new Types.ObjectId();
    const validContent = Buffer.from('%PDF-1.4 valid legacy registration');
    const unrelatedContent = Buffer.from('%PDF-1.4 pharmacy-specific file');

    const sha = (content: Buffer) =>
      createHash('sha256').update(content).digest('hex');

    try {
      await User.create({
        _id: ownerId,
        name: 'Historical Owner',
        email: `registration-migration-${ownerId}@example.com`,
        phone: '+380991234567',
        password: 'integration-test-password-hash',
        role: 'pharmacy',
        status: 'active',
      });

      await Pharmacy.create({
        _id: pharmacyId,
        ownerId,
        name: 'Historical Registration Pharmacy',
        status: 'new',

        documents: [
          {
            id: String(validId),
            name: 'registration.pdf',
            size: validContent.length,
            type: 'application/pdf',
            sha256: sha(validContent),
            uploadedAt: new Date().toISOString(),
          },
        ],
      });

      await PharmacyDocumentFile.create([
        {
          _id: validId,
          name: 'registration.pdf',
          size: validContent.length,
          type: 'application/pdf',
          sha256: sha(validContent),
          content: validContent,
          registrationUploadSessionId: sessionId,
          pharmacyId,
          uploadedByUserId: ownerId,
          attachedAt: new Date(),
        },

        {
          _id: unrelatedId,
          name: 'license.pdf',
          size: unrelatedContent.length,
          type: 'application/pdf',
          sha256: sha(unrelatedContent),
          content: unrelatedContent,
          pharmacyId,
          uploadedByUserId: ownerId,
          attachedAt: new Date(),
        },
      ]);

      const preview = await migratePharmacyOwnerRegistrationDocuments(false);

      assert.equal(preview.eligible, 1);

      assert.equal(
        await PharmacyOwnerDocument.countDocuments({ ownerUserId: ownerId }),
        0
      );

      const first = await migratePharmacyOwnerRegistrationDocuments(true);

      assert.equal(first.copied, 1);

      const second = await migratePharmacyOwnerRegistrationDocuments(true);

      assert.equal(second.alreadyCopied, 1);
      assert.equal(second.copied, 0);

      const ownerDoc =
        await PharmacyOwnerDocument.findById(validId).select('+content');

      assert.equal(String(ownerDoc?.ownerUserId), String(ownerId));

      assert.equal(
        String(ownerDoc?.registrationSourcePharmacyId),
        String(pharmacyId)
      );

      assert.ok(ownerDoc?.content?.equals(validContent));

      assert.ok(
        await PharmacyDocumentFile.exists({ _id: validId, pharmacyId })
      );

      assert.equal(
        await PharmacyOwnerDocument.exists({ _id: unrelatedId }),
        null
      );
    } finally {
      await PharmacyOwnerDocument.deleteMany({ ownerUserId: ownerId });

      await PharmacyDocumentFile.deleteMany({
        _id: { $in: [validId, unrelatedId] },
      });

      await Pharmacy.deleteMany({ _id: pharmacyId });
      await User.deleteMany({ _id: ownerId });
      await mongoose.disconnect();
    }
  }
);
