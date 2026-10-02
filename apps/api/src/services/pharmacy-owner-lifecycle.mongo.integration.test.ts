import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { ADMIN_AUDIT_ACTIONS } from '../constants/admin-audit';
import { AUTH_ERROR_CODES } from '../constants/auth';
import { PHARMACY_OWNER_LIFECYCLE_ERROR_CODES } from '../constants/pharmacy-owner-lifecycle';

import { AdminAuditLog } from '../models/adminAuditLog.model';
import { Client } from '../models/client.model';
import { Order } from '../models/order.model';
import { Pharmacy } from '../models/pharmacy.model';
import { Session } from '../models/session.model';
import { User } from '../models/user.model';

import { hashPassword } from '../utils/password';

import { updatePharmacyStatusByAdminService } from './admin.service';
import { loginUserService } from './auth.service';
import { updatePharmacyOwnerStatusByAdminService } from './pharmacy-owner-lifecycle.service';

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

async function createUser(
  role: 'admin' | 'client' | 'pharmacy',
  status: 'new' | 'active' | 'blocked',
  prefix: string
) {
  const identity = uniqueIdentity(prefix);

  const user = await User.create({
    name: `${prefix} user`,
    email: identity.email,
    phone: identity.phone,
    password: await hashPassword(TEST_PASSWORD),
    role,
    status,
  });

  return { user, identity };
}

//===============================================================

async function cleanupUsersAndOwnerData(userIds: readonly Types.ObjectId[]) {
  const pharmacyIds = await Pharmacy.find({
    ownerId: { $in: userIds },
  }).distinct('_id');

  const defaultClientUsers = await User.find({
    defaultClientPharmacyId: { $in: pharmacyIds },
    isDefaultPharmacyClient: true,
  })
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();

  const allUserIds = [
    ...userIds,
    ...defaultClientUsers.map((user) => user._id),
  ];

  await Promise.all([
    Order.deleteMany({
      $or: [
        { pharmacyId: { $in: pharmacyIds } },
        { userId: { $in: allUserIds } },
      ],
    }),
    Client.deleteMany({ userId: { $in: allUserIds } }),
    Session.deleteMany({ userId: { $in: allUserIds } }),

    AdminAuditLog.deleteMany({
      $or: [
        { actorUserId: { $in: allUserIds } },
        { entityId: { $in: userIds.map(String) } },
        { entityId: { $in: pharmacyIds.map(String) } },
      ],
    }),

    Pharmacy.deleteMany({ _id: { $in: pharmacyIds } }),
  ]);

  await User.deleteMany({ _id: { $in: allUserIds } });
}

//===============================================================

function createActiveOrder(
  pharmacyId: Types.ObjectId,
  clientUserId: Types.ObjectId,
  status: 'new' | 'in_progress'
) {
  const productId = new Types.ObjectId();
  const productOfferId = new Types.ObjectId();

  return Order.create({
    pharmacyId,
    userId: clientUserId,
    pharmacySnapshot: { name: 'Owner lifecycle pharmacy' },
    items: [
      {
        productId,
        productOfferId,
        productSnapshot: {
          name: 'Owner lifecycle product',
          article: `OWNER-${productId.toHexString()}`,
        },
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100,
      },
    ],
    totalItems: 1,
    totalPrice: 100,
    currency: '₴',
    paymentMethod: 'cash',
    delivery: { method: 'pickup' },
    status,
    statusHistory: [],
    activityHistory: [],
    managerComments: [],
    orderNumber: `OWNER-${new Types.ObjectId().toHexString()}`,
    createdByType: 'client',
  });
}

//===============================================================

test(
  'first pharmacy activation activates a new owner once and second activation does not duplicate the owner event',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const { user: owner } = await createUser(
      'pharmacy',
      'new',
      'owner-auto-activation'
    );

    const { user: admin } = await createUser(
      'admin',
      'active',
      'owner-auto-activation-admin'
    );

    try {
      const [firstPharmacy, secondPharmacy] = await Pharmacy.create([
        {
          ownerId: owner._id,
          managerUserIds: [],
          documents: [],
          name: 'Owner lifecycle first pharmacy',
          status: 'on_moderation',
        },
        {
          ownerId: owner._id,
          managerUserIds: [],
          documents: [],
          name: 'Owner lifecycle second pharmacy',
          status: 'on_moderation',
        },
      ]);

      await updatePharmacyStatusByAdminService(
        String(firstPharmacy._id),
        { status: 'active' },
        String(admin._id),
        `owner-auto-first-${new Types.ObjectId().toHexString()}`
      );

      assert.equal(
        (await User.findById(owner._id).select('status').lean())?.status,
        'active'
      );

      assert.equal(
        await AdminAuditLog.countDocuments({
          action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_STATUS_CHANGED,
          entityId: String(owner._id),
        }),
        1
      );

      await updatePharmacyStatusByAdminService(
        String(secondPharmacy._id),
        { status: 'active' },
        String(admin._id),
        `owner-auto-second-${new Types.ObjectId().toHexString()}`
      );

      assert.equal(
        await AdminAuditLog.countDocuments({
          action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_STATUS_CHANGED,
          entityId: String(owner._id),
        }),
        1
      );
    } finally {
      await cleanupUsersAndOwnerData([owner._id, admin._id]);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test('new pharmacy owner can authenticate', { skip: shouldSkip }, async () => {
  await mongoose.connect(getTestMongoUri());

  const { user: owner, identity } = await createUser(
    'pharmacy',
    'new',
    'new-owner-login'
  );

  try {
    const auth = await loginUserService({
      email: identity.email,
      password: TEST_PASSWORD,
      application: 'pharmacy',
    });

    assert.equal(auth.user.role, 'pharmacy');
    assert.equal(auth.user.status, 'new');
  } finally {
    await cleanupUsersAndOwnerData([owner._id]);
    await mongoose.disconnect();
  }
});

//===============================================================

test(
  'owner with active order cannot be blocked; after orders clear blocking revokes sessions and cascades to every pharmacy while reactivation leaves pharmacies blocked',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const { user: owner, identity: ownerIdentity } = await createUser(
      'pharmacy',
      'active',
      'owner-manual-lifecycle'
    );

    const { user: admin } = await createUser(
      'admin',
      'active',
      'owner-manual-lifecycle-admin'
    );

    const { user: client } = await createUser(
      'client',
      'active',
      'owner-manual-lifecycle-client'
    );

    try {
      const [firstPharmacy, secondPharmacy] = await Pharmacy.create([
        {
          ownerId: owner._id,
          managerUserIds: [],
          documents: [],
          name: 'Owner lifecycle active pharmacy',
          status: 'active',
        },
        {
          ownerId: owner._id,
          managerUserIds: [],
          documents: [],
          name: 'Owner lifecycle moderation pharmacy',
          status: 'on_moderation',
        },
      ]);

      const auth = await loginUserService({
        email: ownerIdentity.email,
        password: TEST_PASSWORD,
        application: 'pharmacy',
      });

      const activeSession = await Session.findOne({
        userId: owner._id,
        revokedAt: undefined,
      });
      assert.ok(activeSession);

      const order = await createActiveOrder(
        secondPharmacy._id,
        client._id,
        'in_progress'
      );

      await assert.rejects(
        () =>
          updatePharmacyOwnerStatusByAdminService(
            String(owner._id),
            { status: 'blocked', reason: 'Compliance review.' },
            String(admin._id),
            `owner-block-guard-${new Types.ObjectId().toHexString()}`
          ),
        (error: unknown) =>
          error instanceof Error &&
          'code' in error &&
          error.code === PHARMACY_OWNER_LIFECYCLE_ERROR_CODES.HAS_ACTIVE_ORDERS
      );

      assert.equal(
        (await User.findById(owner._id).select('status').lean())?.status,
        'active'
      );

      assert.equal(
        (await Pharmacy.findById(firstPharmacy._id).select('status').lean())
          ?.status,
        'active'
      );

      assert.equal(
        (await Session.findById(activeSession._id).lean())?.revokedAt,
        undefined
      );

      await Order.deleteOne({ _id: order._id });

      const blocked = await updatePharmacyOwnerStatusByAdminService(
        String(owner._id),
        { status: 'blocked', reason: 'Compliance review.' },
        String(admin._id),
        `owner-block-${new Types.ObjectId().toHexString()}`
      );

      assert.equal(blocked.status, 'blocked');
      assert.equal(blocked.blockedPharmacies, 2);

      const [blockedOwner, linkedPharmacies, revokedSession] =
        await Promise.all([
          User.findById(owner._id).select('status').lean(),
          Pharmacy.find({ ownerId: owner._id })
            .select('status')
            .sort({ _id: 1 })
            .lean(),
          Session.findById(activeSession._id).lean(),
        ]);

      assert.equal(blockedOwner?.status, 'blocked');

      assert.deepEqual(
        linkedPharmacies.map((pharmacy) => pharmacy.status),
        ['blocked', 'blocked']
      );

      assert.ok(revokedSession?.revokedAt);
      assert.equal(revokedSession?.revokedReason, 'user_blocked');

      await assert.rejects(
        () =>
          loginUserService({
            email: ownerIdentity.email,
            password: TEST_PASSWORD,
            application: 'pharmacy',
          }),
        (error: unknown) =>
          error instanceof Error &&
          'code' in error &&
          error.code === AUTH_ERROR_CODES.USER_BLOCKED
      );

      const reactivated = await updatePharmacyOwnerStatusByAdminService(
        String(owner._id),
        { status: 'active', reason: 'Compliance review completed.' },
        String(admin._id),
        `owner-reactivate-${new Types.ObjectId().toHexString()}`
      );

      assert.equal(reactivated.status, 'active');
      assert.equal(reactivated.blockedPharmacies, 0);
      assert.equal(
        (await User.findById(owner._id).select('status').lean())?.status,
        'active'
      );

      assert.deepEqual(
        (
          await Pharmacy.find({ ownerId: owner._id })
            .select('status')
            .sort({ _id: 1 })
            .lean()
        ).map((pharmacy) => pharmacy.status),
        ['blocked', 'blocked']
      );

      // The initial login result is deliberately referenced so the compiler
      // verifies the new-owner/active-owner auth result remains a valid shape.
      assert.equal(auth.user.id, String(owner._id));
    } finally {
      await cleanupUsersAndOwnerData([owner._id, admin._id, client._id]);
      await mongoose.disconnect();
    }
  }
);
