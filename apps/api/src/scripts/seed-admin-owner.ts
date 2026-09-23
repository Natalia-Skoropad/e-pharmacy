import mongoose from 'mongoose';

import { USER_ROLES, USER_STATUSES } from '../constants/auth';
import { connectDB } from '../db/connectDB';
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
    throw new Error('Invalid ADMIN_OWNER_* bootstrap configuration.');
  }

  return result.data;
}

//===============================================================

async function seedAdminOwner(): Promise<void> {
  const input = readBootstrapInput();

  await connectDB();

  const existingAdmin = await User.findOne({ role: USER_ROLES.ADMIN })
    .select('email')
    .lean();

  if (existingAdmin) {
    if (existingAdmin.email === input.email) {
      console.log('Admin owner bootstrap already completed. No changes made.');
      return;
    }

    throw new Error(
      'An admin account already exists. Bootstrap can only create the first admin.'
    );
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

  await User.create({
    name: input.name,
    email: input.email,
    password,
    phone: input.phone,
    address: input.address,
    role: USER_ROLES.ADMIN,
    status: USER_STATUSES.ACTIVE,
  });

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
