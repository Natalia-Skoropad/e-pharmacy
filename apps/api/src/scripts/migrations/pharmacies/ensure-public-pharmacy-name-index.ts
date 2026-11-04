import 'dotenv/config';
import mongoose from 'mongoose';

import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';

//===================================================================

// Idempotent index-only migration. Does not update pharmacy documents.
// Run once in each environment after deploying the model definition.
const INDEX_NAME = 'public_pharmacy_name_order';

//===================================================================

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri, {
    autoIndex: false,
    autoCreate: false,
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    const index = await Pharmacy.collection.createIndex(
      { name: 1, _id: 1, status: 1 },
      { name: INDEX_NAME }
    );

    console.log(JSON.stringify({ index, status: 'ready' }));
  } finally {
    await mongoose.disconnect();
  }
}

//===================================================================

main().catch((error: unknown) => {
  const failure = error as {
    name?: string;
    code?: string | number;
    codeName?: string;
  };

  const message = error instanceof Error ? error.message : String(error);

  // Do not expose database credentials in logs when reporting connection errors.
  const safeMessage = message
    .replace(/mongodb(?:\+srv)?:\/\/\S+/gi, '[MongoDB URI redacted]')
    .replace(
      /(password|pwd|secret|token)\s*[:=]\s*[^\s,}]+/gi,
      '$1=[redacted]'
    );

  console.error(
    JSON.stringify({
      migration: 'failed',
      type: failure.name ?? 'Error',
      code: failure.code ?? null,
      codeName: failure.codeName ?? null,
      message: safeMessage,
    })
  );

  process.exitCode = 1;
});
