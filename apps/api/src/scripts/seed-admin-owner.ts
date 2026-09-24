import mongoose from 'mongoose';

import { ADMIN_ACCESS_STATUSES } from '../constants/admin-access';
import { USER_ROLES, USER_STATUSES } from '../constants/auth';
import { connectDB } from '../db/connectDB';
import { AdminAccess } from '../models/adminAccess.model';
import { AdminAuthorizationState } from '../models/adminAuthorizationState.model';
import { User } from '../models/user.model';
import { adminOwnerBootstrapSchema } from '../schemas/admin-bootstrap.schema';
import { hashPassword } from '../utils/password';

//===============================================================

function readBootstrapInput() {
  const result = adminOwnerBootstrapSchema.safeParse({
    name: process.env.ADMIN_OWNER_NAME,
    email: process.env.ADMIN_OWNER_EMAIL,
    password: process.env.ADMIN_OWNER_PASSWORD,
    phone: process.env.ADMIN_OWNER_PHONE,
    address: process.env.ADMIN_OWNER_ADDRESS,
  });

  if (!result.success) {
    const envNamesByField: Readonly<Record<string, string>> = {
      name: 'ADMIN_OWNER_NAME',
      email: 'ADMIN_OWNER_EMAIL',
      password: 'ADMIN_OWNER_PASSWORD',
      phone: 'ADMIN_OWNER_PHONE',
      address: 'ADMIN_OWNER_ADDRESS',
    };

    const issueLines = result.error.issues.map((issue) => {
      const field = String(issue.path[0] ?? '');
      const envName = envNamesByField[field] ?? 'ADMIN_OWNER_*';
      return `- ${envName}: ${issue.message}`;
    });

    const details = issueLines.length > 0 ? `\n${issueLines.join('\n')}` : '';

    throw new Error(
      `Invalid ADMIN_OWNER_* bootstrap configuration.${details}\nConfigure the bootstrap values in apps/api/.env and retry.`
    );
  }

  return result.data;
}

//===============================================================

async function ensureOwnerAccess(
  userId: mongoose.Types.ObjectId
): Promise<void> {
  const existingAccess = await AdminAccess.findOne({ userId })
    .select('status isPlatformOwner')
    .lean<{ status: string; isPlatformOwner: boolean } | null>();

  if (existingAccess) {
    if (
      existingAccess.status !== ADMIN_ACCESS_STATUSES.ACTIVE ||
      existingAccess.isPlatformOwner !== true
    ) {
      throw new Error(
        'Existing admin access is not an active Platform Owner. Refusing to auto-promote it.'
      );
    }

    await AdminAuthorizationState.updateOne(
      { key: 'platform-owner' },
      { $setOnInsert: { key: 'platform-owner', ownerRevision: 0 } },
      { upsert: true }
    );

    return;
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await AdminAccess.create(
        [
          {
            userId,
            status: ADMIN_ACCESS_STATUSES.ACTIVE,
            isPlatformOwner: true,
            permissions: [],
          },
        ],
        { session }
      );

      await AdminAuthorizationState.updateOne(
        { key: 'platform-owner' },
        { $setOnInsert: { key: 'platform-owner', ownerRevision: 0 } },
        { upsert: true, session }
      );
    });
  } finally {
    await session.endSession();
  }
}

//===============================================================

async function seedAdminOwner(): Promise<void> {
  const input = readBootstrapInput();

  await connectDB();

  const existingAdmin = await User.findOne({ role: USER_ROLES.ADMIN })
    .select('_id email')
    .lean<{ _id: mongoose.Types.ObjectId; email: string } | null>();

  if (existingAdmin) {
    if (existingAdmin.email !== input.email) {
      throw new Error(
        'An admin account already exists. Bootstrap can only manage the configured first admin.'
      );
    }

    await ensureOwnerAccess(existingAdmin._id);
    console.log('Admin owner bootstrap already completed. Access is valid.');
    return;
  }

  const existingEmailOwner = await User.findOne({ email: input.email })
    .select('role')
    .lean();

  if (existingEmailOwner) {
    throw new Error(
      'ADMIN_OWNER_EMAIL is already used by a non-admin account.'
    );
  }

  const existingPhoneOwner = await User.exists({ phone: input.phone });

  if (existingPhoneOwner) {
    throw new Error('ADMIN_OWNER_PHONE is already used by another account.');
  }

  const password = await hashPassword(input.password);
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [
          {
            name: input.name,
            email: input.email,
            password,
            phone: input.phone,
            address: input.address,
            role: USER_ROLES.ADMIN,
            status: USER_STATUSES.ACTIVE,
          },
        ],
        { session }
      );

      await AdminAccess.create(
        [
          {
            userId: user._id,
            status: ADMIN_ACCESS_STATUSES.ACTIVE,
            isPlatformOwner: true,
            permissions: [],
          },
        ],
        { session }
      );

      await AdminAuthorizationState.updateOne(
        { key: 'platform-owner' },
        { $setOnInsert: { key: 'platform-owner', ownerRevision: 0 } },
        { upsert: true, session }
      );
    });
  } finally {
    await session.endSession();
  }

  console.log('Admin owner bootstrap completed.');
}

//===============================================================

void seedAdminOwner()
  .catch((error: unknown) => {
    console.error('Admin owner bootstrap failed.');

    if (error instanceof Error) {
      console.error(error.message);
    }

    process.exitCode = 1;
  })

  .finally(async () => {
    await mongoose.disconnect();
  });
