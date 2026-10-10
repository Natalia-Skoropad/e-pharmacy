import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose, { Types } from 'mongoose';

import { ADMIN_AUDIT_ACTIONS } from '../constants/admin-audit';
import { AdminAuditLog } from '../models/adminAuditLog.model';
import { Order } from '../models/order.model';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/password';
import { decidePharmacyModerationByAdminService } from './admin.service';

import {
  updateMyPharmacyProfileService,
  submitMyPharmacyModerationService,
} from './pharmacy.service';

//===============================================================

const mongoUri = process.env.E_PHARMACY_TEST_MONGODB_URI;

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
        ownerId,
        name: 'Moderation Test Pharmacy',
        status: 'active',
        activatedAt: new Date(),
        approvedAt: new Date(),
        documents: [],
      });

      pharmacyId = pharmacy._id;

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

      const approved = await decidePharmacyModerationByAdminService(
        pharmacyKey,
        decision(
          'approve',
          resubmitted.pharmacy.updatedAt,
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

      await assert.rejects(
        () =>
          decidePharmacyModerationByAdminService(
            pharmacyKey,
            decision('block', approved.updatedAt, `block-conflict-${marker}`),
            actorKey
          ),
        /unfinished orders/i
      );

      await Order.collection.deleteOne({ _id: orderId });

      const blocked = await decidePharmacyModerationByAdminService(
        pharmacyKey,
        decision('block', approved.updatedAt, `block-${marker}`),
        actorKey
      );

      assert.equal(blocked.status, 'blocked');
      await User.updateOne({ _id: ownerId }, { $set: { status: 'blocked' } });

      await assert.rejects(
        () =>
          decidePharmacyModerationByAdminService(
            pharmacyKey,
            decision(
              'review_reactivation',
              blocked.updatedAt,
              `blocked-owner-${marker}`
            ),
            actorKey
          ),
        /blocked or missing pharmacy owner/i
      );

      await User.updateOne({ _id: ownerId }, { $set: { status: 'active' } });

      const reactivated = await decidePharmacyModerationByAdminService(
        pharmacyKey,
        decision(
          'review_reactivation',
          blocked.updatedAt,
          `reactivate-${marker}`
        ),
        actorKey
      );

      assert.equal(reactivated.status, 'active');

      assert.equal(
        await AdminAuditLog.countDocuments({
          entityId: pharmacyKey,
          action: ADMIN_AUDIT_ACTIONS.PHARMACY_PROFILE_UPDATED,
        }),
        1
      );

      assert.equal(
        await AdminAuditLog.countDocuments({
          entityId: pharmacyKey,
          action: ADMIN_AUDIT_ACTIONS.PHARMACY_MODERATION_SUBMITTED,
        }),
        2
      );
    } finally {
      if (pharmacyId) {
        await Order.deleteMany({ pharmacyId });

        await AdminAuditLog.deleteMany({
          $or: [
            { entityId: String(pharmacyId) },
            { scopeEntityId: String(ownerId) },
          ],
        });

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
