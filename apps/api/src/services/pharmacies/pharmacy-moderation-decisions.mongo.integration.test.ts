import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import mongoose, { Types } from 'mongoose';

import { ADMIN_AUDIT_ACTIONS } from '../../constants/admin/audit/admin-audit';

import { AdminAuditLog } from '../../models/audit/adminAuditLog.model';
import { Order } from '../../models/orders/order.model';
import { User } from '../../models/accounts/user.model';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PharmacyPaymentIdentifier } from '../../models/pharmacies/pharmacyPaymentIdentifier.model';
import { PharmacyOwnerDocument } from '../../models/owners/pharmacyOwnerDocument.model';

import { hashPassword } from '../../utils/auth/password';
import { decidePharmacyModerationByAdminService } from '../admin/pharmacies/admin.service';

import { moderationReadyPharmacyFields } from '../__tests__/fixtures/pharmacy-moderation-ready.helper';

import { updateMyPharmacyProfileService } from './pharmacy-owner-profile.service';
import { submitMyPharmacyModerationService } from './pharmacy-moderation.service';
import { requestOwnedPharmacyReactivationService } from './pharmacy-owner-reactivation.service';

import {
  getPharmaciesService,
  getPharmacyDetailsService,
} from './pharmacy-public-catalog.service';

//===============================================================

const mongoUri = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===============================================================

const decision = (
  action: 'approve' | 'request_corrections' | 'block' | 'review_reactivation',
  expectedRevision: string,
  clientRequestId: string,
  reason = 'Administrative review of pharmacy data'
) => ({ action, expectedRevision, clientRequestId, reason });

//===============================================================

test(
  'transactional moderation: corrections, owner audit, approval, block, idempotency, CAS and reactivation',
  { skip: !mongoUri },

  async () => {
    await mongoose.connect(mongoUri!);

    const marker = new Types.ObjectId().toHexString();
    const password = await hashPassword('SecurePassword123!');
    const digits = marker.replace(/[a-f]/gi, '1').slice(-7);

    let ownerId: Types.ObjectId | undefined;
    let adminId: Types.ObjectId | undefined;
    let pharmacyId: Types.ObjectId | undefined;
    let neverActivatedPharmacyId: Types.ObjectId | undefined;

    try {
      const owner = await User.create({
        name: 'Moderation Owner',
        role: 'pharmacy',
        status: 'active',
        password,
        email: `mod-owner-${marker}@example.com`,
        phone: `+38050${digits}`,
      });

      const admin = await User.create({
        name: 'Moderation Admin',
        role: 'admin',
        status: 'active',
        password,
        email: `mod-admin-${marker}@example.com`,
        phone: `+38067${digits}`,
      });

      ownerId = owner._id;
      adminId = admin._id;

      const pharmacy = await Pharmacy.create({
        ...moderationReadyPharmacyFields({
          email: owner.email,
          phone: owner.phone,
        }),

        ownerId,
        name: 'Moderation Test Pharmacy',
        status: 'active',
        activatedAt: new Date(),
        approvedAt: new Date(),
      });

      pharmacyId = pharmacy._id;

      const ownerDocumentContent = Buffer.from(
        '%PDF-1.4 owner registration evidence'
      );

      await PharmacyOwnerDocument.create({
        ownerUserId: ownerId,
        uploadedByUserId: ownerId,
        name: 'owner-registration.pdf',
        size: ownerDocumentContent.length,
        type: 'application/pdf',
        sha256: createHash('sha256').update(ownerDocumentContent).digest('hex'),
        content: ownerDocumentContent,
      });

      const pharmacyKey = String(pharmacyId);
      const actorKey = String(adminId);
      const ownerKey = String(ownerId);

      const drafted = await updateMyPharmacyProfileService(
        ownerKey,
        {
          name: 'Updated Moderation Pharmacy',
          expectedRevision: pharmacy.updatedAt.toISOString(),
        },
        `profile-${marker}`
      );

      assert.equal(drafted.pharmacy.name, 'Moderation Test Pharmacy');

      assert.equal(
        drafted.pharmacy.pendingModeration?.name,
        'Updated Moderation Pharmacy'
      );

      const submitted = await submitMyPharmacyModerationService(
        ownerKey,
        {
          changes: {},
          expectedRevision: drafted.pharmacy.updatedAt,
        },
        `submit-${marker}`
      );

      assert.equal(submitted.pharmacy.status, 'on_moderation');

      const keyCorrections = `corrections-${marker}`;

      const correctionsInput = decision(
        'request_corrections',
        submitted.pharmacy.updatedAt,
        keyCorrections
      );

      const corrections = await decidePharmacyModerationByAdminService(
        pharmacyKey,
        correctionsInput,
        actorKey
      );

      assert.equal(corrections.status, 'on_moderation');
      assert.equal(corrections.reviewState, 'changes_requested');

      const replay = await decidePharmacyModerationByAdminService(
        pharmacyKey,
        correctionsInput,
        actorKey
      );

      assert.equal(replay.updatedAt, corrections.updatedAt);

      assert.equal(
        await AdminAuditLog.countDocuments({ mutationKey: keyCorrections }),
        1
      );

      await assert.rejects(
        () =>
          decidePharmacyModerationByAdminService(
            pharmacyKey,

            decision(
              'approve',
              submitted.pharmacy.updatedAt,
              `stale-${marker}`
            ),

            actorKey
          ),
        /changed|Refresh/i
      );

      const resubmitted = await submitMyPharmacyModerationService(
        ownerKey,
        {
          changes: {},
          expectedRevision: corrections.updatedAt,
        },
        `resubmit-${marker}`
      );

      assert.equal(resubmitted.pharmacy.reviewState, 'pending');

      // Regression: requesting corrections for a second time must be a new
      // pending → changes_requested review decision even when the main
      // pharmacy status stays On moderation throughout the whole cycle.
      const secondCorrections = await decidePharmacyModerationByAdminService(
        pharmacyKey,

        decision(
          'request_corrections',
          resubmitted.pharmacy.updatedAt,
          `corrections-again-${marker}`,
          'Replace the incorrect documents before resubmitting.'
        ),

        actorKey
      );

      assert.equal(secondCorrections.status, 'on_moderation');
      assert.equal(secondCorrections.reviewState, 'changes_requested');

      const lastCorrectionsAudit = await AdminAuditLog.findOne({
        mutationKey: `corrections-again-${marker}`,
      });

      assert.equal(lastCorrectionsAudit?.before?.reviewState, 'pending');

      assert.equal(
        lastCorrectionsAudit?.after?.reviewState,
        'changes_requested'
      );

      assert.equal(lastCorrectionsAudit?.before?.status, 'on_moderation');
      assert.equal(lastCorrectionsAudit?.after?.status, 'on_moderation');

      const submittedAgain = await submitMyPharmacyModerationService(
        ownerKey,
        {
          changes: {},
          expectedRevision: secondCorrections.updatedAt,
        },
        `resubmit-again-${marker}`
      );

      assert.equal(submittedAgain.pharmacy.reviewState, 'pending');

      const approved = await decidePharmacyModerationByAdminService(
        pharmacyKey,

        decision(
          'approve',
          submittedAgain.pharmacy.updatedAt,
          `approve-${marker}`
        ),

        actorKey
      );

      assert.equal(approved.name, 'Updated Moderation Pharmacy');
      assert.equal(approved.pendingModeration, undefined);
      assert.equal(approved.status, 'active');

      // Raw order fixture isolates moderation guard without depending on order checkout.
      const orderId = new Types.ObjectId();

      await Order.collection.insertOne({
        _id: orderId,
        pharmacyId,
        status: 'new',
      });

      // Emergency Admin blocking remains available even with unfinished
      // orders. These orders are retained for supervised resolution.
      const blocked = await decidePharmacyModerationByAdminService(
        pharmacyKey,
        decision('block', approved.updatedAt, `block-${marker}`),
        actorKey
      );

      assert.equal(blocked.status, 'blocked');
      assert.ok(await Order.exists({ _id: orderId, pharmacyId }));

      await Order.collection.deleteOne({ _id: orderId });

      // A direct Admin approval without an Owner-submitted snapshot is forbidden.
      await assert.rejects(
        () =>
          decidePharmacyModerationByAdminService(
            pharmacyKey,
            decision(
              'review_reactivation',
              blocked.updatedAt,
              `direct-${marker}`
            ),
            actorKey
          ),
        /submitted owner request/i
      );

      await User.updateOne({ _id: ownerId }, { $set: { status: 'blocked' } });

      await assert.rejects(
        () =>
          requestOwnedPharmacyReactivationService(
            ownerKey,
            pharmacyKey,
            {
              reason: 'Owner cannot send while account blocked.',
              expectedRevision: blocked.updatedAt,
            },
            `blocked-owner-${marker}`
          ),
        /blocked or unavailable/i
      );

      await User.updateOne({ _id: ownerId }, { $set: { status: 'active' } });

      const requested = await requestOwnedPharmacyReactivationService(
        ownerKey,
        pharmacyKey,
        {
          reason: 'All pharmacy data is ready for reactivation.',
          expectedRevision: blocked.updatedAt,
        },
        `request-reactivate-${marker}`
      );

      assert.equal(requested.pharmacy.status, 'on_reactivation');
      assert.equal(requested.pharmacy.reviewState, 'pending');

      const needsChanges = await decidePharmacyModerationByAdminService(
        pharmacyKey,

        decision(
          'request_corrections',
          requested.pharmacy.updatedAt,
          `reactivate-corrections-${marker}`
        ),

        actorKey
      );

      assert.equal(needsChanges.status, 'on_reactivation');
      assert.equal(needsChanges.reviewState, 'changes_requested');

      // The owner can edit the unpublished draft again only after corrections.
      const corrected = await updateMyPharmacyProfileService(
        ownerKey,
        {
          name: 'Reviewed Reactivated Pharmacy',
          expectedRevision: needsChanges.updatedAt,
        },
        `reactivation-draft-${marker}`,
        pharmacyKey
      );

      const unchangedPublished = await Pharmacy.findById(pharmacyId);

      assert.equal(unchangedPublished?.name, 'Updated Moderation Pharmacy');

      assert.equal(
        corrected.pharmacy.pendingModeration?.name,
        'Reviewed Reactivated Pharmacy'
      );

      const resent = await requestOwnedPharmacyReactivationService(
        ownerKey,
        pharmacyKey,
        {
          reason: 'Corrected pharmacy information.',
          expectedRevision: corrected.pharmacy.updatedAt,
        },
        `reactivation-resubmit-${marker}`
      );

      assert.equal(resent.pharmacy.status, 'on_reactivation');
      assert.equal(resent.pharmacy.reviewState, 'pending');

      const reactivated = await decidePharmacyModerationByAdminService(
        pharmacyKey,

        decision(
          'review_reactivation',
          resent.pharmacy.updatedAt,
          `reactivate-${marker}`
        ),

        actorKey
      );

      assert.equal(reactivated.status, 'active');
      assert.equal(reactivated.name, 'Reviewed Reactivated Pharmacy');
      assert.equal(reactivated.pendingModeration, undefined);

      // Reactivation must clear block/review markers in the persisted record,
      // not merely display an Active badge in the Owner/Admin UI.
      const publishedAfterReactivation = await Pharmacy.findById(pharmacyId);

      assert.equal(publishedAfterReactivation?.status, 'active');
      assert.equal(publishedAfterReactivation?.reviewState, undefined);
      assert.equal(publishedAfterReactivation?.pendingModeration, undefined);
      assert.equal(publishedAfterReactivation?.blockSource, undefined);
      assert.equal(publishedAfterReactivation?.statusReason, undefined);
      assert.ok(publishedAfterReactivation?.activatedAt);
      assert.ok(publishedAfterReactivation?.approvedAt);

      // Public list and public detail use the same record immediately after
      // transaction commit. A pharmacy with no offers must still be visible.
      const publicList = await getPharmaciesService({
        page: 1,
        perPage: 24,
        pharmacyId: pharmacyKey,
        sort: 'newest',
      });

      assert.equal(publicList.total, 1);
      assert.equal(publicList.items[0]?.id, pharmacyKey);

      const publicDetail = await getPharmacyDetailsService(pharmacyKey);

      assert.equal(publicDetail.pharmacy.id, pharmacyKey);

      // A never-activated blocked pharmacy is independently reviewed and
      // becomes Active only after its owner submits a complete application.
      const firstPharmacy = await Pharmacy.create({
        ...moderationReadyPharmacyFields({
          email: `first-reactivation-${marker}@example.com`,
          phone: `+38063${digits}`,
        }),

        ownerId,
        name: 'First Reactivation Pharmacy',
        status: 'blocked',
        blockSource: 'admin_blocked',
      });

      neverActivatedPharmacyId = firstPharmacy._id;

      const firstKey = String(firstPharmacy._id);

      const firstRequest = await requestOwnedPharmacyReactivationService(
        ownerKey,
        firstKey,
        {
          reason: 'Complete pharmacy and owner documents attached.',
          expectedRevision: firstPharmacy.updatedAt.toISOString(),
        },
        `first-request-${marker}`
      );

      assert.equal(firstRequest.pharmacy.status, 'on_reactivation');

      const firstApproval = await decidePharmacyModerationByAdminService(
        firstKey,

        decision(
          'review_reactivation',
          firstRequest.pharmacy.updatedAt,
          `first-approve-${marker}`
        ),

        actorKey
      );

      assert.equal(firstApproval.status, 'active');

      const firstActiveRecord = await Pharmacy.findById(firstPharmacy._id);

      assert.ok(firstActiveRecord?.activatedAt);

      assert.ok(
        await User.exists({ defaultClientPharmacyId: firstPharmacy._id })
      );

      assert.equal(
        await AdminAuditLog.countDocuments({
          entityId: pharmacyKey,
          action: ADMIN_AUDIT_ACTIONS.PHARMACY_PROFILE_UPDATED,
        }),
        2
      );

      assert.equal(
        await AdminAuditLog.countDocuments({
          entityId: pharmacyKey,
          action: ADMIN_AUDIT_ACTIONS.PHARMACY_MODERATION_SUBMITTED,
        }),
        3 // Initial submission and two resubmissions after corrections.
      );
    } finally {
      if (neverActivatedPharmacyId) {
        await PharmacyPaymentIdentifier.deleteMany({
          pharmacyId: neverActivatedPharmacyId,
        });

        await User.deleteMany({
          defaultClientPharmacyId: neverActivatedPharmacyId,
        });

        await Pharmacy.deleteOne({ _id: neverActivatedPharmacyId });
      }

      if (pharmacyId) {
        await Order.deleteMany({ pharmacyId });

        await AdminAuditLog.deleteMany({
          $or: [
            { entityId: String(pharmacyId) },
            { scopeEntityId: String(ownerId) },
          ],
        });

        await PharmacyPaymentIdentifier.deleteMany({ pharmacyId });
        await PharmacyOwnerDocument.deleteMany({ ownerUserId: ownerId });
        await Pharmacy.deleteOne({ _id: pharmacyId });
        await User.deleteMany({ defaultClientPharmacyId: pharmacyId });
      }
      if (adminId || ownerId)
        await User.deleteMany({
          _id: { $in: [adminId, ownerId].filter(Boolean) },
        });

      await mongoose.disconnect();
    }
  }
);
