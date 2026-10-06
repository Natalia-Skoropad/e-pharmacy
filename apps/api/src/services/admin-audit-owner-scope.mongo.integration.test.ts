import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
} from '../constants/admin-audit';

import { AdminAuditLog } from '../models/adminAuditLog.model';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/password';

import {
  listAdminAuditActorsService,
  listAdminAuditLogsService,
} from './admin-audit.service';

import { updateUserProfileService } from './auth.service';

//===============================================================

const TEST_MONGODB_URI = process.env.E_PHARMACY_TEST_MONGODB_URI;
const shouldSkip = !TEST_MONGODB_URI;
const TEST_PASSWORD = 'SecurePassword123!';

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

function uniqueIdentity(prefix: string) {
  const suffix = new Types.ObjectId().toHexString();

  return {
    email: `${prefix}-${suffix}@example.com`,
    phone: `+380${suffix.slice(-9).replace(/[a-f]/gi, '1')}`,
  };
}

//===============================================================

async function cleanup(userIds: readonly Types.ObjectId[]): Promise<void> {
  const ownerIds = userIds.map(String);

  await Promise.all([
    AdminAuditLog.deleteMany({
      $or: [
        { actorUserId: { $in: userIds } },
        { entityId: { $in: ownerIds } },
        { scopeEntityId: { $in: ownerIds } },
      ],
    }),
    Pharmacy.deleteMany({ ownerId: { $in: userIds } }),
  ]);

  await User.deleteMany({ _id: { $in: userIds } });
}

//===============================================================

test(
  'owner profile changes are globally visible, owner-scoped, and actor options only include users with audit rows',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const ownerIdentity = uniqueIdentity('audit-owner-scope');
    const nextOwnerIdentity = uniqueIdentity('audit-owner-scope-next');
    const adminIdentity = uniqueIdentity('audit-owner-scope-admin');

    const [owner, admin] = await User.create([
      {
        name: 'Owner Before',
        email: ownerIdentity.email,
        phone: ownerIdentity.phone,
        password: await hashPassword(TEST_PASSWORD),
        role: 'pharmacy',
        status: 'active',
      },
      {
        name: 'Audit Admin',
        email: adminIdentity.email,
        phone: adminIdentity.phone,
        password: await hashPassword(TEST_PASSWORD),
        role: 'admin',
        status: 'active',
      },
    ]);

    try {
      await Pharmacy.create({
        ownerId: owner._id,
        managerUserIds: [],
        documents: [],
        name: 'Owner scoped pharmacy',
        status: 'new',
      });

      await updateUserProfileService(
        String(owner._id),
        {
          name: 'Owner After',
          phone: nextOwnerIdentity.phone,
          address: '12 Owner Street, Odesa',
          pictureUrl: 'https://example.com/owner-profile.png',
          expectedRevision: owner.updatedAt.toISOString(),
        },
        `owner-profile-${new Types.ObjectId().toHexString()}`
      );

      const globalActivity = await listAdminAuditLogsService({
        page: 1,
        perPage: 20,
        actorUserId: String(owner._id),
      });

      assert.deepEqual(
        new Set(globalActivity.items.map((item) => item.action)),
        new Set([
          ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_PROFILE_UPDATED,
          ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_PHOTO_UPDATED,
        ])
      );

      const ownerActivity = await listAdminAuditLogsService({
        page: 1,
        perPage: 20,
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
        scopeEntityId: String(owner._id),
      });

      assert.equal(ownerActivity.total, 2);
      assert.equal(
        ownerActivity.items.every(
          (item) =>
            item.scopeEntityType === ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER &&
            item.scopeEntityId === String(owner._id)
        ),
        true
      );

      const ownerActorActivity = await listAdminAuditLogsService({
        page: 1,
        perPage: 20,
        actorType: 'pharmacyOwner',
        actorUserId: String(owner._id),
      });

      const employeeActorActivity = await listAdminAuditLogsService({
        page: 1,
        perPage: 20,
        actorType: 'employee',
        actorUserId: String(owner._id),
      });

      assert.equal(ownerActorActivity.total, 2);
      assert.equal(employeeActorActivity.total, 0);

      const storedOwnerLogs = await AdminAuditLog.find({
        actorUserId: owner._id,
      })
        .select('action before after changedFields')
        .lean<
          Array<{
            action: string;
            before: Record<string, unknown>;
            after: Record<string, unknown>;
            changedFields: string[];
          }>
        >();

      const photoLog = storedOwnerLogs.find(
        (log) => log.action === ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_PHOTO_UPDATED
      );

      assert.ok(photoLog);
      assert.deepEqual(photoLog.before, { profilePhotoChanged: false });
      assert.deepEqual(photoLog.after, { profilePhotoChanged: true });
      assert.deepEqual(photoLog.changedFields, ['profilePhotoChanged']);
      assert.doesNotMatch(JSON.stringify(photoLog), /example\.com|pictureUrl/i);

      const actors = await listAdminAuditActorsService();
      const ownerActor = actors.items.find(
        (item) => item.id === String(owner._id)
      );
      const adminActor = actors.items.find(
        (item) => item.id === String(admin._id)
      );

      assert.equal(ownerActor?.actorType, 'pharmacyOwner');
      assert.equal(ownerActor?.role, 'pharmacy');
      assert.equal(adminActor, undefined);
    } finally {
      await cleanup([owner._id, admin._id]);
      await mongoose.disconnect();
    }
  }
);
