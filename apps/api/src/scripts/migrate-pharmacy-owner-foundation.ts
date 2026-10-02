import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { migratePharmacyOwnerFoundation } from '../services/pharmacy-owner-foundation-migration.service';
import { hashPassword } from '../utils/password';

//===============================================================

dotenv.config();

const LEGACY_DEMO_OWNER_PASSWORD = '123456789';

//===============================================================

function getMongoDbUri(): string {
  const value = process.env.MONGODB_URI?.trim();

  if (!value) {
    throw new Error('MONGODB_URI is required');
  }

  return value;
}

//===============================================================

async function migrate(): Promise<void> {
  await mongoose.connect(getMongoDbUri(), { autoIndex: false });

  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection is unavailable.');

  const demoOwnerPasswordHash = await hashPassword(LEGACY_DEMO_OWNER_PASSWORD);
  const result = await migratePharmacyOwnerFoundation(db, {
    demoOwnerPasswordHash,
  });

  console.log(
    `Pharmacy owner foundation migration completed: ${result.ownerAccounts} owner account(s), ${result.activeOwners} active, ${result.newOwners} new, ${result.blockedOwners} blocked.`
  );

  console.log(
    `Owner indexes: ${result.ownerIndexes.join(', ')}. Dropped ${result.droppedUniqueOwnerIndexes} unique owner index(es). Modified ${result.modifiedOwnerAccounts} owner account(s).`
  );

  if (result.createdDemoOwnerAccounts > 0) {
    console.log(
      `Created ${result.createdDemoOwnerAccounts} missing demo owner account(s) while preserving existing Pharmacy.ownerId values and pharmacy-linked data.`
    );
    console.log(
      `Demo owner login password: ${LEGACY_DEMO_OWNER_PASSWORD}. Each synthesized owner uses the linked demo pharmacy email as its login email.`
    );
  }

  if (result.unresolvedOwnerIds > 0) {
    const sample = result.unresolvedOwnerIdSamples.join(', ');
    const remaining =
      result.unresolvedOwnerIds - result.unresolvedOwnerIdSamples.length;
    const suffix = remaining > 0 ? `, ... +${remaining} more` : '';

    console.warn(
      `Warning: ${result.unresolvedOwnerIds} legacy Pharmacy.ownerId value(s) still do not resolve to User records and were left unchanged. Sample: ${sample}${suffix}.`
    );
  }
}

//===============================================================

void migrate()
  .catch((error: unknown) => {
    console.error('Pharmacy owner foundation migration failed.');

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  })

  .finally(async () => {
    await mongoose.disconnect();
  });
