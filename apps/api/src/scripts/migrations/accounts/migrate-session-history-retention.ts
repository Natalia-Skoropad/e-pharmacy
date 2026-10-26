import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { Session } from '../../../models/accounts/session.model';

//===============================================================

dotenv.config();

//===============================================================

// One-time, idempotent operation: keeps expired/revoked sessions for 90 more days.
// Previously purged documents cannot be recovered by changing the TTL index.
async function migrate(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri, { autoIndex: false });

  try {
    const collection = Session.collection;
    const indexes = await collection.indexes();

    const ttl = indexes.find(
      (index) =>
        index.key?.expiresAt === 1 && Object.keys(index.key).length === 1
    );

    const seconds = 90 * 24 * 60 * 60;

    if (ttl && ttl.expireAfterSeconds !== seconds) {
      await mongoose.connection.db!.command({
        collMod: collection.collectionName,
        index: { name: ttl.name, expireAfterSeconds: seconds },
      });
    } else if (!ttl) {
      await collection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: seconds }
      );
    }

    console.log(`Session history TTL: ${seconds} seconds after expiry`);
  } finally {
    await mongoose.disconnect();
  }
}

//===============================================================

void migrate().catch((error: unknown) => {
  console.error('Session retention migration failed:', error);
  process.exitCode = 1;
});
