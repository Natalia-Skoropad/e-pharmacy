import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { migratePharmacyOwnerFoundation } from '../services/pharmacy-owner-foundation-migration.service';

//===============================================================

dotenv.config();

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

  const result = await migratePharmacyOwnerFoundation(db);

  console.log(
    `Pharmacy owner foundation migration completed: ${result.ownerAccounts} owner account(s), ${result.activeOwners} active, ${result.newOwners} new, ${result.blockedOwners} blocked.`
  );
  console.log(
    `Owner indexes: ${result.ownerIndexes.join(', ')}. Dropped ${result.droppedUniqueOwnerIndexes} unique owner index(es). Modified ${result.modifiedOwnerAccounts} owner account(s).`
  );

  if (result.unresolvedOwnerIds > 0) {
    const sample = result.unresolvedOwnerIdSamples.join(', ');
    const remaining =
      result.unresolvedOwnerIds - result.unresolvedOwnerIdSamples.length;
    const suffix = remaining > 0 ? `, ... +${remaining} more` : '';

    console.warn(
      `Warning: ${result.unresolvedOwnerIds} legacy Pharmacy.ownerId value(s) do not resolve to User records and were left unchanged. Sample: ${sample}${suffix}.`
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
