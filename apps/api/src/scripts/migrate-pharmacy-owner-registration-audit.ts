import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { migratePharmacyOwnerRegistrationAudit } from '../services/pharmacy-owner-registration-audit-migration.service';

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

  const result = await migratePharmacyOwnerRegistrationAudit();

  console.log(
    `Pharmacy owner registration audit migration completed: ${result.ownersScanned} owner account(s) scanned (${result.demoOwners} demo, ${result.legacyOwners} legacy).`
  );

  console.log(
    `Owner account-created events: ${result.accountEventsCreated} created, ${result.accountEventsSkipped} already present.`
  );

  console.log(
    `Registration-document events: ${result.documentEventsCreated} created, ${result.documentEventsSkipped} already present.`
  );
}

//===============================================================

void migrate()
  .catch((error: unknown) => {
    console.error('Pharmacy owner registration audit migration failed.');

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
