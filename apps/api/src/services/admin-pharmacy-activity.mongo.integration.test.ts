import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose, { Types } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_SECTIONS,
  type AdminAuditAction,
  type AdminAuditSection,
} from '../constants/admin-audit';

import { AdminAuditLog } from '../models/adminAuditLog.model';
import type { AdminAuditLogEntity } from '../types/admin-audit';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';

import {
  getAdminPharmacyActivityDetailsService,
  listAdminPharmacyActivityActorsService,
  listAdminPharmacyActivityService,
} from './admin-pharmacy-activity.service';

import { listAdminAuditLogsService } from './admin-audit.service';

//===============================================================

const uri = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===============================================================

test(
  'Stage 14.7: same-owner pharmacies have isolated activity, facets and details while Owner Activity still sees both',
  { skip: !uri },
  async () => {
    await mongoose.connect(uri!);
    const ownerId = new Types.ObjectId();
    const pharmacyA = new Types.ObjectId();
    const pharmacyB = new Types.ObjectId();
    const reviewerId = new Types.ObjectId();
    const legacyCommentId = new Types.ObjectId();
    const recordedIds: Types.ObjectId[] = [];

    const createLog = (payload: {
      pharmacyId?: string;
      entityType: 'pharmacy' | 'pharmacyAdminComment' | 'pharmacyOwner';
      entityId: string;
      scopeEntityType: 'pharmacyOwner' | 'pharmacy';
      scopeEntityId: string;
      action: AdminAuditAction;
      section?: AdminAuditSection;
    }): AdminAuditLogEntity & { _id: Types.ObjectId } => {
      const _id = new Types.ObjectId();
      recordedIds.push(_id);

      return {
        _id,
        actorUserId: reviewerId,
        actorNameSnapshot: 'Reviewer at the time',
        entityLabelSnapshot: payload.entityType,
        before: {},
        after: { changed: true },
        changedFields: ['changed'],
        requestId: String(_id),
        createdAt: new Date(),
        ...payload,
        section: payload.section ?? ADMIN_AUDIT_SECTIONS.PHARMACIES,
      };
    };

    try {
      await User.collection.insertMany([
        {
          _id: ownerId,
          role: 'pharmacy',
          name: 'Owner',
          email: `owner-${ownerId.toHexString()}@example.com`,

          phone: `+38050${String(
            Number.parseInt(ownerId.toHexString().slice(-6), 16) % 10_000_000
          ).padStart(7, '0')}`,

          status: 'active',
        },
        {
          _id: reviewerId,
          role: 'admin',
          name: 'Reviewer',
          email: `reviewer-${reviewerId.toHexString()}@example.com`,

          phone: `+38067${String(
            Number.parseInt(reviewerId.toHexString().slice(-6), 16) % 10_000_000
          ).padStart(7, '0')}`,

          status: 'active',
        },
      ]);

      await Pharmacy.collection.insertMany([
        { _id: pharmacyA, ownerId, name: 'A', status: 'new' },
        { _id: pharmacyB, ownerId, name: 'B', status: 'new' },
      ]);

      const auditA = createLog({
        entityType: 'pharmacy',
        entityId: String(pharmacyA),
        scopeEntityType: 'pharmacyOwner',
        scopeEntityId: String(ownerId),
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_REACTIVATION_REVIEWED,
      });

      const auditB = createLog({
        entityType: 'pharmacy',
        entityId: String(pharmacyB),
        scopeEntityType: 'pharmacyOwner',
        scopeEntityId: String(ownerId),
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_PROFILE_UPDATED,
      });

      const commentA = createLog({
        entityType: 'pharmacyAdminComment',
        entityId: String(legacyCommentId),
        scopeEntityType: 'pharmacy',
        scopeEntityId: String(pharmacyA),
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_COMMENT_CREATED,
      });

      const commentB = createLog({
        entityType: 'pharmacyAdminComment',
        entityId: String(new Types.ObjectId()),
        scopeEntityType: 'pharmacy',
        scopeEntityId: String(pharmacyB),
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_COMMENT_DELETED,
      });

      const ownerOnly = createLog({
        entityType: 'pharmacyOwner',
        entityId: String(ownerId),
        scopeEntityType: 'pharmacyOwner',
        scopeEntityId: String(ownerId),
        section: 'pharmacyOwners',
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_PROFILE_UPDATED,
      });

      const modernA = createLog({
        pharmacyId: String(pharmacyA),
        entityType: 'pharmacyAdminComment',
        entityId: String(new Types.ObjectId()),
        scopeEntityType: 'pharmacyOwner',
        scopeEntityId: String(ownerId),
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_COMMENT_CREATED,
      });

      await AdminAuditLog.collection.insertMany([
        auditA,
        auditB,
        commentA,
        commentB,
        ownerOnly,
        modernA,
      ]);

      const a = await listAdminPharmacyActivityService(String(pharmacyA), {
        page: 1,
        perPage: 20,
      });

      const b = await listAdminPharmacyActivityService(String(pharmacyB), {
        page: 1,
        perPage: 20,
      });

      assert.deepEqual(
        new Set(a.items.map((item) => item.id)),
        new Set([String(auditA._id), String(commentA._id), String(modernA._id)])
      );

      assert.deepEqual(
        new Set(b.items.map((item) => item.id)),
        new Set([String(auditB._id), String(commentB._id)])
      );

      assert.deepEqual(
        new Set(a.availableActions),

        new Set([
          ADMIN_AUDIT_ACTIONS.PHARMACY_REACTIVATION_REVIEWED,
          ADMIN_AUDIT_ACTIONS.PHARMACY_COMMENT_CREATED,
        ])
      );

      const actorsA = await listAdminPharmacyActivityActorsService(
        String(pharmacyA)
      );

      assert.deepEqual(
        actorsA.items.map((actor) => actor.id),
        [String(reviewerId)]
      );

      const secondPage = await listAdminPharmacyActivityService(
        String(pharmacyA),
        {
          page: 2,
          perPage: 20,
        }
      );

      assert.equal(secondPage.items.length, 0);
      assert.equal(secondPage.total, 3);
      assert.equal(a.total, 3);
      assert.equal(a.totalPages, 1);
      assert.equal(a.availableSections.includes('pharmacyOwners'), false);
      assert.equal(a.earliestCreatedAt, new Date().toISOString().slice(0, 10));

      const filtered = await listAdminPharmacyActivityService(
        String(pharmacyA),
        {
          page: 1,
          perPage: 20,
          action: ADMIN_AUDIT_ACTIONS.PHARMACY_REACTIVATION_REVIEWED,
        }
      );

      assert.deepEqual(
        filtered.items.map((item) => item.id),
        [String(auditA._id)]
      );

      assert.equal(
        (
          await getAdminPharmacyActivityDetailsService(
            String(pharmacyA),
            String(commentA._id)
          )
        ).entityId,
        String(legacyCommentId)
      );

      await assert.rejects(
        getAdminPharmacyActivityDetailsService(
          String(pharmacyA),
          String(auditB._id)
        ),

        (error: unknown) =>
          error instanceof Error && 'status' in error && error.status === 404
      );

      await assert.rejects(
        getAdminPharmacyActivityDetailsService(
          String(pharmacyA),
          String(ownerOnly._id)
        ),

        (error: unknown) =>
          error instanceof Error && 'status' in error && error.status === 404
      );

      const ownerActivity = await listAdminAuditLogsService({
        page: 1,
        perPage: 20,
        scopeEntityType: 'pharmacyOwner',
        scopeEntityId: String(ownerId),
      });

      assert.equal(
        ownerActivity.items.some((item) => item.id === String(auditA._id)),
        true
      );

      assert.equal(
        ownerActivity.items.some((item) => item.id === String(auditB._id)),
        true
      );

      assert.equal(
        ownerActivity.items.some((item) => item.id === String(ownerOnly._id)),
        true
      );

      await assert.rejects(
        listAdminPharmacyActivityService(String(new Types.ObjectId()), {
          page: 1,
          perPage: 20,
        }),

        (error: unknown) =>
          error instanceof Error && 'status' in error && error.status === 404
      );
    } finally {
      await AdminAuditLog.collection.deleteMany({ _id: { $in: recordedIds } });

      await Pharmacy.collection.deleteMany({
        _id: { $in: [pharmacyA, pharmacyB] },
      });

      await User.collection.deleteMany({ _id: { $in: [ownerId, reviewerId] } });
      await mongoose.disconnect();
    }
  }
);
