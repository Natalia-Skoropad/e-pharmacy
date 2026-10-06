import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { migratePharmacyLocations } from '../services/pharmacy-location-migration.service';

//===============================================================

dotenv.config();

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

  const result = await migratePharmacyLocations();

  console.log('Pharmacy location migration completed.');
  console.log(`Total pharmacies: ${result.totalPharmacies}`);
  console.log(`Migrated: ${result.migrated}`);
  console.log(`Missing address: ${result.missingAddress}`);
  console.log(`Missing settlement: ${result.missingSettlement}`);
  console.log(`Already migrated: ${result.alreadyMigrated}`);
  console.log(`Invalid: ${result.invalid}`);
}

//===============================================================

void migrate()
  .catch((error: unknown) => {
    console.error('Pharmacy location migration failed.');

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
