import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { migratePharmacyOwnerRegistrationDocuments } from '../services/migrations/pharmacy-owner-documents-migration.service';

//===============================================================

dotenv.config();

//===============================================================

const apply = process.argv.includes('--apply');

//===============================================================

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri, { autoIndex: false });

  const result = await migratePharmacyOwnerRegistrationDocuments(apply);

  console.log(
    JSON.stringify({ mode: apply ? 'apply' : 'dry-run', ...result }, null, 2)
  );

  if (result.skipped.length > 0) {
    console.warn(
      'Skipped records require manual provenance/integrity review. No source files were deleted.'
    );
  }
}

//===============================================================

void main()
  .catch((cause: unknown) => {
    console.error('Owner registration document migration failed:', cause);
    process.exitCode = 1;
  })

  .finally(async () => {
    await mongoose.disconnect();
  });
