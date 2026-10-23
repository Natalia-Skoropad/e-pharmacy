import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
} from '../../../constants/admin-audit';

import { AdminAuditLog } from '../../../models/audit/adminAuditLog.model';
import { PharmacyOwnerAdminComment } from '../../../models/admin/comments/pharmacyOwnerAdminComment.model';
import { User } from '../../../models/accounts/user.model';

import { hashPassword } from '../../../utils/password';

import {
  createPharmacyOwnerAdminCommentService,
  deletePharmacyOwnerAdminCommentService,
  listPharmacyOwnerAdminCommentsService,
} from './pharmacy-owner-admin-comment.service';

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
    phone: `+380${randomInt(100_000_000, 1_000_000_000)}`,
  };
}

//===============================================================

async function createUser(
  role: 'admin' | 'pharmacy',
  prefix: string,
  userId: Types.ObjectId
) {
  const identity = uniqueIdentity(prefix);

  return User.create({
    _id: userId,
    name: `${prefix} user`,
    email: identity.email,
    phone: identity.phone,
    password: await hashPassword(TEST_PASSWORD),
    role,
    status: 'active',
  });
}

//===============================================================

async function cleanup(userIds: readonly Types.ObjectId[]): Promise<void> {
  const stringIds = userIds.map(String);

  await Promise.all([
    PharmacyOwnerAdminComment.deleteMany({
      $or: [
        { ownerUserId: { $in: userIds } },
        { createdByAdminUserId: { $in: userIds } },
      ],
    }),

    AdminAuditLog.deleteMany({
      $or: [
        { actorUserId: { $in: userIds } },
        { scopeEntityId: { $in: stringIds } },
      ],
    }),
  ]);

  await User.deleteMany({ _id: { $in: userIds } });
}

//===============================================================

test(
  'owner admin comments are idempotent, owner-scoped, admin-visible, and delete audit preserves author/deleter/text',
  { skip: shouldSkip },

  async () => {
    await mongoose.connect(getTestMongoUri());

    // Allocate IDs first so cleanup also works if a fixture creation fails.
    const userIds = {
      ownerA: new Types.ObjectId(),
      ownerB: new Types.ObjectId(),
      creator: new Types.ObjectId(),
      deleter: new Types.ObjectId(),
    };

    const trackedUsers = Object.values(userIds);

    try {
      await PharmacyOwnerAdminComment.syncIndexes();

      // Sequential setup prevents unfinished fixture writes racing with cleanup.
      const ownerA = await createUser(
        'pharmacy',
        'owner-comment-a',
        userIds.ownerA
      );

      const ownerB = await createUser(
        'pharmacy',
        'owner-comment-b',
        userIds.ownerB
      );

      const creator = await createUser(
        'admin',
        'owner-comment-creator',
        userIds.creator
      );

      const deleter = await createUser(
        'admin',
        'owner-comment-deleter',
        userIds.deleter
      );

      const clientRequestId = randomUUID();
      const text = 'Internal verification note for this pharmacy owner.';

      const first = await createPharmacyOwnerAdminCommentService(
        String(ownerA._id),
        String(creator._id),
        { text, clientRequestId },
        randomUUID()
      );

      const replay = await createPharmacyOwnerAdminCommentService(
        String(ownerA._id),
        String(creator._id),
        { text, clientRequestId },
        randomUUID()
      );

      assert.equal(replay.id, first.id);

      assert.equal(
        await PharmacyOwnerAdminComment.countDocuments({
          ownerUserId: ownerA._id,
        }),
        1
      );

      assert.equal(
        await AdminAuditLog.countDocuments({
          action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_COMMENT_CREATED,
          entityId: first.id,
        }),
        1
      );

      const ownerAComments = await listPharmacyOwnerAdminCommentsService(
        String(ownerA._id)
      );

      const ownerBComments = await listPharmacyOwnerAdminCommentsService(
        String(ownerB._id)
      );

      assert.equal(ownerAComments.length, 1);
      assert.equal(ownerAComments[0]?.text, text);
      assert.equal(ownerAComments[0]?.author.userId, String(creator._id));
      assert.deepEqual(ownerBComments, []);

      await assert.rejects(() =>
        deletePharmacyOwnerAdminCommentService(
          String(ownerB._id),
          first.id,
          String(deleter._id),
          randomUUID()
        )
      );

      assert.equal(
        await PharmacyOwnerAdminComment.countDocuments({ _id: first.id }),
        1
      );

      await deletePharmacyOwnerAdminCommentService(
        String(ownerA._id),
        first.id,
        String(deleter._id),
        randomUUID()
      );

      assert.equal(
        await PharmacyOwnerAdminComment.countDocuments({ _id: first.id }),
        0
      );

      const deletedAudit = await AdminAuditLog.findOne({
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_COMMENT_DELETED,
        entityId: first.id,
      })
        .select(
          'actorUserId entityType scopeEntityType scopeEntityId before after'
        )

        .lean<{
          actorUserId: Types.ObjectId;
          entityType: string;
          scopeEntityType?: string;
          scopeEntityId?: string;
          before: Record<string, unknown>;
          after: Record<string, unknown>;
        } | null>();

      assert.ok(deletedAudit);
      assert.equal(String(deletedAudit.actorUserId), String(deleter._id));

      assert.equal(
        deletedAudit.entityType,
        ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER_COMMENT
      );

      assert.equal(
        deletedAudit.scopeEntityType,
        ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER
      );

      assert.equal(deletedAudit.scopeEntityId, String(ownerA._id));
      assert.equal(deletedAudit.before.text, text);

      assert.equal(
        deletedAudit.before.createdByAdminUserId,
        String(creator._id)
      );

      assert.deepEqual(deletedAudit.after, { exists: false });
    } finally {
      try {
        await cleanup(trackedUsers);
      } finally {
        await mongoose.disconnect();
      }
    }
  }
);
